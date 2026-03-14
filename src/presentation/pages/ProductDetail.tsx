import React from 'react';
import {
    ArrowLeft, Edit3, Archive, Trash2, Save, Tag, CalendarDays,
    CalendarClock, Package, Droplets, Clock, X, Store, Layers,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Label } from '@/presentation/components/ui/Label';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { VolumeGauge } from '@/presentation/components/VolumeGauge';
import { CATEGORIES, type ContentUnit } from '@/domain/models/inventory-management-types';
import { useProductDetail } from '@/presentation/hooks/useProductDetail';

export function ProductDetail() {
    // カスタムフックからすべての状態とロジックを受け取る
    const {
        item, meta, ui, uiSetters, editForm, editSetters, dropdowns, handlers
    } = useProductDetail();

    // 対象商品が見つからない場合
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
        <div className="pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={handlers.goBack} className="p-1">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="truncate max-w-[200px]">{item.name}</h1>
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

            <div className="px-4 pt-4 space-y-4">
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

                {/* Main info card */}
                {!ui.editing ? (
                    <Card className="p-5">
                        <div className="space-y-4">
                            {/* 1. 基本情報・内容量 */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">商品名</p>
                                <p>{item.name}</p>
                            </div>
                            {item.brand && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">ブランド</p>
                                    <p>{item.brand}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">カテゴリ</p>
                                <Badge variant="secondary">{item.category}</Badge>
                            </div>

                            {/* 内容量を基本情報グループに移動 */}
                            {(meta.contentLabel || meta.unitPrice) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">内容量</p>
                                        <p>{meta.contentLabel ?? "未設定"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">単位あたり</p>
                                        <p>{meta.unitPrice?.label ?? "未設定"}</p>
                                    </div>
                                </div>
                            )}

                            {/* 2. 購入情報 */}
                            <div className="pt-3 border-t border-border space-y-4">
                                {item.shop && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <Store className="w-3 h-3" />
                                            買った場所
                                        </p>
                                        <p>{item.shop}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Tag className="w-3 h-3" />購入価格</p>
                                        <p>{item.price > 0 ? `¥${item.price.toLocaleString()}` : '未設定'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" />購入日</p>
                                        <p>{item.purchaseDate || '未設定'}</p>
                                    </div>
                                </div>

                                {meta.lowestPrice !== null && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Tag className="w-3 h-3" />底値（過去最安値）</p>
                                        <p className="text-emerald-600">¥{meta.lowestPrice.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* 3. 在庫情報 */}
                            <div className="pt-3 border-t border-border">
                                {item.type === 'count' ? (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2 font-bold">現在の在庫数</p>
                                        <div className="flex items-center gap-4">
                                            <Button variant="outline" size="sm" className="h-12 w-12 rounded-full p-0"
                                                    onClick={() => handlers.consumeCount(item.id)}
                                                    disabled={item.count <= 0}>−</Button>
                                            <span className={`text-4xl tabular-nums ${item.count === 0 ? 'text-red-500' : meta.lowStock ? 'text-orange-500' : ''}`}>{item.count}</span>
                                            <span className="text-muted-foreground text-sm">個</span>
                                            {meta.lowStock && <Badge variant="destructive">在庫少</Badge>}
                                        </div>
                                    </div>
                                ) : item.type === 'volume' ? (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2 font-bold">現在の残量</p>
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
                                        <div>
                                            <p className="text-xs text-primary mb-2 font-bold flex items-center gap-1">
                                                <Package className="w-3 h-3" /> 未開封ストック数
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <Button variant="outline" size="sm" className="h-10 w-10 rounded-full p-0"
                                                        onClick={() => handlers.consumeCount(item.id)}
                                                        disabled={item.count <= 0}>−</Button>
                                                <span className={`text-3xl tabular-nums ${item.count === 0 ? 'text-muted-foreground' : meta.lowStock ? 'text-orange-500' : ''}`}>{item.count}</span>
                                                <span className="text-muted-foreground text-sm">個</span>
                                                {meta.lowStock && <Badge variant="destructive">在庫少</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. 詳細設定（開封日・期限など） */}
                            {(item.openedDate || item.expiryDays) && (
                                <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
                                    {item.openedDate && (
                                        <div><p className="text-xs text-muted-foreground mb-1">開封日</p><p>{item.openedDate}</p></div>
                                    )}
                                    {item.expiryDays && (
                                        <div><p className="text-xs text-muted-foreground mb-1">使用期限</p><p>開封後{item.expiryDays}日</p></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                ) : (
                    /* ==========================================================
                       Edit form（編集モード）
                       ========================================================== */
                    <Card className="p-5 space-y-4">
                        {/* 1. 基本情報・内容量 */}
                        <div className="space-y-1.5 relative">
                            <Label>商品名</Label>
                            <Input
                                value={editForm.editName}
                                onChange={(e) => editSetters.setEditName(e.target.value)}
                                onFocus={() => uiSetters.setIsNameFocused(true)}
                                onBlur={() => setTimeout(() => uiSetters.setIsNameFocused(false), 200)}
                                className="h-11" autoComplete="off"
                            />
                            {ui.isNameFocused && dropdowns.filteredNames.length > 0 && (
                                <ul className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
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
                            <Label>ブランド</Label>
                            <Input value={editForm.editBrand} onChange={(e) => editSetters.setEditBrand(e.target.value)} className="h-11" />
                        </div>

                        <div className="space-y-1.5">
                            <Label>カテゴリ</Label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button key={cat} type="button" onClick={() => editSetters.setEditCategory(cat)}
                                            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${editForm.editCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 内容量入力欄を基本情報グループに移動 */}
                        <div className="space-y-1.5 pt-2">
                            <Label>内容量</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Input inputMode="decimal" placeholder="例: 300" value={editForm.editContentAmount} onChange={(e) => editSetters.setEditContentAmount(e.target.value)} className="h-11 col-span-2" />
                                <select value={editForm.editContentUnit} onChange={(e) => editSetters.setEditContentUnit(e.target.value as ContentUnit)} className="h-11 rounded-md border bg-input-background px-3 text-sm">
                                    <option value="pcs">本</option><option value="ml">ml</option><option value="g">g</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. 購入情報 */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="space-y-1.5 relative">
                                <Label htmlFor="shop" className="flex items-center gap-1"><Store className="w-3.5 h-3.5 text-muted-foreground" />買った場所（お店）</Label>
                                <Input
                                    id="shop" value={editForm.editShop}
                                    onChange={(e) => editSetters.setEditShop(e.target.value)}
                                    onFocus={() => uiSetters.setIsShopFocused(true)}
                                    onBlur={() => setTimeout(() => uiSetters.setIsShopFocused(false), 200)}
                                    placeholder="例：マツモトキヨシ" className="h-11" autoComplete="off"
                                />
                                {ui.isShopFocused && dropdowns.filteredShops.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {dropdowns.filteredShops.map((s) => (
                                            <li key={s} className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                                                onClick={() => { editSetters.setEditShop(s); uiSetters.setIsShopFocused(false); }}>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label>購入価格 (円)</Label>
                                <Input type="number" value={editForm.editPrice} onChange={(e) => editSetters.setEditPrice(e.target.value)} className="h-11" />
                            </div>
                        </div>

                        {/* 3. 在庫管理設定 */}
                        <div className="space-y-2 pt-4 border-t border-border">
                            <Label>管理タイプ</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Card
                                    className={`p-3 cursor-pointer transition-all text-center ${
                                        editForm.editType === 'count'
                                            ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500 shadow-sm'
                                            : 'hover:border-emerald-500/30 border-border'
                                    }`}
                                    onClick={() => editSetters.setEditType('count')}
                                >
                                    <Package className={`w-8 h-8 mx-auto mb-2 ${editForm.editType === 'count' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                    <p className="text-sm font-bold text-foreground">数量で管理</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                        1つずつ消費するもの<br/>(食品・乾電池など)
                                    </p>
                                </Card>

                                <Card
                                    className={`p-3 cursor-pointer transition-all text-center ${
                                        editForm.editType === 'both' || editForm.editType === 'volume'
                                            ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500 shadow-sm'
                                            : 'hover:border-blue-500/30 border-border'
                                    }`}
                                    onClick={() => {
                                        editSetters.setEditType('both');
                                        if (editForm.editVolumeLevel === 0) editSetters.setEditVolumeLevel(5);
                                    }}
                                >
                                    <Layers className={`w-8 h-8 mx-auto mb-2 ${editForm.editType === 'both' || editForm.editType === 'volume' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                    <p className="text-sm font-bold text-foreground">残量ゲージで管理</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                        少しずつ減っていくもの<br/>(洗剤・化粧水など)
                                    </p>
                                </Card>
                            </div>
                        </div>

                        {editForm.editType === 'count' ? (
                            <div className="space-y-1.5 p-4 bg-muted/20 rounded-xl border border-border">
                                <Label>現在の在庫数</Label>
                                <div className="flex items-center gap-4 pt-1">
                                    <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg" onClick={() => editSetters.setEditCount(Math.max(0, editForm.editCount - 1))}>−</Button>
                                    <span className="text-3xl w-16 text-center tabular-nums font-medium">{editForm.editCount}</span>
                                    <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg" onClick={() => editSetters.setEditCount(editForm.editCount + 1)}>＋</Button>
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
                                            <button key={i} type="button" onClick={() => editSetters.setEditVolumeLevel(i)}
                                                    className={`w-full max-w-[48px] rounded-sm transition-all shadow-sm ${i <= editForm.editVolumeLevel ? (editForm.editVolumeLevel <= 1 ? 'bg-red-500' : 'bg-blue-500') : 'bg-white border border-border/50'}`}
                                                    style={{ height: `${i * 6 + 10}px` }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-5 border-t border-blue-200/50">
                                    <Label className="flex items-center gap-1.5 text-slate-700 font-bold">
                                        <Package className="w-4 h-4" /> 未開封ストック数
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-white" onClick={() => editSetters.setEditCount(Math.max(0, editForm.editCount - 1))}>−</Button>
                                        <span className="text-3xl w-16 text-center tabular-nums font-medium">{editForm.editCount}</span>
                                        <Button type="button" variant="outline" className="h-12 w-12 rounded-full p-0 text-lg bg-white" onClick={() => editSetters.setEditCount(editForm.editCount + 1)}>＋</Button>
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
                                            {editForm.editType === 'count'
                                                ? 'この数量以下になると警告マークを表示します'
                                                : '未開封ストックがこの数以下になると警告します'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 w-10 rounded-full p-0 text-lg bg-white border-orange-200 text-orange-600"
                                            onClick={() => editSetters.setEditLowThreshold(String(Math.max(0, parseInt(editForm.editLowThreshold || '0') - 1)))}
                                        >
                                            −
                                        </Button>
                                        <span className="text-2xl w-8 text-center tabular-nums font-medium text-orange-600">
                                            {editForm.editLowThreshold || '0'}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 w-10 rounded-full p-0 text-lg bg-white border-orange-200 text-orange-600"
                                            onClick={() => editSetters.setEditLowThreshold(String(parseInt(editForm.editLowThreshold || '0') + 1))}
                                        >
                                            ＋
                                        </Button>
                                    </div>
                                </div>

                                {(editForm.editType === 'both' || editForm.editType === 'volume') && parseInt(editForm.editLowThreshold || '0') === 0 && (
                                    <div className="mt-3 pt-3 border-t border-orange-200/50">
                                        <p className="text-[10px] text-orange-600/80 leading-relaxed font-medium">
                                            💡 基準値を「0」にした場合、使用中のボトルの残量が少なくなったタイミングでアラートを表示します。
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* 4. 詳細設定 */}
                        <div className="space-y-4 bg-muted/10 p-3 rounded-lg border border-border/50 mt-4">
                            <div className="space-y-1.5"><Label>開封日</Label><Input type="date" value={editForm.editOpenedDate} onChange={(e) => editSetters.setEditOpenedDate(e.target.value)} className="h-11 w-full" /></div>
                            <div className="space-y-1.5"><Label>使用期限（日数）</Label><Input type="number" value={editForm.editExpiryDays} onChange={(e) => editSetters.setEditExpiryDays(e.target.value)} className="h-11 w-full" /></div>
                        </div>
                    </Card>
                )}

                {/* Purchase history */}
                {meta.purchaseHistory.length > 1 && (
                    <Card className="p-4">
                        <h3 className="mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" />購入履歴</h3>
                        <div className="space-y-2">
                            {meta.purchaseHistory.slice(0, 10).map((record) => (
                                <div key={record.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                                    <span className="text-muted-foreground">{record.purchaseDate}</span>
                                    <span>{record.price > 0 ? `¥${record.price.toLocaleString()}` : '−'}
                                        {meta.lowestPrice !== null && record.price === meta.lowestPrice && <span className="text-emerald-500 ml-1 text-xs">最安値</span>}
                  </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 gap-1.5" onClick={handlers.handleArchive}>
                        <Archive className="w-4 h-4" />{item.isArchived ? 'アーカイブ解除' : 'アーカイブ'}
                    </Button>
                    <Button variant="destructive" className="gap-1.5" onClick={() => uiSetters.setShowDeleteConfirm(true)}>
                        <Trash2 className="w-4 h-4" />削除
                    </Button>
                </div>

                {/* Delete confirmation */}
                {ui.showDeleteConfirm && (
                    <Card className="p-4 border-red-200 bg-red-50">
                        <p className="text-sm text-red-700 mb-3">「{item.name}」を削除しますか？この操作は取り消せません。</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => uiSetters.setShowDeleteConfirm(false)} className="flex-1">キャンセル</Button>
                            <Button variant="destructive" size="sm" onClick={handlers.handleDelete} className="flex-1">削除する</Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}