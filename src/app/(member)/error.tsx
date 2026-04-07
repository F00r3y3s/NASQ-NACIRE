"use client";

import { RouteErrorState } from "@/components/shell/route-error-state";

type MemberErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function MemberError({
  error,
  unstable_retry,
}: MemberErrorProps) {
  return (
    <RouteErrorState
      description="The protected member workspace could not complete the current request. Retry the segment or return to your account overview."
      error={error}
      primaryHref="/account"
      primaryLabel="Open Account"
      title="Member Workspace Unavailable"
      unstable_retry={unstable_retry}
    />
  );
}
