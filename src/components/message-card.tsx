import Link from "next/link";

type MessageCardProps = {
  direction: "sent" | "received";
  counterpartName: string;
  counterpartUsername?: string | null;
  body: string;
  status: string;
  sentAt: string | null;
  replyHref?: string;
};

export function MessageCard({
  direction,
  counterpartName,
  counterpartUsername,
  body,
  status,
  sentAt,
  replyHref,
}: MessageCardProps) {
  const label = direction === "sent" ? "Para" : "De";
  const normalizedStatus = status.toLowerCase();
  const statusLabel =
    normalizedStatus === "read"
      ? "leido"
      : normalizedStatus === "sent"
        ? "enviado"
        : normalizedStatus === "scheduled"
          ? "programado"
          : normalizedStatus === "canceled"
            ? "cancelado"
            : status;

  return (
    <article className="card message-card">
      <strong>
        {label}: {counterpartName}
        {counterpartUsername ? ` (@${counterpartUsername})` : ""}
      </strong>
      <p>{body}</p>
      <p className="message-meta">
        Estado: {statusLabel}
        {sentAt ? ` • ${new Date(sentAt).toLocaleString("es-ES")}` : ""}
      </p>
      {replyHref ? (
        <div>
          <Link className="button button-secondary button-small" href={replyHref}>
            Responder
          </Link>
        </div>
      ) : null}
    </article>
  );
}
