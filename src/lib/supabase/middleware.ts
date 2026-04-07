import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { readSupabasePublicEnvironment } from "@/config/env";
import { resolveRouteAccess } from "@/config/routes";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const env = readSupabasePublicEnvironment();

  if (!env) {
    return response;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const routeAccess = resolveRouteAccess(request.nextUrl.pathname);

  if (!user && routeAccess?.protected) {
    const redirectUrl = request.nextUrl.clone();
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const authHref = buildProtectedAuthRedirect(nextPath);
    redirectUrl.pathname = "/auth";
    redirectUrl.search = authHref.split("?")[1] ?? "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
