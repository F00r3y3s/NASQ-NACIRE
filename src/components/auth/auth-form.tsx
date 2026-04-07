"use client";

import { useActionState, useMemo } from "react";

import Link from "next/link";
import type { Route } from "next";

import { Button, getButtonClassName } from "@/components/ui/button";
import { FieldLabel, TextInput } from "@/components/ui/field";
import { routePageStyles as shell } from "@/components/shell/route-page";
import type { AuthActionState } from "@/lib/auth/state";
import { createInitialAuthActionState } from "@/lib/auth/state";
import { buildAuthHref, type AuthMode } from "@/lib/auth/navigation";
import { cx } from "@/lib/cx";

import styles from "./auth-form.module.css";

type AuthFormProps = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  initialMode: AuthMode;
  nextPath: string;
  statusMessage: string | null;
};

export function AuthForm({
  action,
  initialMode,
  nextPath,
  statusMessage,
}: AuthFormProps) {
  const initialState = useMemo(
    () =>
      createInitialAuthActionState({
        mode: initialMode,
        next: nextPath,
      }),
    [initialMode, nextPath],
  );
  const [state, formAction, isPending] = useActionState(action, initialState);
  const mode = state.mode;
  const isSignup = mode === "signup";
  const helperText = useMemo(() => {
    if (isSignup) {
      return "Creating an account unlocks your personal workspace. Verified company membership is still required before challenge submission or solution publishing.";
    }

    return "Public discovery stays open to guests. Sign in to reach account, draft, submission, and protected relay workflows.";
  }, [isSignup]);

  const isDisabled = isPending;

  return (
    <form action={formAction} aria-busy={isPending} className={shell.formStack}>
      {statusMessage ? (
        <div aria-live="polite" className={cx(styles.notice, styles.noticeInfo)} role="status">
          {statusMessage}
        </div>
      ) : null}
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <div className={styles.tabRow}>
        <Link
          className={getButtonClassName({
            size: "sm",
            variant: isSignup ? "outline" : "primary",
          })}
          href={buildAuthHref(nextPath, "signin") as Route}
        >
          Sign In
        </Link>
        <Link
          className={getButtonClassName({
            size: "sm",
            variant: isSignup ? "primary" : "outline",
          })}
          href={buildAuthHref(nextPath, "signup") as Route}
        >
          Create Account
        </Link>
      </div>

      <input name="intent" type="hidden" value={mode} />
      <input name="next" type="hidden" value={nextPath} />

      {isSignup ? (
        <div className={shell.gridTwo}>
          <div className={shell.fieldGroup}>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <TextInput
              defaultValue={state.defaultValues.firstName}
              disabled={isDisabled}
              id="firstName"
              name="firstName"
            />
            {state.fieldErrors.firstName ? (
              <p className={styles.fieldError} role="alert">
                {state.fieldErrors.firstName}
              </p>
            ) : null}
          </div>

          <div className={shell.fieldGroup}>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <TextInput
              defaultValue={state.defaultValues.lastName}
              disabled={isDisabled}
              id="lastName"
              name="lastName"
            />
            {state.fieldErrors.lastName ? (
              <p className={styles.fieldError} role="alert">
                {state.fieldErrors.lastName}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="email">Work Email</FieldLabel>
        <TextInput
          autoComplete="email"
          defaultValue={state.defaultValues.email}
          disabled={isDisabled}
          id="email"
          name="email"
          type="email"
        />
        {state.fieldErrors.email ? (
          <p className={styles.fieldError} role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={shell.fieldGroup}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <TextInput
          autoComplete={isSignup ? "new-password" : "current-password"}
          disabled={isDisabled}
          id="password"
          name="password"
          type="password"
        />
        {state.fieldErrors.password ? (
          <p className={styles.fieldError} role="alert">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <p className={styles.helperText}>{helperText}</p>

      <div className={styles.buttonRow}>
        <Button disabled={isDisabled} type="submit">
          {isPending
            ? isSignup
              ? "Creating..."
              : "Signing In..."
            : isSignup
              ? "Create Account"
              : "Sign In"}
        </Button>
      </div>
    </form>
  );
}
