const fs = require('fs');
let content = fs.readFileSync('src/components/store-manager/MyCatalog.tsx', 'utf8');

// 1. Add MarketingKitModal import
if (!content.includes('MarketingKitModal')) {
  content = content.replace(
    'import { DigikalaProductModal } from "../DigikalaProductModal";',
    'import { DigikalaProductModal } from "../DigikalaProductModal";\nimport MarketingKitModal from "./MarketingKitModal";\nimport { Sparkles, Edit } from "lucide-react";'
  );
}

// 2. Add marketingKitProduct state
if (!content.includes('marketingKitProduct')) {
  content = content.replace(
    'const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);',
    'const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);\n  const [marketingKitProduct, setMarketingKitProduct] = useState<any | null>(null);'
  );
}

// 3. Add MarketingKit button on card actions
const oldActionButtons = `<div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderingProduct(product);
                          setOrderQuantity(1);
                          setOrderVariantId(product.variants?.[0]?.id?.toString() || "");
                        }}
                        className="py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black bg-primary-default hover:bg-primary-hover text-white transition-all cursor-pointer shadow-sm"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        ثبت سفارش
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(product.id);
                        }}
                        className="py-2.5 px-1 rounded-xl flex items-center justify-center gap-1 text-xs font-black bg-danger/10 text-danger hover:bg-danger/20 transition-all cursor-pointer"
                      >
                        حذف کالا
                      </button>
                    </div>`;

const newActionButtons = `<div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarketingKitProduct(product);
                          }}
                          className="py-2 px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          پک بازاریابی
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomization(product);
                          }}
                          className="py-2 px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] font-black bg-surface text-secondary hover:text-primary border border-subtle transition-all cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          شخصی‌سازی
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderingProduct(product);
                            setOrderQuantity(1);
                            setOrderVariantId(product.variants?.[0]?.id?.toString() || "");
                          }}
                          className="py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black bg-primary-default hover:bg-primary-hover text-white transition-all cursor-pointer shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          ثبت سفارش
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDelete(product.id);
                          }}
                          className="py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-xs font-black bg-danger/10 text-danger hover:bg-danger/20 transition-all cursor-pointer"
                        >
                          حذف کالا
                        </button>
                      </div>
                    </div>`;

content = content.replace(oldActionButtons, newActionButtons);

// 4. Add modal render
const modalRender = `
      {/* Marketing Kit Modal */}
      {marketingKitProduct && (
        <MarketingKitModal
          product={marketingKitProduct}
          onClose={() => setMarketingKitProduct(null)}
        />
      )}
`;

content = content.replace('{/* Digikala Style Product Detail Modal */}', modalRender + '\n      {/* Digikala Style Product Detail Modal */}');

fs.writeFileSync('src/components/store-manager/MyCatalog.tsx', content);
console.log('MyCatalog.tsx updated successfully');
