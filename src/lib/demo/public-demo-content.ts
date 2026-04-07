import type {
  PublicActivitySignalRecord,
  PublicChallengeRecord,
  PublicChallengeSolutionLinkRecord,
  PublicCompanyProfileRecord,
  PublicPlatformMetricsRecord,
  PublicSectorActivityRecord,
  PublicSectorRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";
import { sectorSeeds } from "@/domain/sectors";

type DemoSnapshot = {
  challengeLinks: PublicChallengeSolutionLinkRecord[];
  challenges: PublicChallengeRecord[];
  companies: PublicCompanyProfileRecord[];
  metrics: PublicPlatformMetricsRecord;
  sectorActivity: PublicSectorActivityRecord[];
  sectors: PublicSectorRecord[];
  signals: PublicActivitySignalRecord[];
  solutions: PublicSolutionRecord[];
};

type DemoCompanySeed = Omit<
  PublicCompanyProfileRecord,
  "publishedChallengeCount" | "publishedSolutionCount"
>;

type DemoChallengeSeed = Omit<PublicChallengeRecord, "linkedSolutionCount">;
type DemoSolutionSeed = Omit<PublicSolutionRecord, "linkedChallengeCount">;

const demoCompanies: readonly DemoCompanySeed[] = [
  {
    city: "Abu Dhabi",
    countryCode: "AE",
    description:
      "National energy and industrial operator publishing practical field and reliability challenges.",
    headquartersLabel: "Abu Dhabi, UAE",
    id: "demo-company-adnoc",
    logoPath: null,
    name: "ADNOC Group",
    slug: "adnoc-group",
    websiteUrl: "https://www.adnoc.ae",
  },
  {
    city: "Dubai",
    countryCode: "AE",
    description:
      "Operational healthcare network focused on patient flow, hospital capacity, and safe interoperability.",
    headquartersLabel: "Dubai, UAE",
    id: "demo-company-clinical",
    logoPath: null,
    name: "Clinical Flow Systems",
    slug: "clinical-flow-systems",
    websiteUrl: "https://www.clinicalflow.example",
  },
  {
    city: "Abu Dhabi",
    countryCode: "AE",
    description:
      "Aviation operations group working on turnaround, gate, and passenger-coordination tooling.",
    headquartersLabel: "Abu Dhabi, UAE",
    id: "demo-company-etihad",
    logoPath: null,
    name: "Etihad Aviation Systems",
    slug: "etihad-aviation-systems",
    websiteUrl: "https://www.etihad.com",
  },
  {
    city: "Sharjah",
    countryCode: "AE",
    description:
      "Regional logistics and customs-intelligence operator supporting port, route, and exception management.",
    headquartersLabel: "Sharjah, UAE",
    id: "demo-company-portflow",
    logoPath: null,
    name: "PortFlow Logistics",
    slug: "portflow-logistics",
    websiteUrl: "https://www.portflow.example",
  },
  {
    city: "Abu Dhabi",
    countryCode: "AE",
    description:
      "Utility modernization provider focused on outage prioritization and grid-resilience tooling.",
    headquartersLabel: "Abu Dhabi, UAE",
    id: "demo-company-gulfgrid",
    logoPath: null,
    name: "GulfGrid Utilities",
    slug: "gulfgrid-utilities",
    websiteUrl: "https://www.gulfgrid.example",
  },
  {
    city: "Riyadh",
    countryCode: "SA",
    description:
      "AI operations studio supporting regulated workflows across finance and shared enterprise services.",
    headquartersLabel: "Riyadh, Saudi Arabia",
    id: "demo-company-desertsignal",
    logoPath: null,
    name: "Desert Signal Labs",
    slug: "desert-signal-labs",
    websiteUrl: "https://www.desertsignal.example",
  },
  {
    city: "Dubai",
    countryCode: "AE",
    description:
      "Solar operations team focused on inspection, yield continuity, and predictive asset care.",
    headquartersLabel: "Dubai, UAE",
    id: "demo-company-solar",
    logoPath: null,
    name: "SunMesh Energy",
    slug: "sunmesh-energy",
    websiteUrl: "https://www.sunmesh.example",
  },
  {
    city: "Doha",
    countryCode: "QA",
    description:
      "Factory and industrial operations provider supporting reusable workforce and maintenance platforms.",
    headquartersLabel: "Doha, Qatar",
    id: "demo-company-industrial",
    logoPath: null,
    name: "Industrial Motion Works",
    slug: "industrial-motion-works",
    websiteUrl: "https://www.industrialmotion.example",
  },
];

const demoChallenges: readonly DemoChallengeSeed[] = [
  {
    anonymityMode: "anonymous",
    companyLogoPath: null,
    companyName: "Anonymous",
    companySlug: null,
    desiredOutcome:
      "Predict high-risk discharge and transfer congestion early enough to reassign capacity before peak hours.",
    geographyLabel: "UAE",
    id: "demo-challenge-bed-orchestration",
    problemStatement:
      "Hospital command teams lose time reconciling bed availability, transfer readiness, and discharge status across separate systems during peak demand.",
    publishedAt: "2026-04-06T09:00:00.000Z",
    sectorId: "healthcare",
    sectorName: "Healthcare",
    sectorSlug: "healthcare",
    slug: "hospital-bed-orchestration",
    status: "published",
    summary:
      "Bed-control teams need a shared operational view to reduce bottlenecks in admission, transfer, and discharge flow.",
    title: "Hospital Bed Orchestration",
  },
  {
    anonymityMode: "named",
    companyLogoPath: null,
    companyName: "ADNOC Group",
    companySlug: "adnoc-group",
    desiredOutcome:
      "Lower inspection cost while increasing the frequency and confidence of corrosion detection in offshore assets.",
    geographyLabel: "Global",
    id: "demo-challenge-pipeline",
    problemStatement:
      "Offshore integrity teams still depend on expensive manual inspection windows to identify subsea corrosion drift across high-risk pipe segments.",
    publishedAt: "2026-04-05T11:30:00.000Z",
    sectorId: "oil-gas",
    sectorName: "Oil & Gas",
    sectorSlug: "oil-gas",
    slug: "pipeline-corrosion-forecasting",
    status: "published",
    summary:
      "Integrity teams need earlier warning on subsea corrosion patterns before planned shutdown windows are locked.",
    title: "Pipeline Corrosion Forecasting",
  },
  {
    anonymityMode: "named",
    companyLogoPath: null,
    companyName: "Etihad Aviation Systems",
    companySlug: "etihad-aviation-systems",
    desiredOutcome:
      "Recover stand and crew delays fast enough to protect departure punctuality during connected-bank peaks.",
    geographyLabel: "Abu Dhabi, UAE",
    id: "demo-challenge-turnaround",
    problemStatement:
      "Ramp, cabin, fueling, and dispatch teams do not see one synchronized turn plan, so delay recovery decisions arrive too late at the gate.",
    publishedAt: "2026-04-03T13:15:00.000Z",
    sectorId: "aviation",
    sectorName: "Aviation",
    sectorSlug: "aviation",
    slug: "airport-stand-turnaround",
    status: "published",
    summary:
      "Ground operations need live turn sequencing and exception recovery for banked departures.",
    title: "Airport Stand Turnaround",
  },
  {
    anonymityMode: "anonymous",
    companyLogoPath: null,
    companyName: "Anonymous",
    companySlug: null,
    desiredOutcome:
      "Route customs-document exceptions to the right team before shipments miss service cutoffs.",
    geographyLabel: "GCC",
    id: "demo-challenge-customs",
    problemStatement:
      "Cross-border shipments accumulate avoidable dwell time when customs-document issues are discovered late and triaged manually across brokers and operations teams.",
    publishedAt: "2026-03-31T08:20:00.000Z",
    sectorId: "logistics-supply-chain",
    sectorName: "Logistics & Supply Chain",
    sectorSlug: "logistics-supply-chain",
    slug: "customs-document-exceptions",
    status: "published",
    summary:
      "Teams need faster exception detection and routing for customs-document discrepancies.",
    title: "Customs Document Exceptions",
  },
  {
    anonymityMode: "named",
    companyLogoPath: null,
    companyName: "GulfGrid Utilities",
    companySlug: "gulfgrid-utilities",
    desiredOutcome:
      "Prioritize restoration and dispatch decisions using one trustable view of customer, asset, and weather risk.",
    geographyLabel: "UAE",
    id: "demo-challenge-grid",
    problemStatement:
      "Outage control rooms combine weather inputs, asset condition, and customer-priority rules manually, which slows restoration sequencing during broad incidents.",
    publishedAt: "2026-03-26T07:40:00.000Z",
    sectorId: "energy-utilities",
    sectorName: "Energy & Utilities",
    sectorSlug: "energy-utilities",
    slug: "grid-outage-prioritization",
    status: "published",
    summary:
      "Dispatch teams need clearer restoration priority under outage pressure and changing weather conditions.",
    title: "Grid Outage Prioritization",
  },
  {
    anonymityMode: "named",
    companyLogoPath: null,
    companyName: "Desert Signal Labs",
    companySlug: "desert-signal-labs",
    desiredOutcome:
      "Shorten the time from alert to analyst-ready case package without increasing false positives or missed escalations.",
    geographyLabel: "Saudi Arabia",
    id: "demo-challenge-fraud",
    problemStatement:
      "Fraud and AML teams sift through fragmented alerts across channels and struggle to build consistent analyst handoffs for complex case clusters.",
    publishedAt: "2026-03-21T10:10:00.000Z",
    sectorId: "finance-banking",
    sectorName: "Finance & Banking",
    sectorSlug: "finance-banking",
    slug: "fraud-case-triage",
    status: "published",
    summary:
      "Analysts need faster triage of multi-signal fraud and AML alerts with clearer risk packaging.",
    title: "Fraud Case Triage",
  },
  {
    anonymityMode: "anonymous",
    companyLogoPath: null,
    companyName: "Anonymous",
    companySlug: null,
    desiredOutcome:
      "Reduce unplanned field visits by predicting panel, inverter, and inspection risk before output drops materially.",
    geographyLabel: "MENA",
    id: "demo-challenge-solar",
    problemStatement:
      "Solar operators still schedule inspection rounds by broad maintenance calendars instead of risk-weighted panel and inverter conditions across large fields.",
    publishedAt: "2026-03-18T09:45:00.000Z",
    sectorId: "solar-energy",
    sectorName: "Solar & Energy",
    sectorSlug: "solar-energy",
    slug: "solar-field-maintenance-forecasting",
    status: "published",
    summary:
      "Field teams need predictive inspection planning across panel, inverter, and site-condition signals.",
    title: "Solar Field Maintenance Forecasting",
  },
];

const demoSolutions: readonly DemoSolutionSeed[] = [
  {
    accessModel: "contact",
    companyId: "demo-company-clinical",
    companyLogoPath: null,
    companyName: "Clinical Flow Systems",
    companySlug: "clinical-flow-systems",
    coverageLabel: "UAE",
    id: "demo-solution-bed-command",
    offeringDescription:
      "Operational command center workflow that unifies bed readiness, discharge sequencing, and transfer escalation with role-based action boards.",
    publishedAt: "2026-04-06T12:20:00.000Z",
    sectorId: "healthcare",
    sectorName: "Healthcare",
    sectorSlug: "healthcare",
    slug: "bed-command-center",
    status: "published",
    summary:
      "Operational command center for admission, discharge, transfer, and real-time capacity control.",
    title: "Bed Command Center",
    voteCount: 38,
  },
  {
    accessModel: "free",
    companyId: "demo-company-adnoc",
    companyLogoPath: null,
    companyName: "ADNOC Group",
    companySlug: "adnoc-group",
    coverageLabel: "Global",
    id: "demo-solution-corrosion",
    offeringDescription:
      "Autonomous subsea inspection mapping with anomaly scoring and planner-ready repair prioritization.",
    publishedAt: "2026-04-05T14:00:00.000Z",
    sectorId: "oil-gas",
    sectorName: "Oil & Gas",
    sectorSlug: "oil-gas",
    slug: "subsea-corrosion-mapping",
    status: "published",
    summary:
      "Autonomous subsea inspection mapping for earlier corrosion detection and repair prioritization.",
    title: "Subsea Corrosion Mapping",
    voteCount: 54,
  },
  {
    accessModel: "paid",
    companyId: "demo-company-etihad",
    companyLogoPath: null,
    companyName: "Etihad Aviation Systems",
    companySlug: "etihad-aviation-systems",
    coverageLabel: "Middle East",
    id: "demo-solution-turnaround",
    offeringDescription:
      "Turnaround planner with crew, gate, fueling, and dispatch recovery orchestration across active flights.",
    publishedAt: "2026-04-02T15:10:00.000Z",
    sectorId: "aviation",
    sectorName: "Aviation",
    sectorSlug: "aviation",
    slug: "turnaround-crew-orchestrator",
    status: "published",
    summary:
      "Turnaround planner for stand readiness, crew coordination, and live delay recovery.",
    title: "Turnaround Crew Orchestrator",
    voteCount: 27,
  },
  {
    accessModel: "free",
    companyId: "demo-company-portflow",
    companyLogoPath: null,
    companyName: "PortFlow Logistics",
    companySlug: "portflow-logistics",
    coverageLabel: "GCC",
    id: "demo-solution-customs",
    offeringDescription:
      "Document classifier and operations queue that flags customs exceptions before departure cutoffs are missed.",
    publishedAt: "2026-03-31T11:45:00.000Z",
    sectorId: "logistics-supply-chain",
    sectorName: "Logistics & Supply Chain",
    sectorSlug: "logistics-supply-chain",
    slug: "customs-risk-classifier",
    status: "published",
    summary:
      "Exception classifier for customs-document mismatches and broker-ready operational routing.",
    title: "Customs Risk Classifier",
    voteCount: 22,
  },
  {
    accessModel: "paid",
    companyId: "demo-company-gulfgrid",
    companyLogoPath: null,
    companyName: "GulfGrid Utilities",
    companySlug: "gulfgrid-utilities",
    coverageLabel: "UAE",
    id: "demo-solution-outage",
    offeringDescription:
      "Dispatch decision layer combining outage, weather, asset criticality, and customer priority into one restoration queue.",
    publishedAt: "2026-03-27T09:35:00.000Z",
    sectorId: "energy-utilities",
    sectorName: "Energy & Utilities",
    sectorSlug: "energy-utilities",
    slug: "outage-priority-digital-twin",
    status: "published",
    summary:
      "Restoration-priority engine for outage control rooms under weather and customer-pressure scenarios.",
    title: "Outage Priority Digital Twin",
    voteCount: 31,
  },
  {
    accessModel: "paid",
    companyId: "demo-company-solar",
    companyLogoPath: null,
    companyName: "SunMesh Energy",
    companySlug: "sunmesh-energy",
    coverageLabel: "MENA",
    id: "demo-solution-solar",
    offeringDescription:
      "Drone-led inspection workflow with predictive maintenance scoring for panel, inverter, and thermal variance anomalies.",
    publishedAt: "2026-03-19T16:05:00.000Z",
    sectorId: "solar-energy",
    sectorName: "Solar & Energy",
    sectorSlug: "solar-energy",
    slug: "solar-drone-maintenance-suite",
    status: "published",
    summary:
      "Drone-led predictive inspection workflow for inverter, panel, and thermal anomaly detection.",
    title: "Solar Drone Maintenance Suite",
    voteCount: 19,
  },
  {
    accessModel: "contact",
    companyId: "demo-company-industrial",
    companyLogoPath: null,
    companyName: "Industrial Motion Works",
    companySlug: "industrial-motion-works",
    coverageLabel: "GCC",
    id: "demo-solution-shift",
    offeringDescription:
      "Reusable workforce and maintenance coordination layer for factories managing shift coverage, task queues, and exception handoffs.",
    publishedAt: "2026-03-16T13:25:00.000Z",
    sectorId: "manufacturing",
    sectorName: "Manufacturing",
    sectorSlug: "manufacturing",
    slug: "industrial-shift-assistant",
    status: "published",
    summary:
      "Reusable shift and maintenance coordination workspace for industrial operations teams.",
    title: "Industrial Shift Assistant",
    voteCount: 12,
  },
];

const demoLinks = [
  {
    challengeSlug: "hospital-bed-orchestration",
    solutionSlug: "bed-command-center",
  },
  {
    challengeSlug: "airport-stand-turnaround",
    solutionSlug: "bed-command-center",
  },
  {
    challengeSlug: "pipeline-corrosion-forecasting",
    solutionSlug: "subsea-corrosion-mapping",
  },
  {
    challengeSlug: "customs-document-exceptions",
    solutionSlug: "customs-risk-classifier",
  },
  {
    challengeSlug: "grid-outage-prioritization",
    solutionSlug: "outage-priority-digital-twin",
  },
  {
    challengeSlug: "solar-field-maintenance-forecasting",
    solutionSlug: "solar-drone-maintenance-suite",
  },
] as const;

const demoSignals: readonly PublicActivitySignalRecord[] = [
  {
    actorLabel: "Member",
    eventName: "solution_published",
    id: "demo-signal-1",
    occurredAt: "2026-04-06T12:25:00.000Z",
    resourceKind: "solution",
    resourceLabel: "Bed Command Center",
    route: "/solutions/bed-command-center",
    sectorName: "Healthcare",
  },
  {
    actorLabel: "Anonymous",
    eventName: "challenge_published",
    id: "demo-signal-2",
    occurredAt: "2026-04-06T09:05:00.000Z",
    resourceKind: "challenge",
    resourceLabel: "Hospital Bed Orchestration",
    route: "/challenges/hospital-bed-orchestration",
    sectorName: "Healthcare",
  },
  {
    actorLabel: "Member",
    eventName: "solution_published",
    id: "demo-signal-3",
    occurredAt: "2026-04-05T14:05:00.000Z",
    resourceKind: "solution",
    resourceLabel: "Subsea Corrosion Mapping",
    route: "/solutions/subsea-corrosion-mapping",
    sectorName: "Oil & Gas",
  },
  {
    actorLabel: "Member",
    eventName: "challenge_published",
    id: "demo-signal-4",
    occurredAt: "2026-04-03T13:20:00.000Z",
    resourceKind: "challenge",
    resourceLabel: "Airport Stand Turnaround",
    route: "/challenges/airport-stand-turnaround",
    sectorName: "Aviation",
  },
  {
    actorLabel: "Platform",
    eventName: "ai_discovery",
    id: "demo-signal-5",
    occurredAt: "2026-04-02T10:00:00.000Z",
    resourceKind: "platform",
    resourceLabel: "Scenario Discovery",
    route: "/ai",
    sectorName: "Finance & Banking",
  },
  {
    actorLabel: "Member",
    eventName: "solution_published",
    id: "demo-signal-6",
    occurredAt: "2026-03-31T11:50:00.000Z",
    resourceKind: "solution",
    resourceLabel: "Customs Risk Classifier",
    route: "/solutions/customs-risk-classifier",
    sectorName: "Logistics & Supply Chain",
  },
  {
    actorLabel: "Member",
    eventName: "challenge_published",
    id: "demo-signal-7",
    occurredAt: "2026-03-26T07:45:00.000Z",
    resourceKind: "challenge",
    resourceLabel: "Grid Outage Prioritization",
    route: "/challenges/grid-outage-prioritization",
    sectorName: "Energy & Utilities",
  },
  {
    actorLabel: "Member",
    eventName: "solution_published",
    id: "demo-signal-8",
    occurredAt: "2026-03-19T16:10:00.000Z",
    resourceKind: "solution",
    resourceLabel: "Solar Drone Maintenance Suite",
    route: "/solutions/solar-drone-maintenance-suite",
    sectorName: "Solar & Energy",
  },
];

function createDemoSectors(): PublicSectorRecord[] {
  return sectorSeeds.map((sector) => ({
    description: sector.description,
    displayOrder: sector.displayOrder,
    iconKey: sector.iconKey,
    id: sector.slug,
    name: sector.name,
    slug: sector.slug,
  }));
}

function findSectorName(slug: string) {
  return sectorSeeds.find((sector) => sector.slug === slug)?.name ?? slug;
}

export function createPublicDemoSnapshot(): DemoSnapshot {
  const sectors = createDemoSectors();
  const challengeIdBySlug = new Map(demoChallenges.map((challenge) => [challenge.slug, challenge.id]));
  const solutionIdBySlug = new Map(demoSolutions.map((solution) => [solution.slug, solution.id]));
  const challengeLinkCounts = new Map<string, number>();
  const solutionLinkCounts = new Map<string, number>();

  const challengeLinks = demoLinks.map((link, index) => {
    const challengeId = challengeIdBySlug.get(link.challengeSlug);
    const solutionId = solutionIdBySlug.get(link.solutionSlug);

    if (!challengeId || !solutionId) {
      throw new Error(`Demo link references an unknown record: ${link.challengeSlug} -> ${link.solutionSlug}`);
    }

    challengeLinkCounts.set(
      challengeId,
      (challengeLinkCounts.get(challengeId) ?? 0) + 1,
    );
    solutionLinkCounts.set(
      solutionId,
      (solutionLinkCounts.get(solutionId) ?? 0) + 1,
    );

    return {
      challengeId,
      createdAt: demoSignals[0]?.occurredAt ?? new Date().toISOString(),
      id: `demo-link-${index + 1}`,
      solutionId,
    } satisfies PublicChallengeSolutionLinkRecord;
  });

  const challenges = demoChallenges.map((challenge) => ({
    ...challenge,
    linkedSolutionCount: challengeLinkCounts.get(challenge.id) ?? 0,
  }));
  const solutions = demoSolutions.map((solution) => ({
    ...solution,
    linkedChallengeCount: solutionLinkCounts.get(solution.id) ?? 0,
  }));
  const companyCounts = new Map<
    string,
    {
      publishedChallengeCount: number;
      publishedSolutionCount: number;
    }
  >();

  demoCompanies.forEach((company) => {
    companyCounts.set(company.id, {
      publishedChallengeCount: 0,
      publishedSolutionCount: 0,
    });
  });

  challenges.forEach((challenge) => {
    if (challenge.companySlug) {
      const company = demoCompanies.find((item) => item.slug === challenge.companySlug);

      if (company) {
        const counts = companyCounts.get(company.id);

        if (counts) {
          counts.publishedChallengeCount += 1;
        }
      }
    }
  });

  solutions.forEach((solution) => {
    const counts = companyCounts.get(solution.companyId);

    if (counts) {
      counts.publishedSolutionCount += 1;
    }
  });

  const companies = demoCompanies.map((company) => {
    const counts = companyCounts.get(company.id) ?? {
      publishedChallengeCount: 0,
      publishedSolutionCount: 0,
    };

    return {
      ...company,
      publishedChallengeCount: counts.publishedChallengeCount,
      publishedSolutionCount: counts.publishedSolutionCount,
    };
  });

  const sectorActivity = sectors
    .map((sector) => {
      const sectorChallenges = challenges.filter((challenge) => challenge.sectorSlug === sector.slug);
      const sectorSolutions = solutions.filter((solution) => solution.sectorSlug === sector.slug);
      const timestamps = [
        ...sectorChallenges.map((challenge) => challenge.publishedAt),
        ...sectorSolutions.map((solution) => solution.publishedAt),
      ].filter(Boolean) as string[];

      return {
        latestPublicationAt:
          timestamps.sort((left, right) => right.localeCompare(left))[0] ?? null,
        publishedChallengeCount: sectorChallenges.length,
        publishedSolutionCount: sectorSolutions.length,
        sectorId: sector.id,
        sectorName: sector.name,
        sectorSlug: sector.slug,
      } satisfies PublicSectorActivityRecord;
    })
    .filter(
      (row) => row.publishedChallengeCount > 0 || row.publishedSolutionCount > 0,
    )
    .sort((left, right) => {
      const countDelta =
        right.publishedChallengeCount +
        right.publishedSolutionCount -
        (left.publishedChallengeCount + left.publishedSolutionCount);

      if (countDelta !== 0) {
        return countDelta;
      }

      return left.sectorName.localeCompare(right.sectorName);
    });

  const metrics = {
    latestActivityAt: demoSignals
      .map((signal) => signal.occurredAt)
      .sort((left, right) => right.localeCompare(left))[0] ?? null,
    publicCompanyCount: companies.length,
    publicSignalCount: demoSignals.length,
    publishedChallengeCount: challenges.length,
    publishedSolutionCount: solutions.length,
    visibleSectorCount: sectors.length,
  } satisfies PublicPlatformMetricsRecord;

  return {
    challengeLinks,
    challenges,
    companies,
    metrics,
    sectorActivity,
    sectors,
    signals: [...demoSignals].map((signal) => ({
      ...signal,
      sectorName: signal.sectorName ?? findSectorName(signal.sectorName ?? ""),
    })),
    solutions,
  };
}

export function getDemoChallengeBySlug(slug: string) {
  return createPublicDemoSnapshot().challenges.find((challenge) => challenge.slug === slug) ?? null;
}

export function getDemoSolutionBySlug(slug: string) {
  return createPublicDemoSnapshot().solutions.find((solution) => solution.slug === slug) ?? null;
}

