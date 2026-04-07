import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { cx } from "@/lib/cx";

import styles from "./challenge-card.module.css";

type ChallengeCardProps = {
  anonymous?: boolean;
  companyLabel?: string;
  meta: readonly string[];
  sectorLabel: string;
  sectorTone: BadgeTone;
  statusLabel: string;
  statusTone: BadgeTone;
  summary: string;
  title: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ChallengeCard({
  anonymous = false,
  companyLabel,
  meta,
  sectorLabel,
  sectorTone,
  statusLabel,
  statusTone,
  summary,
  title,
}: ChallengeCardProps) {
  const ownerLabel = anonymous ? "Anonymous" : companyLabel ?? "Verified Member";
  const avatarLabel = anonymous ? "👤" : getInitials(ownerLabel);

  return (
    <Surface className={styles.card} interactive>
      <div className={styles.top}>
        <div className={styles.topMeta}>
          <Badge tone={sectorTone}>{sectorLabel}</Badge>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.summary}>{summary}</p>
      <div className={styles.footer}>
        <div className={styles.owner}>
          <span
            className={cx(styles.avatar, anonymous && styles.anonymousAvatar)}
            aria-hidden="true"
          >
            {avatarLabel}
          </span>
          {ownerLabel}
        </div>
        <div className={styles.meta}>
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </Surface>
  );
}
