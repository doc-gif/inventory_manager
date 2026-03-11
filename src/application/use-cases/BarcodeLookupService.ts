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

  // ==========================================
  // 1) 個人の履歴（ローカルの在庫データ）を最優先
  // ※ユーザー自身が名前や容量を独自に編集している可能性があるため、それを尊重する
  // ==========================================
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

  // ==========================================
  // 2) ネットワーク優先（Firestore / Rowy の最新データを取得）
  // ==========================================
  try {
    const remote = await lookupBarcodeViaFunctions(barcode);

    if (remote.ok) {
      // 取得に成功したら、ローカルキャッシュを「最新の正しいデータ」で上書きしておく
      setCachedBarcodeSuggestion({ barcode, suggestion: remote.suggestion });
      return { kind: "HIT_REMOTE", suggestion: remote.suggestion };
    }

    // 明確に「データベースに存在しない」とサーバーが返してきた場合
    // @ts-ignore
    if (remote.reason === "NOT_FOUND") {
      return { kind: "NOT_FOUND" };
    }

    // ここに到達するのは、レートリミット（API制限）やサーバーエラーの場合。
    // そのまま下のステップ3（キャッシュへのフォールバック）へ進む。
  } catch (error) {
    // 完全に圏外（オフライン）で通信自体が失敗した場合もここでキャッチされ、ステップ3へ進む
  }

  // ==========================================
  // 3) キャッシュへのフォールバック（オフライン時・サーバーエラー時の保険）
  // ==========================================
  const cached = getCachedBarcodeSuggestion(barcode);
  if (cached) {
    // サーバーと通信できなかったが、過去にスキャンした記憶（キャッシュ）がある場合はそれを返す
    return { kind: "HIT_CACHE", suggestion: cached };
  }

  // キャッシュも無ければ、完全な通信エラーとして扱う
  return { kind: "FAILED", reason: "NETWORK" };
}