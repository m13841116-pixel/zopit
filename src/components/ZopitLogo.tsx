import React from "react";

interface ZopitLogoProps {
  variant?: "full" | "icon" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  lightText?: boolean;
}

export const ZopitLogo: React.FC<ZopitLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  lightText = false,
}) => {
  const sizeMap = {
    xs: { h: "h-6", iconSize: 24, textSize: "text-sm" },
    sm: { h: "h-8", iconSize: 32, textSize: "text-lg" },
    md: { h: "h-11", iconSize: 44, textSize: "text-2xl" },
    lg: { h: "h-16", iconSize: 64, textSize: "text-3xl" },
    xl: { h: "h-24", iconSize: 96, textSize: "text-4xl" },
    "2xl": { h: "h-32", iconSize: 128, textSize: "text-5xl" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const purpleColor = lightText ? "#FFFFFF" : "#552370";
  const orangeColor = "#F97316";

  // Vector Graphic for Zopit Cart Symbol
  const CartSymbol = ({ s }: { s: number }) => (
    <svg
      viewBox="0 0 160 140"
      width={s}
      height={s * (140 / 160)}
      className="shrink-0 drop-shadow-xs"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="zopitOrangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* Cart Basket & Handle (Purple) */}
      <path
        d="M 68 45 
           L 116 45 
           C 121 45, 125 42, 127 37 
           L 133 21 
           C 135 15, 142 14, 146 18 
           C 148 21, 147 25, 144 29 
           L 138 43 
           C 133 55, 120 64, 106 64 
           L 64 64 
           Z"
        fill={purpleColor}
      />

      {/* Cart Basket Inner Cutout */}
      <path
        d="M 80 48 
           L 110 48 
           C 113 48, 115 50, 114 53 
           L 108 59 
           C 107 60, 105 61, 103 61 
           L 75 61 
           Z"
        fill="#FFFFFF"
      />

      {/* Cart Wheels (Solid Purple circles) */}
      <circle cx="80" cy="78" r="11" fill={purpleColor} />
      <circle cx="114" cy="78" r="11" fill={purpleColor} />

      {/* Stylized 'Z' Front (Orange with curved ends) */}
      <path
        d="M 32 18 
           L 84 18 
           C 92 18, 97 26, 92 34 
           C 89 39, 83 41, 78 41 
           L 58 41 
           L 36 71 
           C 33 76, 36 83, 42 83 
           L 74 83 
           C 80 83, 85 88, 85 94 
           C 85 100, 80 105, 74 105 
           L 32 105 
           C 20 105, 13 92, 19 82 
           L 47 43 
           L 32 43 
           C 26 43, 21 38, 21 31 
           C 21 24, 26 18, 32 18 
           Z"
        fill="url(#zopitOrangeGradient)"
      />
    </svg>
  );

  // ZOPiT Wordmark as an inline SVG to guarantee exact LTR rendering and prevent any RTL scrambling
  const Wordmark = () => {
    // Proportional dimensions based on size
    const w = size === "xs" ? 50 : size === "sm" ? 70 : size === "md" ? 90 : size === "lg" ? 120 : size === "xl" ? 160 : 200;
    const h = w * (50 / 220); // rough aspect ratio

    return (
      <svg
        viewBox="0 0 220 50"
        width={w}
        height={h}
        className="shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(0, -5)">
          {/* Z */}
          <path d="M 0 10 L 35 10 L 35 18 L 12 50 L 36 50 L 36 58 L 0 58 L 0 50 L 23 18 L 0 18 Z" fill={purpleColor} />
          {/* O */}
          <path d="M 70 10 C 86 10, 98 21, 98 34 C 98 48, 86 59, 70 59 C 54 59, 42 48, 42 34 C 42 21, 54 10, 70 10 Z M 70 19 C 60 19, 52 25, 52 34 C 52 43, 60 50, 70 50 C 80 50, 88 43, 88 34 C 88 25, 80 19, 70 19 Z" fill={purpleColor} />
          {/* P */}
          <path d="M 108 10 L 130 10 C 141 10, 148 17, 148 27 C 148 37, 141 44, 130 44 L 118 44 L 118 58 L 108 58 Z M 118 18 L 118 36 L 129 36 C 135 36, 138 33, 138 27 C 138 21, 135 18, 129 18 Z" fill={purpleColor} />
          {/* i */}
          <rect x="158" y="24" width="10" height="34" rx="2" fill={purpleColor} />
          <circle cx="163" cy="14" r="5.5" fill={orangeColor} />
          {/* T */}
          <path d="M 178 10 L 216 10 L 216 18 L 202 18 L 202 58 L 192 58 L 192 18 L 178 18 Z" fill={purpleColor} />
        </g>
      </svg>
    );
  };

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`} dir="ltr">
        <CartSymbol s={currentSize.iconSize} />
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div
        className={`inline-flex flex-row items-center gap-2.5 select-none ${className}`}
        dir="ltr"
        style={{ direction: "ltr" }}
      >
        <CartSymbol s={currentSize.iconSize} />
        <Wordmark />
      </div>
    );
  }

  // Default: "full" stacked (symbol on top, wordmark below, exactly like official branding)
  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none group transition-transform hover:scale-[1.02] ${className}`}
      dir="ltr"
      style={{ direction: "ltr" }}
    >
      <CartSymbol s={currentSize.iconSize} />
      <div className="mt-1 flex justify-center" dir="ltr" style={{ direction: "ltr" }}>
        <Wordmark />
      </div>
    </div>
  );
};

export default ZopitLogo;
