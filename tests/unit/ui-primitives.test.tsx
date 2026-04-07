import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { SolutionCard } from "@/components/ui/solution-card";

describe("ui primitives", () => {
  it("renders button variants and sizes through stable component contracts", () => {
    const html = renderToStaticMarkup(
      <Button size="lg" variant="outline">
        Ask AI
      </Button>,
    );

    expect(html).toContain('data-size="lg"');
    expect(html).toContain('data-variant="outline"');
    expect(html).toContain("Ask AI");
  });

  it("renders badge and pill tone state without leaking styling decisions into callers", () => {
    const badgeHtml = renderToStaticMarkup(<Badge tone="green">Solved</Badge>);
    const pillHtml = renderToStaticMarkup(
      <Pill active priority>
        Oil &amp; Gas
      </Pill>,
    );

    expect(badgeHtml).toContain('data-tone="green"');
    expect(badgeHtml).toContain("Solved");
    expect(pillHtml).toContain('data-active="true"');
    expect(pillHtml).toContain('data-priority="true"');
    expect(pillHtml).toContain("Oil &amp; Gas");
  });

  it("masks owner identity for anonymous challenge cards while keeping public-safe metadata", () => {
    const html = renderToStaticMarkup(
      <ChallengeCard
        anonymous
        meta={["💡 1", "👁 89", "🇦🇪 UAE"]}
        sectorLabel="Healthcare"
        sectorTone="blue"
        statusLabel="Open"
        statusTone="red"
        summary="Fragmented records create delays in emergency care and duplicate diagnostics."
        title="Patient Data Interoperability Between Hospitals"
      />,
    );

    expect(html).toContain("Anonymous");
    expect(html).not.toContain("ADNOC");
    expect(html).toContain("Patient Data Interoperability Between Hospitals");
    expect(html).toContain("👁 89");
  });

  it("renders solution cards with publication label, sector tag, and engagement summary", () => {
    const html = renderToStaticMarkup(
      <SolutionCard
        engagementLabel="3 matches"
        publicationLabel="Free Solution"
        publicationTone="green"
        regionLabel="Global · TechSolutions UAE"
        sectorLabel="Oil &amp; Gas"
        sectorTone="gold"
        summary="Deploys autonomous underwater vehicles with multi-beam ultrasonic sensors and ML anomaly detection."
        title="AI-Powered Ultrasonic Corrosion Mapping"
        votes={47}
      />,
    );

    expect(html).toContain("Free Solution");
    expect(html).toContain("AI-Powered Ultrasonic Corrosion Mapping");
    expect(html).toContain("3 matches");
    expect(html).toContain("47");
  });
});
