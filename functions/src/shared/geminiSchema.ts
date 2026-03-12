import { Type, Schema } from "@google/genai";

export const productSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "抽出された純粋な商品名" },
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