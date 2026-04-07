import Link from "next/link";
import type { Route } from "next";

import { AssistantComposer } from "@/components/ai/assistant-composer";
import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Button, ButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import { createChallengeDraftFromConversationAction } from "@/lib/actions/ai-draft-assist";
import { submitAiPromptAction } from "@/lib/actions/ai-assistant";
import { getAiAssistantPageData } from "@/lib/data/ai-assistant";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/ai");

type AiPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AiPage({ searchParams }: AiPageProps) {
  const data = await getAiAssistantPageData(searchParams);

  return (
    <RoutePage
      actions={
        <div className={styles.actionGroup}>
          <ButtonLink href="/challenges" variant="outline">
            Browse Challenges
          </ButtonLink>
          <ButtonLink href="/solutions" variant="soft">
            Browse Solutions
          </ButtonLink>
        </div>
      }
      badges={data.badges}
      description={definition.description}
      eyebrow={definition.eyebrow}
      title={definition.title}
    >
      <div className={shell.chatLayout}>
        <Surface className={shell.chatMain} style={{ padding: 0 }}>
          <div className={shell.chatHeader}>
            <div className={shell.chatAvatar}>AI</div>
            <div>
              <span className={shell.chatStatusStrong}>{data.currentConversationTitle}</span>
              <span className={shell.chatStatusText}>{data.viewerStatusText}</span>
            </div>
          </div>

          <div className={shell.chatMessages}>
            {data.statusMessage ? (
              <div aria-live="polite" className={styles.noticeSuccess} role="status">
                {data.statusMessage}
              </div>
            ) : null}
            {data.workspaceError ? (
              <div aria-live="assertive" className={styles.noticeError} role="alert">
                {data.workspaceError}
              </div>
            ) : null}

            {data.messages.length > 0 ? (
              data.messages.map((message) => (
                <div
                  className={`${shell.message} ${
                    message.role === "user" ? shell.messageUser : ""
                  }`}
                  key={message.id}
                >
                  <div className={shell.chatAvatar}>{message.avatarLabel}</div>
                  <div
                    className={`${shell.messageBubble} ${
                      message.role === "user"
                        ? shell.messageUserBubble
                        : shell.messageAi
                    }`}
                  >
                    <div className={styles.messageMeta}>
                      <span>{message.senderLabel}</span>
                      <span>{message.createdAtLabel}</span>
                    </div>
                    <p className={styles.messageBody}>{message.body}</p>
                    {message.citations.length > 0 ? (
                      <div className={styles.citationList}>
                        {message.citations.map((citation) => (
                          <Link
                            className={styles.citationLink}
                            href={citation.href as Route}
                            key={`${message.id}-${citation.recordType}-${citation.recordId}`}
                          >
                            {citation.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className={shell.message}>
                <div className={shell.chatAvatar}>AI</div>
                <div className={`${shell.messageBubble} ${shell.messageAi}`}>
                  <div className={styles.messageMeta}>
                    <span>NASQ AI</span>
                    <span>{data.viewerModeLabel}</span>
                  </div>
                  <p className={styles.messageBody}>
                    {data.emptyStateCopy}
                  </p>
                  <p className={styles.messageBody}>
                    Grounded discovery is now live and answers cite only published
                    platform records that are safe to expose in public or signed-in
                    contexts.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={shell.chatInput}>
            <AssistantComposer
              action={submitAiPromptAction}
              conversationId={data.currentConversationId}
              disabled={data.composerDisabled}
              helperText={
                data.currentConversationId
                  ? "Replies are appended to the selected continuity thread."
                  : "Start a new thread with a substantial discovery question."
              }
              initialPrompt={data.composerInitialPrompt}
            />
          </div>
        </Surface>

        <div className={shell.chatSide}>
          <Surface>
            <h2 className={shell.sectionTitle}>Continuity Mode</h2>
            <p className={shell.copy}>
              {data.viewerModeLabel} keeps this workspace aligned with your current
              platform access and the artifact-style assistant shell.
            </p>
            <div className={styles.sideMeta}>
              <div className={styles.sideMetaItem}>
                <div className={styles.sideMetaLabel}>Status</div>
                <div className={styles.sideMetaValue}>{data.viewerStatusText}</div>
              </div>
              <div className={styles.sideMetaItem}>
                <div className={styles.sideMetaLabel}>Selected Thread</div>
                <div className={styles.sideMetaValue}>{data.currentConversationTitle}</div>
              </div>
            </div>
          </Surface>

          {data.draftAssistHint ? (
            <Surface>
              <h2 className={shell.sectionTitle}>AI-to-Draft Assist</h2>
              <p className={shell.copy}>{data.draftAssistHint}</p>
              <form
                action={createChallengeDraftFromConversationAction}
                className={styles.draftAssistForm}
              >
                <input
                  name="conversationId"
                  type="hidden"
                  value={data.currentConversationId ?? ""}
                />
                <Button disabled={!data.canCreateDraftFromConversation} type="submit">
                  Turn Thread Into Draft
                </Button>
              </form>
            </Surface>
          ) : null}

          <Surface>
            <div className={styles.sideHeader}>
              <h2 className={shell.sectionTitle}>Saved Threads</h2>
              <Link className={styles.sideLink} href="/ai">
                New Thread
              </Link>
            </div>
            {data.conversations.length > 0 ? (
              <div className={styles.threadList}>
                {data.conversations.map((conversation) => (
                  <Link
                    className={`${styles.threadLink} ${
                      conversation.active ? styles.threadLinkActive : ""
                    }`}
                    href={conversation.href as Route}
                    key={conversation.id}
                  >
                    <div className={styles.threadTitleRow}>
                      <span className={styles.threadTitle}>{conversation.title}</span>
                      <span className={styles.threadScope}>{conversation.scopeLabel}</span>
                    </div>
                    <div className={styles.threadMeta}>{conversation.updatedAtLabel}</div>
                    <div className={styles.threadMeta}>{conversation.lastMessageAtLabel}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>
                No saved threads yet. Your first prompt will create one automatically.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Suggested Queries</h2>
            <div className={shell.stack}>
              {data.suggestedPrompts.map((item) => (
                <Link
                  className={shell.suggestion}
                  href={`/ai?prompt=${encodeURIComponent(item)}` as Route}
                  key={item}
                >
                  {item}
                </Link>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
