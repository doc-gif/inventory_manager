import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Viteの環境変数からFirebaseの設定を読み込む
const firebase = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASURMENT_ID,
};

// 1. Firebaseアプリの初期化
const app = initializeApp(firebase);

// 🌟 2. Firestoreの初期化（魔法のキャッシュ有効化設定）
// persistentLocalCache() を指定することで、取得したデータがブラウザ(IndexedDB)に保存され、
// 次回以降は「差分のみ」を通信するようになり、Read回数（コスト）が激減します。
const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

// 3. 認証機能(Googleログイン等)の初期化
const auth = getAuth(app);

export { app, db, auth };