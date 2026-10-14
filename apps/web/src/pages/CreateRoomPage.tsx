import { ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Track } from "@ecoquiz/shared";
import { Button } from "../components/Button";
import { api } from "../lib/api";

export function CreateRoomPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackId, setTrackId] = useState(searchParams.get("trackId") ?? "");
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTracks()
      .then((items) => {
        setTracks(items);
        if (!trackId && items[0]) {
          setTrackId(items[0].id);
        }
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoadingTracks(false));
  }, [trackId]);

  const selectedTrack = useMemo(() => tracks.find((track) => track.id === trackId), [trackId, tracks]);

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!trackId) {
      setError("Selecione uma trilha para criar a sala.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const room = await api.createRoom(trackId);
      navigate(`/professor/sala/${room.pin}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar a sala.");
      setCreating(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-normal text-eco-700">Professor</p>
        <h1 className="mt-2 text-4xl font-black text-eco-950">Criar uma sala</h1>
        <p className="mt-4 text-lg leading-8 text-eco-700">
          Selecione a trilha, gere um PIN de seis dígitos e acompanhe a turma entrando em tempo real.
        </p>
        {selectedTrack && (
          <div className="mt-6 rounded-lg border border-eco-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-eco-700">Trilha selecionada</p>
            <h2 className="mt-1 text-2xl font-black text-eco-950">{selectedTrack.name}</h2>
            <p className="mt-2 text-sm leading-6 text-eco-700">{selectedTrack.description}</p>
          </div>
        )}
      </div>

      <form onSubmit={createRoom} className="rounded-lg border border-eco-200 bg-white p-5 shadow-sm sm:p-6">
        <fieldset disabled={loadingTracks || creating} className="grid gap-4">
          <legend className="text-xl font-black text-eco-950">Trilhas disponíveis</legend>
          {loadingTracks ? (
            <div className="flex items-center gap-3 rounded-lg bg-eco-50 p-4 text-sm font-semibold text-eco-700">
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              Carregando...
            </div>
          ) : (
            tracks.map((track) => (
              <label
                key={track.id}
                className={`cursor-pointer rounded-lg border p-4 transition ${
                  trackId === track.id ? "border-eco-700 bg-eco-100" : "border-eco-200 bg-white hover:bg-eco-50"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="track"
                  value={track.id}
                  checked={trackId === track.id}
                  onChange={(event) => setTrackId(event.target.value)}
                />
                <span className="block font-black text-eco-950">{track.name}</span>
                <span className="mt-1 block text-sm leading-6 text-eco-700">{track.description}</span>
              </label>
            ))
          )}
        </fieldset>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        <Button
          type="submit"
          className="mt-6 w-full"
          size="lg"
          icon={creating ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          disabled={loadingTracks || creating || !trackId}
        >
          {creating ? "Criando sala..." : "Gerar PIN e continuar"}
        </Button>
      </form>
    </section>
  );
}
