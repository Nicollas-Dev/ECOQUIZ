import type { RoomSnapshot } from "@ecoquiz/shared";
import { ArrowRight, Loader2, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Socket } from "socket.io-client";
import { Button } from "../components/Button";
import { Leaderboard } from "../components/Leaderboard";
import { ParticipantList } from "../components/ParticipantList";
import { PinPanel } from "../components/PinPanel";
import { QuestionView } from "../components/QuestionView";
import { createEcoquizSocket } from "../lib/socket";

type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export function HostRoomPage() {
  const { pin = "" } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!/^\d{6}$/.test(pin)) {
      navigate("/professor/criar");
      return;
    }

    const socket = createEcoquizSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("host:join", { pin }, (reply: Ack<RoomSnapshot>) => {
        if (reply.ok) {
          setSnapshot(reply.data);
          setError(null);
        } else {
          setError(reply.error);
        }
      });
    });

    socket.on("room:update", (room: RoomSnapshot) => setSnapshot(room));
    socket.on("connect_error", () => setError("Não foi possível conectar ao servidor em tempo real."));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [navigate, pin]);

  const emitHostAction = (event: "host:start" | "host:next" | "host:restart") => {
    setActionError(null);
    socketRef.current?.emit(event, { pin }, (reply: Ack<RoomSnapshot>) => {
      if (reply.ok) {
        setSnapshot(reply.data);
      } else {
        setActionError(reply.error);
      }
    });
  };

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          <h1 className="text-xl font-black">Não foi possível abrir a sala</h1>
          <p className="mt-2 text-sm font-semibold">{error}</p>
          <Link className="mt-4 inline-flex font-black text-red-800 underline" to="/professor/criar">
            Criar outra sala
          </Link>
        </div>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-10 text-eco-700 sm:px-6">
        <Loader2 className="animate-spin" size={20} aria-hidden="true" />
        Conectando sala...
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-eco-700">Sala do professor</p>
            <h1 className="mt-1 text-3xl font-black text-eco-950">{snapshot.track.name}</h1>
          </div>
          <span className="rounded-lg bg-eco-100 px-3 py-1 text-sm font-black text-eco-700">
            {snapshot.status === "lobby" && "Aguardando alunos"}
            {snapshot.status === "question" && "Pergunta aberta"}
            {snapshot.status === "reveal" && "Resultado da pergunta"}
            {snapshot.status === "finished" && "Resultado final"}
          </span>
        </div>

        {snapshot.status === "lobby" && (
          <>
            <PinPanel pin={snapshot.pin} />
            <div className="rounded-lg border border-eco-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-eco-950">Pronto para iniciar</h2>
              <p className="mt-2 text-sm leading-6 text-eco-700">
                Compartilhe o PIN com a turma. O botão de início será liberado assim que pelo menos um aluno entrar.
              </p>
              {actionError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{actionError}</p>}
              <Button
                className="mt-5"
                size="lg"
                icon={<Play size={18} />}
                disabled={snapshot.activeParticipantCount === 0}
                onClick={() => emitHostAction("host:start")}
              >
                Iniciar partida
              </Button>
            </div>
          </>
        )}

        {(snapshot.status === "question" || snapshot.status === "reveal") && (
          <>
            <QuestionView snapshot={snapshot} readonly />
            {actionError && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{actionError}</p>}
            {snapshot.status === "reveal" && (
              <Button
                className="justify-self-start"
                size="lg"
                icon={<ArrowRight size={18} />}
                onClick={() => emitHostAction("host:next")}
              >
                {snapshot.questionIndex + 1 >= snapshot.questionCount ? "Ver ranking final" : "Próxima pergunta"}
              </Button>
            )}
          </>
        )}

        {snapshot.status === "finished" && (
          <div className="grid gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-eco-700">Ranking final</p>
              <h2 className="mt-1 text-3xl font-black text-eco-950">Resultado da partida</h2>
            </div>
            <Leaderboard entries={snapshot.leaderboard ?? []} />
            <Button
              className="justify-self-start"
              size="lg"
              icon={<RotateCcw size={18} />}
              onClick={() => emitHostAction("host:restart")}
            >
              Jogar novamente
            </Button>
          </div>
        )}
      </div>

      <div className="grid content-start gap-4">
        <PinPanel pin={snapshot.pin} />
        <ParticipantList participants={snapshot.participants} />
      </div>
    </section>
  );
}
