import { AuthForm } from "@/components/auth-form";
import { InstallAppButton } from "@/components/install-app-button";

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export const metadata = {
  title: "Login",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="auth-shell">
      <article className="card auth-card">
        <h1 className="auth-title">Bienvenida a AnimoCerca</h1>
        <p className="auth-subtitle">
          Entra para enviar mensajes positivos, felicitaciones y apoyo a tu gente.
        </p>
        <p className="message-meta">Pensada para usarla desde el navegador del telefono, sin pasos extra.</p>
        <AuthForm mode="login" returnTo={params.returnTo} />

        <div className="mobile-install-card">
          <p className="mobile-install-title">Llevala a la pantalla principal</p>
          <p className="install-helper">
            Si la instalas, se abre como una app ligera y queda mas a mano en el telefono.
          </p>
          <InstallAppButton />
        </div>
      </article>
    </section>
  );
}
