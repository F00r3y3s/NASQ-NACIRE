import Link from "next/link";
import type { Route } from "next";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Surface } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, getButtonClassName } from "@/components/ui/button";
import { SolutionEditorForm } from "@/components/solutions/solution-editor-form";
import { accountNavigation, getShellDefinitionByPattern } from "@/config/shell";
import {
  formatSolutionDate,
  getInitialSolutionAuthoringInput,
  getSolutionAccessModelLabel,
  getSolutionAuthoringStatusMessage,
  getSolutionStatusLabel,
  getSolutionStatusTone,
  getSolutionWorkspacePageData,
  resolveSolutionAccessModel,
} from "@/lib/data/member-solutions";
import { submitSolutionAuthoringAction } from "@/lib/actions/solution-authoring";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/account/solutions");

export default async function AccountSolutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const solutionParam = Array.isArray(params.solution) ? params.solution[0] : params.solution;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const challengeParam = Array.isArray(params.challenge) ? params.challenge[0] : params.challenge;
  const accessParam = Array.isArray(params.access) ? params.access[0] : params.access;
  const resolvedAccessModel = resolveSolutionAccessModel(accessParam) ?? undefined;
  const pageData = await getSolutionWorkspacePageData({
    accessModel: resolvedAccessModel,
    challengeId: challengeParam,
    solutionId: solutionParam,
  });
  const selectedSolution = pageData.selectedSolution;
  const statusMessage = pageData.solutionMissing
    ? "That solution record could not be found. Start a new one or choose another owned record."
    : getSolutionAuthoringStatusMessage(statusParam);
  const readOnly = selectedSolution?.status === "archived";
  const linkedChallengeCount = selectedSolution?.linkedChallengeCount ?? 0;
  const editorKey =
    selectedSolution?.id ??
    `new-${pageData.preselectedAccessModel ?? "default"}-${pageData.preselectedChallenge?.id ?? "none"}`;

  return (
    <RoutePage
      actions={
        <div className={styles.inlineActions}>
          {selectedSolution ? (
            <ButtonLink href="/account/solutions" variant="outline">
              New Solution
            </ButtonLink>
          ) : null}
          <ButtonLink href="/challenges" variant="outline">
            Browse Challenges
          </ButtonLink>
        </div>
      }
      badges={[
        {
          label: selectedSolution
            ? getSolutionStatusLabel(selectedSolution.status)
            : pageData.canCreateSolution
              ? "Immediate Publication"
              : "Workspace Setup Needed",
          tone: selectedSolution
            ? getSolutionStatusTone(selectedSolution.status)
            : pageData.canCreateSolution
              ? "green"
              : "gold",
        },
        {
          label: pageData.companyName ?? "No Verified Company",
          tone: pageData.companyName ? "blue" : "red",
        },
        {
          label:
            pageData.solutions.length > 0
              ? `${pageData.solutions.length} Owned Solution${
                  pageData.solutions.length === 1 ? "" : "s"
                }`
              : "No Published Records Yet",
          tone: "green",
        },
      ]}
      description={
        selectedSolution
          ? `${definition.description} Editing keeps the reusable public record intact while updating metadata and challenge links.`
          : `${definition.description} Publish a standalone reusable record, then optionally connect it to public challenges.`
      }
      eyebrow={definition.eyebrow}
      tabs={accountNavigation.map((item) => ({
        ...item,
        active: item.href === "/account/solutions",
      }))}
      title={definition.title}
    >
      <div className={shell.gridTwo}>
        <Surface>
          <h2 className={shell.sectionTitle}>
            {selectedSolution ? "Edit Solution Record" : "Publish a Solution"}
          </h2>
          <p className={shell.copy} style={{ marginBottom: "16px" }}>
            {selectedSolution
              ? "Update the public summary, offering detail, access model, and optional challenge links without creating a duplicate record."
              : "Solutions remain independent reusable records. Verified members can publish immediately and refine the record later from this workspace."}
          </p>

          <SolutionEditorForm
            action={submitSolutionAuthoringAction}
            candidateChallenges={pageData.candidateChallenges}
            companyName={pageData.companyName}
            initialValues={getInitialSolutionAuthoringInput(selectedSolution, {
              preselectedAccessModel: pageData.preselectedAccessModel,
              preselectedChallenge: pageData.preselectedChallenge,
            })}
            key={editorKey}
            mode={selectedSolution ? "edit" : "create"}
            readOnly={readOnly}
            sectors={pageData.sectors}
            statusMessage={statusMessage}
            workspaceError={pageData.workspaceError}
          />
        </Surface>

        <div className={shell.stack}>
          <Surface>
            <h2 className={shell.sectionTitle}>Workspace Snapshot</h2>
            <div className={shell.metaGrid}>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Owned Records</div>
                <div className={shell.metaValue}>{pageData.solutions.length}</div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Published Challenge Options</div>
                <div className={shell.metaValue}>{pageData.candidateChallenges.length}</div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Selected Links</div>
                <div className={shell.metaValue}>
                  {selectedSolution ? linkedChallengeCount : "Optional on publish"}
                </div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Current Record</div>
                <div className={shell.metaValue}>
                  {selectedSolution
                    ? getSolutionAccessModelLabel(selectedSolution.accessModel)
                    : "New solution"}
                </div>
              </div>
            </div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Your Solution Records</h2>
            {pageData.solutions.length > 0 ? (
              <div className={styles.solutionList}>
                {pageData.solutions.map((solution) => (
                  <Link
                    className={`${styles.solutionLink} ${
                      selectedSolution?.id === solution.id ? styles.solutionLinkActive : ""
                    }`}
                    href={`/account/solutions?solution=${solution.id}` as Route}
                    key={solution.id}
                  >
                    <Badge tone={getSolutionStatusTone(solution.status)}>
                      {getSolutionStatusLabel(solution.status)}
                    </Badge>
                    <div className={styles.solutionTitle} style={{ marginTop: "10px" }}>
                      {solution.input.title}
                    </div>
                    <div className={styles.solutionMeta}>
                      {solution.companyName ?? "Company workspace"} ·{" "}
                      {getSolutionAccessModelLabel(solution.accessModel)} ·{" "}
                      {solution.linkedChallengeCount} linked challenge
                      {solution.linkedChallengeCount === 1 ? "" : "s"}
                    </div>
                    <div className={styles.solutionMeta}>
                      Updated {formatSolutionDate(solution.updatedAt)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>
                No solution records yet. Publish your first reusable record here and it will immediately appear in this workspace.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Publishing Rules</h2>
            <ul className={shell.list}>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Immediate publication</div>
                  <div className={shell.listSecondary}>
                    Verified-member solutions publish immediately in v1 and stay editable from this workspace.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Reusable records</div>
                  <div className={shell.listSecondary}>
                    Solutions stand alone first, then optionally link to multiple published challenges without duplicating the solution itself.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Current focus</div>
                  <div className={shell.listSecondary}>
                    {selectedSolution
                      ? `${selectedSolution.linkedChallengeCount} linked challenge${
                          selectedSolution.linkedChallengeCount === 1 ? "" : "s"
                        } · ${getSolutionAccessModelLabel(selectedSolution.accessModel)} · ${formatSolutionDate(selectedSolution.publishedAt)}`
                      : "Create a new reusable solution record or select one of your existing records to edit it."}
                  </div>
                </div>
              </li>
            </ul>

            {selectedSolution ? (
              <div style={{ marginTop: "18px" }}>
                <h3 className={shell.sectionTitle}>Linked Challenges</h3>
                {selectedSolution.linkedChallenges.length > 0 ? (
                  <ul className={shell.list}>
                    {selectedSolution.linkedChallenges.map((challenge) => (
                      <li className={shell.listItem} key={challenge.id}>
                        <div>
                          <div className={shell.listPrimary}>{challenge.title}</div>
                          <div className={shell.listSecondary}>
                            {challenge.sectorName} · {challenge.companyName}
                          </div>
                        </div>
                        <span
                          className={getButtonClassName({
                            size: "sm",
                            variant: "soft",
                          })}
                        >
                          Linked
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={shell.copy}>
                    This solution is currently standalone. Use the checklist in the editor to connect it to relevant published challenges.
                  </p>
                )}
              </div>
            ) : null}
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
