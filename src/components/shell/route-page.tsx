import type { ReactNode } from "react";

import Link from "next/link";
import type { Route } from "next";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cx } from "@/lib/cx";

import styles from "./route-page.module.css";

type RoutePageTab = {
  active?: boolean;
  href: Route;
  label: string;
};

type RoutePageBadge = {
  label: string;
  tone?: BadgeTone;
};

type RoutePageProps = {
  actions?: ReactNode;
  badges?: readonly RoutePageBadge[];
  children: ReactNode;
  description: string;
  eyebrow: string;
  tabs?: readonly RoutePageTab[];
  title: string;
};

export function RoutePage({
  actions,
  badges,
  children,
  description,
  eyebrow,
  tabs,
  title,
}: RoutePageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          {badges?.length ? (
            <div className={styles.chips}>
              {badges.map((badge) => (
                <Badge key={`${badge.tone ?? "gold"}-${badge.label}`} tone={badge.tone ?? "gold"}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>

      {tabs?.length ? (
        <nav aria-label="Section navigation" className={styles.tabs}>
          {tabs.map((tab) => (
            <Link
              className={cx(styles.tabLink, tab.active && styles.tabActive)}
              href={tab.href}
              key={tab.href}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {children}
    </div>
  );
}

export const routePageStyles = styles;
