import React from 'react';
import { ArrowLeft, Package, Droplets, ScanBarcode, Layers, Store, Info } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Label } from '@/presentation/components/ui/Label';
import { Card } from '@/presentation/components/ui/Card';
import { type ContentUnit } from '@/domain/models/inventory-management-types';
import { BarcodeScanner } from '@/presentation/pages/BarcodeScanner';
import { useAddProduct } from '@/presentation/hooks/useAddProduct';

export function AddProduct() {
  // カスタムフックからすべての状態とロジックを受け取る
  const { form, setters, ui, uiSetters, dropdowns, handlers } = useAddProduct();

  return (
      <div className="pb-24 overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handlers.goBack} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1>商品を追加</h1>
          </div>
        </div>

        <form onSubmit={handlers.handleSubmit} className="px-4 pt-4 space-y-5">
          {/* Barcode Scanner Button */}
          <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => uiSetters.setShowScanner(true)}
              disabled={ui.isLookingUpBarcode}
          >
            <ScanBarcode className="w-5 h-5 mr-2" />
            {ui.isLookingUpBarcode ? "検索中..." : "バーコードをスキャン"}
          </Button>

          {form.barcode && (
              <div className="space-y-2">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground">スキャンしたバーコード</p>
                  <p className="text-sm font-mono">{form.barcode}</p>
                </div>
                <div className="flex items-start gap-1.5 p-2.5 bg-muted/30 rounded-md border border-border/50 text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="text-[10px] leading-relaxed space-y-0.5">
                    <p className="font-bold text-foreground">違う商品が表示された場合</p>
                    <p>正しい情報に手動で書き換えて登録してください。</p>
                  </div>
                </div>
              </div>
          )}

          {/* Name */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="name">商品名 <span className="text-red-500">*</span></Label>
            <Input
                id="name"
                value={form.name}
                onChange={(e) => setters.setName(e.target.value)}
                onFocus={() => uiSetters.setIsNameFocused(true)}
                onBlur={() => setTimeout(() => uiSetters.setIsNameFocused(false), 200)}
                placeholder="例：ティッシュペーパー"
                className="h-11"
                autoComplete="off"
                autoFocus
            />
            {ui.isNameFocused && dropdowns.filteredNames.length > 0 && (
                <ul className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {dropdowns.filteredNames.map((n) => (
                      <li
                          key={n}
                          className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                          onClick={() => {
                            setters.setName(n);
                            uiSetters.setIsNameFocused(false);
                          }}
                      >
                        {n}
                      </li>
                  ))}
                </ul>
            )}
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label htmlFor="brand">メーカー・ブランド名</Label>
            <Input
                id="brand"
                value={form.brand}
                onChange={(e) => setters.setBrand(e.target.value)}
                placeholder="例：エリエール"
                className="h-11"
            />
          </div>

          {/* Shop */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="shop" className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-muted-foreground" />
              買った場所（お店）
            </Label>
            <Input
                id="shop"
                value={form.shop}
                onChange={(e) => setters.setShop(e.target.value)}
                onFocus={() => uiSetters.setIsShopFocused(true)}
                onBlur={() => setTimeout(() => uiSetters.setIsShopFocused(false), 200)}
                placeholder="例：マツモトキヨシ"
                className="h-11"
                autoComplete="off"
            />
            {ui.isShopFocused && dropdowns.filteredShops.length > 0 && (
                <ul className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {dropdowns.filteredShops.map((s) => (
                      <li
                          key={s}
                          className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                          onClick={() => {
                            setters.setShop(s);
                            uiSetters.setIsShopFocused(false);
                          }}
                      >
                        {s}
                      </li>
                  ))}
                </ul>
            )}
          </div>

          {/* Type selection */}
          <div className="space-y-1.5">
            <Label>管理タイプ</Label>
            <div className="grid grid-cols-3 gap-2">
              <Card
                  className={`p-2 cursor-pointer transition-all text-center ${form.type === 'count' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  onClick={() => setters.setType('count')}
              >
                <Package className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-bold">数量管理</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">個数をカウント</p>
              </Card>
              <Card
                  className={`p-2 cursor-pointer transition-all text-center ${form.type === 'volume' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  onClick={() => setters.setType('volume')}
              >
                <Droplets className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                <p className="text-xs font-bold">残量管理</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">1本の残量を管理</p>
              </Card>
              <Card
                  className={`p-2 cursor-pointer transition-all text-center ${form.type === 'both' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  onClick={() => setters.setType('both')}
              >
                <Layers className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                <p className="text-xs font-bold">ストック＋残量</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">化粧水・洗剤など</p>
              </Card>
            </div>
          </div>

          {/* Count or Volume Inputs */}
          {form.type === 'count' ? (
              <div className="space-y-1.5">
                <Label>在庫数</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setters.setCount(Math.max(0, form.count - 1))}>−</Button>
                  <span className="text-2xl w-12 text-center tabular-nums">{form.count}</span>
                  <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setters.setCount(form.count + 1)}>＋</Button>
                </div>
              </div>
          ) : form.type === 'volume' ? (
              <div className="space-y-1.5">
                <Label>現在の残量</Label>
                <div className="flex items-end gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setters.setVolumeLevel(i)} className={`w-full max-w-[40px] rounded transition-all ${i <= form.volumeLevel ? (form.volumeLevel <= 1 ? 'bg-red-500' : form.volumeLevel <= 3 ? 'bg-yellow-400' : 'bg-emerald-500') : 'bg-gray-200'}`} style={{ height: `${i * 8 + 12}px` }} />
                  ))}
                </div>
              </div>
          ) : (
              <div className="space-y-6 bg-muted/20 p-4 rounded-xl border border-border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-blue-600">
                    <Droplets className="w-4 h-4" /> 使用中の1本目の残量
                  </Label>
                  <div className="flex items-end gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onClick={() => setters.setVolumeLevel(i)} className={`w-full max-w-[40px] rounded transition-all ${i <= form.volumeLevel ? (form.volumeLevel <= 1 ? 'bg-red-500' : form.volumeLevel <= 3 ? 'bg-yellow-400' : 'bg-emerald-500') : 'bg-gray-200'}`} style={{ height: `${i * 6 + 10}px` }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <Label className="flex items-center gap-2 text-primary">
                    <Package className="w-4 h-4" /> 未開封のストック数
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setters.setCount(Math.max(0, form.count - 1))}>−</Button>
                    <span className="text-2xl w-12 text-center tabular-nums">{form.count}</span>
                    <Button type="button" variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => setters.setCount(form.count + 1)}>＋</Button>
                  </div>
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
                  value={form.price}
                  onChange={(e) => setters.setPrice(e.target.value)}
                  placeholder="298"
                  className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">購入日</Label>
              <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setters.setPurchaseDate(e.target.value)}
                  className="h-11"
              />
            </div>
          </div>

          {/* Content Amount */}
          <div className="space-y-1.5">
            <Label>内容量</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                  inputMode="decimal"
                  placeholder="例: 300"
                  value={form.contentAmount}
                  onChange={(e) => setters.setContentAmount(e.target.value)}
                  className="h-11 col-span-2"
              />
              <select
                  value={form.contentUnit}
                  onChange={(e) => setters.setContentUnit(e.target.value as ContentUnit)}
                  className="h-11 rounded-md border bg-input-background px-3 text-sm"
              >
                <option value="pcs">本</option>
                <option value="ml">ml</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => uiSetters.setShowAdvanced(!ui.showAdvanced)}
          >
            {ui.showAdvanced ? '詳細設定を閉じる' : '開封日・使用期限などの詳細設定 ▼'}
          </button>

          {ui.showAdvanced && (
              <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="openedDate">開封日</Label>
                  <Input
                      id="openedDate"
                      type="date"
                      value={form.openedDate}
                      onChange={(e) => setters.setOpenedDate(e.target.value)}
                      className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiryDays">開封後の使用期限（日数）</Label>
                  <Input
                      id="expiryDays"
                      type="number"
                      value={form.expiryDays}
                      onChange={(e) => setters.setExpiryDays(e.target.value)}
                      placeholder="例：30"
                      className="h-11"
                  />
                </div>
                {(form.type === 'count' || form.type === 'both') && (
                    <div className="space-y-1.5">
                      <Label htmlFor="lowThreshold">在庫アラートのしきい値</Label>
                      <Input
                          id="lowThreshold"
                          type="number"
                          value={form.lowThreshold}
                          onChange={(e) => setters.setLowThreshold(e.target.value)}
                          placeholder="2"
                          className="h-11"
                      />
                    </div>
                )}
              </div>
          )}

          <Button type="submit" className="w-full h-12 rounded-full">
            商品を登録する
          </Button>
        </form>

        <BarcodeScanner
            open={ui.showScanner}
            onScan={handlers.handleBarcodeScanned}
            onClose={() => uiSetters.setShowScanner(false)}
        />
      </div>
  );
}