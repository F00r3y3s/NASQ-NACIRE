import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { publicReadModelCatalog } from "@/domain/public-records";
import { requiredSectorNames } from "@/domain/contracts";
import { sectorSeeds } from "@/domain/sectors";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260406124500_t06_access_policies_public_reads_and_sector_seeds.sql",
);

function extractCreateViewSection(sql: string, viewName: string) {
  const expression = new RegExp(
    `create view public\\.${viewName}([^]*?)grant select on public\\.${viewName} to anon, authenticated;`,
    "i",
  );
  const match = sql.match(expression);

  if (!match) {
    throw new Error(`Missing create view statement for ${viewName}.`);
  }

  return match[1];
}

describe("public access models", () => {
  it("tracks the explicit public-safe read model catalog for later feature tickets", () => {
    expect(publicReadModelCatalog).toEqual({
      publicActivitySignals: "public_activity_signals",
      publicChallengeLinks: "public_challenge_solution_links",
      publicChallenges: "public_challenges",
      publicCompanies: "public_company_profiles",
      publicPlatformMetrics: "public_platform_metrics",
      publicSectorActivity: "public_sector_activity",
      publicSectors: "public_sectors",
      publicSolutions: "public_solutions",
    });
  });

  it("materializes governed sector seeds with required names, descriptions, and stable ordering", () => {
    expect(sectorSeeds.map((sector) => sector.name)).toEqual([...requiredSectorNames]);
    expect(new Set(sectorSeeds.map((sector) => sector.slug)).size).toBe(sectorSeeds.length);
    expect(sectorSeeds.every((sector) => sector.description.length >= 24)).toBe(true);
    expect(sectorSeeds.every((sector, index) => sector.displayOrder === index + 1)).toBe(true);
  });

  it("locks the migration for RLS, explicit public views, anonymous masking, and sector seeding", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    for (const tableName of [
      "profiles",
      "company_profiles",
      "memberships",
      "sectors",
      "challenges",
      "challenge_drafts",
      "solutions",
      "challenge_solution_links",
      "relay_threads",
      "relay_messages",
      "votes",
      "ai_conversations",
      "ai_messages",
      "analytics_events",
    ]) {
      expect(migrationSql).toContain(`alter table public.${tableName} enable row level security;`);
    }

    expect(migrationSql).toContain("create function public.is_admin()");
    expect(migrationSql).toContain("create function public.is_membership_owner(");
    expect(migrationSql).toContain("create function public.is_verified_member()");

    for (const viewName of Object.values(publicReadModelCatalog)) {
      expect(migrationSql).toContain(`create view public.${viewName}`);
      expect(migrationSql).toContain(`grant select on public.${viewName} to anon, authenticated;`);
    }

    const publicChallengesView = extractCreateViewSection(
      migrationSql,
      publicReadModelCatalog.publicChallenges,
    );
    const publicSolutionsView = extractCreateViewSection(
      migrationSql,
      publicReadModelCatalog.publicSolutions,
    );

    expect(publicChallengesView).toContain("case when challenges.anonymity_mode = 'anonymous'");
    expect(publicChallengesView).toContain("then 'Anonymous'");
    expect(publicChallengesView).toContain("then null");
    expect(publicChallengesView).not.toContain("owner_membership_id");

    expect(publicSolutionsView).toContain("count(distinct votes.id) as vote_count");
    expect(publicSolutionsView).toContain(
      "count(distinct challenge_solution_links.challenge_id) as linked_challenge_count",
    );

    expect(migrationSql).toContain("insert into public.sectors");

    for (const sectorName of requiredSectorNames) {
      expect(migrationSql).toContain(`'${sectorName}'`);
    }
  });
});
