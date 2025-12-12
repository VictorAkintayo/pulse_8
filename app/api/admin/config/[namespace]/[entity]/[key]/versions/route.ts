import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configItems, configVersions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/admin/config/:namespace/:entity/:key/versions
 * Get version history for a config item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; entity: string; key: string }> }
) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "admin");
  if (permissionError) return permissionError;

  const { namespace, entity, key } = await params;

  const configItem = await db.query.configItems.findFirst({
    where: and(
      eq(configItems.tenantId, context.tenantId),
      eq(configItems.namespace, namespace as any),
      eq(configItems.entity, entity),
      eq(configItems.key, key)
    ),
  });

  if (!configItem) {
    return NextResponse.json({ error: "Config item not found" }, { status: 404 });
  }

  const versions = await db.query.configVersions.findMany({
    where: eq(configVersions.configItemId, configItem.id),
    orderBy: [desc(configVersions.version)],
  });

  return NextResponse.json({
    configItem: {
      id: configItem.id,
      namespace: configItem.namespace,
      entity: configItem.entity,
      key: configItem.key,
      status: configItem.status,
    },
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      config: v.config,
      publishedBy: v.publishedBy,
      publishedAt: v.publishedAt,
    })),
  });
}

