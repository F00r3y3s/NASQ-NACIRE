import Link from "next/link";
import type { Route } from "next";
import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { adminNavigation, getShellDefinitionByPattern } from "@/config/shell";
import {
  submitChallengeModerationAction,
  submitSolutionModerationAction,
} from "@/lib/actions/admin-governance";
import { getAdminModerationViewModel } from "@/lib/data/admin-governance";

import { ModerationReviewForm } from "@/components/admin/moderation-review-form";
import styles from "@/components/admin/governance.module.css";

const definition = getShellDefinitionByPattern("/admin/moderation");

type ModerationPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ModerationPage({
  searchParams,
}: ModerationPageProps) {
  const moderation = await getAdminModerationViewModel(searchParams);

  return (
    <RoutePage
      badges={moderation.badges}
      description={definition.description}
      eyebrow={definition.eyebrow}
      tabs={adminNavigation.map((item) => ({
        ...item,
        active: item.href === "/admin/moderation",
      }))}
      title={definition.title}
    >
      <div className={shell.stack}>
        <Surface>
          <p className={shell.copy}>{moderation.supportingText}</p>
          {moderation.statusMessage ? (
            <div
              aria-live="polite"
              className={`${styles.notice} ${styles.noticeSuccess}`}
              role="status"
              style={{ marginTop: 14 }}
            >
              {moderation.statusMessage}
            </div>
          ) : null}
        </Surface>

        <div className={styles.grid}>
          <Surface className={styles.listPanel}>
            <h2 className={shell.sectionTitle}>Challenge Review Queue</h2>
            {moderation.challengeQueue.length > 0 ? (
              moderation.challengeQueue.map((item) => (
                <Link
                  className={`${styles.listLink} ${
                    item.selected ? styles.listLinkSelected : ""
                  }`}
                  href={item.href as Route}
                  key={item.id}
                >
                  <div className={styles.listTop}>
                    <div className={styles.listTitle}>{item.title}</div>
                    <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
                  </div>
                  <div className={styles.listSubtitle}>{item.subtitle}</div>
                  <div className={styles.listMeta}>{item.meta}</div>
                </Link>
              ))
            ) : (
              <p className={shell.copy}>
                No challenge records are waiting in the moderation queue right now.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Challenge Decision</h2>
            {moderation.selectedChallenge ? (
              <div className={styles.stack}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Challenge</div>
                    <div className={styles.summaryValue}>{moderation.selectedChallenge.title}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Company</div>
                    <div className={styles.summaryValue}>
                      {moderation.selectedChallenge.companyLabel}
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Last Reviewed</div>
                    <div className={styles.summaryValue}>
                      {moderation.selectedChallenge.reviewedLabel}
                    </div>
                  </div>
                </div>
                <ModerationReviewForm
                  action={submitChallengeModerationAction}
                  initialValues={{
                    id: moderation.selectedChallenge.id,
                    reviewNotes: moderation.selectedChallenge.reviewNotes,
                    status: moderation.selectedChallenge.status,
                  }}
                  key={moderation.selectedChallenge.id}
                  kind="challenge"
                  options={[
                    { label: "Publish", value: "published" },
                    { label: "Reject", value: "rejected" },
                    { label: "Archive", value: "archived" },
                  ]}
                />
              </div>
            ) : (
              <p className={shell.copy}>
                Select a challenge record from the queue to apply a governance decision.
              </p>
            )}
          </Surface>
        </div>

        <div className={styles.grid}>
          <Surface className={styles.listPanel}>
            <h2 className={shell.sectionTitle}>Solution Override Queue</h2>
            {moderation.solutionQueue.length > 0 ? (
              moderation.solutionQueue.map((item) => (
                <Link
                  className={`${styles.listLink} ${
                    item.selected ? styles.listLinkSelected : ""
                  }`}
                  href={item.href as Route}
                  key={item.id}
                >
                  <div className={styles.listTop}>
                    <div className={styles.listTitle}>{item.title}</div>
                    <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
                  </div>
                  <div className={styles.listSubtitle}>{item.subtitle}</div>
                  <div className={styles.listMeta}>{item.meta}</div>
                </Link>
              ))
            ) : (
              <p className={shell.copy}>
                No solution overrides need attention right now.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Solution Override</h2>
            {moderation.selectedSolution ? (
              <div className={styles.stack}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Solution</div>
                    <div className={styles.summaryValue}>{moderation.selectedSolution.title}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Provider</div>
                    <div className={styles.summaryValue}>
                      {moderation.selectedSolution.companyLabel}
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Current State</div>
                    <div className={styles.summaryValue}>
                      {moderation.selectedSolution.statusLabel}
                    </div>
                  </div>
                </div>
                <ModerationReviewForm
                  action={submitSolutionModerationAction}
                  initialValues={{
                    id: moderation.selectedSolution.id,
                    reviewNotes: moderation.selectedSolution.reviewNotes,
                    status: moderation.selectedSolution.status,
                  }}
                  key={moderation.selectedSolution.id}
                  kind="solution"
                  options={[
                    { label: "Published", value: "published" },
                    { label: "Under Review", value: "under_review" },
                    { label: "Hidden", value: "hidden" },
                    { label: "Archived", value: "archived" },
                  ]}
                />
              </div>
            ) : (
              <p className={shell.copy}>
                Select a solution record to apply visibility or review overrides.
              </p>
            )}
          </Surface>
        </div>

        <Surface>
          <h2 className={shell.sectionTitle}>Recent Governance Actions</h2>
          {moderation.recentEvents.length > 0 ? (
            <div className={styles.feedList}>
              {moderation.recentEvents.map((event) => (
                <div className={styles.feedItem} key={`${event.text}-${event.meta}`}>
                  <div className={styles.feedText}>{event.text}</div>
                  <div className={styles.feedMeta}>{event.meta}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={shell.copy}>
              Governance actions will appear here once moderation decisions and overrides are saved.
            </p>
          )}
        </Surface>
      </div>
    </RoutePage>
  );
}
