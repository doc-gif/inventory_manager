import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { db } from "../shared/firebase";
import { productSchema } from "../shared/geminiSchema"; // 👈 作成した共通スキーマ

const yahooApiKey = defineSecret("YAHOO_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY"); // 👈 Geminiのシークレットを追加

// ランダムに選ばれる検索キーワード
const DUMMY_KEYWORDS = [
    "ティッシュペーパー", "トイレットペーパー", "洗濯洗剤", "柔軟剤", "食器用洗剤",
    "シャンプー", "ボディソープ", "歯磨き粉", "ミネラルウォーター", "お茶 ペットボトル",
    "化粧水", "ハンドソープ", "ウェットティッシュ", "乾電池", "サプリメント"
];

export const injectDummyData = onSchedule({
    schedule: "0 2 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    secrets: [yahooApiKey, geminiApiKey], // 👈 secrets に geminiApiKey を追加
}, async (_) => {
    const keyword = DUMMY_KEYWORDS[Math.floor(Math.random() * DUMMY_KEYWORDS.length)];
    console.log(`ダミーデータの取得を開始します (キーワード: ${keyword})`);

    try {
        const yahooUrl = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${yahooApiKey.value()}&query=${encodeURIComponent(keyword)}&results=3`;
        const res = await axios.get(yahooUrl);

        const hits = res.data.hits || [];
        let addedCount = 0;

        // AIの初期化
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        for (const item of hits) {
            const barcode = item.janCode || item.jancode;
            if (!barcode || !/^\d{8,14}$/.test(barcode)) continue;

            // 本番(products)に存在するかチェック
            const existingDoc = await db.collection("products").doc(barcode).get();
            if (existingDoc.exists) continue;

            // 保留キュー(products_queue)に既に存在するかチェック
            const queueDoc = await db.collection("products_queue").doc(barcode).get();
            if (queueDoc.exists) continue;

            const rawContext = `商品名: ${item.name}\n説明: ${item.description || ""}`;

            try {
                const prompt = `以下の検索結果データから、バーコード(${barcode})に該当する商品情報を抽出・整理してください。
必ず以下のルールを厳守してください：
1. 「送料無料」「あす楽」「××個セット」「ポイント〇倍」「【】で囲まれた宣伝文句」などのECサイト特有のノイズや装飾語を完全に削除し、純粋な商品名だけを 'name' に設定すること。
2. ブランド名やメーカー名がわかる場合は 'brand' に設定すること。

【検索結果データ】
${rawContext}`;

                const aiResponse = await ai.models.generateContent({
                    model: "gemini-3-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: productSchema, // 共通スキーマを使用
                        temperature: 0.1,
                    }
                });

                if (aiResponse.text) {
                    const extractedData = JSON.parse(aiResponse.text);

                    // AIで整形された美しいデータをキューに保存
                    await db.collection("products_queue").doc(barcode).set({
                        barcode: barcode,
                        ...extractedData,
                        source: "dummy_bot", // AIが生成したダミーであることを明示
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    addedCount++;
                }
            } catch (aiError) {
                console.error(`[GeminiParseError] ダミーデータ整形エラー (${barcode}):`, aiError);
            }
        }

        console.log(`✅ ${addedCount}件のAI整形済みダミーデータを products_queue に混入しました。`);
    } catch (error) {
        console.error("ダミーデータの取得に失敗しました", error);
    }
});