import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import cors from "cors";
import axios from "axios";
import { GoogleGenAI, Type, Schema } from "@google/genai";

admin.initializeApp();
const db = getFirestore();
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

// 商品名から管理タイプを自動推測するヘルパー関数
function guessTypeFromName(itemName: string): "count" | "volume" | "both" {
    if (/シャンプー|リンス|コンディショナー|トリートメント|洗剤|柔軟剤|漂白剤|化粧水|乳液|美容液|クレンジング|ボディソープ|ハンドソープ|芳香剤/.test(itemName)) {
        return "both";
    }
    return "count";
}

// AIに強要するJSONスキーマ定義
const productSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "抽出された商品名（送料無料などの装飾語は除外すること）" },
        brand: { type: Type.STRING, description: "ブランド名やメーカー名" },
        category: {
            type: Type.STRING,
            enum: ["日用品", "食品・飲料", "スキンケア・コスメ", "医薬品・衛生用品", "その他"],
            description: "商品カテゴリ"
        },
        type: {
            type: Type.STRING,
            enum: ["count", "volume", "both"],
            description: "管理方法の指定。食品やティッシュなどの個数管理は'count'。香水など残量のみ管理は'volume'。シャンプー、トリートメント、洗剤、柔軟剤、化粧水、ボディソープなど『未開封ストック数』と『使用中ボトルの残量』の2つを同時に管理する日用品・液体消耗品は'both'を指定すること。"
        },
        contentAmount: { type: Type.NUMBER, description: "内容量（数値のみ）" },
        contentUnit: {
            type: Type.STRING,
            enum: ["pcs", "ml", "g"],
            description: "内容量の単位（個/枚/箱ならpcs、ミリリットルならml、グラムならg）"
        },
        confidence: {
            type: Type.STRING,
            enum: ["high", "medium", "low"],
            description: "情報の確実性（検索結果から明確に判断できればhigh、推測ならlow）"
        }
    },
    required: ["name", "category", "confidence"]
};

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

                // キャッシュ（マスター）確認
                const productRef = db.collection("products").doc(barcode);
                const productDoc = await productRef.get();
                if (productDoc.exists) {
                    res.status(200).json(productDoc.data());
                    return;
                }

                let suggestion: ProductSuggestion | null = null;

                // ==========================================
                // STEP 1: Yahoo!ショッピングAPI (JANコード専用検索でヒット率高)
                // ==========================================
                try {
                    const yahooUrl = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${yahooApiKey.value()}&jan_code=${barcode}&results=1`;
                    const yahooRes = await axios.get(yahooUrl);

                    if (yahooRes.data.hits && yahooRes.data.hits.length > 0) {
                        const item = yahooRes.data.hits[0];
                        suggestion = {
                            barcode,
                            name: item.name.substring(0, 50),
                            category: "その他",
                            type: guessTypeFromName(item.name),
                            source: "yahoo_api",
                            confidence: "high"
                        };
                    }
                } catch (error: any) {
                    console.error(`[YahooAPI] Error for barcode ${barcode}: ${error.message}`);
                }

                // ==========================================
                // STEP 2: 楽天市場API (Yahooで見つからなかった場合のフォールバック)
                // ==========================================
                if (!suggestion) {
                    try {
                        const YOUR_CLOUDFLARE_URL = "https://inventory-manager-xxxx.pages.dev";
                        const rakutenUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=${extDbApiKey.value()}&keyword=${barcode}&hits=1&format=json`;

                        const extRes = await axios.get(rakutenUrl, { headers: { "Referer": YOUR_CLOUDFLARE_URL } });

                        if (extRes.data.Items && extRes.data.Items.length > 0) {
                            const item = extRes.data.Items[0].Item;
                            suggestion = {
                                barcode,
                                name: item.itemName.substring(0, 50),
                                category: "その他",
                                type: guessTypeFromName(item.itemName),
                                source: "rakuten_api",
                                confidence: "high"
                            };
                        }
                    } catch (error: any) {
                        console.error(`[RakutenAPI] Error for barcode ${barcode}: ${error.message}`);
                    }
                }

                // ==========================================
                // STEP 3: Open Food Facts (食品の世界最大DB・キー不要)
                // ==========================================
                if (!suggestion) {
                    try {
                        const offUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
                        const offRes = await axios.get(offUrl);

                        if (offRes.data.status === 1 && offRes.data.product) {
                            const p = offRes.data.product;
                            // 日本語名があれば優先し、無ければ英語名を使用
                            const name = p.product_name_ja || p.product_name;
                            if (name) {
                                suggestion = {
                                    barcode,
                                    name: name.substring(0, 50),
                                    brand: p.brands ? p.brands.split(',')[0] : undefined,
                                    category: "食品・飲料",
                                    type: "count",
                                    source: "open_food_facts",
                                    confidence: "high"
                                };
                            }
                        }
                    } catch (error: any) {
                        console.error(`[OpenFoodFacts] Error for barcode ${barcode}: ${error.message}`);
                    }
                }

                // ==========================================
                // STEP 4: Brave Search + Gemini AI (最終手段)
                // ==========================================
                if (!suggestion) {
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
                            const searchContext = results.map((r: any) => `Title: ${r.title}\nSnippet: ${r.description}`).join("\n\n");

                            const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
                            const aiResponse = await ai.models.generateContent({
                                model: "gemini-2.5-flash",
                                contents: `以下の検索結果から、バーコード(${barcode})に該当する商品情報を抽出してください。\n\n${searchContext}`,
                                config: {
                                    responseMimeType: "application/json",
                                    responseSchema: productSchema,
                                    temperature: 0.1,
                                }
                            });

                            if (aiResponse.text) {
                                const extractedData = JSON.parse(aiResponse.text);
                                suggestion = {
                                    barcode,
                                    ...extractedData,
                                    source: "web_ai"
                                };
                            }
                        }
                    } catch (error: any) {
                        console.error(`[WebAI] Error for barcode ${barcode}: ${error.message}`);
                    }
                }

                // ==========================================
                // マスターへの保存とレスポンス
                // ==========================================
                if (suggestion) {
                    await productRef.set({
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