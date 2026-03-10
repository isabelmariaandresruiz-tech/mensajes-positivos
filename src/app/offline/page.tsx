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
          No hay internet en este momento. Revisa tu conexion y vuelve a intentarlo.
        </p>

        <div className="mobile-install-card">
          <p className="mobile-install-title">Modo movil</p>
          <p className="install-helper">
            Si instalas la app en la pantalla principal, la experiencia en iOS y Android es mas fluida.
          </p>
          <InstallAppButton />
        </div>

        <Link className="button button-primary" href="/login">
          Ir a login
        </Link>
      </article>
    </section>
  );
}