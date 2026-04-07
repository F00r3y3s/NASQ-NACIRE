import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import type { BadgeTone } from "@/components/ui/badge";
import { cx } from "@/lib/cx";

import styles from "./stat-card.module.css";

type StatCardTone = Extract<BadgeTone, "gold" | "green" | "blue" | "teal">;

type StatCardProps = {
  chart?: ReactNode;
  change?: string;
  icon: ReactNode;
  label: string;
  tone?: StatCardTone;
  value: string;
};

const toneClassMap = {
  gold: styles.gold,
  green: styles.green,
  blue: styles.blue,
  teal: styles.teal,
} as const;

const toneBackgroundClassMap = {
  gold: styles.goldBg,
  green: styles.greenBg,
  blue: styles.blueBg,
  teal: styles.tealBg,
} as const;

export function StatCard({
  chart,
  change,
  icon,
  label,
  tone = "gold",
  value,
}: StatCardProps) {
  return (
    <Surface className={cx(styles.card, toneClassMap[tone])}>
      <div className={styles.header}>
        <div>
          <div className={styles.label}>{label}</div>
          <div className={styles.value}>{value}</div>
          {change ? <div className={styles.change}>{change}</div> : null}
        </div>
        <div className={cx(styles.iconFrame, toneBackgroundClassMap[tone])}>{icon}</div>
      </div>
      {chart ? <div className={styles.chart}>{chart}</div> : null}
    </Surface>
  );
}

