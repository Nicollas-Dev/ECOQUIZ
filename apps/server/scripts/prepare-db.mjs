import "dotenv/config";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

process.env.DATABASE_URL ??= "file:./dev.db";
const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (relative, args) => {
  const result = spawnSync(process.execPath, [join(serverDir, relative), ...args], { cwd: serverDir, env: process.env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const url = process.env.DATABASE_URL;
if (!url.startsWith("file:")) throw new Error("DATABASE_URL deve usar SQLite (file:).");
const path = url.slice(5);
const database = new DatabaseSync(isAbsolute(path) ? path : resolve(serverDir, "prisma", path));
database.exec('PRAGMA foreign_keys = OFF; CREATE TABLE IF NOT EXISTS "_EcoquizMigration" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, appliedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);');
const migrationsDir = join(serverDir, "prisma", "migrations");
for (const entry of readdirSync(migrationsDir, { withFileTypes: true }).filter(e => e.isDirectory()).sort((a,b) => a.name.localeCompare(b.name))) {
  const sql = readFileSync(join(migrationsDir, entry.name, "migration.sql"), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const applied = database.prepare('SELECT checksum FROM "_EcoquizMigration" WHERE name = ?').get(entry.name);
  if (applied) {
    if (applied.checksum !== checksum) throw new Error(`Migration já aplicada foi modificada: ${entry.name}`);
    continue;
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    database.exec(sql);
    if (database.prepare("PRAGMA foreign_key_check").all().length) throw new Error("Migration violou relacionamentos.");
    database.prepare('INSERT INTO "_EcoquizMigration" (name, checksum) VALUES (?, ?)').run(entry.name, checksum);
    database.exec("COMMIT");
    console.log(`Migration aplicada: ${entry.name}`);
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}
database.exec("PRAGMA foreign_keys = ON");
database.close();
if (!process.argv.includes("--migrate-only")) {
  run("node_modules/prisma/build/index.js", ["generate"]);
  run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
}
