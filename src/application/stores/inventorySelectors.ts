import type { InventoryItem, PurchaseRecord } from "@/domain/models/inventory-management-types";
import { getDaysUntilExpiry, getLowestPrice, getUniqueShops, isExpired, isExpiringSoon, isLowStock } from "@/application/use-cases/InventoryManagementUtils";

// 絞り込み
export const selectActiveItems = (items: InventoryItem[]) => items.filter((it) => !it.isArchived);

// 履歴・価格計算
export const selectLowestPrice = (history: PurchaseRecord[], name: string) => getLowestPrice(history, name);
export const selectUniqueShops = (items: InventoryItem[], history: PurchaseRecord[]) => getUniqueShops(items, history);

// ステータス判定（既存のUtilsをそのままexportして使いやすくします）
export { isLowStock, isExpiringSoon, isExpired, getDaysUntilExpiry };