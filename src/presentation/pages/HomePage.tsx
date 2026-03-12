import React, { useState } from "react";
import { Package, ShoppingCart } from "lucide-react";
import { InventoryList } from "@/presentation/components/InventoryList";
import { ShoppingList } from "@/presentation/components/ShoppingList";

export function HomePage() {
    const [activeTab, setActiveTab] = useState<"inventory" | "shopping">("inventory");

    return (
        <div className="flex flex-col h-full">
            {/* 上部固定のタブ切り替えナビゲーション */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pt-3 pb-3 px-4">
                <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
                    <button
                        type="button"
                        onClick={() => setActiveTab("inventory")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "inventory"
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        在庫一覧
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("shopping")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "shopping"
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        買い物リスト
                    </button>
                </div>
            </div>

            {/* タブに応じたコンテンツの表示 */}
            <div className="flex-1">
                {activeTab === "inventory" ? <InventoryList /> : <ShoppingList />}
            </div>
        </div>
    );
}