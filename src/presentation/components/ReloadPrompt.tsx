import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';

export function ReloadPrompt() {
    // PWAのサービスワーカーの状態を監視するフック
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_, __) {
            console.log('SW Registered');
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    // 更新がない場合は何も表示しない
    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[100] p-4 bg-primary text-primary-foreground rounded-xl shadow-lg border border-primary/20 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <div>
                        <p className="text-sm font-bold">新しいバージョンがあります</p>
                        <p className="text-xs text-primary-foreground/80 mt-0.5">
                            最新の機能を利用するために更新してください。
                        </p>
                    </div>
                </div>
                <button onClick={close} className="p-1 text-primary-foreground/70 hover:text-primary-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    className="flex-1 bg-background text-foreground hover:bg-background/90"
                    onClick={() => updateServiceWorker(true)}
                >
                    今すぐ更新する
                </Button>
            </div>
        </div>
    );
}
