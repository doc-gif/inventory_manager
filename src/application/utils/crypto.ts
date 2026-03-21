/**
 * ユーティリティ: ArrayBuffer と Base64文字列 の相互変換
 */
function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * 1. マスターキーの生成 (標準モード / E2EEモード共通)
 * ランダムで強力なAES-GCM鍵（256ビット）を生成します
 */
export async function generateMasterKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true, // エクスポート可能にする（Firestoreに保存するため）
        ["encrypt", "decrypt"]
    );
}

/**
 * マスターキーを文字列(Base64)としてエクスポートする（標準モードのFirestore保存用）
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return bufferToBase64(exported);
}

/**
 * 文字列(Base64)からマスターキーを復元する
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
    const buffer = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        "raw",
        buffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * 2. データの圧縮と暗号化 (保存時)
 * オブジェクト -> JSON文字列 -> 圧縮(gzip) -> 暗号化(AES-GCM) -> Base64
 */
export async function encryptItemPayload<T>(item: T, masterKey: CryptoKey): Promise<{ payload: string; iv: string }> {
    const jsonString = JSON.stringify(item);
    const textEncoder = new TextEncoder();
    const encodedData = textEncoder.encode(jsonString);

    // 2. 圧縮 (CompressionStream: gzip)
    const compressionStream = new CompressionStream('gzip');
    const writer = compressionStream.writable.getWriter();

    // 💡 修正ポイント: 詰まり（デッドロック）を防ぐため、先に読み込みの準備をしておく
    const compressedBufferPromise = new Response(compressionStream.readable).arrayBuffer();

    // データを流し込んでパイプを閉じる
    writer.write(encodedData).finally(() => writer.close());

    // 読み込みが完了するのを待つ
    const compressedBuffer = await compressedBufferPromise;

    // 3. 暗号化 (AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        masterKey,
        compressedBuffer
    );

    return {
        payload: bufferToBase64(encryptedBuffer),
        iv: bufferToBase64(iv.buffer)
    };
}

/**
 * 3. データの復号と解凍 (読み込み時)
 * Base64 -> 暗号化バイナリ -> 復号(AES-GCM) -> 解凍(gzip) -> JSONパース -> オブジェクト
 */
export async function decryptItemPayload<T>(encryptedPayloadBase64: string, ivBase64: string, masterKey: CryptoKey): Promise<T> {
    const encryptedBuffer = base64ToBuffer(encryptedPayloadBase64);
    const iv = new Uint8Array(base64ToBuffer(ivBase64));

    // 2. 復号 (AES-GCM)
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        masterKey,
        encryptedBuffer
    );

    // 3. 解凍 (DecompressionStream: gzip)
    const decompressionStream = new DecompressionStream('gzip');
    const writer = decompressionStream.writable.getWriter();

    // 💡 修正ポイント: 同様に読み込みの準備を先に行う
    const decompressedBufferPromise = new Response(decompressionStream.readable).arrayBuffer();

    writer.write(new Uint8Array(decryptedBuffer)).finally(() => writer.close());

    const decompressedBuffer = await decompressedBufferPromise;

    // 4. 文字列化＆JSONパース
    const textDecoder = new TextDecoder();
    const jsonString = textDecoder.decode(decompressedBuffer);
    return JSON.parse(jsonString) as T;
}

/**
 * 4. 同期パスワードから鍵を生成する (E2EEモード用: PBKDF2)
 * ユーザーのパスワードから、マスターキーを暗号化するための別の鍵を作り出します
 */
export async function deriveKeyFromPassword(password: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
    const textEncoder = new TextEncoder();
    const passwordBuffer = textEncoder.encode(password);

    // パスワードをベース鍵としてインポート
    const baseKey = await crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    // PBKDF2でストレッチング（10万回ハッシュ化して総当たり攻撃を防ぐ）
    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltBuffer,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * 5. マスターキー自体を暗号化する (E2EEモード保存用)
 * @param masterKey - 保存したいマスターキー
 * @param passwordKey - deriveKeyFromPasswordで作った鍵
 * @returns { encryptedKeyBase64, ivBase64 }
 */
export async function encryptMasterKey(masterKey: CryptoKey, passwordKey: CryptoKey): Promise<{ encryptedKey: string; iv: string }> {
    // 1. マスターキーをエクスポート（生のバイナリにする）
    const rawMasterKey = await crypto.subtle.exportKey("raw", masterKey);

    // 2. パスワード鍵で暗号化
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        passwordKey,
        rawMasterKey
    );

    return {
        encryptedKey: bufferToBase64(encryptedBuffer),
        iv: bufferToBase64(iv.buffer)
    };
}

/**
 * 6. 暗号化されたマスターキーを復元する (E2EEモード読出用)
 */
export async function decryptMasterKey(encryptedKeyBase64: string, ivBase64: string, passwordKey: CryptoKey): Promise<CryptoKey> {
    const encryptedBuffer = base64ToBuffer(encryptedKeyBase64);
    const iv = new Uint8Array(base64ToBuffer(ivBase64));

    // パスワード鍵で復号
    const rawMasterKeyBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        passwordKey,
        encryptedBuffer
    );

    // 復元したバイナリをCryptoKeyとしてインポート
    return await crypto.subtle.importKey(
        "raw",
        rawMasterKeyBuffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

// 乱数（Salt）を生成・変換するユーティリティ
export function generateSaltBase64(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return bufferToBase64(salt.buffer);
}
export function getSaltBuffer(saltBase64: string): ArrayBuffer {
    return base64ToBuffer(saltBase64);
}