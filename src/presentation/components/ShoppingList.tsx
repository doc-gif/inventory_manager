import React from 'react';
import { Store, Copy, Image as ImageIcon, CheckCircle2, Share, Download, Info, AlertTriangle } from 'lucide-react';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
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

    // 空状態（ゼロデータ）の画面を親切にし、仕様を説明する
    if (shopNames.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="font-bold text-foreground mb-2">現在、買い物リストは空です</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    在庫一覧で<strong className="text-foreground">「在庫少」のアラート</strong>が出た商品が、<br />
                    自動的にこのリストへ追加されます。
                </p>
            </div>
        );
    }

    return (
        <div className="pb-24 px-4 pt-4 space-y-4">

            {/* この画面が「自動生成」であることを伝えるガイドバナー */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">
                    在庫一覧で<strong className="font-bold">「在庫少」</strong>となっている商品が、自動的にリストアップされています。
                </p>
            </div>

            {/* 🌟 改善: アクションボタンのセクションの文字を大きくし、読みやすさを向上 */}
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 flex flex-col gap-3">
                <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Share className="w-4 h-4 text-primary" />
                        家族に頼む・メモに残す
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">
                        LINE等で買い物を頼んだり、別のアプリに保存できます。
                    </p>
                </div>
                <div className="flex gap-2.5">
                    <Button variant="outline" className="flex-1 bg-white h-11 text-sm font-bold shadow-sm" onClick={handleCopyText}>
                        <Copy className="w-4 h-4 mr-1.5" />
                        テキストコピー
                    </Button>
                    <Button className="flex-1 h-11 text-sm font-bold shadow-sm" onClick={handleGeneratePreview} disabled={isGenerating}>
                        <ImageIcon className="w-4 h-4 mr-1.5" />
                        {isGenerating ? '作成中...' : '画像で共有'}
                    </Button>
                </div>
            </div>

            {/* プレビュー＆シェアダイアログ */}
            <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>画像が完成しました</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto">
                        {previewImageUrl && (
                            <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-muted/30">
                                <img src={previewImageUrl} alt="買い物リストプレビュー" className="w-full h-auto" />
                            </div>
                        )}
                    </div>

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

            {/* 画像化するターゲットエリア */}
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
                        <Card className="overflow-hidden bg-white shadow-sm border-border/60">
                            {groupedByShop[shop].map((item, index) => {
                                const lowestPrice = getLowestPrice(item.name);
                                return (
                                    <div key={item.id} className={`flex items-center justify-between p-3.5 ${index !== 0 ? 'border-t border-border/50' : ''}`}>
                                        <div className="flex flex-col gap-1.5 pr-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm leading-tight">{item.name}</span>
                                                <Badge variant="destructive" className="px-1 py-0 h-4 text-[9px] flex gap-0.5 items-center">
                                                    <AlertTriangle className="w-2.5 h-2.5" />
                                                    在庫少
                                                </Badge>
                                            </div>
                                            {(item.brand || (item.contentAmount && item.contentUnit)) && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                                                    {item.brand && <span className="bg-muted px-1.5 py-0.5 rounded font-medium">{item.brand}</span>}
                                                    {item.contentAmount && item.contentUnit && (
                                                        <span>{item.contentAmount}{item.contentUnit}</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {lowestPrice !== null && item.price > 0 && (
                                            <div className="text-right ml-auto shrink-0 pl-2 border-l border-border/50">
                                                <span className="text-[10px] text-muted-foreground block font-medium">底値目安</span>
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