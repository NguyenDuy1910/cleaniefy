import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import { requiredServerEnv } from "@/lib/config/env";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

function databaseUrl() {
  return requiredServerEnv("DATABASE_URL");
}

export function db() {
  if (!database) {
    const pool = new Pool({ connectionString: databaseUrl() });
    database = drizzle({ client: pool, schema });
  }
  return database;
}
