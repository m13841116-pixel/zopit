const fs = require('fs');
let content = fs.readFileSync('src/components/Explore.tsx', 'utf8');

const oldStoreTitle = `                      <div className="flex flex-col text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-black tracking-tight">{current.storeName || "فروشگاه پارس"}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">تایید شده</span>
                        </div>
                        <span className="text-zinc-400 text-[10px] font-semibold -mt-0.5">فروشگاه زوپیت</span>
                      </div>`;

const newStoreTitle = `                      <div className="flex flex-col text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-black tracking-tight">{current.storeName || "فروشگاه پارس"}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">تایید شده</span>
                        </div>
                        <span className="text-zinc-400 text-[10px] font-semibold -mt-0.5 mb-1.5">فروشگاه زوپیت</span>
                        <a 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            // In a real app we'd navigate to the store link
                            e.stopPropagation();
                            window.open(\`/?store=\${current.storeId || ''}\`, '_blank');
                          }} 
                          className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors w-max flex items-center gap-1"
                        >
                          خرید از این فروشگاه <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>`;

content = content.replace(oldStoreTitle, newStoreTitle);

// Ensure ExternalLink is imported
if (!content.includes('ExternalLink')) {
  content = content.replace('MessageCircle, X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Check, UserPlus }', 'MessageCircle, X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Check, UserPlus, ExternalLink }');
}

fs.writeFileSync('src/components/Explore.tsx', content, 'utf8');
