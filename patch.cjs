const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

// 1. Remove StoreProAccountStep2 import
code = code.replace(/import \{ StoreProAccountStep2 \} from "\.\/StoreProAccountStep2";\n/g, "");

// 2. Add Audio Player at the top of the main container (line 829 context)
const audioPlayerHTML = `
      {/* Premium Audio Intro */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-2xl mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
            <Volume2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-slate-200 font-black text-sm">پیام صوتی زوپیت</h3>
            <p className="text-slate-400 text-xs mt-1">لطفاً پیش از ثبت‌نام این فایل صوتی را بشنوید</p>
          </div>
        </div>
        <audio controls className="h-10 outline-none rounded-full max-w-[200px] md:max-w-md">
          <source src="/intro.mp3" type="audio/mpeg" />
        </audio>
      </div>
`;
code = code.replace(
  /<div className="space-y-8 animate-fade-in pb-12" dir="rtl">\n/g,
  `<div className="space-y-8 animate-fade-in pb-12" dir="rtl">\n${audioPlayerHTML}`
);

if (!code.includes('Volume2')) {
  code = code.replace('from "lucide-react";', ', Volume2 } from "lucide-react";');
}

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
