import { Express, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export default function registerAIStudioRoute(app: Express) {
  // AI Studio Generation Endpoint
  app.post('/api/superadmin/ai-studio/generate', async (req: Request, res: Response) => {
    try {
      const { prompt, model = 'gemini-1.5-flash', systemInstruction, currentCss, imageFile } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'دستور متنی ارسال نشده است.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'کلید API هوش مصنوعی (GEMINI_API_KEY) در فایل تنظیمات (.env) یافت نشد. لطفاً آن را تنظیم فرمایید.'
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const baseSystemPrompt = systemInstruction || `شما توسعه‌دهنده و طراح ارشد رابط کاربری (UI/UX) و دستیار سیستم گوگل AI استودیو برای پلتفرم فروشگاهی زوپیت هستید.
وظیفه شما این است که بر اساس درخواست کاربر ایرانی، پاسخ تحلیلی و کدهای تغییر استایل (CSS) و تنظیمات پوسته را تولید کنید.

قوانین پاسخ‌دهی:
1. حتماً پاسخ خود را شامل یک بخش توضیحات فارسی روان و یک ساختار JSON معتبر جهت اعمال تغییرات ارسال کنید.
2. ساختار JSON باید دقیقاً به شکل زیر در انتهای پاسخ داخل تگ \`\`\`json باشد:
\`\`\`json
{
  "explanation": "توضیح کامل تغییرات اعمال‌شده به زبان فارسی",
  "customCss": "کدهای CSS معتبر جهت تغییر ظاهر، رنگ دکمه‌ها، فونت، فواصل، بنرها و پس‌زمینه سایت",
  "announcementBanner": {
    "enabled": true,
    "text": "متن اعلان بالای سایت (در صورت درخواست کاربر)",
    "bgColor": "#7c3aed",
    "textColor": "#ffffff"
  },
  "uiTheme": {
    "primaryColor": "#7c3aed",
    "backgroundColor": "#f8fafc",
    "cardRadius": "16px",
    "fontScale": "100%"
  },
  "codeSnippet": "کدهای پیشنهادی جاوااسکریپت یا تایپ‌اسکریپت برای فایل‌های کامپوننت (در صورت درخواست کاربر)"
}
\`\`\`
3. کدهای CSS باید کاملاً معتبر و بدون خطا باشند و دکمه‌ها، کارت‌ها، کادرهای ورودی، هدر و بنرها را جذاب و مدرن کنند.`;

      const userMessage = `کدهای فعلی CSS سایت:\n${currentCss || '/* هنوز کدی ثبت نشده است */'}\n\nدرخواست کاربر:\n${prompt}`;

      const selectedModel = (model === 'gemini-1.5-pro' || model === 'gemini-3.1-pro-preview')
        ? 'gemini-3.1-pro-preview'
        : 'gemini-3.6-flash';

      let contents: any;
      if (imageFile && imageFile.data && imageFile.mimeType) {
        // Multimodal part format
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: imageFile.mimeType,
                data: imageFile.data
              }
            },
            {
              text: `${baseSystemPrompt}\n\n${userMessage}\n\n(یک فایل تصویری نیز ضمیمه شده است. لطفاً آن را تحلیل کرده و طبق آن استایل دهید.)`
            }
          ]
        };
      } else {
        contents = [
          { role: 'user', parts: [{ text: baseSystemPrompt }, { text: userMessage }] }
        ];
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: contents
      });

      const responseText = response.text || '';

      // Extract JSON if present in ```json ... ```
      let parsedData: any = null;
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedData = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn('Failed to parse AI JSON block:', e);
        }
      }

      if (!parsedData) {
        // Fallback parsing or create structured object
        parsedData = {
          explanation: responseText.replace(/```[\s\S]*?```/g, '').trim() || responseText,
          customCss: '',
          announcementBanner: null,
          uiTheme: null,
          codeSnippet: ''
        };
      }

      return res.json({
        success: true,
        model: selectedModel,
        responseText: responseText,
        aiResult: parsedData
      });

    } catch (err: any) {
      console.error('AI Studio Generation Error:', err);
      return res.status(500).json({
        error: err.message || 'خطا در ارتباط با سرویس گوگل AI استودیو'
      });
    }
  });
}
