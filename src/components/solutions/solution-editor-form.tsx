"use client";

import { useActionState, useState } from "react";

import { routePageStyles as shell } from "@/components/shell/route-page";
import { Button } from "@/components/ui/button";
import {
  FieldLabel,
  SelectField,
  TextAreaField,
  TextInput,
} from "@/components/ui/field";
import { cx } from "@/lib/cx";
import {
  initialSolutionAuthoringActionState,
  solutionCoverageOptions,
  solutionAccessModelOptions,
  type SolutionAuthoringActionState,
  type SolutionAuthoringInput,
} from "@/lib/solutions/authoring";
import type {
  SolutionEditorSectorOption,
  SolutionLinkChallengeOption,
} from "@/lib/data/member-solutions";

import styles from "./solution-editor-form.module.css";

type SolutionEditorFormProps = {
  action: (
    state: SolutionAuthoringActionState,
    formData: FormData,
  ) => Promise<SolutionAuthoringActionState>;
  candidateChallenges: SolutionLinkChallengeOption[];
  companyName: string | null;
  initialValues: SolutionAuthoringInput;
  mode: "create" | "edit";
  readOnly?: boolean;
  sectors: SolutionEditorSectorOption[];
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

export function SolutionEditorForm({
  action,
  candidateChallenges,
  companyName,
  initialValues,
  mode,
  readOnly = false,
  sectors,
  statusMessage,
  workspaceError,
}: SolutionEditorFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialSolutionAuthoringActionState,
  );
  const [formValues, setFormValues] = useState(initialValues);
  const coverageOptions = solutionCoverageOptions.some(
    (option) => option.value === formValues.coverageLabel,
  )
    ? solutionCoverageOptions
    : formValues.coverageLabel
      ? [
          ...solutionCoverageOptions,
          {
            label: `${formValues.coverageLabel} (Current)`,
            value: formValues.coverageLabel,
          },
        ]
      : solutionCoverageOptions;

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

      <input name="solutionId" type="hidden" value={formValues.solutionId} />

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
        <FieldLabel htmlFor="title">Solution Title</FieldLabel>
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
          placeholder="A concise title describing the reusable solution..."
          value={formValues.title}
        />
        <p className={styles.helperText}>
          This becomes the published record title across browse, detail, and linked challenge contexts.
        </p>
        <FieldError message={state.fieldErrors.title} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="summary">Public Summary</FieldLabel>
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
          placeholder="Summarize the solution in 1-2 clear sentences for public discovery."
          rows={4}
          value={formValues.summary}
        />
        <FieldError message={state.fieldErrors.summary} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="offeringDescription">Offering Description</FieldLabel>
        <TextAreaField
          disabled={isDisabled}
          id="offeringDescription"
          name="offeringDescription"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              offeringDescription: event.target.value,
            }))
          }
          placeholder="Describe how the solution works, what it covers, and the operational fit across sectors or challenge types."
          rows={7}
          value={formValues.offeringDescription}
        />
        <FieldError message={state.fieldErrors.offeringDescription} />
      </div>

      <div className={shell.metaGrid}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="coverageLabel">Coverage Label</FieldLabel>
          <SelectField
            disabled={isDisabled}
            id="coverageLabel"
            name="coverageLabel"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                coverageLabel: event.target.value,
              }))
            }
            value={formValues.coverageLabel}
          >
            {coverageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <p className={styles.helperText}>
            Choose where this solution is ready to be adopted or commercially delivered.
          </p>
          <FieldError message={state.fieldErrors.coverageLabel} />
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="accessModel">Access Model</FieldLabel>
          <SelectField
            disabled={isDisabled}
            id="accessModel"
            name="accessModel"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                accessModel: event.target.value as SolutionAuthoringInput["accessModel"],
              }))
            }
            value={formValues.accessModel}
          >
            {solutionAccessModelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <p className={styles.helperText}>
            {solutionAccessModelOptions.find((option) => option.value === formValues.accessModel)
              ?.description ?? "Choose how members should engage this solution."}
          </p>
          <FieldError message={state.fieldErrors.accessModel} />
        </div>
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel>Optional Challenge Links</FieldLabel>
        <p className={styles.helperText}>
          Link published challenges this solution can credibly address. Leave this blank to keep the record fully standalone.
        </p>
        {candidateChallenges.length > 0 ? (
          <div className={styles.challengeList}>
            {candidateChallenges.map((challenge) => {
              const checked = formValues.linkedChallengeIds.includes(challenge.id);

              return (
                <label className={styles.challengeOption} key={challenge.id}>
                  <input
                    checked={checked}
                    disabled={isDisabled}
                    name="linkedChallengeIds"
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        linkedChallengeIds: event.target.checked
                          ? [...current.linkedChallengeIds, challenge.id]
                          : current.linkedChallengeIds.filter((id) => id !== challenge.id),
                      }))
                    }
                    type="checkbox"
                    value={challenge.id}
                  />
                  <span>
                    <span className={styles.challengeTitle}>{challenge.title}</span>
                    <span className={styles.challengeMeta}>
                      {challenge.sectorName} · {challenge.companyName}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div aria-live="polite" className={cx(styles.notice, styles.noticeSuccess)} role="status">
            No public challenges are available for optional linking yet. You can still publish this solution now.
          </div>
        )}
        <FieldError message={state.fieldErrors.linkedChallengeIds} />
      </div>

      {readOnly ? (
        <div aria-live="polite" className={cx(styles.notice, styles.noticeError)} role="status">
          Archived solutions are locked and can no longer be edited from the member workspace.
        </div>
      ) : (
        <div className={styles.buttonRow}>
          <Button disabled={isDisabled} type="submit">
            {isPending
              ? mode === "edit"
                ? "Saving..."
                : "Publishing..."
              : mode === "edit"
                ? "Save Changes"
                : "Publish Solution"}
          </Button>
          <div aria-live="polite" className={cx(styles.notice, styles.noticeSuccess)} role="status">
            {companyName
              ? `Publishing as ${companyName}. Verified-member solutions go live immediately in v1.`
              : "Verified-member solutions go live immediately in v1."}
          </div>
        </div>
      )}
    </form>
  );
}
