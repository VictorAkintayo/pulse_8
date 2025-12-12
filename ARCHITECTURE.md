# Pulse-8 Architecture

## Core Principle: Metadata-Driven UI

**The UI is never hard-coded.** All forms, tables, views, SLAs, approvals, routing, and automations are rendered from published configuration that updates in real-time without page refresh.

## System Architecture

### Runtime Boundaries

- **Edge Runtime** (`export const runtime = "edge"`):
  - `GET /api/runtime/config` - Read-only config snapshot API
  - All read-heavy endpoints

- **Node.js Runtime** (`export const runtime = "nodejs"`):
  - `POST /api/admin/config/publish` - Config publishing
  - All write endpoints
  - Draft CRUD operations

- **Separate Node Service**:
  - WebSocket gateway (`services/ws-gateway/`)
  - Background job processing
  - Automation execution

### Data Flow

1. **Admin publishes config**:
   ```
   Admin → PUT /api/admin/config/:namespace/:entity/:key/draft
   Admin → POST /api/admin/config/publish
   ```

2. **Publish API**:
   - Validates all configs (structure + references)
   - Creates immutable versions
   - Updates config item status to "published"
   - Builds new snapshot atomically
   - Emits Redis pub/sub event: `config.published`

3. **Realtime sync**:
   ```
   Redis pub/sub → WebSocket Gateway → Connected Clients
   ```

4. **Client receives update**:
   - WebSocket message received
   - ConfigProvider fetches new snapshot
   - Zustand store updated
   - UI re-renders automatically (no refresh)

### Configuration Model

#### Config Items (Drafts)
- Mutable
- Stored in `config_items` table
- Status: `draft`, `published`, `archived`

#### Config Versions (Published)
- Immutable
- Stored in `config_versions` table
- Sequential version numbers per config item

#### Config Snapshots (Runtime State)
- Complete tenant config state
- Stored in `config_snapshots` table
- Incremental version numbers
- Structure: `{ namespace: { entity: { key: config } } }`

### Configuration Namespaces

1. **form** - Form definitions with fields, validation, submit actions
2. **view** - Table/view definitions with columns, filters, sorting
3. **trigger** - Automation triggers (create, update, delete, webhook, schedule)
4. **condition** - Conditional logic rules
5. **action** - Automation actions (create/update records, send email, webhook, etc.)
6. **approval** - Approval workflow definitions
7. **sla** - SLA policy definitions with timers
8. **automation** - Complete automation compositions

### Tenant Isolation

- All data is tenant-scoped via `tenant_id`
- Server-side enforcement in middleware
- RBAC: Admin > Manager > Agent > Read-only
- JWT tokens include tenant context

### Real-time Updates

1. Admin publishes config
2. API creates snapshot version N+1
3. Redis pub/sub emits `config.published` event
4. WebSocket gateway receives event (via polling or webhook)
5. Gateway broadcasts to all connected clients for that tenant
6. Clients receive WebSocket message
7. ConfigProvider fetches new snapshot via `/api/runtime/config?sinceVersion=N`
8. Zustand store updates
9. React components re-render with new config

## Component Architecture

### Renderers (Phase 4)

- **FormRenderer**: Renders forms from `form` config
  - Uses `useFormConfig(entity, key)` hook
  - Dynamically renders fields based on config
  - Handles validation, submission

- **TableViewRenderer**: Renders tables from `view` config
  - Uses `useViewConfig(entity, key)` hook
  - Dynamically renders columns
  - Handles sorting, filtering (from config)

### Automation Studio (Phase 3)

- **6 Builders**: Form, View, Trigger, Condition, Action, Approval/SLA
- **Automations Composer**: Ties builders together
- **Publish Flow**: Draft → Validate → Publish

## Database Schema

### Core Tables
- `tenants` - Tenant information
- `users` - Global user accounts
- `memberships` - User-tenant-role relationships

### Config Tables
- `config_items` - Draft configurations
- `config_versions` - Immutable published versions
- `config_snapshots` - Complete tenant config state
- `config_publish_log` - Audit trail of publishes

### CRM Tables
- `customers` - Customer records (JSONB data)
- `deals` - Deal records (JSONB data)
- `cases` - Case records (JSONB data)

All CRM tables use JSONB for flexible, schema-less data that conforms to form configs.

## Security

- JWT-based authentication
- Tenant isolation enforced server-side
- RBAC with role hierarchy
- All admin APIs require `admin` role
- Config validation prevents invalid references

## Scalability Considerations

- Edge runtime for read-heavy endpoints (Vercel Edge)
- Node.js runtime for write operations
- Separate WebSocket service for horizontal scaling
- Redis for pub/sub and caching
- JSONB for flexible schema evolution
- Immutable config versions for auditability

