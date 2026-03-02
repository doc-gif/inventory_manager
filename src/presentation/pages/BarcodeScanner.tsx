import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let intervalId: number | null = null;
    let cancelled = false;

    const startScanner = async () => {
      // 1. DOM要素が確実に存在するまで待つ
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
                  // 1回読めたら停止して返す（連続発火防止）
                  try {
                    if (scannerRef.current?.isScanning) {
                      await scannerRef.current.stop();
                    }
                  } catch {
                    // stop失敗は握りつぶし（UIは次に進める）
                  }
                  setScanning(false);

                  const code = String(text).trim();
                  if (code) onScan(code);
                  onClose(); },
                (msg) => { /* スキャン中... */ }
            );
            setScanning(true);
          } catch (err) {
            setError('カメラへのアクセスを許可してください。');
          }
        }
      }, 100); // 100msごとにDOM出現をチェック
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

  return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              バーコードをスキャン
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : (
                <>
                  <div id="barcode-reader" className="w-full rounded-lg overflow-hidden" />
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

            <Button variant="outline" onClick={handleClose} className="w-full">
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
