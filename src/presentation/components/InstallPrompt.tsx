import React, { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare, MoreHorizontal } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Card } from "@/presentation/components/ui/Card";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const DISMISS_KEY = "install_prompt_dismissed";

type PromptType = "ios-safari" | "ios-chrome" | "android" | null;

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [promptType, setPromptType] = useState<PromptType>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 1. スタンドアロン（アプリとして起動中）なら何もしない
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in window.navigator && (window.navigator as any).standalone);
        if (isStandalone) return;

        // 2. 過去に閉じていれば何もしない
        if (localStorage.getItem(DISMISS_KEY)) return;

        const ua = window.navigator.userAgent.toLowerCase();

        // 3. 完璧なiOS判定（iPadがMacのフリをしているケースもカバー）
        const isIOSDevice =
            /iphone|ipad|ipod/.test(ua) ||
            (ua.includes("mac") && "ontouchend" in document);

        if (isIOSDevice) {
            // iOS Chrome か iOS Safari かを判定
            if (ua.includes("crios")) {
                setPromptType("ios-chrome");
            } else {
                setPromptType("ios-safari");
            }
            setShowPrompt(true);
            return; // iOSの場合はここで処理終了（以下のイベントは待たない）
        }

        // 4. Android/PC用：ブラウザがPWAとして認めた時のみ発火
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setPromptType("android");
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setShowPrompt(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, "true");
    };

    if (!showPrompt || !promptType) return null;

    return (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="max-w-lg mx-auto">
                <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm relative">
                    <button
                        onClick={handleDismiss}
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
                            <h3 className="font-semibold text-sm mb-1">アプリをホーム画面に追加</h3>

                            {/* iOS Safari 向けの案内 */}
                            {promptType === "ios-safari" && (
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
                            {promptType === "ios-chrome" && (
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
                            {promptType === "android" && (
                                <>
                                    <p className="text-xs text-muted-foreground mb-3 mt-1">
                                        インストールすると、オフラインでもサクサク使えるようになります。
                                    </p>
                                    <Button size="sm" onClick={handleInstallClick} className="w-full text-xs">
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