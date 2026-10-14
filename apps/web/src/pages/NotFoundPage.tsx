import { Link } from "react-router-dom";
import { buttonStyles } from "../components/Button";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-black uppercase tracking-normal text-eco-700">404</p>
      <h1 className="mt-2 text-4xl font-black text-eco-950">Página não encontrada</h1>
      <p className="mt-4 text-eco-700">O caminho acessado não existe no ECOQUIZ.</p>
      <Link to="/" className={buttonStyles({ variant: "primary", size: "lg", className: "mt-8" })}>
        Voltar ao início
      </Link>
    </section>
  );
}
