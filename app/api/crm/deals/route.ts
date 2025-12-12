import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/deals
 * List all deals for tenant
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;

  const tenantDeals = await db.query.deals.findMany({
    where: eq(deals.tenantId, context.tenantId),
    orderBy: [desc(deals.createdAt)],
  });

  return NextResponse.json({
    deals: tenantDeals.map((d) => ({
      id: d.id,
      customerId: d.customerId,
      data: d.data,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  });
}

/**
 * POST /api/crm/deals
 * Create a new deal
 */
export async function POST(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "agent");
  if (permissionError) return permissionError;

  const body = await request.json();
  const { data, customerId } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Deal data is required" },
      { status: 400 }
    );
  }

  const [deal] = await db
    .insert(deals)
    .values({
      tenantId: context.tenantId,
      customerId: customerId || null,
      data: data as any,
    })
    .returning();

  return NextResponse.json(
    {
      id: deal.id,
      customerId: deal.customerId,
      data: deal.data,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    },
    { status: 201 }
  );
}

