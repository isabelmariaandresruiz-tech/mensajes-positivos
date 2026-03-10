import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="auth-shell">
      <article className="card auth-card">
        <h1 className="auth-title">No hemos encontrado esa pagina</h1>
        <p className="auth-subtitle">Puede que el enlace haya expirado o que no exista.</p>
        <Link className="button button-primary" href="/login">
          Volver al inicio
        </Link>
      </article>
    </section>
  );
}
