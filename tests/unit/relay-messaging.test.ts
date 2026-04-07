import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildPostRelayMessagePayload,
  buildStartRelayThreadPayload,
  getRelayCounterpartLabel,
  getRelayThreadStatusLabel,
  getRelayThreadStatusTone,
  getRelayWorkspaceStatusMessage,
  normalizeRelayComposerInput,
  validateRelayComposerInput,
} from "@/lib/relay/messaging";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260406153000_t13_relay_functions_and_policy_hardening.sql",
);

describe("relay messaging helpers", () => {
  it("normalizes relay composer values into stable server-action input", () => {
    expect(
      normalizeRelayComposerInput({
        body: "  We already operate a verified FHIR integration layer that could support this workflow safely across provider boundaries.  ",
        challengeId: " challenge-1 ",
        challengeSlug: " hospital-interoperability ",
        solutionId: " solution-1 ",
        threadId: " ",
      }),
    ).toEqual({
      body:
        "We already operate a verified FHIR integration layer that could support this workflow safely across provider boundaries.",
      challengeId: "challenge-1",
      challengeSlug: "hospital-interoperability",
      solutionId: "solution-1",
      threadId: "",
    });
  });

  it("requires a substantial body plus either an existing thread or a valid challenge target", () => {
    expect(
      validateRelayComposerInput({
        body: "Too short",
        challengeId: "",
        challengeSlug: "",
        solutionId: "",
        threadId: "",
      }),
    ).toEqual({
      fieldErrors: {
        body: "Write a relay message with at least 24 characters.",
        challengeId: "Choose an anonymous challenge or existing relay thread before sending a message.",
      },
      formError: "Complete the required relay fields before sending your message.",
    });
  });

  it("builds stable RPC payloads for thread creation and message replies", () => {
    const input = normalizeRelayComposerInput({
      body:
        "We can map this challenge to an existing interoperability stack and would like to continue through the protected relay.",
      challengeId: "challenge-1",
      challengeSlug: "hospital-interoperability",
      solutionId: "solution-1",
      threadId: "",
    });

    expect(
      buildStartRelayThreadPayload({
        body: input.body,
        challengeId: input.challengeId,
        responderMembershipId: "membership-1",
        solutionId: input.solutionId,
      }),
    ).toEqual({
      initial_body:
        "We can map this challenge to an existing interoperability stack and would like to continue through the protected relay.",
      target_challenge_id: "challenge-1",
      target_responder_membership_id: "membership-1",
      target_solution_id: "solution-1",
    });

    expect(
      buildPostRelayMessagePayload({
        body: input.body,
        threadId: "thread-1",
      }),
    ).toEqual({
      message_body:
        "We can map this challenge to an existing interoperability stack and would like to continue through the protected relay.",
      target_thread_id: "thread-1",
    });
  });

  it("keeps anonymous-owner masking stable in relay labels and status copy", () => {
    expect(
      getRelayCounterpartLabel({
        perspective: "responder",
        solutionCompanyName: "TechSolutions UAE",
      }),
    ).toBe("Anonymous challenge owner");

    expect(
      getRelayCounterpartLabel({
        perspective: "challenge_owner",
        solutionCompanyName: "TechSolutions UAE",
      }),
    ).toBe("TechSolutions UAE");

    expect(
      getRelayCounterpartLabel({
        perspective: "challenge_owner",
        solutionCompanyName: null,
      }),
    ).toBe("Verified responder");

    expect(getRelayThreadStatusLabel("open")).toBe("Open relay");
    expect(getRelayThreadStatusLabel("closed")).toBe("Closed relay");
    expect(getRelayThreadStatusTone("archived")).toBe("blue");
    expect(getRelayWorkspaceStatusMessage("relay_started")).toContain("Relay thread started");
    expect(getRelayWorkspaceStatusMessage("message_sent")).toContain("Message sent");
  });

  it("materializes the relay RPC and policy hardening migration", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).toContain("create or replace function public.can_create_relay_thread(");
    expect(migrationSql).toContain("create or replace function public.can_post_relay_message(");
    expect(migrationSql).toContain("create or replace function public.start_relay_thread(");
    expect(migrationSql).toContain("create or replace function public.post_relay_message(");
    expect(migrationSql).toContain("anonymity_mode = 'anonymous'");
    expect(migrationSql).toContain("status = 'published'");
    expect(migrationSql).toContain("challenges.owner_membership_id <> target_responder_membership_id");
    expect(migrationSql).toContain("drop policy if exists \"relay_threads_insert_verified_participants_or_admin\"");
    expect(migrationSql).toContain("drop policy if exists \"relay_messages_insert_participants_or_admin\"");
  });
});
