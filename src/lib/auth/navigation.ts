const DEFAULT_POST_AUTH_PATH = "/account";

export type AuthMode = "signin" | "signup";

function isSafeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !/[\r\n]/.test(value);
}

export function resolvePostAuthPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_AUTH_PATH,
) {
  const normalizedValue = value?.trim();

  if (!normalizedValue || !isSafeInternalPath(normalizedValue)) {
    return fallback;
  }

  return normalizedValue;
}

export function buildAuthHref(
  nextPath: string | null | undefined,
  mode: AuthMode = "signin",
) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  params.set("next", resolvePostAuthPath(nextPath, DEFAULT_POST_AUTH_PATH));

  return `/auth?${params.toString()}`;
}

export function buildProtectedAuthRedirect(pathname: string) {
  return buildAuthHref(pathname, "signin");
}

