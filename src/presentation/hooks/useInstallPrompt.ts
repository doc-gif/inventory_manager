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

export type PromptType = "ios-safari" | "ios-chrome" | "android" | "in-app-browser" | null;

export function useInstallPrompt() {
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

        // 3. 🌟 新規追加：アプリ内ブラウザ（LINE, Twitter, FB, IGなど）の検知を最優先で行う
        const isInAppBrowser = /line|instagram|facebook|fbav|twitter|fb_iab/.test(ua);
        if (isInAppBrowser) {
            setPromptType("in-app-browser");
            setShowPrompt(true);
            return; // アプリ内ブラウザの場合はここで処理終了
        }

        // 4. 完璧なiOS判定（iPadがMacのフリをしているケースもカバー）
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
            return;
        }

        // 5. Android/PC用：ブラウザがPWAとして認めた時のみ発火
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