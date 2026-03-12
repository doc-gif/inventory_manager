import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../shared/firebase";

// 毎日 深夜3:00 (日本時間) に実行される
export const processBarcodeQueue = onSchedule({
    schedule: "0 3 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
}, async (_) => {
    console.log("保留キューから本番データベースへの移行処理を開始します。");

    const queueSnapshot = await db.collection("products_queue").get();
    if (queueSnapshot.empty) {
        console.log("キューにデータはありませんでした。");
        return;
    }

    // Firestoreのバッチ処理（最大500件まで一括で書き込み/削除ができる）
    const batch = db.batch();
    let count = 0;

    queueSnapshot.forEach((doc) => {
        const data = doc.data();
        const barcode = doc.id;

        const productRef = db.collection("products").doc(barcode);
        const queueRef = db.collection("products_queue").doc(barcode);

        // 1. 本番(products)に書き込む
        batch.set(productRef, data);
        // 2. キュー(products_queue)から消す
        batch.delete(queueRef);

        count++;
    });

    await batch.commit();
    console.log(`✅ ${count}件の商品データを本番データベースに移行しました。`);
});