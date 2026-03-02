import type { InventoryItem } from "@/domain/models/inventory-management-types";
import type { BarcodeProductSuggestion } from "@/domain/models/barcode_product_suggestion_type";
import { lookupBarcodeViaFunctions } from "@/infrastructure/api/barcodeLookupClient";
import { getCachedBarcodeSuggestion, setCachedBarcodeSuggestion } from "@/infrastructure/repositories/local_storage_barcode_suggestion_cache";

export type BarcodeLookupResult =
    | { kind: "HIT_HISTORY"; suggestion: BarcodeProductSuggestion }
    | { kind: "HIT_CACHE"; suggestion: BarcodeProductSuggestion }
    | { kind: "HIT_REMOTE"; suggestion: BarcodeProductSuggestion }
    | { kind: "NOT_FOUND" }
    | { kind: "FAILED"; reason: "NETWORK" | "RATE_LIMIT" | "INVALID" | "SERVER" };

export async function lookupBarcodeForAddProduct(params: {
  barcode: string;
  items: InventoryItem[];
}): Promise<BarcodeLookupResult> {
  const { barcode, items } = params;

  // 1) ローカル（過去商品）ヒット
  const hit = items.find((it) => it.barcode === barcode);
  if (hit) {
    return {
      kind: "HIT_HISTORY",
      suggestion: {
        barcode,
        name: hit.name,
        brand: hit.brand,
        category: hit.category,
        type: hit.type,
        contentAmount: hit.contentAmount,
        contentUnit: hit.contentUnit,
        confidence: "high",
        source: "history",
      },
    };
  }

  // 2) キャッシュヒット（オンライン不要）
  const cached = getCachedBarcodeSuggestion(barcode);
  if (cached) {
    return { kind: "HIT_CACHE", suggestion: cached };
  }

  // 3) リモート（Functions）
  const remote = await lookupBarcodeViaFunctions(barcode);
  if (remote.ok) {
    setCachedBarcodeSuggestion({ barcode, suggestion: remote.suggestion });
    return { kind: "HIT_REMOTE", suggestion: remote.suggestion };
  }

  // ここから先は remote.ok === false が確定するので remote.reason が安全に参照できる
  // @ts-ignore
  if (remote.reason === "NOT_FOUND") {
    return { kind: "NOT_FOUND" };
  }

  // @ts-ignore
  return { kind: "FAILED", reason: remote.reason };
}