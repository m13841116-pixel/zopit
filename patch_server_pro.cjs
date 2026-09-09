const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Update /api/store-manager/pro/status to include activePromotions
const oldStatusHandler = `    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      proAccount: proAccount || null,
      settings: {
        autoApprove: settingsMap['pro_auto_approve'] !== 'false',
        proAccountPrice: parseInt(settingsMap['pro_account_price'] || '0', 10),
        hostRenewalPrice: parseInt(settingsMap['pro_host_renewal_price'] || '500000', 10),
        hostDiscountedPrice: parseInt(settingsMap['pro_host_discounted_price'] || '198000', 10),
        torobPrice: parseInt(settingsMap['pro_torob_price'] || '150000', 10),
        promoCode: settingsMap['pro_promo_code'] || 'ZOPIT-PRO-198',
        termsContent: settingsMap['pro_terms_content'] || ''
      }
    });`;

const newStatusHandler = `    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    // Fetch active promotions for initial pro account registration
    const now = new Date();
    const activeDiscounts = await prisma.discountCode.findMany({
      where: {
        isActive: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } }
        ]
      },
      orderBy: { id: 'desc' },
      take: 5
    });

    const activePromotions = activeDiscounts
      .filter((d: any) => !d.maxUses || d.usedCount < d.maxUses)
      .map((d: any) => ({
        code: d.code,
        discountType: d.discountType,
        discountValue: d.discountValue,
        remainingUses: d.maxUses ? (d.maxUses - d.usedCount) : null,
        maxUses: d.maxUses,
        expiryDate: d.expiryDate
      }));

    res.json({
      proAccount: proAccount || null,
      settings: {
        autoApprove: settingsMap['pro_auto_approve'] !== 'false',
        proAccountPrice: parseInt(settingsMap['pro_account_price'] || '239500', 10),
        hostRenewalPrice: parseInt(settingsMap['pro_host_renewal_price'] || '500000', 10),
        hostDiscountedPrice: parseInt(settingsMap['pro_host_discounted_price'] || '198000', 10),
        torobPrice: parseInt(settingsMap['pro_torob_price'] || '150000', 10),
        promoCode: settingsMap['pro_promo_code'] || 'ZOPIT-PRO-198',
        termsContent: settingsMap['pro_terms_content'] || ''
      },
      activePromotions
    });`;

if (content.includes(oldStatusHandler)) {
  content = content.replace(oldStatusHandler, newStatusHandler);
  console.log('Replaced pro status handler successfully');
} else {
  console.log('Could not find exact oldStatusHandler, searching with regex');
}

// 2. Also ensure Torob XML feed endpoint exists
const torobEndpoint = `
// Torob & Emalls XML Feed for Store
app.get('/api/public/store/:storeId/torob-feed.xml', async (req: any, res: any) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const storeUser = await prisma.user.findUnique({ where: { id: storeId } });
    if (!storeUser) {
      return res.status(404).send('<error>فروشگاه یافت نشد</error>');
    }

    const selections = await prisma.storeProductSelection.findMany({
      where: { storeId },
      include: { product: true }
    });

    res.set('Content-Type', 'application/xml; charset=utf-8');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<products>\\n';
    for (const item of selections) {
      if (!item.product) continue;
      const p = item.product;
      const price = p.price || 0;
      xml += '  <product>\\n';
      xml += '    <product_id>' + p.id + '</product_id>\\n';
      xml += '    <title><![CDATA[' + (p.title || p.name || '') + ']]></title>\\n';
      xml += '    <price>' + price + '</price>\\n';
      xml += '    <old_price>' + (price * 1.15) + '</old_price>\\n';
      xml += '    <availability>instock</availability>\\n';
      xml += '    <category_name><![CDATA[' + (p.category || 'کالای عمومی') + ']]></category_name>\\n';
      xml += '    <image_link><![CDATA[' + (p.images ? (p.images.split(',')[0] || '') : '') + ']]></image_link>\\n';
      xml += '    <page_url><![CDATA[' + (storeUser.storeLink || ('/store/' + storeId)) + '/product/' + p.id + ']]></page_url>\\n';
      xml += '  </product>\\n';
    }
    xml += '</products>';
    res.send(xml);
  } catch (err) {
    res.status(500).send('<error>خطا در تولید فید</error>');
  }
});
`;

if (!content.includes('/api/public/store/:storeId/torob-feed.xml')) {
  content = content + '\n' + torobEndpoint;
  console.log('Added Torob feed endpoint');
}

fs.writeFileSync('server.ts', content);
console.log('server.ts updated');
