import { useRef, useState } from 'react';
import { toast } from 'sonner';
// 👇 toPng から toBlob に戻します
import { toBlob } from 'html-to-image';
import { useInventoryStore } from '@/application/stores/useInventoryStore';

export function useShoppingList() {
    const { items, isLowStock, getLowestPrice } = useInventoryStore();
    const listRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // プレビュー表示用のURLと、シェア用の生のファイルデータ(Blob)を両方保持する
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);

    const shoppingItems = items.filter((it) => !it.isArchived && isLowStock(it));
    const groupedByShop = shoppingItems.reduce((acc, item) => {
        const shopName = item.shop || 'お店未指定';
        if (!acc[shopName]) acc[shopName] = [];
        acc[shopName].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    const shopNames = Object.keys(groupedByShop).sort();

    const handleCopyText = async () => {
        if (shopNames.length === 0) return;
        let textToCopy = '📝 買い物リスト\n\n';
        shopNames.forEach((shop) => {
            textToCopy += `【${shop}】\n`;
            groupedByShop[shop].forEach((item) => {
                const lowestPrice = getLowestPrice(item.name);
                const priceText = lowestPrice ? ` (底値: ¥${lowestPrice})` : '';
                const contentText = item.contentAmount && item.contentUnit ? ` [${item.contentAmount}${item.contentUnit}]` : '';
                const brandText = item.brand ? `（${item.brand}）` : '';
                textToCopy += `・${item.name}${brandText}${contentText}${priceText}\n`;
            });
            textToCopy += '\n';
        });
        try {
            await navigator.clipboard.writeText(textToCopy);
            toast.success('リストをコピーしました');
        } catch (err) {
            toast.error('コピーに失敗しました');
        }
    };

    // ① 画像を生成して、プレビュー用のダイアログを開く処理
    const handleGeneratePreview = async () => {
        if (!listRef.current || shopNames.length === 0) return;
        setIsGenerating(true);

        try {
            const blob = await toBlob(listRef.current, {
                backgroundColor: '#ffffff',
                pixelRatio: 2, // 高画質化
            });

            if (!blob) {
                toast.error('画像データの作成に失敗しました');
                return;
            }

            // Blobを保存し、プレビュー用のURLを発行する
            setImageBlob(blob);
            setPreviewImageUrl(URL.createObjectURL(blob));

        } catch (error) {
            console.error('画像生成エラー:', error);
            toast.error('画像の生成に失敗しました');
        } finally {
            setIsGenerating(false);
        }
    };

    // ②-A シェア専用処理（LINEなどで送る）
    const handleShare = async () => {
        if (!imageBlob || !previewImageUrl) return;

        const fileName = `買い物リスト_${new Date().toISOString().split('T')[0]}.png`;
        const file = new File([imageBlob], fileName, { type: 'image/png' });

        // ブラウザが画像ファイルのシェアに対応しているかチェック
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: '買い物リスト',
                });
            } catch (error) {
                console.log('シェアがキャンセルされました', error);
            }
        } else {
            toast.error('お使いの環境は画像の直接シェアに対応していません', { description: '「端末に保存」をお試しください' });
        }
    };

    // ②-B ダウンロード専用処理（スマホ・PC本体に保存）
    const handleDownload = () => {
        if (!previewImageUrl) return;

        const fileName = `買い物リスト_${new Date().toISOString().split('T')[0]}.png`;
        const link = document.createElement('a');
        link.href = previewImageUrl;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('画像を端末に保存しました');
    };

    // プレビューを閉じる時のクリーンアップ処理
    const closePreview = () => {
        setPreviewImageUrl(null);
        setImageBlob(null);
    };

    return {
        listRef,
        isGenerating,
        previewImageUrl,
        shopNames,
        groupedByShop,
        getLowestPrice,
        handleCopyText,
        handleGeneratePreview,
        handleShare,
        handleDownload,
        closePreview,
    };
}