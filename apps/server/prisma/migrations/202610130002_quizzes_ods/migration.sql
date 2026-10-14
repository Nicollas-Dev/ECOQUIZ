CREATE TABLE "Ods" (
 "id" TEXT PRIMARY KEY NOT NULL, "number" INTEGER NOT NULL, "name" TEXT NOT NULL,
 "description" TEXT NOT NULL, "color" TEXT NOT NULL, "icon" TEXT NOT NULL
);
CREATE UNIQUE INDEX "Ods_number_key" ON "Ods"("number");
CREATE TABLE "new_Question" (
 "id" TEXT PRIMARY KEY NOT NULL, "trackId" TEXT, "sortOrder" INTEGER NOT NULL,
 "prompt" TEXT NOT NULL, "explanation" TEXT NOT NULL, "ods" TEXT NOT NULL,
 "timeLimit" INTEGER NOT NULL DEFAULT 20, "correctOptionId" TEXT NOT NULL,
 "difficulty" TEXT NOT NULL DEFAULT 'easy', "origin" TEXT NOT NULL DEFAULT 'legacy',
 "odsId" TEXT, "sourceUrl" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 FOREIGN KEY("odsId") REFERENCES "Ods"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Question" (id,trackId,sortOrder,prompt,explanation,ods,timeLimit,correctOptionId)
 SELECT id,trackId,sortOrder,prompt,explanation,ods,timeLimit,correctOptionId FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE INDEX "Question_trackId_idx" ON "Question"("trackId");
CREATE INDEX "Question_odsId_difficulty_idx" ON "Question"("odsId","difficulty");
CREATE TABLE "Creator" (
 "id" TEXT PRIMARY KEY NOT NULL, "tokenHash" TEXT NOT NULL, "userId" TEXT,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Creator_tokenHash_key" ON "Creator"("tokenHash");
CREATE TABLE "Quiz" (
 "id" TEXT PRIMARY KEY NOT NULL, "creatorId" TEXT NOT NULL, "title" TEXT NOT NULL,
 "description" TEXT NOT NULL DEFAULT '', "category" TEXT NOT NULL DEFAULT '', "odsIds" TEXT NOT NULL DEFAULT '[]',
 "defaultTimeLimit" INTEGER NOT NULL DEFAULT 20, "randomOrder" BOOLEAN NOT NULL DEFAULT false,
 "revision" INTEGER NOT NULL DEFAULT 1,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Quiz_creatorId_updatedAt_idx" ON "Quiz"("creatorId","updatedAt");
CREATE TABLE "QuizQuestion" (
 "id" TEXT PRIMARY KEY NOT NULL, "quizId" TEXT NOT NULL, "sourceQuestionId" TEXT, "sortOrder" INTEGER NOT NULL,
 "prompt" TEXT NOT NULL, "options" TEXT NOT NULL, "correctOptionId" TEXT NOT NULL,
 "explanation" TEXT NOT NULL DEFAULT '', "difficulty" TEXT NOT NULL DEFAULT 'easy',
 "timeLimit" INTEGER NOT NULL DEFAULT 20, "origin" TEXT NOT NULL DEFAULT 'custom', "odsId" TEXT,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY("sourceQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "QuizQuestion_quizId_sortOrder_key" ON "QuizQuestion"("quizId","sortOrder");
