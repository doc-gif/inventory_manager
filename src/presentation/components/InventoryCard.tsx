import React from "react";
import { useNavigate } from "react-router";
import { Minus, AlertTriangle, Clock, Tag, CalendarClock, Package, Droplets, Store } from "lucide-react";

import type { InventoryItem } from "@/domain/models/inventory-management-types";
import { getUnitPrice } from "@/domain/services/pricing";
import { useInventoryStore } from "@/application/stores/useInventoryStore";

import { Card } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { VolumeGauge } from "@/presentation/components/VolumeGauge";

type Props = { item: InventoryItem };

export function InventoryCard({ item }: Props) {
  const navigate = useNavigate();

  const consumeCount = useInventoryStore((s) => s.consumeCount);
  const setVolumeLevel = useInventoryStore((s) => s.setVolumeLevel);

  const isLowStock = useInventoryStore((s) => s.isLowStock);
  const isExpiringSoon = useInventoryStore((s) => s.isExpiringSoon);
  const isExpired = useInventoryStore((s) => s.isExpired);
  const getDaysUntilExpiry = useInventoryStore((s) => s.getDaysUntilExpiry);
  const getLowestPrice = useInventoryStore((s) => s.getLowestPrice);

  const lowStock = isLowStock(item);
  const expiringSoon = isExpiringSoon(item);
  const expired = isExpired(item);
  const daysLeft = getDaysUntilExpiry(item);
  const lowestPrice = getLowestPrice(item.name);

  const unitPrice = getUnitPrice(item);

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      "日用品": "🏠",
      "食品・飲料": "🍽️",
      "スキンケア・コスメ": "✨",
      "医薬品・衛生用品": "💊",
      "その他": "📦",
    };
    return map[category] || "📦";
  };

  return (
      <Card
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              expired
                  ? "border-red-500 bg-red-50"
                  : lowStock
                      ? "border-orange-400 bg-orange-50/50"
                      : expiringSoon
                          ? "border-yellow-400 bg-yellow-50/50"
                          : "border-border"
          }`}
          onClick={() => navigate(`/item/${item.id}`)}
      >
        <div className="flex flex-col gap-3">

          {/* 上部エリア: 商品情報 */}
          <div className="w-full">
            <div className="flex items-start gap-2 mb-1">
              <span className="text-sm mt-0.5">{getCategoryEmoji(item.category)}</span>
              <h3 className={`font-medium leading-tight ${lowStock || expired ? "text-red-700" : ""}`}>
                {item.name}
              </h3>
            </div>

            {/* 👇 情報メタデータ: 縦幅を圧縮し、横並び（flex-wrap）で右側の余白を埋める */}
            <div className="pl-7 mt-1.5 flex flex-col gap-1.5">

              {/* 1行目: ブランドとバッジ類をまとめる */}
              <div className="flex flex-wrap items-center gap-1.5">
                {item.brand && <span className="text-xs text-muted-foreground font-medium mr-1">{item.brand}</span>}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {item.category}
                </Badge>
                {lowStock && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      在庫少
                    </Badge>
                )}
                {expired && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      期限切れ
                    </Badge>
                )}
                {expiringSoon && !expired && (
                    <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-yellow-500 text-white hover:bg-yellow-600">
                      <CalendarClock className="w-2.5 h-2.5" />
                      残{daysLeft}日
                    </Badge>
                )}
              </div>

              {/* 2行目: お店・内容量・価格情報を整理して表示 */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-1">

                {/* 1. お店情報 */}
                {item.shop && (
                    <div className="flex items-center gap-1 text-primary/80 font-medium">
                      <Store className="w-3 h-3" />
                      {item.shop}
                    </div>
                )}

                {/* 👇 2. 新規追加: 内容量表示 */}
                {item.contentAmount && item.contentUnit && (
                    <div className="flex items-center gap-1 font-medium bg-muted/30 px-1.5 py-0.5 rounded text-foreground/70">
                      {item.contentAmount}{item.contentUnit}
                    </div>
                )}

                {/* 3. 価格・コスパ情報（底値と単位価格を明確に分ける） */}
                {lowestPrice !== null && item.price > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-foreground">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        底値 ¥{lowestPrice.toLocaleString()}
                      </div>

                      {/* 単位価格は「（100gあたり〜）」のように括弧でくくってサブ情報化する */}
                      {unitPrice && (
                          <span className="text-[10px] text-muted-foreground/70">
                            ({unitPrice.label})
                          </span>
                      )}
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* 区切り線 */}
          <div className="w-full h-px bg-border/50" />

          {/* 下部エリア: 操作・状態（変更なし） */}
          <div className="w-full flex justify-end">

            {item.type === "count" ? (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground font-medium">在庫数</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); consumeCount(item.id); }} disabled={item.count <= 0}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="text-center min-w-[3rem]">
                      <span className={`text-2xl tabular-nums ${item.count === 0 ? "text-red-500" : lowStock ? "text-orange-500" : "text-foreground"}`}>{item.count}</span>
                      <span className="text-xs text-muted-foreground ml-0.5">個</span>
                    </div>
                  </div>
                </div>
            ) : item.type === "volume" ? (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground font-medium">現在の残量</span>
                  <VolumeGauge level={item.volumeLevel} onChange={(lv) => setVolumeLevel(item.id, lv)} compact />
                </div>
            ) : (
                /* ストック＋使用中（both）の横並び表示 */
                <div className="flex items-stretch gap-2 w-full">

                  {/* 使用中エリア */}
                  <div className="flex-1 flex items-center justify-between bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-600 flex flex-col items-start font-medium">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> 使用中</span>
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <VolumeGauge level={item.volumeLevel} onChange={(lv) => setVolumeLevel(item.id, lv)} compact />
                    </div>
                  </div>

                  {/* ストックエリア */}
                  <div className="flex-1 flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
                    <span className="text-[10px] text-primary flex flex-col items-start font-medium">
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" /> ストック</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 rounded-full bg-background" onClick={(e) => { e.stopPropagation(); consumeCount(item.id); }} disabled={item.count <= 0}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className={`text-xl font-bold tabular-nums min-w-[1.5rem] text-right ${item.count === 0 ? "text-muted-foreground" : lowStock ? "text-orange-500" : "text-foreground"}`}>{item.count}</span>
                      <span className="text-[10px] text-muted-foreground">個</span>
                    </div>
                  </div>

                </div>
            )}
          </div>

        </div>
      </Card>
  );
}
