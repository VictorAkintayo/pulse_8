"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

export default function ConditionsBuilderPage() {
  const [entity, setEntity] = useState("");
  const [key, setKey] = useState("");
  const [conditionType, setConditionType] = useState<"field" | "formula" | "custom">("field");
  const [field, setField] = useState("");
  const [operator, setOperator] = useState<"eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "notIn" | "exists" | "notExists">("eq");
  const [value, setValue] = useState("");
  const [formula, setFormula] = useState("");
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
        namespace: "condition",
        entity,
        key,
        type: conditionType,
      };

      if (conditionType === "field") {
        if (!field || !operator) {
          alert("Field and operator are required for field conditions");
          return;
        }
        config.field = field;
        config.operator = operator;
        if (value) {
          // Try to parse as JSON if it looks like an array
          try {
            config.value = JSON.parse(value);
          } catch {
            // If not JSON, use as string or number
            const numValue = Number(value);
            config.value = isNaN(numValue) ? value : numValue;
          }
        }
      } else if (conditionType === "formula") {
        if (!formula) {
          alert("Formula is required");
          return;
        }
        config.formula = formula;
      } else if (conditionType === "custom") {
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
        `/api/admin/config/condition/${entity}/${key}/draft`,
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
        <h1 className="text-3xl font-bold mb-2">Condition Builder</h1>
        <p className="text-muted-foreground">
          Set up conditional logic rules
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Condition Configuration</CardTitle>
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
              placeholder="e.g., high-priority, status-open"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Condition Type</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as typeof conditionType)}
            >
              <option value="field">Field Comparison</option>
              <option value="formula">JavaScript Formula</option>
              <option value="custom">Custom Function</option>
            </select>
          </div>

          {conditionType === "field" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Field Path</label>
                <Input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="e.g., status, data.priority, data.amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Operator</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as typeof operator)}
                >
                  <option value="eq">Equals</option>
                  <option value="ne">Not Equals</option>
                  <option value="gt">Greater Than</option>
                  <option value="gte">Greater Than or Equal</option>
                  <option value="lt">Less Than</option>
                  <option value="lte">Less Than or Equal</option>
                  <option value="contains">Contains</option>
                  <option value="in">In Array</option>
                  <option value="notIn">Not In Array</option>
                  <option value="exists">Exists</option>
                  <option value="notExists">Not Exists</option>
                </select>
              </div>
              {!["exists", "notExists"].includes(operator) && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Value</label>
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder='e.g., "high", 100, ["a","b"]'
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For arrays, use JSON format: ["value1", "value2"]
                  </p>
                </div>
              )}
            </>
          )}

          {conditionType === "formula" && (
            <div>
              <label className="text-sm font-medium mb-2 block">JavaScript Formula</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder='e.g., record.data.amount > 1000 && record.data.status === "active"'
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use JavaScript expression. Access record data via `record.data.fieldName`
              </p>
            </div>
          )}

          {conditionType === "custom" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Function Name</label>
              <Input
                value={customFunction}
                onChange={(e) => setCustomFunction(e.target.value)}
                placeholder="e.g., checkBusinessHours"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Reference a custom function registered in the system
              </p>
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

