# Pulse-8 CRM Platform

Enterprise-grade, metadata-driven CRM platform built with Next.js 15.

## Architecture

- **Frontend & Backend**: Next.js 15 App Router
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **Cache/Pub-Sub**: Upstash Redis
- **Runtime**: Vercel Edge (read APIs) + Node.js (write APIs)
- **Real-time**: WebSocket gateway (separate Node service)

## Core Principle

**The UI is never hard-coded.** All forms, tables, views, and automations are rendered from published configuration that updates in real-time without page refresh.

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `JWT_SECRET` - Secret key for JWT tokens

3. **Generate and run migrations**:
```bash
npm run db:generate
npm run db:migrate
```

4. **Start development server**:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user/tenant

### Admin Config APIs (Node.js runtime)
- `GET /api/admin/config/:namespace/:entity/:key` - Get draft config
- `PUT /api/admin/config/:namespace/:entity/:key/draft` - Create/update draft
- `POST /api/admin/config/:namespace/:entity/:key/validate` - Validate config
- `POST /api/admin/config/publish` - Publish configs atomically

### Runtime Config API (Edge runtime)
- `GET /api/runtime/config?sinceVersion=number` - Get latest config snapshot

## Configuration Namespaces

- `form` - Form definitions
- `view` - Table/view definitions
- `trigger` - Automation triggers
- `condition` - Conditional logic
- `action` - Automation actions
- `approval` - Approval workflows
- `sla` - SLA policies
- `automation` - Complete automation definitions

## Development Status

✅ **Phase 1: Foundation** (Complete)
- Database schema with Drizzle ORM
- Auth & tenant middleware with RBAC
- Config CRUD APIs (draft, validate, publish)
- Snapshot system for runtime config

✅ **Phase 2: Real-time Sync** (Complete)
- Redis pub/sub integration
- WebSocket gateway service
- ConfigProvider with Zustand store
- Hot-update capability

✅ **Phase 3: Automation Studio** (Complete)
- Studio shell UI with navigation
- All 6 builders complete (Form, View, Trigger, Condition, Action, Approval/SLA)
- Enhanced Automations Composer
- Draft management UI
- Version history & rollback
- Audit log viewer

✅ **Phase 4: End-User CRM** (Complete)
- FormRenderer component
- TableViewRenderer component
- Customer, Deals, Cases pages
- Inbox page
- Dashboard page
- Customer 360 detail page
- SLA indicators

✅ **Phase 5: Additional Features** (Complete)
- SLA timers/indicators
- CRM APIs (Customers, Deals, Cases, Inbox, Dashboard)
- Version history & rollback
- Draft management
- Audit logging

## Quick Start Example

1. **Create a form config** (via Automation Studio or API):
```bash
PUT /api/admin/config/form/customer/customer-form/draft
{
  "config": {
    "namespace": "form",
    "entity": "customer",
    "key": "customer-form",
    "title": "Customer Form",
    "fields": [
      {
        "id": "name",
        "label": "Company Name",
        "type": "text",
        "required": true,
        "order": 0
      },
      {
        "id": "email",
        "label": "Email",
        "type": "email",
        "required": true,
        "order": 1
      }
    ]
  }
}
```

2. **Publish the config**:
```bash
POST /api/admin/config/publish
{
  "configItemIds": ["<config-item-id>"]
}
```

3. **Use in CRM page**:
```tsx
<FormRenderer entity="customer" key="customer-form" onSubmit={handleSubmit} />
```

The form will render automatically from the published config, and updates will sync in real-time!

## License

Proprietary

