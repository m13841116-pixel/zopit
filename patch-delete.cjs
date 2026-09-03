const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldDelete = `    await prisma.storeProductSelection.deleteMany({
      where: { storeId, productId }
    });`;

const newDelete = `    const selection = await prisma.storeProductSelection.findFirst({
      where: { storeId, productId }
    });

    if (selection) {
      if (selection.wc_product_id) {
        try {
          const conn = await prisma.storeConnection.findUnique({ where: { storeId } });
          if (conn && conn.status === 'CONNECTED') {
            const auth = Buffer.from(conn.consumerKey + ':' + conn.consumerSecret).toString('base64');
            const url = new URL('/wp-json/wc/v3/products/' + selection.wc_product_id + '?force=true', conn.storeUrl);
            fetch(url.toString(), {
              method: 'DELETE',
              headers: { 'Authorization': 'Basic ' + auth }
            }).catch(e => console.error('Failed to delete WC product:', e));
          }
        } catch (wcErr) {
          console.error('WC sync delete err:', wcErr);
        }
      }

      await prisma.storeProductSelection.deleteMany({
        where: { storeId, productId }
      });
    }`;

code = code.replace(oldDelete, newDelete);

fs.writeFileSync('server.ts', code);
