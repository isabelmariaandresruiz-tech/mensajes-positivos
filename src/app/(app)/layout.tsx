import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?returnTo=/dashboard");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      username: true,
    },
  });

  return (
    <AppShell
      userName={profile?.name ?? session.name}
      userHandle={profile?.username ?? session.username ?? null}
    >
      {children}
    </AppShell>
  );
}
