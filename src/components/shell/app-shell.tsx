"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import type { ViewerContext } from "@/lib/auth/access";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";
import { primaryNavigation, resolvePrimaryNavigation } from "@/config/shell";
import { cx } from "@/lib/cx";

import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
  viewer: ViewerContext;
};

function getViewerSecondaryLabel(viewer: ViewerContext) {
  if (viewer.isAdmin) {
    return "Governance access enabled";
  }

  if (viewer.primaryCompany) {
    return viewer.isVerifiedMember
      ? `${viewer.primaryCompany.name} · Verified workspace`
      : `${viewer.primaryCompany.name} · Verification pending`;
  }

  if (viewer.status === "authenticated") {
    return "Signed in account workspace";
  }

  return "Public discovery access";
}

export function AppShell({ children, viewer }: AppShellProps) {
  const pathname = usePathname();
  const activePrimaryNav = resolvePrimaryNavigation(pathname);
  const accountHref: Route = viewer.isAdmin ? "/admin/moderation" : "/account";
  const authHref = buildProtectedAuthRedirect(pathname) as Route;
  const primaryActionHref: Route =
    viewer.status === "anonymous"
      ? (buildProtectedAuthRedirect("/submit") as Route)
      : viewer.isVerifiedMember || viewer.isAdmin
        ? "/submit"
        : "/ai";
  const primaryActionLabel =
    viewer.status === "anonymous"
      ? "Join to Submit"
      : viewer.isVerifiedMember || viewer.isAdmin
        ? "+ Submit Challenge"
        : "◈ Ask AI";
  const secondaryActionHref: Route =
    viewer.status === "authenticated" ? accountHref : authHref;
  const secondaryActionLabel =
    viewer.status === "authenticated"
      ? viewer.isAdmin
        ? "Admin Console"
        : "Account"
      : "Sign In";

  return (
    <div className={styles.shell}>
      <a className="skipLink" href="#main-content">
        Skip to content
      </a>

      <aside className={styles.sidebar}>
        <Link className={styles.logo} href="/">
          NQ
        </Link>
        <nav aria-label="Primary navigation" className={styles.nav}>
          {primaryNavigation.map((item) => {
            const isActive = item.key === activePrimaryNav;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cx(styles.navItem, isActive && styles.navItemActive)}
                href={
                  viewer.status === "anonymous" && item.key === "submit"
                    ? (buildProtectedAuthRedirect(item.href) as Route)
                    : item.href
                }
                key={item.key}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className={styles.tooltip}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.avatar} title={viewer.displayName}>
          {viewer.initials}
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            NASQ <span>NACIRE</span>
          </Link>

          <form action="/challenges" className={styles.search} role="search">
            <label className="srOnly" htmlFor="global-search">
              Search published challenges
            </label>
            <span aria-hidden="true" className={styles.searchIcon}>
              🔎
            </span>
            <input
              className={styles.searchInput}
              id="global-search"
              name="q"
              placeholder="Search published challenges…"
              type="search"
            />
          </form>

          <div className={styles.viewerMeta}>
            <span className={styles.viewerName}>{viewer.displayName}</span>
            <span className={styles.viewerSecondary}>{getViewerSecondaryLabel(viewer)}</span>
          </div>

          <div className={styles.actions}>
            <ButtonLink href={secondaryActionHref} variant="outline">
              {secondaryActionLabel}
            </ButtonLink>
            <ButtonLink href={primaryActionHref}>{primaryActionLabel}</ButtonLink>
          </div>
        </header>

        <main className={styles.content} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
