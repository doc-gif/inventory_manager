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

        <form onSubmit={handlers.handleSubmit} className="px-4 pt-4 space-y-6">

          {/* ==========================================
              バーコードスキャンセクション (コンパクトなボタン型)
          ========================================== */}
          <div className="space-y-4">

            {/* 🌟 改善：全体を大きな「ボタン」としてデザインし直しました */}
            <Button
                type="button"
                variant="outline"
                className="w-full h-auto py-3.5 px-4 flex items-center justify-start gap-3.5 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all shadow-sm"
                onClick={() => uiSetters.setShowScanner(true)}
                disabled={ui.isLookingUpBarcode}
            >
              <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-foreground">
                  {ui.isLookingUpBarcode ? "検索中..." : "バーコードで自動入力"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-normal leading-tight">
                  カメラで読み取ってAIにお任せ
                </div>
              </div>
            </Button>

            {/* 「自動」か「手動」かを分けるセパレーター */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  または 手動で入力
                </span>
              </div>
            </div>

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
          </div>

          {/* ==========================================
              1. 基本情報・内容量
          ========================================== */}
          <div className="space-y-4 pt-2">
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

            {/* Content Amount */}
            <div className="space-y-1.5 pt-1">
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
          </div>

          {/* ==========================================
              2. 購入情報
          ========================================== */}
          <div className="space-y-4 pt-5 border-t border-border">
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
          </div>

          {/* ==========================================
              3. 在庫管理設定
          ========================================== */}
          <div className="space-y-4 pt-5 border-t border-border">
            <div className="space-y-2">
              <Label>管理タイプ</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card
                    className={`p-3 cursor-pointer transition-all text-center ${
                        form.type === 'count'
                            ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500 shadow-sm'
                            : 'hover:border-emerald-500/30 border-border'
                    }`}
                    onClick={() => setters.setType('count')}
                >
                  <Package className={`w-8 h-8 mx-auto mb-2 ${form.type === 'count' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-bold text-foreground">数量で管理</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    1つずつ消費するもの<br/>(食品・乾電池など)
                  </p>
                </Card>

                <Card
                    className={`p-3 cursor-pointer transition-all text-center ${
                        form.type === 'both'
                            ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500 shadow-sm'
                            : 'hover:border-blue-500/30 border-border'
                    }`}
                    onClick={() => setters.setType('both')}
                >
                  <Layers className={`w-8 h-8 mx-auto mb-2 ${form.type === 'both' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-bold text-foreground">残量ゲージで管理</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    少しずつ減っていくもの<br/>(洗剤・化粧水など)
                  </p>
                </Card>
              </div>
            </div>

            {form.type === 'count' ? (
                <div className="space-y-1.5 p-4 bg-muted/20 rounded-xl border border-border">
                  <Label>現在の在庫数</Label>
                  <div className="flex items-center gap-4 pt-1">
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg" onClick={() => setters.setCount(Math.max(0, form.count - 1))}>−</Button>
                    <span className="text-3xl w-16 text-center tabular-nums font-medium">{form.count}</span>
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg" onClick={() => setters.setCount(form.count + 1)}>＋</Button>
                  </div>
                </div>
            ) : (
                <div className="space-y-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <Droplets className="w-4 h-4" /> 使用中のボトルの残量
                    </Label>
                    <div className="flex items-end gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                          <button
                              key={i}
                              type="button"
                              onClick={() => setters.setVolumeLevel(i)}
                              className={`w-full max-w-[48px] rounded-sm transition-all shadow-sm ${
                                  i <= form.volumeLevel
                                      ? (form.volumeLevel <= 1 ? 'bg-red-500' : form.volumeLevel <= 3 ? 'bg-yellow-400' : 'bg-blue-500')
                                      : 'bg-white border border-border/50'
                              }`}
                              style={{ height: `${i * 8 + 12}px` }}
                          />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-5 border-t border-blue-200/50">
                    <Label className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <Package className="w-4 h-4" /> 未開封ストック数
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-white" onClick={() => setters.setCount(Math.max(0, form.count - 1))}>−</Button>
                      <span className="text-3xl w-16 text-center tabular-nums font-medium">{form.count}</span>
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-white" onClick={() => setters.setCount(form.count + 1)}>＋</Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">ストックを持たない商品は「0」のままで設定できます</p>
                  </div>
                </div>
            )}

            <div className="space-y-2 pt-2">
              <Label className="text-orange-600 font-bold flex items-center gap-1.5">
                在庫アラート設定
              </Label>
              <Card className="p-4 bg-orange-50/50 border-orange-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-bold text-foreground">
                      「在庫少」の基準値
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {form.type === 'count'
                          ? 'この数量以下になると警告マークを表示します'
                          : '未開封ストックがこの数以下になると警告します'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10 rounded-full p-0 text-lg bg-white border-orange-200 text-orange-600"
                        onClick={() => setters.setLowThreshold(String(Math.max(0, parseInt(form.lowThreshold || '0') - 1)))}
                    >
                      −
                    </Button>
                    <span className="text-2xl w-8 text-center tabular-nums font-medium text-orange-600">
                      {form.lowThreshold || '0'}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10 rounded-full p-0 text-lg bg-white border-orange-200 text-orange-600"
                        onClick={() => setters.setLowThreshold(String(parseInt(form.lowThreshold || '0') + 1))}
                    >
                      ＋
                    </Button>
                  </div>
                </div>

                {form.type === 'both' && parseInt(form.lowThreshold || '0') === 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200/50">
                      <p className="text-[10px] text-orange-600/80 leading-relaxed font-medium">
                        💡 基準値を「0」にした場合、使用中のボトルの残量が少なくなったタイミングでアラートを表示します。
                      </p>
                    </div>
                )}
              </Card>
            </div>
          </div>

          {/* ==========================================
              4. 詳細設定
          ========================================== */}
          <div className="pt-2">
            <button
                type="button"
                className="text-xs text-primary underline mb-4 inline-block"
                onClick={() => uiSetters.setShowAdvanced(!ui.showAdvanced)}
            >
              {ui.showAdvanced ? '詳細設定を閉じる' : '開封日・使用期限などの詳細設定 ▼'}
            </button>

            {ui.showAdvanced && (
                <div className="space-y-4 bg-muted/30 rounded-lg p-4 mb-4">
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
                </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-full mt-2 font-bold">
              商品を登録する
            </Button>
          </div>
        </form>

        <BarcodeScanner
            open={ui.showScanner}
            onScan={handlers.handleBarcodeScanned}
            onClose={() => uiSetters.setShowScanner(false)}
        />
      </div>
  );
}