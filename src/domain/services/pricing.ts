import type { ContentUnit, InventoryItem } from "@/domain/models/inventory-management-types";

export type UnitPrice = {
    unit: ContentUnit;
    /** 基準量（pcs=1, ml/g=100） */
    baseAmount: number;
    /** その基準量あたりの価格 */
    pricePerBase: number;
    /** 表示用（例: "¥98 / 100ml"） */
    label: string;
};

function formatYen(value: number) {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(value);
}

function unitLabel(unit: ContentUnit) {
    return unit === "pcs" ? "本" : unit;
}

export function getUnitPrice(
    item: Pick<InventoryItem, "price" | "contentAmount" | "contentUnit">,
): UnitPrice | null {
    const amount = item.contentAmount;
    const unit = item.contentUnit;

    if (!unit) return null;
    if (amount === undefined || amount === null) return null;
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const price = item.price ?? 0;
    if (!Number.isFinite(price) || price <= 0) return null;

    const baseAmount = unit === "pcs" ? 1 : 100;

    // 例）price=198, amount=300ml → 198 / 300 * 100 = 66円/100ml
    const raw = (price / amount) * baseAmount;

    // 見やすさ重視で丸め（円表示なので0桁でもOKだが、安い商品だと小数が出るので少し残す）
    const rounded =
        unit === "pcs" ? Math.round(raw * 10) / 10 : Math.round(raw); // pcsは小数1桁、ml/gは基本整数円

    return {
        unit,
        baseAmount,
        pricePerBase: rounded,
        label: `${formatYen(rounded)} / ${baseAmount}${unitLabel(unit)}`,
    };
}

export function formatContent(amount?: number, unit?: ContentUnit): string | null {
    if (!unit) return null;
    if (amount === undefined || amount === null) return null;
    if (!Number.isFinite(amount) || amount <= 0) return null;

    return `${amount}${unitLabel(unit)}`;
}