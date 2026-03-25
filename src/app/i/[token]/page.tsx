import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InstallAppButton } from "@/components/install-app-button";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type InvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ open?: string }>;
};

export const dynamic = "force-dynamic";

function buildReplyHref(
  senderId: string,
  senderName: string,
  senderUsername: string | null,
  messageId: string,
): string {
  const params = new URLSearchParams({
    recipientId: senderId,
    recipientName: senderName,
    replyTo: messageId,
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

  const invite = await prisma.inviteLink.findUnique({
    where: { token },
    include: {
      message: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
  });

  if (!invite) {
    notFound();
  }

  const preview = {
    token: invite.token,
    senderId: invite.message.sender.id,
    senderName: invite.message.sender.name,
    senderUsername: invite.message.sender.username,
    messageExcerpt:
      invite.message.body.length > 160 ? `${invite.message.body.slice(0, 157)}...` : invite.message.body,
    isExpired: Boolean(invite.expiresAt && invite.expiresAt < new Date()),
    messageId: invite.message.id,
  };

  const replyHref = buildReplyHref(
    preview.senderId,
    preview.senderName,
    preview.senderUsername,
    preview.messageId,
  );

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

        <p className="message-meta">Este enlace te lleva directo al mensaje para responder desde el movil.</p>

        <div className="mobile-install-card">
          <p className="mobile-install-title">Responder como app</p>
          <p className="install-helper">
            Si lo prefieres, puedes instalar AnimoCerca antes de responder para abrirla desde la pantalla principal.
          </p>
          <InstallAppButton compact />
        </div>

        {preview.isExpired ? (
          <p className="alert alert-error">Este enlace ha expirado. Pidele a la persona que te comparta uno nuevo.</p>
        ) : null}

        <div className="invite-actions">
          {!preview.isExpired ? (
            <Link className="button button-primary" href={`/i/${token}?open=1`}>
              {session ? "Responder ahora" : "Crear cuenta y responder"}
            </Link>
          ) : null}

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
