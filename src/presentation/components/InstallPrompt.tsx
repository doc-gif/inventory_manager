import React, { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";
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

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showPrompt, setShowPrompt] = useState(true);

    useEffect(() => {
        // 1. すでにアプリとして開かれているか（Standaloneモード）チェック
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in window.navigator && (window.navigator as any).standalone);

        if (isStandalone) return; // すでにインストール済みの場合は何もしない

        // 2. 過去に「閉じる」を押したかチェック
        if (localStorage.getItem(DISMISS_KEY)) return;

        // 3. OSの判定（iOSかそれ以外か）
        const ua = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(ua);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // iOSはイベントが発火しないため、即座に手動インストール案内を表示する
            setShowPrompt(true);
        }

        // 4. Android/PC用：ブラウザがインストール条件を満たした時に発火するイベント
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // デフォルトのミニ情報バーを非表示にする
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true); // カスタムの案内を表示する
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    // インストールボタンが押された時の処理（Androidのみ）
    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // ネイティブのインストール確認ダイアログを表示
        deferredPrompt.prompt();

        // ユーザーが「インストール」か「キャンセル」を選んだ結果を受け取る
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    // 「閉じる」ボタンが押された時の処理
    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, "true"); // 次回から出さないように記憶
    };

    if (!showPrompt) return null;

    return (
        // ボトムナビゲーション（pb-24等）の少し上に固定表示する
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="max-w-lg mx-auto">
                <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                        aria-label="閉じる"
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

                            {isIOS ? (
                                // iOS向けの案内文
                                <div className="text-xs text-muted-foreground space-y-1.5 mt-2">
                                    <p className="flex items-center gap-1.5">
                                        1. 画面下部の <Share className="w-3.5 h-3.5" /> (共有) をタップ
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        2. <PlusSquare className="w-3.5 h-3.5" /> 「ホーム画面に追加」をタップ
                                    </p>
                                </div>
                            ) : (
                                // Android向けの案内文とボタン
                                <>
                                    <p className="text-xs text-muted-foreground mb-3">
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
