import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Check, Copy, Eye, Info, Play, Plus, Save, Trash2, X } from "lucide-react";
import { QUIZ_LIMITS, type EditableQuestion, type Ods, type QuizInput } from "@ecoquiz/shared";
import { api, RequestError } from "../lib/api";
import { blankQuestion, blankQuiz, copyQuestion, difficultyLabels, readSelection, validateQuiz } from "../lib/editor";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";

type Draft = { data: QuizInput; revision?: number; writtenAt: string };
export function QuizEditorPage() {
  const { id } = useParams(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [data, setData] = useState<QuizInput>(blankQuiz); const [revision, setRevision] = useState<number>();
  const [ods, setOds] = useState<Ods[]>([]); const [selected, setSelected] = useState(-1);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [preview, setPreview] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null); const [errors, setErrors] = useState<Record<string,string>>({});
  const [message, setMessage] = useState(""); const [status, setStatus] = useState(""); const persisted = useRef("");
  const importSelection = params.get("importar") === "1";
  const [incoming] = useState(readSelection);
  const draftKey = `ecoquiz:draft:${id ?? "novo"}`;
  useEffect(() => { api.getOds().then(setOds).catch(e => setMessage(e.message)); }, []);
  useEffect(() => {
    let active = true; setReady(false); setMessage("");
    const load = async () => {
      const saved = id ? await api.getQuiz(id) : undefined;
      if (!active) return;
      let next: QuizInput = saved ?? blankQuiz(); let rev = saved?.revision;
      setStatus(saved ? "Versão salva no banco" : "Novo quiz");
      persisted.current = JSON.stringify(next);
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) ?? "null") as Draft | null;
        if (draft && (!id || draft.revision === rev)) { next = draft.data; setStatus("Rascunho local recuperado"); }
        else if (draft) setMessage("Há um rascunho de uma versão anterior neste navegador. A versão atual do banco foi carregada.");
      } catch { setMessage("Não foi possível recuperar o rascunho local."); }
      if (importSelection) {
        const additions = incoming.map(copyQuestion);
        if (next.questions.length + additions.length > QUIZ_LIMITS.questions) setMessage(`O limite é de ${QUIZ_LIMITS.questions} perguntas. Reduza a seleção.`);
        else { next = { ...next, questions: [...next.questions, ...additions], odsIds: [...new Set([...next.odsIds, ...additions.map(q => q.odsId).filter((v): v is string => Boolean(v))])] }; sessionStorage.removeItem("ecoquiz:selection"); }
      }
      setData(next); setRevision(rev); setSelected(importSelection && next.questions.length ? next.questions.length - 1 : -1); setReady(true);
    };
    load().catch(e => { if (active) { setMessage(e.message); setReady(false); } });
    return () => { active = false; };
  }, [id, draftKey, importSelection, incoming]);
  useEffect(() => {
    if (!ready) return;
    if (JSON.stringify(data) === persisted.current) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ data, revision, writtenAt: new Date().toISOString() })); setStatus("Rascunho salvo neste navegador"); }
    catch { setStatus("Não foi possível salvar o rascunho local"); }
  }, [data, ready, revision, draftKey]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (JSON.stringify(data) !== persisted.current) e.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [data]);
  const patchQuiz = (patch: Partial<QuizInput>) => { setData(prev => ({ ...prev, ...patch })); setStatus("Alterações pendentes"); };
  const patchQuestion = (patch: Partial<EditableQuestion>) => { setStatus("Alterações pendentes"); setData(prev => ({ ...prev, questions: prev.questions.map((q,i) => i === selected ? { ...q, ...patch } : q) })); };
  const save = async (play = false) => {
    const found = validateQuiz(data);
    if (play && !data.questions.length) found.questions = "Adicione pelo menos uma pergunta antes de iniciar.";
    setErrors(found); setMessage("");
    if (Object.keys(found).length) { const key = Object.keys(found)[0]; const index = key.match(/^questions\.(\d+)/)?.[1]; setSelected(index ? Number(index) : -1); return; }
    setBusy(true);
    try {
      const quiz = await api.saveQuiz(data, id, revision);
      persisted.current = JSON.stringify(quiz); localStorage.removeItem(draftKey);
      setData(quiz); setRevision(quiz.revision); setStatus("Salvo no banco de dados");
      if (play) { const room = await api.createQuizRoom(quiz.id); navigate(`/professor/sala/${room.pin}`); }
      else if (!id) navigate(`/quizzes/${quiz.id}/editar`, { replace: true });
    } catch (e) {
      setMessage((e as Error).message);
      if (e instanceof RequestError) setErrors(Object.fromEntries(e.issues.map(issue => [issue.path.join("."), issue.message])));
      setStatus("Salvamento não concluído");
    } finally { setBusy(false); }
  };
  const addQuestion = () => {
    if (data.questions.length >= QUIZ_LIMITS.questions) return;
    patchQuiz({ questions: [...data.questions, blankQuestion(data.defaultTimeLimit)] }); setSelected(data.questions.length);
  };
  const move = (index: number, direction: number) => {
    const next = index + direction; if (next < 0 || next >= data.questions.length) return;
    const questions = [...data.questions]; [questions[index], questions[next]] = [questions[next], questions[index]];
    patchQuiz({ questions }); setSelected(next);
  };
  const bankLink = () => {
    localStorage.setItem(draftKey, JSON.stringify({ data, revision, writtenAt: new Date().toISOString() }));
    sessionStorage.removeItem("ecoquiz:selection"); navigate(`/banco?voltar=${id ?? "novo"}`);
  };
  const errorText = (path: string) => errors[path] ? <p className="field-error" role="alert">{errors[path]}</p> : null;
  const q = selected >= 0 ? data.questions[selected] : undefined; const prefix = `questions.${selected}`;
  if (!ready) return <section className="page"><h1 className="text-2xl font-bold">Criar meu quiz</h1><p className={message ? "error-banner" : "mt-4"}>{message || "Carregando editor..."}</p><Link to="/meus-quizzes" className="mt-4 inline-block underline">Meus quizzes</Link></section>;
  return <section className="editor-page">
    <div className="editor-toolbar">
      <div className="flex min-w-0 items-center gap-3"><Link to="/meus-quizzes" className="icon-button shrink-0" title="Voltar à biblioteca" aria-label="Voltar à biblioteca"><ArrowLeft size={20} /></Link><div className="min-w-0"><h1 className="truncate text-lg font-bold">{data.title || "Criar meu quiz"}</h1><p className="text-xs text-eco-700" role="status">{status || "Novo quiz"}</p></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" icon={<Eye size={17} />} disabled={!q || busy} onClick={() => setPreview(true)}>Prévia</Button><Button size="sm" icon={<Save size={17} />} disabled={busy} onClick={() => void save()}>{busy ? "Salvando..." : "Salvar"}</Button><Button size="sm" variant="secondary" icon={<Play size={17} />} disabled={busy} onClick={() => void save(true)}>Iniciar partida</Button></div>
    </div>
    {message && <p role="alert" className="error-banner mx-4 mt-4">{message}</p>}
    <fieldset disabled={busy} className="editor-layout" aria-label="Conteúdo do quiz">
      <aside className="editor-sidebar">
        <button className={`question-tab ${selected === -1 ? "active" : ""}`} onClick={() => setSelected(-1)}><Info size={18} /> Informações do quiz</button>
        <div className="my-4 flex items-center justify-between text-sm"><h2 className="font-bold">Perguntas</h2><span>{data.questions.length}/{QUIZ_LIMITS.questions}</span></div>
        <div className="question-tabs">{data.questions.map((item,i) => <button key={item.id} className={`question-tab ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)}><span className="shrink-0 font-bold">{i+1}.</span><span className="truncate text-left">{item.prompt || "Nova pergunta"}</span>{Object.keys(errors).some(k => k.startsWith(`questions.${i}.`)) && <span className="text-red-700">!</span>}</button>)}</div>
        <Button className="mt-4 w-full" variant="secondary" icon={<Plus size={17} />} disabled={data.questions.length >= QUIZ_LIMITS.questions} onClick={addQuestion}>Adicionar pergunta</Button>
        <Button className="mt-2 w-full" variant="ghost" icon={<BookOpen size={17} />} onClick={bankLink}>Adicionar do banco ODS</Button>
      </aside>
      <div className="editor-main">
        {selected === -1 ? <div className="space-y-5">
          <div><p className="eyebrow">Seu conteúdo, qualquer tema</p><h2 className="mt-1 text-2xl font-bold">Informações do quiz</h2></div>
          <label className="block"><span className="field-label">Título do quiz</span><input className="field" maxLength={120} value={data.title} onChange={e => patchQuiz({ title: e.target.value })} placeholder="Revisão de Matemática - 8º Ano" />{errorText("title")}</label>
          <label className="block"><span className="field-label">Descrição</span><textarea className="field min-h-24" maxLength={1000} value={data.description} onChange={e => patchQuiz({ description: e.target.value })} />{errorText("description")}</label>
          <label className="block"><span className="field-label">Tema ou categoria</span><input className="field" maxLength={80} value={data.category} onChange={e => patchQuiz({ category: e.target.value })} placeholder="Matemática, história, tecnologia..." /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="field-label">Tempo padrão (segundos)</span><input className="field" type="number" min={10} max={120} value={data.defaultTimeLimit} onChange={e => patchQuiz({ defaultTimeLimit: Number(e.target.value) })} />{errorText("defaultTimeLimit")}</label><label><span className="field-label">Ordem das perguntas</span><select className="field" value={data.randomOrder ? "random" : "fixed"} onChange={e => patchQuiz({ randomOrder: e.target.value === "random" })}><option value="fixed">Ordem fixa</option><option value="random">Aleatória por partida</option></select></label></div>
          <fieldset><legend className="field-label">ODS associados (opcional)</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{ods.map(item => <label key={item.id} className="flex items-start gap-2 text-sm"><input className="mt-1 accent-eco-700" type="checkbox" checked={data.odsIds.includes(item.id)} onChange={() => patchQuiz({ odsIds: data.odsIds.includes(item.id) ? data.odsIds.filter(v => v !== item.id) : [...data.odsIds,item.id] })} /><span>{item.number}. {item.name}</span></label>)}</div></fieldset>
          {errorText("questions")}<Button icon={<ArrowDown size={17} />} onClick={() => data.questions.length ? setSelected(0) : addQuestion()}>Editar perguntas</Button>
        </div> : q ? <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Pergunta {selected+1}</h2><div className="flex gap-1">
            <button className="icon-button" title="Mover para cima" aria-label="Mover para cima" disabled={selected === 0} onClick={() => move(selected,-1)}><ArrowUp size={18} /></button><button className="icon-button" title="Mover para baixo" aria-label="Mover para baixo" disabled={selected === data.questions.length-1} onClick={() => move(selected,1)}><ArrowDown size={18} /></button>
            <button className="icon-button" title="Duplicar pergunta" aria-label="Duplicar pergunta" disabled={data.questions.length >= QUIZ_LIMITS.questions} onClick={() => { const questions = [...data.questions]; questions.splice(selected+1,0,copyQuestion(q)); patchQuiz({ questions }); setSelected(selected+1); }}><Copy size={18} /></button><button className="icon-button text-red-700" title="Excluir pergunta" aria-label="Excluir pergunta" onClick={() => setPendingDelete(selected)}><Trash2 size={18} /></button>
          </div></div>
          <label className="block"><span className="field-label">Enunciado</span><textarea className="field min-h-28 text-lg" maxLength={QUIZ_LIMITS.prompt} value={q.prompt} onChange={e => patchQuestion({ prompt: e.target.value })} placeholder="Qual é o resultado de 8 × 7?" />{errorText(`${prefix}.prompt`)}</label>
          <fieldset><legend className="field-label">Alternativas e resposta correta</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{q.options.map((option,j) => <div key={option.id} className={`option-editor ${q.correctOptionId === option.id ? "correct" : ""}`}>
            <div className="mb-2 flex items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm font-bold"><input type="radio" className="accent-eco-700" name="correct" checked={q.correctOptionId === option.id} onChange={() => patchQuestion({ correctOptionId: option.id })} aria-label={`Alternativa ${option.label} correta`} /><span>{option.label}</span>{q.correctOptionId === option.id && <span className="flex items-center gap-1 text-xs text-eco-700"><Check size={14} /> Correta</span>}</label>
              <button className="icon-button size-8" title={`Remover alternativa ${option.label}`} aria-label={`Remover alternativa ${option.label}`} disabled={q.options.length <= 2} onClick={() => patchQuestion({ options: q.options.filter(o => o.id !== option.id).map((o,i) => ({ ...o, label: ["A","B","C","D"][i] as "A"|"B"|"C"|"D" })), correctOptionId: q.correctOptionId === option.id ? "" : q.correctOptionId })}><X size={16} /></button></div>
            <label className="sr-only" htmlFor={`option-${option.id}`}>Texto da alternativa {option.label}</label><textarea id={`option-${option.id}`} className="field min-h-20" maxLength={QUIZ_LIMITS.option} value={option.text} onChange={e => patchQuestion({ options: q.options.map(o => o.id === option.id ? { ...o, text: e.target.value } : o) })} />{errorText(`${prefix}.options.${j}.text`)}
          </div>)}</div>{errorText(`${prefix}.options`)}{errorText(`${prefix}.correctOptionId`)}<Button className="mt-3" variant="ghost" size="sm" icon={<Plus size={16} />} disabled={q.options.length >= 4} onClick={() => patchQuestion({ options: [...q.options,{ id: crypto.randomUUID(), label: ["A","B","C","D"][q.options.length] as "C"|"D", text: "" }] })}>Adicionar alternativa</Button></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Tempo limite (segundos)</span><input type="number" className="field" min={10} max={120} list="question-times" value={q.timeLimit} onChange={e => patchQuestion({ timeLimit: Number(e.target.value) })} /><datalist id="question-times">{[10,20,30,60].map(t => <option key={t} value={t} />)}</datalist>{errorText(`${prefix}.timeLimit`)}</label><label><span className="field-label">Dificuldade</span><select className="field" value={q.difficulty} onChange={e => patchQuestion({ difficulty: e.target.value as EditableQuestion["difficulty"] })}>{Object.entries(difficultyLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
          <label className="block"><span className="field-label">Explicação (opcional)</span><textarea className="field min-h-24" maxLength={QUIZ_LIMITS.explanation} value={q.explanation} onChange={e => patchQuestion({ explanation: e.target.value })} />{errorText(`${prefix}.explanation`)}</label>
          <label className="block"><span className="field-label">ODS da pergunta (opcional)</span><select className="field" value={q.odsId ?? ""} onChange={e => patchQuestion({ odsId: e.target.value || null })}><option value="">Sem associação</option>{ods.map(item => <option key={item.id} value={item.id}>{item.number}. {item.name}</option>)}</select></label>
          {q.sourceQuestionId && <p className="text-sm text-eco-700">Cópia editável do banco ODS.</p>}
        </div> : null}
      </div>
    </fieldset>
    {pendingDelete !== null && <Dialog title="Excluir pergunta?" onClose={() => setPendingDelete(null)}><p>A pergunta será removida deste quiz.</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancelar</Button><Button variant="danger" icon={<Trash2 size={16} />} onClick={() => { patchQuiz({ questions: data.questions.filter((_,i) => i !== pendingDelete) }); setSelected(-1); setPendingDelete(null); }}>Excluir</Button></div></Dialog>}
    {preview && q && <Dialog title="Prévia da pergunta" onClose={() => setPreview(false)}><p className="text-xs font-semibold text-eco-700">{q.timeLimit}s · {difficultyLabels[q.difficulty]}</p><h3 className="mt-3 text-2xl font-bold">{q.prompt || "Enunciado"}</h3><div className="mt-5 grid gap-3 sm:grid-cols-2">{q.options.map(o => <div key={o.id} className={`rounded-lg border p-4 ${q.correctOptionId === o.id ? "border-eco-500 bg-eco-100" : "border-eco-200"}`}><strong>{o.label}. </strong>{o.text || "Alternativa"}{q.correctOptionId === o.id && <Check size={16} className="mt-2" />}</div>)}</div>{q.explanation && <p className="mt-5 text-sm leading-6">{q.explanation}</p>}</Dialog>}
  </section>;
}
