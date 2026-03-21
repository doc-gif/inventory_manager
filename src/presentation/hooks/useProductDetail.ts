import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { type Category, type ContentUnit, ItemType } from '@/domain/models/inventory-management-types';
import { useInventoryStore } from '@/application/stores/useInventoryStore';
import { formatContent, getUnitPrice } from '@/domain/services/pricing';
import {
    isLowStock, isExpired, isExpiringSoon, getDaysUntilExpiry,
    selectLowestPrice, selectUniqueShops
} from '@/application/stores/inventorySelectors';

export function useProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const items = useInventoryStore(s => s.items);
    const history = useInventoryStore(s => s.history);
    const updateItem = useInventoryStore(s => s.updateItem);
    const consumeCount = useInventoryStore(s => s.consumeCount);
    const setVolumeLevel = useInventoryStore(s => s.setVolumeLevel);
    const deleteItem = useInventoryStore(s => s.deleteItem);

    const item = items.find((i) => i.id === id);
    const uniqueShops = selectUniqueShops(items, history);

    // ==========================================
    // 1. UIの状態（モード切り替えなど）
    // ==========================================
    const [editing, setEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [isShopFocused, setIsShopFocused] = useState(false);

    // ==========================================
    // 2. 編集フォームの状態
    // ==========================================
    const [editName, setEditName] = useState('');
    const [editBrand, setEditBrand] = useState('');
    const [editType, setEditType] = useState<ItemType>('count');
    const [editCount, setEditCount] = useState(0);
    const [editVolumeLevel, setEditVolumeLevel] = useState(5);
    const [editPrice, setEditPrice] = useState('');
    const [editCategory, setEditCategory] = useState<Category>('日用品');
    const [editOpenedDate, setEditOpenedDate] = useState('');
    const [editExpiryDays, setEditExpiryDays] = useState('');
    const [editLowThreshold, setEditLowThreshold] = useState('');
    const [editContentAmount, setEditContentAmount] = useState<string>('');
    const [editContentUnit, setEditContentUnit] = useState<ContentUnit>('pcs');
    const [editShop, setEditShop] = useState('');

    // ==========================================
    // 3. 派生データ（計算結果やサジェスト）
    // ==========================================
    const existingNames = Array.from(new Set(items.map(i => i.name)));
    const filteredNames = existingNames.filter(n => n.toLowerCase().includes(editName.toLowerCase()));
    const filteredShops = uniqueShops.filter(s => s.toLowerCase().includes(editShop.toLowerCase()));

    const lowStock = item ? isLowStock(item) : false;
    const expired = item ? isExpired(item) : false;
    const expiringSoon = item ? isExpiringSoon(item) : false;
    const daysLeft = item ? getDaysUntilExpiry(item) : null;
    const lowestPrice = item ? selectLowestPrice(history, item.name) : null;
    const purchaseHistory = item ? history.filter((h) => h.name.toLowerCase() === item.name.toLowerCase()) : [];

    const unitPrice = item ? getUnitPrice(item) : null;
    const contentLabel = item ? formatContent(item.contentAmount, item.contentUnit) : null;

    // ==========================================
    // 4. アクション（関数）
    // ==========================================
    const startEditing = () => {
        if (!item) return;
        setEditName(item.name);
        setEditBrand(item.brand);
        setEditType(item.type);
        setEditCount(item.count);
        setEditVolumeLevel(item.volumeLevel);
        setEditPrice(item.price > 0 ? String(item.price) : '');
        setEditCategory(item.category);
        setEditOpenedDate(item.openedDate || '');
        setEditExpiryDays(item.expiryDays ? String(item.expiryDays) : '');
        setEditLowThreshold(String(item.lowThreshold));
        setEditContentAmount(item.contentAmount ? String(item.contentAmount) : '');
        setEditContentUnit(item.contentUnit ?? 'pcs');
        setEditShop(item.shop || '');
        setEditing(true);
    };

    const saveEdit = () => {
        if (!item) return;
        if (!editName.trim()) {
            toast.error('商品名を入力してください');
            return;
        }

        const parsedContentAmount = editContentAmount.trim() === '' ? undefined : Number(editContentAmount);
        if (parsedContentAmount !== undefined && (!Number.isFinite(parsedContentAmount) || parsedContentAmount <= 0)) {
            toast.error("内容量は0より大きい数値で入力してください");
            return;
        }

        updateItem(item.id, {
            name: editName.trim(),
            brand: editBrand.trim(),
            type: editType,
            count: editCount,
            volumeLevel: editVolumeLevel,
            price: editPrice ? parseInt(editPrice) : 0,
            category: editCategory,
            openedDate: editOpenedDate || null,
            expiryDays: editExpiryDays ? parseInt(editExpiryDays) : null,
            lowThreshold: isNaN(parseInt(editLowThreshold)) ? 2 : parseInt(editLowThreshold),
            contentAmount: parsedContentAmount,
            contentUnit: parsedContentAmount ? editContentUnit : undefined,
            shop: editShop.trim() || undefined,
        });
        setEditing(false);
        toast.success('保存しました');
    };

    const handleVolumeChange = (newLevel: number) => {
        if (!item) return;

        if (item.type === 'both' && newLevel === 0) {
            if (item.count > 0) {
                updateItem(item.id, {
                    count: item.count - 1,
                    volumeLevel: 5,
                    openedDate: new Date().toISOString().split('T')[0]
                });
                toast.success('ストックを1つ開封しました！', {
                    description: `未開封ストックは残り ${item.count - 1} 個です。`,
                    icon: React.createElement(Package, { className: "w-4 h-4" })
                });
            } else {
                setVolumeLevel(item.id, 0);
                toast.error('使い切りました。在庫がありません！');
            }
        } else {
            setVolumeLevel(item.id, newLevel);
        }
    };

    const handleDelete = () => {
        if (!item) return;
        deleteItem(item.id);
        toast.success(`「${item.name}」を削除しました`);
        navigate('/');
    };

    const goBack = () => navigate(-1);
    const goHome = () => navigate('/');

    return {
        item,
        meta: {
            lowStock, expired, expiringSoon, daysLeft, lowestPrice, purchaseHistory, unitPrice, contentLabel
        },
        ui: {
            editing, showDeleteConfirm, isNameFocused, isShopFocused
        },
        uiSetters: {
            setEditing, setShowDeleteConfirm, setIsNameFocused, setIsShopFocused
        },
        editForm: {
            editName, editBrand, editType, editCount, editVolumeLevel, editPrice, editCategory,
            editOpenedDate, editExpiryDays, editLowThreshold, editContentAmount, editContentUnit, editShop
        },
        editSetters: {
            setEditName, setEditBrand, setEditType, setEditCount, setEditVolumeLevel, setEditPrice, setEditCategory,
            setEditOpenedDate, setEditExpiryDays, setEditLowThreshold, setEditContentAmount, setEditContentUnit, setEditShop
        },
        dropdowns: {
            filteredNames, filteredShops
        },
        handlers: {
            startEditing, saveEdit, handleVolumeChange, handleDelete, consumeCount, goBack, goHome
        }
    };
}