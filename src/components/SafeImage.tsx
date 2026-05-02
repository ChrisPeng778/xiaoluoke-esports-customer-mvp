"use client";

import { useState } from "react";

export function SafeImage({
  src,
  alt,
  className = "",
  imgClassName = "object-cover",
  fallbackText = "图片",
  backgroundFill = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackText?: string;
  backgroundFill?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`image-placeholder ${className}`}>{fallbackText}</div>;
  }

  if (backgroundFill) {
    return (
      <div className={`relative overflow-hidden bg-amber-50 ${className}`}>
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-[2px]"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <div className="absolute inset-0 bg-white/10" />
        <img
          src={src}
          alt={alt}
          className={`relative z-10 h-full w-full ${imgClassName}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-amber-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`h-full w-full ${imgClassName}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
