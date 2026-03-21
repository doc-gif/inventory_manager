import { StateCreator } from "zustand";
import { toast } from "sonner";
import { StoreState } from "../useInventoryStore";
import { SyncService } from "../../services/SyncService";
import type { ContentUnit, InventoryItem, PurchaseRecord } from "@/domain/models/inventory-management-types";
import { LocalStorageInventoryRepository } from "@/infrastructure/repositories/local-storage-inventory-manager";
import { createInventoryItem, createPurchaseRecord, type AddItemInput } from "@/application/use-cases/InventoryManagementUtils";

const repo = new LocalStorageInventoryRepository();

// ローカルストレージへの保存処理
async function persistLocally(items: InventoryItem[], history: PurchaseRecord[]) {
    await Promise.all([repo.saveInventory(items), repo.saveHistory(history)]);
}

export interface ItemSlice {
    items: InventoryItem[];
    history: PurchaseRecord[];
    hydrated: boolean;

    hydrate: () => Promise<void>;
    applySyncUpdates: (updatedItems: InventoryItem[], removedIds: string[]) => void;
    addItem: (input: AddItemInput) => InventoryItem;
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;
    consumeCount: (id: string) => void;
    setVolumeLevel: (id: string, level: number) => void;
    archiveItem: (id: string) => void;
    unarchiveItem: (id: string) => void;
    deleteItem: (id: string) => void;
    reAddFromHistory: (record: PurchaseRecord) => InventoryItem;
}

