"use client";

import { useEffect, useRef } from "react";
import { useConfigStore } from "@/lib/store/config-store";
import { ConfigSnapshot } from "@/lib/store/config-store";

interface ConfigProviderProps {
  children: React.ReactNode;
  initialSnapshot?: ConfigSnapshot | null;
  token?: string;
  wsUrl?: string;
}

/**
 * ConfigProvider manages real-time config synchronization
 * - Loads initial config on mount
 * - Subscribes to WebSocket for real-time updates
 * - Fetches new snapshot when config.published event is received
 */
export function ConfigProvider({
  children,
  initialSnapshot,
  token,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
}: ConfigProviderProps) {
  const { setSnapshot, setLoading, setError, updateSnapshot } = useConfigStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial config
  useEffect(() => {
    if (initialSnapshot) {
      setSnapshot(initialSnapshot);
    } else {
      loadConfig();
    }
  }, []);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!token) return;

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token]);

  async function loadConfig(sinceVersion?: number) {
    setLoading(true);
    setError(null);

    try {
      const url = sinceVersion
        ? `/api/runtime/config?sinceVersion=${sinceVersion}`
        : `/api/runtime/config`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.hasUpdate && data.snapshot) {
        updateSnapshot({
          snapshotVersion: data.snapshotVersion,
          snapshot: data.snapshot,
        });
      } else if (!sinceVersion) {
        // Initial load
        setSnapshot({
          snapshotVersion: data.snapshotVersion || 0,
          snapshot: data.snapshot || {},
        });
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      setError(error instanceof Error ? error.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }

  function connectWebSocket() {
    if (!token) return;

    try {
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Config WebSocket connected");
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "config.published") {
            const { snapshotVersion } = message;
            console.log("Config published, fetching new snapshot:", snapshotVersion);
            // Fetch new snapshot
            loadConfig(snapshotVersion - 1);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setError("Failed to connect to real-time service");
    }
  }

  return <>{children}</>;
}

