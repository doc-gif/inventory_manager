import React from "react";
import { useNavigate } from "react-router";
import { Minus, AlertTriangle, Clock, Tag, CalendarClock } from "lucide-react";

import type { InventoryItem } from "@/domain/models/inventory-management-types";
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{getCategoryEmoji(item.category)}</span>
            <h3 className={`truncate ${lowStock || expired ? "text-red-700" : ""}`}>{item.name}</h3>
          </div>

          {item.brand && <p className="text-xs text-muted-foreground mb-2 truncate">{item.brand}</p>}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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

          {lowestPrice !== null && item.price > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
              <Tag className="w-3 h-3" />
              底値 ¥{lowestPrice.toLocaleString()}
              {item.price <= lowestPrice && <span className="text-emerald-600 ml-1">★ 最安値で購入済み</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {item.type === "count" ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  consumeCount(item.id);
                }}
                disabled={item.count <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[3rem]">
                <span
                  className={`text-2xl tabular-nums ${
                    item.count === 0 ? "text-red-500" : lowStock ? "text-orange-500" : "text-foreground"
                  }`}
                >
                  {item.count}
                </span>
                <p className="text-[10px] text-muted-foreground -mt-0.5">個</p>
              </div>
            </div>
          ) : item.type === "volume" ? (
            <VolumeGauge level={item.volumeLevel} onChange={(lv) => setVolumeLevel(item.id, lv)} compact />
          ) : (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    consumeCount(item.id);
                  }}
                  disabled={item.count <= 0}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <div className="text-center min-w-[2rem]">
                  <span
                    className={`text-xl tabular-nums ${
                      item.count === 0 ? "text-red-500" : lowStock ? "text-orange-500" : "text-foreground"
                    }`}
                  >
                    {item.count}
                  </span>
                  <p className="text-[9px] text-muted-foreground -mt-0.5">個</p>
                </div>
              </div>
              <VolumeGauge level={item.volumeLevel} onChange={(lv) => setVolumeLevel(item.id, lv)} compact />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
