import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { ButtonLink } from "@/components/ui/button";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import { getPublicSolutionDetailViewModel } from "@/lib/data/public-solution-detail";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/solutions/[slug]");

type SolutionDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: SolutionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPublicSolutionDetailViewModel(slug);

  if (!detail) {
    return {
      description: definition.description,
      title: "Solution Detail | NASQ NACIRE",
    };
  }

  return {
    description: detail.summary,
    title: `${detail.title} | NASQ NACIRE`,
  };
}

export default async function SolutionDetailPage({
  params,
}: SolutionDetailPageProps) {
  const { slug } = await params;
  const detail = await getPublicSolutionDetailViewModel(slug);

  if (!detail) {
    notFound();
  }

  return (
    <RoutePage
      actions={
        <div className={styles.actionGroup}>
          <ButtonLink href="/solutions" variant="outline">
            ← Browse Solutions
          </ButtonLink>
          <ButtonLink href="/ai" variant="soft">
            ◈ Ask AI
          </ButtonLink>
        </div>
      }
      badges={detail.badges}
      description={detail.summary}
      eyebrow={definition.eyebrow}
      title={detail.title}
    >
      <div className={shell.gridTwo}>
        <div className={shell.stack}>
          <Surface>
            <h2 className={shell.sectionTitle}>Solution Summary</h2>
            <p className={styles.lead}>{detail.summary}</p>

            <div className={styles.copyStack}>
              <div>
                <h3 className={styles.subheading}>Offering Description</h3>
                <p className={shell.copy}>{detail.offeringDescription}</p>
              </div>

              <div className={styles.callout}>
                <div className={styles.calloutLabel}>Reuse Context</div>
                <p className={styles.calloutCopy}>
                  Public solutions stay reusable by default. Challenge links help people understand where this record already maps credibly across the platform.
                </p>
              </div>
            </div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Linked Challenges</h2>
            {detail.linkedChallengeCards.length > 0 ? (
              <div className={shell.stack}>
                {detail.linkedChallengeCards.map((challenge) => (
                  <Link
                    className={styles.challengeLink}
                    href={challenge.href as Route}
                    key={challenge.href}
                  >
                    <ChallengeCard {...challenge} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className={shell.copy}>{detail.emptyChallengesMessage}</p>
            )}
          </Surface>
        </div>

        <div className={shell.stack}>
          <Surface>
            <h2 className={shell.sectionTitle}>Public Metadata</h2>
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
                Public metadata will appear here once the detail query path is live.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Public Provider Profile</h2>
            {detail.providerProfile ? (
              <div className={styles.providerCard}>
                <div>
                  <h3 className={styles.providerName}>{detail.providerProfile.name}</h3>
                  <p className={styles.providerCopy}>{detail.providerProfile.description}</p>
                </div>

                <div className={styles.providerMeta}>
                  <div className={styles.providerMetaItem}>
                    <div className={styles.providerMetaLabel}>Headquarters</div>
                    <div className={styles.providerMetaValue}>
                      {detail.providerProfile.locationLabel}
                    </div>
                  </div>
                  <div className={styles.providerMetaItem}>
                    <div className={styles.providerMetaLabel}>Published Solutions</div>
                    <div className={styles.providerMetaValue}>
                      {detail.providerProfile.publishedSolutionCount}
                    </div>
                  </div>
                  <div className={styles.providerMetaItem}>
                    <div className={styles.providerMetaLabel}>Published Challenges</div>
                    <div className={styles.providerMetaValue}>
                      {detail.providerProfile.publishedChallengeCount}
                    </div>
                  </div>
                  <div className={styles.providerMetaItem}>
                    <div className={styles.providerMetaLabel}>Public Presence</div>
                    <div className={styles.providerMetaValue}>Verified company profile</div>
                  </div>
                </div>

                {detail.providerProfile.websiteUrl ? (
                  <a
                    className={styles.providerLink}
                    href={detail.providerProfile.websiteUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit company website ↗
                  </a>
                ) : null}
              </div>
            ) : (
              <p className={shell.copy}>
                Provider context will appear here once the public company profile record resolves successfully.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>{detail.sectorContext.title}</h2>
            <p className={shell.copy}>{detail.sectorContext.description}</p>
            <div className={styles.contextMetric}>{detail.sectorContext.metric}</div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Discovery Path</h2>
            <ul className={shell.list}>
              {detail.providerGuidance.map((item) => (
                <li className={shell.listItem} key={item.title}>
                  <div>
                    <div className={shell.listPrimary}>{item.title}</div>
                    <div className={shell.listSecondary}>{item.detail}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.responseActions}>
              <ButtonLink href="/challenges" variant="outline">
                Browse Challenges
              </ButtonLink>
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
