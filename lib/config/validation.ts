import { configSchema, Config } from "./schemas";
import { z } from "zod";

/**
 * Validates a config payload against the appropriate schema
 */
export function validateConfig(config: unknown): { valid: true; config: Config } | { valid: false; error: string } {
  try {
    const validated = configSchema.parse(config);
    return { valid: true, config: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      };
    }
    return { valid: false, error: "Invalid configuration" };
  }
}

/**
 * Validates that referenced configs exist (for automations, conditions, etc.)
 * This is a cross-reference validation that should be done before publishing
 */
export async function validateConfigReferences(
  config: Config,
  existingConfigs: Map<string, Config>
): Promise<{ valid: true } | { valid: false; error: string }> {
  // For automations, validate that referenced triggers, conditions, actions exist
  if (config.namespace === "automation") {
    const automation = config as Extract<Config, { namespace: "automation" }>;
    
    // Check trigger
    if (!existingConfigs.has(automation.trigger)) {
      return { valid: false, error: `Referenced trigger "${automation.trigger}" not found` };
    }
    
    // Check conditions
    if (automation.conditions) {
      for (const conditionKey of automation.conditions) {
        if (!existingConfigs.has(conditionKey)) {
          return { valid: false, error: `Referenced condition "${conditionKey}" not found` };
        }
      }
    }
    
    // Check actions
    for (const actionKey of automation.actions) {
      if (!existingConfigs.has(actionKey)) {
        return { valid: false, error: `Referenced action "${actionKey}" not found` };
      }
    }
    
    // Check approvals
    if (automation.approvals) {
      for (const approvalKey of automation.approvals) {
        if (!existingConfigs.has(approvalKey)) {
          return { valid: false, error: `Referenced approval "${approvalKey}" not found` };
        }
      }
    }
  }
  
  // For triggers, validate referenced conditions
  if (config.namespace === "trigger") {
    const trigger = config as Extract<Config, { namespace: "trigger" }>;
    if (trigger.conditions) {
      for (const conditionKey of trigger.conditions) {
        if (!existingConfigs.has(conditionKey)) {
          return { valid: false, error: `Referenced condition "${conditionKey}" not found` };
        }
      }
    }
  }
  
  // For SLAs, validate referenced triggers and actions
  if (config.namespace === "sla") {
    const sla = config as Extract<Config, { namespace: "sla" }>;
    if (!existingConfigs.has(sla.startTrigger)) {
      return { valid: false, error: `Referenced start trigger "${sla.startTrigger}" not found` };
    }
    if (sla.endTrigger && !existingConfigs.has(sla.endTrigger)) {
      return { valid: false, error: `Referenced end trigger "${sla.endTrigger}" not found` };
    }
    if (sla.conditions) {
      for (const conditionKey of sla.conditions) {
        if (!existingConfigs.has(conditionKey)) {
          return { valid: false, error: `Referenced condition "${conditionKey}" not found` };
        }
      }
    }
    if (sla.actions) {
      for (const actionKey of sla.actions) {
        if (!existingConfigs.has(actionKey)) {
          return { valid: false, error: `Referenced action "${actionKey}" not found` };
        }
      }
    }
  }
  
  return { valid: true };
}

