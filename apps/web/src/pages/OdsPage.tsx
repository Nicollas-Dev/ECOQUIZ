import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Droplets, HeartPulse, GraduationCap, HandHeart, Venus, Equal, Earth, Wheat, Zap, BriefcaseBusiness, Factory, Scale, Building2, Recycle, Fish, Trees, Handshake, Globe, type LucideIcon } from "lucide-react";
import type { Ods } from "@ecoquiz/shared";
import { api } from "../lib/api";
import { buttonStyles } from "../components/Button";

const icons: Record<string, LucideIcon> = { HandHeart, Wheat, HeartPulse, GraduationCap, Venus, Droplets, Zap, BriefcaseBusiness, Factory, Equal, Building2, Recycle, Earth, Fish, Trees, Scale, Handshake };
export function OdsPage() {
  const [ods, setOds] = useState<Ods[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getOds().then(setOds).catch(e => setError(e.message)); }, []);
  return <section className="page">
    <div className="page-heading"><div><p className="eyebrow"><Globe size={16} /> Agenda 2030</p><h1>Explorar os ODS</h1></div>
      <Link className={buttonStyles({ variant: "secondary" })} to="/banco"><BookOpen size={18} /> Banco de questões</Link></div>
    {error && <p role="alert" className="error-banner">{error}</p>}
    {!ods.length && !error && <p role="status">Carregando objetivos...</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ods.map(item => { const Icon = icons[item.icon] ?? Globe; return <Link key={item.id} to={`/banco?ods=${item.id}`} className="ods-card" style={{ borderTopColor: item.color }}>
        <div className="flex items-center justify-between"><span className="text-sm font-bold text-eco-700">ODS {item.number}</span><Icon size={24} style={{ color: item.color }} /></div>
        <h2 className="mt-3 text-lg font-bold leading-snug">{item.name}</h2><p className="mt-2 text-sm leading-6 text-eco-700">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold"><span>{item.questionCount} questões</span><ArrowUpRight size={18} /></div>
      </Link>; })}
    </div>
    <p className="mt-8 text-sm text-eco-700">Questões autorais do ECOQUIZ, inspiradas nos <a className="underline" href="https://sdgs.un.org/goals" target="_blank" rel="noreferrer">objetivos e metas da ONU</a>. Não são provas oficiais da ONU.</p>
  </section>;
}
