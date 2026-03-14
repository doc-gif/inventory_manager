import { db } from "./firebase";

// デフォルトのモデル（Firestoreに設定がない場合の保険）
const FALLBACK_MODEL = "gemini-2.5-flash";

/**
 * FirestoreからGeminiのモデル名を動的に取得する
 */
export async function getGeminiModel(): Promise<string> {
    try {
        const docRef = db.collection("settings").doc("system");
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            // Firestoreに geminiModel というフィールドがあればそれを返す
            if (data && data.geminiModel) {
                return data.geminiModel;
            }
        }
    } catch (error) {
        console.error("設定の取得に失敗しました。デフォルトモデルを使用します:", error);
    }

    // 設定が存在しない、またはエラーの場合はフォールバックを使用
    return FALLBACK_MODEL;
}