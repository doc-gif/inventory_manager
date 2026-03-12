import React from "react";
import { X, Download, Share, PlusSquare, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Card } from "@/presentation/components/ui/Card";
import { useInstallPrompt, PromptType } from "@/presentation/hooks/useInstallPrompt";

export function InstallPrompt() {
    const { showPrompt, promptType, handlers } = useInstallPrompt();

    if (!showPrompt || !promptType) return null;

    return (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="max-w-lg mx-auto">
                <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm relative">
                    <button
                        onClick={handlers.handleDismiss}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Download className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 pr-4">
                            <h3 className="font-semibold text-sm mb-1">
                                {promptType === PromptType.InAppBrowser ? "インストールするには" : "アプリをホーム画面に追加"}
                            </h3>

                            {/* 🌟 アプリ内ブラウザ向けの案内 */}
                            {promptType === PromptType.InAppBrowser && (
                                <div className="text-xs text-muted-foreground space-y-2 mt-2">
                                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-md font-medium text-[10px] mb-2 leading-tight">
                                        ⚠️ 現在アプリ内ブラウザで表示されています。<br/>インストールするには標準ブラウザで開き直してください。
                                    </div>
                                    <p className="flex text-left gap-1.5">
                                        <span className="shrink-0 font-bold">【iPhone】</span>
                                        <span>右下（または右上）のボタンから<br/><strong className="text-foreground">「Safariで開く」</strong>を選択</span>
                                    </p>
                                    <p className="flex text-left gap-1.5">
                                        <span className="shrink-0 font-bold">【Android】</span>
                                        <span>右上の「︙」から<br/><strong className="text-foreground">「ブラウザで開く」</strong>を選択</span>
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 text-xs bg-white"
                                        onClick={handlers.handleCopyUrl}
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        URLをコピーする
                                    </Button>
                                </div>
                            )}

                            {/* iOS Safari 向けの案内 */}
                            {promptType === PromptType.IosSafari && (
                                <div className="text-xs text-muted-foreground space-y-1.5 mt-2">
                                    <p className="flex items-center gap-1.5">
                                        1. 右下の <MoreHorizontal className="w-3.5 h-3.5" /> をタップ
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        2. <Share className="w-3.5 h-3.5" /> (共有) を選択
                                    </p>
                                    <p className="flex text-left gap-1.5">
                                        <span className="shrink-0">3.</span>
                                        <span>
                                            下にスクロールして<br/>
                                            <span className="inline-flex items-center gap-1 font-medium mt-0.5">
                                                <PlusSquare className="w-3.5 h-3.5" />「ホーム画面に追加」
                                            </span>
                                            をタップ
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* iOS Chrome 向けの案内 */}
                            {promptType === PromptType.IosChrome && (
                                <div className="text-xs text-muted-foreground space-y-1.5 mt-2">
                                    <p className="flex items-center gap-1.5">
                                        1. アドレスバーの <Share className="w-3.5 h-3.5" /> をタップ
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        2. <MoreHorizontal className="w-3.5 h-3.5" /> 「その他」をタップ
                                    </p>
                                    <p className="flex text-left gap-1.5">
                                        <span className="shrink-0">3.</span>
                                        <span>
                                            下にスクロールして<br/>
                                            <span className="inline-flex items-center gap-1 font-medium mt-0.5">
                                                <PlusSquare className="w-3.5 h-3.5" />「ホーム画面に追加」
                                            </span>
                                            を選択
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Android/PC 向けの案内 */}
                            {promptType === PromptType.Android && (
                                <>
                                    <p className="text-xs text-muted-foreground mb-3 mt-1">
                                        インストールすると、オフラインでもサクサク使えるようになります。
                                    </p>
                                    <Button size="sm" onClick={handlers.handleInstallClick} className="w-full text-xs">
                                        アプリをインストール
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}