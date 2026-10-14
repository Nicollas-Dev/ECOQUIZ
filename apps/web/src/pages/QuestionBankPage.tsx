import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Check, Plus, Search, Shuffle, Trash2, ArrowRight, X } from "lucide-react";
import type { EditableQuestion, Ods } from "@ecoquiz/shared";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { difficultyLabels, readSelection } from "../lib/editor";

export function QuestionBankPage() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  const [ods, setOds] = useState<Ods[]>([]); const [items, setItems] = useState<EditableQuestion[]>([]);
  const [selectedOds, setSelectedOds] = useState<string[]>(params.get("ods")?.split(",") ?? []);
  const [search, setSearch] = useState(""); const [difficulty, setDifficulty] = useState("");
  const [selection, setSelection] = useState<EditableQuestion[]>(readSelection);
  const [count, setCount] = useState(10); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const [expanded, setExpanded] = useState<string[]>([]);
  useEffect(() => { api.getOds().then(setOds).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    let active = true; setLoading(true); setItems([]); setError("");
    const timeout = setTimeout(() => { api.getQuestions({ odsIds: selectedOds, search, difficulty }).then(rows => { if (active) setItems(rows); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); }, 200);
    return () => { active = false; clearTimeout(timeout); };
  }, [selectedOds, search, difficulty]);
  useEffect(() => { sessionStorage.setItem("ecoquiz:selection", JSON.stringify(selection)); }, [selection]);
  const toggle = (q: EditableQuestion) => {
    if (selection.length >= 100 && !selection.some(s => s.id === q.id)) { setError("O limite é de 100 questões por quiz."); return; }
    setSelection(prev => prev.some(s => s.id === q.id) ? prev.filter(s => s.id !== q.id) : [...prev, q]);
  };
  const random = async () => {
    setBusy(true); setError("");
    try { setSelection(await api.randomQuestions(selectedOds, count, difficulty)); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const assemble = () => navigate(params.get("voltar") === "novo" ? "/quizzes/novo?importar=1" : params.get("voltar") ? `/quizzes/${encodeURIComponent(params.get("voltar")!)}/editar?importar=1` : "/quizzes/novo?importar=1");
  return <section className="page">
    <div className="page-heading"><div><p className="eyebrow"><BookOpen size={16} /> Biblioteca educacional</p><h1>Banco de Questões ODS</h1></div><div className="flex flex-wrap items-center gap-4"><Link className="font-semibold text-eco-700" to="/ods">Todos os objetivos</Link><Button icon={<ArrowRight size={17} />} disabled={!selection.length} onClick={assemble}>{params.get("voltar") ? "Adicionar ao quiz" : "Montar quiz"} ({selection.length})</Button></div></div>
    <div className="bank-layout">
      <aside className="min-w-0 space-y-5">
        <h2 className="text-base font-bold">Objetivos</h2><div className="space-y-2">
          {ods.map(item => <label key={item.id} className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-eco-700" checked={selectedOds.includes(item.id)} onChange={() => setSelectedOds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])} /><span><span className="mr-2 inline-block size-2 rounded-full" style={{ background: item.color }} /><strong>{item.number}.</strong> {item.name}</span></label>)}
        </div>
        {!!selectedOds.length && <button type="button" className="flex items-center gap-1 text-sm font-semibold text-eco-700" onClick={() => setSelectedOds([])}><X size={16} /> Limpar filtro</button>}
      </aside>
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-3 border-b border-eco-200 pb-5">
          <label className="min-w-0 flex-1"><span className="field-label">Pesquisar questões</span><div className="relative"><Search size={18} className="absolute left-3 top-3 text-eco-700" /><input className="field pl-10" maxLength={200} value={search} onChange={e => setSearch(e.target.value)} placeholder="Palavra-chave" /></div></label>
          <label><span className="field-label">Dificuldade</span><select className="field" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="">Todas</option>{Object.entries(difficultyLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        </div>
        <div className="my-4 flex flex-wrap items-end gap-3"><label className="w-24"><span className="field-label">Quantidade</span><input className="field" type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} /></label><Button variant="secondary" icon={<Shuffle size={17} />} disabled={busy || !Number.isInteger(count) || count < 1 || count > 100} onClick={random}>Selecionar aleatoriamente</Button><span className="py-2 text-sm text-eco-700">{loading ? "Buscando..." : `${items.length} disponíveis`}</span></div>
        {error && <p role="alert" className="error-banner">{error}</p>}
        {!loading && !items.length && !error && <p className="py-10 text-eco-700">Nenhuma questão encontrada.</p>}
        <div className="divide-y divide-eco-200">
          {items.map(q => { const chosen = selection.some(s => s.id === q.id); return <article key={q.id} className="py-5">
            <div className="flex items-start gap-3"><button type="button" title={chosen ? "Remover da seleção" : "Selecionar questão"} aria-label={chosen ? "Remover da seleção" : "Selecionar questão"} aria-pressed={chosen} className={`icon-button shrink-0 ${chosen ? "bg-eco-700 text-white" : "bg-white"}`} onClick={() => toggle(q)}>{chosen ? <Check size={19} /> : <Plus size={19} />}</button>
              <div className="min-w-0 flex-1"><p className="mb-1 text-xs font-semibold text-eco-700">{q.odsId?.replace("ods-", "ODS ")} · {difficultyLabels[q.difficulty]} · {q.timeLimit}s</p><h2 className="text-base font-bold leading-6">{q.prompt}</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options.map(o => <div key={o.id} className="rounded border border-eco-200 bg-white p-2 text-sm"><strong className="mr-2">{o.label}</strong>{o.text}</div>)}</div>
                <button className="mt-3 text-sm font-semibold text-eco-700 underline" type="button" onClick={() => setExpanded(prev => prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev,q.id])}>{expanded.includes(q.id) ? "Ocultar explicação" : "Consultar resposta e explicação"}</button>
                {expanded.includes(q.id) && <div className="mt-3 border-l-2 border-eco-500 pl-3 text-sm leading-6"><p><strong>Resposta: {q.options.find(o => o.id === q.correctOptionId)?.label}.</strong> {q.explanation}</p>{q.sourceUrl && <a href={q.sourceUrl} target="_blank" rel="noreferrer" className="underline">Meta de referência da ONU</a>}</div>}
              </div></div>
          </article>; })}
        </div>
      </div>
      <aside className="selection-panel min-w-0"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">Selecionadas ({selection.length})</h2><button className="icon-button" title="Limpar seleção" aria-label="Limpar seleção" onClick={() => setSelection([])}><Trash2 size={17} /></button></div>
        <div className="mt-4 max-h-72 space-y-3 overflow-auto">{selection.map((q,i) => <div className="flex items-start gap-2 text-sm" key={q.id}><span className="font-bold text-eco-700">{i+1}.</span><span className="min-w-0 flex-1 break-words">{q.prompt}</span><button title="Remover questão" aria-label="Remover questão" className="shrink-0" onClick={() => toggle(q)}><X size={16} /></button></div>)}</div>
        <Button className="mt-5 w-full" icon={<ArrowRight size={17} />} disabled={!selection.length} onClick={assemble}>{params.get("voltar") ? "Adicionar ao quiz" : "Montar quiz"}</Button>
      </aside>
    </div>
  </section>;
}
