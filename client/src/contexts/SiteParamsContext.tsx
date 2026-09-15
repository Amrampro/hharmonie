import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { parameterService, type Parameters } from "../services/parameterService";

type SiteParamsState = {
  parameters: Parameters | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SiteParamsContext = createContext<SiteParamsState | null>(null);

export function SiteParamsProvider({ children }: { children: React.ReactNode }) {
  const [parameters, setParameters] = useState<Parameters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const { parameters } = await parameterService.get();
      setParameters(parameters || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load site parameters");
      setParameters(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({ parameters, loading, error, refresh }),
    [parameters, loading, error]
  );

  return <SiteParamsContext.Provider value={value}>{children}</SiteParamsContext.Provider>;
}

export function useSiteParams() {
  const ctx = useContext(SiteParamsContext);
  if (!ctx) throw new Error("useSiteParams must be used within SiteParamsProvider");
  return ctx;
}
