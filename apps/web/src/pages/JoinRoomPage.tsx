import { ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { saveStudentNickname } from "../lib/studentSession";

export function JoinRoomPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedPin = pin.trim();
    const normalizedNickname = nickname.trim().replace(/\s+/g, " ");

    if (!/^\d{6}$/.test(normalizedPin)) {
      setError("Informe um PIN com seis dígitos.");
      return;
    }

    if (normalizedNickname.length < 2 || normalizedNickname.length > 20) {
      setError("Use um apelido entre 2 e 20 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const room = await api.getRoom(normalizedPin);
      if (room.status !== "lobby") {
        throw new Error("Esta partida já começou. Aguarde uma nova sala do professor.");
      }
      saveStudentNickname(normalizedPin, normalizedNickname);
      navigate(`/aluno/sala/${normalizedPin}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar na sala.");
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-lg items-center px-4 py-8 sm:px-6">
      <form onSubmit={joinRoom} className="w-full rounded-lg border border-eco-200 bg-white p-5 shadow-soft sm:p-6">
        <p className="text-sm font-black uppercase tracking-normal text-eco-700">Aluno</p>
        <h1 className="mt-2 text-3xl font-black text-eco-950">Entrar na sala</h1>
        <p className="mt-3 text-sm leading-6 text-eco-700">Use o PIN exibido pelo professor e escolha um apelido.</p>

        <label className="mt-6 grid gap-2 text-sm font-bold text-eco-950">
          PIN da sala
          <input
            className="h-14 rounded-lg border border-eco-200 bg-eco-50 px-4 text-center text-3xl font-black tracking-normal text-eco-950"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoComplete="off"
          />
        </label>

        <label className="mt-5 grid gap-2 text-sm font-bold text-eco-950">
          Apelido
          <input
            className="h-12 rounded-lg border border-eco-200 bg-eco-50 px-4 text-base text-eco-950"
            maxLength={20}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Seu nome no jogo"
            autoComplete="nickname"
          />
        </label>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        <Button
          type="submit"
          className="mt-6 w-full"
          size="lg"
          icon={loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar na partida"}
        </Button>
      </form>
    </section>
  );
}
