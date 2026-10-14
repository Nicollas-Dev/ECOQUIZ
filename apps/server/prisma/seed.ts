import { PrismaClient } from "@prisma/client";
import { questions, tracks } from "../src/data/content.js";
import { bankQuestions, odsCategories } from "../src/data/odsContent.js";

process.env.DATABASE_URL ??= "file:./dev.db";

const prisma = new PrismaClient();

const main = async () => {
  for (const [trackIndex, track] of tracks.entries()) {
    await prisma.track.upsert({
      where: { id: track.id }, update: {},
      create: {
        id: track.id,
        slug: track.slug,
        name: track.name,
        description: track.description,
        icon: track.icon,
        ods: JSON.stringify(track.ods),
        accent: track.accent,
        sortOrder: trackIndex + 1
      }
    });
  }

  for (const [questionIndex, question] of questions.entries()) {
    await prisma.question.upsert({
      where: { id: question.id }, update: {},
      create: {
        id: question.id,
        trackId: question.trackId,
        sortOrder: questionIndex + 1,
        prompt: question.prompt,
        explanation: question.explanation,
        ods: question.ods,
        timeLimit: question.timeLimit,
        correctOptionId: question.correctOptionId,
        options: {
          create: question.options.map((item) => ({
            id: item.id,
            label: item.label,
            text: item.text
          }))
        }
      }
    });
  }
  for (const ods of odsCategories) {
    await prisma.ods.upsert({ where: { id: ods.id }, update: {}, create: ods });
  }
  for (const [index, question] of bankQuestions.entries()) {
    await prisma.question.upsert({ where: { id: question.id }, update: {}, create: {
      id: question.id, odsId: question.odsId, sortOrder: index, prompt: question.prompt,
      explanation: question.explanation, ods: question.odsId.replace("ods-", "ODS "),
      difficulty: question.difficulty, origin: "ods", timeLimit: question.timeLimit,
      correctOptionId: question.correctOptionId, sourceUrl: question.sourceUrl,
      options: { create: question.options }
    } });
  }
  console.log(`Seed concluído: ${odsCategories.length} ODS, ${bankQuestions.length} questões ODS. Dados existentes preservados.`);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
