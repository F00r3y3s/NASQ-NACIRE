"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldLabel, SelectField, TextAreaField } from "@/components/ui/field";
import { routePageStyles as shell } from "@/components/shell/route-page";
import {
  initialChallengeModerationActionState,
  initialSolutionModerationActionState,
} from "@/lib/admin/governance";
import { cx } from "@/lib/cx";

import styles from "./governance.module.css";

type ModerationOption = {
  label: string;
  value: string;
};

type ModerationReviewFormProps = {
  action: (
    state: {
      fieldErrors: Record<string, string | undefined>;
      formError?: string;
    },
    formData: FormData,
  ) => Promise<{
    fieldErrors: Record<string, string | undefined>;
    formError?: string;
  }>;
  initialValues: {
    id: string;
    reviewNotes: string;
    status: string;
  };
  kind: "challenge" | "solution";
  options: ModerationOption[];
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className={styles.fieldError} role="alert">
      {message}
    </p>
  ) : null;
}

export function ModerationReviewForm({
  action,
  initialValues,
  kind,
  options,
}: ModerationReviewFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    kind === "challenge"
      ? initialChallengeModerationActionState
      : initialSolutionModerationActionState,
  );
  const [formValues, setFormValues] = useState(initialValues);

  return (
    <form action={formAction} aria-busy={isPending} className={styles.formStack}>
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <input
        name={kind === "challenge" ? "challengeId" : "solutionId"}
        type="hidden"
        value={formValues.id}
      />

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor={`${kind}-status`}>Moderation Status</FieldLabel>
        <SelectField
          id={`${kind}-status`}
          name="status"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              status: event.target.value,
            }))
          }
          value={formValues.status}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <FieldError message={state.fieldErrors.status} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor={`${kind}-review-notes`}>Review Notes</FieldLabel>
        <TextAreaField
          id={`${kind}-review-notes`}
          name="reviewNotes"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              reviewNotes: event.target.value,
            }))
          }
          placeholder={
            kind === "challenge"
              ? "Add a clear review decision for the challenge owner and future audit context."
              : "Add a clear override note for the solution owner and future audit context."
          }
          rows={6}
          value={formValues.reviewNotes}
        />
        <p className={styles.helperText}>
          Rejections, hides, and archives should always carry enough context for later governance review.
        </p>
        <FieldError message={state.fieldErrors.reviewNotes} />
      </div>

      <div className={styles.buttonRow}>
        <Button type="submit">
          {isPending
            ? kind === "challenge"
              ? "Saving review..."
              : "Saving override..."
            : kind === "challenge"
              ? "Save Challenge Review"
              : "Save Solution Override"}
        </Button>
      </div>
    </form>
  );
}
