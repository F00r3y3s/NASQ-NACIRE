"use client";

import type { ReactNode } from "react";

import { SupabaseBrowserProvider } from "@/components/providers/supabase-browser-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <SupabaseBrowserProvider>{children}</SupabaseBrowserProvider>;
}

