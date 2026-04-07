const DEFAULT_APP_URL = "http://localhost:3000";

const APP_URL_MESSAGE =
  "NEXT_PUBLIC_APP_URL must be an absolute URL when provided.";
const SUPABASE_SETUP_MESSAGE =
  "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before enabling Supabase-backed features.";
const SUPABASE_URL_MESSAGE =
  "NEXT_PUBLIC_SUPABASE_URL must be an absolute URL.";
const SUPABASE_MISSING_MESSAGE =
  "Missing Supabase public environment. Expected both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

export type EnvironmentSource = Record<string, string | undefined>;

export type SupabasePublicEnvironment = {
  url: string;
  anonKey: string;
};

export type EnvironmentStatus = {
  appUrl: string;
  issues: string[];
  supabase: {
    configured: boolean;
    url?: string;
    anonKey?: string;
    issues: string[];
  };
};

function normalize(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function isAbsoluteUrl(value: string) {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveEnvironmentStatus(
  source: EnvironmentSource = process.env,
): EnvironmentStatus {
  const issues: string[] = [];

  const appUrlInput = normalize(source.NEXT_PUBLIC_APP_URL);
  const appUrl = appUrlInput && isAbsoluteUrl(appUrlInput) ? appUrlInput : DEFAULT_APP_URL;

  if (appUrlInput && !isAbsoluteUrl(appUrlInput)) {
    issues.push(APP_URL_MESSAGE);
  }

  const supabaseIssues: string[] = [];
  const supabaseUrl = normalize(source.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalize(source.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseIssues.push(SUPABASE_SETUP_MESSAGE);
  }

  if (supabaseUrl && !isAbsoluteUrl(supabaseUrl)) {
    supabaseIssues.push(SUPABASE_URL_MESSAGE);
  }

  issues.push(...supabaseIssues);

  const configured =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    Boolean(supabaseUrl && isAbsoluteUrl(supabaseUrl));

  return {
    appUrl,
    issues,
    supabase: {
      configured,
      url: configured ? supabaseUrl : undefined,
      anonKey: configured ? supabaseAnonKey : undefined,
      issues: supabaseIssues,
    },
  };
}

export function readSupabasePublicEnvironment(
  source: EnvironmentSource = process.env,
): SupabasePublicEnvironment | null {
  const status = resolveEnvironmentStatus(source);

  if (!status.supabase.configured) {
    return null;
  }

  return {
    url: status.supabase.url!,
    anonKey: status.supabase.anonKey!,
  };
}

export function assertSupabasePublicEnvironment(
  source: EnvironmentSource = process.env,
): SupabasePublicEnvironment {
  const env = readSupabasePublicEnvironment(source);

  if (!env) {
    const status = resolveEnvironmentStatus(source);
    const hasExplicitSupabaseIssue = status.supabase.issues.some(
      (issue) => issue !== SUPABASE_SETUP_MESSAGE,
    );

    if (hasExplicitSupabaseIssue) {
      throw new Error(status.supabase.issues.join(" "));
    }

    throw new Error(SUPABASE_MISSING_MESSAGE);
  }

  return env;
}
