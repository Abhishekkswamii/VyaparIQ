import { useState } from "react";
import { Camera } from "lucide-react";
import { useLocation } from "react-router-dom";
import BarcodeScanner from "./BarcodeScanner";

export default function ScanFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Only show on Shop and Cart pages
  if (pathname !== "/shop" && pathname !== "/cart") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 hover:scale-105 active:scale-95"
        aria-label="Scan barcode"
      >
        <Camera size={22} />
      </button>
      <BarcodeScanner open={open} onClose={() => setOpen(false)} />
    </>
  );
}
