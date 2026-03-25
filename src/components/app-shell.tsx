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
          <div className="app-header-main">
            <div className="brand">
              <span className="brand-dot">A</span>
              <span>AnimoCerca</span>
            </div>

            <div className="app-user-chip">
              <p className="message-meta">Hola, {userName}</p>
              {userHandle ? <p className="app-user-handle">@{userHandle}</p> : null}
            </div>
          </div>

          <nav className="nav app-top-nav" aria-label="Navegacion principal">
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
        </div>
      </header>

      <main className="app-main">
        <div className="container">{children}</div>
      </main>

      <nav className="app-bottom-nav" aria-label="Navegacion movil">
        <div className="container app-bottom-nav-inner">
          {links.map((link) => {
            const isInboxLink = link.href.startsWith("/messages/inbox");
            const isActive =
              isInboxLink
                ? pathname === "/messages/inbox" && link.href.endsWith(view)
                : pathname === link.href;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`app-bottom-nav-link ${isActive ? "app-bottom-nav-link-active" : ""}`}
                key={link.href}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
