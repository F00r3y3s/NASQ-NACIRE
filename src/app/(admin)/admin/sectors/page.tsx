import Link from "next/link";
import type { Route } from "next";

import { SectorGovernanceForm } from "@/components/admin/sector-governance-form";
import styles from "@/components/admin/governance.module.css";
import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Badge } from "@/components/ui/badge";
import { getButtonClassName } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { adminNavigation, getShellDefinitionByPattern } from "@/config/shell";
import { submitSectorGovernanceAction } from "@/lib/actions/admin-governance";
import { getAdminSectorsViewModel } from "@/lib/data/admin-governance";
import { cx } from "@/lib/cx";

const definition = getShellDefinitionByPattern("/admin/sectors");

type SectorsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SectorsPage({ searchParams }: SectorsPageProps) {
  const sectors = await getAdminSectorsViewModel(searchParams);

  return (
    <RoutePage
      actions={
        <Link
          className={getButtonClassName({ variant: "outline" })}
          href={"/admin/sectors?sector=new" as Route}
        >
          + Create Sector
        </Link>
      }
      badges={sectors.badges}
      description={definition.description}
      eyebrow={definition.eyebrow}
      tabs={adminNavigation.map((item) => ({
        ...item,
        active: item.href === "/admin/sectors",
      }))}
      title={definition.title}
    >
      <div className={shell.stack}>
        <Surface>
          <p className={shell.copy}>{sectors.supportingText}</p>
          {sectors.statusMessage ? (
            <div
              aria-live="polite"
              className={cx(styles.notice, styles.noticeSuccess)}
              role="status"
              style={{ marginTop: 14 }}
            >
              {sectors.statusMessage}
            </div>
          ) : null}
          {sectors.state === "error" ? (
            <div
              aria-live="assertive"
              className={cx(styles.notice, styles.noticeError)}
              role="alert"
              style={{ marginTop: 14 }}
            >
              Verify the Supabase connection and admin session before editing governed taxonomy.
            </div>
          ) : null}
        </Surface>

        <div className={styles.grid}>
          <Surface className={styles.listPanel}>
            <h2 className={shell.sectionTitle}>Governed Sector Catalog</h2>
            {sectors.sectors.length > 0 ? (
              sectors.sectors.map((sector) => (
                <Link
                  className={`${styles.listLink} ${
                    sector.selected ? styles.listLinkSelected : ""
                  }`}
                  href={sector.href as Route}
                  key={sector.id}
                >
                  <div className={styles.listTop}>
                    <div className={styles.listTitle}>{sector.name}</div>
                    <Badge tone={sector.selected ? "gold" : sector.visibilityLabel.includes("Visible") ? "green" : "blue"}>
                      {sector.visibilityLabel}
                    </Badge>
                  </div>
                  <div className={styles.listSubtitle}>{sector.description}</div>
                  <div className={styles.listMeta}>
                    {sector.challengeCountLabel} · {sector.solutionCountLabel} · icon:{" "}
                    {sector.iconKey}
                  </div>
                </Link>
              ))
            ) : (
              <p className={shell.copy}>
                Governed sectors will appear here once the seeded taxonomy is available.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>
              {sectors.selectedSector?.id ? "Edit Sector" : "Create Governed Sector"}
            </h2>
            {sectors.selectedSector ? (
              <div className={styles.stack}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Sector</div>
                    <div className={styles.summaryValue}>{sectors.selectedSector.name}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Display Order</div>
                    <div className={styles.summaryValue}>
                      {sectors.selectedSector.displayOrder}
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Coverage</div>
                    <div className={styles.summaryValue}>
                      {sectors.selectedSector.challengeCountLabel}
                    </div>
                  </div>
                </div>
                <SectorGovernanceForm
                  action={submitSectorGovernanceAction}
                  initialValues={sectors.selectedSector.input}
                  key={sectors.selectedSector.id || "new-sector"}
                  mode={sectors.selectedSector.id ? "edit" : "create"}
                />
              </div>
            ) : (
              <p className={shell.copy}>
                Select a sector to edit its governed metadata, or start a new one from the create action.
              </p>
            )}
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
