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

type DemoChallengeTopic = {
  anonymityMode?: PublicChallengeRecord["anonymityMode"];
  focus: string;
  geographyLabel: string;
  goal: string;
  slug: string;
  title: string;
};

type DemoSolutionTopic = {
  accessModel: PublicSolutionRecord["accessModel"];
  benefit: string;
  capability: string;
  challengeSlugs: string[];
  coverageLabel: string;
  slug: string;
  title: string;
  voteCount: number;
};

type DemoSectorDefinition = {
  challengeProblemLead: string;
  challengeTopics: readonly DemoChallengeTopic[];
  company: DemoCompanySeed;
  operatorLabel: string;
  sectorSlug: string;
  solutionTopics: readonly DemoSolutionTopic[];
};

const BASE_PUBLISHED_AT = Date.parse("2026-04-07T09:00:00.000Z");
const HOUR = 3_600_000;
const DAY = 86_400_000;

function atOffset(days: number, hourShift = 0) {
  return new Date(BASE_PUBLISHED_AT - days * DAY - hourShift * HOUR).toISOString();
}

function challengeTopic(
  slug: string,
  title: string,
  focus: string,
  goal: string,
  geographyLabel: string,
  anonymityMode: PublicChallengeRecord["anonymityMode"] = "named",
): DemoChallengeTopic {
  return {
    anonymityMode,
    focus,
    geographyLabel,
    goal,
    slug,
    title,
  };
}

function solutionTopic(
  slug: string,
  title: string,
  capability: string,
  benefit: string,
  coverageLabel: string,
  accessModel: PublicSolutionRecord["accessModel"],
  voteCount: number,
  challengeSlugs: string[],
): DemoSolutionTopic {
  return {
    accessModel,
    benefit,
    capability,
    challengeSlugs,
    coverageLabel,
    slug,
    title,
    voteCount,
  };
}

