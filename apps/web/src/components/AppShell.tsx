import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { buttonStyles } from "./Button";
import { Logo } from "./Logo";

const links = [["/", "Início"], ["/ods", "Explorar ODS"], ["/banco", "Banco de questões"], ["/quizzes/novo", "Criar quiz"], ["/meus-quizzes", "Meus quizzes"], ["/entrar", "Entrar em sala"]];
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen text-eco-950">
    <header className="sticky top-0 z-30 border-b border-eco-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><Logo compact />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Navegação principal">{links.map(([to,label]) => <NavLink key={to} end={to === "/"} to={to} className={({ isActive }) => `rounded px-2 py-2 text-sm font-semibold ${isActive ? "bg-eco-100 text-eco-950" : "text-eco-700 hover:bg-eco-50"}`}>{label}</NavLink>)}
          <Link to="/professor/criar" className={buttonStyles({ size: "sm" })}>Criar sala</Link></nav>
        <button className="icon-button xl:hidden" type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && <nav className="grid gap-1 border-t border-eco-200 bg-white px-4 py-3 xl:hidden" aria-label="Navegação móvel">{links.map(([to,label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm font-semibold">{label}</NavLink>)}<Link to="/professor/criar" onClick={() => setOpen(false)} className={buttonStyles({ size: "sm" })}>Criar sala</Link></nav>}
    </header><main>{children}</main>
  </div>;
}
