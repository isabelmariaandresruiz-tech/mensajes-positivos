import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InstallAppButton } from "@/components/install-app-button";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type PublicUserInvitePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ open?: string }>;
};

export const dynamic = "force-dynamic";

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function buildReplyHref(userId: string, name: string, username: string): string {
  const params = new URLSearchParams({
    recipientId: userId,
    recipientName: name,
    recipientUsername: username,
  });

  return `/messages/new?${params.toString()}`;
}

export default async function PublicUserInvitePage({
  params,
  searchParams,
}: PublicUserInvitePageProps) {
  const resolvedParams = await params;
  const normalizedUsername = normalizeUsername(resolvedParams.username);
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession();

  if (!normalizedUsername) {
    notFound();
  }

  const targetUser = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    select: {
      id: true,
      name: true,
      username: true,
      allowIncomingMessages: true,
    },
  });

  if (!targetUser || !targetUser.username) {
    notFound();
  }

  const replyHref = buildReplyHref(targetUser.id, targetUser.name, targetUser.username);

  if (resolvedSearchParams.open === "1") {
    if (!targetUser.allowIncomingMessages) {
      redirect(`/u/${targetUser.username}`);
    }

    if (!session) {
      redirect(`/register?returnTo=${encodeURIComponent(`/u/${targetUser.username}?open=1`)}`);
    }

    if (session.userId === targetUser.id) {
      redirect("/dashboard");
    }

    redirect(replyHref);
  }

  return (
    <section className="invite-shell">
      <article className="card invite-card">
        <span className="invite-badge">Enlace de companero</span>
        <h1 className="page-title">{targetUser.name} te invita a AnimoCerca</h1>
        <p className="page-subtitle">
          Abre el flujo desde tu movil y podras enviarle un mensaje positivo en menos de un minuto.
        </p>

        <div className="mobile-install-card">
          <p className="mobile-install-title">Instalar antes de entrar</p>
          <p className="install-helper">
            Si quieres, puedes anadir AnimoCerca a la pantalla principal y usar este enlace como app.
          </p>
          <InstallAppButton compact />
        </div>

        {!targetUser.allowIncomingMessages ? (
          <p className="alert alert-error">
            Esta persona no acepta mensajes en este momento. Pidele otro enlace mas tarde.
          </p>
        ) : null}

        <div className="invite-actions">
          {targetUser.allowIncomingMessages ? (
            <Link className="button button-primary" href={`/u/${targetUser.username}?open=1`}>
              {session ? "Enviar mensaje ahora" : "Crear cuenta y enviar mensaje"}
            </Link>
          ) : null}

          {!session ? (
            <Link className="button button-secondary" href={`/register?returnTo=${encodeURIComponent(`/u/${targetUser.username}?open=1`)}`}>
              Crear cuenta
            </Link>
          ) : (
            <Link className="button button-ghost" href="/dashboard">
              Ir al panel
            </Link>
          )}
        </div>
      </article>
    </section>
  );
}
