import { z } from "zod";

// Base config namespace types
export const configNamespaceSchema = z.enum([
  "form",
  "view",
  "trigger",
  "condition",
  "action",
  "approval",
  "sla",
  "automation",
]);

// Form field types
export const formFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "datetime",
  "select",
  "multiselect",
  "checkbox",
  "radio",
  "file",
  "rich_text",
]);

// Form field schema
export const formFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: formFieldTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // For select, multiselect, radio
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    custom: z.string().optional(), // Custom validation function name
  }).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  helpText: z.string().optional(),
  order: z.number().default(0),
});

// Form config schema
export const formConfigSchema = z.object({
  namespace: z.literal("form"),
  entity: z.string(), // e.g., "customer", "deal"
  key: z.string(), // e.g., "customer-form", "deal-form"
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
  submitAction: z.object({
    type: z.enum(["create", "update", "custom"]),
    endpoint: z.string().optional(),
    successMessage: z.string().optional(),
    redirectTo: z.string().optional(),
  }).optional(),
});

// View column schema
export const viewColumnSchema = z.object({
  id: z.string(),
  field: z.string(), // Field path in data
  label: z.string(),
  type: z.enum(["text", "number", "date", "datetime", "boolean", "badge", "link", "custom"]),
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(false),
  width: z.string().optional(), // CSS width
  render: z.string().optional(), // Custom render function name
  order: z.number().default(0),
});

// View config schema
export const viewConfigSchema = z.object({
  namespace: z.literal("view"),
  entity: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(["table", "kanban", "calendar", "gantt"]).default("table"),
  columns: z.array(viewColumnSchema),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains", "in", "notIn"]),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
  })).optional(),
  defaultSort: z.object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  }).optional(),
  pagination: z.object({
    pageSize: z.number().default(25),
  }).optional(),
});

// Trigger schema
export const triggerConfigSchema = z.object({
  namespace: z.literal("trigger"),
  entity: z.string(),
  key: z.string(),
  type: z.enum(["create", "update", "delete", "field_change", "webhook", "schedule", "manual"]),
  conditions: z.array(z.any()).optional(), // Condition configs referenced by ID
  webhookUrl: z.string().optional(),
  schedule: z.string().optional(), // Cron expression
  field: z.string().optional(), // For field_change triggers
});

// Condition schema
export const conditionConfigSchema = z.object({
  namespace: z.literal("condition"),
  entity: z.string(),
  key: z.string(),
  type: z.enum(["field", "formula", "custom"]),
  field: z.string().optional(),
  operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains", "in", "notIn", "exists", "notExists"]).optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
  formula: z.string().optional(), // JavaScript expression
  customFunction: z.string().optional(), // Custom function name
});

// Action schema
export const actionConfigSchema = z.object({
  namespace: z.literal("action"),
  entity: z.string(),
  key: z.string(),
  type: z.enum([
    "create_record",
    "update_record",
    "delete_record",
    "send_email",
    "send_notification",
    "assign",
    "update_field",
    "webhook",
    "custom",
  ]),
  targetEntity: z.string().optional(),
  targetField: z.string().optional(),
  value: z.any().optional(),
  emailTemplate: z.string().optional(),
  webhookUrl: z.string().optional(),
  webhookPayload: z.record(z.any()).optional(),
  customFunction: z.string().optional(),
});

// Approval schema
export const approvalConfigSchema = z.object({
  namespace: z.literal("approval"),
  entity: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(true),
  approvers: z.array(z.object({
    type: z.enum(["user", "role", "field"]),
    userId: z.string().optional(),
    role: z.string().optional(),
    field: z.string().optional(), // Field containing user ID
  })),
  approvalType: z.enum(["any", "all", "sequential"]).default("all"),
  conditions: z.array(z.string()).optional(), // Condition config keys
});

// SLA schema
export const slaConfigSchema = z.object({
  namespace: z.literal("sla"),
  entity: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTrigger: z.string(), // Trigger key that starts the SLA
  endTrigger: z.string().optional(), // Trigger key that ends the SLA
  duration: z.object({
    value: z.number(),
    unit: z.enum(["minutes", "hours", "days", "business_days"]),
  }),
  warningThreshold: z.object({
    value: z.number(),
    unit: z.enum(["minutes", "hours", "days", "business_days"]),
  }).optional(),
  conditions: z.array(z.string()).optional(), // Condition config keys
  actions: z.array(z.string()).optional(), // Action config keys to execute on breach
});

// Automation schema (composes triggers, conditions, actions)
export const automationConfigSchema = z.object({
  namespace: z.literal("automation"),
  entity: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  trigger: z.string(), // Trigger config key
  conditions: z.array(z.string()).optional(), // Condition config keys (AND logic)
  actions: z.array(z.string()), // Action config keys (executed sequentially)
  approvals: z.array(z.string()).optional(), // Approval config keys (must pass before actions)
  errorHandling: z.object({
    retry: z.boolean().default(false),
    retryCount: z.number().default(0),
    onError: z.string().optional(), // Action config key to execute on error
  }).optional(),
});

// Union of all config schemas
export const configSchema = z.discriminatedUnion("namespace", [
  formConfigSchema,
  viewConfigSchema,
  triggerConfigSchema,
  conditionConfigSchema,
  actionConfigSchema,
  approvalConfigSchema,
  slaConfigSchema,
  automationConfigSchema,
]);

// Type exports
export type FormConfig = z.infer<typeof formConfigSchema>;
export type ViewConfig = z.infer<typeof viewConfigSchema>;
export type TriggerConfig = z.infer<typeof triggerConfigSchema>;
export type ConditionConfig = z.infer<typeof conditionConfigSchema>;
export type ActionConfig = z.infer<typeof actionConfigSchema>;
export type ApprovalConfig = z.infer<typeof approvalConfigSchema>;
export type SlaConfig = z.infer<typeof slaConfigSchema>;
export type AutomationConfig = z.infer<typeof automationConfigSchema>;
export type Config = z.infer<typeof configSchema>;

