"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, X } from "lucide-react";

// Limit to formats that show up on packaged food: EAN_13 (EU/UK), EAN_8,
// UPC_A (US), UPC_E. Skipping QR/Data-Matrix keeps the decode loop fast.
const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

export function BarcodeScanner({
  onDetect,
  onCancel,
}: {
  onDetect: (barcode: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not available on this device.");
        }
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result, _err, ctrls) => {
            if (cancelled) {
              ctrls.stop();
              return;
            }
            if (result) {
              ctrls.stop();
              onDetect(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error
            ? e.name === "NotAllowedError"
              ? "Camera permission denied. Allow camera access and try again."
              : e.name === "NotFoundError"
                ? "No camera found on this device."
                : e.message
            : "Failed to start scanner.";
        setError(msg);
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDetect]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-chalk-50">
          <Camera className="h-4 w-4 text-accent-cyan" /> Scan barcode
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
          aria-label="Cancel scanning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        {/* Reticle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-1/2 w-4/5 rounded-xl border-2 border-accent-cyan/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {starting && !error && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-xs font-bold uppercase tracking-wider text-chalk-200">
            Starting camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-4 text-center text-xs text-accent-rose">
            {error}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-chalk-400">
        Point the camera at the barcode on the package.
      </p>
    </div>
  );
}
