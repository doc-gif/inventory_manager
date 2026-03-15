import React from 'react';
import {
    ArrowLeft, Edit3, Trash2, Save, Tag, CalendarDays,
    CalendarClock, Package, Droplets, Clock, X, Store, Layers, ChevronDown
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Label } from '@/presentation/components/ui/Label';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { VolumeGauge } from '@/presentation/components/VolumeGauge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog'; // 🌟 ダイアログをインポート
import { CATEGORIES, type ContentUnit } from '@/domain/models/inventory-management-types';
import { useProductDetail } from '@/presentation/hooks/useProductDetail';

export function ProductDetail() {
    const {
        item, meta, ui, uiSetters, editForm, editSetters, dropdowns, handlers
    } = useProductDetail();

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">商品が見つかりません</p>
                <Button variant="outline" className="mt-4" onClick={handlers.goHome}>
                    一覧に戻る
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={handlers.goBack} className="p-1 -ml-1">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="truncate max-w-[200px] text-base font-bold">{item.name}</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        {!ui.editing ? (
                            <Button variant="ghost" size="sm" onClick={handlers.startEditing} className="gap-1">
                                <Edit3 className="w-4 h-4" />
                                編集
                            </Button>
                        ) : (
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => uiSetters.setEditing(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button size="sm" onClick={handlers.saveEdit} className="gap-1">
                                    <Save className="w-4 h-4" />
                                    保存
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
                {/* Status alerts */}
                {meta.expired && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <Clock className="w-4 h-4 shrink-0" />
                        使用期限が切れています
                    </div>
                )}
                {meta.expiringSoon && !meta.expired && meta.daysLeft !== null && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                        <CalendarClock className="w-4 h-4 shrink-0" />
                        使用期限まであと{meta.daysLeft}日です
                    </div>
                )}

                {!ui.editing ? (
                    /* ==========================================================
                       View mode（表示モード）
                       ========================================================== */
                    <Card className="p-5">
                        <div className="space-y-4">
                            {/* 1. 基本情報・内容量 */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">商品名</p>
                                    <p className="font-medium">{item.name}</p>
                                </div>
                                {item.brand && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">ブランド</p>
                                        <p className="font-medium">{item.brand}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">カテゴリ</p>
                                    <Badge variant="secondary">{item.category}</Badge>
                                </div>
                                {(meta.contentLabel || meta.unitPrice) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">内容量</p>
                                            <p className="font-medium">{meta.contentLabel ?? "未設定"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">単位あたり</p>
                                            <p className="font-medium">{meta.unitPrice?.label ?? "未設定"}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 🌟 改善: 2. 購入情報（在庫情報の上に移動し、綺麗に整理） */}
                            <div className="pt-4 border-t border-border space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                    <Store className="w-3.5 h-3.5" />
                                    購入情報
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {/* 前回購入価格 */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><Tag className="w-3 h-3"/>前回購入</p>
                                        <p className="font-medium">{item.price > 0 ? `¥${item.price.toLocaleString()}` : '未設定'}</p>
                                    </div>
                                    {/* 購入日 */}
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><CalendarDays className="w-3 h-3"/>購入日</p>
                                        <p className="font-medium">{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('ja-JP') : '未設定'}</p>
                                    </div>
                                    {/* 底値 */}
                                    {meta.lowestPrice !== null && (
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><Tag className="w-3 h-3"/>底値</p>
                                            <p className="font-medium text-emerald-600">¥{meta.lowestPrice.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {/* お店 */}
                                    {item.shop && (
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><Store className="w-3 h-3"/>買った場所</p>
                                            <p className="font-medium">{item.shop}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. 在庫情報（管理タイプ） */}
                            <div className="pt-4 border-t border-border">
                                {item.type === 'count' ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-bold">現在の在庫数</p>
                                        <div className="flex items-center gap-4">
                                            <Button variant="outline" size="sm" className="h-12 w-12 rounded-full p-0 shadow-sm"
                                                    onClick={() => handlers.consumeCount(item.id)}
                                                    disabled={item.count <= 0}>−</Button>
                                            <span className={`text-4xl tabular-nums font-bold ${item.count === 0 ? 'text-red-500' : meta.lowStock ? 'text-orange-500' : ''}`}>{item.count}</span>
                                            <span className="text-muted-foreground text-sm">個</span>
                                            {meta.lowStock && <Badge variant="destructive">在庫少</Badge>}
                                        </div>
                                    </div>
                                ) : item.type === 'volume' ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-bold">現在の残量</p>
                                        <VolumeGauge level={item.volumeLevel} onChange={handlers.handleVolumeChange} />
                                        {meta.lowStock && <Badge variant="destructive" className="mt-2">残量少</Badge>}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <p className="text-xs text-blue-600 mb-2 font-bold flex items-center gap-1">
                                                <Droplets className="w-3 h-3" /> 使用中のボトルの残量
                                            </p>
                                            <VolumeGauge level={item.volumeLevel} onChange={handlers.handleVolumeChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs text-primary font-bold flex items-center gap-1">
                                                <Package className="w-3 h-3" /> 未開封ストック数
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <Button variant="outline" size="sm" className="h-10 w-10 rounded-full p-0 shadow-sm"
                                                        onClick={() => handlers.consumeCount(item.id)}
                                                        disabled={item.count <= 0}>−</Button>
                                                <span className={`text-3xl tabular-nums font-bold ${item.count === 0 ? 'text-muted-foreground' : meta.lowStock ? 'text-orange-500' : ''}`}>{item.count}</span>
                                                <span className="text-muted-foreground text-sm">個</span>
                                                {meta.lowStock && <Badge variant="destructive">在庫少</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. 詳細設定 */}
                            {(item.openedDate || item.expiryDays) && (
                                <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
                                    {item.openedDate && (
                                        <div><p className="text-xs text-muted-foreground mb-1">開封日</p><p className="font-medium">{item.openedDate}</p></div>
                                    )}
                                    {item.expiryDays && (
                                        <div><p className="text-xs text-muted-foreground mb-1">使用期限</p><p className="font-medium">開封後{item.expiryDays}日</p></div>
                                    )}
                                </div>
                            )}

                            {/* 🌟 改善: 削除ボタンをカード内の最下部に配置 */}
                            <div className="pt-4 mt-2 border-t border-border/50 flex justify-end">
                                <Button
                                    variant="ghost"
                                    className="h-9 px-3 text-red-600 gap-1.5 hover:bg-red-50 hover:text-red-700 font-medium shrink-0"
                                    onClick={() => uiSetters.setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    この商品を削除
                                </Button>
                            </div>

                        </div>
                    </Card>
                ) : (
                    /* ==========================================================
                       Edit form（編集モード）※順序はすでに購入情報が上になっています
                       ========================================================== */
                    <Card className="p-5 space-y-5">
                        {/* 1. 基本情報・内容量 */}
                        <div className="space-y-4">
                            <div className="space-y-1.5 relative">
                                <Label htmlFor="editName" className="text-sm font-bold">商品名 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="editName"
                                    value={editForm.editName}
                                    onChange={(e) => editSetters.setEditName(e.target.value)}
                                    onFocus={() => uiSetters.setIsNameFocused(true)}
                                    onBlur={() => setTimeout(() => uiSetters.setIsNameFocused(false), 200)}
                                    className="h-11 text-base"
                                    autoComplete="off"
                                />
                                {ui.isNameFocused && dropdowns.filteredNames.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-background border border-border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {dropdowns.filteredNames.map((n) => (
                                            <li key={n} className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                                                onClick={() => { editSetters.setEditName(n); uiSetters.setIsNameFocused(false); }}>
                                                {n}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editBrand" className="text-sm font-bold">ブランド名</Label>
                                <Input id="editBrand" value={editForm.editBrand} onChange={(e) => editSetters.setEditBrand(e.target.value)} className="h-11 text-base" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold">カテゴリ</Label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button key={cat} type="button" onClick={() => editSetters.setEditCategory(cat)}
                                                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${editForm.editCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <Label className="text-sm font-bold">内容量</Label>
                                <div className="flex gap-2">
                                    <Input inputMode="decimal" placeholder="例: 300" value={editForm.editContentAmount} onChange={(e) => editSetters.setEditContentAmount(e.target.value)} className="h-11 flex-1 min-w-0 text-base" />
                                    <div className="relative shrink-0 w-24">
                                        <select value={editForm.editContentUnit} onChange={(e) => editSetters.setEditContentUnit(e.target.value as ContentUnit)} className="w-full h-11 appearance-none rounded-md border bg-input-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary">
                                            <option value="pcs">本</option><option value="ml">ml</option><option value="g">g</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. 購入情報 */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <Store className="w-4 h-4 text-muted-foreground" />
                                購入情報
                            </h2>

                            <div className="space-y-1.5 relative">
                                <Label htmlFor="editShop" className="text-xs text-muted-foreground">買った場所（お店）</Label>
                                <Input
                                    id="editShop" value={editForm.editShop} onChange={(e) => editSetters.setEditShop(e.target.value)}
                                    onFocus={() => uiSetters.setIsShopFocused(true)} onBlur={() => setTimeout(() => uiSetters.setIsShopFocused(false), 200)}
                                    className="h-11 text-base" autoComplete="off"
                                />
                                {ui.isShopFocused && dropdowns.filteredShops.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-background border border-border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {dropdowns.filteredShops.map((s) => (
                                            <li key={s} className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                                                onClick={() => { editSetters.setEditShop(s); uiSetters.setIsShopFocused(false); }}>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5 min-w-0">
                                    <Label htmlFor="editPrice" className="text-xs text-muted-foreground">購入価格 (円)</Label>
                                    <Input id="editPrice" type="number" value={editForm.editPrice} onChange={(e) => editSetters.setEditPrice(e.target.value)} className="h-11 w-full text-base" />
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                    <Label className="text-xs text-muted-foreground">購入日</Label>
                                    <div className="h-11 w-full bg-muted/20 border border-border rounded-md px-3 flex items-center text-sm text-muted-foreground">
                                        {item.purchaseDate}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. 在庫管理設定 */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-sm font-bold text-foreground">管理タイプ</Label>
                            <div className="flex flex-col gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => editSetters.setEditType('count')}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        editForm.editType === 'count' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-sm' : 'border-border bg-background hover:bg-muted/30'
                                    }`}
                                >
                                    <div className={`p-2 rounded-full ${editForm.editType === 'count' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${editForm.editType === 'count' ? 'text-emerald-700' : 'text-foreground'}`}>数量で管理</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">1つずつ消費するもの</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => editSetters.setEditType('both')}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        editForm.editType === 'both' || editForm.editType === 'volume' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm' : 'border-border bg-background hover:bg-muted/30'
                                    }`}
                                >
                                    <div className={`p-2 rounded-full ${editForm.editType === 'both' || editForm.editType === 'volume' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${editForm.editType === 'both' || editForm.editType === 'volume' ? 'text-blue-700' : 'text-foreground'}`}>残量ゲージで管理</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">少しずつ減っていくもの</p>
                                    </div>
                                </button>
                            </div>

                            {editForm.editType === 'count' ? (
                                <div className="space-y-2 p-4 bg-muted/10 rounded-xl border border-border">
                                    <Label className="text-sm font-bold">現在の在庫数</Label>
                                    <div className="flex items-center justify-between">
                                        <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg shadow-sm bg-background" onClick={() => editSetters.setEditCount(Math.max(0, editForm.editCount - 1))}>−</Button>
                                        <span className="text-3xl tabular-nums font-bold tracking-tight">{editForm.editCount}</span>
                                        <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg shadow-sm bg-background" onClick={() => editSetters.setEditCount(editForm.editCount + 1)}>＋</Button>
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
                                                    key={i} type="button" onClick={() => editSetters.setEditVolumeLevel(i)}
                                                    className={`flex-1 rounded-md transition-all shadow-sm ${
                                                        i <= editForm.editVolumeLevel ? (editForm.editVolumeLevel <= 1 ? 'bg-red-500' : 'bg-blue-500') : 'bg-background border border-border/50'
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
                                            <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-background shadow-sm" onClick={() => editSetters.setEditCount(Math.max(0, editForm.editCount - 1))}>−</Button>
                                            <span className="text-3xl tabular-nums font-bold tracking-tight">{editForm.editCount}</span>
                                            <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-background shadow-sm" onClick={() => editSetters.setEditCount(editForm.editCount + 1)}>＋</Button>
                                        </div>
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
                                                {editForm.editType === 'count' ? 'この数量以下になると警告を表示します' : '未開封ストックがこの数以下で警告します'}
                                            </p>
                                        </div>
                                        <div className="flex items-center shrink-0 bg-background p-1 rounded-full border border-orange-100">
                                            <Button type="button" variant="ghost" className="h-10 w-10 rounded-full p-0 text-lg text-orange-600 hover:bg-orange-100" onClick={() => editSetters.setEditLowThreshold(String(Math.max(0, parseInt(editForm.editLowThreshold || '0') - 1)))}>−</Button>
                                            <span className="w-8 text-center text-xl tabular-nums font-bold text-orange-600">{editForm.editLowThreshold || '0'}</span>
                                            <Button type="button" variant="ghost" className="h-10 w-10 rounded-full p-0 text-lg text-orange-600 hover:bg-orange-100" onClick={() => editSetters.setEditLowThreshold(String(parseInt(editForm.editLowThreshold || '0') + 1))}>＋</Button>
                                        </div>
                                    </div>
                                    {(editForm.editType === 'both' || editForm.editType === 'volume') && parseInt(editForm.editLowThreshold || '0') === 0 && (
                                        <div className="mt-3 pt-2 border-t border-orange-200/50">
                                            <p className="text-[10px] text-orange-700/90 leading-relaxed font-medium">
                                                💡 基準値を「0」にした場合、ボトルの残量が少なくなると警告します。
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>

                        {/* 4. 詳細設定 */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="space-y-1.5"><Label className="text-xs font-bold">開封日</Label><Input type="date" value={editForm.editOpenedDate} onChange={(e) => editSetters.setEditOpenedDate(e.target.value)} className="h-11 w-full text-base" /></div>
                            <div className="space-y-1.5"><Label className="text-xs font-bold">使用期限（日数）</Label><Input type="number" value={editForm.editExpiryDays} onChange={(e) => editSetters.setEditExpiryDays(e.target.value)} placeholder="例：30" className="h-11 w-full text-base" /></div>
                        </div>
                    </Card>
                )}

                {/* Purchase history */}
                {meta.purchaseHistory.length > 1 && (
                    <Card className="p-4">
                        <h3 className="mb-3 text-sm font-bold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" />購入履歴</h3>
                        <div className="space-y-2">
                            {meta.purchaseHistory.slice(0, 10).map((record) => (
                                <div key={record.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                                    <span className="text-muted-foreground">{record.purchaseDate}</span>
                                    <span>{record.price > 0 ? `¥${record.price.toLocaleString()}` : '−'}
                                        {meta.lowestPrice !== null && record.price === meta.lowestPrice && <span className="text-emerald-500 ml-1 text-xs font-bold">最安値</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* 🌟 改善: Delete confirmation をダイアログ（Modal）に変更 */}
                <Dialog open={ui.showDeleteConfirm} onOpenChange={uiSetters.setShowDeleteConfirm}>
                    <DialogContent className="sm:max-w-md w-[90%] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-left flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                商品の削除
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            <p className="text-sm text-foreground leading-relaxed">
                                「<span className="font-bold">{item.name}</span>」を在庫リストから完全に削除しますか？<br />
                                <span className="text-xs text-muted-foreground block mt-2">※この操作は取り消すことができません。</span>
                            </p>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" className="flex-1" onClick={() => uiSetters.setShowDeleteConfirm(false)}>
                                キャンセル
                            </Button>
                            <Button variant="destructive" className="flex-1" onClick={handlers.handleDelete}>
                                削除する
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}