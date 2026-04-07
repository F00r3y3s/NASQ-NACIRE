import Link from "next/link";
import type { Route } from "next";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Button, ButtonLink, getButtonClassName } from "@/components/ui/button";
import { FieldLabel, SelectField, TextInput } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { SolutionCard } from "@/components/ui/solution-card";
import { Surface } from "@/components/ui/surface";
import { getShellDefinitionByPattern } from "@/config/shell";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";
import { getCurrentViewer } from "@/lib/auth/server";
import { cx } from "@/lib/cx";
import { getPublicSolutionsBrowseViewModel } from "@/lib/data/public-solutions";

import styles from "./page.module.css";

const definition = getShellDefinitionByPattern("/solutions");

type SolutionsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SolutionsPage({ searchParams }: SolutionsPageProps) {
  const viewer = await getCurrentViewer();
  const browse = await getPublicSolutionsBrowseViewModel(searchParams);
  const publishHref =
    viewer.status === "anonymous"
      ? buildProtectedAuthRedirect("/account/solutions")
      : "/account/solutions";

  return (
    <RoutePage
      actions={
        <ButtonLink href={publishHref as Route} variant="outline">
          + Publish Solution
        </ButtonLink>
      }
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

          <form action="/solutions" className={styles.formGrid}>
            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="solution-search">Keyword Search</FieldLabel>
              <TextInput
                defaultValue={browse.filters.query}
                id="solution-search"
                name="q"
                placeholder="Search by solution, provider, summary, or sector"
              />
            </div>

            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="solution-sector">Governed Sector</FieldLabel>
              <SelectField
                defaultValue={browse.filters.sectorSlug ?? ""}
                id="solution-sector"
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
              <FieldLabel htmlFor="solution-access">Access Model</FieldLabel>
              <SelectField
                defaultValue={browse.filters.accessModel ?? ""}
                id="solution-access"
                name="access"
              >
                <option value="">All access models</option>
                {browse.accessOptions
                  .filter((option) => option.value !== null)
                  .map((option) => (
                    <option key={option.value} value={option.value ?? ""}>
                      {option.label}
                    </option>
                  ))}
              </SelectField>
            </div>

            <div className={styles.fieldStack}>
              <FieldLabel htmlFor="solution-sort">Sort Order</FieldLabel>
              <SelectField defaultValue={browse.filters.sort} id="solution-sort" name="sort">
                {browse.sortOptions.map((sortOption) => (
                  <option key={sortOption.value} value={sortOption.value}>
                    {sortOption.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className={styles.formActions}>
              <Button type="submit">Apply Filters</Button>
              <Link
                className={getButtonClassName({ size: "md", variant: "outline" })}
                href="/solutions"
              >
                Reset
              </Link>
            </div>
          </form>
        </Surface>

        <form action="/solutions" className={styles.pills}>
          {browse.filters.query ? <input name="q" type="hidden" value={browse.filters.query} /> : null}
          {browse.filters.accessModel ? (
            <input name="access" type="hidden" value={browse.filters.accessModel} />
          ) : null}
          {browse.filters.sort !== "latest" ? (
            <input name="sort" type="hidden" value={browse.filters.sort} />
          ) : null}

          {browse.quickFilters.map((filter) => (
            <Pill
              active={filter.active}
              key={filter.slug ?? "all"}
              name="sector"
              priority={filter.priority}
              title={`${filter.resultCount} published solution${filter.resultCount === 1 ? "" : "s"}`}
              type="submit"
              value={filter.slug ?? ""}
            >
              {filter.label}
            </Pill>
          ))}
        </form>

        <div className={styles.resultsRow}>
          <div>
            <h2 className={styles.sectionTitle}>Published Solution Records</h2>
            <p className={styles.copy}>{browse.resultSummary}</p>
          </div>
          {browse.pagination.pageCount > 1 ? (
            <div className={styles.pageIndicator}>
              Page {browse.pagination.currentPage} of {browse.pagination.pageCount}
            </div>
          ) : null}
        </div>

        {browse.cards.length > 0 ? (
          <div className={styles.solutionList}>
            {browse.cards.map((card) => (
              <Link
                aria-label={`Open solution: ${card.title}`}
                className={styles.cardLink}
                href={card.href as Route}
                key={card.href}
              >
                <SolutionCard {...card} />
              </Link>
            ))}
          </div>
        ) : (
          <Surface className={styles.emptySurface}>
            <p className={styles.copy}>{browse.emptyMessage}</p>
          </Surface>
        )}

        {browse.pagination.pageCount > 1 ? (
          <nav aria-label="Solutions browse pagination" className={styles.pagination}>
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
