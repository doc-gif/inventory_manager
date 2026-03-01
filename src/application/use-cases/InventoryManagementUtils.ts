import type { Category, InventoryItem, ItemType, PurchaseRecord } from "@/domain/models/inventory-management-types";

export type AddItemInput = {
  name: string;
  brand: string;
  type: ItemType;
  category: Category;
  count: number;
  volumeLevel: number;
  price: number;
  purchaseDate: string;
  openedDate: string | null;
  expiryDays: number | null;
  lowThreshold: number;
  barcode?: string | null;
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function createInventoryItem(input: AddItemInput): InventoryItem {
  const nowIso = new Date().toISOString();
  return {
    id: generateId(),
    name: input.name,
    brand: input.brand,
    type: input.type,
    category: input.category,
    count: input.count,
    volumeLevel: input.volumeLevel,
    price: input.price,
    purchaseDate: input.purchaseDate,
    openedDate: input.openedDate,
    expiryDays: input.expiryDays,
    lowThreshold: input.lowThreshold,
    barcode: input.barcode ?? null,
    isArchived: false,
    createdAt: nowIso,
  };
}

export function createPurchaseRecord(item: InventoryItem): PurchaseRecord {
  return {
    id: generateId(),
    itemId: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    purchaseDate: item.purchaseDate,
    type: item.type,
    category: item.category,
  };
}

export function isLowStock(item: InventoryItem): boolean {
  if (item.type === "count") return item.count <= item.lowThreshold;
  if (item.type === "volume") return item.volumeLevel <= 2;
  return item.count <= item.lowThreshold || item.volumeLevel <= 2;
}

export function isExpiringSoon(item: InventoryItem): boolean {
  if (!item.openedDate || !item.expiryDays) return false;
  const opened = new Date(item.openedDate);
  const expiry = new Date(opened.getTime() + item.expiryDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft <= 7 && daysLeft >= 0;
}

export function isExpired(item: InventoryItem): boolean {
  if (!item.openedDate || !item.expiryDays) return false;
  const opened = new Date(item.openedDate);
  const expiry = new Date(opened.getTime() + item.expiryDays * 24 * 60 * 60 * 1000);
  return new Date() > expiry;
}

export function getDaysUntilExpiry(item: InventoryItem): number | null {
  if (!item.openedDate || !item.expiryDays) return null;
  const opened = new Date(item.openedDate);
  const expiry = new Date(opened.getTime() + item.expiryDays * 24 * 60 * 60 * 1000);
  return Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export function getLowestPrice(history: PurchaseRecord[], name: string): number | null {
  const matching = history.filter((h) => h.name.toLowerCase() === name.toLowerCase() && h.price > 0);
  if (matching.length === 0) return null;
  return Math.min(...matching.map((h) => h.price));
}

export function getUniqueHistoryItems(history: PurchaseRecord[]): PurchaseRecord[] {
  const seen = new Map<string, PurchaseRecord>();
  for (const record of history) {
    const key = `${record.name}_${record.brand}`.toLowerCase();
    if (!seen.has(key)) seen.set(key, record);
  }
  return Array.from(seen.values());
}
