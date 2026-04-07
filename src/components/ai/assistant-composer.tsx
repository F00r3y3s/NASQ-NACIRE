"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import {
  initialAiPromptActionState,
  type AiPromptActionState,
} from "@/lib/ai/conversations";
import { cx } from "@/lib/cx";

import styles from "./assistant-composer.module.css";

type AssistantComposerProps = {
  action: (
    state: AiPromptActionState,
    formData: FormData,
  ) => Promise<AiPromptActionState>;
  conversationId: string | null;
  disabled?: boolean;
  helperText: string;
  initialPrompt: string;
};

export function AssistantComposer({
  action,
  conversationId,
  disabled = false,
  helperText,
  initialPrompt,
}: AssistantComposerProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialAiPromptActionState,
  );
  const [prompt, setPrompt] = useState(initialPrompt);
  const promptErrorId = state.fieldErrors.prompt ? "assistant-prompt-error" : undefined;
  const promptHelperId = "assistant-prompt-helper";

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const isDisabled = disabled || isPending;

  return (
    <form action={formAction} aria-busy={isPending} className={styles.composer}>
      {state.formError ? (
        <div aria-live="assertive" className={cx(styles.notice, styles.noticeError)} role="alert">
          {state.formError}
        </div>
      ) : null}

      <input name="conversationId" type="hidden" value={conversationId ?? ""} />

      <div className={styles.inputRow}>
        <TextAreaField
          aria-label="AI assistant prompt"
          aria-describedby={[promptErrorId, promptHelperId].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(state.fieldErrors.prompt)}
          className={styles.promptField}
          disabled={isDisabled}
          name="prompt"
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the sector question, challenge pattern, or reusable solution context you want to explore..."
          rows={3}
          value={prompt}
        />
        <Button className={styles.submitButton} disabled={isDisabled} type="submit">
          {isPending ? "Sending..." : "Send Prompt"}
        </Button>
      </div>

      {state.fieldErrors.prompt ? (
        <p className={styles.fieldError} id={promptErrorId} role="alert">
          {state.fieldErrors.prompt}
        </p>
      ) : null}
      <p className={styles.helperText} id={promptHelperId}>
        {helperText}
      </p>
    </form>
  );
}
