"use client";

import { useState, useEffect } from "react";
import { FormRenderer } from "@/lib/components/renderers/form-renderer";
import { TableViewRenderer } from "@/lib/components/renderers/table-view-renderer";
import { Button } from "@/lib/components/ui/button";

/**
 * Deals page - Rendered entirely from config
 */
export default function DealsPage() {
  const [showForm, setShowForm] = useState(false);
  const [deals, setDeals] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    // Mock data
    setDeals([
      { id: "1", data: { title: "Enterprise License", value: 50000, stage: "negotiation", customer: "Acme Corp" } },
      { id: "2", data: { title: "Support Contract", value: 12000, stage: "proposal", customer: "Tech Solutions" } },
    ]);
  }, []);

  const handleFormSubmit = async (data: Record<string, any>) => {
    console.log("Deal form submitted:", data);
    setShowForm(false);
    alert("Deal created (mock - implement API call)");
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Deals</h1>
          <p className="text-muted-foreground">
            Track your sales pipeline
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Deal"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <FormRenderer
            entity="deal"
            key="deal-form"
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      <TableViewRenderer
        entity="deal"
        key="deal-pipeline-view"
        data={deals.map((d) => ({ ...d.data, id: d.id }))}
        onRowClick={(row) => {
          console.log("Deal clicked:", row);
        }}
      />
    </div>
  );
}

