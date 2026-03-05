export type ItemType = "count" | "volume" | "both";

export type Category =
    | "日用品"
    | "食品・飲料"
    | "スキンケア・コスメ"
    | "医薬品・衛生用品"
    | "その他";

export const CATEGORIES: readonly Category[] = [
    "日用品",
    "食品・飲料",
    "スキンケア・コスメ",
    "医薬品・衛生用品",
    "その他",
] as const;

export const VOLUME_LABELS = ["空", "残りわずか", "半分以下", "半分以上", "十分"] as const;

export type VolumeLevel = 1 | 2 | 3 | 4 | 5;

/**
 * 商品パッケージの内容量の単位。
 * - pcs: 本数/個数（フロスピックなど）
 * - ml: 液体
 * - g: 質量（歯磨き粉など）
 */
export type ContentUnit = "pcs" | "ml" | "g";

export interface InventoryItem {
    id: string;
    name: string;
    brand: string;
    type: ItemType;
    category: Category;

    count: number; // type=count|both のとき有効
    volumeLevel: number; // 0..5（type=volume|both は 1..5 を想定、seed等の都合で 0 も許容）

    purchaseDate: string; // yyyy-mm-dd
    price: number;
    shop?: string;

    openedDate: string | null; // yyyy-mm-dd
    expiryDays: number | null;

    lowThreshold: number;
    barcode: string | null;

    /**
     * 内容量（例：100 pcs / 300 ml / 120 g）
     * 未入力の場合は undefined（既存データ互換のため optional）
     */
    contentAmount?: number;
    contentUnit?: ContentUnit;

    isArchived: boolean;
    createdAt: string; // ISO
}

export interface PurchaseRecord {
    id: string;
    itemId: string;

    name: string;
    brand: string;

    price: number;
    purchaseDate: string; // yyyy-mm-dd
    shop?: string;

    type: ItemType;
    category: Category;
}