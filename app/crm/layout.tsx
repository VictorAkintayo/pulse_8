"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthGuard } from "@/lib/middleware/auth-guard";
import { Button } from "@/lib/components/ui/button";

function CRMLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    router.push("/auth/login");
  };

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
  const tenant = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("tenant") || "{}") : null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Pulse-8 CRM</h1>
          {tenant && (
            <p className="text-sm text-muted-foreground mt-1">{tenant.name}</p>
          )}
        </div>
        <nav className="px-4 py-4 flex-1 space-y-1">
          <a
            href="/crm/customers"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname?.startsWith("/crm/customers")
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Customers
          </a>
          <a
            href="/crm/deals"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname?.startsWith("/crm/deals")
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Deals
          </a>
          <a
            href="/crm/cases"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname?.startsWith("/crm/cases")
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Cases
          </a>
          <a
            href="/crm/inbox"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname?.startsWith("/crm/inbox")
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Inbox
          </a>
          <a
            href="/crm/dashboard"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname?.startsWith("/crm/dashboard")
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Dashboard
          </a>
          <div className="pt-4 border-t mt-4">
            <a
              href="/studio"
              className="block px-4 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Automation Studio
            </a>
          </div>
        </nav>
        <div className="p-4 border-t">
          {user && (
            <div className="mb-3">
              <p className="text-sm font-medium">{user.email}</p>
              {user.firstName && (
                <p className="text-xs text-muted-foreground">
                  {user.firstName} {user.lastName}
                </p>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function CRMLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <CRMLayoutContent>{children}</CRMLayoutContent>
    </AuthGuard>
  );
}
