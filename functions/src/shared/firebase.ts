import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// アプリが未初期化の場合のみ初期化する
if (!admin.apps.length) {
    admin.initializeApp();
}

export const db = getFirestore();