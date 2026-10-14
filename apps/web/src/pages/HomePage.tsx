import { ArrowRight, Leaf, Play, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Track } from "@ecoquiz/shared";
import { buttonStyles } from "../components/Button";
import { TrackCard } from "../components/TrackCard";
import { api } from "../lib/api";

export function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    api.getTracks().then(setTracks).catch(() => setTracks([]));
  }, []);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-eco-200 bg-white px-3 py-1.5 text-sm font-bold text-eco-700">
            <Leaf size={16} aria-hidden="true" />
            Aprender. Jogar. Transformar.
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight text-eco-950 sm:text-5xl">
            Aprenda sobre sustentabilidade de um jeito divertido.
          </h1>
          <p className="mt-5 text-lg leading-8 text-eco-700">
            O ECOQUIZ conecta professores e alunos em partidas ao vivo sobre ODS, consumo consciente, energia,
            resíduos e água. Crie uma sala, compartilhe o PIN e conduza a turma em tempo real.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/professor/criar" className={buttonStyles({ variant: "primary", size: "lg" })}>
              <Play size={19} aria-hidden="true" />
              Criar uma sala
            </Link>
            <Link to="/entrar" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              Entrar em uma sala
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-eco-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-4 border-b border-eco-200 pb-4">
            <div>
              <p className="text-sm font-bold text-eco-700">Sala ao vivo</p>
              <h2 className="text-xl font-black text-eco-950">Consumo Consciente</h2>
            </div>
            <span className="rounded-lg bg-eco-100 px-3 py-1 text-sm font-black text-eco-700">PIN 482913</span>
          </div>
          <div className="mt-5">
            <p className="text-sm font-bold text-eco-700">Pergunta 3 de 5</p>
            <h3 className="mt-2 text-2xl font-black leading-tight text-eco-950">
              Qual escolha tende a diminuir o impacto ambiental de uma compra?
            </h3>
            <div className="mt-5 grid gap-3">
              {["Produto durável e reparável", "Embalagens extras", "Compra por impulso", "Descarte imediato"].map(
                (answer, index) => (
                  <div
                    key={answer}
                    className="flex items-center gap-3 rounded-lg border border-eco-200 bg-eco-50 p-3 text-sm font-bold text-eco-950"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white text-eco-700">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {answer}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-eco-200 bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-normal text-eco-700">
                <Sparkles size={16} aria-hidden="true" />
                Trilhas disponíveis
              </p>
              <h2 className="mt-2 text-3xl font-black text-eco-950">Conteúdos prontos para jogar</h2>
            </div>
            <Link to="/trilhas" className="text-sm font-black text-eco-700 hover:text-eco-950">
              Ver todas as trilhas
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tracks.slice(0, 4).map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm font-semibold text-eco-700 sm:px-6">
        ECOQUIZ - projeto acadêmico de educação ambiental e sustentabilidade.
      </footer>
    </>
  );
}
