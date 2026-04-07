import { requireRouteAccess } from "@/lib/auth/server";

type SubmitLayoutProps = {
  children: React.ReactNode;
};

export default async function SubmitLayout({ children }: SubmitLayoutProps) {
  await requireRouteAccess("/submit");

  return children;
}