const sectorDefinitions: readonly DemoSectorDefinition[] = [
  {
    challengeProblemLead:
      "Field and reliability teams still reconcile alarms, inspections, and work orders manually",
    company: {
      city: "Abu Dhabi",
      countryCode: "AE",
      description:
        "National energy and industrial operator publishing practical field, integrity, and reliability challenges.",
      headquartersLabel: "Abu Dhabi, UAE",
      id: "demo-company-adnoc",
      logoPath: null,
      name: "ADNOC Group",
      slug: "adnoc-group",
      websiteUrl: "https://www.adnoc.ae",
    },
    operatorLabel: "Integrity and operations teams",
    sectorSlug: "oil-gas",
    challengeTopics: [
      challengeTopic(
        "pipeline-corrosion-forecasting",
        "Pipeline Corrosion Forecasting",
        "subsea corrosion drift across high-risk pipe segments",
        "lock repair windows before shutdown plans are finalized",
        "Global",
      ),
      challengeTopic(
        "flare-event-root-cause-linkage",
        "Flare Event Root-Cause Linkage",
        "flare upsets, historian signals, and maintenance notes",
        "separate repeat causes from one-off disturbances faster",
        "UAE",
      ),
      challengeTopic(
        "compressor-train-anomaly-ranking",
        "Compressor Train Anomaly Ranking",
        "compressor trips, vibration changes, and operating envelopes",
        "prioritize intervention before throughput drops materially",
        "Saudi Arabia",
      ),
      challengeTopic(
        "drilling-mud-loss-prediction",
        "Drilling Mud Loss Prediction",
        "mud loss indicators, well conditions, and prior incident history",
        "reduce non-productive time during active drilling campaigns",
        "MENA",
      ),
      challengeTopic(
        "turnaround-workpack-readiness",
        "Turnaround Workpack Readiness",
        "turnaround workpacks, contractor readiness, and permit dependencies",
        "surface blocked critical-path tasks before shutdown day one",
        "GCC",
      ),
      challengeTopic(
        "gas-lift-instability-detection",
        "Gas Lift Instability Detection",
        "gas-lift oscillation signals and well-level production behavior",
        "stabilize wells before operators have to throttle production",
        "Oman",
      ),
      challengeTopic(
        "refinery-heat-exchanger-fouling",
        "Refinery Heat Exchanger Fouling",
        "heat exchanger fouling signals, cleaning windows, and feed changes",
        "plan maintenance before energy losses compound",
        "UAE",
      ),
      challengeTopic(
        "produced-water-chemistry-drift",
        "Produced Water Chemistry Drift",
        "produced-water chemistry readings and separator performance changes",
        "detect treatment drift before disposal compliance is at risk",
        "Kuwait",
      ),
      challengeTopic(
        "permit-to-work-conflict-scanning",
        "Permit-to-Work Conflict Scanning",
        "permit schedules, isolation plans, and concurrent field activity",
        "spot hazardous overlaps before crews mobilize",
        "Qatar",
      ),
      challengeTopic(
        "tank-farm-emissions-watch",
        "Tank Farm Emissions Watch",
        "tank-farm activity, venting patterns, and emissions excursions",
        "focus environmental follow-up on the highest-risk sites",
        "UAE",
      ),
      challengeTopic(
        "downhole-pump-failure-forecast",
        "Downhole Pump Failure Forecast",
        "pump performance degradation and intervention history",
        "reduce repeat failures and emergency workovers",
        "Iraq",
      ),
      challengeTopic(
        "marine-crew-transfer-window",
        "Marine Crew Transfer Window Planning",
        "weather, vessel availability, and offshore crew-transfer timing",
        "protect maintenance access without losing productive days",
        "Global",
      ),
      challengeTopic(
        "lng-cargo-cooling-variance",
        "LNG Cargo Cooling Variance",
        "cargo temperature drift, ship schedules, and terminal constraints",
        "prevent avoidable cooling variance during loading operations",
        "Global",
      ),
      challengeTopic(
        "field-logbook-shift-handover",
        "Field Logbook Shift Handover",
        "shift logbooks, unresolved field observations, and asset handovers",
        "avoid repeat troubleshooting across rotations",
        "Saudi Arabia",
        "anonymous",
      ),
      challengeTopic(
        "valve-maintenance-criticality",
        "Valve Maintenance Criticality",
        "valve maintenance backlog, critical spares, and inspection history",
        "sequence valve work by operational risk instead of age alone",
        "UAE",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "subsea-corrosion-mapping",
        "Subsea Corrosion Mapping",
        "autonomous subsea inspection mapping with anomaly scoring",
        "detect corrosion earlier and hand planners a repair-ready priority queue",
        "Global",
        "free",
        54,
        ["pipeline-corrosion-forecasting", "downhole-pump-failure-forecast"],
      ),
      solutionTopic(
        "flare-root-cause-workbench",
        "Flare Root-Cause Workbench",
        "an operations workbench that correlates flare events with process and maintenance context",
        "cut investigation time for repeat flaring events",
        "GCC",
        "contact",
        33,
        ["flare-event-root-cause-linkage", "gas-lift-instability-detection"],
      ),
      solutionTopic(
        "shutdown-readiness-planner",
        "Shutdown Readiness Planner",
        "turnaround dependency planning for permits, crews, and workpacks",
        "expose blocked shutdown tasks before critical windows begin",
        "Middle East",
        "paid",
        41,
        ["turnaround-workpack-readiness", "permit-to-work-conflict-scanning"],
      ),
      solutionTopic(
        "tank-emissions-watchtower",
        "Tank Emissions Watchtower",
        "continuous tank-farm emissions surveillance with exception routing",
        "focus environmental action on the sites with the highest drift risk",
        "UAE",
        "contact",
        26,
        ["tank-farm-emissions-watch", "lng-cargo-cooling-variance"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Grid, water, and outage teams still combine operational context across too many disconnected systems",
    company: {
      city: "Abu Dhabi",
      countryCode: "AE",
      description:
        "Utility modernization provider focused on outage prioritization, control-room visibility, and grid-resilience tooling.",
      headquartersLabel: "Abu Dhabi, UAE",
      id: "demo-company-gulfgrid",
      logoPath: null,
      name: "GulfGrid Utilities",
      slug: "gulfgrid-utilities",
      websiteUrl: "https://www.gulfgrid.example",
    },
    operatorLabel: "Control-room and utility operations teams",
    sectorSlug: "energy-utilities",
    challengeTopics: [
      challengeTopic(
        "grid-outage-prioritization",
        "Grid Outage Prioritization",
        "outage, weather, customer-priority, and asset-risk signals",
        "sequence restoration work with one trusted view during broad incidents",
        "UAE",
      ),
      challengeTopic(
        "feeder-load-imbalance-alerting",
        "Feeder Load Imbalance Alerting",
        "feeder load variance, switching plans, and overload exceptions",
        "surface imbalance risks before local outages escalate",
        "Saudi Arabia",
      ),
      challengeTopic(
        "transformer-hotspot-forecasting",
        "Transformer Hotspot Forecasting",
        "transformer thermal behavior, load growth, and maintenance history",
        "schedule interventions before overheating becomes an outage event",
        "GCC",
      ),
      challengeTopic(
        "vegetation-risk-patrol-planning",
        "Vegetation Risk Patrol Planning",
        "vegetation growth, patrol routes, and line-risk context",
        "send field teams to the highest-risk corridors first",
        "Oman",
      ),
      challengeTopic(
        "demand-response-event-targeting",
        "Demand Response Event Targeting",
        "load spikes, customer segments, and dispatch readiness",
        "trigger demand-response actions only where they will actually relieve pressure",
        "UAE",
      ),
      challengeTopic(
        "water-network-leak-clustering",
        "Water Network Leak Clustering",
        "leak reports, pressure changes, and repair history",
        "group likely network failures before crews are dispatched",
        "Qatar",
      ),
      challengeTopic(
        "substation-switching-readiness",
        "Substation Switching Readiness",
        "switching plans, isolation dependencies, and crew readiness",
        "reduce switching delays during planned work windows",
        "UAE",
      ),
      challengeTopic(
        "outage-crew-staging",
        "Outage Crew Staging",
        "crew locations, spare parts, and outage hotspots",
        "stage resources before incident volume spikes",
        "Kuwait",
      ),
      challengeTopic(
        "renewable-curtailment-explainer",
        "Renewable Curtailment Explainer",
        "curtailment events, dispatch decisions, and network constraints",
        "explain why renewable output was limited and where to act next",
        "MENA",
      ),
      challengeTopic(
        "asset-work-order-backlog",
        "Asset Work Order Backlog Triage",
        "backlogged utility work orders and asset criticality",
        "pull forward the fixes most likely to avoid service-impacting incidents",
        "UAE",
      ),
      challengeTopic(
        "streetlight-fault-triage",
        "Streetlight Fault Triage",
        "streetlight faults, contractor queues, and citizen complaints",
        "reduce repeat truck rolls for the same corridor",
        "UAE",
        "anonymous",
      ),
      challengeTopic(
        "meter-tamper-investigation",
        "Meter Tamper Investigation",
        "tamper alerts, billing anomalies, and field inspection routes",
        "prioritize investigation capacity on the most credible tamper cases",
        "Saudi Arabia",
      ),
      challengeTopic(
        "storm-restoration-customer-updates",
        "Storm Restoration Customer Updates",
        "storm restoration milestones and customer communication triggers",
        "keep outage messaging aligned with live field progress",
        "Global",
      ),
      challengeTopic(
        "desalination-chemical-dose-optimization",
        "Desalination Chemical Dose Optimization",
        "chemical dosing behavior, fouling indicators, and output quality",
        "improve dosing consistency without risking plant throughput",
        "UAE",
      ),
      challengeTopic(
        "utility-call-center-spike-forecast",
        "Utility Call Center Spike Forecast",
        "service incidents, weather alerts, and incoming support volume",
        "prepare staffing before customer demand surges hit the queue",
        "GCC",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "outage-priority-digital-twin",
        "Outage Priority Digital Twin",
        "a dispatch layer that combines outage severity, customer priority, and weather context",
        "give restoration teams one operational queue instead of disconnected spreadsheets",
        "UAE",
        "paid",
        31,
        ["grid-outage-prioritization", "outage-crew-staging"],
      ),
      solutionTopic(
        "leak-cluster-command",
        "Leak Cluster Command",
        "network leak clustering and crew dispatch planning",
        "route field teams to likely root-cause clusters instead of isolated symptoms",
        "GCC",
        "contact",
        24,
        ["water-network-leak-clustering", "desalination-chemical-dose-optimization"],
      ),
      solutionTopic(
        "storm-restoration-broadcast-hub",
        "Storm Restoration Broadcast Hub",
        "restoration milestone tracking with customer-notification orchestration",
        "keep public communications synchronized with real field progress",
        "Global",
        "free",
        18,
        ["storm-restoration-customer-updates", "utility-call-center-spike-forecast"],
      ),
      solutionTopic(
        "substation-switching-console",
        "Substation Switching Console",
        "switching-plan coordination across assets, crews, and safety holds",
        "reduce avoidable switching delays during planned maintenance windows",
        "Middle East",
        "paid",
        29,
        ["substation-switching-readiness", "transformer-hotspot-forecasting"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Site delivery teams still track execution, safety, and commercial blockers across fragmented tools and contractor updates",
    company: {
      city: "Dubai",
      countryCode: "AE",
      description:
        "Built-environment coordination provider focused on capital-project delivery, safety, and materials visibility.",
      headquartersLabel: "Dubai, UAE",
      id: "demo-company-construct",
      logoPath: null,
      name: "Desert Build Systems",
      slug: "desert-build-systems",
      websiteUrl: "https://www.desertbuild.example",
    },
    operatorLabel: "Project controls and site-delivery teams",
    sectorSlug: "construction-infrastructure",
    challengeTopics: [
      challengeTopic(
        "concrete-pour-heat-risk",
        "Concrete Pour Heat Risk",
        "pour schedules, ambient heat, and curing readiness",
        "protect structural quality during high-temperature windows",
        "UAE",
      ),
      challengeTopic(
        "crane-utilization-conflict",
        "Crane Utilization Conflict",
        "crane bookings, lift plans, and competing work fronts",
        "avoid crane bottlenecks on critical path activities",
        "Saudi Arabia",
      ),
      challengeTopic(
        "subcontractor-permit-readiness",
        "Subcontractor Permit Readiness",
        "permit approvals, subcontractor mobilization, and safety dependencies",
        "prevent crews arriving before access is actually cleared",
        "Qatar",
      ),
      challengeTopic(
        "materials-shortage-early-warning",
        "Materials Shortage Early Warning",
        "materials consumption, supplier delays, and short-order requests",
        "surface supply risks before site teams lose productive shifts",
        "GCC",
      ),
      challengeTopic(
        "punch-list-closeout-sequencing",
        "Punch List Closeout Sequencing",
        "handover defects, trade dependencies, and closeout sequencing",
        "finish the most handover-critical items first",
        "UAE",
      ),
      challengeTopic(
        "worker-transport-roster-stability",
        "Worker Transport Roster Stability",
        "labor transport rosters, route timings, and shift attendance",
        "reduce labor loss caused by avoidable transport disruption",
        "UAE",
      ),
      challengeTopic(
        "site-safety-near-miss-triage",
        "Site Safety Near-Miss Triage",
        "near-miss reports, trade activity, and area-level risk patterns",
        "focus safety intervention on the conditions most likely to repeat",
        "MENA",
      ),
      challengeTopic(
        "bim-rfi-impact-mapping",
        "BIM and RFI Impact Mapping",
        "RFIs, design clashes, and downstream trade dependencies",
        "make design issues visible before they start knocking on schedule float",
        "Global",
      ),
      challengeTopic(
        "heavy-equipment-maintenance-window",
        "Heavy Equipment Maintenance Window",
        "equipment runtime, work fronts, and service dependencies",
        "schedule maintenance without stalling active production zones",
        "Saudi Arabia",
      ),
      challengeTopic(
        "precast-delivery-slotting",
        "Precast Delivery Slotting",
        "precast deliveries, crane windows, and laydown-space constraints",
        "keep delivery flow aligned with real install capacity",
        "UAE",
      ),
      challengeTopic(
        "utility-diversion-approval-tracking",
        "Utility Diversion Approval Tracking",
        "diversion approvals, agency feedback, and site sequencing",
        "stop permit and diversion delays from surprising field teams",
        "UAE",
      ),
      challengeTopic(
        "sandstorm-workday-planning",
        "Sandstorm Workday Planning",
        "sandstorm forecasts, lifting plans, and outdoor work exposure",
        "replan activities before weather causes unsafe downtime",
        "GCC",
        "anonymous",
      ),
      challengeTopic(
        "asphalt-quality-drift",
        "Asphalt Quality Drift",
        "asphalt mix performance, batch variance, and paving outcomes",
        "intervene before quality drift leads to rework",
        "Oman",
      ),
      challengeTopic(
        "tunnel-ventilation-sensor-anomaly",
        "Tunnel Ventilation Sensor Anomaly",
        "ventilation sensor drift, incident alerts, and maintenance records",
        "separate real ventilation risk from faulty instrumentation faster",
        "Qatar",
      ),
      challengeTopic(
        "handover-document-completeness",
        "Handover Document Completeness",
        "handover packs, inspection records, and closeout evidence",
        "ensure turnover packages are complete before client review begins",
        "UAE",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "site-delivery-control-tower",
        "Site Delivery Control Tower",
        "project-delivery coordination across permits, materials, and execution blockers",
        "help site leaders see what is actually ready to move today",
        "Middle East",
        "paid",
        34,
        ["subcontractor-permit-readiness", "materials-shortage-early-warning"],
      ),
      solutionTopic(
        "rfi-impact-mapper",
        "RFI Impact Mapper",
        "RFI and design-clash routing with downstream workfront impact visibility",
        "stop unresolved design issues from silently eroding schedule float",
        "Global",
        "contact",
        23,
        ["bim-rfi-impact-mapping", "utility-diversion-approval-tracking"],
      ),
      solutionTopic(
        "safety-near-miss-commander",
        "Safety Near-Miss Commander",
        "site-safety pattern analysis with focused intervention playbooks",
        "turn repeated near-miss data into action before incidents occur",
        "GCC",
        "free",
        19,
        ["site-safety-near-miss-triage", "sandstorm-workday-planning"],
      ),
      solutionTopic(
        "precast-flow-planner",
        "Precast Flow Planner",
        "delivery-slot coordination across laydown space, cranes, and install crews",
        "keep precast movement aligned with actual install readiness",
        "UAE",
        "paid",
        27,
        ["precast-delivery-slotting", "crane-utilization-conflict"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Clinical operations teams still patch together flow decisions across multiple systems and manual handoffs",
    company: {
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
    operatorLabel: "Hospital operations and command teams",
    sectorSlug: "healthcare",
    challengeTopics: [
      challengeTopic(
        "hospital-bed-orchestration",
        "Hospital Bed Orchestration",
        "bed availability, transfer readiness, and discharge sequencing",
        "reduce bottlenecks in admission, transfer, and discharge flow",
        "UAE",
        "anonymous",
      ),
      challengeTopic(
        "emergency-boarder-escalation",
        "Emergency Boarder Escalation",
        "ED boarders, specialty bed requests, and inpatient capacity pressure",
        "move the longest-waiting patients before corridor congestion worsens",
        "UAE",
      ),
      challengeTopic(
        "operating-room-recovery-sequencing",
        "Operating Room Recovery Sequencing",
        "OR overruns, PACU readiness, and same-day schedule recovery",
        "protect surgical throughput without overbooking recovery beds",
        "Saudi Arabia",
      ),
      challengeTopic(
        "lab-turnaround-bottleneck-watch",
        "Lab Turnaround Bottleneck Watch",
        "lab queue delays, specimen routing, and courier exceptions",
        "surface the delays most likely to affect patient discharge decisions",
        "GCC",
      ),
      challengeTopic(
        "imaging-no-show-backfill",
        "Imaging No-Show Backfill",
        "imaging no-shows, standby lists, and scanner utilization",
        "backfill missed slots before expensive imaging capacity is lost",
        "UAE",
      ),
      challengeTopic(
        "medication-stockout-signal",
        "Medication Stockout Signal",
        "pharmacy depletion signals, substitution risk, and ward demand",
        "intervene before high-risk medications run short",
        "Qatar",
      ),
      challengeTopic(
        "ambulance-handover-delay",
        "Ambulance Handover Delay",
        "ambulance arrivals, receiving-unit readiness, and ED offload timing",
        "reduce handover delays that keep ambulances stuck at hospital doors",
        "UAE",
      ),
      challengeTopic(
        "icu-deterioration-routing",
        "ICU Deterioration Routing",
        "critical-care deterioration alerts and escalation pathways",
        "route the most urgent cases to available senior review quickly",
        "Global",
      ),
      challengeTopic(
        "referral-authorization-lag",
        "Referral Authorization Lag",
        "authorization requests, missing clinical documents, and payer follow-up",
        "cut avoidable delay in specialist referrals and procedures",
        "Saudi Arabia",
      ),
      challengeTopic(
        "home-care-visit-clustering",
        "Home Care Visit Clustering",
        "community visits, clinician routing, and acuity changes",
        "build safer daily visit plans for home-care teams",
        "UAE",
      ),
      challengeTopic(
        "infection-isolation-capacity",
        "Infection Isolation Capacity",
        "isolation-room usage, infection status, and transfer needs",
        "avoid unnecessary bed blocks while keeping infection control safe",
        "GCC",
      ),
      challengeTopic(
        "dialysis-chair-utilization",
        "Dialysis Chair Utilization",
        "dialysis scheduling, transport delays, and same-day cancellations",
        "recover chair capacity without destabilizing treatment continuity",
        "UAE",
        "anonymous",
      ),
      challengeTopic(
        "staffing-float-pool-planning",
        "Staffing Float Pool Planning",
        "float pool demand, shift pressure, and unit-specific coverage gaps",
        "place flexible staffing where patient risk is rising fastest",
        "MENA",
      ),
      challengeTopic(
        "discharge-transport-readiness",
        "Discharge Transport Readiness",
        "transport booking, discharge paperwork, and family pickup uncertainty",
        "release medically ready patients earlier in the day",
        "UAE",
      ),
      challengeTopic(
        "prior-auth-document-assembly",
        "Prior Authorization Document Assembly",
        "clinical documentation gaps and prior-auth request packages",
        "improve first-pass approval rates for expensive procedures",
        "Saudi Arabia",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "bed-command-center",
        "Bed Command Center",
        "an operational command center for admission, discharge, transfer, and real-time capacity control",
        "reduce bed bottlenecks with role-based workflows and early congestion warnings",
        "UAE",
        "contact",
        38,
        ["hospital-bed-orchestration", "airport-stand-turnaround"],
      ),
      solutionTopic(
        "ed-flow-sentinel",
        "ED Flow Sentinel",
        "an emergency-flow workspace for boarders, offloads, and receiving-unit coordination",
        "shorten the handoff gap between incoming pressure and inpatient response",
        "GCC",
        "free",
        29,
        ["emergency-boarder-escalation", "ambulance-handover-delay"],
      ),
      solutionTopic(
        "referral-auth-workbench",
        "Referral Authorization Workbench",
        "payer-ready referral packaging with missing-document prompts and status routing",
        "reduce rework in referral and prior-authorization operations",
        "Middle East",
        "paid",
        21,
        ["referral-authorization-lag", "prior-auth-document-assembly"],
      ),
      solutionTopic(
        "icu-escalation-desk",
        "ICU Escalation Desk",
        "a deterioration routing console for critical-care escalation and transfer alignment",
        "focus senior review on the ICU cases that need intervention first",
        "Global",
        "contact",
        25,
        ["icu-deterioration-routing", "infection-isolation-capacity"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Banking operations teams still sort risk, compliance, and service exceptions manually across disconnected queues",
    company: {
      city: "Riyadh",
      countryCode: "SA",
      description:
        "AI operations studio supporting regulated workflows across finance, compliance, and shared enterprise services.",
      headquartersLabel: "Riyadh, Saudi Arabia",
      id: "demo-company-desertsignal",
      logoPath: null,
      name: "Desert Signal Labs",
      slug: "desert-signal-labs",
      websiteUrl: "https://www.desertsignal.example",
    },
    operatorLabel: "Fraud, compliance, and service-operations teams",
    sectorSlug: "finance-banking",
    challengeTopics: [
      challengeTopic(
        "fraud-case-triage",
        "Fraud Case Triage",
        "multi-signal fraud and AML alerts with fragmented analyst handoffs",
        "package higher-risk cases faster without increasing false positives",
        "Saudi Arabia",
      ),
      challengeTopic(
        "corporate-kyc-refresh-priority",
        "Corporate KYC Refresh Priority",
        "expiring KYC records, account risk, and client outreach readiness",
        "focus refresh effort on the entities most likely to breach policy windows",
        "GCC",
      ),
      challengeTopic(
        "chargeback-evidence-assembly",
        "Chargeback Evidence Assembly",
        "chargeback disputes, missing evidence, and merchant follow-up",
        "raise first-pass dispute win rates without growing manual effort",
        "UAE",
      ),
      challengeTopic(
        "sanctions-alert-deduplication",
        "Sanctions Alert Deduplication",
        "duplicate sanctions alerts and fragmented review notes",
        "reduce repetitive analyst work on the same party matches",
        "Global",
      ),
      challengeTopic(
        "sme-loan-document-missingness",
        "SME Loan Document Missingness",
        "credit applications, missing documents, and underwriting delay patterns",
        "keep viable SME deals moving before customers drop out",
        "Saudi Arabia",
      ),
      challengeTopic(
        "treasury-liquidity-exception-watch",
        "Treasury Liquidity Exception Watch",
        "liquidity exceptions, funding alerts, and cut-off risk",
        "surface treasury issues before end-of-day funding pressure escalates",
        "GCC",
      ),
      challengeTopic(
        "branch-cash-rebalancing",
        "Branch Cash Rebalancing",
        "branch cash demand, armored-car plans, and depletion risk",
        "move liquidity where branch demand is likely to spike next",
        "UAE",
      ),
      challengeTopic(
        "card-dispute-call-routing",
        "Card Dispute Call Routing",
        "card disputes, intent signals, and service routing",
        "shorten customer wait time on complex dispute cases",
        "Qatar",
      ),
      challengeTopic(
        "merchant-onboarding-dropoff",
        "Merchant Onboarding Drop-Off",
        "merchant onboarding friction, incomplete steps, and review bottlenecks",
        "save more qualified merchants before onboarding stalls out",
        "MENA",
      ),
      challengeTopic(
        "suspicious-login-step-up-targeting",
        "Suspicious Login Step-Up Targeting",
        "login anomalies, behavioral risk, and customer friction tradeoffs",
        "step up the right sessions without over-challenging safe customers",
        "Global",
      ),
      challengeTopic(
        "collections-promise-to-pay-risk",
        "Collections Promise-to-Pay Risk",
        "repayment promises, account behavior, and follow-up timing",
        "prioritize collections effort where missed promises are most likely",
        "UAE",
      ),
      challengeTopic(
        "payment-repair-queue-priority",
        "Payment Repair Queue Priority",
        "payment repair exceptions, SLA risk, and downstream value impact",
        "clear the payment queue in the order that protects client experience best",
        "Global",
        "anonymous",
      ),
      challengeTopic(
        "atm-cashout-anomaly-detection",
        "ATM Cash-Out Anomaly Detection",
        "ATM withdrawal anomalies and fleet-level fraud patterns",
        "distinguish credible cash-out risk from normal regional behavior",
        "Saudi Arabia",
      ),
      challengeTopic(
        "remittance-compliance-review",
        "Remittance Compliance Review",
        "remittance exceptions, sanctions checks, and manual escalation routes",
        "speed up safe remittance approvals without weakening controls",
        "UAE",
      ),
      challengeTopic(
        "complaint-root-cause-clustering",
        "Complaint Root-Cause Clustering",
        "customer complaints, service defects, and recurring operational causes",
        "spot repeat service failures before they turn into regulatory issues",
        "GCC",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "fraud-analyst-workbench",
        "Fraud Analyst Workbench",
        "a case-packaging workspace that brings fraud, AML, and channel signals into one analyst view",
        "help analysts move from alert review to case action faster",
        "Middle East",
        "paid",
        46,
        ["fraud-case-triage", "payment-repair-queue-priority"],
      ),
      solutionTopic(
        "sanctions-alert-resolver",
        "Sanctions Alert Resolver",
        "deduplicated sanctions-review queues with linked evidence and prior decisions",
        "reduce repetitive sanctions work without hiding real escalations",
        "Global",
        "contact",
        35,
        ["sanctions-alert-deduplication", "remittance-compliance-review"],
      ),
      solutionTopic(
        "merchant-onboarding-cockpit",
        "Merchant Onboarding Cockpit",
        "merchant-review orchestration across documents, risk holds, and handoffs",
        "keep qualified merchants progressing through onboarding",
        "GCC",
        "free",
        22,
        ["merchant-onboarding-dropoff", "sme-loan-document-missingness"],
      ),
      solutionTopic(
        "collections-risk-router",
        "Collections Risk Router",
        "priority routing for promises to pay, contact timing, and repayment risk",
        "focus collection effort where the expected recovery value is highest",
        "UAE",
        "contact",
        19,
        ["collections-promise-to-pay-risk", "branch-cash-rebalancing"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Cross-border logistics teams still chase exceptions, routing changes, and document gaps across too many handoffs",
    company: {
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
    operatorLabel: "Port, customs, and route-operations teams",
    sectorSlug: "logistics-supply-chain",
    challengeTopics: [
      challengeTopic(
        "customs-document-exceptions",
        "Customs Document Exceptions",
        "customs-document mismatches, broker handoffs, and shipment cutoffs",
        "route discrepancies before cargo misses departure windows",
        "GCC",
        "anonymous",
      ),
      challengeTopic(
        "cold-chain-temperature-excursion",
        "Cold Chain Temperature Excursion",
        "temperature excursions, sensor drift, and recovery actions",
        "protect sensitive cargo before quality claims rise",
        "Global",
      ),
      challengeTopic(
        "berth-window-slip-forecast",
        "Berth Window Slip Forecast",
        "berth schedules, vessel readiness, and terminal congestion",
        "warn planners before berth changes cascade into route delays",
        "UAE",
      ),
      challengeTopic(
        "linehaul-delay-root-cause",
        "Linehaul Delay Root Cause",
        "linehaul delays, checkpoint events, and route disruptions",
        "separate structural delay causes from day-to-day noise",
        "Saudi Arabia",
      ),
      challengeTopic(
        "warehouse-slotting-rebalance",
        "Warehouse Slotting Rebalance",
        "slotting decisions, demand shifts, and picker travel time",
        "rebalance storage before throughput falls",
        "UAE",
      ),
      challengeTopic(
        "returns-reason-normalization",
        "Returns Reason Normalization",
        "returns codes, fulfillment defects, and customer notes",
        "see repeat operational return causes sooner",
        "MENA",
      ),
      challengeTopic(
        "proof-of-delivery-mismatch",
        "Proof of Delivery Mismatch",
        "proof-of-delivery exceptions, signatures, and dispute triggers",
        "resolve delivery disputes before they become write-offs",
        "UAE",
      ),
      challengeTopic(
        "fleet-fuel-anomaly-watch",
        "Fleet Fuel Anomaly Watch",
        "fleet fuel spend, route variance, and refill behavior",
        "spot suspicious or wasteful fuel patterns faster",
        "GCC",
      ),
      challengeTopic(
        "route-capacity-reallocation",
        "Route Capacity Reallocation",
        "route capacity shifts, demand spikes, and hub constraints",
        "move capacity before service-level failures begin",
        "Global",
      ),
      challengeTopic(
        "crossdock-priority-unload",
        "Crossdock Priority Unload",
        "crossdock arrivals, unload windows, and downstream cutoffs",
        "unload the shipments that protect service commitments first",
        "UAE",
      ),
      challengeTopic(
        "dangerous-goods-document-validation",
        "Dangerous Goods Document Validation",
        "dangerous-goods paperwork and regulatory handoff completeness",
        "prevent compliance defects before cargo reaches the gate",
        "Global",
      ),
      challengeTopic(
        "container-demurrage-risk",
        "Container Demurrage Risk",
        "container dwell time, broker delays, and demurrage exposure",
        "intervene before avoidable demurrage charges accumulate",
        "Qatar",
      ),
      challengeTopic(
        "last-mile-failed-delivery-retry",
        "Last-Mile Failed Delivery Retry",
        "failed deliveries, recipient patterns, and driver replanning",
        "improve second-attempt success without inflating route costs",
        "Saudi Arabia",
      ),
      challengeTopic(
        "broker-handover-completeness",
        "Broker Handover Completeness",
        "broker handovers, document packages, and customs-response lag",
        "reduce the time shipments spend waiting for the next actor",
        "GCC",
      ),
      challengeTopic(
        "commerce-cutoff-forecast",
        "Commerce Cutoff Forecast",
        "order cutoffs, wave planning, and linehaul departure readiness",
        "protect promised delivery dates during volume spikes",
        "UAE",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "customs-risk-classifier",
        "Customs Risk Classifier",
        "a document-classification and queue-routing layer for customs and broker exceptions",
        "surface the shipments most likely to miss service cutoffs",
        "GCC",
        "free",
        22,
        ["customs-document-exceptions", "broker-handover-completeness"],
      ),
      solutionTopic(
        "cold-chain-watchtower",
        "Cold Chain Watchtower",
        "a temperature-excursion workspace across routes, alerts, and recovery actions",
        "reduce spoilage by escalating the most credible cold-chain risks first",
        "Global",
        "paid",
        30,
        ["cold-chain-temperature-excursion", "route-capacity-reallocation"],
      ),
      solutionTopic(
        "berth-window-planner",
        "Berth Window Planner",
        "berth and terminal planning that links vessel readiness to downstream route commitments",
        "warn teams before berth slippage propagates into wider disruption",
        "Middle East",
        "contact",
        17,
        ["berth-window-slip-forecast", "container-demurrage-risk"],
      ),
      solutionTopic(
        "last-mile-retry-engine",
        "Last-Mile Retry Engine",
        "retry planning for failed deliveries using recipient patterns and route conditions",
        "improve second-attempt success while protecting route efficiency",
        "Saudi Arabia",
        "contact",
        21,
        ["last-mile-failed-delivery-retry", "proof-of-delivery-mismatch"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Factory operations still juggle quality, maintenance, and workforce issues across separate systems and manual escalations",
    company: {
      city: "Doha",
      countryCode: "QA",
      description:
        "Industrial operations provider supporting reusable workforce, maintenance, and production platforms.",
      headquartersLabel: "Doha, Qatar",
      id: "demo-company-industrial",
      logoPath: null,
      name: "Industrial Motion Works",
      slug: "industrial-motion-works",
      websiteUrl: "https://www.industrialmotion.example",
    },
    operatorLabel: "Plant operations and production teams",
    sectorSlug: "manufacturing",
    challengeTopics: [
      challengeTopic(
        "shift-coverage-exceptions",
        "Shift Coverage Exceptions",
        "shift coverage gaps, absenteeism, and production risk",
        "protect line output when staffing conditions change late",
        "Qatar",
      ),
      challengeTopic(
        "machine-changeover-readiness",
        "Machine Changeover Readiness",
        "changeover plans, tooling readiness, and order-mix pressure",
        "shorten changeover delays on constrained lines",
        "GCC",
      ),
      challengeTopic(
        "scrap-root-cause-clustering",
        "Scrap Root-Cause Clustering",
        "scrap events, operator notes, and process conditions",
        "see repeat quality-loss patterns before yield slips further",
        "UAE",
      ),
      challengeTopic(
        "spare-parts-shortage-forecast",
        "Spare Parts Shortage Forecast",
        "critical spares, consumption trends, and maintenance demand",
        "avoid downtime caused by preventable shortages",
        "Saudi Arabia",
      ),
      challengeTopic(
        "predictive-lubrication-scheduling",
        "Predictive Lubrication Scheduling",
        "lubrication intervals, machine wear, and utilization shifts",
        "service machines before lubrication drift becomes downtime",
        "Global",
      ),
      challengeTopic(
        "line-balancing-order-mix",
        "Line Balancing by Order Mix",
        "line balance, order mix, and station-level bottlenecks",
        "protect throughput when product mix changes rapidly",
        "Qatar",
      ),
      challengeTopic(
        "quality-escape-containment",
        "Quality Escape Containment",
        "quality escapes, shipment timing, and containment readiness",
        "isolate affected batches before defects spread downstream",
        "GCC",
      ),
      challengeTopic(
        "utility-consumption-anomaly",
        "Utility Consumption Anomaly",
        "utility usage drift, process states, and equipment behavior",
        "catch energy and water anomalies before they inflate production cost",
        "UAE",
      ),
      challengeTopic(
        "vendor-quality-hold-priority",
        "Vendor Quality Hold Priority",
        "incoming quality holds, supplier history, and line dependency",
        "clear the holds that threaten production first",
        "Saudi Arabia",
      ),
      challengeTopic(
        "maintenance-planner-backlog",
        "Maintenance Planner Backlog",
        "maintenance backlog, risk criticality, and available labor",
        "sequence work orders in the order that protects uptime best",
        "GCC",
      ),
      challengeTopic(
        "worker-safety-heat-exposure",
        "Worker Safety Heat Exposure",
        "heat exposure risk, shift tasks, and workforce availability",
        "replan the hottest work windows before safety incidents rise",
        "MENA",
        "anonymous",
      ),
      challengeTopic(
        "tool-calibration-expiry-watch",
        "Tool Calibration Expiry Watch",
        "tool calibration expiries and line-side inspection readiness",
        "avoid measurement risk from overdue calibration",
        "UAE",
      ),
      challengeTopic(
        "oee-loss-attribution",
        "OEE Loss Attribution",
        "availability, performance, and quality losses across mixed lines",
        "separate the dominant causes of OEE erosion faster",
        "Global",
      ),
      challengeTopic(
        "packaging-rework-detection",
        "Packaging Rework Detection",
        "packaging defects, rework signals, and shipment urgency",
        "spot repeat packaging failures before finished goods are delayed",
        "Qatar",
      ),
      challengeTopic(
        "intralogistics-forklift-demand",
        "Intralogistics Forklift Demand",
        "forklift demand, route conflicts, and internal material flow",
        "align material movement with changing production demand",
        "UAE",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "industrial-shift-assistant",
        "Industrial Shift Assistant",
        "a workforce and maintenance coordination layer for shift coverage, task queues, and handoffs",
        "keep plant execution stable when labor and maintenance demand shift quickly",
        "GCC",
        "contact",
        12,
        ["shift-coverage-exceptions", "maintenance-planner-backlog"],
      ),
      solutionTopic(
        "changeover-readiness-board",
        "Changeover Readiness Board",
        "changeover planning across tooling, crew readiness, and order sequence",
        "shorten setup delays on constrained production lines",
        "Middle East",
        "paid",
        18,
        ["machine-changeover-readiness", "line-balancing-order-mix"],
      ),
      solutionTopic(
        "scrap-cause-explorer",
        "Scrap Cause Explorer",
        "scrap pattern analysis linked to process conditions and operator notes",
        "surface repeat yield-loss causes before they become normalized",
        "Global",
        "free",
        20,
        ["scrap-root-cause-clustering", "quality-escape-containment"],
      ),
      solutionTopic(
        "maintenance-backlog-optimizer",
        "Maintenance Backlog Optimizer",
        "risk-weighted work-order sequencing for constrained maintenance teams",
        "put scarce maintenance effort where it protects uptime most",
        "UAE",
        "contact",
        16,
        ["spare-parts-shortage-forecast", "predictive-lubrication-scheduling"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Platform and security teams still route incidents, delivery risk, and support load across disconnected tools",
    company: {
      city: "Dubai",
      countryCode: "AE",
      description:
        "Technology operations provider supporting cloud, security, AI, and platform reliability workflows.",
      headquartersLabel: "Dubai, UAE",
      id: "demo-company-gulfplatform",
      logoPath: null,
      name: "Gulf Platform Labs",
      slug: "gulf-platform-labs",
      websiteUrl: "https://www.gulfplatform.example",
    },
    operatorLabel: "Platform, security, and support teams",
    sectorSlug: "technology",
    challengeTopics: [
      challengeTopic(
        "cloud-cost-anomaly-attribution",
        "Cloud Cost Anomaly Attribution",
        "cloud cost spikes, workload changes, and owner accountability",
        "separate real cost regressions from intentional scaling",
        "Global",
      ),
      challengeTopic(
        "incident-handoff-readiness",
        "Incident Handoff Readiness",
        "incident updates, ownership gaps, and shift handovers",
        "keep active incidents from losing context between responders",
        "UAE",
      ),
      challengeTopic(
        "access-review-exception-routing",
        "Access Review Exception Routing",
        "access review exceptions, app ownership, and unresolved approvals",
        "close risky review gaps before audit windows expire",
        "GCC",
      ),
      challengeTopic(
        "support-ticket-duplicate-clustering",
        "Support Ticket Duplicate Clustering",
        "duplicate support tickets and repeat issue patterns",
        "collapse redundant work before queues balloon",
        "Global",
      ),
      challengeTopic(
        "release-risk-flagging",
        "Release Risk Flagging",
        "release candidate changes, incident history, and deployment pressure",
        "spot risky releases before they reach production",
        "UAE",
      ),
      challengeTopic(
        "api-latency-root-cause-triage",
        "API Latency Root-Cause Triage",
        "latency spikes, dependency drift, and customer-facing degradation",
        "triage the causes that threaten product experience first",
        "Saudi Arabia",
      ),
      challengeTopic(
        "vulnerability-remediation-priority",
        "Vulnerability Remediation Priority",
        "security findings, exploitability, and service criticality",
        "focus remediation on the issues that matter most operationally",
        "Global",
      ),
      challengeTopic(
        "data-pipeline-failure-forecast",
        "Data Pipeline Failure Forecast",
        "pipeline drift, schedule misses, and downstream reporting impact",
        "warn operators before data delivery failures cascade",
        "UAE",
      ),
      challengeTopic(
        "contract-renewal-support-volume",
        "Contract Renewal Support Volume",
        "renewal windows, support demand, and customer health signals",
        "prepare customer teams before renewal load peaks",
        "GCC",
      ),
      challengeTopic(
        "ai-prompt-ops-evaluation-queue",
        "AI Prompt Ops Evaluation Queue",
        "prompt regressions, eval debt, and release pressure",
        "review the model changes most likely to degrade production quality",
        "Global",
      ),
      challengeTopic(
        "device-fleet-patch-staleness",
        "Device Fleet Patch Staleness",
        "device patch lag, business criticality, and compliance risk",
        "target the most exposed fleet segments first",
        "UAE",
      ),
      challengeTopic(
        "soc-alert-signal-compression",
        "SOC Alert Signal Compression",
        "security alerts, repeated detections, and analyst fatigue",
        "compress noisy alert streams without hiding real incidents",
        "Global",
        "anonymous",
      ),
      challengeTopic(
        "customer-onboarding-task-drift",
        "Customer Onboarding Task Drift",
        "onboarding tasks, owner changes, and unresolved dependencies",
        "stop implementation projects from stalling silently",
        "Saudi Arabia",
      ),
      challengeTopic(
        "identity-provisioning-reconciliation",
        "Identity Provisioning Reconciliation",
        "provisioning mismatches, joiner-mover-leaver events, and app access gaps",
        "spot broken identity automation before users are blocked or over-provisioned",
        "UAE",
      ),
      challengeTopic(
        "feature-flag-cleanup-readiness",
        "Feature Flag Cleanup Readiness",
        "stale flags, rollout state, and technical-debt accumulation",
        "remove dead flags before they create release risk",
        "Global",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "cloud-spend-anomaly-desk",
        "Cloud Spend Anomaly Desk",
        "cost anomaly triage linked to ownership, deploys, and workload changes",
        "help platform teams distinguish real regressions from expected growth",
        "Global",
        "contact",
        28,
        ["cloud-cost-anomaly-attribution", "data-pipeline-failure-forecast"],
      ),
      solutionTopic(
        "incident-handoff-commander",
        "Incident Handoff Commander",
        "incident coordination that preserves ownership, state, and next actions across shifts",
        "keep active incidents from losing context during escalation",
        "Middle East",
        "paid",
        32,
        ["incident-handoff-readiness", "api-latency-root-cause-triage"],
      ),
      solutionTopic(
        "soc-alert-compressor",
        "SOC Alert Compressor",
        "noise-reduction and pattern-grouping for repeated security detections",
        "reduce analyst fatigue while preserving real incident visibility",
        "Global",
        "free",
        26,
        ["soc-alert-signal-compression", "vulnerability-remediation-priority"],
      ),
      solutionTopic(
        "release-risk-sentinel",
        "Release Risk Sentinel",
        "release-readiness scoring across incidents, dependencies, and eval drift",
        "catch the releases most likely to create production pain",
        "UAE",
        "contact",
        17,
        ["release-risk-flagging", "ai-prompt-ops-evaluation-queue"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Hospitality operations teams still coordinate guests, rooms, and service exceptions across fragmented operational systems",
    company: {
      city: "Dubai",
      countryCode: "AE",
      description:
        "Guest-experience operations provider supporting hotels, resorts, and service-delivery teams.",
      headquartersLabel: "Dubai, UAE",
      id: "demo-company-oasis",
      logoPath: null,
      name: "Oasis Guest Systems",
      slug: "oasis-guest-systems",
      websiteUrl: "https://www.oasisguest.example",
    },
    operatorLabel: "Hotel and resort operations teams",
    sectorSlug: "tourism-hospitality",
    challengeTopics: [
      challengeTopic(
        "hotel-overbooking-recovery",
        "Hotel Overbooking Recovery",
        "overbooked nights, guest priorities, and alternate-room availability",
        "protect guest experience when occupancy plans break",
        "UAE",
      ),
      challengeTopic(
        "housekeeping-turn-readiness",
        "Housekeeping Turn Readiness",
        "room status changes, housekeeping workload, and check-in pressure",
        "release the right rooms first during peak arrival windows",
        "GCC",
      ),
      challengeTopic(
        "guest-complaint-theme-clustering",
        "Guest Complaint Theme Clustering",
        "complaint channels, service defects, and repeat guest pain points",
        "see recurring service failures before reputation suffers",
        "Global",
      ),
      challengeTopic(
        "resort-energy-waste-alerts",
        "Resort Energy Waste Alerts",
        "energy waste, occupancy patterns, and service-area exceptions",
        "cut avoidable waste without affecting guest comfort",
        "UAE",
      ),
      challengeTopic(
        "airport-transfer-no-show-forecast",
        "Airport Transfer No-Show Forecast",
        "airport transfer bookings, flight drift, and guest behavior patterns",
        "reassign transport capacity before pickups are missed",
        "Middle East",
      ),
      challengeTopic(
        "banquet-staffing-coverage",
        "Banquet Staffing Coverage",
        "event staffing, service standards, and last-minute changes",
        "staff banquet service without overpaying for surge labor",
        "Qatar",
      ),
      challengeTopic(
        "minibar-restock-priority",
        "Minibar Restock Priority",
        "minibar consumption, room turnover, and service rounds",
        "restock the rooms most likely to create guest dissatisfaction first",
        "UAE",
      ),
      challengeTopic(
        "loyalty-redemption-fraud",
        "Loyalty Redemption Fraud",
        "loyalty redemptions, suspicious patterns, and account protection",
        "stop abusive redemptions without penalizing loyal guests",
        "Global",
      ),
      challengeTopic(
        "room-maintenance-outage-planning",
        "Room Maintenance Outage Planning",
        "room maintenance needs, booking pressure, and inventory loss",
        "take rooms offline in a way that protects revenue and service",
        "UAE",
      ),
      challengeTopic(
        "kitchen-waste-pattern-detection",
        "Kitchen Waste Pattern Detection",
        "kitchen waste, menu mix, and prep behavior",
        "see where food waste is climbing before margins erode",
        "GCC",
      ),
      challengeTopic(
        "multilingual-service-routing",
        "Multilingual Service Routing",
        "guest requests, language needs, and service team availability",
        "route guest issues to the right staff the first time",
        "Global",
      ),
      challengeTopic(
        "spa-appointment-fill-rate",
        "Spa Appointment Fill Rate",
        "spa booking gaps, guest preferences, and therapist utilization",
        "recover appointment revenue without over-discounting",
        "UAE",
        "anonymous",
      ),
      challengeTopic(
        "weather-disruption-guest-messaging",
        "Weather Disruption Guest Messaging",
        "weather disruptions, itinerary changes, and guest communication timing",
        "keep guests informed before frustration spikes",
        "Global",
      ),
      challengeTopic(
        "concierge-request-priority",
        "Concierge Request Priority",
        "concierge demand, VIP requests, and service tradeoffs",
        "prioritize requests in a way that protects premium experiences",
        "UAE",
      ),
      challengeTopic(
        "occupancy-forecast-explainability",
        "Occupancy Forecast Explainability",
        "occupancy forecasts, demand drivers, and pricing decisions",
        "show operators why demand is moving before they change inventory or rates",
        "GCC",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "overbooking-recovery-desk",
        "Overbooking Recovery Desk",
        "guest-recovery orchestration across room inventory, loyalty tier, and alternate options",
        "protect guest experience when bookings outstrip available rooms",
        "Middle East",
        "paid",
        28,
        ["hotel-overbooking-recovery", "room-maintenance-outage-planning"],
      ),
      solutionTopic(
        "housekeeping-flow-board",
        "Housekeeping Flow Board",
        "room-turn coordination linked to arrivals, departures, and service capacity",
        "release the right rooms before check-in queues build",
        "UAE",
        "free",
        24,
        ["housekeeping-turn-readiness", "minibar-restock-priority"],
      ),
      solutionTopic(
        "guest-voice-cluster-engine",
        "Guest Voice Cluster Engine",
        "complaint theme detection across surveys, calls, and messaging",
        "surface repeat service failures before they affect retention",
        "Global",
        "contact",
        20,
        ["guest-complaint-theme-clustering", "multilingual-service-routing"],
      ),
      solutionTopic(
        "service-routing-concierge",
        "Service Routing Concierge",
        "request routing that balances language fit, urgency, and VIP handling",
        "send guest requests to the team most likely to resolve them quickly",
        "GCC",
        "contact",
        18,
        ["concierge-request-priority", "weather-disruption-guest-messaging"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Education operators still manage student risk, scheduling, and campus operations across disconnected systems and teams",
    company: {
      city: "Doha",
      countryCode: "QA",
      description:
        "Education operations provider supporting institutions with student-success, scheduling, and campus-service workflows.",
      headquartersLabel: "Doha, Qatar",
      id: "demo-company-campusflow",
      logoPath: null,
      name: "Campus Flow Arabia",
      slug: "campus-flow-arabia",
      websiteUrl: "https://www.campusflow.example",
    },
    operatorLabel: "Academic operations and student-success teams",
    sectorSlug: "education",
    challengeTopics: [
      challengeTopic(
        "student-at-risk-intervention-priority",
        "Student At-Risk Intervention Priority",
        "student risk indicators, attendance drift, and advising capacity",
        "focus intervention on the learners most likely to disengage",
        "UAE",
      ),
      challengeTopic(
        "timetable-conflict-resolution",
        "Timetable Conflict Resolution",
        "timetable clashes, room pressure, and faculty constraints",
        "resolve scheduling conflicts before term launch",
        "Qatar",
      ),
      challengeTopic(
        "admissions-document-missingness",
        "Admissions Document Missingness",
        "incomplete applications, document gaps, and review bottlenecks",
        "help qualified applicants finish before deadlines pass",
        "GCC",
      ),
      challengeTopic(
        "faculty-load-balance",
        "Faculty Load Balance",
        "faculty assignment load, specialization fit, and timetable pressure",
        "balance teaching load without sacrificing course coverage",
        "Global",
      ),
      challengeTopic(
        "transport-no-show-forecast",
        "Student Transport No-Show Forecast",
        "bus routes, no-show patterns, and campus arrival pressure",
        "adjust transport operations before service quality drops",
        "UAE",
      ),
      challengeTopic(
        "lab-equipment-booking-conflicts",
        "Lab Equipment Booking Conflicts",
        "equipment bookings, class demand, and research interruptions",
        "keep critical lab access available for the highest-priority work",
        "Qatar",
      ),
      challengeTopic(
        "tuition-collections-follow-up",
        "Tuition Collections Follow-Up",
        "fee balances, payment promises, and student-support sensitivity",
        "prioritize outreach without increasing attrition risk",
        "Saudi Arabia",
      ),
      challengeTopic(
        "campus-energy-usage-exceptions",
        "Campus Energy Usage Exceptions",
        "campus energy drift, building schedules, and occupancy anomalies",
        "flag waste before utility spend climbs further",
        "UAE",
      ),
      challengeTopic(
        "internship-placement-match-quality",
        "Internship Placement Match Quality",
        "placement quality, employer fit, and student readiness signals",
        "place students into stronger internship outcomes faster",
        "Global",
      ),
      challengeTopic(
        "lms-engagement-drop-detection",
        "LMS Engagement Drop Detection",
        "learning-platform engagement changes and attendance decline",
        "catch engagement drop-off before it turns into course failure",
        "GCC",
      ),
      challengeTopic(
        "exam-proctoring-incident-review",
        "Exam Proctoring Incident Review",
        "exam incidents, evidence packages, and review turnaround",
        "close academic-integrity cases more consistently",
        "Global",
      ),
      challengeTopic(
        "scholarship-renewal-risk",
        "Scholarship Renewal Risk",
        "scholarship renewal criteria, academic performance, and intervention windows",
        "save more eligible students before renewal deadlines close",
        "UAE",
        "anonymous",
      ),
      challengeTopic(
        "alumni-outreach-segmentation",
        "Alumni Outreach Segmentation",
        "alumni journeys, engagement signals, and campaign timing",
        "target outreach where response likelihood is strongest",
        "Middle East",
      ),
      challengeTopic(
        "library-seat-demand-forecast",
        "Library Seat Demand Forecast",
        "library demand, study patterns, and exam-period surges",
        "manage space pressure before student frustration rises",
        "Qatar",
      ),
      challengeTopic(
        "research-grant-deadline-compliance",
        "Research Grant Deadline Compliance",
        "grant deadlines, document readiness, and approval dependencies",
        "protect submission quality while reducing last-minute scramble",
        "Global",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "student-success-radar",
        "Student Success Radar",
        "an intervention-priority console for risk, engagement, and advising capacity",
        "focus student-success effort on the learners most likely to disengage",
        "Middle East",
        "paid",
        27,
        ["student-at-risk-intervention-priority", "lms-engagement-drop-detection"],
      ),
      solutionTopic(
        "admissions-checklist-router",
        "Admissions Checklist Router",
        "application completion and missing-document routing for admissions teams",
        "move qualified applicants through review before deadlines pass",
        "GCC",
        "free",
        18,
        ["admissions-document-missingness", "scholarship-renewal-risk"],
      ),
      solutionTopic(
        "timetable-conflict-resolver",
        "Timetable Conflict Resolver",
        "conflict detection across rooms, faculty load, and course dependencies",
        "reduce rework during term scheduling",
        "Global",
        "contact",
        16,
        ["timetable-conflict-resolution", "faculty-load-balance"],
      ),
      solutionTopic(
        "placement-match-studio",
        "Placement Match Studio",
        "placement matching across employer fit, student readiness, and outcomes",
        "create stronger internship outcomes with less manual coordination",
        "Middle East",
        "contact",
        14,
        ["internship-placement-match-quality", "alumni-outreach-segmentation"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Frontline agencies still coordinate dispatch, inspections, and incident readiness across fragmented operational channels",
    company: {
      city: "Abu Dhabi",
      countryCode: "AE",
      description:
        "Public-safety operations provider supporting dispatch, readiness, and civil-defense coordination workflows.",
      headquartersLabel: "Abu Dhabi, UAE",
      id: "demo-company-sentinel",
      logoPath: null,
      name: "Sentinel Response Systems",
      slug: "sentinel-response-systems",
      websiteUrl: "https://www.sentinelresponse.example",
    },
    operatorLabel: "Dispatch, readiness, and civil-defense teams",
    sectorSlug: "police-civil-defense",
    challengeTopics: [
      challengeTopic(
        "emergency-call-triage-load-balancing",
        "Emergency Call Triage Load Balancing",
        "call volume spikes, severity cues, and dispatch capacity",
        "keep urgent incidents moving even during surge periods",
        "UAE",
      ),
      challengeTopic(
        "incident-command-handover",
        "Incident Command Handover",
        "incident updates, field notes, and command handover readiness",
        "prevent situational context loss between commanding teams",
        "Global",
      ),
      challengeTopic(
        "patrol-shift-coverage-gaps",
        "Patrol Shift Coverage Gaps",
        "coverage gaps, leave changes, and hotspot demand",
        "rebalance patrol strength before visibility drops",
        "Saudi Arabia",
      ),
      challengeTopic(
        "inspection-backlog-priority",
        "Inspection Backlog Priority",
        "inspection backlogs, risk scores, and limited field capacity",
        "send inspectors to the highest-risk sites first",
        "GCC",
      ),
      challengeTopic(
        "hydrant-readiness-anomaly",
        "Hydrant Readiness Anomaly",
        "hydrant readiness signals, test results, and maintenance lag",
        "flag the hydrants most likely to fail operationally",
        "UAE",
      ),
      challengeTopic(
        "crowd-event-camera-alert-ranking",
        "Crowd Event Camera Alert Ranking",
        "camera alerts, event schedules, and crowd-density spikes",
        "separate nuisance alerts from genuine public-safety risk",
        "Qatar",
      ),
      challengeTopic(
        "fire-permit-expiry-follow-up",
        "Fire Permit Expiry Follow-Up",
        "permit expiries, inspection outcomes, and follow-up status",
        "close fire-permit gaps before non-compliance compounds",
        "UAE",
      ),
      challengeTopic(
        "hazmat-response-roster",
        "Hazmat Response Roster",
        "hazmat skill coverage, roster readiness, and incident demand",
        "put the right specialized responders on the first call",
        "Global",
      ),
      challengeTopic(
        "disaster-shelter-stock-monitoring",
        "Disaster Shelter Stock Monitoring",
        "shelter stock levels, expiry risk, and replenishment timing",
        "keep emergency shelters ready without overstocking",
        "GCC",
      ),
      challengeTopic(
        "dispatch-location-accuracy-correction",
        "Dispatch Location Accuracy Correction",
        "location mismatches, caller data, and dispatch confirmation",
        "reduce delay caused by incorrect incident location data",
        "UAE",
      ),
      challengeTopic(
        "evacuation-drill-compliance",
        "Evacuation Drill Compliance",
        "drill evidence, participation records, and compliance follow-up",
        "close the highest-risk compliance gaps before audit deadlines",
        "Saudi Arabia",
      ),
      challengeTopic(
        "equipment-maintenance-readiness",
        "Equipment Maintenance Readiness",
        "frontline equipment readiness, service due dates, and outage risk",
        "keep response assets ready for operational demand",
        "UAE",
        "anonymous",
      ),
      challengeTopic(
        "multi-agency-briefing-compilation",
        "Multi-Agency Briefing Compilation",
        "briefing material, agency inputs, and operational context drift",
        "prepare faster, more consistent multi-agency situation briefs",
        "Global",
      ),
      challengeTopic(
        "false-alarm-pattern-detection",
        "False Alarm Pattern Detection",
        "false alarm history, site types, and device behavior",
        "focus enforcement and inspection on repeat false-alarm sources",
        "GCC",
      ),
      challengeTopic(
        "flood-response-staging-decisions",
        "Flood Response Staging Decisions",
        "flood warnings, staging assets, and road-access uncertainty",
        "pre-position response assets before flood conditions worsen",
        "UAE",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "dispatch-triage-console",
        "Dispatch Triage Console",
        "dispatch triage linked to call severity, location confidence, and unit readiness",
        "move urgent incidents through dispatch faster during surges",
        "Middle East",
        "paid",
        30,
        ["emergency-call-triage-load-balancing", "dispatch-location-accuracy-correction"],
      ),
      solutionTopic(
        "incident-handover-board",
        "Incident Handover Board",
        "incident command continuity across updates, ownership, and field context",
        "prevent situational context loss when command changes",
        "Global",
        "contact",
        22,
        ["incident-command-handover", "multi-agency-briefing-compilation"],
      ),
      solutionTopic(
        "inspection-backlog-sequencer",
        "Inspection Backlog Sequencer",
        "risk-weighted inspection scheduling across limited field capacity",
        "focus inspectors on the facilities that matter most",
        "GCC",
        "free",
        18,
        ["inspection-backlog-priority", "fire-permit-expiry-follow-up"],
      ),
      solutionTopic(
        "flood-staging-assistant",
        "Flood Staging Assistant",
        "staging support for flood warnings, road access, and response assets",
        "pre-position the right civil-defense assets before conditions deteriorate",
        "UAE",
        "contact",
        15,
        ["flood-response-staging-decisions", "disaster-shelter-stock-monitoring"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Airport and airline operations still manage turns, passengers, and recovery actions across many disconnected teams",
    company: {
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
    operatorLabel: "Airline and airport operations teams",
    sectorSlug: "aviation",
    challengeTopics: [
      challengeTopic(
        "airport-stand-turnaround",
        "Airport Stand Turnaround",
        "turn sequencing, crew readiness, and delay recovery across active flights",
        "recover departure punctuality during banked peaks",
        "Abu Dhabi, UAE",
      ),
      challengeTopic(
        "baggage-misconnect-forecast",
        "Baggage Misconnect Forecast",
        "baggage transfer risk, connection windows, and handler workload",
        "flag likely misconnects before customers reach the belt",
        "Global",
      ),
      challengeTopic(
        "crew-briefing-update-compliance",
        "Crew Briefing Update Compliance",
        "crew briefing changes, acknowledgement gaps, and dispatch readiness",
        "make sure critical crew updates are actually seen before departure",
        "UAE",
      ),
      challengeTopic(
        "gate-change-passenger-messaging",
        "Gate Change Passenger Messaging",
        "gate changes, passenger flow, and message-timing risk",
        "inform the right passengers before gate changes create missed boarding",
        "Global",
      ),
      challengeTopic(
        "catering-shortload-detection",
        "Catering Shortload Detection",
        "catering shortloads, load-sheet timing, and stand readiness",
        "catch provisioning gaps before the cabin is closed",
        "UAE",
      ),
      challengeTopic(
        "runway-inspection-slot-planning",
        "Runway Inspection Slot Planning",
        "runway inspections, movement pressure, and weather windows",
        "fit safety inspections into busy airfield operations with less disruption",
        "Global",
      ),
      challengeTopic(
        "mel-defect-triage-sequencing",
        "MEL Defect Triage Sequencing",
        "MEL defects, engineering demand, and aircraft rotation pressure",
        "sequence engineering work around the defects most likely to delay flights",
        "Middle East",
      ),
      challengeTopic(
        "lounge-capacity-surge-prediction",
        "Lounge Capacity Surge Prediction",
        "lounge capacity, flight disruptions, and premium passenger inflow",
        "prepare staffing and overflow plans before lounges overload",
        "UAE",
      ),
      challengeTopic(
        "apron-bus-demand-surge",
        "Apron Bus Demand Surge",
        "apron-bus demand, remote stand assignments, and crew availability",
        "prevent passenger delays when remote operations spike",
        "Saudi Arabia",
      ),
      challengeTopic(
        "aircraft-cleaning-readiness",
        "Aircraft Cleaning Readiness",
        "cabin cleaning status, ground-time pressure, and service sequencing",
        "clear aircraft cleaning blockers before they hit departure time",
        "UAE",
      ),
      challengeTopic(
        "cargo-uld-mismatch-resolution",
        "Cargo ULD Mismatch Resolution",
        "ULD mismatches, flight swaps, and cargo cut-off pressure",
        "resolve ULD issues before cargo misses uplift",
        "Global",
      ),
      challengeTopic(
        "security-lane-staffing",
        "Security Lane Staffing",
        "security queue pressure, wave schedules, and staffing changes",
        "add or move staff before queue delays damage passenger flow",
        "UAE",
      ),
      challengeTopic(
        "irregular-operations-hotel-blocks",
        "Irregular Operations Hotel Blocks",
        "IROPS hotel blocks, disrupted passengers, and room exhaustion risk",
        "assign stranded passengers before accommodation runs short",
        "Global",
        "anonymous",
      ),
      challengeTopic(
        "fuel-truck-dispatch-conflicts",
        "Fuel Truck Dispatch Conflicts",
        "fuel-truck dispatch, stand plans, and service conflicts",
        "avoid fueling delays caused by dispatch overlap or stand congestion",
        "UAE",
      ),
      challengeTopic(
        "wheelchair-service-request-timing",
        "Wheelchair Service Request Timing",
        "mobility-service requests, gate moves, and arrival sequencing",
        "meet accessibility commitments during irregular operations",
        "Global",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "turnaround-crew-orchestrator",
        "Turnaround Crew Orchestrator",
        "a turnaround planner for stand readiness, crew coordination, and live delay recovery",
        "give ops teams one turn view instead of a fragmented recovery process",
        "Middle East",
        "paid",
        27,
        ["airport-stand-turnaround", "fuel-truck-dispatch-conflicts"],
      ),
      solutionTopic(
        "baggage-reconnect-predictor",
        "Baggage Reconnect Predictor",
        "transfer-risk scoring for baggage connections and handler workload",
        "catch baggage misconnects before customers arrive without bags",
        "Global",
        "free",
        23,
        ["baggage-misconnect-forecast", "cargo-uld-mismatch-resolution"],
      ),
      solutionTopic(
        "gate-change-comms-hub",
        "Gate Change Comms Hub",
        "passenger messaging orchestration around live gate changes and queue conditions",
        "notify the right passengers at the right moment during gate disruption",
        "Global",
        "contact",
        20,
        ["gate-change-passenger-messaging", "wheelchair-service-request-timing"],
      ),
      solutionTopic(
        "mel-triage-cockpit",
        "MEL Triage Cockpit",
        "engineering-priority routing for MEL defects and aircraft rotation pressure",
        "focus engineering attention where delay risk is highest",
        "Middle East",
        "contact",
        19,
        ["mel-defect-triage-sequencing", "crew-briefing-update-compliance"],
      ),
    ],
  },
  {
    challengeProblemLead:
      "Solar operators still manage maintenance, inspection, and storage exceptions across dispersed assets and manual planning",
    company: {
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
    operatorLabel: "Solar operations and field-service teams",
    sectorSlug: "solar-energy",
    challengeTopics: [
      challengeTopic(
        "solar-field-maintenance-forecasting",
        "Solar Field Maintenance Forecasting",
        "panel, inverter, and site-condition risk signals",
        "plan inspection rounds before output drops materially",
        "MENA",
        "anonymous",
      ),
      challengeTopic(
        "inverter-trip-cluster-analysis",
        "Inverter Trip Cluster Analysis",
        "inverter trips, thermal context, and repeat site-level anomalies",
        "see trip clusters before they become chronic yield loss",
        "UAE",
      ),
      challengeTopic(
        "panel-soiling-cleaning-priority",
        "Panel Soiling Cleaning Priority",
        "panel soiling trends, weather patterns, and cleaning capacity",
        "send cleaning teams where soiling is hurting output most",
        "Saudi Arabia",
      ),
      challengeTopic(
        "battery-thermal-runaway-warning",
        "Battery Thermal Runaway Warning",
        "storage temperature drift, charge states, and safety thresholds",
        "escalate storage risk before crews are responding to an emergency",
        "Global",
      ),
      challengeTopic(
        "curtailment-cause-attribution",
        "Curtailment Cause Attribution",
        "curtailment events, dispatch notices, and site-level generation context",
        "explain why clean output was constrained and what to adjust next",
        "MENA",
      ),
      challengeTopic(
        "drone-image-defect-review",
        "Drone Image Defect Review",
        "inspection imagery, defect queues, and engineering review capacity",
        "surface the defects most likely to affect production first",
        "UAE",
      ),
      challengeTopic(
        "vegetation-shading-growth-risk",
        "Vegetation Shading Growth Risk",
        "vegetation growth, shading progression, and field routing",
        "clear the rows where shading is eroding yield fastest",
        "Oman",
      ),
      challengeTopic(
        "spare-inverter-allocation",
        "Spare Inverter Allocation",
        "spare inverter availability, failure risk, and site priorities",
        "put scarce spares where production risk is highest",
        "GCC",
      ),
      challengeTopic(
        "ppa-generation-variance-investigation",
        "PPA Generation Variance Investigation",
        "generation variance, contract expectations, and site-level causes",
        "explain underperformance before commercial disputes escalate",
        "Global",
      ),
      challengeTopic(
        "warranty-claim-evidence-assembly",
        "Warranty Claim Evidence Assembly",
        "warranty evidence, defect records, and vendor follow-up",
        "build stronger claims without slowing maintenance execution",
        "UAE",
      ),
      challengeTopic(
        "tracker-motor-failure-forecast",
        "Tracker Motor Failure Forecast",
        "tracker performance drift, weather exposure, and maintenance history",
        "service failing trackers before they impact field yield",
        "Saudi Arabia",
      ),
      challengeTopic(
        "site-security-intrusion-triage",
        "Site Security Intrusion Triage",
        "site intrusion alerts, camera evidence, and response routing",
        "separate nuisance events from credible site-security risk",
        "UAE",
      ),
      challengeTopic(
        "dust-storm-prepositioning",
        "Dust Storm Pre-Positioning",
        "dust-storm forecasts, cleaning crews, and operational readiness",
        "stage assets before storm conditions create prolonged output loss",
        "MENA",
      ),
      challengeTopic(
        "storage-dispatch-exceptions",
        "Storage Dispatch Exceptions",
        "battery dispatch exceptions, market signals, and site constraints",
        "route exceptions to the operators who can act fastest",
        "Global",
      ),
      challengeTopic(
        "technician-route-sequencing",
        "Technician Route Sequencing",
        "technician travel, fault density, and spare-part availability",
        "build field-service routes that maximize resolved work per day",
        "UAE",
      ),
    ],
    solutionTopics: [
      solutionTopic(
        "solar-drone-maintenance-suite",
        "Solar Drone Maintenance Suite",
        "a drone-led inspection workflow with predictive scoring for panel and inverter anomalies",
        "help field teams inspect the most at-risk assets before output drops",
        "MENA",
        "paid",
        19,
        ["solar-field-maintenance-forecasting", "drone-image-defect-review"],
      ),
      solutionTopic(
        "inverter-cluster-sentinel",
        "Inverter Cluster Sentinel",
        "trip clustering and thermal context for inverter-failure investigation",
        "spot repeat inverter failure patterns earlier",
        "Global",
        "contact",
        17,
        ["inverter-trip-cluster-analysis", "tracker-motor-failure-forecast"],
      ),
      solutionTopic(
        "soiling-priority-planner",
        "Soiling Priority Planner",
        "cleaning prioritization across weather, soiling progression, and field capacity",
        "send crews where cleaning effort protects the most output",
        "Middle East",
        "free",
        15,
        ["panel-soiling-cleaning-priority", "dust-storm-prepositioning"],
      ),
      solutionTopic(
        "battery-thermal-watch",
        "Battery Thermal Watch",
        "storage exception monitoring across temperature drift and dispatch conditions",
        "surface storage risk before safety thresholds are breached",
        "Global",
        "contact",
        18,
        ["battery-thermal-runaway-warning", "storage-dispatch-exceptions"],
      ),
    ],
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

function buildChallengeSummary(topic: DemoChallengeTopic, operatorLabel: string) {
  return `${operatorLabel} need better visibility into ${topic.focus} so they can ${topic.goal}.`;
}

function buildChallengeProblemStatement(
  topic: DemoChallengeTopic,
  challengeProblemLead: string,
) {
  return `${challengeProblemLead}, which makes it harder to manage ${topic.focus} with confidence. Teams need a faster way to ${topic.goal}.`;
}

function buildChallengeDesiredOutcome(topic: DemoChallengeTopic) {
  return `Create a repeatable operating workflow that helps teams ${topic.goal}, with earlier warning, clearer prioritization, and fewer manual handoff delays.`;
}

function buildSolutionSummary(topic: DemoSolutionTopic) {
  return `${topic.capability[0]?.toUpperCase() ?? ""}${topic.capability.slice(1)} to ${topic.benefit}.`;
}

function buildSolutionDescription(topic: DemoSolutionTopic, companyName: string) {
  return `${companyName} provides ${topic.capability} so teams can ${topic.benefit}. The workflow is designed for production use, with clear triage, operational routing, and reusable review context across recurring scenarios.`;
}

function createDemoCompanies(): DemoCompanySeed[] {
  return sectorDefinitions.map((definition) => definition.company);
}

function createDemoChallenges(): DemoChallengeSeed[] {
  return sectorDefinitions.flatMap((definition, sectorIndex) => {
    const sectorName = findSectorName(definition.sectorSlug);

    return definition.challengeTopics.map((topic, challengeIndex) => ({
      anonymityMode: topic.anonymityMode ?? "named",
      companyLogoPath: null,
      companyName:
        topic.anonymityMode === "anonymous" ? "Anonymous" : definition.company.name,
      companySlug:
        topic.anonymityMode === "anonymous" ? null : definition.company.slug,
      desiredOutcome: buildChallengeDesiredOutcome(topic),
      geographyLabel: topic.geographyLabel,
      id: `demo-challenge-${definition.sectorSlug}-${challengeIndex + 1}`,
      problemStatement: buildChallengeProblemStatement(
        topic,
        definition.challengeProblemLead,
      ),
      publishedAt: atOffset(sectorIndex * 3 + Math.floor(challengeIndex / 5), challengeIndex * 2),
      sectorId: definition.sectorSlug,
      sectorName,
      sectorSlug: definition.sectorSlug,
      slug: topic.slug,
      status: "published",
      summary: buildChallengeSummary(topic, definition.operatorLabel),
      title: topic.title,
    }));
  });
}

function createDemoSolutions(companiesBySlug: Map<string, DemoCompanySeed>): DemoSolutionSeed[] {
  return sectorDefinitions.flatMap((definition, sectorIndex) => {
    const sectorName = findSectorName(definition.sectorSlug);
    const company = companiesBySlug.get(definition.company.slug);

    if (!company) {
      return [];
    }

    return definition.solutionTopics.map((topic, solutionIndex) => ({
      accessModel: topic.accessModel,
      companyId: company.id,
      companyLogoPath: null,
      companyName: company.name,
      companySlug: company.slug,
      coverageLabel: topic.coverageLabel,
      id: `demo-solution-${definition.sectorSlug}-${solutionIndex + 1}`,
      offeringDescription: buildSolutionDescription(topic, company.name),
      publishedAt: atOffset(sectorIndex * 3, solutionIndex * 5 + 1),
      sectorId: definition.sectorSlug,
      sectorName,
      sectorSlug: definition.sectorSlug,
      slug: topic.slug,
      status: "published",
      summary: buildSolutionSummary(topic),
      title: topic.title,
      voteCount: topic.voteCount,
    }));
  });
}

function createDemoLinks(
  challengesBySlug: Map<string, DemoChallengeSeed>,
  solutionsBySlug: Map<string, DemoSolutionSeed>,
): PublicChallengeSolutionLinkRecord[] {
  const links = sectorDefinitions.flatMap((definition) =>
    definition.solutionTopics.flatMap((solution) =>
      solution.challengeSlugs.map((challengeSlug) => ({
        challengeSlug,
        solutionSlug: solution.slug,
      })),
    ),
  );

  return links.map((link, index) => {
    const challenge = challengesBySlug.get(link.challengeSlug);
    const solution = solutionsBySlug.get(link.solutionSlug);

    if (!challenge || !solution) {
      throw new Error(`Demo link references an unknown record: ${link.challengeSlug} -> ${link.solutionSlug}`);
    }

    return {
      challengeId: challenge.id,
      createdAt: solution.publishedAt,
      id: `demo-link-${index + 1}`,
      solutionId: solution.id,
    };
  });
}

function createDemoSignals(
  challenges: PublicChallengeRecord[],
  solutions: PublicSolutionRecord[],
): PublicActivitySignalRecord[] {
  const challengeSignals = challenges
    .slice()
    .sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""))
    .slice(0, 10)
    .map((challenge, index) => ({
      actorLabel: challenge.anonymityMode === "anonymous" ? "Anonymous" : "Member",
      eventName: "challenge_published",
      id: `demo-signal-challenge-${index + 1}`,
      occurredAt: challenge.publishedAt ?? atOffset(30),
      resourceKind: "challenge",
      resourceLabel: challenge.title,
      route: `/challenges/${challenge.slug}`,
      sectorName: challenge.sectorName,
    }));

  const solutionSignals = solutions
    .slice()
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 10)
    .map((solution, index) => ({
      actorLabel: "Member",
      eventName: "solution_published",
      id: `demo-signal-solution-${index + 1}`,
      occurredAt: solution.publishedAt,
      resourceKind: "solution",
      resourceLabel: solution.title,
      route: `/solutions/${solution.slug}`,
      sectorName: solution.sectorName,
    }));

  const aiSignals: PublicActivitySignalRecord[] = [
    {
      actorLabel: "Platform",
      eventName: "ai_discovery",
      id: "demo-signal-ai-1",
      occurredAt: atOffset(1, 2),
      resourceKind: "platform",
      resourceLabel: "Scenario Discovery",
      route: "/ai",
      sectorName: "Technology",
    },
    {
      actorLabel: "Platform",
      eventName: "ai_discovery",
      id: "demo-signal-ai-2",
      occurredAt: atOffset(2, 3),
      resourceKind: "platform",
      resourceLabel: "Cross-Sector Pattern Scan",
      route: "/ai",
      sectorName: "Finance & Banking",
    },
  ];

  return [...challengeSignals, ...solutionSignals, ...aiSignals]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 18);
}

function buildDemoSnapshot(): DemoSnapshot {
  const sectors = createDemoSectors();
  const demoCompanies = createDemoCompanies();
  const companiesBySlug = new Map(demoCompanies.map((company) => [company.slug, company]));
  const demoChallenges = createDemoChallenges();
  const demoSolutions = createDemoSolutions(companiesBySlug);
  const challengesBySlug = new Map(demoChallenges.map((challenge) => [challenge.slug, challenge]));
  const solutionsBySlug = new Map(demoSolutions.map((solution) => [solution.slug, solution]));
  const challengeLinks = createDemoLinks(challengesBySlug, solutionsBySlug);
  const challengeLinkCounts = new Map<string, number>();
  const solutionLinkCounts = new Map<string, number>();

  challengeLinks.forEach((link) => {
    challengeLinkCounts.set(link.challengeId, (challengeLinkCounts.get(link.challengeId) ?? 0) + 1);
    solutionLinkCounts.set(link.solutionId, (solutionLinkCounts.get(link.solutionId) ?? 0) + 1);
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
    if (!challenge.companySlug) {
      return;
    }

    const company = demoCompanies.find((item) => item.slug === challenge.companySlug);

    if (!company) {
      return;
    }

    const counts = companyCounts.get(company.id);

    if (counts) {
      counts.publishedChallengeCount += 1;
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
        latestPublicationAt: timestamps.sort((left, right) => right.localeCompare(left))[0] ?? null,
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

  const signals = createDemoSignals(challenges, solutions).map((signal) => ({
    ...signal,
    sectorName: signal.sectorName ? findSectorName(signal.sectorName) : signal.sectorName,
  }));

  const metrics = {
    latestActivityAt: signals
      .map((signal) => signal.occurredAt)
      .sort((left, right) => right.localeCompare(left))[0] ?? null,
    publicCompanyCount: companies.length,
    publicSignalCount: signals.length,
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
    signals,
    solutions,
  };
}

let cachedSnapshot: DemoSnapshot | null = null;

export function createPublicDemoSnapshot(): DemoSnapshot {
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  cachedSnapshot = buildDemoSnapshot();
  return cachedSnapshot;
}

export function getDemoChallengeBySlug(slug: string) {
  return createPublicDemoSnapshot().challenges.find((challenge) => challenge.slug === slug) ?? null;
}

export function getDemoSolutionBySlug(slug: string) {
  return createPublicDemoSnapshot().solutions.find((solution) => solution.slug === slug) ?? null;
}
