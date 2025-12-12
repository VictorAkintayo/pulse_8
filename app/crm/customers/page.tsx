"use client";

import { useState, useEffect } from "react";
import { FormRenderer } from "@/lib/components/renderers/form-renderer";
import { TableViewRenderer } from "@/lib/components/renderers/table-view-renderer";
import { Button } from "@/lib/components/ui/button";
import { Card, CardContent } from "@/lib/components/ui/card";

/**
 * Customers page - Rendered entirely from config
 * The form and table are rendered dynamically based on published configurations
 */
export default function CustomersPage() {
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<Array<Record<string, any>>>([]);

  // In a real app, this would fetch from your API
  useEffect(() => {
    // Mock data - in production, fetch from /api/crm/customers
    setCustomers([
      { id: "1", data: { name: "Acme Corp", email: "contact@acme.com", phone: "+234 800 000 0000" } },
      { id: "2", data: { name: "Tech Solutions", email: "info@tech.com", phone: "+234 800 000 0001" } },
    ]);
  }, []);

  const handleFormSubmit = async (data: Record<string, any>) => {
    console.log("Form submitted:", data);
    // In production, POST to /api/crm/customers
    // For now, just close the form
    setShowForm(false);
    alert("Customer created (mock - implement API call)");
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Customer"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <FormRenderer
            entity="customer"
            key="customer-form"
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      <TableViewRenderer
        entity="customer"
        key="customer-table"
        data={customers.map((c) => ({ ...c.data, id: c.id }))}
        onRowClick={(row) => {
          console.log("Row clicked:", row);
          // Navigate to customer detail page
        }}
      />
    </div>
  );
}

