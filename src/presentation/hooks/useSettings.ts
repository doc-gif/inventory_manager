import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/application/lib/firebase';
import { useInventoryStore } from '@/application/stores/useInventoryStore';
import { SyncService, type SyncMode, type SyncConfigDoc } from '@/application/services/SyncService';
import {
    generateMasterKey, exportKeyToBase64, importKeyFromBase64,
    deriveKeyFromPassword, encryptMasterKey, decryptMasterKey,
    generateSaltBase64, getSaltBuffer
} from '@/application/utils/crypto';

export function useSettings() {
    const navigate = useNavigate();
    const { userId, syncMode, setSyncConfig, stopSync, items } = useInventoryStore();

    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // 画面の状態遷移
    const [viewState, setViewState] = useState<'login' | 'checking' | 'setupNew' | 'restore'>('login');
    const [selectedMode, setSelectedMode] = useState<SyncMode>('standard');
    const [password, setPassword] = useState('');
    const [remoteConfig, setRemoteConfig] = useState<SyncConfigDoc | null>(null);
    const [restorePassword, setRestorePassword] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user && syncMode === 'none') {
                await checkExistingData(user.uid);
            }
        });
        return () => unsubscribe();
    }, [syncMode]);

    const checkExistingData = async (uid: string) => {
        setViewState('checking');
        const config = await SyncService.getSyncConfig(uid);

        if (config) {
            setRemoteConfig(config);
            setViewState('restore');
            if (config.syncMode === 'standard' && config.masterKeyBase64) {
                try {
                    const masterKey = await importKeyFromBase64(config.masterKeyBase64);
                    setSyncConfig(uid, masterKey, 'standard');
                    toast.success('データを復元し、同期を開始しました！');
                    navigate('/');
                } catch (e) {
                    toast.error('鍵の復元に失敗しました');
                }
            }
        } else {
            setViewState('setupNew');
        }
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(error);
            toast.error('ログインに失敗しました');
            setIsLoading(false);
        }
    };

    const handleStartNewSync = async () => {
        if (!currentUser) return;
        if (selectedMode === 'e2ee' && password.length < 4) {
            toast.error('4文字以上の同期パスワードを入力してください');
            return;
        }

        try {
            setIsLoading(true);

            // 🌟 デバッグ用：現在認識しているアイテム数をコンソールに出力
            console.log(`🚀 同期開始: 現在のローカルアイテム数は ${items.length}件 です`);

            const masterKey = await generateMasterKey();
            let configToSave: SyncConfigDoc;

            if (selectedMode === 'standard') {
                const masterKeyBase64 = await exportKeyToBase64(masterKey);
                configToSave = { syncMode: 'standard', masterKeyBase64, encryptedMasterKey: null, salt: null, iv: null };
            } else {
                const saltBase64 = generateSaltBase64();
                const passwordKey = await deriveKeyFromPassword(password, getSaltBuffer(saltBase64));
                const { encryptedKey, iv } = await encryptMasterKey(masterKey, passwordKey);
                configToSave = { syncMode: 'e2ee', masterKeyBase64: null, encryptedMasterKey: encryptedKey, salt: saltBase64, iv: iv };
            }

            await SyncService.saveSyncConfig(currentUser.uid, configToSave);
            setSyncConfig(currentUser.uid, masterKey, selectedMode);

            if (items.length > 0) {
                toast.info(`既存のデータ(${items.length}件)をクラウドに保存しています...`);
                // 内部でエラーが起きた場合はF12コンソールに赤文字で出力されます
                await Promise.all(
                    items.map(item => SyncService.pushItem(item, currentUser.uid, masterKey, selectedMode))
                );
            } else {
                console.warn("⚠️ ローカルにアイテムが1件もありませんでした。");
            }

            toast.success('クラウド同期を開始しました！');
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error('同期の開始に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreSync = async () => {
        if (!currentUser || !remoteConfig) return;
        if (!remoteConfig.salt || !remoteConfig.iv || !remoteConfig.encryptedMasterKey) return;

        try {
            setIsLoading(true);
            const passwordKey = await deriveKeyFromPassword(restorePassword, getSaltBuffer(remoteConfig.salt));
            const masterKey = await decryptMasterKey(remoteConfig.encryptedMasterKey, remoteConfig.iv, passwordKey);

            setSyncConfig(currentUser.uid, masterKey, 'e2ee');
            toast.success('データを復元し、同期を開始しました！');
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error('パスワードが間違っているか、復元に失敗しました');
            setRestorePassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        stopSync();
        await signOut(auth);
        setViewState('login');
        toast.success('同期を停止し、ログアウトしました');
    };

    return {
        state: {
            isLoading, currentUser, viewState, selectedMode, password,
            remoteConfig, restorePassword, isSyncing: syncMode !== 'none' && userId !== null,
            syncMode, currentUserDisplayName: currentUser?.displayName || ''
        },
        setters: {
            setSelectedMode, setPassword, setRestorePassword
        },
        handlers: {
            handleGoogleLogin, handleStartNewSync, handleRestoreSync, handleLogout,
            goBack: () => navigate(-1)
        }
    };
}