import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { QUIZ_LIMITS, type EditableQuestion, type Ods, type Quiz, type QuizInput, type QuizSummary } from "@ecoquiz/shared";
import { prisma } from "./prisma.js";

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const text = (max: number) => z.string().trim().min(1, "Preencha este campo.").max(max, `Use até ${max} caracteres.`);
const identifier = z.string().min(1).max(150);
const time = z.number().int().min(QUIZ_LIMITS.minTime).max(QUIZ_LIMITS.maxTime);
export const questionSchema = z.object({
  id: identifier, prompt: text(QUIZ_LIMITS.prompt),
  options: z.array(z.object({ id: identifier, label: z.enum(["A", "B", "C", "D"]), text: text(QUIZ_LIMITS.option) })).min(2).max(4),
  correctOptionId: identifier, explanation: z.string().trim().max(QUIZ_LIMITS.explanation),
  difficulty: z.enum(["easy", "medium", "hard"]), timeLimit: time,
  origin: z.enum(["ods", "custom", "legacy"]), odsId: identifier.nullish(), sourceQuestionId: identifier.nullish()
}).superRefine((q, ctx) => {
  if (q.options.filter(o => o.id === q.correctOptionId).length !== 1) ctx.addIssue({ code: "custom", path: ["correctOptionId"], message: "Selecione exatamente uma resposta correta." });
  if (new Set(q.options.map(o => o.id)).size !== q.options.length || new Set(q.options.map(o => o.label)).size !== q.options.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Alternativas devem ter identificadores e letras únicos." });
});
export const quizSchema = z.object({
  title: text(QUIZ_LIMITS.title), description: z.string().trim().max(1000), category: z.string().trim().max(80),
  odsIds: z.array(identifier).max(17), defaultTimeLimit: time, randomOrder: z.boolean(),
  questions: z.array(questionSchema).max(QUIZ_LIMITS.questions)
}).superRefine((quiz, ctx) => {
  if (new Set(quiz.questions.map(q => q.id)).size !== quiz.questions.length) ctx.addIssue({ code: "custom", path: ["questions"], message: "Perguntas devem ter identificadores únicos." });
});

export const createCreator = async () => {
  const token = randomBytes(32).toString("hex");
  await prisma.creator.create({ data: { id: randomUUID(), tokenHash: hashToken(token) } });
  return { token };
};
export const authorizeCreator = async (authorization?: string) => {
  const token = authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new ApiError("Credencial de edição necessária.", 401);
  const creator = await prisma.creator.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!creator) throw new ApiError("Credencial de edição inválida.", 401);
  return creator.id;
};
export const listOds = async (): Promise<Ods[]> => (await prisma.ods.findMany({ orderBy: { number: "asc" }, include: { _count: { select: { questions: true } } } }))
  .map(({ _count, ...ods }) => ({ ...ods, questionCount: _count.questions }));
export const listBank = async (filters: { odsIds?: string[]; search?: string; difficulty?: string }) => {
  const rows = await prisma.question.findMany({
    where: { origin: "ods", ...(filters.odsIds?.length ? { odsId: { in: filters.odsIds } } : {}),
      ...(filters.search ? { OR: [{ prompt: { contains: filters.search } }, { explanation: { contains: filters.search } }] } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}) },
    include: { options: { orderBy: { label: "asc" } } }, orderBy: [{ odsId: "asc" }, { sortOrder: "asc" }]
  });
  return rows.map(q => ({ id: q.id, prompt: q.prompt, options: q.options.map(o => ({ id: o.id, label: o.label as "A" | "B" | "C" | "D", text: o.text })),
    correctOptionId: q.correctOptionId, explanation: q.explanation, difficulty: q.difficulty as EditableQuestion["difficulty"],
    timeLimit: q.timeLimit, origin: "ods" as const, odsId: q.odsId, sourceQuestionId: q.id, sourceUrl: q.sourceUrl,
    createdAt: q.createdAt.toISOString(), updatedAt: q.updatedAt.toISOString() }));
};
export const shuffled = <T>(values: T[]): T[] => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = randomInt(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
};
export const randomBank = async (odsIds: string[], count: number, difficulty?: string) => {
  const pool = await listBank({ odsIds, difficulty });
  if (count > pool.length) throw new ApiError(`Há ${pool.length} questões disponíveis para esta seleção. Escolha uma quantidade menor.`);
  return shuffled(pool).slice(0, count);
};

