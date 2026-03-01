import React from "react";
import {useNavigate} from "react-router";
import {Plus, Package, Search, AlertTriangle} from "lucide-react";

import {CATEGORIES} from "@/domain/models/inventory-management-types";
import {useInventoryStore} from "@/application/stores/useInventoryStore";

import {Button} from "@/presentation/components/ui/Button";
import {Input} from "@/presentation/components/ui/Input";
import {InventoryCard} from "@/presentation/components/InventoryCard";

export function InventoryList() {
    const navigate = useNavigate();

    const items = useInventoryStore((s) => s.items);
    const isLowStock = useInventoryStore((s) => s.isLowStock);
    const activeItems = React.useMemo(() => items.filter((it) => !it.isArchived), [items]);

    const [search, setSearch] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [showLowOnly, setShowLowOnly] = React.useState(false);

    const filteredItems = React.useMemo(() => {
        let result = activeItems;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter((item) => item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q));
        }
        if (selectedCategory) result = result.filter((item) => item.category === selectedCategory);
        if (showLowOnly) result = result.filter((item) => isLowStock(item));

        return result;
    }, [activeItems, search, selectedCategory, showLowOnly, isLowStock]);

    const lowStockCount = React.useMemo(
        () => activeItems.filter((item) => isLowStock(item)).length,
        [activeItems, isLowStock],
    );

    return (
        <div className="pb-24">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="flex items-center gap-2">
                            <Package className="w-6 h-6 text-primary"/>
                            在庫管理
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">{activeItems.length}件の商品を管理中</p>
                    </div>
                    <Button onClick={() => navigate("/add")} className="rounded-full gap-1.5" size="sm">
                        <Plus className="w-4 h-4"/>
                        追加
                    </Button>
                </div>

                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input
                        placeholder="商品名・ブランド名で検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 rounded-full bg-muted/50"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setShowLowOnly(!showLowOnly)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                            showLowOnly ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        <AlertTriangle className="w-3 h-3"/>
                        在庫少 {lowStockCount > 0 && `(${lowStockCount})`}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                            !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        すべて
                    </button>

                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 pt-3 space-y-2">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Package className="w-12 h-12 mb-3 opacity-30"/>
                        {activeItems.length === 0 ? (
                            <>
                                <p>まだ商品が登録されていません</p>
                                <Button variant="outline" className="mt-4 gap-1.5" onClick={() => navigate("/add")}>
                                    <Plus className="w-4 h-4"/>
                                    最初の商品を追加
                                </Button>
                            </>
                        ) : (
                            <p>条件に一致する商品がありません</p>
                        )}
                    </div>
                ) : (
                    filteredItems.map((item) => <InventoryCard key={item.id} item={item}/>)
                )}
            </div>
        </div>
    );
}
