import {create} from "zustand";
import type {InventoryItem, PurchaseRecord} from "@/domain/models/inventory-management-types";
import type {InventoryRepository} from "@/domain/repositories/inventory-repository-interface";
import {LocalStorageInventoryRepository} from "@/infrastructure/repositories/local-storage-inventory-manager";
import {
    createInventoryItem,
    createPurchaseRecord,
    getDaysUntilExpiry,
    getLowestPrice,
    getUniqueHistoryItems,
    isExpired,
    isExpiringSoon,
    isLowStock,
    type AddItemInput,
} from "@/application/use-cases/InventoryManagementUtils";
import { toast } from "sonner";

type InventoryState = {
    items: InventoryItem[];
    history: PurchaseRecord[];
    hydrated: boolean;

    hydrate: () => Promise<void>;

    addItem: (input: AddItemInput) => InventoryItem;
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;

    consumeCount: (id: string) => void;
    setVolumeLevel: (id: string, level: number) => void;

    archiveItem: (id: string) => void;
    unarchiveItem: (id: string) => void;
    deleteItem: (id: string) => void;

    reAddFromHistory: (record: PurchaseRecord) => InventoryItem;

    // selectors / derived helpers
    activeItems: () => InventoryItem[];
    archivedItems: () => InventoryItem[];
    getLowestPrice: (name: string) => number | null;
    getUniqueHistoryItems: () => PurchaseRecord[];
    isLowStock: (item: InventoryItem) => boolean;
    isExpiringSoon: (item: InventoryItem) => boolean;
    isExpired: (item: InventoryItem) => boolean;
    getDaysUntilExpiry: (item: InventoryItem) => number | null;
};

const repo: InventoryRepository = new LocalStorageInventoryRepository();

async function persist(items: InventoryItem[], history: PurchaseRecord[]) {
    // オフライン/PWAでも成立（localStorage）
    await Promise.all([repo.saveInventory(items), repo.saveHistory(history)]);
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    items: [],
    history: [],
    hydrated: false,

    hydrate: async () => {
        const [items, history] = await Promise.all([repo.loadInventory(), repo.loadHistory()]);
        set({items, history, hydrated: true});
    },

    addItem: (input) => {
        const item = createInventoryItem({
            ...input,
            name: input.name.trim(),
            brand: input.brand.trim(),
        });
        const record = createPurchaseRecord(item);

        const nextItems = [item, ...get().items];
        const nextHistory = [record, ...get().history];

        set({items: nextItems, history: nextHistory});
        void persist(nextItems, nextHistory);

        return item;
    },

    updateItem: (id, updates) => {
        const nextItems = get().items.map((it) => (it.id === id ? {...it, ...updates} : it));
        set({items: nextItems});
        void persist(nextItems, get().history);
    },

    consumeCount: (id) => {
        const nextItems = get().items.map((it) => {
            if (it.id !== id) return it;
            if (!(it.type === "count" || it.type === "both")) return it;
            if (it.count <= 0) return it;
            return {...it, count: it.count - 1};
        });
        set({items: nextItems});
        void persist(nextItems, get().history);
    },

    setVolumeLevel: (id, level) => {
        const nextItems = get().items.map((it) => {
            if (it.id !== id) return it;
            if (!(it.type === "volume" || it.type === "both")) return it;

            // 「ストック＋残量(both)」タイプで、残量を 0（空）にしようとした場合
            if (it.type === "both" && level === 0) {
                if (it.count > 0) {
                    // ストックがある場合：ストックを -1 して、残量を 5(満タン) にする
                    toast.success(`「${it.name}」のストックを1つ開封しました`, {
                        description: `未開封ストックは残り ${it.count - 1} 個です。`
                    });

                    return {
                        ...it,
                        count: it.count - 1,
                        volumeLevel: 5,
                        // 必要であれば開封日を今日に自動更新することも可能
                        openedDate: new Date().toISOString().split('T')[0]
                    };
                } else {
                    // ストックがない場合：そのまま 0（空）にする
                    toast.error(`「${it.name}」を使い切りました。在庫がありません！`);
                    return { ...it, volumeLevel: 0 };
                }
            }

            // 通常の残量変更（または volume タイプの場合）
            return {...it, volumeLevel: level};
        });
        set({items: nextItems});
        void persist(nextItems, get().history);
    },

    archiveItem: (id) => {
        const nextItems = get().items.map((it) => (it.id === id ? {...it, isArchived: true} : it));
        set({items: nextItems});
        void persist(nextItems, get().history);
    },

    unarchiveItem: (id) => {
        const nextItems = get().items.map((it) => (it.id === id ? {...it, isArchived: false} : it));
        set({items: nextItems});
        void persist(nextItems, get().history);
    },

    deleteItem: (id) => {
        const nextItems = get().items.filter((it) => it.id !== id);
        set({items: nextItems});
        void persist(nextItems, get().history);
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
        });
    },

    activeItems: () => get().items.filter((it) => !it.isArchived),
    archivedItems: () => get().items.filter((it) => it.isArchived),

    getLowestPrice: (name) => getLowestPrice(get().history, name),
    getUniqueHistoryItems: () => getUniqueHistoryItems(get().history),

    isLowStock: (item) => isLowStock(item),
    isExpiringSoon: (item) => isExpiringSoon(item),
    isExpired: (item) => isExpired(item),
    getDaysUntilExpiry: (item) => getDaysUntilExpiry(item),
}));
