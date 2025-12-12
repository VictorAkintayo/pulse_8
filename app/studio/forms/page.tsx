"use client";

import { useState, useEffect } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

export default function FormsBuilderPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        label: "",
        type: "text",
        required: false,
        order: fields.length,
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const saveDraft = async () => {
    if (!entity || !key || !title) {
      alert("Please fill in entity, key, and title");
      return;
    }

    setSaving(true);
    try {
      const config = {
        namespace: "form",
        entity,
        key,
        title,
        fields: fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          options: f.options,
          order: f.order,
        })),
      };

      // Get token from localStorage (in production, use proper auth)
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/config/form/${entity}/${key}/draft`,
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
        <h1 className="text-3xl font-bold mb-2">Form Builder</h1>
        <p className="text-muted-foreground">
          Create and configure forms for data entry
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Form Configuration</CardTitle>
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
              placeholder="e.g., customer-form, deal-form"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Form title"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fields</CardTitle>
          <Button onClick={addField}>Add Field</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No fields yet. Click "Add Field" to get started.
            </p>
          ) : (
            fields.map((field) => (
              <Card key={field.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Label
                      </label>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        placeholder="Field label"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Type
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, { type: e.target.value })
                        }
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime</option>
                        <option value="select">Select</option>
                        <option value="multiselect">Multi-select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field.id, { required: e.target.checked })
                        }
                      />
                      <span className="text-sm">Required</span>
                    </label>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeField(field.id)}
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

