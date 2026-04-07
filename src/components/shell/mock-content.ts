export const sampleChallenges = [
  {
    companyLabel: "ADNOC Group",
    meta: ["💡 3", "👁 124", "🌍 Global"],
    sectorLabel: "Oil & Gas",
    sectorTone: "gold" as const,
    statusLabel: "Solved",
    statusTone: "green" as const,
    summary:
      "Conventional inspection methods are cost-prohibitive for deep-water pipelines in harsh saline environments.",
    title: "Pipeline Corrosion Detection in Subsea Environments",
  },
  {
    anonymous: true,
    meta: ["💡 1", "👁 89", "🇦🇪 UAE"],
    sectorLabel: "Healthcare",
    sectorTone: "blue" as const,
    statusLabel: "Open",
    statusTone: "red" as const,
    summary:
      "Fragmented records across public and private networks create delays in emergency care and duplicate diagnostics.",
    title: "Patient Data Interoperability Between Hospitals",
  },
  {
    companyLabel: "Aldar Properties",
    meta: ["💡 2", "👁 201", "🇦🇪 UAE"],
    sectorLabel: "Construction",
    sectorTone: "teal" as const,
    statusLabel: "Solved",
    statusTone: "green" as const,
    summary:
      "Standard materials degrade under sustained 50°C+ temperatures, increasing maintenance costs significantly.",
    title: "Heat-Resistant Materials for Extreme UAE Climates",
  },
  {
    anonymous: true,
    meta: ["💡 0", "👁 56", "🌍 Global"],
    sectorLabel: "Logistics",
    sectorTone: "teal" as const,
    statusLabel: "Open",
    statusTone: "red" as const,
    summary:
      "Fulfillment drops below 78% during Ramadan and National Day due to address accuracy and driver shortages.",
    title: "Last-Mile Delivery Failures During Peak Season",
  },
] as const;

export const sampleSolutions = [
  {
    engagementLabel: "3 matches",
    publicationLabel: "Free Solution",
    publicationTone: "green" as const,
    regionLabel: "Global · TechSolutions UAE",
    sectorLabel: "Oil & Gas",
    sectorTone: "gold" as const,
    summary:
      "Deploys autonomous underwater vehicles with multi-beam ultrasonic sensors and ML anomaly detection. Reduces inspection cost by 60% versus manual diving operations.",
    title: "AI-Powered Ultrasonic Corrosion Mapping for Subsea Pipelines",
    votes: 47,
  },
  {
    engagementLabel: "2 matches",
    publicationLabel: "Paid Solution",
    publicationTone: "gold" as const,
    regionLabel: "UAE Market · MedTech Arabia",
    sectorLabel: "Healthcare",
    sectorTone: "blue" as const,
    summary:
      "Middleware integration using HL7 FHIR standards to create unified patient records, with consent management and UAE DHA compliance modules.",
    title: "FHIR-Compliant Patient Data Exchange Platform",
    votes: 31,
  },
  {
    engagementLabel: "1 match",
    publicationLabel: "Free Solution",
    publicationTone: "green" as const,
    regionLabel: "GCC · Aldar R&D",
    sectorLabel: "Construction",
    sectorTone: "teal" as const,
    summary:
      "Open specifications for aerogel-reinforced insulation panels designed for sustained 50°C+ UAE operating conditions.",
    title: "Aerogel Composite Insulation Panels for Hot Climates",
    votes: 88,
  },
] as const;

export const sectorProgress = [
  { count: "386", label: "Oil & Gas", width: "85%" },
  { count: "241", label: "Construction", width: "55%" },
  { count: "198", label: "Healthcare", width: "43%" },
  { count: "172", label: "Logistics", width: "38%" },
] as const;

export const activityFeed = [
  {
    color: "var(--gold)",
    meta: "5 min · Anonymous",
    text: "Company joined — Finance",
  },
  {
    color: "var(--green)",
    meta: "12 min · ADNOC",
    text: "Solution posted — Oil & Gas",
  },
  {
    color: "var(--blue)",
    meta: "18 min · AI discovery",
    text: "AI scenario — Public browsing session",
  },
] as const;
