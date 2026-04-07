"use client";

import { useEffect } from "react";

import type { Route } from "next";

import { RoutePage } from "@/components/shell/route-page";
import { Button, ButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

import styles from "./route-state.module.css";

type RouteErrorStateProps = {
  description: string;
  error: Error & { digest?: string };
  primaryHref: Route;
  primaryLabel: string;
  title: string;
  unstable_retry: () => void;
};

export function RouteErrorState({
  description,
  error,
  primaryHref,
  primaryLabel,
  title,
  unstable_retry,
}: RouteErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RoutePage
      badges={[{ label: "Needs Attention", tone: "red" }]}
      description={description}
      eyebrow="Recovery State"
      title={title}
    >
      <Surface>
        <div className={styles.stack}>
          <p>
            The workspace hit an unexpected problem. You can retry the current segment or move to
            a stable route while keeping the rest of the app structure intact.
          </p>
          <div className={styles.actions}>
            <Button onClick={() => unstable_retry()} type="button">
              Try Again
            </Button>
            <ButtonLink href={primaryHref} variant="outline">
              {primaryLabel}
            </ButtonLink>
          </div>
        </div>
      </Surface>
    </RoutePage>
  );
}
