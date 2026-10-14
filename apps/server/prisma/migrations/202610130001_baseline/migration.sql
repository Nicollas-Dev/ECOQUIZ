CREATE TABLE IF NOT EXISTS "Track" (
 "id" TEXT PRIMARY KEY NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
 "description" TEXT NOT NULL, "icon" TEXT NOT NULL, "ods" TEXT NOT NULL,
 "accent" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Track_slug_key" ON "Track"("slug");
CREATE TABLE IF NOT EXISTS "Question" (
 "id" TEXT PRIMARY KEY NOT NULL, "trackId" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL,
 "prompt" TEXT NOT NULL, "explanation" TEXT NOT NULL, "ods" TEXT NOT NULL,
 "timeLimit" INTEGER NOT NULL DEFAULT 20, "correctOptionId" TEXT NOT NULL,
 FOREIGN KEY("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Option" (
 "id" TEXT PRIMARY KEY NOT NULL, "questionId" TEXT NOT NULL, "label" TEXT NOT NULL, "text" TEXT NOT NULL,
 FOREIGN KEY("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Question_trackId_idx" ON "Question"("trackId");
CREATE INDEX IF NOT EXISTS "Option_questionId_idx" ON "Option"("questionId");
