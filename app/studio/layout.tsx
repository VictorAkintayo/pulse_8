"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthGuard } from "@/lib/middleware/auth-guard";
import { Button } from "@/lib/components/ui/button";

function StudioLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    router.push("/auth/login?redirect=/studio");
  };

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
  const tenant = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("tenant") || "{}") : null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Automation Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your CRM platform
          </p>
        </div>
        <nav className="px-4 py-4 flex-1 space-y-1">
          <a
            href="/studio/forms"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/forms"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Forms
          </a>
          <a
            href="/studio/views"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/views"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Views
          </a>
          <a
            href="/studio/triggers"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/triggers"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Triggers
          </a>
          <a
            href="/studio/conditions"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/conditions"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Conditions
          </a>
          <a
            href="/studio/actions"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/actions"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Actions
          </a>
          <a
            href="/studio/approvals"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/approvals"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Approvals & SLAs
          </a>
          <a
            href="/studio/automations"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/automations"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Automations
          </a>
          <div className="border-t my-2"></div>
          <a
            href="/studio/drafts"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/drafts"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Drafts
          </a>
          <a
            href="/studio/audit-log"
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === "/studio/audit-log"
                ? "bg-accent font-medium"
                : "hover:bg-accent"
            }`}
          >
            Audit Log
          </a>
          <div className="pt-4 border-t mt-4">
            <a
              href="/crm/customers"
              className="block px-4 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Go to CRM
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

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <StudioLayoutContent>{children}</StudioLayoutContent>
    </AuthGuard>
  );
}
