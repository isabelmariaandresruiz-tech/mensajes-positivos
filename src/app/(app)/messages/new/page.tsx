import { NewMessageForm } from "@/features/messages/new-message-form";

type NewMessagePageProps = {
  searchParams: Promise<{
    recipientId?: string;
    recipientName?: string;
    recipientUsername?: string;
    replyTo?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function NewMessagePage({ searchParams }: NewMessagePageProps) {
  const params = await searchParams;

  const initialRecipient =
    params.recipientId && params.recipientName
      ? {
          id: params.recipientId,
          name: params.recipientName,
          username: params.recipientUsername,
          email: "",
        }
      : null;

  return (
    <section className="page-grid">
      <header>
        <h1 className="page-title">Nuevo mensaje positivo</h1>
        <p className="page-subtitle">
          Puedes enviarlo ahora o programarlo para un momento especial.
        </p>
      </header>

      <article className="card" style={{ padding: "1.5rem" }}>
        <NewMessageForm initialRecipient={initialRecipient} initialReplyToId={params.replyTo} />
      </article>
    </section>
  );
}
