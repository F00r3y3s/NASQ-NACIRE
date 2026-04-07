import Link from "next/link";
import type { Route } from "next";

import { routePageStyles as shell } from "@/components/shell/route-page";
import { cx } from "@/lib/cx";
import { getPublicAnalyticsViewModel } from "@/lib/data/public-analytics";

import styles from "./page.module.css";

const rangeHrefMap: Record<"7d" | "30d", Route> = {
  "7d": "/analytics",
  "30d": "/analytics?range=30d",
};

const chipToneClassMap = {
  blue: styles.chipBlue,
  gold: styles.chipGold,
  green: styles.chipGreen,
  red: styles.chipRed,
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
  red: {
    fill: "rgba(216, 55, 49, 0.14)",
    stroke: "#D83731",
  },
} as const;

const trafficToneClassMap = {
  blue: styles.trafficBlue,
  gold: styles.trafficGold,
  green: styles.trafficGreen,
  muted: styles.trafficMuted,
  teal: styles.trafficTeal,
} as const;

type AnalyticsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ChartTone = keyof typeof sparkToneMap;
type AnalyticsViewModel = Awaited<ReturnType<typeof getPublicAnalyticsViewModel>>;
type ChartPoint = { x: number; y: number };

const activityLegend = [
  { label: "Problems", tone: "gold" },
  { label: "Solutions", tone: "green" },
  { label: "AI Events", tone: "blue" },
] as const;

