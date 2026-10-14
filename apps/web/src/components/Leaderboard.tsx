import type { LeaderboardEntry } from "@ecoquiz/shared";
import { Medal } from "lucide-react";
import { formatScore } from "../lib/ui";

export function Leaderboard({ entries, highlightName }: { entries: LeaderboardEntry[]; highlightName?: string }) {
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <section className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {topThree.map((entry) => (
          <article
            key={entry.participantId}
            className="rounded-lg border border-eco-200 bg-white p-5 text-center shadow-sm"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-eco-100 text-eco-700">
              <Medal size={24} aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-bold text-eco-700">{entry.position}º lugar</p>
            <h3 className="mt-1 truncate text-xl font-black text-eco-950">{entry.nickname}</h3>
            <p className="mt-1 text-sm font-semibold text-eco-700">{formatScore(entry.score)} pontos</p>
          </article>
        ))}
      </div>
      {rest.length > 0 && (
        <div className="rounded-lg border border-eco-200 bg-white p-4 shadow-sm">
          <h3 className="px-1 text-sm font-black uppercase tracking-normal text-eco-700">Demais participantes</h3>
          <div className="mt-3 grid gap-2">
            {rest.map((entry) => (
              <div
                key={entry.participantId}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  entry.nickname === highlightName ? "bg-eco-100 font-bold text-eco-950" : "bg-eco-50 text-eco-700"
                }`}
              >
                <span>
                  {entry.position}º - {entry.nickname}
                </span>
                <span>{formatScore(entry.score)} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
