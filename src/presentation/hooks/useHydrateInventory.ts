import * as React from "react";
import { useInventoryStore } from "@/application/stores/useInventoryStore";

export function useHydrateInventory() {
  const hydrated = useInventoryStore((s) => s.hydrated);
  const hydrate = useInventoryStore((s) => s.hydrate);

  React.useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  return hydrated;
}
