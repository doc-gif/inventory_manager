import React from "react";
import { useNavigate } from "react-router";
import { Plus, Package, Search, AlertTriangle, ChevronDown } from "lucide-react";

import { CATEGORIES } from "@/domain/models/inventory-management-types";
import { useInventoryStore } from "@/application/stores/useInventoryStore";

import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { InventoryCard } from "@/presentation/components/InventoryCard";

export function InventoryList() {
    const navigate = useNavigate();

    const items = useInventoryStore((s) => s.items);
    const isLowStock = useInventoryStore((s) => s.isLowStock);
    const getUniqueShops = useInventoryStore((s) => s.getUniqueShops);
    const activeItems = React.useMemo(() => items.filter((it) => !it.isArchived), [items]);
    const uniqueShops = getUniqueShops();

    const [search, setSearch] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [selectedShop, setSelectedShop] = React.useState<string | null>(null);
    const [showLowOnly, setShowLowOnly] = React.useState(false);

    const filteredItems = React.useMemo(() => {
        let result = activeItems;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter((item) => item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q));
        }
        if (selectedCategory) result = result.filter((item) => item.category === selectedCategory);
        if (selectedShop) result = result.filter((item) => item.shop === selectedShop);
        if (showLowOnly) result = result.filter((item) => isLowStock(item));

        return result;
    }, [activeItems, search, selectedCategory, selectedShop, showLowOnly, isLowStock]);

    return (
        <div className="pb-24">
            {/* 🌟 改善: ヘッダー＆フィルター領域の再設計 */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-4 pb-3">

                {/* 1. タイトルと追加ボタン */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="flex items-center gap-2 font-bold">
                            <Package className="w-5 h-5 text-primary" />
                            在庫管理
                        </h1>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{activeItems.length}件の商品を管理中</p>
                    </div>
                    <Button onClick={() => navigate("/add")} className="rounded-xl gap-1.5 h-9 px-3 shadow-sm" size="sm">
                        <Plus className="w-4 h-4" />
                        追加
                    </Button>
                </div>

                {/* 2. 検索バー ＆ 在庫少トグル */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="商品名やブランド名..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-11 rounded-xl bg-muted/30 border-border/50 text-sm focus:bg-background"
                        />
                    </div>
                    {/* 💡 改善: 「在庫少」を独立したON/OFFのスイッチ（ボタン）として明示 */}
                    <button
                        type="button"
                        onClick={() => setShowLowOnly(!showLowOnly)}
                        className={`shrink-0 flex items-center justify-center gap-1.5 px-3 h-11 rounded-xl border transition-all duration-200 ${
                            showLowOnly
                                ? "bg-red-50 border-red-200 text-red-600 shadow-sm"
                                : "bg-background border-border/50 text-muted-foreground hover:bg-muted/30"
                        }`}
                    >
                        <AlertTriangle className={`w-4 h-4 ${showLowOnly ? "text-red-600" : ""}`} />
                        <span className="text-xs font-bold">在庫少</span>
                    </button>
                </div>

                {/* 3. カテゴリ ＆ お店ドロップダウン（横並び2分割） */}
                <div className="flex gap-2">
                    {/* カテゴリ */}
                    <div className="relative flex-1">
                        <select
                            value={selectedCategory || ""}
                            onChange={(e) => setSelectedCategory(e.target.value || null)}
                            className="w-full h-10 appearance-none bg-muted/20 border border-border/50 rounded-xl pl-3 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        >
                            <option value="">カテゴリ: すべて</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* お店 (登録されたお店がある時だけ表示、ない時はカテゴリが全幅になります) */}
                    {uniqueShops.length > 0 && (
                        <div className="relative flex-1">
                            <select
                                value={selectedShop || ""}
                                onChange={(e) => setSelectedShop(e.target.value || null)}
                                className="w-full h-10 appearance-none bg-muted/20 border border-border/50 rounded-xl pl-3 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                            >
                                <option value="">お店: すべて</option>
                                {uniqueShops.map((shop) => (
                                    <option key={shop} value={shop}>{shop}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* リスト表示領域 */}
            <div className="px-4 pt-4 space-y-3">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        {activeItems.length === 0 ? (
                            <div className="text-center">
                                <p className="font-medium text-foreground mb-1">まだ商品が登録されていません</p>
                                <p className="text-xs">右上の「追加」ボタンから登録しましょう</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="font-medium text-foreground mb-1">見つかりませんでした</p>
                                <p className="text-xs">検索条件やフィルターを変更してください</p>
                            </div>
                        )}
                    </div>
                ) : (
                    filteredItems.map((item) => <InventoryCard key={item.id} item={item} />)
                )}
            </div>
        </div>
    );
}