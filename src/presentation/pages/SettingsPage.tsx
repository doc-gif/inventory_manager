import React from 'react';
import { ArrowLeft, Cloud, Shield, LogOut, CheckCircle2, AlertCircle, KeyRound, DownloadCloud } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Card } from '@/presentation/components/ui/Card';

import { useSettings } from '@/presentation/hooks/useSettings';

export function SettingsPage() {
    // フックから必要な状態と関数を取り出すだけ！
    const { state, setters, handlers } = useSettings();

    return (
        <div className="min-h-screen bg-muted/10 pb-20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
                <button onClick={handlers.goBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-lg">設定</h1>
            </div>

            <div className="p-4 space-y-6">
                <section>
                    <h2 className="text-sm font-bold text-muted-foreground mb-3 px-1">クラウド同期・家族共有</h2>

                    {state.isSyncing ? (
                        <Card className="p-5 border-primary/20 bg-primary/5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-full text-primary mt-1">
                                    {state.syncMode === 'e2ee' ? <Shield className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary flex items-center gap-1.5">
                                        同期ON <CheckCircle2 className="w-4 h-4" />
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        {state.syncMode === 'e2ee' ? '高度なプライバシーモード (E2EE) で安全に同期中です。' : '標準モードで同期中です。別の端末でもログインするだけで引き継げます。'}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={handlers.handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                ログアウトして同期を停止
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {!state.currentUser || state.viewState === 'login' ? (
                                <Card className="p-5 text-center space-y-3 border-border/50">
                                    <Cloud className="w-8 h-8 mx-auto text-muted-foreground/50" />
                                    <p className="text-sm font-medium">データをバックアップ・共有するにはログインしてください</p>
                                    <Button className="w-full" onClick={handlers.handleGoogleLogin} disabled={state.isLoading}>
                                        Googleでログイン
                                    </Button>
                                </Card>
                            ) : state.viewState === 'checking' ? (
                                <Card className="p-8 text-center border-border/50">
                                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground font-medium">クラウドのデータを照会中...</p>
                                </Card>
                            ) : state.viewState === 'restore' && state.remoteConfig?.syncMode === 'e2ee' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <Card className="p-5 border-orange-200 bg-orange-50/50">
                                        <div className="flex items-start gap-3 mb-4">
                                            <DownloadCloud className="w-5 h-5 text-orange-600 mt-1" />
                                            <div>
                                                <h3 className="font-bold text-orange-800">過去のデータが見つかりました</h3>
                                                <p className="text-xs text-orange-700/80 mt-1">
                                                    暗号化されたデータを復元するには、設定した同期パスワードを入力してください。
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                type="password"
                                                placeholder="同期パスワード"
                                                value={state.restorePassword}
                                                onChange={(e) => setters.setRestorePassword(e.target.value)}
                                                className="bg-white"
                                            />
                                            <Button className="w-full" onClick={handlers.handleRestoreSync} disabled={state.isLoading || state.restorePassword.length < 4}>
                                                <KeyRound className="w-4 h-4 mr-2" />
                                                データを復元して同期開始
                                            </Button>
                                        </div>
                                    </Card>
                                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={handlers.handleLogout}>
                                        別のアカウントでログイン
                                    </Button>
                                </div>
                            ) : state.viewState === 'setupNew' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm px-1 font-medium flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        {state.currentUserDisplayName} さん
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Card className={`p-4 cursor-pointer transition-all border-2 ${state.selectedMode === 'standard' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'}`} onClick={() => setters.setSelectedMode('standard')}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${state.selectedMode === 'standard' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><Cloud className="w-4 h-4" /></div>
                                                <div>
                                                    <h3 className="font-bold text-sm">標準モード（おすすめ）</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">ログインするだけで全端末の同期が完了します</p>
                                                </div>
                                            </div>
                                        </Card>
                                        <Card className={`p-4 cursor-pointer transition-all border-2 ${state.selectedMode === 'e2ee' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'}`} onClick={() => setters.setSelectedMode('e2ee')}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${state.selectedMode === 'e2ee' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><Shield className="w-4 h-4" /></div>
                                                <div>
                                                    <h3 className="font-bold text-sm">高度なプライバシー (E2EE)</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">専用パスワードで運営者からもデータを秘匿化します</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                    {state.selectedMode === 'e2ee' && (
                                        <div className="space-y-2 animate-in fade-in zoom-in-95">
                                            <label className="text-xs font-bold text-muted-foreground px-1">同期パスワードを設定</label>
                                            <Input type="password" placeholder="4文字以上のパスワード" value={state.password} onChange={(e) => setters.setPassword(e.target.value)} className="bg-white" />
                                            <p className="text-[10px] text-orange-600 flex items-start gap-1 mt-1 px-1">
                                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                このパスワードを忘れると、別のスマホでデータを復元できなくなります。
                                            </p>
                                        </div>
                                    )}
                                    <Button className="w-full h-12 text-base" onClick={handlers.handleStartNewSync} disabled={state.isLoading}>
                                        この設定で同期を開始する
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}