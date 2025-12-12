import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

/**
 * POST /api/auth/register
 * Body: { email: string, password: string, firstName?: string, lastName?: string, tenantName?: string }
 * Creates user and optionally creates a new tenant
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, firstName, lastName, tenantName } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 }
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
    })
    .returning();

  let tenant;
  let membership;

  if (tenantName) {
    // Create new tenant
    const tenantSlug = tenantName.toLowerCase().replace(/\s+/g, "-");
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: tenantName,
        slug: tenantSlug,
      })
      .returning();

    tenant = newTenant;

    // Create admin membership
    const [newMembership] = await db
      .insert(memberships)
      .values({
        userId: user.id,
        tenantId: tenant.id,
        role: "admin",
      })
      .returning();

    membership = newMembership;
  } else {
    // Use default tenant or return error
    return NextResponse.json(
      { error: "tenantName is required for registration" },
      { status: 400 }
    );
  }

  // Generate JWT token
  const token = signToken({
    userId: user.id,
    tenantId: tenant.id,
    role: membership.role,
    email: user.email,
  });

  return NextResponse.json(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      role: membership.role,
    },
    { status: 201 }
  );
}

