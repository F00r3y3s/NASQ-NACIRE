import Link from "next/link";
import type { Route } from "next";

import { RelayThreadPanel } from "@/components/challenges/relay-thread-panel";
import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { accountNavigation, getShellDefinitionByPattern } from "@/config/shell";
import { submitRelayMessageAction } from "@/lib/actions/relay-messaging";
import {
  getChallengeWorkspacePageData,
  normalizeChallengeWorkspaceSearchParams,
} from "@/lib/data/member-challenges";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/account/challenges");

export default async function AccountChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = normalizeChallengeWorkspaceSearchParams(await searchParams);
  const pageData = await getChallengeWorkspacePageData(params);
  const selectedThread = pageData.selectedThread;
  const responseTarget = pageData.responseTarget;

  return (
    <RoutePage
      actions={
        <div className={styles.inlineActions}>
          {selectedThread || responseTarget ? (
            <ButtonLink href="/account/challenges" variant="outline">
              Relay Inbox
            </ButtonLink>
          ) : null}
          <ButtonLink href="/submit" variant="outline">
            + Submit Challenge
          </ButtonLink>
        </div>
      }
      badges={[
        {
          label: pageData.viewerCompanyName ?? "Authenticated Workspace",
          tone: pageData.viewerCompanyName ? "blue" : "gold",
        },
        {
          label:
            pageData.relayThreads.length > 0
              ? `${pageData.relayThreads.length} Relay Thread${
                  pageData.relayThreads.length === 1 ? "" : "s"
                }`
              : "Relay Inbox Empty",
          tone: pageData.relayThreads.length > 0 ? "green" : "gold",
        },
        {
          label:
            pageData.ownedChallenges.length > 0
              ? `${pageData.ownedChallenges.length} Owned Challenge${
                  pageData.ownedChallenges.length === 1 ? "" : "s"
                }`
              : "No Owned Challenges Yet",
          tone: pageData.ownedChallenges.length > 0 ? "teal" : "gold",
        },
      ]}
      description={
        selectedThread
          ? `${definition.description} Continue the protected relay thread without exposing the anonymous owner identity on the responder side.`
          : responseTarget
            ? `${definition.description} Start a protected relay thread for this anonymous published challenge from the member workspace.`
            : `${definition.description} Review authored challenge records, manage anonymous relay threads, and continue protected challenge-owner or responder exchanges.`
      }
      eyebrow={definition.eyebrow}
      tabs={accountNavigation.map((item) => ({
        ...item,
        active: item.href === "/account/challenges",
      }))}
      title={definition.title}
    >
      <div className={shell.gridTwo}>
        <Surface>
          <RelayThreadPanel
            action={submitRelayMessageAction}
            availableSolutions={pageData.availableSolutions}
            responseTarget={responseTarget}
            responseTargetError={pageData.responseTargetError}
            selectedThread={selectedThread}
            statusMessage={pageData.statusMessage}
            workspaceError={pageData.workspaceError}
          />
        </Surface>

        <div className={shell.stack}>
          <Surface>
            <h2 className={shell.sectionTitle}>Workspace Snapshot</h2>
            <div className={shell.metaGrid}>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Owned Challenges</div>
                <div className={shell.metaValue}>{pageData.ownedChallenges.length}</div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Relay Threads</div>
                <div className={shell.metaValue}>{pageData.relayThreads.length}</div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Published Solutions</div>
                <div className={shell.metaValue}>{pageData.availableSolutions.length}</div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Current Focus</div>
                <div className={shell.metaValue}>
                  {selectedThread
                    ? selectedThread.statusLabel
                    : responseTarget
                      ? "Start relay"
                      : "Inbox overview"}
                </div>
              </div>
            </div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Relay Inbox</h2>
            {pageData.relayThreads.length > 0 ? (
              <div className={styles.threadList}>
                {pageData.relayThreads.map((thread) => (
                  <Link
                    className={`${styles.threadLink} ${
                      thread.active ? styles.threadLinkActive : ""
                    }`}
                    href={thread.href as Route}
                    key={thread.id}
                  >
                    <div className={styles.threadBadges}>
                      <Badge tone={thread.statusTone}>{thread.statusLabel}</Badge>
                      <Badge tone="blue">{thread.perspectiveLabel}</Badge>
                    </div>
                    <div className={styles.threadTitle}>{thread.challengeTitle}</div>
                    <div className={styles.threadMeta}>{thread.counterpartLabel}</div>
                    <div className={styles.threadMeta}>{thread.lastMessagePreview}</div>
                    <div className={styles.threadMeta}>
                      {thread.lastMessageAtLabel}
                      {thread.linkedSolutionLabel ? ` · ${thread.linkedSolutionLabel}` : ""}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>
                No protected relay threads yet. Start from an anonymous public challenge to message without exposing the owner identity.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Your Challenge Records</h2>
            {pageData.ownedChallenges.length > 0 ? (
              <div className={styles.challengeList}>
                {pageData.ownedChallenges.map((challenge) => (
                  <Link
                    className={styles.challengeLink}
                    href={challenge.href as Route}
                    key={challenge.id}
                  >
                    <div className={styles.threadBadges}>
                      <Badge tone={challenge.statusTone}>{challenge.statusLabel}</Badge>
                      <Badge tone={challenge.anonymityLabel === "Anonymous" ? "blue" : "gold"}>
                        {challenge.anonymityLabel}
                      </Badge>
                    </div>
                    <div className={styles.threadTitle}>{challenge.title}</div>
                    <div className={styles.threadMeta}>
                      {challenge.sectorLabel} · {challenge.relayThreadCount} relay thread
                      {challenge.relayThreadCount === 1 ? "" : "s"}
                    </div>
                    <div className={styles.threadMeta}>Updated {challenge.updatedAtLabel}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>
                No authored challenge records yet. Submit a challenge to start building your owner-side workspace here.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Relay Rules</h2>
            <ul className={shell.list}>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Anonymous owner stays masked</div>
                  <div className={shell.listSecondary}>
                    Responder-side relay threads never reveal the anonymous challenge owner identity through the UI.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Verified responder only</div>
                  <div className={shell.listSecondary}>
                    Starting a new thread requires a verified company membership, with optional linkage to one published solution.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Protected exchange</div>
                  <div className={shell.listSecondary}>
                    Relay messages stay inside the authenticated member workspace and use the platform relay instead of public comments.
                  </div>
                </div>
              </li>
            </ul>
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
