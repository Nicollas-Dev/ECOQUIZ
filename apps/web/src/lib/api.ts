import type { RoomSnapshot, Track } from "@ecoquiz/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Não foi possível concluir a solicitação.");
  }

  return response.json() as Promise<T>;
};

export const api = {
  getTracks: () => request<Track[]>("/api/tracks"),
  getRoom: (pin: string) => request<RoomSnapshot>(`/api/rooms/${pin}`),
  createRoom: (trackId: string) =>
    request<RoomSnapshot>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ trackId })
    })
};
