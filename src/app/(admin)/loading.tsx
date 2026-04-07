import { RouteLoadingState } from "@/components/shell/route-loading-state";

export default function AdminLoading() {
  return (
    <RouteLoadingState
      description="Preparing protected governance queues, taxonomy controls, and audit-ready records."
      title="Loading Governance Console"
    />
  );
}
