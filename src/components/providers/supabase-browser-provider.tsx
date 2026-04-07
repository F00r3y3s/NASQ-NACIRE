"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicEnvironment } from "@/config/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const SupabaseBrowserContext = createContext<SupabaseClient | null>(null);

type SupabaseBrowserProviderProps = {
  children: ReactNode;
};

export function SupabaseBrowserProvider({
  children,
}: SupabaseBrowserProviderProps) {
  const [client] = useState(() => {
    const env = readSupabasePublicEnvironment();

    return env ? createSupabaseBrowserClient(env) : null;
  });

  return (
    <SupabaseBrowserContext.Provider value={client}>
      {children}
    </SupabaseBrowserContext.Provider>
  );
}

export function useSupabaseBrowserClient() {
  return useContext(SupabaseBrowserContext);
}

