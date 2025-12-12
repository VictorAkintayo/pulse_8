import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * POST /api/crm/inbox/messages
 * Ingest a message (email, SMS, chat, etc.)
 * This endpoint can be called by webhooks or external services
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
  const {
    from,
    to,
    subject,
    body: messageBody,
    channel, // "email", "sms", "chat", "webhook"
    externalId,
    metadata,
    customerId,
  } = body;

  if (!from || !to || !subject) {
    return NextResponse.json(
      { error: "from, to, and subject are required" },
      { status: 400 }
    );
  }

  // Store message in audit log (in production, you'd have a dedicated messages table)
  const [message] = await db
    .insert(auditLog)
    .values({
      tenantId: context.tenantId,
      userId: context.userId,
      action: "message.received",
      entityType: "message",
      metadata: {
        from,
        to,
        subject,
        body: messageBody,
        channel: channel || "email",
        externalId,
        customerId,
        ...metadata,
      } as any,
    })
    .returning();

  // In production, you'd also:
  // 1. Create/update a case if customerId provided
  // 2. Trigger automations based on message content
  // 3. Send notifications to assigned agents
  // 4. Store in a dedicated messages table

  return NextResponse.json(
    {
      id: message.id,
      receivedAt: message.createdAt,
    },
    { status: 201 }
  );
}

/**
 * GET /api/crm/inbox/messages
 * List messages for tenant
 */
export async function GET(request: NextRequest) {
  const tenantResult = await getTenantContext(request);
  
  if ("error" in tenantResult) {
    return tenantResult.error;
  }

  const { context } = tenantResult;

  const messages = await db.query.auditLog.findMany({
    where: and(
      eq(auditLog.tenantId, context.tenantId),
      eq(auditLog.action, "message.received")
    ),
    orderBy: [desc(auditLog.createdAt)],
    limit: 100,
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      metadata: m.metadata,
      createdAt: m.createdAt,
    })),
  });
}

