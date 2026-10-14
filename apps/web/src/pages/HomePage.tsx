import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Globe, Library, Plus, Users } from "lucide-react";
import type { Ods } from "@ecoquiz/shared";
import { api } from "../lib/api";
import { buttonStyles } from "../components/Button";

export function HomePage() {
  const [ods, setOds] = useState<Ods[]>([]);
  useEffect(() => { api.getOds().then(setOds).catch(() => {}); }, []);
  return <section className="page">
    <div className="home-intro"><div><p className="eyebrow">Aprender. Jogar. Transformar.</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">ECOQUIZ</h1><p className="mt-4 max-w-xl text-lg leading-8 text-eco-700">Sua próxima atividade começa com uma pergunta. Crie um quiz sobre qualquer tema ou explore os 17 objetivos de desenvolvimento sustentável.</p></div><Link to="/professor/criar" className={buttonStyles({ variant: "secondary" })}><Users size={18} /> Criar sala</Link></div>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{[
      { title: "Criar um quiz", text: "Perguntas próprias, do seu jeito.", to: "/quizzes/novo", Icon: Plus },
      { title: "Explorar os ODS", text: "Educação conectada à Agenda 2030.", to: "/ods", Icon: Globe },
      { title: "Entrar em uma sala", text: "Seu PIN é o começo da partida.", to: "/entrar", Icon: Users }
    ].map(({ title,text,to,Icon }) => <Link key={to} to={to} className="quiz-card"><div className="flex items-center justify-between"><Icon size={26} className="text-eco-700" /><ArrowUpRight size={20} /></div><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-eco-700">{text}</p></Link>)}</div>
    <div className="mt-10 flex flex-wrap gap-5 border-b border-eco-200 pb-8"><Link className="flex items-center gap-2 font-semibold text-eco-700" to="/meus-quizzes"><Library size={18} /> Meus quizzes</Link><Link className="flex items-center gap-2 font-semibold text-eco-700" to="/banco"><BookOpen size={18} /> Banco de questões</Link></div>
    <div className="mt-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">17 objetivos, muitas conexões</h2><Link className="text-sm font-semibold text-eco-700" to="/ods">Explorar todos</Link></div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{ods.map(item => <Link key={item.id} to={`/banco?ods=${item.id}`} className="ods-mini" style={{ borderLeftColor: item.color }}><span className="text-xs font-bold text-eco-700">ODS {item.number}</span><span className="mt-1 text-sm font-semibold leading-5">{item.name}</span></Link>)}</div>
    </div><footer className="mt-10 border-t border-eco-200 py-5 text-xs text-eco-700">ECOQUIZ · Educação, sustentabilidade e espaço para criar.</footer>
  </section>;
}
