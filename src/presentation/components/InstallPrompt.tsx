import React from "react";
import { X, Download, Share, PlusSquare, Copy } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { useInstallPrompt, PromptType } from "@/presentation/hooks/useInstallPrompt";

export function InstallPrompt() {
    const { showPrompt, promptType, handlers } = useInstallPrompt();

    if (!showPrompt || !promptType) return null;

    return (
        // 🌟 改善: 画面の一番下（bottom-0）に配置し、iOSのボトムシートのようなデザインに変更
        // 背景を透過し、安全領域（safe-area）のパディングを追加してモダンに仕上げました
        <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="max-w-md mx-auto">
                {/* 丸みを上部だけ（rounded-t-3xl）にし、下から生えているようなUIに */}
                <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-border/50 bg-background/95 backdrop-blur-2xl rounded-t-3xl relative">
                    <button
                        onClick={handlers.handleDismiss}
                        className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                <Download className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex-1 pr-4">
                            <h3 className="font-bold text-base mb-1 text-foreground tracking-tight">
                                {promptType === PromptType.InAppBrowser ? "インストールするには" : "アプリをホーム画面に追加"}
                            </h3>

                            {/* アプリ内ブラウザ向けの案内 */}
                            {promptType === PromptType.InAppBrowser && (
                                <div className="text-xs text-muted-foreground space-y-2 mt-2">
                                    <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 rounded-lg font-medium text-[11px] mb-2 leading-relaxed">
                                        ⚠️ 現在アプリ内ブラウザで表示されています。<br/>インストールするには標準ブラウザで開き直してください。
                                    </div>
                                    <p className="flex text-left gap-1.5 items-center">
                                        <span className="shrink-0 font-bold bg-muted px-1.5 py-0.5 rounded text-[10px]">iPhone</span>
                                        <span>右下から <strong className="text-foreground">「Safariで開く」</strong></span>
                                    </p>
                                    <p className="flex text-left gap-1.5 items-center">
                                        <span className="shrink-0 font-bold bg-muted px-1.5 py-0.5 rounded text-[10px]">Android</span>
                                        <span>右上の「︙」から <strong className="text-foreground">「ブラウザで開く」</strong></span>
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full mt-3 h-10 text-xs font-bold bg-white rounded-xl shadow-sm"
                                        onClick={handlers.handleCopyUrl}
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        URLをコピーする
                                    </Button>
                                </div>
                            )}

                            {/* iOS Safari 向けの案内 */}
                            {promptType === PromptType.IosSafari && (
                                <div className="text-xs text-muted-foreground space-y-2 mt-2.5">
                                    <p className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">1</span>
                                        下の <Share className="w-4 h-4 mx-0.5 text-blue-500" /> (共有) をタップ
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                                        <span className="leading-relaxed">
                                            メニューをスクロールして<br/>
                                            <span className="inline-flex items-center gap-1 font-bold text-foreground mt-1 bg-muted/50 px-1.5 py-0.5 rounded">
                                                <PlusSquare className="w-3.5 h-3.5" />ホーム画面に追加
                                            </span> をタップ
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* iOS Chrome 向けの案内 */}
                            {promptType === PromptType.IosChrome && (
                                <div className="text-xs text-muted-foreground space-y-2 mt-2.5">
                                    <p className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">1</span>
                                        右上の <Share className="w-4 h-4 mx-0.5 text-blue-500" /> をタップ
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                                        <span className="leading-relaxed">
                                            メニューをスクロールして<br/>
                                            <span className="inline-flex items-center gap-1 font-bold text-foreground mt-1 bg-muted/50 px-1.5 py-0.5 rounded">
                                                <PlusSquare className="w-3.5 h-3.5" />ホーム画面に追加
                                            </span> をタップ
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Android/PC 向けの案内 */}
                            {promptType === PromptType.Android && (
                                <>
                                    <p className="text-[11px] text-muted-foreground mb-3 mt-2 leading-relaxed">
                                        インストールすると、全画面でサクサク使えるようになります。
                                    </p>
                                    <Button onClick={handlers.handleInstallClick} className="w-full h-10 text-xs font-bold rounded-xl shadow-sm">
                                        アプリをインストール
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}