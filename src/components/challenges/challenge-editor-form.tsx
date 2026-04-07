"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldLabel,
  SelectField,
  TextAreaField,
  TextInput,
} from "@/components/ui/field";
import { routePageStyles as shell } from "@/components/shell/route-page";
import { cx } from "@/lib/cx";
import {
  challengeGeographyOptions,
  initialChallengeSubmissionActionState,
  type ChallengeSubmissionActionState,
  type ChallengeSubmissionInput,
} from "@/lib/challenges/submission";
import type { ChallengeEditorSectorOption } from "@/lib/data/member-challenge-editor";

import styles from "./challenge-editor-form.module.css";

const solutionPaths = {
  free: "/account/solutions?access=free",
  paid: "/account/solutions?access=paid",
} as const;

type ChallengeEditorFormProps = {
  action: (
    state: ChallengeSubmissionActionState,
    formData: FormData,
  ) => Promise<ChallengeSubmissionActionState>;
  companyName: string | null;
  initialValues: ChallengeSubmissionInput;
  readOnly?: boolean;
  sectors: ChallengeEditorSectorOption[];
  statusMessage?: string | null;
  workspaceError?: string | null;
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className={styles.fieldError} role="alert">
      {message}
    </p>
  ) : null;
}

export function ChallengeEditorForm({
  action,
  companyName,
  initialValues,
  readOnly = false,
  sectors,
  statusMessage,
  workspaceError,
}: ChallengeEditorFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialChallengeSubmissionActionState,
  );
  const [formValues, setFormValues] = useState(initialValues);

  const isDisabled = isPending || readOnly || Boolean(workspaceError);

  return (
    <form action={formAction} aria-busy={isPending} className={shell.formStack}>
      {statusMessage ? (
        <div aria-live="polite" className={cx(styles.notice, styles.noticeSuccess)} role="status">
          {statusMessage}
        </div>
      ) : null}
      {workspaceError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {workspaceError}
        </div>
      ) : null}
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <input name="draftId" type="hidden" value={formValues.draftId} />
      <input name="sourceConversationId" type="hidden" value={formValues.sourceConversationId} />
      <input name="anonymityMode" type="hidden" value={formValues.anonymityMode} />

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="sectorId">Industry Sector</FieldLabel>
        <SelectField
          disabled={isDisabled}
          id="sectorId"
          name="sectorId"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              sectorId: event.target.value,
            }))
          }
          value={formValues.sectorId}
        >
          <option value="">Select a governed sector</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </SelectField>
        <FieldError message={state.fieldErrors.sectorId} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="title">Challenge Title</FieldLabel>
        <TextInput
          disabled={isDisabled}
          id="title"
          name="title"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          placeholder="A concise title describing the challenge…"
          value={formValues.title}
        />
        <p className={styles.helperText}>This becomes the working title in moderation and later public discovery.</p>
        <FieldError message={state.fieldErrors.title} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="summary">Public-safe Summary</FieldLabel>
        <TextAreaField
          disabled={isDisabled}
          id="summary"
          name="summary"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              summary: event.target.value,
            }))
          }
          placeholder="Summarize the challenge in 1-2 clear sentences for reviewers and later public browse cards."
          rows={4}
          value={formValues.summary}
        />
        <FieldError message={state.fieldErrors.summary} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="problemStatement">Problem Statement</FieldLabel>
        <TextAreaField
          disabled={isDisabled}
          id="problemStatement"
          name="problemStatement"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              problemStatement: event.target.value,
            }))
          }
          placeholder="Describe the operational context, current blockers, impact, and constraints in enough detail for moderation."
          rows={7}
          value={formValues.problemStatement}
        />
        <FieldError message={state.fieldErrors.problemStatement} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel>Do you already have a solution?</FieldLabel>
        <div className={styles.solutionChoices}>
          <div
            aria-current="true"
            className={cx(styles.solutionChoiceCard, styles.solutionChoiceActive)}
          >
            <div className={styles.solutionChoiceIcon}>❌</div>
            <div className={styles.solutionChoiceLabel}>No Solution</div>
            <div className={styles.solutionChoiceDescription}>Seeking help</div>
          </div>

          <Link className={styles.solutionChoiceCard} href={solutionPaths.free}>
            <div className={styles.solutionChoiceIcon}>🆓</div>
            <div className={styles.solutionChoiceLabel}>Free Solution</div>
            <div className={styles.solutionChoiceDescription}>Share openly</div>
          </Link>

          <Link className={styles.solutionChoiceCard} href={solutionPaths.paid}>
            <div className={styles.solutionChoiceIcon}>💰</div>
            <div className={styles.solutionChoiceLabel}>Paid Solution</div>
            <div className={styles.solutionChoiceDescription}>Commercial offer</div>
          </Link>
        </div>
        <p className={styles.helperText}>
          Stay here to submit a challenge, or jump into solution publishing with the right access
          model preselected.
        </p>
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="desiredOutcome">Desired Outcome</FieldLabel>
        <TextAreaField
          disabled={isDisabled}
          id="desiredOutcome"
          name="desiredOutcome"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              desiredOutcome: event.target.value,
            }))
          }
          placeholder="Optional: describe the operational or business outcome you need from a viable solution."
          rows={4}
          value={formValues.desiredOutcome}
        />
        <FieldError message={state.fieldErrors.desiredOutcome} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="geographyLabel">Geography Scope</FieldLabel>
        <SelectField
          disabled={isDisabled}
          id="geographyLabel"
          name="geographyLabel"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              geographyLabel: event.target.value,
            }))
          }
          value={formValues.geographyLabel}
        >
          <option value="">Select geography scope</option>
          {challengeGeographyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <FieldError message={state.fieldErrors.geographyLabel} />
      </div>

      <label className={styles.toggleCard}>
        <div>
          <span className={shell.toggleStrong}>Anonymous Submission</span>
          <span className={shell.toggleText}>
            {companyName
              ? `Hide ${companyName} on the public challenge page until relay or moderation policies allow otherwise.`
              : "Hide your company identity on the public challenge page."}
          </span>
        </div>
        <input
          checked={formValues.anonymityMode === "anonymous"}
          className={styles.srOnly}
          disabled={isDisabled}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              anonymityMode: event.target.checked ? "anonymous" : "named",
            }))
          }
          type="checkbox"
        />
        <span
          aria-hidden="true"
          className={cx(shell.toggle, formValues.anonymityMode === "named" && shell.toggleOff)}
        />
      </label>

      {readOnly ? (
        <div aria-live="polite" className={cx(styles.notice, styles.noticeSuccess)} role="status">
          This draft is now locked because it has already been submitted for review.
        </div>
      ) : (
        <div className={styles.buttonRow}>
          <Button disabled={isDisabled} name="intent" type="submit" value="save_draft" variant="outline">
            {isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button disabled={isDisabled} name="intent" type="submit" value="submit_for_review">
            {isPending ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      )}
    </form>
  );
}
