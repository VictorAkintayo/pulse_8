"use client";

import { useConfigStore, getConfigFromSnapshot } from "@/lib/store/config-store";
import { Config, FormConfig, ViewConfig, SlaConfig } from "@/lib/config/schemas";
import { useEffect } from "react";

/**
 * Hook to get form config from runtime snapshot
 */
export function useFormConfig(entity: string, key: string): FormConfig | null {
  const snapshot = useConfigStore((state) => state.snapshot);
  const config = getConfigFromSnapshot(snapshot, "form", entity, key);
  return (config as FormConfig) || null;
}

/**
 * Hook to get view config from runtime snapshot
 */
export function useViewConfig(entity: string, key: string): ViewConfig | null {
  const snapshot = useConfigStore((state) => state.snapshot);
  const config = getConfigFromSnapshot(snapshot, "view", entity, key);
  return (config as ViewConfig) || null;
}

/**
 * Hook to get SLA policy config from runtime snapshot
 */
export function useSlaPolicy(entity: string, key: string): SlaConfig | null {
  const snapshot = useConfigStore((state) => state.snapshot);
  const config = getConfigFromSnapshot(snapshot, "sla", entity, key);
  return (config as SlaConfig) || null;
}

/**
 * Hook to get any config by namespace, entity, and key
 */
export function useConfig(namespace: string, entity: string, key: string): Config | null {
  const snapshot = useConfigStore((state) => state.snapshot);
  return getConfigFromSnapshot(snapshot, namespace, entity, key);
}

/**
 * Hook to access the full config snapshot
 */
export function useConfigSnapshot() {
  return useConfigStore((state) => state.snapshot);
}

