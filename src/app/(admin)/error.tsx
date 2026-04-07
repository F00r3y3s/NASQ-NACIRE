"use client";

import { RouteErrorState } from "@/components/shell/route-error-state";

type AdminErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function AdminError({
  error,
  unstable_retry,
}: AdminErrorProps) {
  return (
    <RouteErrorState
      description="The governance console could not finish the current operation. Retry the segment or return to the moderation queue."
      error={error}
      primaryHref="/admin/moderation"
      primaryLabel="Open Moderation"
      title="Governance Console Unavailable"
      unstable_retry={unstable_retry}
    />
  );
}
