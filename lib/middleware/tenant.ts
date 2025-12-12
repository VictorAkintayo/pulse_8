import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface TenantContext extends JWTPayload {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Extracts tenant context from request headers (Authorization + X-Tenant-Slug)
 * Used by API routes to enforce tenant isolation
 */
export async function getTenantContext(
  request: NextRequest
): Promise<{ context: TenantContext; error?: never } | { context?: never; error: NextResponse }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }

  // Verify tenant exists
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, payload.tenantId),
  });

  if (!tenant) {
    return {
      error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }),
    };
  }

  return {
    context: {
      ...payload,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    },
  };
}

/**
 * RBAC check - verifies user has required role or higher
 * Role hierarchy: admin > manager > agent > readonly
 */
export function hasPermission(
  userRole: "admin" | "manager" | "agent" | "readonly",
  requiredRole: "admin" | "manager" | "agent" | "readonly"
): boolean {
  const roleHierarchy = { admin: 4, manager: 3, agent: 2, readonly: 1 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Middleware helper to check permissions
 */
export function requireRole(
  context: TenantContext,
  requiredRole: "admin" | "manager" | "agent" | "readonly"
): NextResponse | null {
  if (!hasPermission(context.role, requiredRole)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  return null;
}

