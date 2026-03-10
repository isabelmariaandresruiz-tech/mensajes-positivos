import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InstallAppButton } from "@/components/install-app-button";
import { getServerSession } from "@/lib/auth/session";
import { getInvitePreviewByToken } from "@/server/services/invites";

type InvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ open?: string }>;
};

export const dynamic = "force-dynamic";

function buildReplyHref(
  senderId: string,
  senderName: string,
  senderUsername: string | null,
): string {
  const params = new URLSearchParams({
    recipientId: senderId,
    recipientName: senderName,
  });

  if (senderUsername) {
    params.set("recipientUsername", senderUsername);
  }

  return `/messages/new?${params.toString()}`;
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession();

  const preview = await getInvitePreviewByToken(token);

  if (!preview) {
    notFound();
  }

  const replyHref = buildReplyHref(preview.senderId, preview.senderName, preview.senderUsername);

  if (resolvedSearchParams.open === "1") {
    if (preview.isExpired) {
      redirect(`/i/${token}`);
    }

    if (!session) {
      redirect(`/register?returnTo=${encodeURIComponent(`/i/${token}?open=1`)}`);
    }

    if (session.userId === preview.senderId) {
      redirect("/messages/inbox?view=sent");
    }

    redirect(replyHref);
  }

  return (
    <section className="invite-shell">
      <article className="card invite-card">
        <span className="invite-badge">Invitacion recibida</span>
        <h1 className="page-title">{preview.senderName} te envio un mensaje positivo</h1>
        <p className="page-subtitle">&ldquo;{preview.messageExcerpt}&rdquo;</p>

        <p className="message-meta">
          Este enlace te permite instalar la app y responderle en un solo flujo.
        </p>

        {preview.isExpired ? (
          <p className="alert alert-error">Este enlace ha expirado. Pidele a la persona que te comparta uno nuevo.</p>
        ) : null}

        <div className="invite-actions">
          {!preview.isExpired ? (
            <Link className="button button-primary" href={`/i/${token}?open=1`}>
              {session ? "Responder ahora" : "Instalar y responder"}
            </Link>
          ) : null}

          <InstallAppButton />

          {!session ? (
            <Link className="button button-secondary" href={`/register?returnTo=${encodeURIComponent(`/i/${token}?open=1`)}`}>
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