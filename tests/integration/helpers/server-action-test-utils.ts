import { vi } from "vitest";

import type { ViewerContext, ViewerMembershipSummary } from "@/lib/auth/access";

type QueryAction = "delete" | "insert" | "select" | "update";
type QueryFilter =
  | { type: "eq"; column: string; value: unknown }
  | { type: "in"; column: string; values: unknown[] }
  | { type: "limit"; value: number }
  | { type: "order"; column: string; options: unknown };

export type MockQueryResponse = {
  data?: unknown;
  error?: { code?: string; message: string } | null;
};

export type RecordedQuery = {
  action: QueryAction;
  columns: string | null;
  filters: QueryFilter[];
  payload: unknown;
  returnMode: "many" | "maybeSingle" | "single";
  table: string;
};

export type RecordedRpcCall = {
  args: Record<string, unknown>;
  name: string;
};

export type RedirectSignal = Error & {
  digest: string;
  location: string;
};

function cloneFilters(filters: QueryFilter[]) {
  return filters.map((filter) => ({ ...filter }));
}

export function createSupabaseMock({
  queryResponses = [],
  rpcResponses = [],
}: {
  queryResponses?: MockQueryResponse[];
  rpcResponses?: MockQueryResponse[];
}) {
  const queuedQueryResponses = [...queryResponses];
  const queuedRpcResponses = [...rpcResponses];
  const queries: RecordedQuery[] = [];
  const rpcCalls: RecordedRpcCall[] = [];

  function createQueryBuilder(table: string) {
    const state: RecordedQuery = {
      action: "select",
      columns: null,
      filters: [],
      payload: null,
      returnMode: "many",
      table,
    };

    async function execute() {
      queries.push({
        ...state,
        filters: cloneFilters(state.filters),
      });

      return queuedQueryResponses.shift() ?? { data: null, error: null };
    }

    const builder = {
      select(columns: string) {
        state.columns = columns;

        return builder;
      },
      insert(payload: unknown) {
        state.action = "insert";
        state.payload = payload;

        return builder;
      },
      update(payload: unknown) {
        state.action = "update";
        state.payload = payload;

        return builder;
      },
      delete() {
        state.action = "delete";
        state.payload = null;

        return builder;
      },
      eq(column: string, value: unknown) {
        state.filters.push({ column, type: "eq", value });

        return builder;
      },
      in(column: string, values: unknown[]) {
        state.filters.push({ column, type: "in", values });

        return builder;
      },
      order(column: string, options: unknown) {
        state.filters.push({ column, options, type: "order" });

        return builder;
      },
      limit(value: number) {
        state.filters.push({ type: "limit", value });

        return builder;
      },
      single() {
        state.returnMode = "single";

        return builder;
      },
      maybeSingle() {
        state.returnMode = "maybeSingle";

        return builder;
      },
      then<TResult1 = Awaited<MockQueryResponse>, TResult2 = never>(
        onfulfilled?:
          | ((value: Awaited<MockQueryResponse>) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null,
      ) {
        return execute().then(onfulfilled, onrejected);
      },
    };

    return builder;
  }

  const supabase = {
    from(table: string) {
      return createQueryBuilder(table);
    },
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ args, name });

      return queuedRpcResponses.shift() ?? { data: null, error: null };
    }),
  };

  return {
    queries,
    rpcCalls,
    supabase,
  };
}

export function createCookieStoreMock(initialValue?: string | null) {
  const current = {
    value: initialValue ?? null,
  };

  return {
    get: vi.fn((key: string) =>
      current.value ? { name: key, value: current.value } : undefined,
    ),
    set: vi.fn((key: string, value: string) => {
      current.value = value;

      return { name: key, value };
    }),
  };
}

export function createViewerMembership(
  overrides: Partial<ViewerMembershipSummary> = {},
): ViewerMembershipSummary {
  return {
    company: {
      headquartersLabel: "Abu Dhabi, UAE",
      id: "company-1",
      isPublic: true,
      logoPath: null,
      name: "ADNOC Group",
      slug: "adnoc-group",
    },
    companyId: "company-1",
    id: "membership-1",
    isPrimary: true,
    role: "company_admin",
    verificationStatus: "verified",
    verifiedAt: "2026-04-06T00:00:00.000Z",
    ...overrides,
  };
}

export function createViewerContext(
  overrides: Partial<ViewerContext> = {},
): ViewerContext {
  const membership = createViewerMembership();

  return {
    authConfigured: true,
    avatarUrl: null,
    displayName: "Aisha Malik",
    email: "aisha@example.com",
    initials: "AM",
    isAdmin: false,
    isVerifiedMember: true,
    memberships: [membership],
    platformRole: "member",
    primaryCompany: membership.company,
    status: "authenticated",
    userId: "user-1",
    ...overrides,
  };
}

export function isRedirectSignal(error: unknown): error is RedirectSignal {
  return (
    error instanceof Error &&
    typeof (error as Partial<RedirectSignal>).digest === "string" &&
    typeof (error as Partial<RedirectSignal>).location === "string"
  );
}

export function createNextRedirectMocks() {
  const redirect = vi.fn((location: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: `NEXT_REDIRECT;${location}`,
      location,
    } satisfies Pick<RedirectSignal, "digest" | "location">);
  });
  const unstableRethrow = vi.fn((error: unknown) => {
    if (isRedirectSignal(error)) {
      throw error;
    }
  });

  return {
    redirect,
    unstableRethrow,
  };
}
