import { AppShell } from "@/components/shell/app-shell";
import { requireRouteAccess } from "@/lib/auth/server";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const viewer = await requireRouteAccess("/admin/moderation");

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
