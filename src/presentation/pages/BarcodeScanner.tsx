import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Search, Bug, Info, Edit3 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog';

// ============================================================================
// 🛠️ デバッグモードの切り替えフラグ
// @ts-ignore
const DEBUG_MODE = import.meta.env.DEV;

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デバッグ（手動入力）用の状態
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    if (!open) return;
    if (DEBUG_MODE) return;

    let intervalId: number | null = null;
    let cancelled = false;

    const startScanner = async () => {
      const checkElement = setInterval(async () => {
        const element = document.getElementById('barcode-reader');
        if (element) {
          clearInterval(checkElement);
          try {
            const scanner = new Html5Qrcode('barcode-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (text) => {
                  try {
                    if (scannerRef.current?.isScanning) {
                      await scannerRef.current.stop();
                    }
                  } catch {}
                  setScanning(false);

                  const code = String(text).trim();
                  if (code) onScan(code);
                  onClose();
                },
                (_) => { /* スキャン中... */ }
            );
            setScanning(true);
          } catch (err) {
            setError('カメラへのアクセスを許可してください。');
          }
        }
      }, 100);
    };

    void startScanner();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
      setScanning(false);
    };
  }, [open, onClose, onScan]);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(console.error);
    }
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualInput.trim();
    if (code) {
      onScan(code);
      onClose();
    }
  };

  return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {DEBUG_MODE ? "バーコードを手入力 (デバッグ)" : "バーコードをスキャン"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {DEBUG_MODE ? (
                <div className="py-2 space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs flex items-center gap-2">
                    <Bug className="w-4 h-4 shrink-0" />
                    デバッグモードが有効です。カメラは起動しません。
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <Input
                        placeholder="例: 4901301326232"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit" disabled={!manualInput.trim()}>
                      <Search className="w-4 h-4 mr-1" />
                      検索
                    </Button>
                  </form>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : (
                <>
                  <div id="barcode-reader" className="w-full rounded-lg overflow-hidden bg-black/5" />
                  <p className="text-xs text-muted-foreground text-center">
                    バーコードまたはQRコードをカメラに向けてください
                  </p>
                  {scanning && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        読み取り中…
                      </p>
                  )}
                </>
            )}

            <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg border border-border/50 text-muted-foreground mt-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                読み取ったバーコードと商品名は、全ユーザーの検索を速くするための匿名の<strong className="text-foreground font-medium">「共有商品辞書」</strong>として蓄積されます。個人の在庫や「誰がいつスキャンしたか」が特定されることはありません。
              </p>
            </div>

            <Button onClick={handleClose} className="w-full mt-2">
              <Edit3 className="w-4 h-4 mr-2" />
              手動で入力する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}