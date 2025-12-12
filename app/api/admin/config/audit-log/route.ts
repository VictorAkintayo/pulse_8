import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configPublishLog } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/admin/config/audit-log
 * Get config publish audit log
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "admin");
  if (permissionError) return permissionError;

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const logs = await db.query.configPublishLog.findMany({
    where: eq(configPublishLog.tenantId, context.tenantId),
    orderBy: [desc(configPublishLog.publishedAt)],
    limit,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      snapshotVersion: log.snapshotVersion,
      configItemIds: log.configItemIds,
      publishedBy: log.publishedBy,
      publishedAt: log.publishedAt,
    })),
  });
}

