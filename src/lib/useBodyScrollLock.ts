"use client";

import { useEffect } from "react";

// Module-level state so nested or stacked overlays share the same lock
// (the body is only unlocked when the *last* overlay closes).
let activeLocks = 0;
let savedScrollY = 0;
let savedStyles: {
  overflow: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
} | null = null;

function applyLock() {
  const body = document.body;
  savedScrollY = window.scrollY;
  savedStyles = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };
  // `position: fixed` is the only lock that reliably stops iOS Safari from
  // scrolling the page behind a modal. `overflow:hidden` alone leaks touch.
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

function releaseLock() {
  if (!savedStyles) return;
  const body = document.body;
  body.style.overflow = savedStyles.overflow;
  body.style.position = savedStyles.position;
  body.style.top = savedStyles.top;
  body.style.left = savedStyles.left;
  body.style.right = savedStyles.right;
  body.style.width = savedStyles.width;
  savedStyles = null;
  window.scrollTo(0, savedScrollY);
}

export function useBodyScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    activeLocks += 1;
    if (activeLocks === 1) applyLock();
    return () => {
      activeLocks -= 1;
      if (activeLocks === 0) releaseLock();
    };
  }, [active]);
}
