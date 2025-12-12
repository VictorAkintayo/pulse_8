import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/admin/config/drafts
 * List all draft config items for tenant
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "admin");
  if (permissionError) return permissionError;

  const drafts = await db.query.configItems.findMany({
    where: eq(configItems.tenantId, context.tenantId),
    orderBy: [desc(configItems.updatedAt)],
  });

  return NextResponse.json({
    drafts: drafts.map((draft) => ({
      id: draft.id,
      namespace: draft.namespace,
      entity: draft.entity,
      key: draft.key,
      status: draft.status,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      createdBy: draft.createdBy,
    })),
  });
}

