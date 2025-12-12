import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configSnapshots } from "@/lib/db/schema";
import { eq, desc, gt } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/runtime/config?sinceVersion=number
 * Get latest config snapshot for tenant
 * If sinceVersion is provided, only return if newer version exists
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;

  const searchParams = request.nextUrl.searchParams;
  const sinceVersionParam = searchParams.get("sinceVersion");
  const sinceVersion = sinceVersionParam ? parseInt(sinceVersionParam, 10) : null;

  // Get latest snapshot
  const latestSnapshot = await db.query.configSnapshots.findFirst({
    where: eq(configSnapshots.tenantId, context.tenantId),
    orderBy: [desc(configSnapshots.snapshotVersion)],
  });

  if (!latestSnapshot) {
    return NextResponse.json({
      snapshotVersion: 0,
      snapshot: {},
      hasUpdate: false,
    });
  }

  // If client has latest version, return 304 Not Modified equivalent
  if (sinceVersion !== null && sinceVersion >= latestSnapshot.snapshotVersion) {
    return NextResponse.json({
      snapshotVersion: latestSnapshot.snapshotVersion,
      snapshot: {},
      hasUpdate: false,
    });
  }

  return NextResponse.json({
    snapshotVersion: latestSnapshot.snapshotVersion,
    snapshot: latestSnapshot.snapshot,
    hasUpdate: true,
  });
}

