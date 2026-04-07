import Link from "next/link";
import type { Route } from "next";

import styles from "@/components/admin/governance.module.css";
import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Button } from "@/components/ui/button";
import { FieldLabel, SelectField } from "@/components/ui/field";
import { Surface } from "@/components/ui/surface";
import { adminNavigation, getShellDefinitionByPattern } from "@/config/shell";
import {
  createChallengeSolutionLinkAction,
  deleteChallengeSolutionLinkAction,
} from "@/lib/actions/admin-governance";
import { getAdminLinksViewModel } from "@/lib/data/admin-governance";
import { cx } from "@/lib/cx";

const definition = getShellDefinitionByPattern("/admin/links");

type LinksPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LinksPage({ searchParams }: LinksPageProps) {
  const links = await getAdminLinksViewModel(searchParams);

  return (
    <RoutePage
      badges={links.badges}
      description={definition.description}
      eyebrow={definition.eyebrow}
      tabs={adminNavigation.map((item) => ({
        ...item,
        active: item.href === "/admin/links",
      }))}
      title={definition.title}
    >
      <div className={shell.stack}>
        <Surface>
          <p className={shell.copy}>{links.supportingText}</p>
          {links.statusMessage ? (
            <div
              aria-live="polite"
              className={cx(styles.notice, styles.noticeSuccess)}
              role="status"
              style={{ marginTop: 14 }}
            >
              {links.statusMessage}
            </div>
          ) : null}
          {links.state === "error" ? (
            <div
              aria-live="assertive"
              className={cx(styles.notice, styles.noticeError)}
              role="alert"
              style={{ marginTop: 14 }}
            >
              Link oversight could not be loaded. Verify the Supabase connection and the public-safe publish states for challenges and solutions.
            </div>
          ) : null}
        </Surface>

        <div className={styles.grid}>
          <Surface className={styles.listPanel}>
            <h2 className={shell.sectionTitle}>Existing Challenge-Solution Links</h2>
            {links.links.length > 0 ? (
              links.links.map((link) => (
                <Link
                  className={`${styles.listLink} ${
                    link.selected ? styles.listLinkSelected : ""
                  }`}
                  href={link.href as Route}
                  key={link.id}
                >
                  <div className={styles.listTitle}>{link.challengeLabel}</div>
                  <div className={styles.listSubtitle}>{link.solutionLabel}</div>
                  <div className={styles.listMeta}>
                    Linked by {link.linkedByLabel} · {link.createdLabel}
                  </div>
                </Link>
              ))
            ) : (
              <p className={shell.copy}>
                No governed links exist yet. Create the first association from the published candidate records.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Create Governed Link</h2>
            <div className={styles.stack}>
              <p className={shell.copy}>{links.createHint}</p>
              <form action={createChallengeSolutionLinkAction} className={styles.formStack}>
                <div className={shell.fieldGroup}>
                  <FieldLabel htmlFor="link-challenge">Published Challenge</FieldLabel>
                  <SelectField
                    defaultValue=""
                    id="link-challenge"
                    name="challengeId"
                  >
                    <option disabled value="">
                      Select a challenge
                    </option>
                    {links.candidates.challenges.map((challenge) => (
                      <option key={challenge.id} value={challenge.id}>
                        {challenge.label}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className={shell.fieldGroup}>
                  <FieldLabel htmlFor="link-solution">Published Solution</FieldLabel>
                  <SelectField defaultValue="" id="link-solution" name="solutionId">
                    <option disabled value="">
                      Select a solution
                    </option>
                    {links.candidates.solutions.map((solution) => (
                      <option key={solution.id} value={solution.id}>
                        {solution.label}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className={styles.buttonRow}>
                  <Button
                    disabled={
                      links.candidates.challenges.length === 0 ||
                      links.candidates.solutions.length === 0
                    }
                    type="submit"
                  >
                    Create Link
                  </Button>
                </div>
              </form>
            </div>
          </Surface>
        </div>

        <Surface>
          <h2 className={shell.sectionTitle}>Selected Link Oversight</h2>
          {links.selectedLink ? (
            <div className={styles.stack}>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryLabel}>Challenge</div>
                  <div className={styles.summaryValue}>{links.selectedLink.challengeLabel}</div>
                </div>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryLabel}>Solution</div>
                  <div className={styles.summaryValue}>{links.selectedLink.solutionLabel}</div>
                </div>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryLabel}>Linked By</div>
                  <div className={styles.summaryValue}>{links.selectedLink.linkedByLabel}</div>
                </div>
              </div>
              <p className={shell.copy}>
                Created {links.selectedLink.createdLabel}. Remove this only when the relationship is misleading, outdated, or no longer safe to show in public browse flows.
              </p>
              <form action={deleteChallengeSolutionLinkAction} className={styles.buttonRow}>
                <input name="linkId" type="hidden" value={links.selectedLink.id} />
                <Button type="submit" variant="soft">
                  Remove Link
                </Button>
              </form>
            </div>
          ) : (
            <p className={shell.copy}>
              Select a governed link to review its provenance or remove it.
            </p>
          )}
        </Surface>
      </div>
    </RoutePage>
  );
}
