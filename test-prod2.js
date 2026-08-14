const jwt = require('jsonwebtoken');

async function run() {
  const token = jwt.sign(
    { userId: 1, email: 'test@example.com', role: 'SUPPLIER', name: 'Test' },
    'dev_secret_key_123!@#',
    { expiresIn: '24h' }
  );

  const res = await fetch('http://localhost:3000/api/supplier/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      categoryId: 1,
      name: 'Test Product ' + Date.now(),
      supplierBasePrice: 1000,
      stock: 10,
      sku: '123',
      mainImage: 'data:image/jpeg;base64,' + 'a'.repeat(2000000) // 2MB image
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
