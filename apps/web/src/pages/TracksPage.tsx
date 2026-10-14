import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Track } from "@ecoquiz/shared";
import { TrackCard } from "../components/TrackCard";
import { api } from "../lib/api";

export function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTracks()
      .then(setTracks)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-normal text-eco-700">Trilhas</p>
        <h1 className="mt-2 text-4xl font-black text-eco-950">Escolha o tema da partida</h1>
        <p className="mt-4 text-lg leading-8 text-eco-700">
          Cada trilha possui cinco perguntas demonstrativas ligadas aos Objetivos de Desenvolvimento Sustentável.
        </p>
      </div>

      {loading && (
        <div className="mt-10 flex items-center gap-3 rounded-lg border border-eco-200 bg-white p-5 text-eco-700">
          <Loader2 className="animate-spin" size={20} aria-hidden="true" />
          Carregando trilhas...
        </div>
      )}

      {error && <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} action="Selecionar trilha" />
          ))}
        </div>
      )}
    </section>
  );
}
