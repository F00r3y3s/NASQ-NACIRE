import type { HTMLAttributes } from "react";

import { cx } from "@/lib/cx";

import styles from "./surface.module.css";

type SurfaceTone = "default" | "hero" | "muted";
type SurfacePadding = "md" | "lg";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padding?: SurfacePadding;
  tone?: SurfaceTone;
};

const toneClassMap = {
  default: styles.defaultTone,
  hero: styles.heroTone,
  muted: styles.mutedTone,
} as const;

const paddingClassMap = {
  md: styles.paddingMd,
  lg: styles.paddingLg,
} as const;

export function Surface({
  children,
  className,
  interactive = false,
  padding = "md",
  tone = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cx(
        styles.surface,
        toneClassMap[tone],
        paddingClassMap[padding],
        interactive && styles.interactive,
        className,
      )}
      data-interactive={String(interactive)}
      data-padding={padding}
      data-tone={tone}
      {...props}
    >
      {children}
    </div>
  );
}

