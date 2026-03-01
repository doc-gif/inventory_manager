import type { InventoryItem, PurchaseRecord } from "@/domain/models/inventory-management-types";

export interface InventoryRepository {
  loadInventory(): Promise<InventoryItem[]>;
  saveInventory(items: InventoryItem[]): Promise<void>;

  loadHistory(): Promise<PurchaseRecord[]>;
  saveHistory(records: PurchaseRecord[]): Promise<void>;
}
