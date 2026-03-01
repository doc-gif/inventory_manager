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
    if (!open) {
      // クリーンアップ処理
      return;
    }

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
                (text) => { /* 成功処理 */ },
                (msg) => { /* スキャン中... */ }
            );
            setScanning(true);
          } catch (err) {
            setError('カメラへのアクセスを許可してください。');
          }
        }
      }, 100); // 100msごとにDOM出現をチェック

      return () => clearInterval(checkElement);
    };

    startScanner();
  }, [open]);

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
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="w-full rounded-lg overflow-hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                バーコードまたはQRコードをカメラに向けてください
              </p>
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
