const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexPost1 = /const \{ categoryId, name, shortDescription, longDescription, technicalSpecs, supplierBasePrice, discount, sku, brand, stock, images, mainImage, variants, videoUrl \} = req.body;/g;
const replacementPost1 = `const { categoryId, name, shortDescription, longDescription, technicalSpecs, supplierBasePrice, discount, sku, brand, stock, images, mainImage, variants, videoUrl, status } = req.body;`;

const regexPost2 = /status: 'PENDING_APPROVAL', \/\/ Require admin approval and profit margin setting before entering marketplace/g;
const replacementPost2 = `status: (status === 'DRAFT' ? 'DRAFT' : 'PENDING_APPROVAL'),`;

const regexPut1 = /const \{ categoryId, name, shortDescription, longDescription, technicalSpecs, supplierBasePrice, discount, sku, brand, stock, images, mainImage, variants, videoUrl \} = req.body;/g;
const replacementPut1 = `const { categoryId, name, shortDescription, longDescription, technicalSpecs, supplierBasePrice, discount, sku, brand, stock, images, mainImage, variants, videoUrl, status } = req.body;`;

const regexPut2 = /let newStatus = existing.status;/g;
const replacementPut2 = `let newStatus = existing.status;
    if (status === 'DRAFT') {
      newStatus = 'DRAFT';
    } else if (status === 'PENDING_APPROVAL' && existing.status === 'DRAFT') {
      newStatus = 'PENDING_APPROVAL';
    }`;

code = code.replace(regexPost1, replacementPost1);
code = code.replace(regexPost2, replacementPost2);

// Only replace first occurrence of put1
let put1Replaced = false;
code = code.replace(regexPut1, (match) => {
  if (!put1Replaced) {
    put1Replaced = true;
    return replacementPut1;
  }
  return match;
});

code = code.replace(regexPut2, replacementPut2);

fs.writeFileSync('server.ts', code);
console.log('patched server.ts');
