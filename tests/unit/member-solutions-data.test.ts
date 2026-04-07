import { describe, expect, it } from "vitest";

import {
  getInitialSolutionAuthoringInput,
  resolveSolutionAccessModel,
} from "@/lib/data/member-solutions";

describe("member solutions data helpers", () => {
  it("accepts only supported access-model query params", () => {
    expect(resolveSolutionAccessModel("free")).toBe("free");
    expect(resolveSolutionAccessModel("paid")).toBe("paid");
    expect(resolveSolutionAccessModel("contact")).toBe("contact");
    expect(resolveSolutionAccessModel("invalid")).toBeNull();
    expect(resolveSolutionAccessModel(undefined)).toBeNull();
  });

  it("prefills new solution inputs from browse and submit handoff context", () => {
    expect(
      getInitialSolutionAuthoringInput(null, {
        preselectedAccessModel: "paid",
        preselectedChallenge: {
          companyName: "Anonymous",
          id: "challenge-2",
          publishedAt: "2026-04-05T08:00:00.000Z",
          sectorId: "sector-health",
          sectorName: "Healthcare",
          slug: "hospital-interoperability",
          title: "Hospital Interoperability",
        },
      }),
    ).toMatchObject({
      accessModel: "paid",
      linkedChallengeIds: ["challenge-2"],
      sectorId: "sector-health",
    });
  });
});
