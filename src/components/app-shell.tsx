"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  userName: string;
  userHandle?: string | null;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/messages/new", label: "Nuevo" },
  { href: "/messages/inbox?view=received", label: "Recibidos" },
  { href: "/messages/inbox?view=sent", label: "Enviados" },
];

export function AppShell({ children, userName, userHandle }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "received";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <div className="brand">
            <span className="brand-dot">A</span>
            <span>AnimoCerca</span>
          </div>

          <nav className="nav" aria-label="Navegacion principal">
            {links.map((link) => {
              const isInboxLink = link.href.startsWith("/messages/inbox");
              const isActive =
                isInboxLink
                  ? pathname === "/messages/inbox" && link.href.endsWith(view)
                  : pathname === link.href;

              return (
                <Link
                  key={link.href}
                  className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ textAlign: "right" }}>
            <p className="message-meta">Hola, {userName}</p>
            {userHandle ? <p className="message-meta">@{userHandle}</p> : null}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
