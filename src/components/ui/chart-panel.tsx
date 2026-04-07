import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

import styles from "./chart-panel.module.css";

type ChartPanelProps = {
  body: ReactNode;
  footer?: ReactNode;
  metric?: string;
  subtitle?: string;
  title: string;
};

export function ChartPanel({
  body,
  footer,
  metric,
  subtitle,
  title,
}: ChartPanelProps) {
  return (
    <Surface className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {metric ? <div className={styles.metric}>{metric}</div> : null}
      </div>
      <div className={styles.body}>{body}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </Surface>
  );
}

