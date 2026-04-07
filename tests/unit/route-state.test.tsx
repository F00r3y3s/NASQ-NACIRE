import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RouteErrorState } from "@/components/shell/route-error-state";
import { RouteLoadingState } from "@/components/shell/route-loading-state";

describe("route state surfaces", () => {
  it("renders a reusable loading workspace shell", () => {
    const html = renderToStaticMarkup(
      <RouteLoadingState
        description="Preparing protected records."
        title="Loading Workspace"
      />,
    );

    expect(html).toContain("Loading Workspace");
    expect(html).toContain("Preparing protected records.");
    expect(html).toContain("Preparing Records");
    expect(html).toContain("Preparing Detail Panel");
  });

  it("renders a retryable recovery state with a stable navigation escape hatch", () => {
    const html = renderToStaticMarkup(
      <RouteErrorState
        description="Retry the current segment or step back."
        error={new Error("boom")}
        primaryHref="/"
        primaryLabel="Return Home"
        title="Workspace Unavailable"
        unstable_retry={vi.fn()}
      />,
    );

    expect(html).toContain("Workspace Unavailable");
    expect(html).toContain("Retry the current segment or step back.");
    expect(html).toContain("Try Again");
    expect(html).toContain("Return Home");
  });
});
