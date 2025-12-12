"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface AuditLogEntry {
  id: string;
  snapshotVersion: number;
  configItemIds: string[];
  publishedBy: string;
  publishedAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, []);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/config/audit-log?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load audit log");
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to load audit log:", error);
      alert("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading audit log...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Config Audit Log</h1>
        <p className="text-muted-foreground">
          History of all config publishes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publish History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No publish history
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        Snapshot Version {log.snapshotVersion}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.publishedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {log.configItemIds.length} config{log.configItemIds.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Published by: {log.publishedBy}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {log.configItemIds.map((id) => (
                        <span
                          key={id}
                          className="text-xs px-2 py-1 bg-muted rounded"
                        >
                          {id.substring(0, 8)}...
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

