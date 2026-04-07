import { RouteLoadingState } from "@/components/shell/route-loading-state";

export default function MemberLoading() {
  return (
    <RouteLoadingState
      description="Preparing your protected member workspace, drafts, and contribution records."
      title="Loading Member Workspace"
    />
  );
}
