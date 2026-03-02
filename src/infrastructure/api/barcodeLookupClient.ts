import type { BarcodeProductSuggestion } from "@/domain/models/barcode_product_suggestion_type";

export type BarcodeLookupResponse =
    | { ok: true; suggestion: BarcodeProductSuggestion }
    | { ok: false; reason: "NOT_FOUND" | "NETWORK" | "RATE_LIMIT" | "INVALID" | "SERVER" };

function isProbablyBarcode(code: string) {
  return /^[0-9]{8,14}$/.test(code);
}

export async function lookupBarcodeViaFunctions(barcodeRaw: string): Promise<BarcodeLookupResponse> {
  const barcode = barcodeRaw.trim();

  if (!isProbablyBarcode(barcode)) {
    return { ok: false, reason: "INVALID" };
  }

  // Firebase Hosting の rewrite で Functions に繋ぐ想定：
  // 例: /api/barcodeLookup -> cloud functions
  const url = `/api/barcodeLookup?barcode=${encodeURIComponent(barcode)}`;

  try {
    const res = await fetch(url, { method: "GET" });

    if (res.status === 404) return { ok: false, reason: "NOT_FOUND" };
    if (res.status === 429) return { ok: false, reason: "RATE_LIMIT" };
    if (!res.ok) return { ok: false, reason: "SERVER" };

    const data = (await res.json()) as { suggestion?: BarcodeProductSuggestion | null };
    if (!data?.suggestion) return { ok: false, reason: "NOT_FOUND" };

    return { ok: true, suggestion: data.suggestion };
  } catch {
    return { ok: false, reason: "NETWORK" };
  }
}