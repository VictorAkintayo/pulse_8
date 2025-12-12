import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { customers, deals, cases } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/dashboard/metrics
 * Get dashboard metrics for tenant
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "30", 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Count customers
  const customerCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(eq(customers.tenantId, context.tenantId));

  // Count deals
  const dealCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(eq(deals.tenantId, context.tenantId));

  // Count cases
  const caseCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(cases)
    .where(eq(cases.tenantId, context.tenantId));

  // Count open cases
  const openCaseCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(cases)
    .where(
      and(
        eq(cases.tenantId, context.tenantId),
        sql`${cases.data}->>'status' != 'closed'`
      )
    );

  // Count cases at risk or breached
  const slaRiskCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(cases)
    .where(
      and(
        eq(cases.tenantId, context.tenantId),
        sql`${cases.slaStatus} IN ('at_risk', 'breached')`
      )
    );

  // Recent deals (last N days)
  const recentDeals = await db
    .select({ count: sql<number>`count(*)` })
    .from(deals)
    .where(
      and(
        eq(deals.tenantId, context.tenantId),
        gte(deals.createdAt, startDate)
      )
    );

  // Deal value sum (if deals have value field)
  const dealValueResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${deals.data}->>'value' AS NUMERIC)), 0)`,
    })
    .from(deals)
    .where(eq(deals.tenantId, context.tenantId));

  return NextResponse.json({
    metrics: {
      customers: {
        total: Number(customerCount[0]?.count || 0),
      },
      deals: {
        total: Number(dealCount[0]?.count || 0),
        recent: Number(recentDeals[0]?.count || 0),
        totalValue: Number(dealValueResult[0]?.total || 0),
      },
      cases: {
        total: Number(caseCount[0]?.count || 0),
        open: Number(openCaseCount[0]?.count || 0),
        slaAtRisk: Number(slaRiskCount[0]?.count || 0),
      },
    },
    period: {
      days,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    },
  });
}

