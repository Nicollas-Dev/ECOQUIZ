import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { buttonStyles } from "./Button";
import { Logo } from "./Logo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-eco-100 text-eco-950" : "text-eco-700 hover:bg-eco-100 hover:text-eco-950"
  }`;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen text-eco-950">
      <header className="sticky top-0 z-30 border-b border-eco-200/80 bg-eco-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo compact />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
            <NavLink to="/" className={navLinkClass}>
              Início
            </NavLink>
            <NavLink to="/trilhas" className={navLinkClass}>
              Trilhas
            </NavLink>
            <NavLink to="/entrar" className={navLinkClass}>
              Entrar
            </NavLink>
            <Link to="/professor/criar" className={buttonStyles({ variant: "primary", size: "sm" })}>
              Criar sala
            </Link>
          </nav>
          <button
            className="inline-flex size-10 items-center justify-center rounded-lg border border-eco-200 bg-white text-eco-950 md:hidden"
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-eco-200 bg-white px-4 py-3 md:hidden" aria-label="Navegação móvel">
            <div className="mx-auto grid max-w-6xl gap-2">
              <NavLink to="/" className={navLinkClass} onClick={() => setOpen(false)}>
                Início
              </NavLink>
              <NavLink to="/trilhas" className={navLinkClass} onClick={() => setOpen(false)}>
                Trilhas
              </NavLink>
              <NavLink to="/entrar" className={navLinkClass} onClick={() => setOpen(false)}>
                Entrar em uma sala
              </NavLink>
              <Link
                to="/professor/criar"
                className={buttonStyles({ variant: "primary", size: "sm" })}
                onClick={() => setOpen(false)}
              >
                Criar sala
              </Link>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
