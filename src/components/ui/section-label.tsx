import type { HTMLAttributes } from "react";

import { cx } from "@/lib/cx";

import styles from "./section-label.module.css";

type SectionLabelProps = HTMLAttributes<HTMLParagraphElement>;

export function SectionLabel({
  children,
  className,
  ...props
}: SectionLabelProps) {
  return (
    <p className={cx(styles.label, className)} {...props}>
      {children}
    </p>
  );
}

