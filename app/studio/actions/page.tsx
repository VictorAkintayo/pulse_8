"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

export default function ActionsBuilderPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [actionType, setActionType] = useState<"create_record" | "update_record" | "delete_record" | "send_email" | "send_notification" | "assign" | "update_field" | "webhook" | "custom">("update_record");
  const [targetEntity, setTargetEntity] = useState("");
  const [targetField, setTargetField] = useState("");
  const [value, setValue] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookPayload, setWebhookPayload] = useState("");
  const [customFunction, setCustomFunction] = useState("");
  const [saving, setSaving] = useState(false);

  const saveDraft = async () => {
    if (!entity || !key) {
      alert("Please fill in entity and key");
      return;
    }

    setSaving(true);
    try {
      const config: any = {
        namespace: "action",
        entity,
        key,
        type: actionType,
      };

      if (["create_record", "update_record"].includes(actionType)) {
        if (targetEntity) config.targetEntity = targetEntity;
      }

      if (actionType === "update_field") {
        if (!targetField) {
          alert("Target field is required for update_field action");
          return;
        }
        config.targetField = targetField;
        if (value) {
          try {
            config.value = JSON.parse(value);
          } catch {
            const numValue = Number(value);
            config.value = isNaN(numValue) ? value : numValue;
          }
        }
      }

      if (actionType === "send_email") {
        if (emailTemplate) config.emailTemplate = emailTemplate;
      }

      if (actionType === "webhook") {
        if (!webhookUrl) {
          alert("Webhook URL is required");
          return;
        }
        config.webhookUrl = webhookUrl;
        if (webhookPayload) {
          try {
            config.webhookPayload = JSON.parse(webhookPayload);
          } catch {
            alert("Webhook payload must be valid JSON");
            return;
          }
        }
      }

      if (actionType === "custom") {
        if (!customFunction) {
          alert("Custom function name is required");
          return;
        }
        config.customFunction = customFunction;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/config/action/${entity}/${key}/draft`,
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
        <h1 className="text-3xl font-bold mb-2">Action Builder</h1>
        <p className="text-muted-foreground">
          Define what automations should do
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Action Configuration</CardTitle>
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
              placeholder="e.g., assign-case, send-notification"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Action Type</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={actionType}
              onChange={(e) => setActionType(e.target.value as typeof actionType)}
            >
              <option value="create_record">Create Record</option>
              <option value="update_record">Update Record</option>
              <option value="delete_record">Delete Record</option>
              <option value="update_field">Update Field</option>
              <option value="send_email">Send Email</option>
              <option value="send_notification">Send Notification</option>
              <option value="assign">Assign</option>
              <option value="webhook">Webhook</option>
              <option value="custom">Custom Function</option>
            </select>
          </div>

          {["create_record", "update_record"].includes(actionType) && (
            <div>
              <label className="text-sm font-medium mb-2 block">Target Entity</label>
              <Input
                value={targetEntity}
                onChange={(e) => setTargetEntity(e.target.value)}
                placeholder="e.g., customer, deal, case"
              />
            </div>
          )}

          {actionType === "update_field" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Field</label>
                <Input
                  value={targetField}
                  onChange={(e) => setTargetField(e.target.value)}
                  placeholder="e.g., status, data.priority"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Value</label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='e.g., "closed", 100'
                />
              </div>
            </>
          )}

          {actionType === "send_email" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Email Template Key</label>
              <Input
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                placeholder="e.g., welcome-email, case-update"
              />
            </div>
          )}

          {actionType === "webhook" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Webhook Payload (JSON)</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                />
              </div>
            </>
          )}

          {actionType === "custom" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Function Name</label>
              <Input
                value={customFunction}
                onChange={(e) => setCustomFunction(e.target.value)}
                placeholder="e.g., customBusinessLogic"
              />
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