export const createItemSlice: StateCreator<StoreState, [], [], ItemSlice> = (set, get) => ({
    items: [],
    history: [],
    hydrated: false,

    hydrate: async () => {
        const [items, history] = await Promise.all([repo.loadInventory(), repo.loadHistory()]);
        set({ items, history, hydrated: true });
    },

    // クラウド側で変更があった場合に呼ばれる（旧 onSnapshot 内の処理）
    applySyncUpdates: (updatedItems, removedIds) => {
        const currentItems = [...get().items];
        let hasChanges = false;

        updatedItems.forEach(newItem => {
            const index = currentItems.findIndex(i => i.id === newItem.id);
            if (index >= 0) {
                currentItems[index] = newItem;
            } else {
                currentItems.push(newItem);
            }
            hasChanges = true;
        });

        removedIds.forEach(id => {
            const index = currentItems.findIndex(i => i.id === id);
            if (index >= 0) {
                currentItems.splice(index, 1);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            set({ items: currentItems });
            void persistLocally(currentItems, get().history);
        }
    },

    addItem: (input) => {
        const normalizedName = input.name.trim();
        const normalizedBrand = input.brand.trim();

        const existingItemIndex = get().items.findIndex(
            (it) => it.name.toLowerCase() === normalizedName.toLowerCase()
        );

        let nextItems = [...get().items];
        let targetItem: InventoryItem;

        if (existingItemIndex >= 0) {
            const existing = nextItems[existingItemIndex];
            const countToAdd = (input.type === 'count' || input.type === 'both') ? input.count : 0;

            targetItem = {
                ...existing,
                type: input.type,
                category: input.category,
                count: existing.count + countToAdd,
                volumeLevel: input.type === 'volume' ? 5 : existing.volumeLevel,
                price: input.price,
                purchaseDate: input.purchaseDate,
                openedDate: input.openedDate || existing.openedDate,
                expiryDays: input.expiryDays || existing.expiryDays,
                lowThreshold: input.lowThreshold,
                barcode: input.barcode || existing.barcode,
                contentAmount: input.contentAmount || existing.contentAmount,
                contentUnit: (input.contentUnit as ContentUnit) || existing.contentUnit,
                shop: input.shop || existing.shop,
                isArchived: false,
            };
            nextItems[existingItemIndex] = targetItem;
        } else {
            targetItem = createInventoryItem({
                ...input,
                name: normalizedName,
                brand: normalizedBrand,
            });
            nextItems = [targetItem, ...nextItems];
        }

        const record = createPurchaseRecord(targetItem);
        const nextHistory = [record, ...get().history];

        set({ items: nextItems, history: nextHistory });
        void persistLocally(nextItems, nextHistory);

        const { userId, masterKey, syncMode } = get();
        void SyncService.pushItem(targetItem, userId, masterKey, syncMode);

        return targetItem;
    },

    updateItem: (id, updates) => {
        let updatedItem: InventoryItem | null = null;

        const nextItems = get().items.map((it) => {
            if (it.id === id) {
                updatedItem = { ...it, ...updates };
                return updatedItem;
            }
            return it;
        });

        let nextHistory = get().history;
        if (updatedItem && (updates.price !== undefined || updates.purchaseDate !== undefined || updates.shop !== undefined)) {
            const newRecord: PurchaseRecord = {
                id: crypto.randomUUID(),
                itemId: id,
                name: updatedItem.name,
                brand: updatedItem.brand,
                type: updatedItem.type,
                category: updatedItem.category,
                price: updatedItem.price,
                purchaseDate: updatedItem.purchaseDate,
                shop: updatedItem.shop,
            };
            nextHistory = [newRecord, ...nextHistory];
        }

        set({ items: nextItems, history: nextHistory });
        void persistLocally(nextItems, nextHistory);

        const { userId, masterKey, syncMode } = get();
        if (updatedItem) void SyncService.pushItem(updatedItem, userId, masterKey, syncMode);
    },

    consumeCount: (id) => {
        let updated: InventoryItem | null = null;
        const nextItems = get().items.map((it) => {
            if (it.id === id && (it.type === "count" || it.type === "both") && it.count > 0) {
                updated = { ...it, count: it.count - 1 };
                return updated;
            }
            return it;
        });
        set({ items: nextItems });
        void persistLocally(nextItems, get().history);

        const { userId, masterKey, syncMode } = get();
        if (updated) void SyncService.pushItem(updated, userId, masterKey, syncMode);
    },

    setVolumeLevel: (id, level) => {
        let updated: InventoryItem | null = null;
        const nextItems = get().items.map((it) => {
            if (it.id !== id || !(it.type === "volume" || it.type === "both")) return it;

            if (it.type === "both" && level === 0) {
                if (it.count > 0) {
                    toast.success(`「${it.name}」のストックを1つ開封しました`, {
                        description: `未開封ストックは残り ${it.count - 1} 個です。`
                    });
                    updated = { ...it, count: it.count - 1, volumeLevel: 5, openedDate: new Date().toISOString().split('T')[0] };
                    return updated;
                } else {
                    toast.error(`「${it.name}」を使い切りました。在庫がありません！`);
                    updated = { ...it, volumeLevel: 0 };
                    return updated;
                }
            }
            updated = { ...it, volumeLevel: level };
            return updated;
        });
        set({ items: nextItems });
        void persistLocally(nextItems, get().history);

        const { userId, masterKey, syncMode } = get();
        if (updated) void SyncService.pushItem(updated, userId, masterKey, syncMode);
    },

    archiveItem: (id) => {
        let updated: InventoryItem | null = null;
        const nextItems = get().items.map((it) => {
            if (it.id === id) {
                updated = { ...it, isArchived: true };
                return updated;
            }
            return it;
        });
        set({ items: nextItems });
        void persistLocally(nextItems, get().history);

        const { userId, masterKey, syncMode } = get();
        if (updated) void SyncService.pushItem(updated, userId, masterKey, syncMode);
    },

    unarchiveItem: (id) => {
        let updated: InventoryItem | null = null;
        const nextItems = get().items.map((it) => {
            if (it.id === id) {
                updated = { ...it, isArchived: false };
                return updated;
            }
            return it;
        });
        set({ items: nextItems });
        void persistLocally(nextItems, get().history);

        const { userId, masterKey, syncMode } = get();
        if (updated) void SyncService.pushItem(updated, userId, masterKey, syncMode);
    },

    deleteItem: (id) => {
        const nextItems = get().items.filter((it) => it.id !== id);
        set({ items: nextItems });
        void persistLocally(nextItems, get().history);

        const { userId, syncMode } = get();
        void SyncService.deleteItem(id, userId, syncMode);
    },

    reAddFromHistory: (record) => {
        return get().addItem({
            name: record.name,
            brand: record.brand,
            type: record.type,
            category: record.category,
            count: record.type === "count" || record.type === "both" ? 1 : 0,
            volumeLevel: record.type === "volume" || record.type === "both" ? 5 : 0,
            price: record.price,
            purchaseDate: new Date().toISOString().split("T")[0],
            openedDate: null,
            expiryDays: null,
            lowThreshold: record.type === "count" || record.type === "both" ? 2 : 1,
            shop: record.shop,
        });
    },
});