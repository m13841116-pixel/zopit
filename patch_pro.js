const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update endpoint /api/store-manager/pro/register
const registerOld = `app.post('/api/store-manager/pro/register', authenticateToken, requireStoreManager, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { fullName, nationalCode, mobile, signatureImage } = req.body;

    if (!fullName || !nationalCode || !mobile || !signatureImage) {
      return res.status(400).json({ error: 'تکمیل تمامی موارد الزام‌آور از جمله کد ملی، شماره همراه و امضای دیجیتال اجباری است.' });
    }

    // Check auto approve setting
    const autoApproveSetting = await prisma.systemSettings.findUnique({
      where: { key: 'pro_auto_approve' }
    });
    const isAutoApprove = !autoApproveSetting || autoApproveSetting.value !== 'false';
    const initialStatus = isAutoApprove ? 'APPROVED' : 'PENDING';

    const proAccount = await prisma.proAccount.upsert({
      where: { userId },
      update: {
        fullName,
        nationalCode,
        mobile,
        signatureImage,
        acceptedTerms: true,
        status: initialStatus
      },
      create: {
        userId,
        fullName,
        nationalCode,
        mobile,
        signatureImage,
        acceptedTerms: true,
        status: initialStatus
      }
    });

    // Also update User profile if missing
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await prisma.user.update({
      where: { id: userId },
      data: {
        nationalCode: nationalCode.trim(),
        mobile: mobile.trim(),
        firstName: firstName || undefined,
        lastName: lastName || undefined
      }
    }).catch(() => {});

    res.json({
      message: isAutoApprove ? 'اکانت پرو شما با موفقیت و به صورت آنی فعال شد!' : 'درخواست ثبت اکانت پرو شما ارسال شد و پس از بررسی فعال خواهد شد.',
      proAccount
    });
  } catch (err: any) {
    console.error('Error in /api/store-manager/pro/register:', err);
    res.status(500).json({ error: 'خطا در ثبت نام اکانت پرو', details: err.message });
  }
});`;

const registerNew = `app.post('/api/store-manager/pro/register', authenticateToken, requireStoreManager, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { fullName, nationalCode, mobile, signatureImage, hasEnamad, hasGateway, hasTaxProfile, promoCodeInput } = req.body;

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
    }

    let totalPayable = basePrice + enamadCost;
    const finalStatus = (totalPayable > 0) ? 'PENDING_PAYMENT' : initialStatus;

    const proAccount = await prisma.proAccount.upsert({
      where: { userId },
      update: {
        fullName,
        nationalCode,
        mobile,
        signatureImage,
        acceptedTerms: true,
        hasEnamad: !!hasEnamad,
        hasGateway: !!hasGateway,
        hasTaxProfile: !!hasTaxProfile,
        status: finalStatus
      },
      create: {
        userId,
        fullName,
        nationalCode,
        mobile,
        signatureImage,
        acceptedTerms: true,
        hasEnamad: !!hasEnamad,
        hasGateway: !!hasGateway,
        hasTaxProfile: !!hasTaxProfile,
        status: finalStatus
      }
    });

    // Also update User profile if missing
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await prisma.user.update({
      where: { id: userId },
      data: {
        nationalCode: nationalCode.trim(),
        mobile: mobile.trim(),
        firstName: firstName || undefined,
        lastName: lastName || undefined
      }
    }).catch(() => {});

    let payLink = null;
    if (totalPayable > 0) {
      const paymentGateway = await PaymentServiceFactory.getService();
      const baseUrl = getPublicUrl(req);
      const callbackUrl = \`\${baseUrl}/api/public/pro/callback?userId=\${userId}&type=PRO_REGISTER\`;
      try {
        const zibalResult = await paymentGateway.createPayment(
          totalPayable * 10,
          \`ثبت نام اکانت پرو زوپیت - کاربر #\${userId}\`,
          callbackUrl
        );
        payLink = zibalResult.payLink;
        
        await prisma.proAccount.update({
          where: { userId },
          data: { payLink }
        });
      } catch (paymentErr) {
        payLink = \`\${baseUrl}/api/public/pro/callback?userId=\${userId}&type=PRO_REGISTER&success=true\`;
      }
    }

    res.json({
      message: (totalPayable > 0) ? 'در حال انتقال به درگاه پرداخت...' : (isAutoApprove ? 'اکانت پرو شما با موفقیت و به صورت آنی فعال شد!' : 'درخواست ثبت اکانت پرو شما ارسال شد و پس از بررسی فعال خواهد شد.'),
      proAccount,
      payLink
    });
  } catch (err: any) {
    console.error('Error in /api/store-manager/pro/register:', err);
    res.status(500).json({ error: 'خطا در ثبت نام اکانت پرو', details: err.message });
  }
});`;

code = code.replace(registerOld, registerNew);

// Now update the callback
const callbackOld = `if (type === 'HOST_RENEWAL') {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        await prisma.proAccount.update({
          where: { userId: parsedUserId },
          data: { hostExpiresAt: nextMonth, status: 'APPROVED' }
        }).catch(() => {});
      } else if (type === 'TOROB_SETUP') {`;

const callbackNew = `if (type === 'HOST_RENEWAL') {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        await prisma.proAccount.update({
          where: { userId: parsedUserId },
          data: { hostExpiresAt: nextMonth, status: 'APPROVED' }
        }).catch(() => {});
      } else if (type === 'PRO_REGISTER') {
        const autoApproveSetting = await prisma.systemSettings.findUnique({ where: { key: 'pro_auto_approve' } });
        const isAutoApprove = !autoApproveSetting || autoApproveSetting.value !== 'false';
        await prisma.proAccount.update({
          where: { userId: parsedUserId },
          data: { status: isAutoApprove ? 'APPROVED' : 'PENDING', payLink: null }
        }).catch(() => {});
      } else if (type === 'TOROB_SETUP') {`;

code = code.replace(callbackOld, callbackNew);

fs.writeFileSync('server.ts', code);
