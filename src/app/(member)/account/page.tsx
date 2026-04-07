import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { AccountOnboardingForm } from "@/components/auth/account-onboarding-form";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Surface } from "@/components/ui/surface";
import { accountNavigation, getShellDefinitionByPattern } from "@/config/shell";
import { signOutAction, submitMembershipOnboardingAction } from "@/lib/auth/actions";
import { getCurrentViewer } from "@/lib/auth/server";

const definition = getShellDefinitionByPattern("/account");

function resolveStatusMessage(value: string | string[] | undefined) {
  const status = Array.isArray(value) ? value[0] : value;

  if (status === "verification-requested") {
    return "Your company verification request was submitted. An admin can now review and activate member publishing access.";
  }

  return null;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const viewer = await getCurrentViewer();
  const verifiedMemberships = viewer.memberships.filter(
    (membership) => membership.verificationStatus === "verified",
  ).length;
  const pendingMemberships = viewer.memberships.filter(
    (membership) => membership.verificationStatus === "pending",
  );
  const statusMessage = resolveStatusMessage(params.status);
  const showOnboardingForm = viewer.memberships.length === 0;
  const showPendingState = pendingMemberships.length > 0 && !viewer.isVerifiedMember;

  return (
    <RoutePage
      actions={
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sign Out
          </Button>
        </form>
      }
      badges={[
        {
          label: viewer.isAdmin
            ? "Admin Access"
            : viewer.isVerifiedMember
              ? "Verified Member"
              : "Verification Pending",
          tone: viewer.isAdmin || viewer.isVerifiedMember ? "green" : "gold",
        },
        {
          label: viewer.primaryCompany?.name ?? "No Company Linked Yet",
          tone: viewer.primaryCompany ? "blue" : "red",
        },
      ]}
      description={
        viewer.primaryCompany
          ? `${definition.description} Primary company: ${viewer.primaryCompany.name}.`
          : `${definition.description} Link a company membership to unlock contribution flows.`
      }
      eyebrow={definition.eyebrow}
      tabs={accountNavigation.map((item) => ({
        ...item,
        active: item.href === "/account",
      }))}
      title={definition.title}
    >
      <div className={shell.gridThree}>
        <StatCard
          icon="🏭"
          label="Linked Companies"
          tone="blue"
          value={String(viewer.memberships.length)}
        />
        <StatCard
          icon="✓"
          label="Verified Memberships"
          tone={viewer.isVerifiedMember ? "green" : "gold"}
          value={String(verifiedMemberships)}
        />
        <StatCard
          icon="✦"
          label="Platform Access"
          tone={viewer.isAdmin ? "teal" : viewer.isVerifiedMember ? "green" : "gold"}
          value={viewer.isAdmin ? "Admin" : viewer.isVerifiedMember ? "Verified" : "Pending"}
        />
      </div>

      {statusMessage ? (
        <Surface tone="muted">
          <h2 className={shell.sectionTitle}>Verification Request Sent</h2>
          <p className={shell.copy}>{statusMessage}</p>
        </Surface>
      ) : null}

      {showOnboardingForm ? (
        <div className={shell.gridTwo}>
          <Surface padding="lg">
            <h2 className={shell.sectionTitle}>Set Up Your Company Access</h2>
            <p className={shell.copy}>
              New accounts stay in discovery mode until a company profile and pending membership
              request are created. Submit the company details below so an admin can verify your
              workspace and unlock challenge or solution authoring.
            </p>
            <div style={{ marginTop: "18px" }}>
              <AccountOnboardingForm action={submitMembershipOnboardingAction} />
            </div>
          </Surface>

          <div className={shell.stack}>
            <Surface>
              <h2 className={shell.sectionTitle}>What happens next</h2>
              <ul className={shell.list}>
                <li className={shell.listItem}>
                  <div>
                    <div className={shell.listPrimary}>Private company profile is created</div>
                    <div className={shell.listSecondary}>
                      Your company stays out of public discovery until governance review is complete.
                    </div>
                  </div>
                </li>
                <li className={shell.listItem}>
                  <div>
                    <div className={shell.listPrimary}>Membership starts as pending</div>
                    <div className={shell.listSecondary}>
                      Admins can approve it from the protected company-governance console.
                    </div>
                  </div>
                </li>
                <li className={shell.listItem}>
                  <div>
                    <div className={shell.listPrimary}>Contribution routes unlock after approval</div>
                    <div className={shell.listSecondary}>
                      Until then, you can still browse public challenges, solutions, analytics, and AI discovery.
                    </div>
                  </div>
                </li>
              </ul>
            </Surface>
          </div>
        </div>
      ) : null}

      {showPendingState ? (
        <div className={shell.gridTwo}>
          <Surface padding="lg">
            <h2 className={shell.sectionTitle}>Verification Pending</h2>
            <p className={shell.copy}>
              Your account is linked to{" "}
              <strong>{viewer.primaryCompany?.name ?? "a pending company profile"}</strong>, but
              member publishing access is still waiting on admin review.
            </p>
            <div className={shell.metaGrid} style={{ marginTop: "16px" }}>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Primary Company</div>
                <div className={shell.metaValue}>
                  {viewer.primaryCompany?.name ?? "Pending company profile"}
                </div>
              </div>
              <div className={shell.metaItem}>
                <div className={shell.metaLabel}>Pending Memberships</div>
                <div className={shell.metaValue}>{String(pendingMemberships.length)}</div>
              </div>
            </div>
          </Surface>

          <Surface>
            <h2 className={shell.sectionTitle}>While you wait</h2>
            <ul className={shell.list}>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Keep exploring public discovery</div>
                  <div className={shell.listSecondary}>
                    Challenges, solutions, analytics, and AI discovery remain available immediately.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Admin review enables authoring</div>
                  <div className={shell.listSecondary}>
                    Once the membership is marked verified, `Submit Challenge`, publishing, and relay response become available.
                  </div>
                </div>
              </li>
            </ul>
          </Surface>
        </div>
      ) : null}
    </RoutePage>
  );
}
