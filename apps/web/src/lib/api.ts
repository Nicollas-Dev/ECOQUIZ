import type { CreatedRoom, EditableQuestion, Ods, Quiz, QuizInput, QuizSummary, RoomSnapshot, Track } from "@ecoquiz/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export class RequestError extends Error {
  constructor(message: string, public issues: { path: (string | number)[]; message: string }[] = []) { super(message); }
}
let credentialPromise: Promise<string> | undefined;
export const creatorToken = async (): Promise<string> => {
  const existing = localStorage.getItem("ecoquiz:creator");
  if (existing) return existing;
  if (!credentialPromise) credentialPromise = request<{ token: string }>("/api/creators", { method: "POST" })
    .then(({ token }) => { localStorage.setItem("ecoquiz:creator", token); return token; })
    .finally(() => { credentialPromise = undefined; });
  return credentialPromise;
};
const request = async <T>(path: string, init?: RequestInit, authorized = false): Promise<T> => {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (authorized) headers.set("Authorization", `Bearer ${await creatorToken()}`);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new RequestError(body?.message ?? "Não foi possível concluir a solicitação.", body?.issues);
  }

  return response.json() as Promise<T>;
};

export const api = {
  getOds: () => request<Ods[]>("/api/ods"),
  getQuestions: (filters: { odsIds?: string[]; search?: string; difficulty?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.odsIds?.length) params.set("odsIds", filters.odsIds.join(","));
    if (filters.search) params.set("search", filters.search);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    return request<EditableQuestion[]>(`/api/questions?${params}`);
  },
  randomQuestions: (odsIds: string[], count: number, difficulty?: string) => request<EditableQuestion[]>("/api/questions/random", { method: "POST", body: JSON.stringify({ odsIds, count, difficulty: difficulty || undefined }) }),
  listQuizzes: () => request<QuizSummary[]>("/api/quizzes", undefined, true),
  getQuiz: (id: string) => request<Quiz>(`/api/quizzes/${id}`, undefined, true),
  saveQuiz: (input: QuizInput, id?: string, revision?: number) => request<Quiz>(id ? `/api/quizzes/${id}` : "/api/quizzes", { method: id ? "PUT" : "POST", body: JSON.stringify({ ...input, revision }) }, true),
  duplicateQuiz: (id: string) => request<Quiz>(`/api/quizzes/${id}/duplicate`, { method: "POST" }, true),
  deleteQuiz: (id: string) => request<{ ok: boolean }>(`/api/quizzes/${id}`, { method: "DELETE" }, true),
  createQuizRoom: async (quizId: string) => {
    const room = await request<CreatedRoom>("/api/rooms", { method: "POST", body: JSON.stringify({ quizId }) }, true);
    sessionStorage.setItem(`ecoquiz:host:${room.pin}`, room.hostToken);
    return room;
  },
  getTracks: () => request<Track[]>("/api/tracks"),
  getRoom: (pin: string) => request<RoomSnapshot>(`/api/rooms/${pin}`),
  createRoom: (trackId: string) =>
    request<CreatedRoom>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ trackId })
    }).then(room => { sessionStorage.setItem(`ecoquiz:host:${room.pin}`, room.hostToken); return room; })
};
