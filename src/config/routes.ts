export const publicRoutes = [
  "/",
  "/challenges",
  "/challenges/[slug]",
  "/solutions",
  "/solutions/[slug]",
  "/ai",
  "/analytics",
] as const;

export const memberRoutes = [
  "/submit",
  "/drafts/[id]",
  "/account",
  "/account/challenges",
  "/account/solutions",
] as const;

export const adminRoutes = [
  "/admin/moderation",
  "/admin/sectors",
  "/admin/companies",
  "/admin/links",
] as const;

export const routeCatalog = {
  public: publicRoutes,
  member: memberRoutes,
  admin: adminRoutes,
} as const;

export type RouteGroup = keyof typeof routeCatalog;
export type AppRoute =
  | (typeof publicRoutes)[number]
  | (typeof memberRoutes)[number]
  | (typeof adminRoutes)[number];

function escapeRouteSegment(segment: string) {
  return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternToRegExp(pattern: AppRoute) {
  const segments = pattern
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith("[") && segment.endsWith("]")
        ? "[^/]+"
        : escapeRouteSegment(segment),
    );

  return new RegExp(`^/${segments.join("/")}$`);
}

function normalizePathname(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function matchPlannedRoute(pathname: string): AppRoute | null {
  const normalizedPath = normalizePathname(pathname);

  for (const patterns of Object.values(routeCatalog) as unknown as readonly (readonly AppRoute[])[]) {
    const matchedPattern = patterns.find((pattern) =>
      patternToRegExp(pattern).test(normalizedPath),
    );

    if (matchedPattern) {
      return matchedPattern;
    }
  }

  return null;
}

export function resolveRouteAccess(pathname: string) {
  const matchedRoute = matchPlannedRoute(pathname);

  for (const [group, patterns] of Object.entries(routeCatalog) as [
    RouteGroup,
    readonly AppRoute[],
  ][]) {
    const matched = matchedRoute ? patterns.includes(matchedRoute) : false;

    if (matched) {
      return {
        group,
        protected: group !== "public",
      } as const;
    }
  }

  return null;
}
