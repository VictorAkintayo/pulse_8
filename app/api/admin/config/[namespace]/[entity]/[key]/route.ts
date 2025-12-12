import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/admin/config/:namespace/:entity/:key
 * Get draft config item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; entity: string; key: string }> }
) {
  const { namespace, entity, key } = await params;
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "admin");
  if (permissionError) return permissionError;

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

  return NextResponse.json({
    id: configItem.id,
    namespace: configItem.namespace,
    entity: configItem.entity,
    key: configItem.key,
    config: configItem.config,
    status: configItem.status,
    createdAt: configItem.createdAt,
    updatedAt: configItem.updatedAt,
  });
}

