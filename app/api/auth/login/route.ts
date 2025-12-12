import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

/**
 * POST /api/auth/login
 * Body: { email: string, password: string, tenantSlug?: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, tenantSlug } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Get user's memberships
  const userMemberships = await db.query.memberships.findMany({
    where: eq(memberships.userId, user.id),
    with: {
      tenant: true,
    },
  });

  if (userMemberships.length === 0) {
    return NextResponse.json(
      { error: "User has no tenant access" },
      { status: 403 }
    );
  }

  // If tenantSlug provided, use that tenant; otherwise use first membership
  let selectedMembership = userMemberships[0];
  if (tenantSlug) {
    const found = userMemberships.find((m: typeof userMemberships[0]) => m.tenant.slug === tenantSlug);
    if (!found) {
      return NextResponse.json(
        { error: "User does not have access to this tenant" },
        { status: 403 }
      );
    }
    selectedMembership = found;
  }

  // Generate JWT token
  const token = signToken({
    userId: user.id,
    tenantId: selectedMembership.tenantId,
    role: selectedMembership.role,
    email: user.email,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    tenant: {
      id: selectedMembership.tenant.id,
      name: selectedMembership.tenant.name,
      slug: selectedMembership.tenant.slug,
    },
    role: selectedMembership.role,
    memberships: userMemberships.map((m: typeof userMemberships[0]) => ({
      tenantId: m.tenant.id,
      tenantName: m.tenant.name,
      tenantSlug: m.tenant.slug,
      role: m.role,
    })),
  });
}

