import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Download, Library, Pencil, Play, Plus, Trash2, Upload } from "lucide-react";
import type { QuizSummary } from "@ecoquiz/shared";
import { api, creatorToken } from "../lib/api";
import { Button, buttonStyles } from "../components/Button";
import { Dialog } from "../components/Dialog";

export function MyQuizzesPage() {
  const navigate = useNavigate(); const [items, setItems] = useState<QuizSummary[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(""); const [remove, setRemove] = useState<QuizSummary>();
  const [restore, setRestore] = useState(false); const [token, setToken] = useState("");
  const load = async () => { setLoading(true); try { setItems(await api.listQuizzes()); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const action = async (id: string, kind: "play"|"duplicate"|"delete") => {
    setBusy(id); setError(""); try {
      if (kind === "play") { const room = await api.createQuizRoom(id); navigate(`/professor/sala/${room.pin}`); }
      if (kind === "duplicate") { await api.duplicateQuiz(id); await load(); }
      if (kind === "delete") { await api.deleteQuiz(id); localStorage.removeItem(`ecoquiz:draft:${id}`); setRemove(undefined); await load(); }
    } catch (e) { setError((e as Error).message); } finally { setBusy(""); }
  };
  const backup = async () => {
    try { const value = await creatorToken(); const url = URL.createObjectURL(new Blob([value], { type: "text/plain" })); const a = document.createElement("a"); a.href = url; a.download = "ecoquiz-credencial-secreta.txt"; a.click(); URL.revokeObjectURL(url); } catch (e) { setError((e as Error).message); }
  };
  const recover = async () => {
    const previous = localStorage.getItem("ecoquiz:creator");
    try {
      if (!/^[a-f0-9]{64}$/.test(token.trim())) throw new Error("A credencial deve conter 64 caracteres hexadecimais.");
      localStorage.setItem("ecoquiz:creator", token.trim()); const quizzes = await api.listQuizzes(); setItems(quizzes); setRestore(false); setToken(""); setError("");
    } catch (e) { if (previous) localStorage.setItem("ecoquiz:creator", previous); else localStorage.removeItem("ecoquiz:creator"); setError((e as Error).message); }
  };
  return <section className="page"><div className="page-heading"><div><p className="eyebrow"><Library size={16} /> Sua biblioteca</p><h1>Meus Quizzes</h1></div><Link className={buttonStyles({ variant: "primary" })} to="/quizzes/novo"><Plus size={18} /> Criar quiz</Link></div>
    <div className="mb-6 border-b border-eco-200 pb-5"><p className="max-w-3xl text-sm leading-6 text-eco-700">Seus quizzes ficam no banco de dados. A credencial de edição fica neste navegador. Para acessar em outro navegador, guarde uma cópia da credencial. Sem ela, perder os dados do navegador também significa perder o acesso à biblioteca. Mantenha a credencial em segredo.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={() => void backup()}>Guardar credencial</Button><Button variant="ghost" size="sm" icon={<Upload size={16} />} onClick={() => setRestore(true)}>Restaurar acesso</Button></div></div>
    {error && <p className="error-banner" role="alert">{error}</p>}
    {loading ? <p role="status">Carregando quizzes...</p> : !items.length ? <div className="py-12 text-center"><Library className="mx-auto text-eco-700" size={36} /><h2 className="mt-4 text-xl font-bold">Sua biblioteca começa aqui</h2><Link className={buttonStyles({ className: "mt-5" })} to="/quizzes/novo"><Plus size={17} /> Criar meu primeiro quiz</Link></div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(quiz => <article className="quiz-card" key={quiz.id}><p className="text-xs font-semibold text-eco-700">{quiz.category || "Sem categoria"}</p><h2 className="mt-2 text-xl font-bold">{quiz.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-eco-700">{quiz.description}</p><p className="mt-4 text-sm font-semibold">{quiz.questionCount} perguntas</p><p className="mt-1 text-xs text-eco-700">Atualizado em {new Date(quiz.updatedAt).toLocaleDateString("pt-BR")}</p><div className="mt-auto flex flex-wrap items-center gap-2 pt-5"><Button size="sm" icon={<Play size={16} />} disabled={!quiz.questionCount || busy === quiz.id} onClick={() => void action(quiz.id,"play")}>Jogar</Button><Link className={buttonStyles({ variant: "secondary", size: "sm" })} to={`/quizzes/${quiz.id}/editar`}><Pencil size={16} /> Editar</Link><button className="icon-button" title="Duplicar quiz" aria-label={`Duplicar ${quiz.title}`} disabled={busy === quiz.id} onClick={() => void action(quiz.id,"duplicate")}><Copy size={17} /></button><button className="icon-button text-red-700" title="Excluir quiz" aria-label={`Excluir ${quiz.title}`} disabled={busy === quiz.id} onClick={() => setRemove(quiz)}><Trash2 size={17} /></button></div></article>)}</div>}
    {remove && <Dialog title="Excluir quiz?" onClose={() => setRemove(undefined)}><p>Excluir “{remove.title}” da sua biblioteca?</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setRemove(undefined)}>Cancelar</Button><Button variant="danger" icon={<Trash2 size={16} />} disabled={busy === remove.id} onClick={() => void action(remove.id,"delete")}>Excluir</Button></div></Dialog>}
    {restore && <Dialog title="Restaurar acesso à biblioteca" onClose={() => setRestore(false)}><label className="block"><span className="field-label">Credencial secreta</span><input className="field" type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="off" /></label><p className="mt-3 text-sm text-eco-700">Este navegador passará a usar a biblioteca vinculada à credencial informada.</p><Button className="mt-5" icon={<Upload size={16} />} onClick={() => void recover()}>Restaurar acesso</Button>{error && <p className="field-error" role="alert">{error}</p>}</Dialog>}
  </section>;
}
