import { beforeEach, describe, expect, it, vi } from "vitest";

import { createNextRedirectMocks } from "./helpers/server-action-test-utils";
import { initialAuthActionState } from "@/lib/auth/state";

describe("auth actions integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("signs in with email and password, then redirects to the requested route", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const signInWithPassword = vi.fn(async () => ({
      data: { session: { access_token: "token" } },
      error: null,
    }));

    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("next/navigation", () => ({
      redirect,
      unstable_rethrow: unstableRethrow,
    }));
    vi.doMock("@/config/env", () => ({
      readSupabasePublicEnvironment: () => ({
        anonKey: "anon-key",
        url: "https://example.supabase.co",
      }),
      resolveEnvironmentStatus: () => ({
        appUrl: "https://nasq.example",
      }),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => ({
        auth: {
          signInWithPassword,
        },
      })),
    }));

    const { submitAuthAction } = await import("@/lib/auth/actions");

    const formData = new FormData();
    formData.set("intent", "signin");
    formData.set("email", "member@nasq.ae");
    formData.set("password", "super-secret-password");
    formData.set("next", "/submit");

    await expect(
      submitAuthAction(initialAuthActionState, formData),
    ).rejects.toMatchObject({
      location: "/submit",
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "member@nasq.ae",
      password: "super-secret-password",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns a validation error when sign-up fields are incomplete", async () => {
    vi.doMock("@/config/env", () => ({
      readSupabasePublicEnvironment: () => ({
        anonKey: "anon-key",
        url: "https://example.supabase.co",
      }),
      resolveEnvironmentStatus: () => ({
        appUrl: "https://nasq.example",
      }),
    }));

    const { submitAuthAction } = await import("@/lib/auth/actions");

    const formData = new FormData();
    formData.set("intent", "signup");
    formData.set("email", "newmember@nasq.ae");
    formData.set("password", "short");
    formData.set("firstName", "");
    formData.set("lastName", "Ahmed");
    formData.set("next", "/submit");

    const result = await submitAuthAction(initialAuthActionState, formData);

    expect(result.fieldErrors.firstName).toBeTruthy();
    expect(result.fieldErrors.password).toBeTruthy();
    expect(result.defaultValues.email).toBe("newmember@nasq.ae");
    expect(result.mode).toBe("signup");
  });

  it("creates a new account and redirects back to auth when email confirmation is still required", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const signUp = vi.fn(async () => ({
      data: {
        session: null,
        user: { id: "user-1" },
      },
      error: null,
    }));

    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("next/navigation", () => ({
      redirect,
      unstable_rethrow: unstableRethrow,
    }));
    vi.doMock("@/config/env", () => ({
      readSupabasePublicEnvironment: () => ({
        anonKey: "anon-key",
        url: "https://example.supabase.co",
      }),
      resolveEnvironmentStatus: () => ({
        appUrl: "https://nasq.example",
      }),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => ({
        auth: {
          signUp,
        },
      })),
    }));

    const { submitAuthAction } = await import("@/lib/auth/actions");

    const formData = new FormData();
    formData.set("intent", "signup");
    formData.set("email", "newmember@nasq.ae");
    formData.set("password", "super-secret-password");
    formData.set("firstName", "New");
    formData.set("lastName", "Member");
    formData.set("next", "/submit");

    await expect(
      submitAuthAction(initialAuthActionState, formData),
    ).rejects.toMatchObject({
      location: "/auth?mode=signin&next=%2Fsubmit&status=check-email",
    });
    expect(signUp).toHaveBeenCalledWith({
      email: "newmember@nasq.ae",
      options: {
        data: {
          display_name: "New Member",
          first_name: "New",
          last_name: "Member",
        },
        emailRedirectTo: "https://nasq.example/auth",
      },
      password: "super-secret-password",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("surfaces auth-provider sign-up errors clearly", async () => {
    const signUp = vi.fn(async () => ({
      data: {
        session: null,
        user: null,
      },
      error: {
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
        status: 429,
      },
    }));

    vi.doMock("@/config/env", () => ({
      readSupabasePublicEnvironment: () => ({
        anonKey: "anon-key",
        url: "https://example.supabase.co",
      }),
      resolveEnvironmentStatus: () => ({
        appUrl: "https://nasq.example",
      }),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => ({
        auth: {
          signUp,
        },
      })),
    }));

    const { submitAuthAction } = await import("@/lib/auth/actions");

    const formData = new FormData();
    formData.set("intent", "signup");
    formData.set("email", "newmember@nasq.ae");
    formData.set("password", "super-secret-password");
    formData.set("firstName", "New");
    formData.set("lastName", "Member");
    formData.set("next", "/submit");

    const result = await submitAuthAction(initialAuthActionState, formData);

    expect(result.formError).toBe(
      "Too many verification emails were requested recently. Wait a moment, then try again.",
    );
  });
});
