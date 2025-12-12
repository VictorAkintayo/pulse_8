import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/deals/:id
 * Get a specific deal
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

  const deal = await db.query.deals.findFirst({
    where: and(
      eq(deals.id, id),
      eq(deals.tenantId, context.tenantId)
    ),
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: deal.id,
    customerId: deal.customerId,
    data: deal.data,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
  });
}

/**
 * PUT /api/crm/deals/:id
 * Update a deal
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
  const { data, customerId } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Deal data is required" },
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

  const [updated] = await db
    .update(deals)
    .set(updateData)
    .where(and(
      eq(deals.id, id),
      eq(deals.tenantId, context.tenantId)
    ))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    customerId: updated.customerId,
    data: updated.data,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

/**
 * DELETE /api/crm/deals/:id
 * Delete a deal
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
    .delete(deals)
    .where(and(
      eq(deals.id, id),
      eq(deals.tenantId, context.tenantId)
    ))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

