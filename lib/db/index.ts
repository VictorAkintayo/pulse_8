import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Lazy initialization to avoid errors during build time
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!process.env.DATABASE_URL) {
    // During build time, DATABASE_URL might not be set
    // Return a typed mock that will fail at runtime if actually used
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  
  return _db;
}

// Create a properly typed proxy
const dbProxy = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>];
  },
});

export const db = dbProxy as ReturnType<typeof drizzle<typeof schema>>;

export type Database = typeof db;
export * from "./schema";

