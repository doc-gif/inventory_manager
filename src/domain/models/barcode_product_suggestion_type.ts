import type { Category, ContentUnit, ItemType } from "@/domain/models/inventory-management-types";

/**
 * Firebase Functions が返す「入力候補」。
 * ここでは AddProduct のフォームにそのまま流し込める形を狙う。
 */
export type BarcodeProductSuggestion = {
  barcode: string;

  name?: string;
  brand?: string;

  // 任意：分かれば埋める
  category?: Category;
  type?: ItemType;

  // 内容量が推測できた場合
  contentAmount?: number;
  contentUnit?: ContentUnit;

  // 補助情報（説明や画像URLなどは将来拡張）
  confidence?: "high" | "medium" | "low";
  source?: "history" | "external_db" | "web_ai" | "unknown";
};
