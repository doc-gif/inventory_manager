import type { InventoryRepository } from "@/domain/repositories/inventory-repository-interface";
import type { InventoryItem, PurchaseRecord } from "@/domain/models/inventory-management-types";

const INVENTORY_KEY = "stockkeeper_inventory";
const HISTORY_KEY = "stockkeeper_history";

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export class LocalStorageInventoryRepository implements InventoryRepository {
  async loadInventory(): Promise<InventoryItem[]> {
    return safeParseJson<InventoryItem[]>(localStorage.getItem(INVENTORY_KEY), []);
  }

  async saveInventory(items: InventoryItem[]): Promise<void> {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  }

  async loadHistory(): Promise<PurchaseRecord[]> {
    return safeParseJson<PurchaseRecord[]>(localStorage.getItem(HISTORY_KEY), []);
  }

  async saveHistory(records: PurchaseRecord[]): Promise<void> {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  }
}
