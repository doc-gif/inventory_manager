import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode';
import tsconfigPaths from "vite-tsconfig-paths"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        qrcode(),
        tailwindcss(),
        tsconfigPaths(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // アイコン類
            manifest: {
                name: 'おうちストック - 日用品管理', // 完全な名前
                short_name: 'おうちストック',       // スマホのホーム画面に表示される短い名前（重要！）
                description: '日用品の在庫と買い物を管理',
                theme_color: '#ffffff', // ブラウザのステータスバーの色
                background_color: '#ffffff', // 起動時のスプラッシュ画面の背景色
                display: 'standalone', // URLバーを隠してネイティブアプリのように全画面表示する設定
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
})