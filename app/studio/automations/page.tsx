"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

export default function AutomationsComposerPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [approvals, setApprovals] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [retry, setRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [onErrorAction, setOnErrorAction] = useState("");
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

  const addAction = () => {
    const actionKey = prompt("Enter action config key:");
    if (actionKey) {
      setActions([...actions, actionKey]);
    }
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const addApproval = () => {
    const approvalKey = prompt("Enter approval config key:");
    if (approvalKey) {
      setApprovals([...approvals, approvalKey]);
    }
  };

  const removeApproval = (index: number) => {
    setApprovals(approvals.filter((_, i) => i !== index));
  };

  const saveDraft = async () => {
    if (!entity || !key || !title || !trigger || actions.length === 0) {
      alert("Please fill in entity, key, title, trigger, and at least one action");
      return;
    }

    setSaving(true);
    try {
      const config: any = {
        namespace: "automation",
        entity,
        key,
        title,
        description,
        enabled,
        trigger,
        actions,
      };

      if (conditions.length > 0) {
        config.conditions = conditions;
      }

      if (approvals.length > 0) {
        config.approvals = approvals;
      }

      if (retry || onErrorAction) {
        config.errorHandling = {
          retry,
          retryCount: retry ? retryCount : 0,
          onError: onErrorAction || undefined,
        };
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(
        `/api/admin/config/automation/${entity}/${key}/draft`,
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
        <h1 className="text-3xl font-bold mb-2">Automations Composer</h1>
        <p className="text-muted-foreground">
          Compose automations from triggers, conditions, and actions
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Automation Configuration</CardTitle>
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
              placeholder="e.g., auto-assign-case"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Automation title"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Trigger Key *</label>
            <Input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="e.g., case-created"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Reference a trigger config key
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
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
              No conditions. Automation will run on all trigger events.
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
          <p className="text-xs text-muted-foreground mt-2">
            All conditions must be true (AND logic)
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Actions *</CardTitle>
          <Button onClick={addAction} size="sm">Add Action</Button>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No actions. Click "Add Action" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm">{action}</span>
                  </div>
                  <div className="flex gap-2">
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newActions = [...actions];
                          [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
                          setActions(newActions);
                        }}
                      >
                        ↑
                      </Button>
                    )}
                    {index < actions.length - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newActions = [...actions];
                          [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
                          setActions(newActions);
                        }}
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Actions execute sequentially in order
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Approvals (Optional)</CardTitle>
          <Button onClick={addApproval} size="sm">Add Approval</Button>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No approvals. Actions will execute immediately.
            </p>
          ) : (
            <div className="space-y-2">
              {approvals.map((approval, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm">{approval}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeApproval(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            All approvals must pass before actions execute
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Error Handling (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={retry}
                onChange={(e) => setRetry(e.target.checked)}
              />
              <span className="text-sm">Retry on failure</span>
            </label>
          </div>
          {retry && (
            <div>
              <label className="text-sm font-medium mb-2 block">Retry Count</label>
              <Input
                type="number"
                value={retryCount}
                onChange={(e) => setRetryCount(parseInt(e.target.value) || 0)}
                min="0"
                max="10"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">On Error Action (Optional)</label>
            <Input
              value={onErrorAction}
              onChange={(e) => setOnErrorAction(e.target.value)}
              placeholder="Action config key to execute on error"
            />
          </div>
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