function buildLinePath(values: number[], width: number, height: number, padding = 0) {
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

function buildAreaPath(values: number[], width: number, height: number, padding = 0) {
  const series = values.length > 0 ? values : [0];
  const line = buildLinePath(series, width, height, padding);
  const startX = padding;
  const endX = width - padding;
  const baseline = height - padding;

  return `${line} L ${endX.toFixed(2)} ${baseline.toFixed(2)} L ${startX.toFixed(
    2,
  )} ${baseline.toFixed(2)} Z`;
}

function getRoundedChartMaximum(value: number) {
  if (value <= 0) {
    return 4;
  }

  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude * 4;
}

function getScaledChartPoints(
  values: number[],
  {
    height,
    maxValue,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    width,
  }: {
    height: number;
    maxValue: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    width: number;
  },
) {
  const series = values.length > 0 ? values : [0];
  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  return series.map((value, index) => {
    const x =
      paddingLeft +
      (series.length === 1 ? usableWidth / 2 : (usableWidth / (series.length - 1)) * index);
    const y =
      paddingTop +
      usableHeight -
      (Math.max(value, 0) / Math.max(maxValue, 1)) * usableHeight;

    return { x, y };
  });
}

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const [point] = points;

    return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }

  const commands = [`M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;
    const previous = points[index - 1] ?? current;
    const following = points[index + 2] ?? next;
    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (following.x - current.x) / 6;
    const controlTwoY = next.y - (following.y - current.y) / 6;

    commands.push(
      `C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)} ${controlTwoX.toFixed(
        2,
      )} ${controlTwoY.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`,
    );
  }

  return commands.join(" ");
}

function buildSmoothAreaPath(points: ChartPoint[], baselineY: number) {
  if (points.length === 0) {
    return "";
  }

  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;

  return `${buildSmoothPath(points)} L ${lastPoint.x.toFixed(2)} ${baselineY.toFixed(
    2,
  )} L ${firstPoint.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
}

function Sparkline({ points, tone }: { points: number[]; tone: ChartTone }) {
  const palette = sparkToneMap[tone];

  return (
    <svg aria-hidden="true" className={styles.sparkline} viewBox="0 0 160 36">
      <path d={buildAreaPath(points, 160, 36, 2)} fill={palette.fill} />
      <path
        d={buildLinePath(points, 160, 36, 2)}
        fill="none"
        stroke={palette.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ActivityChart({
  points,
}: {
  points: AnalyticsViewModel["trend"]["points"];
}) {
  const width = 560;
  const height = 196;
  const paddingLeft = 34;
  const paddingRight = 10;
  const paddingTop = 18;
  const paddingBottom = 28;
  const challengeSeries = points.map((point) => point.challenges);
  const solutionSeries = points.map((point) => point.solutions);
  const signalSeries = points.map((point) => point.signals);
  const allValues = [...challengeSeries, ...solutionSeries, ...signalSeries];
  const displayMax = getRoundedChartMaximum(Math.max(...allValues, 1));
  const challengePoints = getScaledChartPoints(challengeSeries, {
    height,
    maxValue: displayMax,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    width,
  });
  const solutionPoints = getScaledChartPoints(solutionSeries, {
    height,
    maxValue: displayMax,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    width,
  });
  const signalPoints = getScaledChartPoints(signalSeries, {
    height,
    maxValue: displayMax,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    width,
  });
  const gridValues = [1, 0.75, 0.5, 0.25, 0];
  const baselineY = height - paddingBottom;

  return (
    <svg aria-hidden="true" className={styles.activityChart} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="activityGoldFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#CBA344" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#CBA344" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="activityGreenFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4A9D5C" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#4A9D5C" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="activityBlueFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4F98FF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#4F98FF" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridValues.map((ratio) => {
        const value = Math.round(displayMax * ratio);
        const y = paddingTop + (height - paddingTop - paddingBottom) * (1 - ratio);

        return (
          <g key={ratio}>
            <line
              className={styles.activityGrid}
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
            />
            <text className={styles.activityTickLabel} x={paddingLeft - 8} y={y + 3}>
              {value}
            </text>
          </g>
        );
      })}

      <path
        className={styles.activityAreaGold}
        d={buildSmoothAreaPath(challengePoints, baselineY)}
        fill="url(#activityGoldFill)"
      />
      <path
        className={styles.activityAreaGreen}
        d={buildSmoothAreaPath(solutionPoints, baselineY)}
        fill="url(#activityGreenFill)"
      />
      <path
        className={styles.activityAreaBlue}
        d={buildSmoothAreaPath(signalPoints, baselineY)}
        fill="url(#activityBlueFill)"
      />

      <path
        className={styles.activityLineGold}
        d={buildSmoothPath(challengePoints)}
      />
      <path
        className={styles.activityLineGreen}
        d={buildSmoothPath(solutionPoints)}
      />
      <path
        className={styles.activityLineBlue}
        d={buildSmoothPath(signalPoints)}
      />

      {points.map((point, index) => {
        const challenge = challengePoints[index]!;
        const solution = solutionPoints[index]!;
        const signal = signalPoints[index]!;
        const labelX = challenge.x;

        return (
          <g key={point.label}>
            <circle className={styles.activityDotGold} cx={challenge.x} cy={challenge.y} r="2.4" />
            <circle className={styles.activityDotGreen} cx={solution.x} cy={solution.y} r="2.2" />
            <circle className={styles.activityDotBlue} cx={signal.x} cy={signal.y} r="2.2" />
            <text className={styles.activityLabel} textAnchor="middle" x={labelX} y={height - 4}>
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MiniBarChart({
  highlightLast = false,
  points,
  tone,
}: {
  highlightLast?: boolean;
  points: number[];
  tone: Exclude<ChartTone, "red">;
}) {
  const palette = sparkToneMap[tone];
  const width = 220;
  const height = 76;
  const series = points.length > 0 ? points : [0, 0, 0];
  const maxValue = Math.max(...series, 1);
  const barWidth = width / Math.max(series.length, 1) - 3;

  return (
    <svg aria-hidden="true" className={styles.miniBarChart} viewBox={`0 0 ${width} ${height}`}>
      {series.map((value, index) => {
        const barHeight = maxValue === 0 ? 0 : (value / maxValue) * (height - 4);
        const x = index * (barWidth + 3);
        const y = height - barHeight;
        const fill =
          highlightLast && index === series.length - 1
            ? sparkToneMap.gold.stroke
            : `${palette.stroke}${tone === "gold" ? "33" : "2e"}`;

        return (
          <rect
            fill={fill}
            height={Math.max(barHeight, value === 0 ? 8 : 14)}
            key={`${value}-${index}`}
            rx="3"
            ry="3"
            width={Math.max(barWidth, 4)}
            x={x}
            y={Math.min(y, height - 8)}
          />
        );
      })}
    </svg>
  );
}

function CompletionRing({ percent }: { percent: number }) {
  const radius = 15.9;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${(Math.max(0, Math.min(percent, 100)) / 100) * circumference} ${circumference}`;

  return (
    <div className={styles.ringWrap}>
      <svg aria-hidden="true" className={styles.ring} viewBox="0 0 36 36">
        <circle className={styles.ringTrack} cx="18" cy="18" fill="none" r={radius} />
        <circle
          className={styles.ringProgress}
          cx="18"
          cy="18"
          fill="none"
          r={radius}
          strokeDasharray={dashArray}
        />
      </svg>
      <span className={styles.ringLabel}>{percent}%</span>
    </div>
  );
}

function SectorDonut({
  segments,
}: {
  segments: AnalyticsViewModel["sectorDonut"]["segments"];
}) {
  if (segments.length === 0) {
    return <div className={styles.donutEmpty} />;
  }

  const colorMap: Record<(typeof segments)[number]["tone"], string> = {
    blue: "#4F98FF",
    gold: "#CBA344",
    green: "#4A9D5C",
    red: "#D83731",
    teal: "#00ABEB",
  };
  const gradient = segments
    .reduce<{ current: number; stops: string[] }>(
      (accumulator, segment) => {
        const share = Math.max(Number.parseInt(segment.share.replace("%", ""), 10), 0);
        const start = accumulator.current;
        const end = start + share;

        return {
          current: end,
          stops: [...accumulator.stops, `${colorMap[segment.tone]} ${start}% ${end}%`],
        };
      },
      { current: 0, stops: [] },
    )
    .stops.join(", ");

  return (
    <div
      aria-hidden="true"
      className={styles.donut}
      style={{ background: `conic-gradient(${gradient})` }}
    >
      <div className={styles.donutInner} />
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const analytics = await getPublicAnalyticsViewModel(searchParams);
  const isLive = analytics.state === "live";

  return (
    <div className={cx(shell.page, styles.page)}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Analytics Overview</div>
          <h1 className={styles.title}>Platform Intelligence</h1>
        </div>
        <div className={styles.chips}>
          {analytics.alertChips.map((chip) => (
            <div className={cx(styles.chip, chipToneClassMap[chip.tone])} key={chip.label}>
              <span>{chip.icon}</span>
              <span>
                {chip.value} {chip.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {!isLive ? <p className={styles.notice}>{analytics.supportingText}</p> : null}

      <section className={styles.statRow}>
        {analytics.sparkCards.map((card) => (
          <article className={styles.sparkCard} key={card.label}>
            <div className={styles.cardLabel}>{card.label}</div>
            <div className={styles.sparkValueRow}>
              <div className={cx(styles.sparkValue, card.tone === "gold" && styles.sparkValueGold)}>
                {card.value}
              </div>
              <span
                className={cx(
                  styles.deltaBadge,
                  card.deltaDirection === "up" ? styles.deltaPositive : styles.deltaNegative,
                )}
              >
                {card.deltaLabel}
              </span>
            </div>
            <div className={styles.sparkFrame}>
              <Sparkline points={card.points} tone={card.tone} />
            </div>
          </article>
        ))}

        <article className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <div>
              <div className={styles.cardLabel}>Goals Completed</div>
              <div className={styles.goalValue}>{analytics.goalCard.total}</div>
            </div>
            <CompletionRing percent={analytics.goalCard.progressPercent} />
          </div>
          <div className={styles.goalMeta}>
            <span>Active Tracking</span>
            <span className={styles.goalMetaValue}>
              {analytics.goalCard.activeTrackingCount}
              <span className={styles.goalMetaBadge}>
                {analytics.goalCard.activeTrackingPercent}%
              </span>
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${analytics.goalCard.progressPercent}%` }}
            />
          </div>
        </article>
      </section>

      <section className={styles.mainGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Platform Activity</div>
              <div className={styles.cardSubtitle}>
                Problems · Solutions · AI Events — last{" "}
                {analytics.filters.range === "7d" ? "7 days" : "30 days"}
              </div>
            </div>
            <div className={styles.chartHeaderControls}>
              <div className={styles.chartLegend}>
                {activityLegend.map((item) => (
                  <div className={styles.chartLegendItem} key={item.label}>
                    <span
                      className={cx(
                        styles.chartLegendSwatch,
                        item.tone === "gold"
                          ? styles.chartLegendGold
                          : item.tone === "green"
                            ? styles.chartLegendGreen
                            : styles.chartLegendBlue,
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className={styles.tabs}>
                <Link
                  className={cx(
                    styles.tab,
                    analytics.filters.range === "7d" && styles.tabActive,
                  )}
                  href={rangeHrefMap["7d"]}
                >
                  7 days
                </Link>
                <Link
                  className={cx(
                    styles.tab,
                    analytics.filters.range === "30d" && styles.tabActive,
                  )}
                  href={rangeHrefMap["30d"]}
                >
                  30 days
                </Link>
              </div>
            </div>
          </div>

          {analytics.trend.points.some(
            (point) => point.challenges > 0 || point.solutions > 0 || point.signals > 0,
          ) ? (
            <>
              <ActivityChart points={analytics.trend.points} />
              <div className={styles.summaryRow}>
                {analytics.trend.summary.map((item) => (
                  <div className={styles.summaryItem} key={item.label}>
                    <div
                      className={cx(
                        styles.summaryDot,
                        item.tone === "gold"
                          ? styles.summaryGold
                          : item.tone === "green"
                            ? styles.summaryGreen
                            : styles.summaryBlue,
                      )}
                    />
                    <div>
                      <div className={styles.summaryValue}>{item.value}</div>
                      <div className={styles.summaryLabel}>
                        {item.label === "Signals" ? "AI Events" : item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.note}>{analytics.emptyMessage}</p>
          )}
        </article>

        <div className={styles.rightStack}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Active Users Now</div>
                <div className={styles.cardSubtitle}>Last 30 minutes</div>
              </div>
              <span className={styles.liveBadge}>● LIVE</span>
            </div>
            <div className={styles.liveValue}>{analytics.liveUsersCard.total}</div>
            <MiniBarChart highlightLast points={analytics.liveUsersCard.points} tone="gold" />
            <div className={styles.regionList}>
              {analytics.liveUsersCard.regions.map((region) => (
                <div className={styles.regionRow} key={region.label}>
                  <span>{region.label}</span>
                  <span
                    className={cx(
                      styles.regionValue,
                      region.tone === "gold"
                        ? styles.regionGold
                        : region.tone === "green"
                          ? styles.regionGreen
                          : styles.regionBlue,
                    )}
                  >
                    {region.total}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Weekly Sessions</div>
            </div>
            <MiniBarChart points={analytics.weeklySessionsCard.points} tone="green" />
            <div className={styles.sessionsSummary}>
              <div className={styles.sessionsRate}>{analytics.weeklySessionsCard.completionRate}</div>
              <div className={styles.sessionsNote}>{analytics.weeklySessionsCard.note}</div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>By Sector</div>
          </div>
          {analytics.sectorDonut.segments.length > 0 ? (
            <div className={styles.donutRow}>
              <SectorDonut segments={analytics.sectorDonut.segments} />
              <div className={styles.legend}>
                {analytics.sectorDonut.segments.map((segment) => (
                  <div className={styles.legendItem} key={segment.label}>
                    <div className={styles.legendLabelWrap}>
                      <span
                        className={cx(
                          styles.legendDot,
                          segment.tone === "gold"
                            ? styles.summaryGold
                            : segment.tone === "green"
                              ? styles.summaryGreen
                              : segment.tone === "blue"
                                ? styles.summaryBlue
                                : segment.tone === "teal"
                                  ? styles.summaryTeal
                                  : styles.summaryRed,
                        )}
                      />
                      <span>{segment.label}</span>
                    </div>
                    <span>{segment.share}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.note}>Sector distribution will appear here once activity is available.</p>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Geographic Reach</div>
          </div>
          {analytics.geographyRows.length > 0 ? (
            <div className={styles.geoGrid}>
              {analytics.geographyRows.map((row) => (
                <div className={styles.geoRow} key={row.label}>
                  <div className={styles.geoLabel}>{row.label}</div>
                  <div className={styles.geoTrack}>
                    <div
                      className={cx(
                        styles.geoFill,
                        row.tone === "gold"
                          ? styles.summaryGold
                          : row.tone === "green"
                            ? styles.summaryGreen
                            : row.tone === "blue"
                              ? styles.summaryBlue
                              : row.tone === "teal"
                                ? styles.summaryTeal
                                : styles.summaryMuted,
                      )}
                      style={{ width: row.width }}
                    />
                  </div>
                  <div className={styles.geoValue}>{row.total}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.note}>Public company footprint will appear here once company profiles are available.</p>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Traffic Sources</div>
          </div>
          {analytics.trafficSources.length > 0 ? (
            <div className={styles.trafficList}>
              {analytics.trafficSources.map((source) => (
                <div className={styles.trafficRow} key={source.label}>
                  <span>{source.label}</span>
                  <div className={styles.trafficTrack}>
                    <div
                      className={cx(styles.trafficFill, trafficToneClassMap[source.tone])}
                      style={{ width: source.width }}
                    />
                  </div>
                  <span className={styles.trafficValue}>
                    {source.total}{" "}
                    <span
                      className={cx(
                        styles.trafficChange,
                        source.changeDirection === "up"
                          ? styles.deltaPositiveText
                          : styles.deltaNegativeText,
                      )}
                    >
                      {source.changeDirection === "up" ? "↑" : "↓"}
                      {source.changeLabel}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.note}>Traffic sources will appear here once the activity surface has enough data.</p>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Live Activity</div>
            <span className={styles.liveBadge}>● LIVE</span>
          </div>
          {analytics.recentSignals.length > 0 ? (
            <div className={styles.feed}>
              {analytics.recentSignals.map((item) =>
                item.href ? (
                  <Link className={styles.feedItem} href={item.href as Route} key={`${item.text}-${item.meta}`}>
                    <span
                      className={cx(
                        styles.feedIcon,
                        item.iconTone === "gold"
                          ? styles.feedGold
                          : item.iconTone === "green"
                            ? styles.feedGreen
                            : item.iconTone === "blue"
                              ? styles.feedBlue
                              : item.iconTone === "teal"
                                ? styles.feedTeal
                                : styles.feedRed,
                      )}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <div className={styles.feedText}>{item.text}</div>
                      <div className={styles.feedMeta}>{item.meta}</div>
                    </div>
                  </Link>
                ) : (
                  <div className={styles.feedItem} key={`${item.text}-${item.meta}`}>
                    <span
                      className={cx(
                        styles.feedIcon,
                        item.iconTone === "gold"
                          ? styles.feedGold
                          : item.iconTone === "green"
                            ? styles.feedGreen
                            : item.iconTone === "blue"
                              ? styles.feedBlue
                              : item.iconTone === "teal"
                                ? styles.feedTeal
                                : styles.feedRed,
                      )}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <div className={styles.feedText}>{item.text}</div>
                      <div className={styles.feedMeta}>{item.meta}</div>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className={styles.note}>No public-safe signals were recorded in this window yet.</p>
          )}
        </article>
      </section>
    </div>
  );
}
