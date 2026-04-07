import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

import styles from "./pill.module.css";

type PillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  priority?: boolean;
  showDot?: boolean;
};

export function Pill({
  active = false,
  children,
  className,
  priority = false,
  showDot = true,
  ...props
}: PillProps) {
  return (
    <button
      className={cx(
        styles.pill,
        active && styles.active,
        priority && styles.priority,
        className,
      )}
      data-active={String(active)}
      data-priority={String(priority)}
      type="button"
      {...props}
    >
      {showDot ? <span aria-hidden="true" className={styles.dot} /> : null}
      <span>{children}</span>
    </button>
  );
}
