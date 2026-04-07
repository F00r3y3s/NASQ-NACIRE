"use client";

import { useActionState } from "react";

import { routePageStyles as shell } from "@/components/shell/route-page";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextAreaField, TextInput } from "@/components/ui/field";
import {
  initialMembershipOnboardingActionState,
  type MembershipOnboardingActionState,
} from "@/lib/auth/onboarding";
import { cx } from "@/lib/cx";

import styles from "./account-onboarding-form.module.css";

type AccountOnboardingFormProps = {
  action: (
    state: MembershipOnboardingActionState,
    formData: FormData,
  ) => Promise<MembershipOnboardingActionState>;
};

export function AccountOnboardingForm({ action }: AccountOnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialMembershipOnboardingActionState,
  );

  return (
    <form action={formAction} aria-busy={isPending} className={shell.formStack}>
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <div className={shell.gridTwo}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
          <TextInput
            defaultValue={state.defaultValues.companyName}
            disabled={isPending}
            id="companyName"
            name="companyName"
            placeholder="Clinical Flow Systems"
          />
          {state.fieldErrors.companyName ? (
            <p className={styles.fieldError} role="alert">
              {state.fieldErrors.companyName}
            </p>
          ) : null}
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="companySlug">Company Slug</FieldLabel>
          <TextInput
            defaultValue={state.defaultValues.companySlug}
            disabled={isPending}
            id="companySlug"
            name="companySlug"
            placeholder="auto-generated from company name"
          />
          {state.fieldErrors.companySlug ? (
            <p className={styles.fieldError} role="alert">
              {state.fieldErrors.companySlug}
            </p>
          ) : null}
        </div>
      </div>

      <div className={shell.gridTwo}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="websiteUrl">Company Website</FieldLabel>
          <TextInput
            defaultValue={state.defaultValues.websiteUrl}
            disabled={isPending}
            id="websiteUrl"
            name="websiteUrl"
            placeholder="https://company.example"
          />
          {state.fieldErrors.websiteUrl ? (
            <p className={styles.fieldError} role="alert">
              {state.fieldErrors.websiteUrl}
            </p>
          ) : null}
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="headquartersLabel">Headquarters Label</FieldLabel>
          <TextInput
            defaultValue={state.defaultValues.headquartersLabel}
            disabled={isPending}
            id="headquartersLabel"
            name="headquartersLabel"
            placeholder="Abu Dhabi, UAE"
          />
        </div>
      </div>

      <div className={shell.gridTwo}>
        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="countryCode">Country Code</FieldLabel>
          <TextInput
            defaultValue={state.defaultValues.countryCode}
            disabled={isPending}
            id="countryCode"
            maxLength={2}
            name="countryCode"
            placeholder="AE"
          />
          {state.fieldErrors.countryCode ? (
            <p className={styles.fieldError} role="alert">
              {state.fieldErrors.countryCode}
            </p>
          ) : null}
        </div>

        <div className={shell.fieldGroup}>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <TextInput
            defaultValue={state.defaultValues.city}
            disabled={isPending}
            id="city"
            name="city"
            placeholder="Dubai"
          />
        </div>
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="description">What Does Your Company Do?</FieldLabel>
        <TextAreaField
          defaultValue={state.defaultValues.description}
          disabled={isPending}
          id="description"
          name="description"
          placeholder="Briefly describe your company so admins can review the verification request."
        />
      </div>

      <p className={styles.helperText}>
        This creates a private company profile and a pending company-admin membership request. An
        admin must verify it before challenge submission, solution publishing, and protected relay
        response are unlocked.
      </p>

      <div className={styles.buttonRow}>
        <Button disabled={isPending} type="submit">
          {isPending ? "Requesting Verification..." : "Request Company Verification"}
        </Button>
      </div>
    </form>
  );
}
