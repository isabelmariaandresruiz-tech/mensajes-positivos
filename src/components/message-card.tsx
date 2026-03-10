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

  return (
    <article className="card message-card">
      <strong>
        {label}: {counterpartName}
        {counterpartUsername ? ` (@${counterpartUsername})` : ""}
      </strong>
      <p>{body}</p>
      <p className="message-meta">
        Estado: {status}
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
