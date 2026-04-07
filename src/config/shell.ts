import type { Route } from "next";

import { type AppRoute, matchPlannedRoute } from "@/config/routes";

export type PrimaryNavKey =
  | "dashboard"
  | "challenges"
  | "submit"
  | "solutions"
  | "ai"
  | "analytics";

export type SecondaryNavKey = "account" | "admin" | null;

export type RouteSkeletonDefinition = {
  description: string;
  eyebrow: string;
  pattern: AppRoute;
  primaryNavKey: PrimaryNavKey | null;
  secondaryNavKey: SecondaryNavKey;
  title: string;
};

export const primaryNavigation = [
  { href: "/", icon: "⊞", key: "dashboard", label: "Dashboard" },
  { href: "/challenges", icon: "🔍", key: "challenges", label: "Browse Challenges" },
  { href: "/submit", icon: "✦", key: "submit", label: "Submit Challenge" },
  { href: "/solutions", icon: "💡", key: "solutions", label: "Solutions" },
  { href: "/ai", icon: "◈", key: "ai", label: "AI Assistant" },
  { href: "/analytics", icon: "📊", key: "analytics", label: "Analytics" },
] as const satisfies readonly {
  href: Route;
  icon: string;
  key: PrimaryNavKey;
  label: string;
}[];

export const accountNavigation = [
  { href: "/account", label: "Account Overview" },
  { href: "/account/challenges", label: "My Challenges" },
  { href: "/account/solutions", label: "My Solutions" },
] as const satisfies readonly { href: Route; label: string }[];

export const adminNavigation = [
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/sectors", label: "Sectors" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/links", label: "Links" },
] as const satisfies readonly { href: Route; label: string }[];

export const routeSkeletons = [
  {
    description:
      "Public intelligence homepage surfacing platform momentum, featured sectors, recent challenges, and solution signals.",
    eyebrow: "Dashboard",
    pattern: "/",
    primaryNavKey: "dashboard",
    secondaryNavKey: null,
    title: "Industry Intelligence Dashboard",
  },
  {
    description:
      "Artifact-faithful browse surface for sector filtering, search, and challenge discovery without authentication.",
    eyebrow: "Public Discovery",
    pattern: "/challenges",
    primaryNavKey: "challenges",
    secondaryNavKey: null,
    title: "Browse Challenges",
  },
  {
    description:
      "Dedicated challenge detail route with public-safe metadata, geography, anonymity handling, and linked solutions.",
    eyebrow: "Challenge Detail",
    pattern: "/challenges/[slug]",
    primaryNavKey: "challenges",
    secondaryNavKey: null,
    title: "Challenge Detail",
  },
  {
    description:
      "Public solutions surface for reusable records that can link across multiple challenge contexts.",
    eyebrow: "Public Discovery",
    pattern: "/solutions",
    primaryNavKey: "solutions",
    secondaryNavKey: null,
    title: "Browse Solutions",
  },
  {
    description:
      "Dedicated solution route with provider context, linked challenges, and publication metadata.",
    eyebrow: "Solution Detail",
    pattern: "/solutions/[slug]",
    primaryNavKey: "solutions",
    secondaryNavKey: null,
    title: "Solution Detail",
  },
  {
    description:
      "Public AI assistant surface with suggested prompts, conversation layout, and room for citations in later tickets.",
    eyebrow: "AI Discovery",
    pattern: "/ai",
    primaryNavKey: "ai",
    secondaryNavKey: null,
    title: "AI Assistant",
  },
  {
    description:
      "Public analytics surface for platform intelligence, sector distribution, and growth signals separate from admin governance.",
    eyebrow: "Analytics",
    pattern: "/analytics",
    primaryNavKey: "analytics",
    secondaryNavKey: null,
    title: "Platform Analytics",
  },
  {
    description:
      "Verified-member submission route for structured challenge authoring and later draft + validation workflows.",
    eyebrow: "Member Contribution",
    pattern: "/submit",
    primaryNavKey: "submit",
    secondaryNavKey: null,
    title: "Submit a Challenge",
  },
  {
    description:
      "Saved draft route for editing in-progress submissions before review submission is introduced.",
    eyebrow: "Member Contribution",
    pattern: "/drafts/[id]",
    primaryNavKey: "submit",
    secondaryNavKey: null,
    title: "Challenge Draft",
  },
  {
    description:
      "Member account landing page for contribution overview and shortcuts into owned records.",
    eyebrow: "Member Workspace",
    pattern: "/account",
    primaryNavKey: null,
    secondaryNavKey: "account",
    title: "Account Overview",
  },
  {
    description:
      "Member-owned challenge management surface for reviewing authored and submitted challenge records.",
    eyebrow: "Member Workspace",
    pattern: "/account/challenges",
    primaryNavKey: "challenges",
    secondaryNavKey: "account",
    title: "My Challenges",
  },
  {
    description:
      "Member-owned solution management surface for reusable published solution records.",
    eyebrow: "Member Workspace",
    pattern: "/account/solutions",
    primaryNavKey: "solutions",
    secondaryNavKey: "account",
    title: "My Solutions",
  },
  {
    description:
      "Protected moderation surface for reviewing pending challenge records and governance actions.",
    eyebrow: "Admin Governance",
    pattern: "/admin/moderation",
    primaryNavKey: null,
    secondaryNavKey: "admin",
    title: "Moderation",
  },
  {
    description:
      "Protected taxonomy surface for governed sectors and metadata management.",
    eyebrow: "Admin Governance",
    pattern: "/admin/sectors",
    primaryNavKey: null,
    secondaryNavKey: "admin",
    title: "Sector Governance",
  },
  {
    description:
      "Protected company governance route for trust, verification, and profile oversight.",
    eyebrow: "Admin Governance",
    pattern: "/admin/companies",
    primaryNavKey: null,
    secondaryNavKey: "admin",
    title: "Company Governance",
  },
  {
    description:
      "Protected oversight route for challenge-solution linking and related governance workflows.",
    eyebrow: "Admin Governance",
    pattern: "/admin/links",
    primaryNavKey: null,
    secondaryNavKey: "admin",
    title: "Link Oversight",
  },
] as const satisfies readonly RouteSkeletonDefinition[];

export function getShellDefinitionByPattern(pattern: AppRoute) {
  return routeSkeletons.find((route) => route.pattern === pattern)!;
}

export function resolveShellDefinition(pathname: string) {
  const matchedRoute = matchPlannedRoute(pathname);

  if (!matchedRoute) {
    return null;
  }

  return getShellDefinitionByPattern(matchedRoute) ?? null;
}

export function resolvePrimaryNavigation(pathname: string): PrimaryNavKey | null {
  return resolveShellDefinition(pathname)?.primaryNavKey ?? null;
}

export function resolveSecondaryNavigation(pathname: string) {
  const secondaryNavKey = resolveShellDefinition(pathname)?.secondaryNavKey ?? null;

  if (secondaryNavKey === "account") {
    return accountNavigation;
  }

  if (secondaryNavKey === "admin") {
    return adminNavigation;
  }

  return null;
}
