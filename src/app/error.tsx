"use client";

import { RouteErrorState } from "@/components/shell/route-error-state";

type RootErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function RootError({ error, unstable_retry }: RootErrorProps) {
  return (
    <RouteErrorState
      description="The application hit an unexpected error before a route-specific recovery state could take over."
      error={error}
      primaryHref="/"
      primaryLabel="Return Home"
      title="Something Went Wrong"
      unstable_retry={unstable_retry}
    />
  );
}
