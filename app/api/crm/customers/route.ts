import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/crm/customers
 * List all customers for tenant
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;

  const tenantCustomers = await db.query.customers.findMany({
    where: eq(customers.tenantId, context.tenantId),
    orderBy: [desc(customers.createdAt)],
  });

  return NextResponse.json({
    customers: tenantCustomers.map((c) => ({
      id: c.id,
      data: c.data,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

/**
 * POST /api/crm/customers
 * Create a new customer
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
  const { data } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Customer data is required" },
      { status: 400 }
    );
  }

  const [customer] = await db
    .insert(customers)
    .values({
      tenantId: context.tenantId,
      data: data as any,
    })
    .returning();

  return NextResponse.json(
    {
      id: customer.id,
      data: customer.data,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
    { status: 201 }
  );
}

