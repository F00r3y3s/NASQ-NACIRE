import Link from "next/link";
import type { Route } from "next";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Button, ButtonLink, getButtonClassName } from "@/components/ui/button";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { FieldLabel, SelectField, TextInput } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";
import { getCurrentViewer } from "@/lib/auth/server";
import { cx } from "@/lib/cx";
import { getPublicChallengesBrowseViewModel } from "@/lib/data/public-challenges";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/challenges");

type ChallengesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const viewer = await getCurrentViewer();
  const browse = await getPublicChallengesBrowseViewModel(searchParams);
  const submitHref =
    viewer.status === "anonymous"
      ? buildProtectedAuthRedirect("/submit")
      : "/submit";

  return (
    <RoutePage
      actions={<ButtonLink href={submitHref as Route}>+ Submit Challenge</ButtonLink>}
      badges={browse.badges}
      description={definition.description}
      eyebrow={definition.eyebrow}
      title={definition.title}
    >
      <div className={shell.stack}>
        <Surface className={styles.filterPanel}>
          <div className={styles.filterHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Search and Filter</h2>
              <p className={styles.copy}>{browse.supportingText}</p>
            </div>

            <div className={styles.statGrid}>
              {browse.stats.map((stat) => (
                <div className={styles.statItem} key={stat.label}>
                  <div className={styles.statLabel}>{stat.label}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <form action="/challenges" className={styles.formGrid}>
            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="challenge-search">Keyword Search</FieldLabel>
              <TextInput
                defaultValue={browse.filters.query}
                id="challenge-search"
                name="q"
                placeholder="Search by challenge, summary, sector, or company"
              />
            </div>

            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="challenge-sector">Governed Sector</FieldLabel>
              <SelectField
                defaultValue={browse.filters.sectorSlug ?? ""}
                id="challenge-sector"
                name="sector"
              >
                <option value="">All sectors</option>
                {browse.sectorOptions.map((sector) => (
                  <option key={sector.slug} value={sector.slug}>
                    {sector.label} ({sector.resultCount})
                  </option>
                ))}
              </SelectField>
            </div>

            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="challenge-sort">Sort Order</FieldLabel>
              <SelectField defaultValue={browse.filters.sort} id="challenge-sort" name="sort">
                {browse.sortOptions.map((sortOption) => (
                  <option key={sortOption.value} value={sortOption.value}>
                    {sortOption.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="challenge-status">Challenge Status</FieldLabel>
              <SelectField defaultValue={browse.filters.status} id="challenge-status" name="status">
                {browse.statusOptions.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className={styles.formActions}>
              <Button type="submit">Apply Filters</Button>
              <Link
                className={getButtonClassName({ size: "md", variant: "outline" })}
                href="/challenges"
              >
                Reset
              </Link>
            </div>
          </form>
        </Surface>

        <form action="/challenges" className={styles.pills}>
          {browse.filters.query ? <input name="q" type="hidden" value={browse.filters.query} /> : null}
          {browse.filters.sort !== "latest" ? (
            <input name="sort" type="hidden" value={browse.filters.sort} />
          ) : null}
          {browse.filters.status !== "all" ? (
            <input name="status" type="hidden" value={browse.filters.status} />
          ) : null}

          {browse.quickFilters.map((filter) => (
            <Pill
              active={filter.active}
              key={filter.slug ?? "all"}
              name="sector"
              priority={filter.priority}
              title={`${filter.resultCount} published challenge${filter.resultCount === 1 ? "" : "s"}`}
              type="submit"
              value={filter.slug ?? ""}
            >
              {filter.label}
            </Pill>
          ))}
        </form>

        <div className={styles.resultsRow}>
          <div>
            <h2 className={styles.sectionTitle}>Published Challenge Records</h2>
            <p className={styles.copy}>{browse.resultSummary}</p>
          </div>
          {browse.pagination.pageCount > 1 ? (
            <div className={styles.pageIndicator}>
              Page {browse.pagination.currentPage} of {browse.pagination.pageCount}
            </div>
          ) : null}
        </div>

        {browse.cards.length > 0 ? (
          <div className={styles.challengeGrid}>
            {browse.cards.map((card) => (
              <Link
                aria-label={`Open challenge: ${card.title}`}
                className={styles.challengeCardLink}
                href={card.href as Route}
                key={card.href}
              >
                <ChallengeCard
                  anonymous={card.anonymous}
                  companyLabel={card.companyLabel}
                  meta={card.meta}
                  sectorLabel={card.sectorLabel}
                  sectorTone={card.sectorTone}
                  statusLabel={card.statusLabel}
                  statusTone={card.statusTone}
                  summary={card.summary}
                  title={card.title}
                />
              </Link>
            ))}
          </div>
        ) : (
          <Surface className={styles.emptySurface}>
            <p className={styles.copy}>{browse.emptyMessage}</p>
          </Surface>
        )}

        {browse.pagination.pageCount > 1 ? (
          <nav aria-label="Challenge browse pagination" className={styles.pagination}>
            {browse.pagination.previousHref ? (
              <Link
                className={getButtonClassName({ size: "sm", variant: "outline" })}
                href={browse.pagination.previousHref as Route}
              >
                ← Previous
              </Link>
            ) : (
              <span
                className={cx(
                  getButtonClassName({ size: "sm", variant: "outline" }),
                  styles.disabledButton,
                )}
              >
                ← Previous
              </span>
            )}

            <div className={styles.pageLinks}>
              {browse.pagination.pages.map((page) => (
                <Link
                  className={cx(styles.pageLink, page.active && styles.pageLinkActive)}
                  href={page.href as Route}
                  key={page.href}
                >
                  {page.label}
                </Link>
              ))}
            </div>

            {browse.pagination.nextHref ? (
              <Link
                className={getButtonClassName({ size: "sm", variant: "outline" })}
                href={browse.pagination.nextHref as Route}
              >
                Next →
              </Link>
            ) : (
              <span
                className={cx(
                  getButtonClassName({ size: "sm", variant: "outline" }),
                  styles.disabledButton,
                )}
              >
                Next →
              </span>
            )}
          </nav>
        ) : null}
      </div>
    </RoutePage>
  );
}
