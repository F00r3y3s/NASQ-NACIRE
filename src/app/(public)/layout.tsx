import { AppShell } from "@/components/shell/app-shell";
import { getCurrentViewer } from "@/lib/auth/server";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const viewer = await getCurrentViewer();

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