const includeQuestions = { questions: { orderBy: { sortOrder: "asc" as const } } };
type QuizRow = Awaited<ReturnType<typeof prisma.quiz.findFirstOrThrow>> & { questions: Awaited<ReturnType<typeof prisma.quizQuestion.findMany>> };
const toQuiz = (row: QuizRow): Quiz => ({
  id: row.id, title: row.title, description: row.description, category: row.category, odsIds: JSON.parse(row.odsIds),
  defaultTimeLimit: row.defaultTimeLimit, randomOrder: row.randomOrder, revision: row.revision,
  createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  questions: row.questions.map(q => ({ id: q.id, prompt: q.prompt, options: JSON.parse(q.options), correctOptionId: q.correctOptionId,
    explanation: q.explanation, difficulty: q.difficulty as EditableQuestion["difficulty"], timeLimit: q.timeLimit,
    origin: q.origin as EditableQuestion["origin"], odsId: q.odsId, sourceQuestionId: q.sourceQuestionId,
    createdAt: q.createdAt.toISOString(), updatedAt: q.updatedAt.toISOString() }))
});
export const getQuiz = async (creatorId: string, id: string): Promise<Quiz> => {
  const row = await prisma.quiz.findFirst({ where: { id, creatorId }, include: includeQuestions });
  if (!row) throw new ApiError("Quiz não encontrado ou sem permissão de edição.", 404);
  return toQuiz(row);
};
export const listQuizzes = async (creatorId: string): Promise<QuizSummary[]> => {
  const rows = await prisma.quiz.findMany({ where: { creatorId }, orderBy: { updatedAt: "desc" }, include: includeQuestions });
  return rows.map(row => { const { questions, ...quiz } = toQuiz(row); return { ...quiz, questionCount: questions.length }; });
};
const validateReferences = async (input: QuizInput) => {
  const odsIds = [...new Set([...input.odsIds, ...input.questions.map(q => q.odsId).filter((id): id is string => Boolean(id))])];
  if (await prisma.ods.count({ where: { id: { in: odsIds } } }) !== odsIds.length) throw new ApiError("ODS associado não existe.");
  const sources = [...new Set(input.questions.map(q => q.sourceQuestionId).filter((id): id is string => Boolean(id)))];
  if (await prisma.question.count({ where: { id: { in: sources } } }) !== sources.length) throw new ApiError("Questão de origem não encontrada.");
};
const questionData = (input: QuizInput, existing = new Map<string, Date>()) => input.questions.map((q, i) => ({
  id: existing.has(q.id) ? q.id : randomUUID(), createdAt: existing.get(q.id), sortOrder: i, prompt: q.prompt, options: JSON.stringify(q.options.map((o, j) => ({ ...o, label: ["A", "B", "C", "D"][j] }))),
  correctOptionId: q.correctOptionId, explanation: q.explanation, difficulty: q.difficulty, timeLimit: q.timeLimit,
  origin: q.sourceQuestionId ? q.origin : "custom", odsId: q.odsId ?? null, sourceQuestionId: q.sourceQuestionId ?? null
}));
const quizData = (input: QuizInput) => ({ title: input.title, description: input.description, category: input.category,
  odsIds: JSON.stringify([...new Set(input.odsIds)]), defaultTimeLimit: input.defaultTimeLimit, randomOrder: input.randomOrder });
export const createQuiz = async (creatorId: string, input: QuizInput) => {
  await validateReferences(input);
  const row = await prisma.quiz.create({ data: { id: randomUUID(), creatorId, ...quizData(input), questions: { create: questionData(input) } }, include: includeQuestions });
  return toQuiz(row);
};
export const updateQuiz = async (creatorId: string, id: string, input: QuizInput, revision: number) => {
  await validateReferences(input);
  await prisma.$transaction(async tx => {
    const result = await tx.quiz.updateMany({ where: { id, creatorId, revision }, data: { ...quizData(input), revision: { increment: 1 } } });
    if (!result.count) throw new ApiError("O quiz foi alterado em outra aba ou você não tem permissão. Recarregue antes de salvar.", 409);
    const existing = await tx.quizQuestion.findMany({ where: { quizId: id }, select: { id: true, createdAt: true } });
    await tx.quizQuestion.deleteMany({ where: { quizId: id } });
    await tx.quizQuestion.createMany({ data: questionData(input, new Map(existing.map(q => [q.id, q.createdAt]))).map(q => ({ ...q, quizId: id })) });
  });
  return getQuiz(creatorId, id);
};
export const deleteQuiz = async (creatorId: string, id: string) => {
  const result = await prisma.quiz.deleteMany({ where: { id, creatorId } });
  if (!result.count) throw new ApiError("Quiz não encontrado ou sem permissão.", 404);
};
