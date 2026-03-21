import { collection, doc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/application/lib/firebase";
import { encryptItemPayload, decryptItemPayload } from "@/application/utils/crypto";
import type { InventoryItem } from "@/domain/models/inventory-management-types";
import { toast } from "sonner"; // 🌟 トーストを追加

export type SyncMode = 'none' | 'standard' | 'e2ee';

export const SyncService = {
    // クラウドへ送信（Push）
    pushItem: async (item: InventoryItem, userId: string | null, masterKey: CryptoKey | null, syncMode: SyncMode) => {
        if (syncMode === 'none' || !userId || !masterKey) return;

        try {
            console.log(`⏳ [${item.name}] 1. 暗号化処理を開始します...`);
            const { payload, iv } = await encryptItemPayload(item, masterKey);

            console.log(`⏳ [${item.name}] 2. Firestoreへの通信を開始します...`);
            await setDoc(doc(db, `users/${userId}/items/${item.id}`), {
                payload,
                iv,
                updatedAt: new Date().toISOString()
            });

            console.log(`✅ [${item.name}] 3. アップロード完了！`);
        } catch (e) {
            // 🌟 エラーが起きたら、画面とコンソールの両方にデカデカと出す！
            console.error(`❌ クラウド同期失敗 [${item.name}]:`, e);
            toast.error(`「${item.name}」の送信に失敗しました。コンソールを確認してください。`);
        }
    },

    // クラウドから削除
    deleteItem: async (id: string, userId: string | null, syncMode: SyncMode) => {
        if (syncMode === 'none' || !userId) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/items/${id}`));
        } catch (e) {
            console.error("クラウド削除失敗:", e);
        }
    },

    // リアルタイム監視（Pull）
    startPullSync: (
        userId: string,
        masterKey: CryptoKey,
        onUpdate: (updatedItems: InventoryItem[], removedIds: string[]) => void
    ): Unsubscribe => {
        const itemsRef = collection(db, `users/${userId}/items`);

        return onSnapshot(itemsRef, async (snapshot) => {
            const updatedItems: InventoryItem[] = [];
            const removedIds: string[] = [];

            for (const change of snapshot.docChanges()) {
                if (change.type === 'added' || change.type === 'modified') {
                    const docData = change.doc.data();
                    try {
                        const decryptedItem = await decryptItemPayload<InventoryItem>(
                            docData.payload,
                            docData.iv,
                            masterKey
                        );
                        updatedItems.push(decryptedItem);
                    } catch (e) {
                        console.error("復号エラー:", e);
                    }
                }
                if (change.type === 'removed') {
                    removedIds.push(change.doc.id);
                }
            }

            if (updatedItems.length > 0 || removedIds.length > 0) {
                onUpdate(updatedItems, removedIds);
            }
        });
    },

    // 設定の取得
    getSyncConfig: async (userId: string) => {
        // ... (既存のコードそのまま)
        const { getDoc } = await import("firebase/firestore");
        try {
            const docSnap = await getDoc(doc(db, `users/${userId}/syncConfig/latest`));
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (e) {
            console.error("設定の取得に失敗:", e);
            return null;
        }
    },

    // 設定の保存
    saveSyncConfig: async (userId: string, config: any): Promise<void> => {
        // ... (既存のコードそのまま)
        try {
            await setDoc(doc(db, `users/${userId}/syncConfig/latest`), config);
        } catch (e) {
            console.error("設定の保存に失敗:", e);
            throw e;
        }
    }
};