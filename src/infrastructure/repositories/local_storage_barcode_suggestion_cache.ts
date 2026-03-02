import type { BarcodeProductSuggestion } from "@/domain/models/barcode_product_suggestion_type";

const CACHE_KEY = "barcode_suggestion_cache_v1";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14日

type CacheEntry = {
  value: BarcodeProductSuggestion;
  expiresAt: number;
  savedAt: number;
};

type CacheStore = Record<string, CacheEntry>;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadStore(): CacheStore {
  return safeParse<CacheStore>(localStorage.getItem(CACHE_KEY), {});
}

function saveStore(store: CacheStore) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(store));
}

export function getCachedBarcodeSuggestion(barcode: string): BarcodeProductSuggestion | null {
  const key = barcode.trim();
  if (!key) return null;

  const store = loadStore();
  const entry = store[key];
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    // 期限切れは掃除
    delete store[key];
    saveStore(store);
    return null;
  }

  return entry.value;
}

export function setCachedBarcodeSuggestion(params: {
  barcode: string;
  suggestion: BarcodeProductSuggestion;
  ttlMs?: number;
}) {
  const key = params.barcode.trim();
  if (!key) return;

  const store = loadStore();
  store[key] = {
    value: params.suggestion,
    savedAt: Date.now(),
    expiresAt: Date.now() + (params.ttlMs ?? DEFAULT_TTL_MS),
  };
  saveStore(store);
}

export function clearBarcodeSuggestionCache() {
  localStorage.removeItem(CACHE_KEY);
}
