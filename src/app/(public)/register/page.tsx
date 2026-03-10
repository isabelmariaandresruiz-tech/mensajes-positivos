import { AuthForm } from "@/components/auth-form";
import { InstallAppButton } from "@/components/install-app-button";

type RegisterPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export const metadata = {
  title: "Registro",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <section className="auth-shell">
      <article className="card auth-card">
        <h1 className="auth-title">Crea tu cuenta</h1>
        <p className="auth-subtitle">Empieza a compartir energia positiva en menos de un minuto.</p>
        <AuthForm mode="register" returnTo={params.returnTo} />

        <div className="mobile-install-card">
          <p className="mobile-install-title">Pruebas en movil (iOS y Android)</p>
          <p className="install-helper">Tambien puedes instalar la app para probar el flujo completo en telefono.</p>
          <InstallAppButton />
        </div>
      </article>
    </section>
  );
}