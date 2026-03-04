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

  // @ts-ignore
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${baseUrl}/barcodeLookup?barcode=${encodeURIComponent(barcode)}`;

  try {
    const res = await fetch(url, { method: "GET" });

    if (res.status === 404) return { ok: false, reason: "NOT_FOUND" };
    if (res.status === 429) return { ok: false, reason: "RATE_LIMIT" };
    if (!res.ok) return { ok: false, reason: "SERVER" };

    // 1. data を直接 BarcodeProductSuggestion として受け取る
    const data = (await res.json()) as BarcodeProductSuggestion;

    // 2. data 自体が存在するか、または商品名(name)が取れているかで判定する
    if (!data || !data.name) return { ok: false, reason: "NOT_FOUND" };

    // 3. data そのものを suggestion として返す
    return { ok: true, suggestion: data };
  } catch {
    return { ok: false, reason: "NETWORK" };
  }
}