import Link from "next/link";
import { redirect } from "next/navigation";
import { LocationSettingsForm } from "@/components/location-settings-form";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import {
  computeHappinessForUser,
  getHappinessLeaderboard,
  type HappinessLeaderboardResult,
} from "@/server/services/happiness";

export const dynamic = "force-dynamic";

type LeaderboardCardProps = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  leaderboard: HappinessLeaderboardResult | null;
  currentUserId: string;
};

function getRankToneClass(rank: number): string {
  if (rank === 1) return "leaderboard-item-top-1";
  if (rank === 2) return "leaderboard-item-top-2";
  if (rank === 3) return "leaderboard-item-top-3";
  return "";
}

function LeaderboardCard({
  title,
  subtitle,
  emptyMessage,
  leaderboard,
  currentUserId,
}: LeaderboardCardProps) {
  return (
    <article className="card leaderboard-card">
      <header className="leaderboard-head">
        <div className="leaderboard-head-text">
          <h2 style={{ fontSize: "1.1rem" }}>{title}</h2>
          <p className="message-meta">{subtitle}</p>
        </div>
        {leaderboard ? (
          <span className="leaderboard-participants-chip">{leaderboard.totalUsers} participantes</span>
        ) : null}
      </header>

      {leaderboard?.userRank ? (
        <div className="leaderboard-user-rank-banner">
          <span className="message-meta">Tu posicion actual</span>
          <strong>#{leaderboard.userRank}</strong>
        </div>
      ) : null}

      {!leaderboard || leaderboard.items.length === 0 ? (
        <p className="message-meta">{emptyMessage}</p>
      ) : (
        <ol className="leaderboard-list">
          {leaderboard.items.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const rankToneClass = getRankToneClass(entry.rank);
            const locationText = entry.city
              ? `${entry.city}${entry.country ? `, ${entry.country}` : ""}`
              : entry.country ?? "Ubicacion no definida";

            return (
              <li
                className={`leaderboard-item ${rankToneClass} ${isCurrentUser ? "leaderboard-item-me" : ""}`}
                key={entry.userId}
              >
                <div className="leaderboard-item-main">
                  <span className="leaderboard-rank-badge">#{entry.rank}</span>
                  <div className="leaderboard-user-block">
                    <p className="leaderboard-user-name">
                      {entry.name}
                      {entry.username ? ` (@${entry.username})` : ""}
                    </p>
                    <p className="leaderboard-user-meta">{locationText}</p>
                  </div>
                </div>
                <span className="leaderboard-score-pill">{entry.score} pts</span>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?returnTo=/dashboard");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, username: true, email: true, country: true, city: true },
  });

  const shareLinkPath = profile?.username ? `/u/${profile.username}` : null;

  const [
    sentCount,
    inboxCount,
    scheduledCount,
    happiness,
    globalLeaderboard,
    countryLeaderboard,
    cityLeaderboard,
  ] = await Promise.all([
    prisma.message.count({ where: { senderId: session.userId } }),
    prisma.message.count({ where: { recipientId: session.userId, status: { in: ["SENT", "READ"] } } }),
    prisma.message.count({ where: { senderId: session.userId, status: "SCHEDULED" } }),
    computeHappinessForUser(session.userId),
    getHappinessLeaderboard({ limit: 8, scope: "global", userId: session.userId }),
    profile?.country
      ? getHappinessLeaderboard({
          limit: 8,
          scope: "country",
          country: profile.country,
          userId: session.userId,
        })
      : Promise.resolve(null),
    profile?.city
      ? getHappinessLeaderboard({
          limit: 8,
          scope: "city",
          country: profile.country ?? null,
          city: profile.city,
          userId: session.userId,
        })
      : Promise.resolve(null),
  ]);

  return (
    <section className="page-grid">
      <header>
        <h1 className="page-title">Tu panel positivo</h1>
        <p className="page-subtitle">Gestiona tus mensajes de apoyo y mantiene el impulso de tu comunidad.</p>
      </header>

      <article className="card user-locator-card">
        <h2 style={{ fontSize: "1.1rem" }}>Tu identificador</h2>
        <p className="user-handle-display">{profile?.username ? `@${profile.username}` : "Sin username"}</p>
        <p className="message-meta">Email: {profile?.email}</p>
        <p className="message-meta">Pais: {profile?.country ?? "Sin definir"}</p>
        <p className="message-meta">Ciudad: {profile?.city ?? "Sin definir"}</p>
        <p className="message-meta">ID interno: {profile?.id}</p>
        <p className="message-meta">La app permite buscar personas por nombre, email o @username.</p>

        {shareLinkPath ? (
          <div className="share-link-box">
            <p className="share-link-label">Enlace para companeros</p>
            <p className="share-link-path">{shareLinkPath}</p>
            <Link className="button button-secondary button-small" href={shareLinkPath}>
              Ver mi enlace publico
            </Link>
          </div>
        ) : (
          <p className="message-meta">Define un username para poder compartir tu enlace publico.</p>
        )}
      </article>

      <article className="card" style={{ padding: "1.1rem 1.2rem", display: "grid", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Ubicacion para ranking local</h2>
        <p className="message-meta">
          Completa tu pais y ciudad para participar en rankings por ubicacion.
        </p>
        <LocationSettingsForm initialCity={profile?.city} initialCountry={profile?.country} />
      </article>

      <article className="card happiness-card">
        <div className="happiness-header">
          <div>
            <h2 style={{ fontSize: "1.2rem" }}>Felicidad aportada al mundo</h2>
            <p className="message-meta">
              Algoritmo anti-spam: premia personas distintas y respuestas reales, y reduce puntos por envios masivos repetitivos.
            </p>
          </div>
          <p className="happiness-score">{happiness.score}</p>
        </div>

        <div
          className="happiness-meter-track"
          role="progressbar"
          aria-valuenow={happiness.progress.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="happiness-meter-fill" style={{ width: `${happiness.progress.progressPercent}%` }} />
        </div>

        <p className="message-meta">
          Nivel {happiness.progress.currentLevel} - Proximo nivel en {happiness.progress.nextLevelMin - happiness.score} puntos
        </p>

        <div className="happiness-breakdown">
          <p>Puntos por mensajes: +{happiness.breakdown.messagePoints}</p>
          <p>Bonus por mensajes leidos: +{happiness.breakdown.readBonus}</p>
          <p>Bonus por personas diferentes: +{happiness.breakdown.diversityBonus}</p>
          <p>Bonus por respuestas recibidas: +{happiness.breakdown.repliesBonus}</p>
          <p>Penalizacion anti-spam: -{happiness.breakdown.antiSpamPenalty}</p>
          <p>Mensajes evaluados: {happiness.breakdown.totalSent}</p>
          <p>Personas alcanzadas: {happiness.breakdown.uniquePeople}</p>
          <p>Respuestas recibidas: {happiness.breakdown.repliesReceived}</p>
        </div>
      </article>

      <section className="leaderboard-scopes-grid" aria-label="Rankings por ambito">
        <LeaderboardCard
          currentUserId={session.userId}
          emptyMessage="Todavia no hay datos de ranking global."
          leaderboard={globalLeaderboard}
          subtitle="Compara tu impacto con toda la comunidad."
          title="Ranking global"
        />

        <LeaderboardCard
          currentUserId={session.userId}
          emptyMessage="Define tu pais para activar este ranking."
          leaderboard={countryLeaderboard}
          subtitle={profile?.country ? `Ranking de ${profile.country}` : "Ranking por pais"}
          title="Ranking por pais"
        />

        <LeaderboardCard
          currentUserId={session.userId}
          emptyMessage="Define tu ciudad para activar este ranking."
          leaderboard={cityLeaderboard}
          subtitle={
            profile?.city
              ? `Ranking local en ${profile.city}${profile?.country ? `, ${profile.country}` : ""}`
              : "Ranking por ciudad"
          }
          title="Ranking por ciudad"
        />
      </section>

      <section className="metrics-grid" aria-label="Metricas principales">
        <article className="card metric-card">
          <p className="metric-label">Mensajes enviados</p>
          <p className="metric-value">{sentCount}</p>
        </article>
        <article className="card metric-card">
          <p className="metric-label">Mensajes recibidos</p>
          <p className="metric-value">{inboxCount}</p>
        </article>
        <article className="card metric-card">
          <p className="metric-label">Programados</p>
          <p className="metric-value">{scheduledCount}</p>
        </article>
      </section>

      <section className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem" }}>Acciones rapidas</h2>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link className="button button-primary" href="/messages/new">
            Enviar nuevo mensaje
          </Link>
          <Link className="button button-secondary" href="/messages/inbox?view=received">
            Revisar recibidos
          </Link>
          <Link className="button button-secondary" href="/messages/inbox?view=sent">
            Revisar enviados
          </Link>
        </div>
      </section>
    </section>
  );
}