import React from 'react';
import { ArrowLeft, Package, Droplets, ScanBarcode, Layers, Store, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Label } from '@/presentation/components/ui/Label';
import { Card } from '@/presentation/components/ui/Card';
import { type ContentUnit } from '@/domain/models/inventory-management-types';
import { BarcodeScanner } from '@/presentation/pages/BarcodeScanner';
import { useAddProduct } from '@/presentation/hooks/useAddProduct';

export function AddProduct() {
  const { form, setters, ui, uiSetters, dropdowns, handlers } = useAddProduct();

  return (
      <div className="min-h-screen pb-24 bg-background">
        {/* ==========================================
            Header
        ========================================== */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
          <div className="flex items-center gap-1.5 max-w-md mx-auto">
            {/* 🌟 改善: タップ領域を広げ（48x48px）、見た目の位置は-ml-3で調整 */}
            <Button
                variant="ghost"
                onClick={handlers.goBack}
                className="w-12 h-12 p-0 rounded-full -ml-3 shrink-0 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                aria-label="戻る"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-base font-bold">商品を追加</h1>
          </div>
        </div>

        <form onSubmit={handlers.handleSubmit} className="max-w-md mx-auto px-4 pt-4 space-y-6">

          {/* ==========================================
              バーコード（自動入力）セクション
          ========================================== */}
          <div className="space-y-4">
            <Button
                type="button"
                variant="outline"
                className="w-full h-auto py-3 px-4 flex items-center justify-start gap-3.5 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all rounded-xl shadow-sm"
                onClick={() => uiSetters.setShowScanner(true)}
                disabled={ui.isLookingUpBarcode}
            >
              <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-foreground">
                  {ui.isLookingUpBarcode ? "検索中..." : "バーコードで自動入力"}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  カメラで読み取ってAIにお任せ
                </p>
              </div>
            </Button>

            <div className="relative py-1">
              <span className="absolute inset-0 flex items-center w-full border-t border-border"></span>
              <span className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  または 手動で入力
                </span>
              </span>
            </div>

            {form.barcode && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">スキャンしたバーコード</p>
                    <p className="text-sm font-mono font-medium">{form.barcode}</p>
                  </div>
                  <div className="flex gap-1.5 p-2 bg-background rounded-md border border-border/50 text-muted-foreground">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                    <p className="text-[10px] leading-relaxed">
                      違う商品が表示された場合は、正しい情報に手動で書き換えて登録してください。
                    </p>
                  </div>
                </div>
            )}
          </div>

          {/* ==========================================
              1. 基本情報・内容量
          ========================================== */}
          <div className="space-y-4">
            <div className="space-y-1.5 relative">
              <Label htmlFor="name" className="text-sm font-bold">商品名 <span className="text-red-500">*</span></Label>
              <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setters.setName(e.target.value)}
                  onFocus={() => uiSetters.setIsNameFocused(true)}
                  onBlur={() => setTimeout(() => uiSetters.setIsNameFocused(false), 200)}
                  placeholder="例：ティッシュペーパー"
                  className="h-11 text-base"
                  autoComplete="off"
              />
              {ui.isNameFocused && dropdowns.filteredNames.length > 0 && (
                  <ul className="absolute z-50 w-full bg-background border border-border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {dropdowns.filteredNames.map((n) => (
                        <li key={n} className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                            onClick={() => { setters.setName(n); uiSetters.setIsNameFocused(false); }}>
                          {n}
                        </li>
                    ))}
                  </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-sm font-bold">メーカー・ブランド名</Label>
              <Input id="brand" value={form.brand} onChange={(e) => setters.setBrand(e.target.value)} placeholder="例：エリエール" className="h-11 text-base" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold">カテゴリ</Label>
              <div className="flex flex-wrap gap-2">
                {/* 🌟 categories はフック等から取る想定のままにしています */}
                {["日用品", "食品・飲料", "スキンケア・コスメ", "医薬品・衛生用品", "その他"].map((cat) => (
                    <button key={cat} type="button" onClick={() => setters.setCategory(cat as any)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${form.category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {cat}
                    </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-sm font-bold">内容量</Label>
              <div className="flex gap-2">
                <Input inputMode="decimal" placeholder="例: 300" value={form.contentAmount} onChange={(e) => setters.setContentAmount(e.target.value)} className="h-11 flex-1 min-w-0 text-base" />
                <div className="relative shrink-0 w-24">
                  <select value={form.contentUnit} onChange={(e) => setters.setContentUnit(e.target.value as ContentUnit)} className="w-full h-11 appearance-none rounded-md border bg-input-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="pcs">本</option><option value="ml">ml</option><option value="g">g</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              2. 購入情報
          ========================================== */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Store className="w-4 h-4 text-muted-foreground" />
              購入情報
            </h2>

            <div className="space-y-1.5 relative">
              <Label htmlFor="shop" className="text-xs text-muted-foreground">買った場所（お店）</Label>
              <Input
                  id="shop" value={form.shop} onChange={(e) => setters.setShop(e.target.value)}
                  onFocus={() => uiSetters.setIsShopFocused(true)} onBlur={() => setTimeout(() => uiSetters.setIsShopFocused(false), 200)}
                  placeholder="例：マツモトキヨシ" className="h-11 text-base" autoComplete="off"
              />
              {ui.isShopFocused && dropdowns.filteredShops.length > 0 && (
                  <ul className="absolute z-50 w-full bg-background border border-border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {dropdowns.filteredShops.map((s) => (
                        <li key={s} className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                            onClick={() => { setters.setShop(s); uiSetters.setIsShopFocused(false); }}>
                          {s}
                        </li>
                    ))}
                  </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="price" className="text-xs text-muted-foreground">購入価格 (円)</Label>
                <Input id="price" type="number" value={form.price} onChange={(e) => setters.setPrice(e.target.value)} placeholder="例: 298" className="h-11 w-full text-base" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="purchaseDate" className="text-xs text-muted-foreground">購入日</Label>
                <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => setters.setPurchaseDate(e.target.value)} className="h-11 w-full text-base" />
              </div>
            </div>
          </div>

          {/* ==========================================
              3. 在庫管理設定
          ========================================== */}
          <div className="space-y-4 pt-4 border-t border-border">

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">管理タイプ</Label>
              <div className="flex flex-col gap-2.5">
                <button
                    type="button"
                    onClick={() => setters.setType('count')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        form.type === 'count' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-sm' : 'border-border bg-background hover:bg-muted/30'
                    }`}
                >
                  <div className={`p-2 rounded-full ${form.type === 'count' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${form.type === 'count' ? 'text-emerald-700' : 'text-foreground'}`}>数量で管理</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">1つずつ消費するもの (食品・電池など)</p>
                  </div>
                </button>

                <button
                    type="button"
                    onClick={() => setters.setType('both')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        form.type === 'both' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm' : 'border-border bg-background hover:bg-muted/30'
                    }`}
                >
                  <div className={`p-2 rounded-full ${form.type === 'both' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${form.type === 'both' ? 'text-blue-700' : 'text-foreground'}`}>残量ゲージで管理</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">少しずつ減っていくもの (洗剤・化粧水など)</p>
                  </div>
                </button>
              </div>
            </div>

            {form.type === 'count' ? (
                <div className="space-y-2 p-4 bg-muted/10 rounded-xl border border-border">
                  <Label className="text-sm font-bold">現在の在庫数</Label>
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg shadow-sm bg-background" onClick={() => setters.setCount(Math.max(0, form.count - 1))}>−</Button>
                    <span className="text-3xl tabular-nums font-bold tracking-tight">{form.count}</span>
                    <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg shadow-sm bg-background" onClick={() => setters.setCount(form.count + 1)}>＋</Button>
                  </div>
                </div>
            ) : (
                <div className="space-y-5 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1.5 text-blue-700 font-bold text-sm">
                      <Droplets className="w-4 h-4" /> 使用中のボトルの残量
                    </Label>
                    <div className="flex items-end gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                          <button
                              key={i} type="button" onClick={() => setters.setVolumeLevel(i)}
                              className={`flex-1 rounded-md transition-all shadow-sm ${
                                  i <= form.volumeLevel ? (form.volumeLevel <= 1 ? 'bg-red-500' : 'bg-blue-500') : 'bg-background border border-border/50'
                              }`}
                              style={{ height: `${i * 8 + 12}px` }}
                          />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-blue-200/50">
                    <Label className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                      <Package className="w-4 h-4" /> 未開封ストック数
                    </Label>
                    <div className="flex items-center justify-between">
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-background shadow-sm" onClick={() => setters.setCount(Math.max(0, form.count - 1))}>−</Button>
                      <span className="text-3xl tabular-nums font-bold tracking-tight">{form.count}</span>
                      <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-background shadow-sm" onClick={() => setters.setCount(form.count + 1)}>＋</Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">ストックを持たない商品は「0」で設定できます</p>
                  </div>
                </div>
            )}

            <div className="space-y-2">
              <Label className="text-orange-600 font-bold flex items-center gap-1.5 text-sm">
                在庫アラート設定
              </Label>
              <Card className="p-4 bg-orange-50/30 border-orange-200/60 shadow-sm rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight">「在庫少」の基準値</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {form.type === 'count' ? 'この数量以下になると警告を表示します' : '未開封ストックがこの数以下で警告します'}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 bg-background p-1 rounded-full border border-orange-100">
                    <Button type="button" variant="ghost" className="h-10 w-10 rounded-full p-0 text-lg text-orange-600 hover:bg-orange-100" onClick={() => setters.setLowThreshold(String(Math.max(0, parseInt(form.lowThreshold || '0') - 1)))}>−</Button>
                    <span className="w-8 text-center text-xl tabular-nums font-bold text-orange-600">{form.lowThreshold || '0'}</span>
                    <Button type="button" variant="ghost" className="h-10 w-10 rounded-full p-0 text-lg text-orange-600 hover:bg-orange-100" onClick={() => setters.setLowThreshold(String(parseInt(form.lowThreshold || '0') + 1))}>＋</Button>
                  </div>
                </div>
                {form.type === 'both' && parseInt(form.lowThreshold || '0') === 0 && (
                    <div className="mt-3 pt-2 border-t border-orange-200/50">
                      <p className="text-[10px] text-orange-700/90 leading-relaxed font-medium">
                        💡 基準値を「0」にした場合、使用中のボトルの残量が少なくなったタイミングでアラートを表示します。
                      </p>
                    </div>
                )}
              </Card>
            </div>
          </div>

          {/* ==========================================
              4. 詳細設定 & 登録ボタン
          ========================================== */}
          <div className="pt-2 border-t border-border/60">
            <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors mb-5"
                onClick={() => uiSetters.setShowAdvanced(!ui.showAdvanced)}
            >
              {ui.showAdvanced ? '詳細設定を閉じる' : '開封日・使用期限などを設定する'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${ui.showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {ui.showAdvanced && (
                <div className="space-y-3 bg-muted/10 border border-border/50 rounded-xl p-4 mb-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="openedDate" className="text-xs font-bold">開封日</Label>
                    <Input id="openedDate" type="date" value={form.openedDate} onChange={(e) => setters.setOpenedDate(e.target.value)} className="h-11 w-full text-base px-2" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expiryDays" className="text-xs font-bold">開封後の使用期限（日数）</Label>
                    <Input id="expiryDays" type="number" value={form.expiryDays} onChange={(e) => setters.setExpiryDays(e.target.value)} placeholder="例：30" className="h-11 w-full text-base" />
                  </div>
                </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-sm">
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