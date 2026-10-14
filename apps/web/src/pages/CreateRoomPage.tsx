import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, BookOpen, Library, Plus, Play } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/Button";

export function CreateRoomPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const legacy = params.get("trackId");
  const playLegacy = async () => { setBusy(true); try { const room = await api.createRoom(legacy!); navigate(`/professor/sala/${room.pin}`); } catch(e) { setError((e as Error).message); setBusy(false); } };
  const choices = [
    { title: "Jogar com questões dos ODS", icon: BookOpen, to: "/banco", description: "Escolha perguntas de um ou mais objetivos." },
    { title: "Jogar com meu quiz", icon: Library, to: "/meus-quizzes", description: "Abra uma nova sala usando um quiz salvo." },
    { title: "Criar novo quiz", icon: Plus, to: "/quizzes/novo", description: "Crie perguntas sobre qualquer tema." }
  ];
  return <section className="page"><div className="page-heading"><div><p className="eyebrow">Professor e organizador</p><h1>Criar sala</h1></div></div>
    <div className="grid gap-4 md:grid-cols-3">{choices.map(({ title, icon: Icon, to, description }) => <Link className="quiz-card" to={to} key={to}><Icon className="text-eco-700" size={28} /><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-eco-700">{description}</p><ArrowUpRight className="mt-6 self-end text-eco-700" size={22} /></Link>)}</div>
    {legacy && <div className="mt-8 border-t border-eco-200 pt-5"><Button icon={<Play size={17} />} disabled={busy} onClick={() => void playLegacy()}>Jogar trilha anterior</Button></div>}
    {error && <p className="error-banner" role="alert">{error}</p>}
  </section>;
}
