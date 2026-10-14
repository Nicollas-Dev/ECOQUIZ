import type { RoomSnapshot } from "@ecoquiz/shared";
import { Loader2, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Socket } from "socket.io-client";
import { Button, buttonStyles } from "../components/Button";
import { Leaderboard } from "../components/Leaderboard";
import { QuestionView } from "../components/QuestionView";
import { clearStudentNickname, getStudentNickname } from "../lib/studentSession";
import { createEcoquizSocket } from "../lib/socket";
import { formatScore } from "../lib/ui";

type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export function StudentRoomPage() {
  const { pin = "" } = useParams();
  const navigate = useNavigate();
  const nickname = pin ? getStudentNickname(pin) : null;
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!/^\d{6}$/.test(pin) || !nickname) {
      navigate("/entrar");
      return;
    }

    const socket = createEcoquizSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("participant:join", { pin, nickname }, (reply: Ack<RoomSnapshot>) => {
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
  }, [navigate, nickname, pin]);

  useEffect(() => {
    const questionId = snapshot?.currentQuestion?.id;
    setSelectedOptionId(questionId ? answersByQuestion[questionId] ?? null : null);
  }, [answersByQuestion, snapshot?.currentQuestion?.id]);

  const answerQuestion = (optionId: string) => {
    const questionId = snapshot?.currentQuestion?.id;
    if (!questionId) {
      return;
    }

    setSelectedOptionId(optionId);
    socketRef.current?.emit("participant:answer", { pin, optionId }, (reply: Ack<RoomSnapshot>) => {
      if (reply.ok) {
        setAnswersByQuestion((current) => ({ ...current, [questionId]: optionId }));
      } else {
        setError(reply.error);
        setSelectedOptionId(null);
      }
    });
  };

  const leaveRoom = () => {
    clearStudentNickname(pin);
    navigate("/entrar");
  };

  if (error) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-lg items-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
          <h1 className="text-xl font-black">Não foi possível entrar</h1>
          <p className="mt-2 text-sm font-semibold">{error}</p>
          <Link className={buttonStyles({ variant: "danger", className: "mt-4" })} to="/entrar">
            Tentar novamente
          </Link>
        </div>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-lg items-center justify-center gap-3 px-4 py-8 text-eco-700 sm:px-6">
        <Loader2 className="animate-spin" size={20} aria-hidden="true" />
        Entrando na sala...
      </section>
    );
  }

  const self = snapshot.participants.find((participant) => participant.nickname === nickname);
  const selectedCorrect = snapshot.reveal?.correctOptionId === selectedOptionId;

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-eco-700">{snapshot.track.name}</p>
          <h1 className="text-2xl font-black text-eco-950">{nickname}</h1>
        </div>
        <Button type="button" variant="ghost" size="sm" icon={<LogOut size={17} />} onClick={leaveRoom}>
          Sair
        </Button>
      </div>

      {snapshot.status === "lobby" && (
        <div className="rounded-lg border border-eco-200 bg-white p-6 text-center shadow-soft">
          <p className="text-sm font-black uppercase tracking-normal text-eco-700">Bem-vindo</p>
          <h2 className="mt-2 text-3xl font-black text-eco-950">Você está na sala {snapshot.pin}</h2>
          <p className="mt-3 text-eco-700">Aguardando o professor iniciar...</p>
        </div>
      )}

      {(snapshot.status === "question" || snapshot.status === "reveal") && (
        <div className="grid gap-4">
          <div className="rounded-lg border border-eco-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-eco-700">Sua pontuação</p>
            <strong className="text-3xl font-black text-eco-950">{formatScore(self?.score ?? 0)} pts</strong>
          </div>
          <QuestionView snapshot={snapshot} selectedOptionId={selectedOptionId} onSelect={answerQuestion} />
          {snapshot.status === "question" && selectedOptionId && (
            <p className="rounded-lg bg-eco-100 p-4 text-sm font-bold text-eco-700">
              Resposta enviada. Aguarde o encerramento da pergunta.
            </p>
          )}
          {snapshot.status === "reveal" && selectedOptionId && (
            <p className={`rounded-lg p-4 text-sm font-bold ${selectedCorrect ? "bg-eco-100 text-eco-700" : "bg-red-50 text-red-700"}`}>
              {selectedCorrect ? "Resposta correta!" : "Resposta incorreta."}
            </p>
          )}
        </div>
      )}

      {snapshot.status === "finished" && (
        <div className="grid gap-5">
          <div className="rounded-lg border border-eco-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-normal text-eco-700">Fim de jogo</p>
            <h2 className="mt-1 text-3xl font-black text-eco-950">Resultado final</h2>
            <p className="mt-2 text-sm leading-6 text-eco-700">
              Sua pontuação final: <strong>{formatScore(self?.score ?? 0)} pontos</strong>
            </p>
          </div>
          <Leaderboard entries={snapshot.leaderboard ?? []} highlightName={nickname ?? undefined} />
          <Link to="/entrar" className={buttonStyles({ variant: "secondary", size: "lg", className: "justify-self-start" })}>
            Entrar em outra sala
          </Link>
        </div>
      )}
    </section>
  );
}
