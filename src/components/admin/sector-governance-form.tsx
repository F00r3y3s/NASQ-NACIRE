"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldLabel, TextAreaField, TextInput } from "@/components/ui/field";
import { routePageStyles as shell } from "@/components/shell/route-page";
import {
  initialSectorGovernanceActionState,
  type SectorGovernanceInput,
} from "@/lib/admin/governance";
import { cx } from "@/lib/cx";

import styles from "./governance.module.css";

type SectorGovernanceFormProps = {
  action: (
    state: typeof initialSectorGovernanceActionState,
    formData: FormData,
  ) => Promise<typeof initialSectorGovernanceActionState>;
  initialValues: SectorGovernanceInput;
  mode: "create" | "edit";
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className={styles.fieldError} role="alert">
      {message}
    </p>
  ) : null;
}

export function SectorGovernanceForm({
  action,
  initialValues,
  mode,
}: SectorGovernanceFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialSectorGovernanceActionState,
  );
  const [formValues, setFormValues] = useState(initialValues);

  return (
    <form action={formAction} aria-busy={isPending} className={styles.formStack}>
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <input name="sectorId" type="hidden" value={formValues.id} />

      <div className={styles.metaGrid}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="sector-slug">Slug</FieldLabel>
          <TextInput
            id="sector-slug"
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

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="sector-order">Display Order</FieldLabel>
          <TextInput
            id="sector-order"
            name="displayOrder"
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                displayOrder: event.target.value,
              }))
            }
            value={formValues.displayOrder}
          />
          <FieldError message={state.fieldErrors.displayOrder} />
        </div>
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="sector-name">Sector Name</FieldLabel>
        <TextInput
          id="sector-name"
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
        <FieldLabel htmlFor="sector-description">Description</FieldLabel>
        <TextAreaField
          id="sector-description"
          name="description"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={5}
          value={formValues.description}
        />
        <FieldError message={state.fieldErrors.description} />
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="sector-icon-key">Icon Key</FieldLabel>
        <TextInput
          id="sector-icon-key"
          name="iconKey"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              iconKey: event.target.value,
            }))
          }
          placeholder="oil-gas, healthcare, logistics..."
          value={formValues.iconKey}
        />
      </div>

      <label className={styles.toggleCard}>
        <div>
          <span className={styles.toggleLabel}>Visible in Public Discovery</span>
          <span className={styles.toggleHint}>
            Hidden sectors stay governed internally but drop out of public browse, analytics, and AI discovery surfaces.
          </span>
        </div>
        <input
          checked={formValues.isVisible}
          className={styles.toggleInput}
          name="isVisible"
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              isVisible: event.target.checked,
            }))
          }
          type="checkbox"
        />
      </label>

      <div className={styles.buttonRow}>
        <Button type="submit">
          {isPending
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save Sector"
              : "Create Sector"}
        </Button>
      </div>
    </form>
  );
}
