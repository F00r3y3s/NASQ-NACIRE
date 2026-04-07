import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { ButtonLink } from "@/components/ui/button";
import { SolutionCard } from "@/components/ui/solution-card";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";
import { getCurrentViewer } from "@/lib/auth/server";
import { getPublicChallengeDetailViewModel } from "@/lib/data/public-challenge-detail";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/challenges/[slug]");

type ChallengeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ChallengeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPublicChallengeDetailViewModel(slug);

  if (!detail || detail.state !== "live") {
    return {
      description: definition.description,
      title: "Challenge Detail | NASQ NACIRE",
    };
  }

  return {
    description: detail.summary,
    title: `${detail.title} | NASQ NACIRE`,
  };
}

export default async function ChallengeDetailPage({
  params,
}: ChallengeDetailPageProps) {
  const { slug } = await params;
  const viewer = await getCurrentViewer();
  const detail = await getPublicChallengeDetailViewModel(slug);

  if (!detail) {
    notFound();
  }

  const submitSolutionHref =
    viewer.status === "anonymous"
      ? buildProtectedAuthRedirect(
          detail.id === null
            ? "/account/solutions"
            : `/account/solutions?challenge=${detail.id}`,
        )
      : detail.id === null
        ? "/account/solutions"
        : `/account/solutions?challenge=${detail.id}`;

  return (
    <RoutePage
      actions={
        <div className={styles.actionGroup}>
          <ButtonLink href={submitSolutionHref as Route}>
            Publish a Solution
          </ButtonLink>
          <ButtonLink href="/challenges" variant="outline">
            ← Browse Challenges
          </ButtonLink>
          <ButtonLink href="/ai" variant="soft">
            ◈ Ask AI
          </ButtonLink>
        </div>
      }
      badges={detail.badges}
      description={detail.state === "live" ? detail.summary : definition.description}
      eyebrow={definition.eyebrow}
      title={detail.title}
    >
      <div className={shell.gridTwo}>
        <div className={shell.stack}>
          <Surface>
            <h2 className={shell.sectionTitle}>Challenge Summary</h2>
            <p className={styles.lead}>{detail.summary}</p>

            <div className={styles.copyStack}>
              <div>
                <h3 className={styles.subheading}>Problem Statement</h3>
                <p className={shell.copy}>{detail.problemStatement}</p>
              </div>

              {detail.desiredOutcome ? (
                <div className={styles.callout}>
                  <div className={styles.calloutLabel}>Desired Outcome</div>
                  <p className={styles.calloutCopy}>{detail.desiredOutcome}</p>
                </div>
              ) : null}
            </div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Linked Solutions</h2>
            {detail.linkedSolutionCards.length > 0 ? (
              <div className={shell.stack}>
                {detail.linkedSolutionCards.map((solution) => (
                  <Link
                    className={styles.solutionLink}
                    href={solution.href as Route}
                    key={solution.href}
                  >
                    <SolutionCard {...solution} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>{detail.emptySolutionsMessage}</p>
            )}
          </Surface>
        </div>

        <div className={shell.stack}>
          <Surface>
            <h2 className={shell.sectionTitle}>Public-safe Metadata</h2>
            {detail.metadata.length > 0 ? (
              <div className={shell.metaGrid}>
                {detail.metadata.map((item) => (
                  <div className={shell.metaItem} key={item.label}>
                    <div className={shell.metaLabel}>{item.label}</div>
                    <div className={shell.metaValue}>{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>
                Public-safe metadata will appear here once the detail query path is live.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>{detail.sectorContext.title}</h2>
            <p className={shell.copy}>{detail.sectorContext.description}</p>
            <div className={styles.contextMetric}>{detail.sectorContext.metric}</div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Response Path</h2>
            <ul className={shell.list}>
              {detail.responseGuidance.map((item) => (
                <li className={shell.listItem} key={item.title}>
                  <div>
                    <div className={shell.listPrimary}>{item.title}</div>
                    <div className={shell.listSecondary}>{item.detail}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.responseActions}>
              {detail.anonymityMode === "anonymous" ? (
                <ButtonLink
                  href={
                    (viewer.status === "anonymous"
                      ? buildProtectedAuthRedirect(`/account/challenges?challenge=${slug}`)
                      : `/account/challenges?challenge=${slug}`) as Route
                  }
                  variant="outline"
                >
                  Respond via Relay
                </ButtonLink>
              ) : (
                <ButtonLink href="/solutions" variant="outline">
                  Browse Solutions
                </ButtonLink>
              )}
              <ButtonLink href="/ai" variant="soft">
                Ask AI Assistant
              </ButtonLink>
            </div>
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
