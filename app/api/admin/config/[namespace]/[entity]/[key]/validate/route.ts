import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/middleware/tenant";
import { validateConfig, validateConfigReferences } from "@/lib/config/validation";
import { db } from "@/lib/db";
import { configItems, configVersions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Config } from "@/lib/config/schemas";

export const runtime = "nodejs";

/**
 * POST /api/admin/config/:namespace/:entity/:key/validate
 * Validate a config item (structure + references)
 */
export async function POST(
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

  // Validate structure
  const structureValidation = validateConfig({ ...config, namespace, entity, key });
  if (!structureValidation.valid) {
    return NextResponse.json(
      {
        valid: false,
        errors: [
          {
            type: "structure",
            message: structureValidation.error,
          },
        ],
      },
      { status: 400 }
    );
  }

  // Build map of existing published configs for reference validation
  const publishedConfigs = await db.query.configItems.findMany({
    where: and(
      eq(configItems.tenantId, context.tenantId),
      eq(configItems.status, "published")
    ),
  });

  const configMap = new Map<string, Config>();
  for (const item of publishedConfigs) {
    const latestVersion = await db.query.configVersions.findFirst({
      where: eq(configVersions.configItemId, item.id),
      orderBy: [desc(configVersions.version)],
    });
    if (latestVersion) {
      const configKey = `${item.namespace}:${item.entity}:${item.key}`;
      configMap.set(configKey, latestVersion.config as Config);
      // Also add by key only for backward compatibility
      configMap.set(item.key, latestVersion.config as Config);
    }
  }

  // Validate references
  const referenceValidation = await validateConfigReferences(structureValidation.config, configMap);
  if (!referenceValidation.valid) {
    return NextResponse.json(
      {
        valid: false,
        errors: [
          {
            type: "reference",
            message: referenceValidation.error,
          },
        ],
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    message: "Config is valid",
  });
}

