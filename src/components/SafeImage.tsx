"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { resolveImageUrl, IMAGE_FALLBACK } from "@/utils/image";

interface SafeImageProps extends Omit<React.ComponentProps<typeof Image>, "src"> {
  src: string;
}

/**
 * next/image wrapper that resolves backend-relative paths to absolute URLs and
 * falls back to a placeholder if the image fails to load. Client component so
 * it can use the onError handler.
 */
export default function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(src));

  useEffect(() => {
    setImgSrc(resolveImageUrl(src));
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || "Image"}
      onError={() => setImgSrc(IMAGE_FALLBACK)}
    />
  );
}
