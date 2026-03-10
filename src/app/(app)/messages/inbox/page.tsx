import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCard } from "@/components/message-card";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type InboxPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?returnTo=/messages/inbox");
  }

  const params = await searchParams;
  const view = params.view === "sent" ? "sent" : "received";

  const [receivedMessages, sentMessages] = await Promise.all([
    prisma.message.findMany({
      where: {
        recipientId: session.userId,
        status: {
          in: ["SENT", "READ"],
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 60,
    }),
    prisma.message.findMany({
      where: {
        senderId: session.userId,
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 60,
    }),
  ]);

  const messageList = view === "sent" ? sentMessages : receivedMessages;

  return (
    <section className="page-grid">
      <header>
        <h1 className="page-title">Mensajes</h1>
        <p className="page-subtitle">Revisa tus mensajes enviados y recibidos.</p>
      </header>

      <div className="tabs-row">
        <Link
          className={`tab-link ${view === "received" ? "tab-link-active" : ""}`}
          href="/messages/inbox?view=received"
        >
          Recibidos ({receivedMessages.length})
        </Link>
        <Link
          className={`tab-link ${view === "sent" ? "tab-link-active" : ""}`}
          href="/messages/inbox?view=sent"
        >
          Enviados ({sentMessages.length})
        </Link>
      </div>

      {messageList.length === 0 ? (
        <article className="card empty-state">
          <h2 style={{ fontSize: "1.1rem" }}>
            {view === "sent" ? "Todavia no has enviado mensajes." : "Todavia no tienes mensajes recibidos."}
          </h2>
          <p className="page-subtitle">
            {view === "sent"
              ? "Ve a 'Nuevo' para mandar tu primer mensaje positivo."
              : "Comparte tu usuario para empezar a recibir apoyo."}
          </p>
        </article>
      ) : (
        <div className="message-list">
          {view === "sent"
            ? sentMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  body={message.body}
                  counterpartName={message.recipient.name}
                  counterpartUsername={message.recipient.username}
                  direction="sent"
                  sentAt={message.sentAt ? message.sentAt.toISOString() : message.createdAt.toISOString()}
                  status={message.status.toLowerCase()}
                />
              ))
            : receivedMessages.map((message) => {
                const replyHref = `/messages/new?recipientId=${encodeURIComponent(message.sender.id)}&recipientName=${encodeURIComponent(message.sender.name)}${message.sender.username ? `&recipientUsername=${encodeURIComponent(message.sender.username)}` : ""}&replyTo=${encodeURIComponent(message.id)}`;

                return (
                  <MessageCard
                    key={message.id}
                    body={message.body}
                    counterpartName={message.sender.name}
                    counterpartUsername={message.sender.username}
                    direction="received"
                    replyHref={replyHref}
                    sentAt={message.sentAt ? message.sentAt.toISOString() : message.createdAt.toISOString()}
                    status={message.status.toLowerCase()}
                  />
                );
              })}
        </div>
      )}
    </section>
  );
}
