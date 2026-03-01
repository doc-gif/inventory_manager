import React from "react";
import { VOLUME_LABELS } from "@/domain/models/inventory-management-types";

type Props = {
  level: number;
  onChange: (level: number) => void;
  compact?: boolean;
};

export function VolumeGauge({ level, onChange, compact = false }: Props) {
  const getColor = (i: number) => {
    if (i > level) return "bg-gray-200";
    if (level <= 1) return "bg-red-500";
    if (level <= 2) return "bg-orange-400";
    if (level <= 3) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      <div className="flex items-end gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(i);
            }}
            className={`${getColor(i)} rounded-sm transition-all duration-200 hover:opacity-80 ${
              compact ? "w-4" : "w-6"
            }`}
            style={{ height: compact ? `${i * 5 + 4}px` : `${i * 6 + 6}px` }}
            title={VOLUME_LABELS[i - 1]}
          />
        ))}
      </div>

      {!compact && <p className="text-xs text-muted-foreground">{VOLUME_LABELS[level - 1] || "空"}</p>}
    </div>
  );
}
