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
        <AuthForm mode="login" returnTo={params.returnTo} />

        <div className="mobile-install-card">
          <p className="mobile-install-title">Pruebas en movil (iOS y Android)</p>
          <p className="install-helper">Puedes instalar la app ahora para probarla como app nativa.</p>
          <InstallAppButton />
        </div>
      </article>
    </section>
  );
}