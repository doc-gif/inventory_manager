import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Edit3,
  Archive,
  Trash2,
  Save,
  Tag,
  CalendarDays,
  CalendarClock,
  Package,
  Droplets,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Label } from '@/presentation/components/ui/Label';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { VolumeGauge } from '@/presentation/components/VolumeGauge';
import {CATEGORIES, VOLUME_LABELS, type Category, type ContentUnit} from '@/domain/models/inventory-management-types';
import { toast } from 'sonner';
import {useInventoryStore} from "@/application/stores/useInventoryStore";
import {formatContent, getUnitPrice} from "@/domain/services/pricing";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    items,
    updateItem,
    consumeCount,
    setVolumeLevel,
    archiveItem,
    unarchiveItem,
    deleteItem,
    isLowStock,
    isExpired,
    isExpiringSoon,
    getDaysUntilExpiry,
    getLowestPrice,
    history,
  } = useInventoryStore();

  const item = items.find((i) => i.id === id);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCount, setEditCount] = useState(0);
  const [editVolumeLevel, setEditVolumeLevel] = useState(5);
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('日用品');
  const [editOpenedDate, setEditOpenedDate] = useState('');
  const [editExpiryDays, setEditExpiryDays] = useState('');
  const [editLowThreshold, setEditLowThreshold] = useState('');
  const [editContentAmount, setEditContentAmount] = useState<string>("");
  const [editContentUnit, setEditContentUnit] = useState<ContentUnit>("pcs");

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">商品が見つかりません</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const startEditing = () => {
    setEditName(item.name);
    setEditBrand(item.brand);
    setEditCount(item.count);
    setEditVolumeLevel(item.volumeLevel);
    setEditPrice(item.price > 0 ? String(item.price) : '');
    setEditCategory(item.category);
    setEditOpenedDate(item.openedDate || '');
    setEditExpiryDays(item.expiryDays ? String(item.expiryDays) : '');
    setEditLowThreshold(String(item.lowThreshold));
    setEditContentAmount(item.contentAmount ? String(item.contentAmount) : "");
    setEditContentUnit(item.contentUnit ?? "pcs");
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      toast.error('商品名を入力してください');
      return;
    }

    const parsedContentAmount =
        editContentAmount.trim() === "" ? undefined : Number(editContentAmount);

    if (parsedContentAmount !== undefined && (!Number.isFinite(parsedContentAmount) || parsedContentAmount <= 0)) {
      toast.error("内容量は0より大きい数値で入力してください");
      return;
    }

    updateItem(item.id, {
      name: editName.trim(),
      brand: editBrand.trim(),
      count: editCount,
      volumeLevel: editVolumeLevel,
      price: editPrice ? parseInt(editPrice) : 0,
      category: editCategory,
      openedDate: editOpenedDate || null,
      expiryDays: editExpiryDays ? parseInt(editExpiryDays) : null,
      lowThreshold: parseInt(editLowThreshold) || 2,
      contentAmount: parsedContentAmount,
      contentUnit: parsedContentAmount ? editContentUnit : undefined,
    });
    setEditing(false);
    toast.success('保存しました');
  };

  const unitPrice = getUnitPrice(item);
  const contentLabel = formatContent(item.contentAmount, item.contentUnit);

  const handleDelete = () => {
    deleteItem(item.id);
    toast.success(`「${item.name}」を削除しました`);
    navigate('/');
  };

  const handleArchive = () => {
    if (item.isArchived) {
      unarchiveItem(item.id);
      toast.success('アーカイブを解除しました');
    } else {
      archiveItem(item.id);
      toast.success('アーカイブしました');
      navigate('/');
    }
  };

  const lowStock = isLowStock(item);
  const expired = isExpired(item);
  const expiringSoon = isExpiringSoon(item);
  const daysLeft = getDaysUntilExpiry(item);
  const lowestPrice = getLowestPrice(item.name);

  const purchaseHistory = history.filter(
    (h) => h.name.toLowerCase() === item.name.toLowerCase()
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="truncate max-w-[200px]">{item.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1">
                <Edit3 className="w-4 h-4" />
                編集
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={saveEdit} className="gap-1">
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
        {expired && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <Clock className="w-4 h-4 shrink-0" />
            使用期限が切れています
          </div>
        )}
        {expiringSoon && !expired && daysLeft !== null && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            <CalendarClock className="w-4 h-4 shrink-0" />
            使用期限まであと{daysLeft}日です
          </div>
        )}

        {/* Main info card */}
        {!editing ? (
          <Card className="p-5">
            <div className="space-y-4">
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

              {/* Stock display */}
              <div className="pt-2 border-t border-border">
                {item.type === 'count' ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">在庫数</p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 w-12 rounded-full p-0"
                        onClick={() => consumeCount(item.id)}
                        disabled={item.count <= 0}
                      >
                        −
                      </Button>
                      <span
                        className={`text-4xl tabular-nums ${
                          item.count === 0
                            ? 'text-red-500'
                            : lowStock
                            ? 'text-orange-500'
                            : ''
                        }`}
                      >
                        {item.count}
                      </span>
                      <span className="text-muted-foreground">個</span>
                      {lowStock && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          在庫少
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : item.type === 'volume' ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">残量</p>
                    <VolumeGauge
                      level={item.volumeLevel}
                      onChange={(level) => setVolumeLevel(item.id, level)}
                    />
                    {lowStock && (
                      <Badge variant="destructive" className="gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3" />
                        残量少
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">在庫数</p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-12 w-12 rounded-full p-0"
                          onClick={() => consumeCount(item.id)}
                          disabled={item.count <= 0}
                        >
                          −
                        </Button>
                        <span
                          className={`text-4xl tabular-nums ${
                            item.count === 0
                              ? 'text-red-500'
                              : lowStock
                              ? 'text-orange-500'
                              : ''
                          }`}
                        >
                          {item.count}
                        </span>
                        <span className="text-muted-foreground">個</span>
                        {lowStock && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            在庫少
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">各個の残量</p>
                      <VolumeGauge
                        level={item.volumeLevel}
                        onChange={(level) => setVolumeLevel(item.id, level)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase info */}
              <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    購入価格
                  </p>
                  <p>{item.price > 0 ? `¥${item.price.toLocaleString()}` : '未設定'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    購入日
                  </p>
                  <p>{item.purchaseDate || '未設定'}</p>
                </div>
              </div>

              {/* Lowest price */}
              {lowestPrice !== null && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    底値（過去最安値）
                  </p>
                  <p className="text-emerald-600">¥{lowestPrice.toLocaleString()}</p>
                </div>
              )}

              {/* 内容量 & 単位あたり価格（新規） */}
              {(contentLabel || unitPrice) && (
                  <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">内容量</p>
                      <p>{contentLabel ?? "未設定"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">単位あたり</p>
                      <p>{unitPrice?.label ?? "未設定"}</p>
                    </div>
                  </div>
              )}

              {/* Opened date / Expiry */}
              {(item.openedDate || item.expiryDays) && (
                <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                  {item.openedDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">開封日</p>
                      <p>{item.openedDate}</p>
                    </div>
                  )}
                  {item.expiryDays && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">使用期限</p>
                      <p>開封後{item.expiryDays}日</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ) : (
          /* Edit form */
          <Card className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>商品名</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>ブランド</Label>
              <Input value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>カテゴリ</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      editCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {item.type === 'count' ? (
              <div className="space-y-1.5">
                <Label>数量</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0"
                    onClick={() => setEditCount(Math.max(0, editCount - 1))}
                  >
                    −
                  </Button>
                  <span className="text-2xl w-12 text-center tabular-nums">{editCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0"
                    onClick={() => setEditCount(editCount + 1)}
                  >
                    ＋
                  </Button>
                </div>
              </div>
            ) : item.type === 'volume' ? (
              <div className="space-y-1.5">
                <Label>残量</Label>
                <div className="flex items-end gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditVolumeLevel(i)}
                      className={`w-10 rounded transition-all ${
                        i <= editVolumeLevel
                          ? editVolumeLevel <= 1
                            ? 'bg-red-500'
                            : editVolumeLevel <= 2
                            ? 'bg-orange-400'
                            : editVolumeLevel <= 3
                            ? 'bg-yellow-400'
                            : 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                      style={{ height: `${i * 8 + 12}px` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>数量</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 rounded-full p-0"
                      onClick={() => setEditCount(Math.max(0, editCount - 1))}
                    >
                      −
                    </Button>
                    <span className="text-2xl w-12 text-center tabular-nums">{editCount}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 rounded-full p-0"
                      onClick={() => setEditCount(editCount + 1)}
                    >
                      ＋
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>各個の残量</Label>
                  <div className="flex items-end gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditVolumeLevel(i)}
                        className={`w-10 rounded transition-all ${
                          i <= editVolumeLevel
                            ? editVolumeLevel <= 1
                              ? 'bg-red-500'
                              : editVolumeLevel <= 2
                              ? 'bg-orange-400'
                              : editVolumeLevel <= 3
                              ? 'bg-yellow-400'
                              : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                        style={{ height: `${i * 8 + 12}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>購入価格 (円)</Label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="h-11"
                />
              </div>
              {(item.type === 'count' || item.type === 'both') && (
                <div className="space-y-1.5">
                  <Label>在庫アラート閾値</Label>
                  <Input
                    type="number"
                    value={editLowThreshold}
                    onChange={(e) => setEditLowThreshold(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}
            </div>

            {/* 内容量（編集：新規） */}
            <div className="space-y-1.5">
              <Label>内容量</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                    inputMode="decimal"
                    placeholder="例: 300"
                    value={editContentAmount}
                    onChange={(e) => setEditContentAmount(e.target.value)}
                    className="h-11 col-span-2"
                />
                <select
                    value={editContentUnit}
                    onChange={(e) => setEditContentUnit(e.target.value as ContentUnit)}
                    className="h-11 rounded-md border bg-input-background px-3 text-sm"
                >
                  <option value="pcs">本</option>
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>開封日</Label>
                <Input
                  type="date"
                  value={editOpenedDate}
                  onChange={(e) => setEditOpenedDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>使用期限（日数）</Label>
                <Input
                  type="number"
                  value={editExpiryDays}
                  onChange={(e) => setEditExpiryDays(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Purchase history for this item */}
        {purchaseHistory.length > 1 && (
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              購入履歴
            </h3>
            <div className="space-y-2">
              {purchaseHistory.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground">{record.purchaseDate}</span>
                  <span>
                    {record.price > 0 ? `¥${record.price.toLocaleString()}` : '−'}
                    {lowestPrice !== null && record.price === lowestPrice && (
                      <span className="text-emerald-500 ml-1 text-xs">最安値</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={handleArchive}
          >
            <Archive className="w-4 h-4" />
            {item.isArchived ? 'アーカイブ解除' : 'アーカイブ'}
          </Button>
          <Button
            variant="destructive"
            className="gap-1.5"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            削除
          </Button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <Card className="p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-700 mb-3">
              「{item.name}」を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1">
                削除する
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}