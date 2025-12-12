import { pgTable, text, timestamp, uuid, jsonb, integer, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["admin", "manager", "agent", "readonly"]);
export const configNamespaceEnum = pgEnum("config_namespace", [
  "form",
  "view",
  "trigger",
  "condition",
  "action",
  "approval",
  "sla",
  "automation"
]);
export const configStatusEnum = pgEnum("config_status", ["draft", "published", "archived"]);

// Tenants table
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (global, not tenant-scoped)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Memberships (user-tenant-role relationship)
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userTenantIdx: index("user_tenant_idx").on(table.userId, table.tenantId),
}));

// Config items (draft configurations)
export const configItems = pgTable("config_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  namespace: configNamespaceEnum("namespace").notNull(),
  entity: text("entity").notNull(), // e.g., "customer", "deal", "case"
  key: text("key").notNull(), // e.g., "customer-form", "deal-pipeline-view"
  config: jsonb("config").notNull(), // The actual configuration payload
  status: configStatusEnum("status").default("draft").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantNamespaceEntityKeyIdx: index("tenant_namespace_entity_key_idx")
    .on(table.tenantId, table.namespace, table.entity, table.key),
}));

// Config versions (immutable published versions)
export const configVersions = pgTable("config_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  configItemId: uuid("config_item_id").notNull().references(() => configItems.id, { onDelete: "cascade" }),
  version: integer("version").notNull(), // Sequential version number
  config: jsonb("config").notNull(), // Immutable snapshot of config at publish time
  publishedBy: uuid("published_by").references(() => users.id),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
}, (table) => ({
  configItemVersionIdx: index("config_item_version_idx").on(table.configItemId, table.version),
}));

// Config snapshots (latest published state per tenant)
export const configSnapshots = pgTable("config_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  snapshotVersion: integer("snapshot_version").notNull(), // Increments on each publish
  snapshot: jsonb("snapshot").notNull(), // Complete tenant config state as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantSnapshotVersionIdx: index("tenant_snapshot_version_idx")
    .on(table.tenantId, table.snapshotVersion),
}));

// Config publish log (audit trail)
export const configPublishLog = pgTable("config_publish_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  snapshotVersion: integer("snapshot_version").notNull(),
  configItemIds: jsonb("config_item_ids").notNull(), // Array of UUIDs published in this batch
  publishedBy: uuid("published_by").references(() => users.id),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

// Audit log (general audit trail)
export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // e.g., "config.published", "user.created"
  entityType: text("entity_type"), // e.g., "config_item", "user"
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tenantCreatedIdx: index("tenant_created_idx").on(table.tenantId, table.createdAt),
}));

// CRM Entity Tables (tenant-scoped)
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(), // Flexible JSONB for customer data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("customers_tenant_idx").on(table.tenantId),
}));

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("deals_tenant_idx").on(table.tenantId),
}));

export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  data: jsonb("data").notNull(),
  slaStatus: text("sla_status"), // e.g., "on_time", "at_risk", "breached"
  slaDueAt: timestamp("sla_due_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("cases_tenant_idx").on(table.tenantId),
}));

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  memberships: many(memberships),
  configItems: many(configItems),
  configSnapshots: many(configSnapshots),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [memberships.tenantId],
    references: [tenants.id],
  }),
}));

export const configItemsRelations = relations(configItems, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [configItems.tenantId],
    references: [tenants.id],
  }),
  versions: many(configVersions),
}));

export const configVersionsRelations = relations(configVersions, ({ one }) => ({
  configItem: one(configItems, {
    fields: [configVersions.configItemId],
    references: [configItems.id],
  }),
}));

