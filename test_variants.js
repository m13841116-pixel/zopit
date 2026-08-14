async function main() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'supplier', password: 'supplier' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', loginRes.status, await loginRes.text());
      return;
    }
    
    const { token } = await loginRes.json();
    console.log('Logged in.');

    // 2. Fetch Categories
    const catRes = await fetch('http://localhost:3000/api/public/categories');
    let categoryId = '1';
    if (catRes.ok) {
      const cats = await catRes.json();
      if (cats && cats.length > 0) {
        categoryId = cats[0].id.toString();
      }
    }

    // 3. Register Product with variants
    const payload = {
      name: 'گوشی آنکر تست',
      shortDescription: 'توضیح کوتاه گوشی',
      longDescription: 'توضیح بلند گوشی',
      categoryId: categoryId,
      brand: 'Anker',
      sku: 'ANKER-' + Date.now(),
      supplierBasePrice: '5000000',
      discount: '10',
      stock: '20',
      minStock: '',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
      mainImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      variants: [
        {
          attributes: { 'رنگ': 'آبی', 'حافظه': '128GB' },
          supplierBasePrice: '5200000',
          stock: '10',
          sku: 'ANKER-BLUE-128',
          imageUrl: ''
        },
        {
          attributes: { 'رنگ': 'قرمز', 'حافظه': '256GB' },
          supplierBasePrice: '5800000',
          stock: '10',
          sku: 'ANKER-RED-256',
          imageUrl: ''
        }
      ],
      videoUrl: ''
    };

    const res = await fetch('http://localhost:3000/api/supplier/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Response Status:', res.status);
    const body = await res.json();
    console.log('Response Body:', JSON.stringify(body, null, 2));

  } catch (err) {
    console.error('Test script error:', err);
  }
}

main();
