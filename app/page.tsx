import Link from "next/link";
import Image from "next/image";
import { Button } from "@/lib/components/ui/button";
import { Card, CardContent } from "@/lib/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            
            <Image src="/pulse_8_logo.jpg" alt="Pulse-8" width={200} height={200} />

          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Pulse-8
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade CRM platform that adapts to your business
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Configure forms, automations, and workflows without code. 
              Changes go live instantly, no deployment needed.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/login?redirect=/studio">Open Automation Studio</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/auth/login?redirect=/crm/customers">Go to CRM</Link>
            </Button>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Link href="/auth/register" className="text-sm text-muted-foreground hover:text-primary">
              Create account
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary">
              Sign in
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Configuration changes propagate instantly to all users. No refresh needed.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">No-Code Configuration</h3>
              <p className="text-muted-foreground">
                Build forms, views, and automations through our visual Automation Studio.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-muted-foreground">
                Enterprise-ready with complete tenant isolation and role-based access control.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl w-full mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Built with Next.js 15 • Powered by Neon PostgreSQL • Real-time sync via WebSocket
          </p>
        </div>
      </div>
    </main>
  );
}
