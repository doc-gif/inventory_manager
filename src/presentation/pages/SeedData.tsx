import React, { useEffect, useState } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Database } from 'lucide-react';
import {useInventoryStore} from "@/application/stores/useInventoryStore";

const SEED_KEY = 'stockkeeper_seeded';

const sampleItems = [
  {
    name: 'ミネラルウォーター 2L',
    brand: 'いろはす',
    type: 'count' as const,
    category: '食品・飲料' as const,
    count: 3,
    volumeLevel: 0,
    price: 98,
    purchaseDate: '2026-02-15',
    openedDate: null,
    expiryDays: null,
    lowThreshold: 2,
  },
  {
    name: 'ティッシュペーパー 5箱パック',
    brand: 'エリエール',
    type: 'count' as const,
    category: '日用品' as const,
    count: 1,
    volumeLevel: 0,
    price: 348,
    purchaseDate: '2026-02-10',
    openedDate: null,
    expiryDays: null,
    lowThreshold: 2,
  },
  {
    name: '食器用洗剤',
    brand: 'キュキュット',
    type: 'volume' as const,
    category: '日用品' as const,
    count: 0,
    volumeLevel: 2,
    price: 198,
    purchaseDate: '2026-01-20',
    openedDate: '2026-01-20',
    expiryDays: null,
    lowThreshold: 1,
  },
  {
    name: '化粧水',
    brand: '無印良品',
    type: 'volume' as const,
    category: 'スキンケア・コスメ' as const,
    count: 0,
    volumeLevel: 3,
    price: 780,
    purchaseDate: '2026-01-15',
    openedDate: '2026-01-16',
    expiryDays: 90,
    lowThreshold: 1,
  },
  {
    name: '2weekコンタクトレンズ',
    brand: 'アキュビュー',
    type: 'count' as const,
    category: '医薬品・衛生用品' as const,
    count: 4,
    volumeLevel: 0,
    price: 2480,
    purchaseDate: '2026-02-01',
    openedDate: '2026-02-10',
    expiryDays: 14,
    lowThreshold: 2,
  },
  {
    name: '納豆 3パック',
    brand: 'おかめ納豆',
    type: 'count' as const,
    category: '食品・飲料' as const,
    count: 2,
    volumeLevel: 0,
    price: 128,
    purchaseDate: '2026-02-18',
    openedDate: null,
    expiryDays: null,
    lowThreshold: 1,
  },
  {
    name: '洗濯洗剤',
    brand: 'アタック ZERO',
    type: 'volume' as const,
    category: '日用品' as const,
    count: 0,
    volumeLevel: 4,
    price: 398,
    purchaseDate: '2026-02-05',
    openedDate: null,
    expiryDays: null,
    lowThreshold: 1,
  },
  {
    name: 'コンタクト洗浄液',
    brand: 'レニュー',
    type: 'volume' as const,
    category: '医薬品・衛生用品' as const,
    count: 0,
    volumeLevel: 1,
    price: 598,
    purchaseDate: '2026-01-10',
    openedDate: '2026-01-10',
    expiryDays: 60,
    lowThreshold: 1,
  },
  {
    name: '電池 単3 4本パック',
    brand: 'パナソニック',
    type: 'count' as const,
    category: 'その他' as const,
    count: 8,
    volumeLevel: 0,
    price: 398,
    purchaseDate: '2026-01-25',
    openedDate: null,
    expiryDays: null,
    lowThreshold: 4,
  },
  {
    name: 'ハンドソープ',
    brand: 'キレイキレイ',
    type: 'volume' as const,
    category: '日用品' as const,
    count: 0,
    volumeLevel: 5,
    price: 298,
    purchaseDate: '2026-02-12',
    openedDate: '2026-02-12',
    expiryDays: null,
    lowThreshold: 1,
  },
];

export function SeedDataBanner() {
  const items = useInventoryStore((state) => state.items);
  const addItem = useInventoryStore((state) => state.addItem);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const seeded = localStorage.getItem(SEED_KEY);
    if (seeded) setDismissed(true);
  }, []);

  if (items.length > 0 || dismissed) return null;

  const handleSeed = () => {
    sampleItems.forEach((item) => addItem(item));
    localStorage.setItem(SEED_KEY, 'true');
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(SEED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="px-4 pt-3">
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm mb-1">サンプルデータで試してみますか？</p>
            <p className="text-xs text-muted-foreground mb-3">
              10件の商品を追加して、アプリの機能をすぐに確認できます
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSeed} className="rounded-full">
                サンプルを追加
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                スキップ
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
