import { db } from "@/lib/db";
import { configItems, configSnapshots, configVersions, configPublishLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Config } from "./schemas";

/**
 * Builds a complete config snapshot for a tenant from all published config items
 * Returns the snapshot as a nested JSON structure: { namespace: { entity: { key: config } } }
 */
export async function buildSnapshot(tenantId: string): Promise<{
  snapshot: Record<string, Record<string, Record<string, Config>>>;
  version: number;
}> {
  // Get latest snapshot version
  const latestSnapshot = await db.query.configSnapshots.findFirst({
    where: eq(configSnapshots.tenantId, tenantId),
    orderBy: [desc(configSnapshots.snapshotVersion)],
  });

  const nextVersion = (latestSnapshot?.snapshotVersion || 0) + 1;

  // Get all published config items for this tenant
  const publishedConfigs = await db.query.configItems.findMany({
    where: and(
      eq(configItems.tenantId, tenantId),
      eq(configItems.status, "published")
    ),
  });

  // Get latest version for each config item
  const configMap: Record<string, Record<string, Record<string, Config>>> = {};

  for (const item of publishedConfigs) {
    const latestVersion = await db.query.configVersions.findFirst({
      where: eq(configVersions.configItemId, item.id),
      orderBy: [desc(configVersions.version)],
    });

    if (latestVersion) {
      if (!configMap[item.namespace]) {
        configMap[item.namespace] = {};
      }
      if (!configMap[item.namespace][item.entity]) {
        configMap[item.namespace][item.entity] = {};
      }
      configMap[item.namespace][item.entity][item.key] = latestVersion.config as Config;
    }
  }

  return {
    snapshot: configMap,
    version: nextVersion,
  };
}

/**
 * Creates a new snapshot and stores it in the database
 */
export async function createSnapshot(
  tenantId: string,
  publishedConfigItemIds: string[],
  publishedBy: string
): Promise<number> {
  const { snapshot, version } = await buildSnapshot(tenantId);

  // Store snapshot atomically
  await db.insert(configSnapshots).values({
    tenantId,
    snapshotVersion: version,
    snapshot: snapshot as any,
  });

  // Log the publish event
  await db.insert(configPublishLog).values({
    tenantId,
    snapshotVersion: version,
    configItemIds: publishedConfigItemIds as any,
    publishedBy,
  });

  return version;
}

