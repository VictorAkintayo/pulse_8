"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface ViewColumn {
  id: string;
  field: string;
  label: string;
  type: string;
  sortable: boolean;
  filterable: boolean;
  order: number;
}

export default function ViewsBuilderPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [viewType, setViewType] = useState<"table" | "kanban" | "calendar" | "gantt">("table");
  const [columns, setColumns] = useState<ViewColumn[]>([]);
  const [saving, setSaving] = useState(false);

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        id: `col-${Date.now()}`,
        field: "",
        label: "",
        type: "text",
        sortable: true,
        filterable: false,
        order: columns.length,
      },
    ]);
  };

  const updateColumn = (id: string, updates: Partial<ViewColumn>) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const saveDraft = async () => {
    if (!entity || !key || !title) {
      alert("Please fill in entity, key, and title");
      return;
    }

    setSaving(true);
    try {
      const config = {
        namespace: "view",
        entity,
        key,
        title,
        type: viewType,
        columns: columns.map((c) => ({
          id: c.id,
          field: c.field,
          label: c.label,
          type: c.type,
          sortable: c.sortable,
          filterable: c.filterable,
          order: c.order,
        })),
      };

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/config/view/${entity}/${key}/draft`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ config }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert(`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">View Builder</h1>
        <p className="text-muted-foreground">
          Create tables, kanban boards, and reports
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>View Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Entity</label>
            <Input
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              placeholder="e.g., customer, deal, case"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Key</label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., customer-table, deal-kanban"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="View title"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">View Type</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={viewType}
              onChange={(e) =>
                setViewType(e.target.value as typeof viewType)
              }
            >
              <option value="table">Table</option>
              <option value="kanban">Kanban</option>
              <option value="calendar">Calendar</option>
              <option value="gantt">Gantt</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Columns</CardTitle>
          <Button onClick={addColumn}>Add Column</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {columns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No columns yet. Click "Add Column" to get started.
            </p>
          ) : (
            columns.map((column) => (
              <Card key={column.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Field Path
                      </label>
                      <Input
                        value={column.field}
                        onChange={(e) =>
                          updateColumn(column.id, { field: e.target.value })
                        }
                        placeholder="e.g., name, data.email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Label
                      </label>
                      <Input
                        value={column.label}
                        onChange={(e) =>
                          updateColumn(column.id, { label: e.target.value })
                        }
                        placeholder="Column label"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Type
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={column.type}
                        onChange={(e) =>
                          updateColumn(column.id, { type: e.target.value })
                        }
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime</option>
                        <option value="boolean">Boolean</option>
                        <option value="badge">Badge</option>
                        <option value="link">Link</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={column.sortable}
                        onChange={(e) =>
                          updateColumn(column.id, {
                            sortable: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm">Sortable</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={column.filterable}
                        onChange={(e) =>
                          updateColumn(column.id, {
                            filterable: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm">Filterable</span>
                    </label>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeColumn(column.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-4">
        <Button onClick={saveDraft} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button variant="outline">Validate</Button>
        <Button variant="outline">Publish</Button>
      </div>
    </div>
  );
}

