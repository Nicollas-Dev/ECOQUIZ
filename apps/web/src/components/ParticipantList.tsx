import type { Participant } from "@ecoquiz/shared";
import { Users } from "lucide-react";
import { formatScore } from "../lib/ui";

export function ParticipantList({ participants }: { participants: Participant[] }) {
  const connected = participants.filter((participant) => participant.connected).length;

  return (
    <aside className="rounded-lg border border-eco-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-eco-700" aria-hidden="true" />
          <h2 className="font-black text-eco-950">Participantes</h2>
        </div>
        <span className="rounded-lg bg-eco-100 px-2.5 py-1 text-xs font-bold text-eco-700">{connected}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {participants.length === 0 ? (
          <p className="rounded-lg bg-eco-50 p-4 text-sm leading-6 text-eco-700">
            A lista será atualizada quando os alunos entrarem com o PIN.
          </p>
        ) : (
          participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-eco-200 bg-eco-50 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${participant.connected ? "bg-eco-500" : "bg-zinc-300"}`}
                  aria-label={participant.connected ? "Conectado" : "Desconectado"}
                />
                <span className="truncate text-sm font-semibold text-eco-950">{participant.nickname}</span>
              </div>
              <span className="shrink-0 text-xs font-bold text-eco-700">{formatScore(participant.score)} pts</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
