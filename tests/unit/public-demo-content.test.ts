import { describe, expect, it } from "vitest";

import {
  createPublicDemoSnapshot,
  getDemoChallengeBySlug,
  getDemoSolutionBySlug,
} from "@/lib/demo/public-demo-content";
import { sectorSeeds } from "@/domain/sectors";

describe("public demo content", () => {
  it("provides enough challenge and solution records to exercise pagination", () => {
    const snapshot = createPublicDemoSnapshot();

    expect(snapshot.challenges.length).toBe(sectorSeeds.length * 15);
    expect(snapshot.solutions.length).toBe(sectorSeeds.length * 4);
    expect(snapshot.metrics?.publishedChallengeCount).toBe(snapshot.challenges.length);
    expect(snapshot.metrics?.publishedSolutionCount).toBe(snapshot.solutions.length);
  });

  it("creates exactly 15 challenge posts per sector with a solved and open mix", () => {
    const snapshot = createPublicDemoSnapshot();
    const countsBySector = new Map<string, number>();

    snapshot.challenges.forEach((challenge) => {
      countsBySector.set(
        challenge.sectorSlug,
        (countsBySector.get(challenge.sectorSlug) ?? 0) + 1,
      );
    });

    expect(countsBySector.size).toBe(sectorSeeds.length);
    expect([...countsBySector.values()]).toEqual(new Array(sectorSeeds.length).fill(15));
    expect(snapshot.challenges.some((challenge) => challenge.linkedSolutionCount === 0)).toBe(true);
    expect(snapshot.challenges.some((challenge) => challenge.linkedSolutionCount > 0)).toBe(true);
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
