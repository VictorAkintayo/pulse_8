import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/cases/:id
 * Get a specific case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const { id } = await params;

  const caseRecord = await db.query.cases.findFirst({
    where: and(
      eq(cases.id, id),
      eq(cases.tenantId, context.tenantId)
    ),
  });

  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: caseRecord.id,
    customerId: caseRecord.customerId,
    data: caseRecord.data,
    slaStatus: caseRecord.slaStatus,
    slaDueAt: caseRecord.slaDueAt,
    createdAt: caseRecord.createdAt,
    updatedAt: caseRecord.updatedAt,
  });
}

/**
 * PUT /api/crm/cases/:id
 * Update a case
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "agent");
  if (permissionError) return permissionError;

  const { id } = await params;
  const body = await request.json();
  const { data, customerId, slaStatus, slaDueAt } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Case data is required" },
      { status: 400 }
    );
  }

  const updateData: any = {
    data: data as any,
    updatedAt: new Date(),
  };
  if (customerId !== undefined) {
    updateData.customerId = customerId || null;
  }
  if (slaStatus !== undefined) {
    updateData.slaStatus = slaStatus;
  }
  if (slaDueAt !== undefined) {
    updateData.slaDueAt = slaDueAt ? new Date(slaDueAt) : null;
  }

  const [updated] = await db
    .update(cases)
    .set(updateData)
    .where(and(
      eq(cases.id, id),
      eq(cases.tenantId, context.tenantId)
    ))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    customerId: updated.customerId,
    data: updated.data,
    slaStatus: updated.slaStatus,
    slaDueAt: updated.slaDueAt,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

/**
 * DELETE /api/crm/cases/:id
 * Delete a case
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "manager");
  if (permissionError) return permissionError;

  const { id } = await params;

  const [deleted] = await db
    .delete(cases)
    .where(and(
      eq(cases.id, id),
      eq(cases.tenantId, context.tenantId)
    ))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

