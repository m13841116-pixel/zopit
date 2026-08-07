import React, { useState } from "react";
import { Package } from "lucide-react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = "تصویر",
  className = "",
  containerClassName = "",
  fallbackSrc,
  ...props
}) => {
  const [error, setError] = useState(false);

  const defaultFallback =
    "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&auto=format&fit=crop&q=60";

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-surface border border-subtle text-muted text-xs p-2 rounded-lg text-center select-none overflow-hidden ${containerClassName || className}`}>
        <Package className="w-8 h-8 text-muted/60 mb-1" />
        <span className="text-[10px] font-medium text-secondary truncate max-w-full">بدون تصویر</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
