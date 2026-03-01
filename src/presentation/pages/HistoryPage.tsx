import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { History, Plus, Search, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { toast } from 'sonner';
import {useInventoryStore} from "@/application/stores/useInventoryStore";

export function HistoryPage() {
  const navigate = useNavigate();
  const { getUniqueHistoryItems, reAddFromHistory, getLowestPrice } = useInventoryStore();
  const [search, setSearch] = useState('');

  const uniqueItems = getUniqueHistoryItems();

  const filteredItems = useMemo(() => {
    if (!search) return uniqueItems;
    const q = search.toLowerCase();
    return uniqueItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q)
    );
  }, [uniqueItems, search]);

  const handleReAdd = (record: typeof uniqueItems[0]) => {
    reAddFromHistory(record);
    toast.success(`「${record.name}」を在庫に追加しました`);
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              購入履歴
            </h1>
            <p className="text-xs text-muted-foreground">
              タップで素早く在庫に再登録
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="履歴を検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-full bg-muted/50"
          />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <History className="w-12 h-12 opacity-30 mb-3" />
            <p>
              {uniqueItems.length === 0
                ? '購入履歴がありません'
                : '条件に一致する履歴がありません'}
            </p>
          </div>
        ) : (
          filteredItems.map((record) => {
            const lowestPrice = getLowestPrice(record.name);
            return (
              <Card key={record.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{record.name}</p>
                    {record.brand && (
                      <p className="text-xs text-muted-foreground truncate">{record.brand}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {record.category}
                      </Badge>
                      {lowestPrice !== null && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          底値 ¥{lowestPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1 rounded-full"
                    onClick={() => handleReAdd(record)}
                  >
                    <Plus className="w-4 h-4" />
                    追加
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
