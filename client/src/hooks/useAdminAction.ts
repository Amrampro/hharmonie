import { useRef, useState } from "react";

export function useAdminAction() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function run(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’opération a échoué. Réessayez.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { error, busy, run };
}
