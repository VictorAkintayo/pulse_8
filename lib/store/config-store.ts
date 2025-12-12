import { create } from "zustand";
import { Config } from "@/lib/config/schemas";

export interface ConfigSnapshot {
  snapshotVersion: number;
  snapshot: Record<string, Record<string, Record<string, Config>>>;
}

interface ConfigState {
  snapshot: ConfigSnapshot | null;
  isLoading: boolean;
  error: string | null;
  setSnapshot: (snapshot: ConfigSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSnapshot: (newSnapshot: ConfigSnapshot) => void;
}

/**
 * Global Zustand store for runtime config
 * Updated in real-time when admin publishes changes
 */
export const useConfigStore = create<ConfigState>((set) => ({
  snapshot: null,
  isLoading: false,
  error: null,
  setSnapshot: (snapshot) => set({ snapshot, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateSnapshot: (newSnapshot) => set({ snapshot: newSnapshot, error: null }),
}));

/**
 * Get config from snapshot by namespace, entity, and key
 */
export function getConfigFromSnapshot(
  snapshot: ConfigSnapshot | null,
  namespace: string,
  entity: string,
  key: string
): Config | null {
  if (!snapshot) return null;
  return snapshot.snapshot[namespace]?.[entity]?.[key] || null;
}

