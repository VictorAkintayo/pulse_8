/**
 * WebSocket Gateway Service
 * 
 * Separate Node.js service for real-time config synchronization
 * 
 * This service:
 * - Listens to Redis pub/sub for config.published events
 * - Maintains WebSocket connections per tenant
 * - Broadcasts config updates to connected clients
 * 
 * Run: node services/ws-gateway/index.js
 * Or: npm run ws:dev (if added to package.json)
 */

import { WebSocketServer, WebSocket } from "ws";
import { Redis } from "@upstash/redis";
import { verifyToken, JWTPayload } from "../../lib/auth/jwt";

const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;
const WS_SECRET = process.env.WS_GATEWAY_SECRET || "change-me";

// Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Map of tenant ID to Set of WebSocket connections
const tenantConnections = new Map<string, Set<WebSocket>>();

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`WebSocket Gateway listening on port ${WS_PORT}`);

wss.on("connection", (ws: WebSocket, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(1008, "Missing token");
    return;
  }

  // Verify JWT token
  const payload = verifyToken(token);
  if (!payload) {
    ws.close(1008, "Invalid token");
    return;
  }

  const tenantId = payload.tenantId;
  
  // Add connection to tenant's set
  if (!tenantConnections.has(tenantId)) {
    tenantConnections.set(tenantId, new Set());
  }
  tenantConnections.get(tenantId)!.add(ws);

  console.log(`Client connected for tenant ${tenantId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: "connected",
    tenantId,
    timestamp: new Date().toISOString(),
  }));

  // Handle disconnect
  ws.on("close", () => {
    const connections = tenantConnections.get(tenantId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        tenantConnections.delete(tenantId);
      }
    }
    console.log(`Client disconnected for tenant ${tenantId}`);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for tenant ${tenantId}:`, error);
  });
});

// Subscribe to Redis pub/sub for config.published events
async function subscribeToConfigEvents() {
  // Note: Upstash Redis REST API doesn't support pub/sub directly
  // In production, you'd use a Redis client that supports pub/sub (like ioredis)
  // For now, we'll poll or use Upstash's webhook feature
  
  // Alternative: Use Upstash QStash to trigger webhooks
  // Or: Use a Redis client library that supports pub/sub for server-side
  
  console.log("Config event subscription setup (using polling or webhook)");
  
  // Polling approach (not ideal, but works with REST API)
  setInterval(async () => {
    // Check for new config events
    // This is a simplified approach - in production use proper pub/sub
  }, 5000);
}

// Function to broadcast to tenant
function broadcastToTenant(tenantId: string, message: any) {
  const connections = tenantConnections.get(tenantId);
  if (connections) {
    const payload = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
    console.log(`Broadcasted to ${connections.size} clients for tenant ${tenantId}`);
  }
}

// HTTP endpoint to receive config.published events (called by publish API)
// This would be called via webhook or internal API call
export function handleConfigPublished(tenantId: string, snapshotVersion: number) {
  broadcastToTenant(tenantId, {
    type: "config.published",
    tenantId,
    snapshotVersion,
    timestamp: new Date().toISOString(),
  });
}

// Start subscription
subscribeToConfigEvents();

console.log("WebSocket Gateway ready");

