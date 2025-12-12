"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface Metrics {
  customers: { total: number };
  deals: { total: number; recent: number; totalValue: number };
  cases: { total: number; open: number; slaAtRisk: number };
  period: { days: number; startDate: string; endDate: string };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadMetrics();
  }, [days]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(`/api/crm/dashboard/metrics?days=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load metrics");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load metrics:", error);
      alert("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your CRM metrics
          </p>
        </div>
        <div>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.customers.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.deals.total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.deals.recent} in last {days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₦{metrics.deals.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.cases.open}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.cases.slaAtRisk} at risk
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cases Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cases</span>
                <span className="font-semibold">{metrics.cases.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open Cases</span>
                <span className="font-semibold">{metrics.cases.open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA At Risk</span>
                <span className="font-semibold text-destructive">
                  {metrics.cases.slaAtRisk}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deals</span>
                <span className="font-semibold">{metrics.deals.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recent Deals</span>
                <span className="font-semibold">{metrics.deals.recent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold">
                  ₦{metrics.deals.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

