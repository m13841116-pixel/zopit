const fs = require('fs');
let code = fs.readFileSync('/tmp/SupplierAddProduct_top.tsx', 'utf8');

const oldHandleSubmit = `  const handleSubmit = async () => {`;
const newHandleSubmit = `  const handleSubmit = async (submitStatus: 'DRAFT' | 'PENDING_APPROVAL' = 'PENDING_APPROVAL') => {`;

code = code.replace(oldHandleSubmit, newHandleSubmit);

const oldPayload = `      const payload = {
        ...formData,
        name: cleanedName,
        categoryId: cleanedCategoryId,
        supplierBasePrice: cleanedBasePrice,
        stock: finalStock,
        discount: cleanedDiscount,
        brand: cleanedBrand,
        sku: cleanedSku,
        variants: cleanedVariants,
        technicalSpecs: JSON.stringify(cleanedSpecs),
      };`;

const newPayload = `      const payload = {
        ...formData,
        name: cleanedName,
        categoryId: cleanedCategoryId,
        supplierBasePrice: cleanedBasePrice,
        stock: finalStock,
        discount: cleanedDiscount,
        brand: cleanedBrand,
        sku: cleanedSku,
        variants: cleanedVariants,
        technicalSpecs: JSON.stringify(cleanedSpecs),
        status: submitStatus,
      };`;

code = code.replace(oldPayload, newPayload);

fs.writeFileSync('/tmp/SupplierAddProduct_top.tsx', code);
console.log('patched top part');
