import React from "react";

interface ZopitLogoProps {
  variant?: "full" | "icon" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  lightText?: boolean;
}

export const ZopitLogo: React.FC<ZopitLogoProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    xs: "h-6",
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
  };

  const heightClass = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/icon.jpg"
        alt="ZOPiT Logo"
        className={`${heightClass} w-auto object-contain drop-shadow-md rounded-xl transition-transform hover:scale-105`}
        onError={(e) => {
          // Fallback if icon.jpg fails to load
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};

export default ZopitLogo;
