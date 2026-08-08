import React from "react";

export function ZopitEcosystemBanner({ customImageUrl }: { customImageUrl?: string }) {
  if (customImageUrl) {
    return (
      <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-xl border border-border-subtle group">
        <img
          src={customImageUrl}
          alt="بنر اختصاصی زوپیت"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
          <span className="inline-block px-3 py-1 bg-primary-default/80 backdrop-blur-md text-white text-xs font-black rounded-full mb-2 w-max">
            پلتفرم یکپارچه B2B
          </span>
          <h3 className="text-xl font-black text-white">زنجیره هوشمند تامین و فروش کالای کشور</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl p-6 flex flex-col justify-between group">
      {/* Background Neon Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          زنجیره یکپارچه زوپیت (Zopit)
        </div>
        <span className="text-[10px] font-mono text-indigo-300/70 font-bold">B2B NETWORK</span>
      </div>

      {/* Center 3D Isometric Ecosystem Artwork */}
      <div className="relative z-10 my-4 flex flex-col items-center justify-center">
        <svg viewBox="0 0 600 500" className="w-full max-h-[300px] drop-shadow-2xl">
          <defs>
            <linearGradient id="hubGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Top Left: Supplier Warehouse */}
          <g transform="translate(80, 50)" filter="url(#shadow)">
            <path d="M60 0 L140 40 L140 100 L60 60 Z" fill="#1e293b" />
            <path d="M60 0 L-20 40 L-20 100 L60 60 Z" fill="#334155" />
            <path d="M-20 40 L60 0 L140 40 L60 80 Z" fill="#475569" />
            <rect x="0" y="30" width="40" height="18" rx="4" fill="#10b981" />
            <text x="20" y="42" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">SUPPLIER</text>
            <text x="60" y="115" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">انبار تامین‌کنندگان</text>
          </g>

          {/* Top Right: Retailer Store */}
          <g transform="translate(420, 50)" filter="url(#shadow)">
            <path d="M60 0 L140 40 L140 100 L60 60 Z" fill="#0f172a" />
            <path d="M60 0 L-20 40 L-20 100 L60 60 Z" fill="#1e293b" />
            <path d="M-20 40 L60 0 L140 40 L60 80 Z" fill="#0284c7" />
            <rect x="8" y="28" width="45" height="18" rx="4" fill="#0d9488" />
            <text x="30" y="40" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">RETAILER</text>
            <text x="60" y="115" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">فروشگاه‌های آنلاین</text>
          </g>

          {/* Connection Lines to Central Hub */}
          <path d="M 140 120 C 180 180, 220 220, 260 230" stroke="url(#lineGlow)" strokeWidth="5" fill="none" strokeDasharray="8 4" className="animate-pulse" />
          <path d="M 460 120 C 420 180, 380 220, 340 230" stroke="url(#lineGlow)" strokeWidth="5" fill="none" strokeDasharray="8 4" className="animate-pulse" />
          <path d="M 140 370 C 180 320, 220 280, 260 270" stroke="url(#lineGlow)" strokeWidth="5" fill="none" />
          <path d="M 460 370 C 420 320, 380 280, 340 270" stroke="url(#lineGlow)" strokeWidth="5" fill="none" />

          {/* Bottom Left: Distributors */}
          <g transform="translate(80, 320)" filter="url(#shadow)">
            <path d="M50 0 L110 30 L110 80 L50 50 Z" fill="#1e293b" />
            <path d="M50 0 L-10 30 L-10 80 L50 50 Z" fill="#334155" />
            <path d="M-10 30 L50 0 L110 30 L50 60 Z" fill="#6366f1" />
            <text x="50" y="95" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">همکاران و معرفین</text>
          </g>

          {/* Bottom Right: Customers / Orders */}
          <g transform="translate(420, 320)" filter="url(#shadow)">
            <path d="M50 0 L110 30 L110 80 L50 50 Z" fill="#0f172a" />
            <path d="M50 0 L-10 30 L-10 80 L50 50 Z" fill="#1e293b" />
            <path d="M-10 30 L50 0 L110 30 L50 60 Z" fill="#10b981" />
            <text x="50" y="95" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">خریداران و سفارشات</text>
          </g>

          {/* CENTRAL HUB: Zopit */}
          <g transform="translate(230, 190)" filter="url(#shadow)">
            <rect x="0" y="0" width="140" height="120" rx="28" fill="url(#hubGlow)" />
            <rect x="6" y="6" width="128" height="108" rx="24" fill="#0f172a" opacity="0.95" />
            
            {/* BK Logo Symbol */}
            <circle cx="70" cy="48" r="26" fill="#2563eb" opacity="0.2" />
            <path d="M 55 35 L 75 35 C 82 35, 85 40, 80 47 C 87 52, 83 62, 74 62 L 55 62 Z" fill="#10b981" />
            <path d="M 62 42 L 72 42 C 75 42, 75 48, 72 48 L 62 48 Z" fill="#0f172a" />
            <path d="M 62 50 L 73 50 C 76 50, 76 56, 73 56 L 62 56 Z" fill="#0f172a" />
            
            <text x="70" y="86" fill="#ffffff" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">Zopit</text>
            <text x="70" y="102" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">زوپیت</text>
          </g>
        </svg>
      </div>

      {/* Bottom Text */}
      <div className="relative z-10 text-right bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/20">
        <h3 className="text-base font-black text-white mb-1">اتصال مستقیم به انبار تامین‌کنندگان کشور</h3>
        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          ارسال سریع، حذف واسطه‌ها، مدیریت هوشمند فاکتورها و تسویه خودکار برای تمامی فروشگاه‌ها.
        </p>
      </div>
    </div>
  );
}
