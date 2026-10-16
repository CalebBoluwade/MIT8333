import fs from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { SEED_CATEGORIES, SEED_ROLES } from "../src/db/seed-data";
import * as schema from "../src/db/schema";

export default async function setup() {
  for (const f of ["test.db", "test.db-journal", "test.db-wal", "test.db-shm"]) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  const db = drizzle(createClient({ url: "file:./test.db" }));
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.insert(schema.roles).values([...SEED_ROLES]);
  await db.insert(schema.categories).values([...SEED_CATEGORIES]);
}
