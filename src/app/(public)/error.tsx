"use client";

import { RouteErrorState } from "@/components/shell/route-error-state";

type PublicErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function PublicError({
  error,
  unstable_retry,
}: PublicErrorProps) {
  return (
    <RouteErrorState
      description="Public discovery could not finish loading. Retry the current segment or step back to the dashboard."
      error={error}
      primaryHref="/"
      primaryLabel="Open Dashboard"
      title="Public Workspace Unavailable"
      unstable_retry={unstable_retry}
    />
  );
}
