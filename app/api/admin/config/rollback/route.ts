import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configItems, configVersions, configSnapshots } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createSnapshot } from "@/lib/config/snapshot";
import { redis, CONFIG_PUBLISHED_CHANNEL, CONFIG_TENANT_CHANNEL_PREFIX } from "@/lib/redis";

export const runtime = "nodejs";

/**
 * POST /api/admin/config/rollback
 * Rollback a config item to a previous version
 * Body: { configItemId: string, version: number }
 */
export async function POST(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "admin");
  if (permissionError) return permissionError;

  const body = await request.json();
  const { configItemId, version } = body;

  if (!configItemId || !version) {
    return NextResponse.json(
      { error: "configItemId and version are required" },
      { status: 400 }
    );
  }

  // Verify config item belongs to tenant
  const configItem = await db.query.configItems.findFirst({
    where: and(
      eq(configItems.id, configItemId),
      eq(configItems.tenantId, context.tenantId)
    ),
  });

  if (!configItem) {
    return NextResponse.json({ error: "Config item not found" }, { status: 404 });
  }

  // Get the version to rollback to
  const targetVersion = await db.query.configVersions.findFirst({
    where: and(
      eq(configVersions.configItemId, configItemId),
      eq(configVersions.version, version)
    ),
  });

  if (!targetVersion) {
    return NextResponse.json(
      { error: `Version ${version} not found` },
      { status: 404 }
    );
  }

  // Get current max version
  const latestVersion = await db.query.configVersions.findFirst({
    where: eq(configVersions.configItemId, configItemId),
    orderBy: [desc(configVersions.version)],
  });

  if (!latestVersion || latestVersion.version === version) {
    return NextResponse.json(
      { error: "Already at this version" },
      { status: 400 }
    );
  }

  // Create a new version with the rollback config
  const rollbackVersion = (latestVersion.version || 0) + 1;
  const [newVersion] = await db
    .insert(configVersions)
    .values({
      configItemId,
      version: rollbackVersion,
      config: targetVersion.config,
      publishedBy: context.userId,
    })
    .returning();

  // Update config item status if needed
  await db
    .update(configItems)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(configItems.id, configItemId));

  // Create new snapshot
  const snapshotVersion = await createSnapshot(
    context.tenantId,
    [configItemId],
    context.userId
  );

  // Emit realtime event
  await redis.publish(CONFIG_PUBLISHED_CHANNEL, JSON.stringify({
    tenantId: context.tenantId,
    snapshotVersion,
    configItemIds: [configItemId],
    publishedAt: new Date().toISOString(),
    rollback: true,
    rollbackFromVersion: latestVersion.version,
    rollbackToVersion: version,
  }));

  await redis.publish(
    `${CONFIG_TENANT_CHANNEL_PREFIX}${context.tenantId}`,
    JSON.stringify({
      snapshotVersion,
      configItemIds: [configItemId],
      publishedAt: new Date().toISOString(),
    })
  );

  return NextResponse.json({
    success: true,
    snapshotVersion,
    rollbackVersion: newVersion.version,
    message: `Rolled back to version ${version}`,
  });
}

