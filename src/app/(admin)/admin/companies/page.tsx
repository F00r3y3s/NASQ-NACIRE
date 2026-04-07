import Link from "next/link";
import type { Route } from "next";

import { CompanyGovernanceForm } from "@/components/admin/company-governance-form";
import styles from "@/components/admin/governance.module.css";
import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldLabel, SelectField } from "@/components/ui/field";
import { Surface } from "@/components/ui/surface";
import { adminNavigation, getShellDefinitionByPattern } from "@/config/shell";
import {
  submitCompanyGovernanceAction,
  submitMembershipGovernanceAction,
} from "@/lib/actions/admin-governance";
import { getAdminCompaniesViewModel } from "@/lib/data/admin-governance";
import { cx } from "@/lib/cx";

const definition = getShellDefinitionByPattern("/admin/companies");

type CompaniesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const companies = await getAdminCompaniesViewModel(searchParams);
  const selectedCompany = companies.selectedCompany;

  return (
    <RoutePage
      badges={companies.badges}
      description={definition.description}
      eyebrow={definition.eyebrow}
      tabs={adminNavigation.map((item) => ({
        ...item,
        active: item.href === "/admin/companies",
      }))}
      title={definition.title}
    >
      <div className={shell.stack}>
        <Surface>
          <p className={shell.copy}>{companies.supportingText}</p>
          {companies.statusMessage ? (
            <div
              aria-live="polite"
              className={cx(styles.notice, styles.noticeSuccess)}
              role="status"
              style={{ marginTop: 14 }}
            >
              {companies.statusMessage}
            </div>
          ) : null}
          {companies.state === "error" ? (
            <div
              aria-live="assertive"
              className={cx(styles.notice, styles.noticeError)}
              role="alert"
              style={{ marginTop: 14 }}
            >
              Company governance data could not be loaded. Verify the admin session and seeded company data.
            </div>
          ) : null}
        </Surface>

        <div className={styles.grid}>
          <Surface className={styles.listPanel}>
            <h2 className={shell.sectionTitle}>Company Governance Queue</h2>
            {companies.companies.length > 0 ? (
              companies.companies.map((company) => (
                <Link
                  className={`${styles.listLink} ${
                    company.selected ? styles.listLinkSelected : ""
                  }`}
                  href={company.href as Route}
                  key={company.id}
                >
                  <div className={styles.listTop}>
                    <div className={styles.listTitle}>{company.name}</div>
                    <Badge tone={company.visibilityLabel.includes("Public") ? "green" : "blue"}>
                      {company.visibilityLabel}
                    </Badge>
                  </div>
                  <div className={styles.listSubtitle}>{company.trustSummary}</div>
                  <div className={styles.listMeta}>{company.membershipSummary}</div>
                </Link>
              ))
            ) : (
              <p className={shell.copy}>
                Company profiles will appear here once verified member organizations are present.
              </p>
            )}
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>Company Profile Governance</h2>
            {selectedCompany ? (
              <div className={styles.stack}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Company</div>
                    <div className={styles.summaryValue}>{selectedCompany.name}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Memberships</div>
                    <div className={styles.summaryValue}>{selectedCompany.membershipSummary}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Published Footprint</div>
                    <div className={styles.summaryValue}>{selectedCompany.trustSummary}</div>
                  </div>
                </div>
                <CompanyGovernanceForm
                  action={submitCompanyGovernanceAction}
                  initialValues={selectedCompany.input}
                  key={selectedCompany.id}
                />
              </div>
            ) : (
              <p className={shell.copy}>
                Select a company record to review profile visibility and public metadata.
              </p>
            )}
          </Surface>
        </div>

        <Surface>
          <h2 className={shell.sectionTitle}>Member Verification Controls</h2>
          {selectedCompany ? (
            <div className={styles.stack}>
              <p className={shell.copy}>
                Use this queue to approve, suspend, or leave memberships pending. Only verified memberships can be marked as primary for a member.
              </p>
              {selectedCompany.members.length > 0 ? (
                selectedCompany.members.map((member) => (
                  <div className={styles.memberCard} key={member.id}>
                    <div className={styles.memberHeader}>
                      <div>
                        <div className={styles.memberTitle}>{member.userLabel}</div>
                        <div className={styles.memberMeta}>
                          {member.roleLabel}
                          {member.email ? ` · ${member.email}` : ""}
                          {member.isPrimary ? " · Primary" : ""}
                        </div>
                      </div>
                      <Badge tone={member.verificationTone}>
                        {member.verificationLabel}
                      </Badge>
                    </div>

                    <form action={submitMembershipGovernanceAction} className={styles.inlineForm}>
                      <input
                        name="companyId"
                        type="hidden"
                        value={selectedCompany.id}
                      />
                      <input name="membershipId" type="hidden" value={member.id} />
                      <div className={shell.fieldGroup}>
                        <FieldLabel htmlFor={`verification-${member.id}`}>
                          Verification
                        </FieldLabel>
                        <SelectField
                          defaultValue={member.verificationValue}
                          id={`verification-${member.id}`}
                          name="verificationStatus"
                        >
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="suspended">Suspended</option>
                        </SelectField>
                      </div>
                      <label className={styles.toggleCard}>
                        <div>
                          <span className={styles.toggleLabel}>Primary Membership</span>
                          <span className={styles.toggleHint}>
                            Applies only when the membership is verified.
                          </span>
                        </div>
                        <input
                          className={styles.toggleInput}
                          defaultChecked={member.isPrimary}
                          name="isPrimary"
                          type="checkbox"
                        />
                      </label>
                      <Button size="sm" type="submit">
                        Save Member
                      </Button>
                    </form>
                  </div>
                ))
              ) : (
                <p className={shell.copy}>
                  This company has no memberships to review yet.
                </p>
              )}
            </div>
          ) : (
            <p className={shell.copy}>
              Select a company to review its member verification states.
            </p>
          )}
        </Surface>
      </div>
    </RoutePage>
  );
}
