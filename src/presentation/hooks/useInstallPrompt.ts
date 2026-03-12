import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const DISMISS_KEY = "install_prompt_dismissed";

// 🌟 新規：文字列ユニオンから Enum に変更
export enum PromptType {
    IosSafari = "ios-safari",
    IosChrome = "ios-chrome",
    Android = "android",
    InAppBrowser = "in-app-browser",
}

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    // Enum を使用した State 定義
    const [promptType, setPromptType] = useState<PromptType | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 1. スタンドアロン（アプリとして起動中）なら何もしない
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in window.navigator && (window.navigator as any).standalone);
        if (isStandalone) return;

        // 2. 過去に閉じていれば何もしない
        // ⚠️ デバッグ（テスト）中、LINEで毎回表示させたい場合は以下の1行をコメントアウトしてください
        if (localStorage.getItem(DISMISS_KEY)) return;

        const ua = window.navigator.userAgent.toLowerCase();

        // 3. アプリ内ブラウザの検知（Androidの汎用WebViewである 'wv' を追加）
        const isInAppBrowser = /line|instagram|facebook|fbav|twitter|fb_iab|wv/.test(ua);
        if (isInAppBrowser) {
            setPromptType(PromptType.InAppBrowser);
            setShowPrompt(true);
            return;
        }

        // 4. iOS判定
        const isIOSDevice =
            /iphone|ipad|ipod/.test(ua) ||
            (ua.includes("mac") && "ontouchend" in document);

        if (isIOSDevice) {
            if (ua.includes("crios")) {
                setPromptType(PromptType.IosChrome);
            } else {
                setPromptType(PromptType.IosSafari);
            }
            setShowPrompt(true);
            return;
        }

        // 5. Android/PC用（標準ブラウザ）
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setPromptType(PromptType.Android);
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

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("URLをコピーしました！", { description: "SafariやChromeに貼り付けてください" });
        } catch (error) {
            toast.error("URLのコピーに失敗しました");
        }
    };

    return {
        showPrompt,
        promptType,
        handlers: {
            handleInstallClick,
            handleDismiss,
            handleCopyUrl,
        },
    };
}