"use client";

import { useMemo, useState } from "react";

type SmartImageOptions = {
  src?: string | null;
  fallback?: string;
};

export function useSmartImage({
  src,
  fallback = "/fallback.svg",
}: SmartImageOptions) {
  const resolvedSrc = useMemo(() => {
    const candidate = typeof src === "string" ? src.trim() : "";
    if (!candidate || candidate === "null" || candidate === "undefined") {
      return fallback;
    }
    // If candidate is a data URL or already a remote/http URL, use it.
    if (candidate.startsWith("http") || candidate.startsWith("data:")) {
      return candidate;
    }

    // Relative app/static paths are fine, but local exported Booking files are not.
    if (candidate.startsWith("/")) {
      return candidate;
    }

    // If candidate looks like a Windows path or a saved Booking local path, fall back to a known web image.
    const looksLocal =
      candidate.startsWith("./") ||
      candidate.includes("_files/") ||
      /^[A-Za-z]:\\\\/.test(candidate) ||
      candidate.startsWith("..\\") ||
      candidate.startsWith("../") ||
      candidate.includes("\\");

    if (looksLocal) {
      return fallback;
    }

    // Fallback to candidate if it doesn't match any local pattern
    return candidate;
  }, [fallback, src]);

  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displaySrc = failedSrc === resolvedSrc ? fallback : resolvedSrc;
  const hasError = failedSrc === resolvedSrc;
  const isLoaded = loadedSrc === displaySrc;

  const onLoad = () => setLoadedSrc(displaySrc);

  const onError = () => {
    if (displaySrc !== fallback) {
      setFailedSrc(resolvedSrc);
      return;
    }
    setFailedSrc(resolvedSrc);
    setLoadedSrc(fallback);
  };

  return {
    displaySrc,
    isLoaded,
    hasError,
    onLoad,
    onError,
  };
}
