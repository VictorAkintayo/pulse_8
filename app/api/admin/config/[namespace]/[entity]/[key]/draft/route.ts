import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { configItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateConfig } from "@/lib/config/validation";

export const runtime = "nodejs";

/**
 * PUT /api/admin/config/:namespace/:entity/:key/draft
 * Create or update draft config item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; entity: string; key: string }> }
) {
  const { namespace, entity, key } = await params;
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;
  const permissionError = requireRole(context, "admin");
  if (permissionError) return permissionError;

  const body = await request.json();
  const { config } = body;

  if (!config) {
    return NextResponse.json({ error: "Config payload is required" }, { status: 400 });
  }

  // Validate config structure
  const validation = validateConfig({ ...config, namespace, entity, key });
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid config", details: validation.error },
      { status: 400 }
    );
  }

  // Check if config item exists
  const existing = await db.query.configItems.findFirst({
    where: and(
      eq(configItems.tenantId, context.tenantId),
      eq(configItems.namespace, namespace as any),
      eq(configItems.entity, entity),
      eq(configItems.key, key)
    ),
  });

  if (existing) {
    // Update existing draft
    if (existing.status === "published") {
      return NextResponse.json(
        { error: "Cannot modify published config. Create a new draft." },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(configItems)
      .set({
        config: validation.config as any,
        updatedAt: new Date(),
      })
      .where(eq(configItems.id, existing.id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      namespace: updated.namespace,
      entity: updated.entity,
      key: updated.key,
      config: updated.config,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } else {
    // Create new draft
    const [created] = await db
      .insert(configItems)
      .values({
        tenantId: context.tenantId,
        namespace: namespace as any,
        entity,
        key,
        config: validation.config as any,
        status: "draft",
        createdBy: context.userId,
      })
      .returning();

    return NextResponse.json({
      id: created.id,
      namespace: created.namespace,
      entity: created.entity,
      key: created.key,
      config: created.config,
      status: created.status,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }, { status: 201 });
  }
}

