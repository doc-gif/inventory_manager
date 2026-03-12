import React from 'react';
import { Store, Copy, Image as ImageIcon, CheckCircle2, Share, Download } from 'lucide-react';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog';
import { useShoppingList } from '@/presentation/hooks/useShoppingList';

export function ShoppingList() {
    const {
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
    } = useShoppingList();

    if (shopNames.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-3" />
                <p>現在、買い出しが必要な商品はありません</p>
            </div>
        );
    }

    return (
        <div className="pb-24 px-4 pt-4 space-y-6">

            {/* アクションボタン */}
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-white" onClick={handleCopyText}>
                    <Copy className="w-4 h-4 mr-2" />
                    テキストをコピー
                </Button>
                {/* 👇 名前を「画像を作成」に変更 */}
                <Button className="flex-1" onClick={handleGeneratePreview} disabled={isGenerating}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {isGenerating ? '作成中...' : '画像を作成'}
                </Button>
            </div>

            {/* プレビュー＆シェアダイアログ */}
            <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>画像が完成しました</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto">
                        {/* 生成された画像のプレビュー */}
                        {previewImageUrl && (
                            <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-muted/30">
                                <img src={previewImageUrl} alt="買い物リストプレビュー" className="w-full h-auto" />
                            </div>
                        )}
                    </div>

                    {/* 👇 ダイアログ下部のボタン群を「シェア」と「保存」の2つに分割 */}
                    <div className="flex flex-col gap-2 pt-4 mt-auto border-t border-border">
                        <div className="flex gap-2">
                            <Button onClick={handleShare} variant="outline" className="flex-1 h-12 text-sm font-bold bg-white">
                                <Share className="w-4 h-4 mr-2" />
                                シェアする
                            </Button>
                            <Button onClick={handleDownload} className="flex-1 h-12 text-sm font-bold">
                                <Download className="w-4 h-4 mr-2" />
                                端末に保存
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={closePreview} className="w-full">
                            キャンセル
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 画像化するターゲットエリア（変更なし） */}
            <div ref={listRef} className="bg-background rounded-xl p-2 space-y-4">
                <div className="text-center pb-2 border-b border-border/50">
                    <h2 className="font-bold text-lg">📝 買い物リスト</h2>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('ja-JP')} 現在</p>
                </div>

                {shopNames.map((shop) => (
                    <div key={shop} className="space-y-2">
                        <h3 className="flex items-center gap-1.5 font-bold text-primary px-1">
                            <Store className="w-4 h-4" />
                            {shop}
                        </h3>
                        <Card className="overflow-hidden bg-white">
                            {groupedByShop[shop].map((item, index) => {
                                const lowestPrice = getLowestPrice(item.name);
                                return (
                                    <div key={item.id} className={`flex items-center justify-between p-3 ${index !== 0 ? 'border-t border-border/50' : ''}`}>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm leading-tight">{item.name}</span>
                                            {(item.brand || (item.contentAmount && item.contentUnit)) && (
                                                <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 line-clamp-1">
                                                    {item.brand && <span className="bg-muted px-1.5 py-0.5 rounded text-[9px]">{item.brand}</span>}
                                                    {item.contentAmount && item.contentUnit && (
                                                        <span>{item.contentAmount}{item.contentUnit}</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {lowestPrice !== null && item.price > 0 && (
                                            <div className="text-right ml-2 shrink-0">
                                                <span className="text-[10px] text-muted-foreground block">底値目安</span>
                                                <span className="text-sm font-bold text-emerald-600">¥{lowestPrice.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </Card>
                    </div>
                ))}
            </div>

        </div>
    );
}