import type { Track } from "@ecoquiz/shared";
import { Droplets, Recycle, ShoppingBag, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonStyles } from "./Button";

const iconMap = {
  recycle: Recycle,
  zap: Zap,
  "shopping-bag": ShoppingBag,
  droplets: Droplets
};

export function TrackCard({ track, action = "Criar sala" }: { track: Track; action?: string }) {
  const Icon = iconMap[track.icon];

  return (
    <article className="grid gap-5 rounded-lg border border-eco-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-eco-100" style={{ color: track.accent }}>
          <Icon size={24} aria-hidden="true" />
        </div>
        <span className="rounded-lg bg-eco-100 px-3 py-1 text-xs font-bold text-eco-700">
          {track.questionCount ?? 5} perguntas
        </span>
      </div>
      <div className="grid gap-2">
        <h3 className="text-xl font-black text-eco-950">{track.name}</h3>
        <p className="text-sm leading-6 text-eco-700">{track.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {track.ods.map((ods) => (
          <span key={ods} className="rounded-lg border border-eco-200 bg-eco-50 px-2.5 py-1 text-xs font-semibold text-eco-700">
            {ods}
          </span>
        ))}
      </div>
      <Link to={`/professor/criar?trackId=${track.id}`} className={buttonStyles({ variant: "secondary" })}>
        {action}
      </Link>
    </article>
  );
}
