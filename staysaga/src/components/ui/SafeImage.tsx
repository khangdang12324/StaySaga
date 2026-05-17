"use client";

import { useState, type SyntheticEvent } from "react";
import Image from "next/image";

const FALLBACK_IMAGE = "/images/fallback-hotel.jpg";

type SafeImageProps = Omit<
  React.ComponentPropsWithoutRef<typeof Image>,
  "src" | "alt" | "fill" | "loading"
> & {
  src?: string | null;
  alt?: string;
  fallback?: string;
  fill?: boolean;
  loading?: "lazy" | "eager";
};

export default function SafeImage({
  src,
  fallback = FALLBACK_IMAGE,
  alt = "",
  className = "",
  onError,
  ...rest
}: SafeImageProps) {
  const resolvedSrc = src || fallback;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = failedSrc === resolvedSrc ? fallback : resolvedSrc;
  const useFill = Boolean(rest.fill);
  const hasDimensions =
    typeof rest.width === "number" && typeof rest.height === "number";

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== fallback) {
      console.error("[SafeImage] image failed, falling back:", currentSrc);
      setFailedSrc(resolvedSrc);
    }
    onError?.(event);
  };

  if (!useFill && !hasDimensions) {
    return (
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      unoptimized
      loading="lazy"
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
