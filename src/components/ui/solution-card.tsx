import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";

import styles from "./solution-card.module.css";

type SolutionCardProps = {
  engagementLabel: string;
  publicationLabel: string;
  publicationTone: BadgeTone;
  regionLabel: string;
  sectorLabel: string;
  sectorTone: BadgeTone;
  summary: string;
  title: string;
  votes: number;
};

export function SolutionCard({
  engagementLabel,
  publicationLabel,
  publicationTone,
  regionLabel,
  sectorLabel,
  sectorTone,
  summary,
  title,
  votes,
}: SolutionCardProps) {
  return (
    <Surface className={styles.card} interactive>
      <div>
        <Badge tone={publicationTone} style={{ marginBottom: "10px" }}>
          {publicationLabel}
        </Badge>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.summary}>{summary}</p>
        <div className={styles.meta}>
          <Badge tone={sectorTone}>{sectorLabel}</Badge>
          <span className={styles.region}>{regionLabel}</span>
        </div>
      </div>
      <div className={styles.aside}>
        <span aria-label={`${votes} votes`} className={styles.upvote}>
          ▲ {votes}
        </span>
        <span className={styles.engagement}>{engagementLabel}</span>
      </div>
    </Surface>
  );
}
