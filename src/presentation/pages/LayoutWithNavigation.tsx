import { Outlet, ScrollRestoration } from "react-router";
import { Toaster, toast } from "sonner";
import React,{ useEffect } from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/application/lib/firebase";
import { SyncService } from "@/application/services/SyncService";
import { useInventoryStore } from "@/application/stores/useInventoryStore";
import { importKeyFromBase64 } from "@/application/utils/crypto";

import { useHydrateInventory } from "@/presentation/hooks/useHydrateInventory";
import { InstallPrompt } from "@/presentation/components/InstallPrompt";
import { ReloadPrompt } from "@/presentation/components/ReloadPrompt";

export function LayoutPage() {
    useHydrateInventory();

    // 🌟 改善: アプリ起動時に自動で同期を再開する（Auto Restore）
    const { syncMode, setSyncConfig } = useInventoryStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // ログイン済みだが、リロード等でZustandの同期が切れている場合
            if (user && syncMode === 'none') {
                try {
                    const config = await SyncService.getSyncConfig(user.uid);
                    if (config && config.syncMode === 'standard' && config.masterKeyBase64) {
                        // 標準モードなら自動で鍵を復元して同期再開！
                        const masterKey = await importKeyFromBase64(config.masterKeyBase64);
                        setSyncConfig(user.uid, masterKey, 'standard');
                        console.log("🔄 バックグラウンドで標準同期を再開しました");
                    } else if (config && config.syncMode === 'e2ee') {
                        // E2EEの場合はパスワードが必要なため、通知を出す
                        toast.info("同期を再開するには設定画面からパスワードを入力してください", {
                            duration: 5000,
                        });
                    }
                } catch (e) {
                    console.error("自動復元エラー:", e);
                }
            }
        });
        return () => unsubscribe();
    }, [syncMode, setSyncConfig]);

    return (
        // 🌟 改善: overflow-x-hidden を削除しました。
        // これにより、HomePage などの子コンポーネントに設定されている `sticky`（上部固定）が正しく機能するようになります。
        <div className="min-h-screen bg-background font-[Noto_Sans_JP,sans-serif] max-w-lg mx-auto relative">
            <ScrollRestoration />

            <Outlet />

            <InstallPrompt />
            <ReloadPrompt />

            <Toaster
                position="bottom-center"
                offset="80px"
                toastOptions={{
                    style: {
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                }}
            />
        </div>
    );
}