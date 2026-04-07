import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type {
  PublicChallengeRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";
import { createLocalNasqAiProvider } from "@/lib/ai/provider";
import {
  buildAiRetrievalDocuments,
  createDraftAssistInput,
  selectAiEvidenceMatches,
} from "@/lib/ai/retrieval";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260406183000_t15_ai_grounding_and_guest_citations.sql",
);

const healthcareChallenge: PublicChallengeRecord = {
  anonymityMode: "anonymous",
  companyLogoPath: null,
  companyName: "Anonymous",
  companySlug: null,
  desiredOutcome: "A unified emergency response workflow across provider networks.",
  geographyLabel: "UAE",
  id: "challenge-health-1",
  linkedSolutionCount: 1,
  problemStatement:
    "Fragmented records across hospital networks delay triage and duplicate diagnostics.",
  publishedAt: "2026-04-06T08:00:00.000Z",
  sectorId: "sector-health",
  sectorName: "Healthcare",
  sectorSlug: "healthcare",
  slug: "hospital-interoperability",
  status: "published",
  summary: "Fragmented records delay emergency care across hospital networks.",
  title: "Hospital Interoperability",
};

const healthcareSolution: PublicSolutionRecord = {
  accessModel: "free",
  companyId: "company-health-1",
  companyLogoPath: null,
  companyName: "MedTech Arabia",
  companySlug: "medtech-arabia",
  coverageLabel: "UAE + GCC",
  id: "solution-health-1",
  linkedChallengeCount: 2,
  offeringDescription:
    "FHIR middleware with consent-aware patient data exchange and triage-ready dashboards.",
  publishedAt: "2026-04-06T09:00:00.000Z",
  sectorId: "sector-health",
  sectorName: "Healthcare",
  sectorSlug: "healthcare",
  slug: "fhir-exchange-platform",
  status: "published",
  summary: "FHIR middleware for patient data exchange across hospitals.",
  title: "FHIR Exchange Platform",
  voteCount: 31,
};

const energySolution: PublicSolutionRecord = {
  accessModel: "paid",
  companyId: "company-energy-1",
  companyLogoPath: null,
  companyName: "GridOptics",
  companySlug: "gridoptics",
  coverageLabel: "Global",
  id: "solution-energy-1",
  linkedChallengeCount: 1,
  offeringDescription:
    "Industrial monitoring stack for refinery energy optimization and predictive maintenance.",
  publishedAt: "2026-04-05T09:00:00.000Z",
  sectorId: "sector-energy",
  sectorName: "Oil & Gas",
  sectorSlug: "oil-gas",
  slug: "refinery-energy-optimization",
  status: "published",
  summary: "Energy optimization stack for refinery operations.",
  title: "Refinery Energy Optimization",
  voteCount: 9,
};

describe("ai retrieval helpers", () => {
  it("builds retrieval documents only from public-safe challenge and solution records", () => {
    const documents = buildAiRetrievalDocuments({
      challenges: [healthcareChallenge],
      solutions: [healthcareSolution],
    });

    expect(documents).toHaveLength(2);
    expect(documents.find((document) => document.recordType === "challenge")).toMatchObject({
      companyName: "Anonymous",
      recordId: "challenge-health-1",
      recordType: "challenge",
      route: "/challenges/hospital-interoperability",
      sectorName: "Healthcare",
      title: "Hospital Interoperability",
    });
    expect(documents.find((document) => document.recordType === "solution")).toMatchObject({
      companyName: "MedTech Arabia",
      recordId: "solution-health-1",
      recordType: "solution",
      route: "/solutions/fhir-exchange-platform",
      sectorName: "Healthcare",
      title: "FHIR Exchange Platform",
    });
  });

  it("ranks the most relevant evidence and shapes citation-safe records", async () => {
    const provider = createLocalNasqAiProvider();
    const documents = buildAiRetrievalDocuments({
      challenges: [healthcareChallenge],
      solutions: [healthcareSolution, energySolution],
    });

    const evidence = await selectAiEvidenceMatches({
      documents,
      maxResults: 2,
      prompt:
        "How can hospitals in the UAE improve patient data sharing during emergency care handoffs?",
      provider,
    });

    expect(evidence).toHaveLength(2);
    expect(evidence[0]?.citation).toMatchObject({
      href: "/challenges/hospital-interoperability",
      recordId: "challenge-health-1",
      recordType: "challenge",
    });
    expect(evidence[1]?.citation).toMatchObject({
      href: "/solutions/fhir-exchange-platform",
      recordId: "solution-health-1",
      recordType: "solution",
    });
    expect(evidence[0]?.score).toBeGreaterThan(evidence[1]?.score ?? 0);
  });

  it("turns a signed-in conversation and evidence into an editable challenge draft input", async () => {
    const provider = createLocalNasqAiProvider();
    const draftInput = await createDraftAssistInput({
      conversationId: "conversation-1",
      conversationTitle: "Hospital Interoperability",
      evidence: [
        {
          citation: {
            href: "/challenges/hospital-interoperability",
            label: "Challenge: Hospital Interoperability",
            recordId: "challenge-health-1",
            recordType: "challenge",
          },
          companyName: "Anonymous",
          recordType: "challenge",
          score: 0.95,
          sectorId: "sector-health",
          sectorName: "Healthcare",
          summary:
            "Fragmented records delay emergency care across hospital networks.",
          title: "Hospital Interoperability",
        },
        {
          citation: {
            href: "/solutions/fhir-exchange-platform",
            label: "Solution: FHIR Exchange Platform",
            recordId: "solution-health-1",
            recordType: "solution",
          },
          companyName: "MedTech Arabia",
          recordType: "solution",
          score: 0.88,
          sectorId: "sector-health",
          sectorName: "Healthcare",
          summary: "FHIR middleware for patient data exchange across hospitals.",
          title: "FHIR Exchange Platform",
        },
      ],
      provider,
      sectors: [
        {
          description: "Clinical, hospital, patient-data, and care-delivery challenges.",
          id: "sector-health",
          name: "Healthcare",
          slug: "healthcare",
        },
      ],
      transcript: [
        {
          content:
            "Our hospitals in the UAE still struggle to exchange patient data during emergency handoffs.",
          role: "user",
        },
        {
          content:
            "Grounded answer with cited public challenge and solution records.",
          role: "assistant",
        },
      ],
    });

    expect(draftInput.sourceConversationId).toBe("conversation-1");
    expect(draftInput.sectorId).toBe("sector-health");
    expect(draftInput.geographyLabel).toBe("UAE");
    expect(draftInput.anonymityMode).toBe("named");
    expect(draftInput.title).toContain("Hospital");
    expect(draftInput.summary.length).toBeGreaterThanOrEqual(24);
    expect(draftInput.problemStatement).toContain("patient data");
  });

  it("materializes the T15 guest citation migration", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).toContain(
      "create or replace function public.submit_guest_ai_turn(",
    );
    expect(migrationSql).toContain("assistant_citations jsonb");
    expect(migrationSql).toContain("jsonb_typeof(sanitized_assistant_citations) <> 'array'");
    expect(migrationSql).toContain("citations");
  });
});
