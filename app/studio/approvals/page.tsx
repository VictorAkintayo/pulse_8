"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface Approver {
  type: "user" | "role" | "field";
  userId?: string;
  role?: string;
  field?: string;
}

export default function ApprovalsBuilderPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(true);
  const [approvalType, setApprovalType] = useState<"any" | "all" | "sequential">("all");
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // SLA fields
  const [isSla, setIsSla] = useState(false);
  const [slaStartTrigger, setSlaStartTrigger] = useState("");
  const [slaEndTrigger, setSlaEndTrigger] = useState("");
  const [slaDurationValue, setSlaDurationValue] = useState("");
  const [slaDurationUnit, setSlaDurationUnit] = useState<"minutes" | "hours" | "days" | "business_days">("hours");
  const [slaWarningValue, setSlaWarningValue] = useState("");
  const [slaWarningUnit, setSlaWarningUnit] = useState<"minutes" | "hours" | "days" | "business_days">("hours");
  const [slaActions, setSlaActions] = useState<string[]>([]);

  const addApprover = () => {
    setApprovers([
      ...approvers,
      {
        type: "role",
        role: "manager",
      },
    ]);
  };

  const updateApprover = (index: number, updates: Partial<Approver>) => {
    setApprovers(approvers.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  const removeApprover = (index: number) => {
    setApprovers(approvers.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    const conditionKey = prompt("Enter condition config key:");
    if (conditionKey) {
      setConditions([...conditions, conditionKey]);
    }
  };

  const addSlaAction = () => {
    const actionKey = prompt("Enter action config key:");
    if (actionKey) {
      setSlaActions([...slaActions, actionKey]);
    }
  };

  const saveDraft = async () => {
    if (!entity || !key) {
      alert("Please fill in entity and key");
      return;
    }

    setSaving(true);
    try {
      let config: any;

      if (isSla) {
        if (!slaStartTrigger) {
          alert("Start trigger is required for SLA");
          return;
        }
        config = {
          namespace: "sla",
          entity,
          key,
          title: title || key,
          description,
          startTrigger: slaStartTrigger,
          duration: {
            value: parseInt(slaDurationValue) || 24,
            unit: slaDurationUnit,
          },
        };
        if (slaEndTrigger) config.endTrigger = slaEndTrigger;
        if (slaWarningValue) {
          config.warningThreshold = {
            value: parseInt(slaWarningValue),
            unit: slaWarningUnit,
          };
        }
        if (conditions.length > 0) config.conditions = conditions;
        if (slaActions.length > 0) config.actions = slaActions;
      } else {
        if (approvers.length === 0) {
          alert("At least one approver is required");
          return;
        }
        config = {
          namespace: "approval",
          entity,
          key,
          title: title || key,
          description,
          required,
          approvers,
          approvalType,
        };
        if (conditions.length > 0) config.conditions = conditions;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const namespace = isSla ? "sla" : "approval";
      const response = await fetch(
        `/api/admin/config/${namespace}/${entity}/${key}/draft`,
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
        <h1 className="text-3xl font-bold mb-2">Approvals & SLAs</h1>
        <p className="text-muted-foreground">
          Configure approval workflows and SLA policies
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration Type</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSla}
              onChange={(e) => setIsSla(e.target.checked)}
            />
            <span>This is an SLA policy (not an approval workflow)</span>
          </label>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isSla ? "SLA" : "Approval"} Configuration</CardTitle>
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
              placeholder={isSla ? "e.g., case-response-sla" : "e.g., deal-approval"}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Policy title"
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

          {isSla ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Start Trigger Key *</label>
                <Input
                  value={slaStartTrigger}
                  onChange={(e) => setSlaStartTrigger(e.target.value)}
                  placeholder="e.g., case-created"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Trigger Key (Optional)</label>
                <Input
                  value={slaEndTrigger}
                  onChange={(e) => setSlaEndTrigger(e.target.value)}
                  placeholder="e.g., case-resolved"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration Value</label>
                  <Input
                    type="number"
                    value={slaDurationValue}
                    onChange={(e) => setSlaDurationValue(e.target.value)}
                    placeholder="24"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration Unit</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={slaDurationUnit}
                    onChange={(e) => setSlaDurationUnit(e.target.value as typeof slaDurationUnit)}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="business_days">Business Days</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Warning Threshold Value (Optional)</label>
                  <Input
                    type="number"
                    value={slaWarningValue}
                    onChange={(e) => setSlaWarningValue(e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Warning Unit</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={slaWarningUnit}
                    onChange={(e) => setSlaWarningUnit(e.target.value as typeof slaWarningUnit)}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="business_days">Business Days</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                  />
                  <span className="text-sm">Required</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Approval Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={approvalType}
                  onChange={(e) => setApprovalType(e.target.value as typeof approvalType)}
                >
                  <option value="any">Any Approver</option>
                  <option value="all">All Approvers</option>
                  <option value="sequential">Sequential</option>
                </select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isSla && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Approvers</CardTitle>
            <Button onClick={addApprover} size="sm">Add Approver</Button>
          </CardHeader>
          <CardContent>
            {approvers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No approvers. Click "Add Approver" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {approvers.map((approver, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Approver Type</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={approver.type}
                          onChange={(e) =>
                            updateApprover(index, {
                              type: e.target.value as Approver["type"],
                              userId: undefined,
                              role: undefined,
                              field: undefined,
                            })
                          }
                        >
                          <option value="user">Specific User</option>
                          <option value="role">Role</option>
                          <option value="field">Field Reference</option>
                        </select>
                      </div>
                      {approver.type === "user" && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">User ID</label>
                          <Input
                            value={approver.userId || ""}
                            onChange={(e) => updateApprover(index, { userId: e.target.value })}
                            placeholder="User UUID"
                          />
                        </div>
                      )}
                      {approver.type === "role" && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Role</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={approver.role || ""}
                            onChange={(e) => updateApprover(index, { role: e.target.value })}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="agent">Agent</option>
                          </select>
                        </div>
                      )}
                      {approver.type === "field" && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Field Path</label>
                          <Input
                            value={approver.field || ""}
                            onChange={(e) => updateApprover(index, { field: e.target.value })}
                            placeholder="e.g., data.assignedTo"
                          />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeApprover(index)}
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conditions (Optional)</CardTitle>
          <Button onClick={addCondition} size="sm">Add Condition</Button>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No conditions. Policy will apply to all records.
            </p>
          ) : (
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm">{condition}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isSla && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Actions on Breach (Optional)</CardTitle>
            <Button onClick={addSlaAction} size="sm">Add Action</Button>
          </CardHeader>
          <CardContent>
            {slaActions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No actions. SLA will only track time.
              </p>
            ) : (
              <div className="space-y-2">
                {slaActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm">{action}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setSlaActions(slaActions.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

