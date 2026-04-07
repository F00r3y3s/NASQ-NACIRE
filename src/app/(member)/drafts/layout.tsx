import { requireRouteAccess } from "@/lib/auth/server";

type DraftsLayoutProps = {
  children: React.ReactNode;
};

export default async function DraftsLayout({ children }: DraftsLayoutProps) {
  await requireRouteAccess("/drafts/[id]");

  return children;
}
