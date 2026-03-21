import { StateCreator } from "zustand";
import { Unsubscribe } from "firebase/firestore";
import { StoreState } from "../useInventoryStore";
import { SyncService, type SyncMode } from "../../services/SyncService";

export interface SyncSlice {
    userId: string | null;
    masterKey: CryptoKey | null;
    syncMode: SyncMode;
    unsubscribeSnapshot: Unsubscribe | null;

    setSyncConfig: (userId: string, key: CryptoKey, mode: SyncMode) => void;
    startSync: () => void;
    stopSync: () => void;
}

export const createSyncSlice: StateCreator<StoreState, [], [], SyncSlice> = (set, get) => ({
    userId: null,
    masterKey: null,
    syncMode: 'none',
    unsubscribeSnapshot: null,

    setSyncConfig: (userId, key, mode) => {
        set({ userId, masterKey: key, syncMode: mode });
        get().startSync();
    },

    startSync: () => {
        const { userId, masterKey, unsubscribeSnapshot, applySyncUpdates } = get();
        if (!userId || !masterKey) return;

        if (unsubscribeSnapshot) unsubscribeSnapshot();

        // SyncServiceに監視を依頼し、変更があれば applySyncUpdates を呼ぶ
        const unsubscribe = SyncService.startPullSync(userId, masterKey, (updatedItems, removedIds) => {
            applySyncUpdates(updatedItems, removedIds);
        });

        set({ unsubscribeSnapshot: unsubscribe });
    },

    stopSync: () => {
        const { unsubscribeSnapshot } = get();
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
        }
        set({ userId: null, masterKey: null, syncMode: 'none', unsubscribeSnapshot: null });
    },
});