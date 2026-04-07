import Link from "next/link";
import type { Route } from "next";

import { ButtonLink } from "@/components/ui/button";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";
import { getCurrentViewer } from "@/lib/auth/server";
import { getPublicDashboardViewModel } from "@/lib/data/public-dashboard";
import { cx } from "@/lib/cx";

import styles from "./page.module.css";

const badgeToneClassMap = {
  blue: styles.badgeBlue,
  gold: styles.badgeGold,
  green: styles.badgeGreen,
  red: styles.badgeRed,
  teal: styles.badgeTeal,
} as const;

const sparkToneMap = {
  blue: {
    fill: "rgba(79, 152, 255, 0.14)",
    stroke: "#4F98FF",
  },
  gold: {
    fill: "rgba(203, 163, 68, 0.16)",
    stroke: "#CBA344",
  },
  green: {
    fill: "rgba(74, 157, 92, 0.14)",
    stroke: "#4A9D5C",
  },
  teal: {
    fill: "rgba(0, 171, 235, 0.14)",
    stroke: "#00ABEB",
  },
} as const;

type SparkTone = keyof typeof sparkToneMap;

function buildLinePath(values: number[], width: number, height: number, padding = 2) {
  const series = values.length > 0 ? values : [0];
  const maxValue = Math.max(...series, 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return series
    .map((value, index) => {
      const x =
        padding +
        (series.length === 1 ? usableWidth / 2 : (usableWidth / (series.length - 1)) * index);
      const y = padding + usableHeight - (value / maxValue) * usableHeight;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number, padding = 2) {
  const series = values.length > 0 ? values : [0];
  const line = buildLinePath(series, width, height, padding);
  const startX = padding;
  const endX = width - padding;
  const baseline = height - padding;

  return `${line} L ${endX.toFixed(2)} ${baseline.toFixed(2)} L ${startX.toFixed(
    2,
  )} ${baseline.toFixed(2)} Z`;
}

function DashboardSparkline({
  points,
  tone,
}: {
  points: number[];
  tone: SparkTone;
}) {
  const palette = sparkToneMap[tone];

  return (
    <svg aria-hidden="true" className={styles.sparkline} viewBox="0 0 164 44">
      <path d={buildAreaPath(points, 164, 44, 2)} fill={palette.fill} />
      <path
        d={buildLinePath(points, 164, 44, 2)}
        fill="none"
        stroke={palette.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default async function DashboardPage() {
  const viewer = await getCurrentViewer();
  const dashboard = await getPublicDashboardViewModel();
  const submitHref =
    viewer.status === "anonymous" ? buildProtectedAuthRedirect("/submit") : "/submit";

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.flag} aria-hidden="true">
            <span className={styles.flagRed} />
            <span className={styles.flagStripes}>
              <span className={styles.flagGreen} />
              <span className={styles.flagWhite} />
              <span className={styles.flagBlack} />
            </span>
          </div>
          <div className={styles.eyebrow}>UAE Industry Intelligence Platform</div>
          <h1 className={styles.heroTitle}>
            Where Industry <strong>Challenges</strong>
            <br />
            Meet <strong>Solutions</strong>
          </h1>
          <p className={styles.heroText}>{dashboard.heroText}</p>
          <div className={styles.heroActions}>
            <ButtonLink href={submitHref as Route} size="lg">
              + Post a Challenge
            </ButtonLink>
            <ButtonLink href="/ai" size="lg" variant="outline">
              ◈ Ask AI
            </ButtonLink>
          </div>
        </div>

        <div className={styles.heroStats}>
          {dashboard.heroStats.map((stat, index) => (
            <div key={stat.label}>
              {index > 0 ? <div className={styles.divider} /> : null}
              <div className={styles.heroStat}>
                <span
                  className={cx(
                    styles.heroStatValue,
                    stat.accent === "green" && styles.heroStatValueGreen,
                  )}
                >
                  {stat.value}
                </span>
                <span className={styles.heroStatLabel}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {dashboard.state !== "live" ? <p className={styles.notice}>{dashboard.readiness.note}</p> : null}

      <section className={styles.stats} aria-label="Platform snapshot">
        {dashboard.statCards.map((card) => (
          <article className={styles.statCard} key={card.label}>
            <div className={styles.statCardTop}>
              <div>
                <div className={styles.statLabel}>{card.label}</div>
                <div
                  className={cx(
                    styles.statValue,
                    card.label === "Resolution Rate" && styles.statValueGreen,
                  )}
                >
                  {card.value}
                </div>
                <div className={styles.statChange}>{card.change}</div>
              </div>
              <div className={cx(styles.statIcon, badgeToneClassMap[card.tone])}>{card.icon}</div>
            </div>
            <div className={styles.statChart}>
              <DashboardSparkline
                points={card.points}
                tone={card.tone === "teal" ? "teal" : card.tone}
              />
            </div>
          </article>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <div>
          <div className={styles.headerRow}>
            <div className={styles.sectionLabel}>Recent Challenges</div>
            <ButtonLink href="/challenges" size="sm" variant="outline">
              View all →
            </ButtonLink>
          </div>

          <div className={styles.pills}>
            {dashboard.sectorPills.map((pill, index) => {
              const href = pill.slug ? (`/challenges?sector=${pill.slug}` as Route) : "/challenges";

              return (
                <Link
                  className={cx(
                    styles.pill,
                    index === 0 && styles.pillActive,
                    index > 0 && index < 3 && styles.pillPriority,
                  )}
                  href={href}
                  key={`${pill.slug ?? "all"}-${pill.label}`}
                >
                  <span className={styles.pillDot} />
                  {pill.label}
                  {index > 0 && index < 3 ? " \u2605" : ""}
                </Link>
              );
            })}
          </div>

          {dashboard.recentChallenges.length > 0 ? (
            <div className={styles.challengeGrid}>
              {dashboard.recentChallenges.map((challenge) => (
                <Link
                  className={styles.challengeCard}
                  href={challenge.href as Route}
                  key={challenge.href}
                >
                  <div className={styles.challengeTop}>
                    <span className={cx(styles.badge, badgeToneClassMap[challenge.sectorTone])}>
                      {challenge.sectorLabel}
                    </span>
                    <span className={cx(styles.badge, badgeToneClassMap[challenge.statusTone])}>
                      {challenge.statusLabel}
                    </span>
                  </div>
                  <div className={styles.challengeTitle}>{challenge.title}</div>
                  <div className={styles.challengeSummary}>{challenge.summary}</div>
                  <div className={styles.challengeFooter}>
                    <div className={styles.companyInfo}>
                      <span
                        className={cx(
                          styles.companyAvatar,
                          challenge.anonymous && styles.companyAvatarAnonymous,
                        )}
                        aria-hidden="true"
                      >
                        {challenge.companyInitials}
                      </span>
                      {challenge.anonymous ? "Anonymous" : challenge.companyLabel}
                    </div>
                    <div className={styles.challengeMeta}>
                      {challenge.meta.map((item) => (
                        <span key={`${challenge.href}-${item.icon}-${item.value}`}>
                          {item.icon} {item.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              No published challenges are visible yet. Once verified members submit and admins
              publish records, they will appear here through the public-safe challenge view.
            </div>
          )}
        </div>

        <div className={styles.rightRail}>
          <article className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Sectors at a Glance</div>
            {dashboard.sectorProgress.length > 0 ? (
              dashboard.sectorProgress.map((row) => (
                <div className={styles.sectorRow} key={row.label}>
                  <div className={styles.sectorInfo}>
                    <span className={cx(styles.badge, badgeToneClassMap[row.tone])}>{row.label}</span>
                    <span className={styles.sectorCount}>{row.count}</span>
                  </div>
                  <div className={styles.sectorTrack}>
                    <div
                      className={cx(styles.sectorFill, styles[`sector${row.tone[0].toUpperCase()}${row.tone.slice(1)}`])}
                      style={{ width: row.width }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.note}>
                Sector activity will appear here once published challenges and solutions are
                available.
              </p>
            )}
          </article>

          <article className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <div className={styles.sideCardTitle}>Live Activity</div>
              <span className={styles.liveDot}>● LIVE</span>
            </div>
            {dashboard.activityFeed.length > 0 ? (
              <div className={styles.feed}>
                {dashboard.activityFeed.slice(0, 5).map((item) => (
                  <div className={styles.feedItem} key={`${item.text}-${item.meta}`}>
                    <span className={styles.feedDot} style={{ background: item.color }} />
                    <div>
                      <div className={styles.feedText}>{item.text}</div>
                      <div className={styles.feedMeta}>{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.note}>
                Live public signals will appear here after analytics events and publication
                actions start flowing into the public activity view.
              </p>
            )}
          </article>

          <article className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Quick Actions</div>
            <div className={styles.quickActions}>
              <ButtonLink className={styles.quickActionPrimary} href={submitHref as Route}>
                ✦ Submit a Challenge
              </ButtonLink>
              <ButtonLink className={styles.quickActionSecondary} href="/solutions" variant="outline">
                💡 Browse Solutions
              </ButtonLink>
              <ButtonLink className={styles.quickActionSecondary} href="/ai" variant="outline">
                ◈ Ask AI Assistant
              </ButtonLink>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
