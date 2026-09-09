const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `    const { fullName, nationalCode, mobile, signatureImage, hasEnamad, hasGateway, hasTaxProfile, promoCodeInput } = req.body;

    if (!fullName || !nationalCode || !mobile || !signatureImage) {
      return res.status(400).json({ error: 'تکمیل تمامی موارد الزام‌آور از جمله کد ملی، شماره همراه و امضای دیجیتال اجباری است.' });
    }

    // Fetch settings
    const settingsRows = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['pro_auto_approve', 'pro_account_price', 'pro_promo_code']
        }
      }
    });

    const settingsMap = {};
    settingsRows.forEach((s) => { settingsMap[s.key] = s.value; });

    const isAutoApprove = settingsMap['pro_auto_approve'] !== 'false';
    const initialStatus = isAutoApprove ? 'APPROVED' : 'PENDING';

    // Pricing calculation
    let basePrice = parseInt(settingsMap['pro_account_price'] || '239500', 10);
    let enamadCost = hasEnamad ? 50000 : 0;
    
    // Promo Code logic (e.g., 100% discount on base price if matched)
    if (promoCodeInput && settingsMap['pro_promo_code'] && promoCodeInput.trim().toUpperCase() === settingsMap['pro_promo_code'].trim().toUpperCase()) {
      basePrice = 0; // Discounted base price
    }`;

const replacement = `    const { fullName, nationalCode, mobile, signatureImage, hasEnamad, hasGateway, hasTaxProfile, promoCodeInput, discountCodeText } = req.body;

    if (!fullName || !nationalCode || !mobile || !signatureImage) {
      return res.status(400).json({ error: 'تکمیل تمامی موارد الزام‌آور از جمله کد ملی، شماره همراه و امضای دیجیتال اجباری است.' });
    }

    // Fetch settings
    const settingsRows = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['pro_auto_approve', 'pro_account_price', 'pro_promo_code']
        }
      }
    });

    const settingsMap = {};
    settingsRows.forEach((s) => { settingsMap[s.key] = s.value; });

    const isAutoApprove = settingsMap['pro_auto_approve'] !== 'false';
    const initialStatus = isAutoApprove ? 'APPROVED' : 'PENDING';

    // Pricing calculation
    let basePrice = parseInt(settingsMap['pro_account_price'] || '239500', 10);
    let enamadCost = hasEnamad ? 50000 : 0;
    let appliedDiscountAmount = 0;
    
    const usedCode = discountCodeText || promoCodeInput;
    if (usedCode) {
      const discount = await prisma.discountCode.findUnique({ where: { code: usedCode } });
      if (discount && discount.isActive && (!discount.expiryDate || new Date() <= discount.expiryDate) && (!discount.maxUses || discount.usedCount < discount.maxUses)) {
        if (discount.discountType === 'PERCENTAGE') {
          appliedDiscountAmount = Math.floor((basePrice + enamadCost) * (discount.discountValue / 100));
        } else {
          appliedDiscountAmount = discount.discountValue;
        }
        await prisma.discountCode.update({
          where: { id: discount.id },
          data: { usedCount: { increment: 1 } }
        });
      } else if (usedCode.trim().toUpperCase() === (settingsMap['pro_promo_code'] || '').trim().toUpperCase()) {
        appliedDiscountAmount = basePrice;
      }
    }
    
    let totalPayable = Math.max(0, basePrice + enamadCost - appliedDiscountAmount);`;

content = content.replace(target, replacement);
fs.writeFileSync('server.ts', content);
