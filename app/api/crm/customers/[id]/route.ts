import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/customers/:id
 * Get a specific customer
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

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.tenantId, context.tenantId)
    ),
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: customer.id,
    data: customer.data,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  });
}

/**
 * PUT /api/crm/customers/:id
 * Update a customer
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
  const { data } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Customer data is required" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(customers)
    .set({
      data: data as any,
      updatedAt: new Date(),
    })
    .where(and(
      eq(customers.id, id),
      eq(customers.tenantId, context.tenantId)
    ))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    data: updated.data,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

/**
 * DELETE /api/crm/customers/:id
 * Delete a customer
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
    .delete(customers)
    .where(and(
      eq(customers.id, id),
      eq(customers.tenantId, context.tenantId)
    ))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

