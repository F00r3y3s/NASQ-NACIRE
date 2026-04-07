import { notFound } from "next/navigation";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { ButtonLink } from "@/components/ui/button";
import { ChallengeEditorForm } from "@/components/challenges/challenge-editor-form";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import { submitChallengeEditorAction } from "@/lib/actions/challenge-submission";
import {
  formatEditorDate,
  getChallengeDraftStatusLabel,
  getChallengeEditorPageData,
  getInitialChallengeSubmissionInput,
  getSubmissionStatusMessage,
} from "@/lib/data/member-challenge-editor";

const definition = getShellDefinitionByPattern("/drafts/[id]");

export default async function DraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const pageData = await getChallengeEditorPageData({ draftId: id });
  const draft = pageData.currentDraft;
  const statusParam = Array.isArray(search.status) ? search.status[0] : search.status;
  const statusMessage = getSubmissionStatusMessage(statusParam);

  if (pageData.draftMissing || !draft) {
    notFound();
  }

  const isSubmitted = draft.status === "submitted";

  return (
    <RoutePage
      badges={[
        { label: getChallengeDraftStatusLabel(draft.status), tone: isSubmitted ? "green" : "gold" },
        {
          label: pageData.companyName ?? "Verified Workspace",
          tone: pageData.companyName ? "blue" : "green",
        },
      ]}
      description={definition.description}
      eyebrow={definition.eyebrow}
      title={draft.input.title || definition.title}
    >
      <div className={shell.gridTwo}>
        <Surface>
          <ChallengeEditorForm
            action={submitChallengeEditorAction}
            companyName={pageData.companyName}
            initialValues={getInitialChallengeSubmissionInput(draft)}
            readOnly={isSubmitted}
            sectors={pageData.sectors}
            statusMessage={statusMessage}
            workspaceError={pageData.workspaceError}
          />
        </Surface>

        <Surface>
          <h2 className={shell.sectionTitle}>Draft Snapshot</h2>
          <div className={shell.metaGrid}>
            <div className={shell.metaItem}>
              <div className={shell.metaLabel}>Status</div>
              <div className={shell.metaValue}>{getChallengeDraftStatusLabel(draft.status)}</div>
            </div>
            <div className={shell.metaItem}>
              <div className={shell.metaLabel}>Last Updated</div>
              <div className={shell.metaValue}>{formatEditorDate(draft.updatedAt)}</div>
            </div>
            <div className={shell.metaItem}>
              <div className={shell.metaLabel}>Completion</div>
              <div className={shell.metaValue}>
                {draft.completion.completed} of {draft.completion.total} required fields
              </div>
            </div>
            <div className={shell.metaItem}>
              <div className={shell.metaLabel}>Visibility</div>
              <div className={shell.metaValue}>
                {draft.input.anonymityMode === "anonymous" ? "Anonymous" : "Named"}
              </div>
            </div>
          </div>

          <h2 className={shell.sectionTitle} style={{ marginTop: "18px" }}>
            Next Actions
          </h2>
          <ul className={shell.list}>
            <li className={shell.listItem}>
              <div>
                <div className={shell.listPrimary}>
                  {isSubmitted ? "Moderation pending" : "Resume structured editing"}
                </div>
                <div className={shell.listSecondary}>
                  {isSubmitted
                    ? "This draft snapshot is now locked while the linked challenge waits for review."
                    : "Continue editing in the form and save as many times as you need before submitting."}
                </div>
              </div>
            </li>
            <li className={shell.listItem}>
              <div>
                <div className={shell.listPrimary}>
                  {draft.sourceConversationId ? "AI-assisted origin" : "Submission route"}
                </div>
                <div className={shell.listSecondary}>
                  {draft.sourceConversationId
                    ? "This draft was seeded from an AI conversation and stays linked to that thread as editable provenance."
                    : "This draft was created directly in the member submission workflow."}
                </div>
              </div>
            </li>
          </ul>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <ButtonLink href="/submit" variant="outline">
              Start New Draft
            </ButtonLink>
            <ButtonLink href={isSubmitted ? "/account/challenges" : "/ai"}>
              {isSubmitted ? "Open My Challenges" : "Ask AI Assistant"}
            </ButtonLink>
          </div>
        </Surface>
      </div>
    </RoutePage>
  );
}
