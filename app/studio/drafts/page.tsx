"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";

interface Draft {
  id: string;
  namespace: string;
  entity: string;
  key: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/config/drafts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load drafts");
      }

      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error("Failed to load drafts:", error);
      alert("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    if (filter === "all") return true;
    return draft.status === filter;
  });

  const getBuilderUrl = (namespace: string) => {
    const map: Record<string, string> = {
      form: "/studio/forms",
      view: "/studio/views",
      trigger: "/studio/triggers",
      condition: "/studio/conditions",
      action: "/studio/actions",
      approval: "/studio/approvals",
      sla: "/studio/approvals",
      automation: "/studio/automations",
    };
    return map[namespace] || "/studio";
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading drafts...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Draft Management</h1>
          <p className="text-muted-foreground">
            Manage all your config drafts
          </p>
        </div>
        <div>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "All Configs" : filter === "draft" ? "Drafts" : "Published"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDrafts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No configs found
            </div>
          ) : (
            <div className="divide-y">
              {filteredDrafts.map((draft) => (
                <div key={draft.id} className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {draft.namespace} / {draft.entity} / {draft.key}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            draft.status === "published"
                              ? "bg-green-100 text-green-800"
                              : draft.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {draft.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Updated: {new Date(draft.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.location.href = `${getBuilderUrl(draft.namespace)}?entity=${draft.entity}&key=${draft.key}`;
                        }}
                      >
                        Edit
                      </Button>
                      {draft.status === "published" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/studio/config/${draft.namespace}/${draft.entity}/${draft.key}/versions`;
                          }}
                        >
                          Versions
                        </Button>
                      )}
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

