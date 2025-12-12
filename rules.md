Use Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui for UI.

Postgres is source of truth. Redis for cache/presence.

All tenant-scoped data must include tenant_id and be enforced server-side.

Config publishing must emit events and invalidate caches.

Any schema change must include migration + model + API resource + tests.