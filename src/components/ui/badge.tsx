import type { HTMLAttributes } from "react";

import { cx } from "@/lib/cx";

import styles from "./badge.module.css";

export type BadgeTone = "gold" | "green" | "red" | "blue" | "teal";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  children,
  className,
  tone = "gold",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(styles.badge, styles[tone], className)}
      data-tone={tone}
      {...props}
    >
      {children}
    </span>
  );
}

