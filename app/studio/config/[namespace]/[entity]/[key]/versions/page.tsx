"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";

interface Version {
  id: string;
  version: number;
  config: any;
  publishedBy: string;
  publishedAt: string;
}

export default function VersionHistoryPage() {
  const params = useParams();
  const namespace = params.namespace as string;
  const entity = params.entity as string;
  const key = params.key as string;
  
  const [versions, setVersions] = useState<Version[]>([]);
  const [configItemId, setConfigItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [namespace, entity, key]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/config/${namespace}/${entity}/${key}/versions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load versions");
      }

      const data = await response.json();
      setVersions(data.versions || []);
      setConfigItemId(data.configItem?.id || null);
    } catch (error) {
      console.error("Failed to load versions:", error);
      alert("Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!confirm(`Rollback to version ${version}? This will create a new version.`)) {
      return;
    }

    if (!configItemId) {
      alert("Config item ID not found");
      return;
    }

    setRollingBack(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }
      
      const response = await fetch("/api/admin/config/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          configItemId, // Need proper configItemId
          version,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rollback");
      }

      alert("Rollback successful! New version created.");
      loadVersions();
    } catch (error) {
      console.error("Rollback error:", error);
      alert(`Failed to rollback: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setRollingBack(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading version history...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Version History</h1>
        <p className="text-muted-foreground">
          {namespace} / {entity} / {key}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {versions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No versions found
              </div>
            ) : (
              <div className="divide-y">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedVersion?.id === version.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Version {version.version}</span>
                      {version.version === versions[0]?.version && (
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.publishedAt).toLocaleString()}
                    </p>
                    {version.version !== versions[0]?.version && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(version.version);
                        }}
                        disabled={rollingBack}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Version Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVersion ? (
              <div>
                <div className="mb-4">
                  <p className="text-sm font-medium">Version {selectedVersion.version}</p>
                  <p className="text-sm text-muted-foreground">
                    Published: {new Date(selectedVersion.publishedAt).toLocaleString()}
                  </p>
                </div>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[600px]">
                  {JSON.stringify(selectedVersion.config, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Select a version to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

