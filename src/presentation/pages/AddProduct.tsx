import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Package, Droplets, ScanBarcode, Layers } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Label } from '@/presentation/components/ui/Label';
import { Card } from '@/presentation/components/ui/Card';
import { type Category, type ContentUnit, type ItemType} from '@/domain/models/inventory-management-types';
import { toast } from 'sonner';
import { BarcodeScanner } from '@/presentation/pages/BarcodeScanner';
import {useInventoryStore} from "@/application/stores/useInventoryStore";
import {lookupBarcodeForAddProduct} from "@/application/use-cases/BarcodeLookupService";

export function AddProduct() {
  const navigate = useNavigate();
  const { addItem, items } = useInventoryStore();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<ItemType>('count');
  const [category, setCategory] = useState<Category>('日用品');
  const [count, setCount] = useState(1);
  const [volumeLevel, setVolumeLevel] = useState(5);
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
      new Date().toISOString().split('T')[0]
  );
  const [openedDate, setOpenedDate] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [lowThreshold, setLowThreshold] = useState('2');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [contentAmount, setContentAmount] = useState<string>("");
  const [contentUnit, setContentUnit] = useState<ContentUnit>("pcs");
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);

  const applySuggestionToForm = (s: {
    name?: string;
    brand?: string;
    type?: ItemType;
    category?: Category;
    contentAmount?: number;
    contentUnit?: ContentUnit;
  }) => {
    if (s.name) setName(s.name);
    if (s.brand !== undefined) setBrand(s.brand);
    if (s.type) setType(s.type);
    if (s.category) setCategory(s.category);

    if (s.contentAmount && s.contentUnit) {
      setContentAmount(String(s.contentAmount));
      setContentUnit(s.contentUnit);
    }
  };

  const handleBarcodeScanned = async (code: string) => {
    setBarcode(code);

    setIsLookingUpBarcode(true);
    try {
      const result = await lookupBarcodeForAddProduct({ barcode: code, items });

      if (result.kind === "HIT_HISTORY") {
        applySuggestionToForm(result.suggestion);
        toast.success(`「${result.suggestion.name ?? "商品"}」の情報を読み込みました`);
        return;
      }

      if (result.kind === "HIT_CACHE") {
        applySuggestionToForm(result.suggestion);
        toast.success("過去に取得した商品情報を読み込みました。必要に応じて修正して登録してください。");
        return;
      }

      if (result.kind === "HIT_REMOTE") {
        applySuggestionToForm(result.suggestion);
        toast.success("商品情報を取得しました。必要に応じて修正して登録してください。");
        return;
      }

      if (result.kind === "NOT_FOUND") {
        toast.message("商品情報が見つかりませんでした。バーコードは記録したので手入力してください。");
        return;
      }

      toast.message("商品情報の取得に失敗しました。バーコードは記録したので手入力してください。");
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('商品名を入力してください');
      return;
    }

    const parsedContentAmount =
        contentAmount.trim() === "" ? undefined : Number(contentAmount);

    if (parsedContentAmount !== undefined && (!Number.isFinite(parsedContentAmount) || parsedContentAmount <= 0)) {
      toast.error("内容量は0より大きい数値で入力してください");
      return;
    }

    addItem({
      name: name.trim(),
      brand: brand.trim(),
      type,
      category,
      count: type === 'count' || type === 'both' ? count : 0,
      volumeLevel: type === 'volume' || type === 'both' ? volumeLevel : 0,
      price: price ? parseInt(price) : 0,
      purchaseDate,
      openedDate: openedDate || null,
      expiryDays: expiryDays ? parseInt(expiryDays) : null,
      lowThreshold: parseInt(lowThreshold) || 2,
      barcode: barcode || null,
      contentAmount: parsedContentAmount,
      contentUnit: parsedContentAmount ? contentUnit : undefined,
    });

    toast.success(`「${name}」を追加しました`);
    navigate('/');
  };

  return (
      <div className="pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1>商品を追加</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-5">
          {/* Barcode Scanner Button */}
          <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => setShowScanner(true)}
              disabled={isLookingUpBarcode}
          >
            <ScanBarcode className="w-5 h-5 mr-2" />
            {isLookingUpBarcode ? "検索中..." : "バーコードをスキャン"}
          </Button>

          {barcode && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">バーコード</p>
                <p className="text-sm font-mono">{barcode}</p>
              </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              商品名 <span className="text-red-500">*</span>
            </Label>
            <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：ティッシュペーパー"
                className="h-11"
                autoFocus
            />
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label htmlFor="brand">メーカー・ブランド名</Label>
            <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="例：エリエール"
                className="h-11"
            />
          </div>

          {/* Type selection */}
          <div className="space-y-1.5">
            <Label>管理タイプ</Label>
            <div className="grid grid-cols-3 gap-2">
              <Card
                  className={`p-3 cursor-pointer transition-all text-center ${type === 'count' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  onClick={() => setType('count')}
              >
                <Package className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-bold">数量管理</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">個数をカウント</p>
              </Card>
              <Card
                  className={`p-3 cursor-pointer transition-all text-center ${type === 'volume' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  onClick={() => setType('volume')}
              >
                <Droplets className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                <p className="text-xs font-bold">残量管理</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">1本の残量を管理</p>
              </Card>
              <Card
                  className={`p-3 cursor-pointer transition-all text-center ${type === 'both' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  onClick={() => setType('both')}
              >
                <Layers className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                <p className="text-xs font-bold">ストック＋残量</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">化粧水・洗剤など</p>
              </Card>
            </div>
          </div>

          {/* Count or Volume: type='both' の時のUIを大幅改善 */}
          {type === 'count' ? (
              <div className="space-y-1.5">
                <Label htmlFor="count">在庫数</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setCount(Math.max(0, count - 1))}>−</Button>
                  <span className="text-2xl w-12 text-center tabular-nums">{count}</span>
                  <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setCount(count + 1)}>＋</Button>
                </div>
              </div>
          ) : type === 'volume' ? (
              <div className="space-y-1.5">
                <Label>現在の残量</Label>
                <div className="flex items-end gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setVolumeLevel(i)} className={`w-10 rounded transition-all ${i <= volumeLevel ? (volumeLevel <= 1 ? 'bg-red-500' : volumeLevel <= 3 ? 'bg-yellow-400' : 'bg-emerald-500') : 'bg-gray-200'}`} style={{ height: `${i * 8 + 12}px` }} />
                  ))}
                </div>
              </div>
          ) : (
              /* 【改善】 ストック＋残量タイプの入力 */
              <div className="space-y-6 bg-muted/20 p-4 rounded-xl border border-border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-blue-600">
                    <Droplets className="w-4 h-4" /> 使用中の1本目の残量
                  </Label>
                  <div className="flex items-end gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onClick={() => setVolumeLevel(i)} className={`w-full max-w-[40px] rounded transition-all ${i <= volumeLevel ? (volumeLevel <= 1 ? 'bg-red-500' : volumeLevel <= 3 ? 'bg-yellow-400' : 'bg-emerald-500') : 'bg-gray-200'}`} style={{ height: `${i * 6 + 10}px` }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">今使っているボトルの残量を設定します</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/50">
                  <Label className="flex items-center gap-2 text-primary">
                    <Package className="w-4 h-4" /> 未開封のストック数
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setCount(Math.max(0, count - 1))}>−</Button>
                    <span className="text-2xl w-12 text-center tabular-nums">{count}</span>
                    <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setCount(count + 1)}>＋</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">棚に眠っている新品の数を設定します</p>
                </div>
              </div>
          )}

          {/* Price & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">購入価格 (円)</Label>
              <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="298"
                  className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">購入日</Label>
              <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="h-11"
              />
            </div>
          </div>

          {/* 内容量（新規） */}
          <div className="space-y-1.5">
            <Label>内容量</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                  inputMode="decimal"
                  placeholder="例: 300"
                  value={contentAmount}
                  onChange={(e) => setContentAmount(e.target.value)}
                  className="h-11 col-span-2"
              />
              <select
                  value={contentUnit}
                  onChange={(e) => setContentUnit(e.target.value as ContentUnit)}
                  className="h-11 rounded-md border bg-input-background px-3 text-sm"
              >
                <option value="pcs">本</option>
                <option value="ml">ml</option>
                <option value="g">g</option>
              </select>
            </div>
            <p className="text-[10px] text-muted-foreground">
              例）フロスピック：100本 / 化粧水：200ml / 歯磨き粉：120g
            </p>
          </div>

          {/* Advanced options toggle */}
          <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '詳細設定を閉じる' : '開封日・使用期限などの詳細設定 ▼'}
          </button>

          {showAdvanced && (
              <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="openedDate">開封日</Label>
                  <Input
                      id="openedDate"
                      type="date"
                      value={openedDate}
                      onChange={(e) => setOpenedDate(e.target.value)}
                      className="h-11"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    コンタクトレンズや化粧品などの開封日を記録します
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expiryDays">開封後の使用期限（日数）</Label>
                  <Input
                      id="expiryDays"
                      type="number"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      placeholder="例：30（30日間）"
                      className="h-11"
                  />
                </div>

                {(type === 'count' || type === 'both') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="lowThreshold">
                        在庫アラートのしきい値
                      </Label>
                      <Input
                          id="lowThreshold"
                          type="number"
                          value={lowThreshold}
                          onChange={(e) => setLowThreshold(e.target.value)}
                          placeholder="2"
                          className="h-11"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        この数量以下になると「在庫少」として強調表示されます
                      </p>
                    </div>
                )}
              </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full h-12 rounded-full">
            商品を登録する
          </Button>
        </form>

        {showScanner && (
            <BarcodeScanner
                open={showScanner}
                onScan={handleBarcodeScanned}
                onClose={() => setShowScanner(false)}
            />
        )}
      </div>
  );
}