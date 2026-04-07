import type { RequiredSectorName } from "@/domain/contracts";

export type SectorSeed = {
  description: string;
  displayOrder: number;
  iconKey: string;
  isVisible: boolean;
  name: RequiredSectorName;
  slug: string;
};

export const sectorSeeds: readonly SectorSeed[] = [
  {
    description:
      "Exploration, production, refinery, and field-operations challenges across upstream and downstream energy systems.",
    displayOrder: 1,
    iconKey: "oil-gas",
    isVisible: true,
    name: "Oil & Gas",
    slug: "oil-gas",
  },
  {
    description:
      "Grid resilience, water, power, and utility-service challenges affecting national infrastructure and operations.",
    displayOrder: 2,
    iconKey: "energy-utilities",
    isVisible: true,
    name: "Energy & Utilities",
    slug: "energy-utilities",
  },
  {
    description:
      "Built-environment delivery, asset durability, and large-scale infrastructure coordination under demanding climate conditions.",
    displayOrder: 3,
    iconKey: "construction-infrastructure",
    isVisible: true,
    name: "Construction & Infrastructure",
    slug: "construction-infrastructure",
  },
  {
    description:
      "Clinical, hospital, patient-data, and care-delivery challenges across public and private health networks.",
    displayOrder: 4,
    iconKey: "healthcare",
    isVisible: true,
    name: "Healthcare",
    slug: "healthcare",
  },
  {
    description:
      "Banking operations, compliance, payments, risk, and customer-service innovation across regulated financial services.",
    displayOrder: 5,
    iconKey: "finance-banking",
    isVisible: true,
    name: "Finance & Banking",
    slug: "finance-banking",
  },
  {
    description:
      "Transport, warehousing, customs, routing, and last-mile challenges across regional and global supply networks.",
    displayOrder: 6,
    iconKey: "logistics-supply-chain",
    isVisible: true,
    name: "Logistics & Supply Chain",
    slug: "logistics-supply-chain",
  },
  {
    description:
      "Factory efficiency, industrial automation, quality, maintenance, and production resilience for advanced manufacturing.",
    displayOrder: 7,
    iconKey: "manufacturing",
    isVisible: true,
    name: "Manufacturing",
    slug: "manufacturing",
  },
  {
    description:
      "Software, platforms, cybersecurity, AI, and digital-transformation challenges that support cross-sector innovation.",
    displayOrder: 8,
    iconKey: "technology",
    isVisible: true,
    name: "Technology",
    slug: "technology",
  },
  {
    description:
      "Guest experience, destination operations, accommodation, and service-delivery challenges across travel and hospitality.",
    displayOrder: 9,
    iconKey: "tourism-hospitality",
    isVisible: true,
    name: "Tourism & Hospitality",
    slug: "tourism-hospitality",
  },
  {
    description:
      "Learning delivery, campus operations, workforce readiness, and education technology challenges across institutions.",
    displayOrder: 10,
    iconKey: "education",
    isVisible: true,
    name: "Education",
    slug: "education",
  },
  {
    description:
      "Public safety, emergency response, civil-defense readiness, and secure coordination challenges for frontline agencies.",
    displayOrder: 11,
    iconKey: "police-civil-defense",
    isVisible: true,
    name: "Police & Civil Defense",
    slug: "police-civil-defense",
  },
  {
    description:
      "Airport, airline, air-traffic, maintenance, and passenger-experience challenges across the aviation ecosystem.",
    displayOrder: 12,
    iconKey: "aviation",
    isVisible: true,
    name: "Aviation",
    slug: "aviation",
  },
  {
    description:
      "Solar deployment, storage, distributed generation, and clean-energy optimization challenges distinct from utility operations.",
    displayOrder: 13,
    iconKey: "solar-energy",
    isVisible: true,
    name: "Solar & Energy",
    slug: "solar-energy",
  },
] as const;
