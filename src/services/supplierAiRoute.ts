import { Express, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

function safeParseInt(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const parsed = parseInt(String(val).replace(/[^0-9-]/g, ''), 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function registerSupplierAiRoute(
  app: Express,
  prisma: any,
  authenticateToken: any,
  requireSupplier: any
) {
  // 1. AI Text Assistant for Supplier Product Creation
  app.post(
    '/api/supplier/products/ai-assist',
    authenticateToken,
    requireSupplier,
    async (req: any, res: Response) => {
      try {
        const { name, category, brand, keywords, currentSpecs } = req.body;

        const productName = String(name || '').trim();
        const productCategory = String(category || '').trim();
        const productBrand = String(brand || '').trim();
        const additionalKeywords = String(keywords || '').trim();

        if (!productName && !productCategory) {
          return res.status(400).json({
            error: 'حداقل نام محصول یا دسته‌بندی کالا را برای تولید محتوا وارد فرمایید.',
            success: false,
          });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({
            error: 'کلید ارتباط با هوش مصنوعی (GEMINI_API_KEY) در تنظیمات سرور یافت نشد.',
            success: false,
          });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `شما یک کارشناس ارشد تولید محتوای مارکت‌پلیس تجارت الکترونیک (B2B و B2C) در ایران (پلتفرم زوپیت Zopit) هستید.
با توجه به اطلاعات زیر برای محصول تامین‌کننده، محتوای کامل، جذاب، سئو شده و کاملاً فارسی در فرمت JSON خروجی دهید:

اطلاعات ورودی:
- نام اولیه کالا: ${productName || 'نامشخص'}
- دسته‌بندی: ${productCategory || 'عمومی'}
- برند: ${productBrand || 'نامشخص'}
- نکات یا کلمات کلیدی تامین‌کننده: ${additionalKeywords || 'ندارد'}
- مشخصات فنی فعلی: ${JSON.stringify(currentSpecs || [])}

قوانین تولید محتوا:
1. title: عنوان کامل، بهینه‌شده، با برند و ویژگی بارز به زبان فارسی بدون بزرگ‌نمایی دروغین.
2. shortDescription: یک یا دو جمله جذاب (حدود ۲۰ تا ۳۵ کلمه) خلاصه مزیت محصول برای کارت کالا.
3. longDescription: متن توضیحات جامع و خوانا (حداقل ۳ پاراگراف) شامل معرفی، کیفیت ساخت، نحوه کارکرد و اقلام همراه.
4. features: آرایه‌ای از ۵ ویژگی کلیدی یا نقاط قوت برجسته محصول (به صورت تیترهای کوتاه).
5. seoKeywords: آرایه‌ای از ۶ عبارت جستجوی محبوب خریداران در ایران.
6. technicalSpecs: آرایه‌ای از اشیاء { "key": string, "value": string } شامل حداقل ۴ مشخصه فنی استاندارد کالا (مانند کشور سازنده، جنس بدنه، قابلیت‌ها، اقلام همراه).

خروجی باید فقط و فقط یک JSON معتبر باشد بدون هیچ متن اضافه یا markdown syntax خارج از JSON.
فرمت خروجی مورد انتظار:
{
  "title": "عنوان پیشنهادی بهینه‌شده",
  "shortDescription": "توضیح کوتاه جذاب",
  "longDescription": "توضیحات جامع محصول...",
  "features": ["ویژگی ۱", "ویژگی ۲", "ویژگی ۳", "ویژگی ۴", "ویژگی ۵"],
  "seoKeywords": ["کلمه ۱", "کلمه ۲", "کلمه ۳", "کلمه ۴", "کلمه ۵", "کلمه ۶"],
  "technicalSpecs": [
    {"key": "کشور سازنده", "value": "چین / اصلی"},
    {"key": "جنس بدنه", "value": "پلی‌کربنات مقاوم"},
    {"key": "گارانتی", "value": "ضمانت اصالت و سلامت فیزیکی"}
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        let parsedResult: any = {};

        try {
          parsedResult = JSON.parse(rawText);
        } catch (jsonErr) {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            parsedResult = JSON.parse(match[0]);
          } else {
            throw new Error('قالب پاسخ دریافتی از هوش مصنوعی معتبر نبود.');
          }
        }

        return res.json({
          success: true,
          data: {
            title: parsedResult.title || productName,
            shortDescription: parsedResult.shortDescription || '',
            longDescription: parsedResult.longDescription || '',
            features: Array.isArray(parsedResult.features) ? parsedResult.features : [],
            seoKeywords: Array.isArray(parsedResult.seoKeywords) ? parsedResult.seoKeywords : [],
            technicalSpecs: Array.isArray(parsedResult.technicalSpecs) ? parsedResult.technicalSpecs : [],
          },
        });
      } catch (err: any) {
        console.error('[Supplier AI Assist API Error]:', err);
        return res.status(500).json({
          error: err.message || 'خطا در تولید هوشمند محتوا',
          success: false,
        });
      }
    }
  );

  // 2. Overview Stats & Drafts for Supplier Product Creation Landing
  app.post(
    '/api/supplier/products/creation-overview',
    authenticateToken,
    requireSupplier,
    async (req: any, res: Response) => {
      try {
        const supplierId = req.user.supplierId || req.user.id;

        // Fetch supplier's product stats
        const totalProducts = await prisma.product.count({
          where: { supplierId },
        });

        const publishedProducts = await prisma.product.count({
          where: { supplierId, status: 'PUBLISHED' },
        });

        const pendingProducts = await prisma.product.count({
          where: {
            supplierId,
            status: { in: ['PENDING_APPROVAL', 'ADMIN_REVIEW'] },
          },
        });

        const drafts = await prisma.product.findMany({
          where: { supplierId, status: 'DRAFT' },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            supplierBasePrice: true,
            inventory: true,
            createdAt: true,
            updatedAt: true,
            categoryId: true,
            brand: true,
            imageUrl: true,
            shortDescription: true,
            technicalSpecs: true,
          },
        });

        // Top categories for quick tagging
        const topCategories = await prisma.category.findMany({
          take: 8,
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });

        return res.json({
          success: true,
          stats: {
            totalProducts,
            publishedProducts,
            pendingProducts,
            draftsCount: drafts.length,
          },
          drafts,
          topCategories,
        });
      } catch (err: any) {
        console.error('[Supplier Product Creation Overview Error]:', err);
        return res.status(500).json({
          error: 'خطا در دریافت خلاصه محصولات تامین‌کننده',
          success: false,
        });
      }
    }
  );
}

export default registerSupplierAiRoute;
