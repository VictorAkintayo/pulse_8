import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/cases
 * List all cases for tenant
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;

  const tenantCases = await db.query.cases.findMany({
    where: eq(cases.tenantId, context.tenantId),
    orderBy: [desc(cases.createdAt)],
  });

  return NextResponse.json({
    cases: tenantCases.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      data: c.data,
      slaStatus: c.slaStatus,
      slaDueAt: c.slaDueAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

/**
 * POST /api/crm/cases
 * Create a new case
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
  const { data, customerId, slaDueAt } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Case data is required" },
      { status: 400 }
    );
  }

  const [caseRecord] = await db
    .insert(cases)
    .values({
      tenantId: context.tenantId,
      customerId: customerId || null,
      data: data as any,
      slaStatus: "on_time",
      slaDueAt: slaDueAt ? new Date(slaDueAt) : null,
    })
    .returning();

  return NextResponse.json(
    {
      id: caseRecord.id,
      customerId: caseRecord.customerId,
      data: caseRecord.data,
      slaStatus: caseRecord.slaStatus,
      slaDueAt: caseRecord.slaDueAt,
      createdAt: caseRecord.createdAt,
      updatedAt: caseRecord.updatedAt,
    },
    { status: 201 }
  );
}

