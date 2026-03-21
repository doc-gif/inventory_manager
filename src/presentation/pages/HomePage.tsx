import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Settings } from "lucide-react";
import { InventoryList } from "@/presentation/components/InventoryList";
import { ShoppingList } from "@/presentation/components/ShoppingList";
import { useInstallPrompt } from "@/presentation/hooks/useInstallPrompt";

export function HomePage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"inventory" | "shopping">("inventory");

    const { showPrompt } = useInstallPrompt();

    const today = new Date();
    const dateString = `${today.getMonth() + 1}月${today.getDate()}日（${['日', '月', '火', '水', '木', '金', '土'][today.getDay()]}）`;

    // Layout側のナビゲーションから送られてくる切り替え信号を受け取る
    useEffect(() => {
        const handleTabChange = (e: CustomEvent<"inventory" | "shopping">) => {
            setActiveTab(e.detail);
        };
        // @ts-ignore
        window.addEventListener('change-home-tab', handleTabChange);
        return () => {
            // @ts-ignore
            window.removeEventListener('change-home-tab', handleTabChange);
        };
    }, []);

    return (
        <div className="flex flex-col h-full relative pb-24">

            {/* 美しい日付ヘッダーと、iOSライクなセグメントコントロールを統合 */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/50 pt-6 pb-3 px-4">
                <div className="flex justify-between items-center mb-1 pl-1">
                    <p className="text-[11px] font-bold text-muted-foreground tracking-wider">
                        {dateString}
                    </p>
                    <button
                        onClick={() => navigate("/settings")}
                        className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors -mr-3 -mt-2 active:scale-95"
                        aria-label="設定"
                    >
                        {/* アイコン自体は少しだけ見やすく w-5 h-5 に調整 */}
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* 洗練されたリスト切り替えタブ */}
                <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50 mb-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab("inventory")}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === "inventory"
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        在庫一覧
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("shopping")}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === "shopping"
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        買い物リスト
                    </button>
                </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1">
                {activeTab === "inventory" ? <InventoryList /> : <ShoppingList />}
            </div>

            {/* 🌟 改善: プロンプト表示中はFABをスケールダウンさせて美しく隠すアニメーション */}
            <button
                type="button"
                onClick={() => navigate("/add")}
                className={`fixed right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center transition-all duration-300 ${
                    showPrompt
                        ? "bottom-8 scale-0 opacity-0 pointer-events-none" // 開いている時は小さく透明にして消す
                        : "bottom-8 scale-100 opacity-100 hover:scale-105 active:scale-95" // 閉じている時は通常表示
                }`}
            >
                <Plus className="w-6 h-6" />
            </button>

        </div>
    );
}