import { create } from "zustand";
import { createSyncSlice, type SyncSlice } from "./slices/createSyncSlice";
import { createItemSlice, type ItemSlice } from "./slices/createItemSlice";

// アプリケーション全体のZustand State型
export type StoreState = SyncSlice & ItemSlice;

// スライスを結合してストアを作成
export const useInventoryStore = create<StoreState>()((...a) => ({
    ...createSyncSlice(...a),
    ...createItemSlice(...a),
}));