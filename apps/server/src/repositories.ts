import type { PublicQuestion, Question, QuizOption, Track } from "@ecoquiz/shared";
import { prisma } from "./prisma.js";

const parseOds = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const toTrack = (
  track: Awaited<ReturnType<typeof prisma.track.findFirstOrThrow>>,
  questionCount?: number
): Track => ({
  id: track.id as Track["id"],
  slug: track.slug,
  name: track.name,
  description: track.description,
  icon: track.icon as Track["icon"],
  ods: parseOds(track.ods),
  accent: track.accent,
  questionCount
});

const optionLabelOrder = (label: string) => ["A", "B", "C", "D"].indexOf(label);

const toQuestion = (
  question: Awaited<ReturnType<typeof prisma.question.findMany>>[number] & {
    options: Array<{ id: string; label: string; text: string }>;
  }
): Question => ({
  id: question.id,
  trackId: question.trackId as Track["id"],
  prompt: question.prompt,
  options: [...question.options]
    .sort((a, b) => optionLabelOrder(a.label) - optionLabelOrder(b.label))
    .map((item) => ({
      id: item.id,
      label: item.label as QuizOption["label"],
      text: item.text
    })),
  correctOptionId: question.correctOptionId,
  explanation: question.explanation,
  ods: question.ods,
  timeLimit: question.timeLimit
});

export const getTracks = async (): Promise<Track[]> => {
  const records = await prisma.track.findMany({
    include: {
      _count: {
        select: {
          questions: true
        }
      }
    },
    orderBy: {
      sortOrder: "asc"
    }
  });

  return records.map((track) => toTrack(track, track._count.questions));
};

export const getTrackWithQuestions = async (
  trackId: string
): Promise<{ track: Track; questions: Question[] } | null> => {
  const record = await prisma.track.findUnique({
    where: {
      id: trackId
    },
    include: {
      questions: {
        include: {
          options: true
        },
        orderBy: {
          sortOrder: "asc"
        }
      }
    }
  });

  if (!record) {
    return null;
  }

  return {
    track: toTrack(record, record.questions.length),
    questions: record.questions.map(toQuestion)
  };
};

export const redactQuestion = (question: Question): PublicQuestion => ({
  id: question.id,
  trackId: question.trackId,
  prompt: question.prompt,
  options: question.options,
  ods: question.ods,
  timeLimit: question.timeLimit
});
