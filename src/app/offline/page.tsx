import Link from "next/link";
import { InstallAppButton } from "@/components/install-app-button";

export const metadata = {
  title: "Sin conexion",
};

export default function OfflinePage() {
  return (
    <section className="auth-shell">
      <article className="card auth-card">
        <h1 className="auth-title">Sin conexion</h1>
        <p className="auth-subtitle">
          No hay internet en este momento. Revisa tu conexion y vuelve a intentarlo desde el telefono.
        </p>

        <div className="mobile-install-card">
          <p className="mobile-install-title">Cuando vuelvas a tener conexion</p>
          <p className="install-helper">
            Instalarla en el telefono ayuda a abrirla mas rapido y a tener una experiencia mas parecida a app.
          </p>
          <InstallAppButton />
        </div>

        <Link className="button button-primary" href="/login">
          Volver a intentar
        </Link>
      </article>
    </section>
  );
}
