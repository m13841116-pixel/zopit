const fs = require('fs');
let content = fs.readFileSync('src/components/store-manager/StoreMarketplace.tsx', 'utf8');

// 1. Add MarketingKitModal and Sparkles import
if (!content.includes('MarketingKitModal')) {
  content = content.replace(
    'import { DigikalaProductModal } from "../DigikalaProductModal";',
    'import { DigikalaProductModal } from "../DigikalaProductModal";\nimport MarketingKitModal from "./MarketingKitModal";\nimport { Sparkles } from "lucide-react";'
  );
}

// 2. Add state
if (!content.includes('marketingKitProduct')) {
  content = content.replace(
    'const [selectedProduct, setSelectedProduct] =',
    'const [marketingKitProduct, setMarketingKitProduct] = useState<any | null>(null);\n  const [selectedProduct, setSelectedProduct] ='
  );
}

// 3. Add Marketing Kit button next to Add to catalog
const oldBtn = `<button
                        onClick={() => handleAddToCatalog(product)}
                        disabled={inCatalog || (isLimitReached && !inCatalog)}
                        className={\`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors \${inCatalog ? "bg-surface text-success cursor-not-allowed" : isLimitReached ? "bg-surface text-muted cursor-not-allowed" : "bg-primary-default text-inverse hover:bg-primary-hover"}\`}
                      >`;

const newBtn = `<div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarketingKitProduct(product);
                          }}
                          className="col-span-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                          title="پک بازاریابی و استوری"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>پک تبلیغات</span>
                        </button>
                        <button
                          onClick={() => handleAddToCatalog(product)}
                          disabled={inCatalog || (isLimitReached && !inCatalog)}
                          className={\`col-span-2 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors \${inCatalog ? "bg-surface text-success cursor-not-allowed" : isLimitReached ? "bg-surface text-muted cursor-not-allowed" : "bg-primary-default text-inverse hover:bg-primary-hover cursor-pointer"}\`}
                        >`;

const oldEnd = `)}
                      </button>`;
const newEnd = `)}
                        </button>
                      </div>`;

content = content.replace(oldBtn, newBtn);
content = content.replace(oldEnd, newEnd);

// 4. Render modal
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

fs.writeFileSync('src/components/store-manager/StoreMarketplace.tsx', content);
console.log('StoreMarketplace.tsx updated successfully');
