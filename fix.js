const fs = require('fs');
const file = 'src/components/supplier/SupplierAddProduct.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/parseFloat\(formData.supplierBasePrice\)/g, 'parseFloat(formData.supplierBasePrice.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)))');
code = code.replace(/parseInt\(v.stock\)/g, 'parseInt(v.stock.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)))');
fs.writeFileSync(file, code);
