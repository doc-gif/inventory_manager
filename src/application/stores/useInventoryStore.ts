import {create} from "zustand";
import type {ContentUnit, InventoryItem, PurchaseRecord} from "@/domain/models/inventory-management-types";
import type {InventoryRepository} from "@/domain/repositories/inventory-repository-interface";
import {LocalStorageInventoryRepository} from "@/infrastructure/repositories/local-storage-inventory-manager";
import {
    createInventoryItem,
    createPurchaseRecord,
    getDaysUntilExpiry,
    getLowestPrice,
    getUniqueHistoryItems,
    getUniqueShops,
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
    getUniqueShops: () => string[];
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
        const normalizedName = input.name.trim();
        const normalizedBrand = input.brand.trim();

        // 1. 既存のアイテムを探す（名前の大文字・小文字を区別せずに完全一致するかチェック）
        const existingItemIndex = get().items.findIndex(
            (it) => it.name.toLowerCase() === normalizedName.toLowerCase()
        );

        let nextItems = [...get().items];
        let targetItem: InventoryItem;

        if (existingItemIndex >= 0) {
            // ==========================================
            // 💡 既存商品があった場合：新しく作らずに「合算・更新」する
            // ==========================================
            const existing = nextItems[existingItemIndex];

            // 新しく追加するストック数
            const countToAdd = (input.type === 'count' || input.type === 'both') ? input.count : 0;

            targetItem = {
                ...existing,
                // 管理タイプやカテゴリは、今回入力された最新のもので上書き
                type: input.type,
                category: input.category,

                // ストック数は既存の数に「足し算」する！
                count: existing.count + countToAdd,

                // 残量管理(volume)の場合は新品に交換したとみなして5(満タン)にする。
                // 詳細管理(both)の場合は、今使っているボトルの残量(existing.volumeLevel)を維持する。
                volumeLevel: input.type === 'volume' ? 5 : existing.volumeLevel,

                // 価格や購入日は最新のもので上書き
                price: input.price,
                purchaseDate: input.purchaseDate,

                // バーコードや内容量などの詳細設定は、入力があれば上書き、なければ既存を維持
                openedDate: input.openedDate || existing.openedDate,
                expiryDays: input.expiryDays || existing.expiryDays,
                lowThreshold: input.lowThreshold,
                barcode: input.barcode || existing.barcode,
                contentAmount: input.contentAmount || existing.contentAmount,
                contentUnit: (input.contentUnit as ContentUnit) || existing.contentUnit,
                shop: input.shop || existing.shop,

                // もし過去に使い切って「アーカイブ」されていたら、自動で復元する
                isArchived: false,
            };

            // 配列の該当箇所を上書き
            nextItems[existingItemIndex] = targetItem;
        } else {
            // ==========================================
            // 💡 既存商品がない場合：通常通り「新規作成」する
            // ==========================================
            targetItem = createInventoryItem({
                ...input,
                name: normalizedName,
                brand: normalizedBrand,
            });
            // 新しいアイテムを配列の先頭に追加
            nextItems = [targetItem, ...nextItems];
        }

        // 🚨 購入履歴（History）だけは、既存更新・新規作成に関わらず必ず「1回の履歴」として追加する
        const record = createPurchaseRecord(targetItem);
        const nextHistory = [record, ...get().history];

        set({items: nextItems, history: nextHistory});
        void persist(nextItems, nextHistory);

        return targetItem;
    },

    updateItem: (id, updates) => {
        let updatedItem: InventoryItem | null = null;

        // 1. 商品データの更新
        const nextItems = get().items.map((it) => {
            if (it.id === id) {
                updatedItem = { ...it, ...updates };
                return updatedItem;
            }
            return it;
        });

        let nextHistory = get().history;

        // 2. もし「価格」または「購入日」または「買った場所」が更新されていた場合、
        //    それを新しい購入履歴として history に追加する
        if (
            updatedItem &&
            (updates.price !== undefined || updates.purchaseDate !== undefined || updates.shop !== undefined)
        ) {
            // ※ここで既存の createPurchaseRecord を使っても良いですが、
            //   新しい情報（updates）を反映した履歴を手動で作ります。
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

            // 履歴の先頭に追加
            nextHistory = [newRecord, ...nextHistory];
        }

        // 3. 状態の更新と保存
        set({ items: nextItems, history: nextHistory });
        void persist(nextItems, nextHistory);
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
            shop: record.shop,
        });
    },

    activeItems: () => get().items.filter((it) => !it.isArchived),
    archivedItems: () => get().items.filter((it) => it.isArchived),

    getLowestPrice: (name) => getLowestPrice(get().history, name),
    getUniqueHistoryItems: () => getUniqueHistoryItems(get().history),
    getUniqueShops: () => getUniqueShops(get().items, get().history),

    isLowStock: (item) => isLowStock(item),
    isExpiringSoon: (item) => isExpiringSoon(item),
    isExpired: (item) => isExpired(item),
    getDaysUntilExpiry: (item) => getDaysUntilExpiry(item),
}));
