# Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Upstash Redis account
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# JWT Secret (generate a strong random string)
JWT_SECRET=your-secret-key-change-in-production

# WebSocket Gateway (optional, for real-time sync)
WS_GATEWAY_URL=http://localhost:3001
WS_GATEWAY_SECRET=your-ws-gateway-secret
```

## Step 3: Database Setup

### Generate Migrations

```bash
npm run db:generate
```

This creates migration files in the `drizzle/` directory based on `lib/db/schema.ts`.

### Apply Migrations

```bash
npm run db:migrate
```

Or manually run the SQL files against your database.

## Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Step 5: (Optional) Start WebSocket Gateway

For real-time config sync, start the separate WebSocket gateway:

```bash
cd services/ws-gateway
npm install
npm run dev
```

The gateway will run on port 3001 (or `WS_PORT` env var).

## Step 6: Create First User & Tenant

Use the registration API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password",
    "firstName": "Admin",
    "lastName": "User",
    "tenantName": "My Company"
  }'
```

Save the returned `token` for API calls.

## Step 7: Create Your First Config

### Via API:

```bash
curl -X PUT http://localhost:3000/api/admin/config/form/customer/customer-form/draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "config": {
      "namespace": "form",
      "entity": "customer",
      "key": "customer-form",
      "title": "Customer Registration Form",
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
          "label": "Email Address",
          "type": "email",
          "required": true,
          "order": 1
        }
      ]
    }
  }'
```

### Via Automation Studio UI:

1. Navigate to `http://localhost:3000/studio/forms`
2. Fill in entity, key, and title
3. Add fields using the builder
4. Click "Save Draft"
5. Click "Validate" to check for errors
6. Click "Publish" to make it live

## Step 8: Use Config in CRM

Navigate to `http://localhost:3000/crm/customers` - the form and table will render from your published config!

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure SSL mode is set (`?sslmode=require`)
- Check firewall rules allow connections

### Redis Connection Issues

- Verify Upstash credentials
- Check REST API is enabled (not just Redis protocol)

### WebSocket Not Connecting

- Ensure WS gateway is running
- Check `WS_GATEWAY_URL` matches gateway port
- Verify CORS settings if accessing from different origin

### Config Not Updating

- Check Redis pub/sub is working
- Verify WebSocket connection in browser console
- Check ConfigProvider is wrapping your app
- Ensure token is valid and includes tenant context

## Next Steps

- Read `ARCHITECTURE.md` for system design details
- Explore Automation Studio at `/studio`
- Build custom forms and views
- Create automations to automate workflows

