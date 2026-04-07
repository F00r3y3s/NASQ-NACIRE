"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState, useState } from "react";

import { routePageStyles as shell } from "@/components/shell/route-page";
import { Button } from "@/components/ui/button";
import { FieldLabel, SelectField, TextAreaField } from "@/components/ui/field";
import { cx } from "@/lib/cx";
import {
  initialRelayMessageActionState,
  type RelayMessageActionState,
} from "@/lib/relay/messaging";
import type {
  RelayResponseTarget,
  RelaySolutionOption,
  RelayThreadDetail,
} from "@/lib/data/member-challenges";

import styles from "./relay-thread-panel.module.css";

type RelayThreadPanelProps = {
  action: (
    state: RelayMessageActionState,
    formData: FormData,
  ) => Promise<RelayMessageActionState>;
  availableSolutions: RelaySolutionOption[];
  responseTarget: RelayResponseTarget | null;
  responseTargetError?: string | null;
  selectedThread: RelayThreadDetail | null;
  statusMessage?: string | null;
  workspaceError?: string | null;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className={styles.fieldError}>{message}</p> : null;
}

export function RelayThreadPanel({
  action,
  availableSolutions,
  responseTarget,
  responseTargetError,
  selectedThread,
  statusMessage,
  workspaceError,
}: RelayThreadPanelProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialRelayMessageActionState,
  );
  const [body, setBody] = useState("");
  const [solutionId, setSolutionId] = useState("");
  const isReplyMode = Boolean(selectedThread);
  const isDisabled =
    isPending ||
    Boolean(workspaceError) ||
    (!isReplyMode && !responseTarget) ||
    (isReplyMode && !selectedThread?.canReply);

  return (
    <div className={styles.panel}>
      {statusMessage ? (
        <div className={cx(styles.notice, styles.noticeSuccess)}>{statusMessage}</div>
      ) : null}
      {workspaceError ? (
        <div className={cx(styles.notice, styles.noticeError)}>{workspaceError}</div>
      ) : null}
      {responseTargetError ? (
        <div className={cx(styles.notice, styles.noticeError)}>{responseTargetError}</div>
      ) : null}
      {state.formError ? (
        <div className={cx(styles.notice, styles.noticeError)}>{state.formError}</div>
      ) : null}

      {selectedThread ? (
        <>
          <div className={styles.headerRow}>
            <div>
              <h2 className={shell.sectionTitle}>Protected Relay Thread</h2>
              <p className={shell.copy}>
                You are messaging {selectedThread.counterpartLabel} through the platform relay.
              </p>
            </div>
            <Link
              className={styles.challengeLink}
              href={selectedThread.challengeHref as Route}
            >
              View Challenge
            </Link>
          </div>

          <div className={styles.threadSummary}>
            <div className={styles.summaryTitle}>{selectedThread.challengeTitle}</div>
            <p className={styles.summaryCopy}>{selectedThread.challengeSummary}</p>
            {selectedThread.linkedSolutionHref && selectedThread.linkedSolutionLabel ? (
              <Link
                className={styles.challengeLink}
                href={selectedThread.linkedSolutionHref as Route}
              >
                Linked solution: {selectedThread.linkedSolutionLabel}
              </Link>
            ) : null}
          </div>

          <div className={styles.messageList}>
            {selectedThread.messages.map((message) => (
              <div
                className={cx(
                  styles.messageBubble,
                  message.isOwn ? styles.messageOwn : styles.messageOther,
                )}
                key={message.id}
              >
                <div className={styles.messageMeta}>
                  <span>{message.senderLabel}</span>
                  <span>{message.createdAtLabel}</span>
                </div>
                <p className={styles.messageBody}>{message.body}</p>
              </div>
            ))}
          </div>

          <form action={formAction} className={shell.formStack}>
            <input name="threadId" type="hidden" value={selectedThread.id} />
            <input name="challengeId" type="hidden" value="" />
            <input name="challengeSlug" type="hidden" value="" />
            <input name="solutionId" type="hidden" value="" />

            <div className={shell.fieldGroup}>
              <FieldLabel htmlFor="relay-reply">Send Reply</FieldLabel>
              <TextAreaField
                disabled={isDisabled}
                id="relay-reply"
                name="body"
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write your next protected relay message..."
                rows={6}
                value={body}
              />
              <p className={styles.helperText}>
                The anonymous owner stays masked on the responder side while this thread remains protected.
              </p>
              <FieldError message={state.fieldErrors.body} />
            </div>

            {selectedThread.canReply ? (
              <div className={styles.buttonRow}>
                <Button disabled={isDisabled} type="submit">
                  {isPending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            ) : (
              <div className={cx(styles.notice, styles.noticeError)}>
                This relay thread is not open for new messages.
              </div>
            )}
          </form>
        </>
      ) : responseTarget ? (
        <>
          <div className={styles.headerRow}>
            <div>
              <h2 className={shell.sectionTitle}>Start Protected Relay</h2>
              <p className={shell.copy}>
                Respond to this anonymous challenge without exposing the owner identity.
              </p>
            </div>
            <Link
              className={styles.challengeLink}
              href={`/challenges/${responseTarget.challengeSlug}` as Route}
            >
              View Challenge
            </Link>
          </div>

          <div className={styles.threadSummary}>
            <div className={styles.summaryTitle}>{responseTarget.title}</div>
            <p className={styles.summaryCopy}>{responseTarget.summary}</p>
            <div className={styles.summaryMeta}>
              {responseTarget.sectorLabel}
              {responseTarget.geographyLabel ? ` · ${responseTarget.geographyLabel}` : ""}
            </div>
          </div>

          <form action={formAction} className={shell.formStack}>
            <input name="threadId" type="hidden" value="" />
            <input name="challengeId" type="hidden" value={responseTarget.challengeId} />
            <input name="challengeSlug" type="hidden" value={responseTarget.challengeSlug} />

            <div className={shell.fieldGroup}>
              <FieldLabel htmlFor="relay-solution">Optional Linked Solution</FieldLabel>
              <SelectField
                disabled={isDisabled}
                id="relay-solution"
                name="solutionId"
                onChange={(event) => setSolutionId(event.target.value)}
                value={solutionId}
              >
                <option value="">No linked solution yet</option>
                {availableSolutions.map((solution) => (
                  <option key={solution.id} value={solution.id}>
                    {solution.title}
                  </option>
                ))}
              </SelectField>
              <p className={styles.helperText}>
                Link one of your published reusable solutions if it already maps credibly to this challenge.
              </p>
            </div>

            <div className={shell.fieldGroup}>
              <FieldLabel htmlFor="relay-start">Opening Message</FieldLabel>
              <TextAreaField
                disabled={isDisabled}
                id="relay-start"
                name="body"
                onChange={(event) => setBody(event.target.value)}
                placeholder="Introduce your capability, explain the fit, and ask the anonymous owner what they can share next."
                rows={7}
                value={body}
              />
              <FieldError message={state.fieldErrors.body} />
              <FieldError message={state.fieldErrors.challengeId} />
            </div>

            <div className={styles.buttonRow}>
              <Button disabled={isDisabled} type="submit">
                {isPending ? "Starting Relay..." : "Start Relay Thread"}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className={cx(styles.notice, styles.noticeSuccess)}>
          Select an existing relay thread or start from an anonymous public challenge to message through the protected relay.
        </div>
      )}
    </div>
  );
}
