"use client";

import { useState, useEffect } from "react";
import { FormRenderer } from "@/lib/components/renderers/form-renderer";
import { TableViewRenderer } from "@/lib/components/renderers/table-view-renderer";
import { SlaIndicator } from "@/lib/components/sla-indicator";
import { Button } from "@/lib/components/ui/button";

/**
 * Cases page - Rendered entirely from config
 * Includes SLA indicators (rendered from SLA config)
 */
export default function CasesPage() {
  const [showForm, setShowForm] = useState(false);
  const [cases, setCases] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    // Mock data with SLA info
    setCases([
      {
        id: "1",
        data: {
          title: "Login issue",
          customer: "Acme Corp",
          status: "open",
          priority: "high",
        },
        slaStatus: "on_time",
        slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        data: {
          title: "Feature request",
          customer: "Tech Solutions",
          status: "in_progress",
          priority: "medium",
        },
        slaStatus: "at_risk",
        slaDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  }, []);

  const handleFormSubmit = async (data: Record<string, any>) => {
    console.log("Case form submitted:", data);
    setShowForm(false);
    alert("Case created (mock - implement API call)");
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cases</h1>
          <p className="text-muted-foreground">
            Manage customer support cases
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Case"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <FormRenderer
            entity="case"
            key="case-form"
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      <TableViewRenderer
        entity="case"
        key="case-table"
        data={cases.map((c) => ({
          ...c.data,
          id: c.id,
          slaStatus: c.slaStatus,
          slaDueAt: c.slaDueAt,
        }))}
        onRowClick={(row) => {
          console.log("Case clicked:", row);
        }}
      />
    </div>
  );
}

