import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, CheckCircle2, Keyboard, ChevronDown } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useCartStore } from "@/store/cart-store";
import { products } from "@/data/products";

const BARCODE_MAP = Object.fromEntries(
  products.filter((p) => p.barcode).map((p) => [p.barcode!, p])
);

const SAMPLE_BARCODES = products
  .filter((p) => p.barcode)
  .map((p) => ({ code: p.barcode!, name: p.name }));

type Mode = "camera" | "simulate";

export default function BarcodeScanner({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [mode, setMode] = useState<Mode>("simulate");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [simInput, setSimInput] = useState("");
  const [simProgress, setSimProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const handleBarcode = useCallback(
    (code: string) => {
      const product = BARCODE_MAP[code];
      if (product) {
        addItem(product);
        setScanResult(product.name);
        setConfirmed(true);
        setTimeout(() => {
          setConfirmed(false);
          setScanResult(null);
        }, 2000);
      } else {
        setScanResult(`No product for barcode: ${code}`);
        setTimeout(() => setScanResult(null), 3000);
      }
    },
    [addItem]
  );

  // Camera mode
  useEffect(() => {
    if (!open || mode !== "camera") return;
    let html5Qr: Html5Qrcode | null = null;

    const startCamera = async () => {
      try {
        html5Qr = new Html5Qrcode("barcode-reader");
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            handleBarcode(decodedText);
            html5Qr?.pause();
            setTimeout(() => html5Qr?.resume(), 2500);
          },
          () => {}
        );
      } catch {
        setMode("simulate");
      }
    };

    const timeout = setTimeout(startCamera, 300);
    return () => {
      clearTimeout(timeout);
      if (html5Qr?.isScanning) {
        html5Qr.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [open, mode, handleBarcode]);

  // Cleanup on close
  useEffect(() => {
    if (!open && scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  }, [open]);

  const handleSimulate = (code: string) => {
    setScanning(true);
    setSimProgress(0);
    const interval = setInterval(() => {
      setSimProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setScanning(false);
          handleBarcode(code);
          return 0;
        }
        return p + 5;
      });
    }, 40);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Scan Barcode
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode(mode === "camera" ? "simulate" : "camera")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {mode === "camera" ? (
                  <><Keyboard size={12} /> Simulate</>
                ) : (
                  <><Camera size={12} /> Camera</>
                )}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Camera mode */}
            {mode === "camera" && (
              <div className="overflow-hidden rounded-xl bg-black">
                <div id="barcode-reader" ref={readerRef} className="min-h-[250px]" />
              </div>
            )}

            {/* Simulate mode */}
            {mode === "simulate" && (
              <div className="space-y-4">
                {/* Manual input */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Enter barcode number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      placeholder="e.g. 8901030840215"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-orange-500/20"
                    />
                    <button
                      onClick={() => simInput.trim() && handleSimulate(simInput.trim())}
                      disabled={scanning || !simInput.trim()}
                      className="rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition-all hover:bg-orange-700 disabled:opacity-50"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                {/* Preset barcodes */}
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <ChevronDown size={12} /> Quick scan presets
                  </p>
                  <div className="max-h-48 space-y-1.5 overflow-y-auto">
                    {SAMPLE_BARCODES.map((b) => (
                      <button
                        key={b.code}
                        onClick={() => handleSimulate(b.code)}
                        disabled={scanning}
                        className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-orange-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {b.name}
                        </span>
                        <span className="font-mono text-xs text-gray-400">{b.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scan progress */}
                {scanning && (
                  <div className="overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${simProgress}%` }}
                      className="h-2 rounded-full bg-orange-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Result overlay */}
            <AnimatePresence>
              {confirmed && scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 p-4 dark:bg-green-900/20"
                >
                  <CheckCircle2 size={20} className="text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      Product added!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {scanResult}
                    </p>
                  </div>
                </motion.div>
              )}
              {!confirmed && scanResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
                >
                  {scanResult}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
