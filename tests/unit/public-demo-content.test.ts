import { describe, expect, it } from "vitest";

import {
  createPublicDemoSnapshot,
  getDemoChallengeBySlug,
  getDemoSolutionBySlug,
} from "@/lib/demo/public-demo-content";

describe("public demo content", () => {
  it("provides enough challenge and solution records to exercise pagination", () => {
    const snapshot = createPublicDemoSnapshot();

    expect(snapshot.challenges.length).toBeGreaterThanOrEqual(7);
    expect(snapshot.solutions.length).toBeGreaterThanOrEqual(7);
    expect(snapshot.metrics?.publishedChallengeCount).toBe(snapshot.challenges.length);
    expect(snapshot.metrics?.publishedSolutionCount).toBe(snapshot.solutions.length);
  });

  it("covers named and anonymous challenges plus free, paid, and contact solutions", () => {
    const snapshot = createPublicDemoSnapshot();

    expect(
      new Set(snapshot.challenges.map((challenge) => challenge.anonymityMode)),
    ).toEqual(new Set(["anonymous", "named"]));
    expect(
      new Set(snapshot.solutions.map((solution) => solution.accessModel)),
    ).toEqual(new Set(["contact", "free", "paid"]));
  });

  it("exposes stable detail lookups and linked challenge-solution relationships", () => {
    const challenge = getDemoChallengeBySlug("hospital-bed-orchestration");
    const solution = getDemoSolutionBySlug("bed-command-center");

    expect(challenge).toMatchObject({
      linkedSolutionCount: 1,
      slug: "hospital-bed-orchestration",
    });
    expect(solution).toMatchObject({
      linkedChallengeCount: 2,
      slug: "bed-command-center",
    });
  });
});
