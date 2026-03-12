import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
import cors from "cors";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { db } from "../shared/firebase";
import { productSchema } from "../shared/geminiSchema";
const corsHandler = cors({ origin: true });

// シークレットの定義
const extDbApiKey = defineSecret("EXTERNAL_DB_API_KEY"); // 楽天
const yahooApiKey = defineSecret("YAHOO_API_KEY");       // Yahoo
const braveApiKey = defineSecret("BRAVE_SEARCH_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// 簡易インメモリ・レートリミット (IPベース: 1分間に10回まで)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    if (record.count >= RATE_LIMIT_MAX) return true;
    record.count += 1;
    return false;
}

// 期待するレスポンスの型定義
interface ProductSuggestion {
    barcode: string;
    name?: string;
    brand?: string;
    category?: "日用品" | "食品・飲料" | "スキンケア・コスメ" | "医薬品・衛生用品" | "その他";
    type?: "count" | "volume" | "both";
    contentAmount?: number;
    contentUnit?: "pcs" | "ml" | "g";
    confidence?: "high" | "medium" | "low";
    source?: "yahoo_api" | "rakuten_api" | "open_food_facts" | "web_ai" | "unknown";
}

export const barcodeLookup = onRequest(
    {
        secrets: [extDbApiKey, yahooApiKey, braveApiKey, geminiApiKey],
        region: "asia-northeast1",
        timeoutSeconds: 30,
    },
    (req, res) => {
        corsHandler(req, res, async () => {
            try {
                if (req.method !== "GET") {
                    res.status(405).json({ error: "METHOD_NOT_ALLOWED", reason: "Only GET is supported." });
                    return;
                }

                const clientIp = req.ip || req.socket.remoteAddress || "unknown";
                if (isRateLimited(clientIp)) {
                    res.status(429).json({ error: "RATE_LIMIT_EXCEEDED", reason: "Too many requests." });
                    return;
                }

                const barcode = req.query.barcode as string;
                if (!barcode || !/^\d{8,14}$/.test(barcode)) {
                    res.status(400).json({ error: "INVALID_BARCODE", reason: "Barcode must be an 8 to 14 digit number." });
                    return;
                }

                // 本番（products）と 保留キュー（products_queue）の両方を確認する
                const productRef = db.collection("products").doc(barcode);
                const productDoc = await productRef.get();
                if (productDoc.exists) {
                    res.status(200).json(productDoc.data());
                    return;
                }

                const queueRef = db.collection("products_queue").doc(barcode);
                const queueDoc = await queueRef.get();
                if (queueDoc.exists) {
                    res.status(200).json(queueDoc.data());
                    return;
                }

                let rawContext = "";
                let detectedSource: "yahoo_api" | "rakuten_api" | "open_food_facts" | "web_ai" | "unknown" = "unknown";

                // ==========================================
                // STEP 1: Yahoo!ショッピングAPI
                // ==========================================
                try {
                    const yahooUrl = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${yahooApiKey.value()}&jan_code=${barcode}&results=1`;
                    const yahooRes = await axios.get(yahooUrl);

                    if (yahooRes.data.hits && yahooRes.data.hits.length > 0) {
                        const item = yahooRes.data.hits[0];
                        rawContext = `商品名: ${item.name}\n説明: ${item.description || ""}`;
                        detectedSource = "yahoo_api";
                    }
                } catch (error: any) {
                    console.error(`[YahooAPI] Error for barcode ${barcode}: ${error.message}`);
                }

                // ==========================================
                // STEP 2: 楽天市場API (Yahooで見つからなかった場合)
                // ==========================================
                if (!rawContext) {
                    try {
                        const YOUR_CLOUDFLARE_URL = "https://inventory-manager-xxxx.pages.dev";
                        const rakutenUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=${extDbApiKey.value()}&keyword=${barcode}&hits=1&format=json`;
                        const extRes = await axios.get(rakutenUrl, { headers: { "Referer": YOUR_CLOUDFLARE_URL } });

                        if (extRes.data.Items && extRes.data.Items.length > 0) {
                            const item = extRes.data.Items[0].Item;
                            rawContext = `商品名: ${item.itemName}\n説明: ${item.itemCaption || ""}`;
                            detectedSource = "rakuten_api";
                        }
                    } catch (error: any) {
                        console.error(`[RakutenAPI] Error for barcode ${barcode}: ${error.message}`);
                    }
                }

                // ==========================================
                // STEP 3: Open Food Facts (食品の世界最大DB)
                // ==========================================
                if (!rawContext) {
                    try {
                        const offUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
                        const offRes = await axios.get(offUrl);

                        if (offRes.data.status === 1 && offRes.data.product) {
                            const p = offRes.data.product;
                            const name = p.product_name_ja || p.product_name;
                            if (name) {
                                rawContext = `商品名: ${name}\nブランド: ${p.brands || ""}\n容量: ${p.quantity || ""}`;
                                detectedSource = "open_food_facts";
                            }
                        }
                    } catch (error: any) {
                        console.error(`[OpenFoodFacts] Error for barcode ${barcode}: ${error.message}`);
                    }
                }

                // ==========================================
                // STEP 4: Brave Search (最終手段)
                // ==========================================
                if (!rawContext) {
                    try {
                        const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${barcode}&count=5`;
                        const braveRes = await axios.get(braveUrl, {
                            headers: {
                                "Accept": "application/json",
                                "X-Subscription-Token": braveApiKey.value()
                            }
                        });

                        const results = braveRes.data.web?.results || [];
                        if (results.length > 0) {
                            rawContext = results.map((r: any) => `Title: ${r.title}\nSnippet: ${r.description}`).join("\n\n");
                            detectedSource = "web_ai";
                        }
                    } catch (error: any) {
                        console.error(`[WebAI] Error for barcode ${barcode}: ${error.message}`);
                    }
                }

                // ==========================================
                // STEP 5: Gemini AIによるデータのクレンジングと構造化
                // ==========================================
                let suggestion: ProductSuggestion | null = null;

                if (rawContext) {
                    try {
                        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

                        // AIに対する強力なプロンプト（指示）
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
                                responseSchema: productSchema,
                                temperature: 0.1, // 創造性より正確性を重視
                            }
                        });

                        if (aiResponse.text) {
                            const extractedData = JSON.parse(aiResponse.text);
                            suggestion = {
                                barcode,
                                ...extractedData,
                                source: detectedSource // どこから引っ張ってきたデータか（Yahooなど）を残す
                            };
                        }
                    } catch (error: any) {
                        console.error(`[GeminiParseError] ${error.message}`);
                    }
                }

                // ==========================================
                // マスターへの保存とレスポンス
                // ==========================================
                if (suggestion) {
                    await queueRef.set({
                        ...suggestion,
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    res.status(200).json(suggestion);
                } else {
                    res.status(404).json({ error: "NOT_FOUND", reason: "Could not find any product information." });
                }
            } catch (error: any) {
                console.error(`[UnhandledError] ${error.message}`);
                res.status(500).json({ error: "INTERNAL_SERVER_ERROR", reason: "An unexpected error occurred." });
            }
        });
    }
);