import { describe, expect, it } from "vitest";

import { createInitialAuthActionState } from "@/lib/auth/state";

describe("auth state", () => {
  it("creates a signup-first initial state when the page loads in signup mode", () => {
    expect(
      createInitialAuthActionState({
        mode: "signup",
        next: "/submit",
      }),
    ).toEqual({
      defaultValues: {
        email: "",
        firstName: "",
        lastName: "",
        next: "/submit",
      },
      fieldErrors: {},
      formError: null,
      mode: "signup",
    });
  });
});
