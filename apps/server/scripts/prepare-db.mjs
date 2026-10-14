import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

process.env.DATABASE_URL ??= "file:./dev.db";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(scriptDir, "..");

const run = (command, args) => {
  const executable = join(serverDir, "node_modules", ".bin", process.platform === "win32" ? `${command}.CMD` : command);
  const quote = (value) => `"${String(value).replaceAll('"', '\\"')}"`;
  const result = spawnSync([quote(executable), ...args.map(quote)].join(" "), {
    cwd: serverDir,
    env: process.env,
    shell: true,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const resolveDatabasePath = () => {
  const value = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!value.startsWith("file:")) {
    throw new Error("db:prepare local aceita apenas DATABASE_URL SQLite no formato file:.");
  }

  const sqlitePath = value.replace(/^file:/, "");
  return isAbsolute(sqlitePath) ? sqlitePath : resolve(serverDir, "prisma", sqlitePath);
};

const prepareSqlite = () => {
  const database = new DatabaseSync(resolveDatabasePath());

  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS "Track" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "icon" TEXT NOT NULL,
      "ods" TEXT NOT NULL,
      "accent" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Track_slug_key" ON "Track"("slug");

    CREATE TABLE IF NOT EXISTS "Question" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trackId" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL,
      "prompt" TEXT NOT NULL,
      "explanation" TEXT NOT NULL,
      "ods" TEXT NOT NULL,
      "timeLimit" INTEGER NOT NULL DEFAULT 20,
      "correctOptionId" TEXT NOT NULL,
      CONSTRAINT "Question_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "Question_trackId_idx" ON "Question"("trackId");

    CREATE TABLE IF NOT EXISTS "Option" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "questionId" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "text" TEXT NOT NULL,
      CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "Option_questionId_idx" ON "Option"("questionId");
  `);

  database.close();
};

run("prisma", ["generate"]);
prepareSqlite();
run("tsx", [join("prisma", "seed.ts")]);
