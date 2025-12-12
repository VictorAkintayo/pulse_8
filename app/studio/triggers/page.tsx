"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

export default function TriggersBuilderPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [triggerType, setTriggerType] = useState<"create" | "update" | "delete" | "field_change" | "webhook" | "schedule" | "manual">("create");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [schedule, setSchedule] = useState("");
  const [field, setField] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addCondition = () => {
    const conditionKey = prompt("Enter condition config key:");
    if (conditionKey) {
      setConditions([...conditions, conditionKey]);
    }
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const saveDraft = async () => {
    if (!entity || !key) {
      alert("Please fill in entity and key");
      return;
    }

    setSaving(true);
    try {
      const config: any = {
        namespace: "trigger",
        entity,
        key,
        type: triggerType,
      };

      if (triggerType === "webhook" && webhookUrl) {
        config.webhookUrl = webhookUrl;
      }
      if (triggerType === "schedule" && schedule) {
        config.schedule = schedule;
      }
      if (triggerType === "field_change" && field) {
        config.field = field;
      }
      if (conditions.length > 0) {
        config.conditions = conditions;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/config/trigger/${entity}/${key}/draft`,
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
        <h1 className="text-3xl font-bold mb-2">Trigger Builder</h1>
        <p className="text-muted-foreground">
          Define when automations should run
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Trigger Configuration</CardTitle>
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
              placeholder="e.g., customer-created, deal-updated"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Trigger Type</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as typeof triggerType)}
            >
              <option value="create">Record Created</option>
              <option value="update">Record Updated</option>
              <option value="delete">Record Deleted</option>
              <option value="field_change">Field Changed</option>
              <option value="webhook">Webhook</option>
              <option value="schedule">Scheduled</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {triggerType === "webhook" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Webhook URL</label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>
          )}

          {triggerType === "schedule" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Cron Expression</label>
              <Input
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="0 0 * * * (daily at midnight)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use standard cron syntax (e.g., "0 0 * * *" for daily at midnight)
              </p>
            </div>
          )}

          {triggerType === "field_change" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Field Path</label>
              <Input
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="e.g., status, data.priority"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conditions (Optional)</CardTitle>
          <Button onClick={addCondition} size="sm">Add Condition</Button>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No conditions. Triggers will fire on all events.
            </p>
          ) : (
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm">{condition}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCondition(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={saveDraft} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button variant="outline">Validate</Button>
        <Button variant="outline">Publish</Button>
      </div>
    </div>
  );
}

