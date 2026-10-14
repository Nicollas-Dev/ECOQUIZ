import { QUIZ_LIMITS, type EditableQuestion, type QuizInput } from "@ecoquiz/shared";

export const blankQuiz = (): QuizInput => ({ title: "", description: "", category: "", odsIds: [], defaultTimeLimit: 20, randomOrder: false, questions: [] });
export const blankQuestion = (timeLimit: number): EditableQuestion => ({ id: crypto.randomUUID(), prompt: "", options: ["A", "B"].map(label => ({ id: crypto.randomUUID(), label: label as "A" | "B", text: "" })), correctOptionId: "", explanation: "", difficulty: "easy", origin: "custom", timeLimit });
export const copyQuestion = (q: EditableQuestion): EditableQuestion => {
  const options = q.options.map(o => ({ ...o, id: crypto.randomUUID() }));
  return { ...q, id: crypto.randomUUID(), options, correctOptionId: options[q.options.findIndex(o => o.id === q.correctOptionId)]?.id ?? "" };
};
export const validateQuiz = (quiz: QuizInput): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!quiz.title.trim()) errors.title = "Dê um título ao quiz.";
  if (quiz.title.length > QUIZ_LIMITS.title) errors.title = `Use até ${QUIZ_LIMITS.title} caracteres.`;
  if (!Number.isInteger(quiz.defaultTimeLimit) || quiz.defaultTimeLimit < 10 || quiz.defaultTimeLimit > 120) errors.defaultTimeLimit = "Use de 10 a 120 segundos.";
  quiz.questions.forEach((q, i) => {
    const prefix = `questions.${i}`;
    if (!q.prompt.trim()) errors[`${prefix}.prompt`] = "Escreva o enunciado.";
    q.options.forEach((o,j) => { if (!o.text.trim()) errors[`${prefix}.options.${j}.text`] = "Preencha a alternativa."; });
    if (q.options.length < 2 || q.options.length > 4) errors[`${prefix}.options`] = "Use de 2 a 4 alternativas.";
    if (q.options.filter(o => o.id === q.correctOptionId).length !== 1) errors[`${prefix}.correctOptionId`] = "Selecione uma resposta correta.";
    if (!Number.isInteger(q.timeLimit) || q.timeLimit < 10 || q.timeLimit > 120) errors[`${prefix}.timeLimit`] = "Use de 10 a 120 segundos.";
  });
  return errors;
};
export const difficultyLabels = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
export const readSelection = (): EditableQuestion[] => {
  try { return JSON.parse(sessionStorage.getItem("ecoquiz:selection") ?? "[]"); } catch { return []; }
};
