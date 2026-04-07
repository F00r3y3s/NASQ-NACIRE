type DemoSource = Record<string, string | undefined>;

export function isDemoDataEnabled(source: DemoSource = process.env) {
  const value = source.NASQ_ENABLE_DEMO_DATA?.trim().toLowerCase();

  return value === "1" || value === "true" || value === "yes";
}

