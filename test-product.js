async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/supplier/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: 1,
        name: 'Test Product',
        supplierBasePrice: 1000,
        stock: 10,
        sku: '123'
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.log(e);
  }
}
run();
