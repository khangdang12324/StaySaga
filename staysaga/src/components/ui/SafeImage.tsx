"use client";
import React, { useState } from "react";

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback?: string;
}

export default function SafeImage({
  src,
  fallback = "/fallback.svg",
  alt = "",
  className = "",
  ...rest
}: Props) {
  const [broken, setBroken] = useState(false);
  const srcSafe =
    src && typeof src === "string" && src.length > 0 ? src : fallback;

  if (broken) {
    return <img src={fallback} alt={alt} className={className} {...rest} />;
  }

  return (
    // use regular img so it's simple; next/image causes layout shifts in many places
    // keep attributes pass-through
    <img
      src={srcSafe}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
      {...rest}
    />
  );
}
