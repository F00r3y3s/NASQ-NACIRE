import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Surface } from "@/components/ui/surface";

import styles from "./route-state.module.css";

type RouteLoadingStateProps = {
  description: string;
  title: string;
};

export function RouteLoadingState({
  description,
  title,
}: RouteLoadingStateProps) {
  return (
    <RoutePage
      badges={[{ label: "Loading", tone: "gold" }]}
      description={description}
      eyebrow="In Progress"
      title={title}
    >
      <div aria-live="polite" aria-busy="true" className={styles.stack}>
        <Surface className={styles.heroCard}>
          <div aria-hidden="true" className={`${styles.skeletonLine} ${styles.lineShort}`} />
          <div aria-hidden="true" className={`${styles.skeletonLine} ${styles.lineLong}`} />
          <div aria-hidden="true" className={`${styles.skeletonLine} ${styles.lineMedium}`} />
        </Surface>

        <div className={styles.grid}>
          <Surface className={styles.card}>
            <h2 className={shell.sectionTitle}>Preparing Records</h2>
            <div className={styles.listStack}>
              {[0, 1, 2].map((item) => (
                <div className={styles.listItem} key={item}>
                  <div
                    aria-hidden="true"
                    className={`${styles.skeletonLine} ${styles.lineMedium}`}
                  />
                  <div
                    aria-hidden="true"
                    className={`${styles.skeletonLine} ${styles.lineLong}`}
                  />
                  <div
                    aria-hidden="true"
                    className={`${styles.skeletonLine} ${styles.lineShort}`}
                  />
                </div>
              ))}
            </div>
          </Surface>

          <Surface className={styles.card}>
            <h2 className={shell.sectionTitle}>Preparing Detail Panel</h2>
            <div aria-hidden="true" className={styles.skeletonBlock} />
            <div aria-hidden="true" className={`${styles.skeletonLine} ${styles.lineLong}`} />
            <div aria-hidden="true" className={`${styles.skeletonLine} ${styles.lineMedium}`} />
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
