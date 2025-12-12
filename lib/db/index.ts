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

// Create a properly typed proxy that binds methods to the actual db instance
const dbProxy = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const dbInstance = getDb();
    const value = dbInstance[prop as keyof typeof dbInstance];
    
    // If the value is a function, bind it to the db instance to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    
    // For non-function properties (like db.query), return them as-is
    // If it's an object, we might need to proxy it too, but drizzle's query is already an object
    return value;
  },
});

export const db = dbProxy as ReturnType<typeof drizzle<typeof schema>>;

export type Database = typeof db;
export * from "./schema";

