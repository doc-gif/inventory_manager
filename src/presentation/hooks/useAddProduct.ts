import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { type Category, type ContentUnit, type ItemType } from '@/domain/models/inventory-management-types';
import { useInventoryStore } from '@/application/stores/useInventoryStore';
import { lookupBarcodeForAddProduct } from '@/application/use-cases/BarcodeLookupService';

export function useAddProduct() {
    const navigate = useNavigate();
    const { addItem, items, getUniqueShops } = useInventoryStore();
    const uniqueShops = getUniqueShops();

    // ==========================================
    // 1. フォームの状態（入力値）
    // ==========================================
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [type, setType] = useState<ItemType>('count');
    const [category, setCategory] = useState<Category>('日用品');
    const [count, setCount] = useState(1);
    const [volumeLevel, setVolumeLevel] = useState(5);
    const [price, setPrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [shop, setShop] = useState('');
    const [openedDate, setOpenedDate] = useState('');
    const [expiryDays, setExpiryDays] = useState('');
    const [lowThreshold, setLowThreshold] = useState('2');
    const [contentAmount, setContentAmount] = useState<string>('');
    const [contentUnit, setContentUnit] = useState<ContentUnit>('pcs');
    const [barcode, setBarcode] = useState('');

    // ==========================================
    // 2. UIの状態（開閉フラグなど）
    // ==========================================
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [isShopFocused, setIsShopFocused] = useState(false);

    // ==========================================
    // 3. ドロップダウン（サジェスト）用の派生データ
    // ==========================================
    const existingNames = Array.from(new Set(items.map(item => item.name)));
    const filteredNames = existingNames.filter(n => n.toLowerCase().includes(name.toLowerCase()));
    const filteredShops = uniqueShops.filter(s => s.toLowerCase().includes(shop.toLowerCase()));

    // ==========================================
    // 4. アクション（関数）
    // ==========================================
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
                toast.success("過去に取得した商品情報を読み込みました。必要に応じて修正してください。");
                return;
            }
            if (result.kind === "HIT_REMOTE") {
                applySuggestionToForm(result.suggestion);
                toast.success("商品情報を取得しました。必要に応じて修正してください。");
                return;
            }
            if (result.kind === "NOT_FOUND") {
                toast.message("商品情報が見つかりませんでした。バーコードは記録したので手入力してください。");
                return;
            }
            toast.message("情報の取得に失敗しました。手入力してください。");
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

        const parsedContentAmount = contentAmount.trim() === "" ? undefined : Number(contentAmount);
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
            shop: shop.trim() || undefined,
            openedDate: openedDate || null,
            expiryDays: expiryDays ? parseInt(expiryDays) : null,
            lowThreshold: isNaN(parseInt(lowThreshold)) ? 2 : parseInt(lowThreshold),
            barcode: barcode || null,
            contentAmount: parsedContentAmount,
            contentUnit: parsedContentAmount ? contentUnit : undefined,
        });

        toast.success(`「${name}」を追加しました`);
        navigate('/');
    };

    const goBack = () => navigate(-1);

    // UI（コンポーネント）側に必要なものだけをグループ化して返す
    return {
        form: {
            name, brand, type, category, count, volumeLevel, price, purchaseDate,
            shop, openedDate, expiryDays, lowThreshold, contentAmount, contentUnit, barcode
        },
        setters: {
            setName, setBrand, setType, setCategory, setCount, setVolumeLevel, setPrice, setPurchaseDate,
            setShop, setOpenedDate, setExpiryDays, setLowThreshold, setContentAmount, setContentUnit
        },
        ui: {
            showAdvanced, showScanner, isLookingUpBarcode, isNameFocused, isShopFocused
        },
        uiSetters: {
            setShowAdvanced, setShowScanner, setIsNameFocused, setIsShopFocused
        },
        dropdowns: {
            filteredNames, filteredShops
        },
        handlers: {
            handleSubmit, handleBarcodeScanned, goBack
        }
    };
}
