"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { FormRenderer } from "@/lib/components/renderers/form-renderer";
import { TableViewRenderer } from "@/lib/components/renderers/table-view-renderer";

interface Customer {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function Customer360Page() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deals, setDeals] = useState<Array<Record<string, any>>>([]);
  const [cases, setCases] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
      loadRelatedData();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(`/api/crm/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load customer");
      }

      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error("Failed to load customer:", error);
      alert("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Load deals
      const dealsResponse = await fetch("/api/crm/deals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        setDeals(
          dealsData.deals.filter((d: any) => d.customerId === customerId)
        );
      }

      // Load cases
      const casesResponse = await fetch("/api/crm/cases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setCases(
          casesData.cases.filter((c: any) => c.customerId === customerId)
        );
      }
    } catch (error) {
      console.error("Failed to load related data:", error);
    }
  };

  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(`/api/crm/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer");
      }

      const updated = await response.json();
      setCustomer(updated);
      setEditing(false);
      alert("Customer updated successfully!");
    } catch (error) {
      console.error("Failed to update customer:", error);
      alert("Failed to update customer");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer 360</h1>
          <p className="text-muted-foreground">
            Complete view of customer information and interactions
          </p>
        </div>
        <Button onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit Customer"}
        </Button>
      </div>

      {editing ? (
        <div className="mb-6">
          <FormRenderer
            entity="customer"
            key="customer-form"
            onSubmit={handleFormSubmit}
            initialData={customer.data}
          />
        </div>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(customer.data).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {key}
                  </p>
                  <p className="text-base">{String(value)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              <p>Created: {new Date(customer.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(customer.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-muted-foreground">No deals for this customer</p>
            ) : (
              <TableViewRenderer
                entity="deal"
                key="deal-pipeline-view"
                data={deals.map((d) => ({ ...d.data, id: d.id }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {cases.length === 0 ? (
              <p className="text-muted-foreground">No cases for this customer</p>
            ) : (
              <TableViewRenderer
                entity="case"
                key="case-table"
                data={cases.map((c) => ({
                  ...c.data,
                  id: c.id,
                  slaStatus: c.slaStatus,
                  slaDueAt: c.slaDueAt,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

