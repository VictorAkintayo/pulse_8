"use client";

import React from "react";
import { useFormConfig } from "@/lib/hooks/use-config";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface FormRendererProps {
  entity: string;
  key: string;
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  initialData?: Record<string, any>;
}

/**
 * FormRenderer - Renders forms dynamically from published config
 * This component reads form configuration from the runtime config snapshot
 * and renders the form accordingly. No hard-coded forms!
 */
export function FormRenderer({
  entity,
  key,
  onSubmit,
  initialData = {},
}: FormRendererProps) {
  const formConfig = useFormConfig(entity, key);
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData);
  const [submitting, setSubmitting] = React.useState(false);

  if (!formConfig) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-muted-foreground">
          Form configuration not found: {entity}/{key}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      setSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const sortedFields = [...formConfig.fields].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formConfig.title}</CardTitle>
        {formConfig.description && (
          <p className="text-sm text-muted-foreground">{formConfig.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {sortedFields.map((field) => {
            const fieldValue = formData[field.id] ?? field.defaultValue ?? "";

            return (
              <div key={field.id}>
                <label className="text-sm font-medium mb-2 block">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={fieldValue}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "select" ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={fieldValue}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "multiselect" ? (
                  <select
                    multiple
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={Array.isArray(fieldValue) ? fieldValue : []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                      updateField(field.id, selected);
                    }}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fieldValue === true}
                      onChange={(e) => updateField(field.id, e.target.checked)}
                    />
                    <span className="text-sm">{field.placeholder || "Check this box"}</span>
                  </label>
                ) : field.type === "radio" && field.options ? (
                  <div className="space-y-2">
                    {field.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          checked={fieldValue === opt}
                          onChange={(e) => updateField(field.id, e.target.value)}
                          required={field.required}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input
                    type={field.type === "datetime" ? "datetime-local" : field.type}
                    value={fieldValue}
                    onChange={(e) =>
                      updateField(
                        field.id,
                        field.type === "number" ? Number(e.target.value) : e.target.value
                      )
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                )}

                {field.helpText && (
                  <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : formConfig.submitAction?.successMessage || "Submit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

