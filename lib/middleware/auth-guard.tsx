"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function AuthGuard({ children, redirectTo = "/auth/login" }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Not authenticated, redirect to login with return URL
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Token exists, consider authenticated
    // In production, you might want to verify the token is still valid
    setIsAuthenticated(true);
  }, [router, pathname, redirectTo]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

