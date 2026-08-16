const fs = require('fs');
let code = fs.readFileSync('src/components/supplier/SupplierAddProduct.tsx', 'utf8');

// Replace table header
code = code.replace(
  /<th className="p-3 rounded-tl-xl">موجودی<\/th>/,
  '<th className="p-3">موجودی</th><th className="p-3">SKU</th><th className="p-3 rounded-tl-xl">تصویر (URL)</th>'
);

// Replace table row
const oldRow = `<td className="p-3">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                            className="w-24 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none"
                            dir="ltr"
                          />
                        </td>`;

const newRow = `<td className="p-3">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                            className="w-24 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none"
                            dir="ltr"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={v.sku || ""}
                            onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                            className="w-24 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none"
                            dir="ltr"
                            placeholder="اختیاری"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={v.imageUrl || ""}
                            onChange={(e) => handleVariantChange(idx, "imageUrl", e.target.value)}
                            className="w-32 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none"
                            dir="ltr"
                            placeholder="لینک تصویر (اختیاری)"
                          />
                        </td>`;

code = code.replace(oldRow, newRow);
fs.writeFileSync('src/components/supplier/SupplierAddProduct.tsx', code);
console.log("Patched SupplierAddProduct.tsx variants table");
