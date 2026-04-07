import type { Route } from "next";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { ButtonLink } from "@/components/ui/button";
import { ChallengeEditorForm } from "@/components/challenges/challenge-editor-form";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import {
  formatEditorDate,
  getChallengeEditorPageData,
  getInitialChallengeSubmissionInput,
  getSubmissionStatusMessage,
} from "@/lib/data/member-challenge-editor";
import { submitChallengeEditorAction } from "@/lib/actions/challenge-submission";

const definition = getShellDefinitionByPattern("/submit");

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const pageData = await getChallengeEditorPageData();
  const latestDraft = pageData.latestDraft;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const statusMessage = getSubmissionStatusMessage(statusParam);

  return (
    <RoutePage
      badges={[
        {
          label: pageData.companyName ?? "Verified Workspace",
          tone: pageData.companyName ? "blue" : "green",
        },
        {
          label: latestDraft ? "Draft Ready" : "Verified Members",
          tone: latestDraft ? "gold" : "green",
        },
        {
          label: pageData.workspaceError ? "Workspace Setup Needed" : "Submit for Review",
          tone: "green",
        },
      ]}
      description={definition.description}
      eyebrow={definition.eyebrow}
      title={definition.title}
    >
      <div className={shell.gridTwo}>
        <Surface>
          <ChallengeEditorForm
            action={submitChallengeEditorAction}
            companyName={pageData.companyName}
            initialValues={getInitialChallengeSubmissionInput(null)}
            sectors={pageData.sectors}
            statusMessage={statusMessage}
            workspaceError={pageData.workspaceError}
          />
        </Surface>

        <Surface>
          <h2 className={shell.sectionTitle}>Submission Workflow</h2>
          <ul className={shell.list}>
            <li className={shell.listItem}>
              <div>
                <div className={shell.listPrimary}>Save and resume</div>
                <div className={shell.listSecondary}>
                  Drafts stay editable under the protected `/drafts/[id]` route until you submit.
                </div>
              </div>
            </li>
            <li className={shell.listItem}>
              <div>
                <div className={shell.listPrimary}>Submit for review</div>
                <div className={shell.listSecondary}>
                  A successful submission inserts a `pending_review` challenge record and locks the draft snapshot.
                </div>
              </div>
            </li>
            <li className={shell.listItem}>
              <div>
                <div className={shell.listPrimary}>Anonymous handling</div>
                <div className={shell.listSecondary}>
                  Anonymous mode hides company identity on future public challenge detail pages.
                </div>
              </div>
            </li>
          </ul>

          {latestDraft ? (
            <div style={{ marginTop: "18px" }}>
              <h3 className={shell.sectionTitle}>Latest Draft</h3>
              <div className={shell.metaGrid}>
                <div className={shell.metaItem}>
                  <div className={shell.metaLabel}>Title</div>
                  <div className={shell.metaValue}>{latestDraft.input.title || "Untitled draft"}</div>
                </div>
                <div className={shell.metaItem}>
                  <div className={shell.metaLabel}>Last Updated</div>
                  <div className={shell.metaValue}>{formatEditorDate(latestDraft.updatedAt)}</div>
                </div>
                <div className={shell.metaItem}>
                  <div className={shell.metaLabel}>Completion</div>
                  <div className={shell.metaValue}>
                    {latestDraft.completion.completed} of {latestDraft.completion.total} fields
                  </div>
                </div>
                <div className={shell.metaItem}>
                  <div className={shell.metaLabel}>Visibility</div>
                  <div className={shell.metaValue}>
                    {latestDraft.input.anonymityMode === "anonymous" ? "Anonymous" : "Named"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <ButtonLink href={`/drafts/${latestDraft.id}` as Route}>Resume Draft</ButtonLink>
                <ButtonLink href="/ai" variant="outline">
                  Ask AI Assistant
                </ButtonLink>
              </div>
            </div>
          ) : null}
        </Surface>
      </div>
    </RoutePage>
  );
}
