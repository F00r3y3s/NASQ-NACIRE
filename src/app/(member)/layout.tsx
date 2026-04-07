import { AppShell } from "@/components/shell/app-shell";
import { requireRouteAccess } from "@/lib/auth/server";

type MemberLayoutProps = {
  children: React.ReactNode;
};

export default async function MemberLayout({ children }: MemberLayoutProps) {
  const viewer = await requireRouteAccess("/account");

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
