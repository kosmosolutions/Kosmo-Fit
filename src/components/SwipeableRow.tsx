"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type ReactNode,
} from "react";

const REVEAL_WIDTH = 168; // px — width of the action tray that slides out
const OPEN_THRESHOLD = 70; // px — past this and we snap open
const HORIZ_LOCK = 12; // px — touchmove must clear this horizontally before we hijack

export type SwipeableRowHandle = {
  close: () => void;
};

/**
 * iOS-style swipe-to-reveal. The children render at translateX(0) and the
 * `actions` slot sits behind on the right; on a leftward swipe past
 * OPEN_THRESHOLD the row snaps to translateX(-REVEAL_WIDTH), exposing the
 * actions. A tap anywhere on the children, a tap outside, or pressing Esc
 * closes it. Vertical scroll is preserved — we only hijack the gesture
 * once the user has clearly moved horizontally.
 */
export const SwipeableRow = forwardRef<
  SwipeableRowHandle,
  {
    actions: ReactNode;
    children: ReactNode;
    /** Called whenever the row opens (so the parent can close any sibling). */
    onOpen?: () => void;
    /** Forced open/closed state from the parent; null = uncontrolled. */
    forceOpen?: boolean;
    className?: string;
  }
>(function SwipeableRow(
  { actions, children, onOpen, forceOpen, className },
  ref,
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const openRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    close() {
      setOpen(false);
      setOffset(0);
    },
  }));

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (forceOpen === undefined) return;
    setOpen(forceOpen);
    setOffset(forceOpen ? -REVEAL_WIDTH : 0);
  }, [forceOpen]);

  // Close on any outside tap once open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (trackRef.current && !trackRef.current.contains(e.target as Node)) {
        setOpen(false);
        setOffset(0);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setOffset(0);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Native non-passive touch handlers — React's synthetic onTouchMove is
  // forced passive in modern browsers, so preventDefault() inside it is a
  // no-op. Without preventDefault, a fast horizontal swipe inside a row
  // also scrolls the page horizontally, which makes the whole app appear
  // to slide off-screen on mobile.
  useEffect(() => {
    const node = draggerRef.current;
    if (!node) return;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      dragging.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (startX.current == null || startY.current == null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      if (!dragging.current) {
        // Don't hijack vertical scrolls.
        if (Math.abs(dy) > Math.abs(dx)) return;
        if (Math.abs(dx) < HORIZ_LOCK) return;
        dragging.current = true;
      }
      // We've decided this is a horizontal drag — block the browser's own
      // horizontal pan so the page doesn't shift behind us.
      if (e.cancelable) e.preventDefault();
      const base = openRef.current ? -REVEAL_WIDTH : 0;
      let next = base + dx;
      if (next > 0) next = 0;
      if (next < -REVEAL_WIDTH) next = -REVEAL_WIDTH;
      setOffset(next);
    };

    const onEnd = () => {
      if (!dragging.current) {
        // Just a tap — if we were open, close.
        if (openRef.current) {
          setOpen(false);
          setOffset(0);
        }
        startX.current = null;
        startY.current = null;
        return;
      }
      dragging.current = false;
      let shouldOpen = false;
      setOffset((cur) => {
        shouldOpen = cur < -OPEN_THRESHOLD;
        return shouldOpen ? -REVEAL_WIDTH : 0;
      });
      setOpen(shouldOpen);
      if (shouldOpen) onOpen?.();
      startX.current = null;
      startY.current = null;
    };

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd);
    node.addEventListener("touchcancel", onEnd);

    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onEnd);
    };
  }, [onOpen]);

  return (
    <div
      ref={trackRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 flex"
        style={{ width: REVEAL_WIDTH }}
      >
        <div className="pointer-events-auto flex h-full w-full items-stretch">
          {actions}
        </div>
      </div>
      <div
        ref={draggerRef}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform 200ms ease-out",
          touchAction: "pan-y",
        }}
        className="relative bg-ink-850"
      >
        {children}
      </div>
    </div>
  );
});
