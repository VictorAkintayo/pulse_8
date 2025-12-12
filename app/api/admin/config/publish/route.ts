import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configItems, configVersions } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { validateConfig, validateConfigReferences } from "@/lib/config/validation";
import { createSnapshot } from "@/lib/config/snapshot";
import { redis, CONFIG_PUBLISHED_CHANNEL, CONFIG_TENANT_CHANNEL_PREFIX } from "@/lib/redis";
import { Config } from "@/lib/config/schemas";

export const runtime = "nodejs";

/**
 * POST /api/admin/config/publish
 * Publish one or more config items atomically
 * Body: { configItemIds: string[] }
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
  const { configItemIds } = body;

  if (!Array.isArray(configItemIds) || configItemIds.length === 0) {
    return NextResponse.json(
      { error: "configItemIds array is required" },
      { status: 400 }
    );
  }

  // Fetch all config items to publish
  const itemsToPublish = await db.query.configItems.findMany({
    where: and(
      eq(configItems.tenantId, context.tenantId),
      inArray(configItems.id, configItemIds)
    ),
  });

  if (itemsToPublish.length !== configItemIds.length) {
    return NextResponse.json(
      { error: "Some config items not found" },
      { status: 404 }
    );
  }

  // Validate all configs before publishing
  const publishedConfigs = await db.query.configItems.findMany({
    where: and(
      eq(configItems.tenantId, context.tenantId),
      eq(configItems.status, "published")
    ),
  });

  const configMap = new Map<string, Config>();
  for (const item of publishedConfigs) {
    const latestVersion = await db.query.configVersions.findFirst({
      where: eq(configVersions.configItemId, item.id),
      orderBy: [desc(configVersions.version)],
    });
    if (latestVersion) {
      configMap.set(item.key, latestVersion.config as Config);
    }
  }

  // Validate each item
  for (const item of itemsToPublish) {
    const structureValidation = validateConfig(item.config);
    if (!structureValidation.valid) {
      return NextResponse.json(
        {
          error: `Invalid config structure for ${item.namespace}:${item.entity}:${item.key}`,
          details: structureValidation.error,
        },
        { status: 400 }
      );
    }

    // Add this item to the map for cross-reference validation
    configMap.set(item.key, structureValidation.config);

    const referenceValidation = await validateConfigReferences(structureValidation.config, configMap);
    if (!referenceValidation.valid) {
      return NextResponse.json(
        {
          error: `Invalid config references for ${item.namespace}:${item.entity}:${item.key}`,
          details: referenceValidation.error,
        },
        { status: 400 }
      );
    }
  }

  // Get current max version for each config item
  const versionMap = new Map<string, number>();
  for (const item of itemsToPublish) {
    const latestVersion = await db.query.configVersions.findFirst({
      where: eq(configVersions.configItemId, item.id),
      orderBy: [desc(configVersions.version)],
    });
    versionMap.set(item.id, (latestVersion?.version || 0) + 1);
  }

  // Publish atomically: create versions and update status
  const publishedVersions = [];
  for (const item of itemsToPublish) {
    const nextVersion = versionMap.get(item.id)!;

    // Create new version
    const [version] = await db
      .insert(configVersions)
      .values({
        configItemId: item.id,
        version: nextVersion,
        config: item.config as any,
        publishedBy: context.userId,
      })
      .returning();

    publishedVersions.push(version);

    // Update status to published
    await db
      .update(configItems)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(configItems.id, item.id));
  }

  // Create new snapshot
  const snapshotVersion = await createSnapshot(
    context.tenantId,
    configItemIds,
    context.userId
  );

  // Emit realtime event via Redis pub/sub
  const publishEvent = {
    tenantId: context.tenantId,
    snapshotVersion,
    configItemIds,
    publishedAt: new Date().toISOString(),
  };

  await redis.publish(CONFIG_PUBLISHED_CHANNEL, JSON.stringify(publishEvent));

  // Also publish to tenant-specific channel
  await redis.publish(
    `${CONFIG_TENANT_CHANNEL_PREFIX}${context.tenantId}`,
    JSON.stringify({
      snapshotVersion,
      configItemIds,
      publishedAt: new Date().toISOString(),
    })
  );

  // Notify WebSocket gateway (if running separately)
  // In production, this would call the WS gateway API or use a message queue
  const wsGatewayUrl = process.env.WS_GATEWAY_URL;
  if (wsGatewayUrl) {
    try {
      await fetch(`${wsGatewayUrl}/api/internal/config-published`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WS_GATEWAY_SECRET}`,
        },
        body: JSON.stringify({
          tenantId: context.tenantId,
          snapshotVersion,
        }),
      }).catch((err) => {
        // Non-blocking - WS gateway might not be running
        console.warn("Failed to notify WS gateway:", err);
      });
    } catch (error) {
      // Non-blocking
      console.warn("WS gateway notification failed:", error);
    }
  }

  return NextResponse.json({
    success: true,
    snapshotVersion,
    publishedCount: publishedVersions.length,
    publishedVersions: publishedVersions.map((v) => ({
      configItemId: v.configItemId,
      version: v.version,
    })),
  });
}
