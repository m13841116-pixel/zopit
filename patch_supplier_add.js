const fs = require('fs');
let code = fs.readFileSync('src/components/supplier/SupplierAddProduct.tsx', 'utf8');

// Add import
if (!code.includes('numberToWords')) {
  code = code.replace(
    'import { useState, useRef, useEffect } from "react";',
    'import { useState, useRef, useEffect } from "react";\nimport { numberToWords } from "../../utils/numberToWords";'
  );
}

// 1. Change the green category selected color
const greenTarget = `
              <div className="mt-2.5 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  دسته‌بندی انتخاب‌شده: <strong className="text-sm underline">
`;
const greenReplacement = `
              <div className="mt-2.5 p-3 bg-primary-default/10 border border-primary-default/30 text-primary-default rounded-xl text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary-default" />
                  دسته‌بندی انتخاب‌شده: <strong className="text-sm font-black bg-primary-default text-inverse px-2 py-0.5 rounded-md">
`;
code = code.replace(greenTarget.trim(), greenReplacement.trim());


// 2. Change waiting for inventory color
const waitingTarget = `
            <span className={\`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 \${
              Number(formData.stock || 0) > 0 || formData.variants.length > 0
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
            }\`}>
              {Number(formData.stock || 0) > 0 || formData.variants.length > 0 ? "کالا موجود است" : "در انتظار موجودی"}
            </span>
`;
const waitingReplacement = `
            <span className={\`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 \${
              Number(formData.stock || 0) > 0 || formData.variants.length > 0
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-danger/10 text-danger border border-danger/30"
            }\`}>
              {Number(formData.stock || 0) > 0 || formData.variants.length > 0 ? "کالا موجود است" : "در انتظار موجودی"}
            </span>
`;
code = code.replace(waitingTarget.trim(), waitingReplacement.trim());


// 3. Add price in words
const priceTarget = `
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-xs text-muted font-bold">تومان</span>
                  </div>
                </div>
              </div>
`;
const priceReplacement = `
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-xs text-muted font-bold">تومان</span>
                  </div>
                </div>
                {formData.price && Number(formData.price) > 0 && (
                  <p className="mt-1.5 text-xs text-muted font-medium bg-surface-hover p-1.5 rounded-md inline-block">
                    مبلغ به حروف: <strong className="text-primary">{numberToWords(formData.price)} تومان</strong>
                  </p>
                )}
              </div>
`;
code = code.replace(priceTarget.trim(), priceReplacement.trim());


fs.writeFileSync('src/components/supplier/SupplierAddProduct.tsx', code);
console.log('Patched UI for supplier add product');
