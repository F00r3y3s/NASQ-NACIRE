"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldLabel,
  TextAreaField,
  TextInput,
} from "@/components/ui/field";
import { routePageStyles as shell } from "@/components/shell/route-page";
import {
  initialCompanyGovernanceActionState,
  type CompanyGovernanceInput,
} from "@/lib/admin/governance";
import { cx } from "@/lib/cx";

import styles from "./governance.module.css";

type CompanyGovernanceFormProps = {
  action: (
    state: typeof initialCompanyGovernanceActionState,
    formData: FormData,
  ) => Promise<typeof initialCompanyGovernanceActionState>;
  initialValues: CompanyGovernanceInput;
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className={styles.fieldError} role="alert">
      {message}
    </p>
  ) : null;
}

export function CompanyGovernanceForm({
  action,
  initialValues,
}: CompanyGovernanceFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialCompanyGovernanceActionState,
  );
  const [formValues, setFormValues] = useState(initialValues);

  return (
    <form action={formAction} aria-busy={isPending} className={styles.formStack}>
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <input name="companyId" type="hidden" value={formValues.id} />

      <div className={styles.metaGrid}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="company-name">Company Name</FieldLabel>
          <TextInput
            id="company-name"
            name="name"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            value={formValues.name}
          />
          <FieldError message={state.fieldErrors.name} />
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="company-slug">Slug</FieldLabel>
          <TextInput
            id="company-slug"
            name="slug"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                slug: event.target.value,
              }))
            }
            value={formValues.slug}
          />
          <FieldError message={state.fieldErrors.slug} />
        </div>
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="company-description">Description</FieldLabel>
        <TextAreaField
          id="company-description"
          name="description"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={4}
          value={formValues.description}
        />
      </div>

      <div className={styles.metaGrid}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="company-website">Website URL</FieldLabel>
          <TextInput
            id="company-website"
            name="websiteUrl"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                websiteUrl: event.target.value,
              }))
            }
            placeholder="https://example.com"
            value={formValues.websiteUrl}
          />
          <FieldError message={state.fieldErrors.websiteUrl} />
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="company-headquarters">Headquarters Label</FieldLabel>
          <TextInput
            id="company-headquarters"
            name="headquartersLabel"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                headquartersLabel: event.target.value,
              }))
            }
            value={formValues.headquartersLabel}
          />
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="company-country-code">Country Code</FieldLabel>
          <TextInput
            id="company-country-code"
            name="countryCode"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                countryCode: event.target.value,
              }))
            }
            placeholder="AE"
            value={formValues.countryCode}
          />
          <FieldError message={state.fieldErrors.countryCode} />
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="company-city">City</FieldLabel>
          <TextInput
            id="company-city"
            name="city"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                city: event.target.value,
              }))
            }
            value={formValues.city}
          />
        </div>
      </div>

      <label className={styles.toggleCard}>
        <div>
          <span className={styles.toggleLabel}>Public Profile Visible</span>
          <span className={styles.toggleHint}>
            Public company profiles can appear in solution and challenge discovery contexts when the related records are public-safe.
          </span>
        </div>
        <input
          checked={formValues.isPublic}
          className={styles.toggleInput}
          name="isPublic"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              isPublic: event.target.checked,
            }))
          }
          type="checkbox"
        />
      </label>

      <div className={styles.buttonRow}>
        <Button type="submit">{isPending ? "Saving..." : "Save Company Governance"}</Button>
      </div>
    </form>
  );
}
