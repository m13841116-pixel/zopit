export function printOrderInvoice(order: any) {
  if (!order) return;

  // Create temporary iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  const itemsHtml = (order.items || []).map((item: any, index: number) => {
    const title = item.product?.title || item.variant?.product?.title || "کالای عمده";
    let variantDesc: any = {};
    if (item.variant?.attributes) {
      try {
        variantDesc = typeof item.variant.attributes === 'string' ? JSON.parse(item.variant.attributes) : item.variant.attributes;
      } catch {}
    }
    const variantStr = Object.entries(variantDesc).map(([k, v]) => `${k}: ${v}`).join(" | ");
    const price = item.price || item.variant?.supplierBasePrice || 0;
    const qty = item.quantity || 1;
    const total = price * qty;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: center; font-size: 11px;">${index + 1}</td>
        <td style="padding: 12px; text-align: right; font-size: 11px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
          ${variantStr ? `<div style="font-size: 10px; color: #64748b;">${variantStr}</div>` : ""}
        </td>
        <td style="padding: 12px; text-align: center; font-size: 11px;">${qty.toLocaleString()}</td>
        <td style="padding: 12px; text-align: left; font-size: 11px; font-family: monospace;">${price.toLocaleString()}</td>
        <td style="padding: 12px; text-align: left; font-size: 11px; font-family: monospace; font-weight: bold;">${total.toLocaleString()}</td>
      </tr>
    `;
  }).join("");

  const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("fa-IR") : "-";

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاکتور رسمی سفارش ${order.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        body {
          font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px double #0284c7;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 18px;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: 900;
          color: #0284c7;
        }
        .meta-section {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }
        .meta-column p {
          margin: 6px 0;
          font-size: 12px;
        }
        .meta-column p span {
          font-weight: bold;
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #f1f5f9;
          color: #0f172a;
          font-weight: bold;
          padding: 12px;
          font-size: 12px;
          border-bottom: 2px solid #cbd5e1;
        }
        .total-box {
          display: flex;
          justify-content: flex-end;
          gap: 40px;
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 16px 24px;
          border-radius: 12px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 10px;
          color: #64748b;
          border-top: 1px dashed #e2e8f0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <div class="logo-box">Bank Kala</div>
          <div style="font-size: 12px; color: #64748b; font-weight: bold;">سامانه توزیع و پخش کالا</div>
        </div>
        <div class="invoice-title">فاکتور رسمی فروش کالا</div>
      </div>

      <div class="meta-section">
        <div class="meta-column">
          <p>شماره فاکتور سفارش: <span>#${order.id}</span></p>
          <p>تاریخ ثبت سفارش: <span>${formattedDate}</span></p>
          <p>وضعیت سفارش: <span>${order.status}</span></p>
        </div>
        <div class="meta-column">
          <p>خریدار (فروشگاه): <span>${order.store?.companyName || order.store?.username || "نامشخص"}</span></p>
          <p>نشانی تحویل: <span>${order.shippingAddress || "آدرس رسمی ثبت‌شده در سیستم"}</span></p>
          <p>روش ارسال مرسوله: <span>${order.shippingMethod === "PERSONAL_PANEL" ? "پنل اختصاصی غرفه" : "پنل ارسال پلتفرم"}</span></p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">ردیف</th>
            <th style="width: 50%; text-align: right;">شرح کالا / خدمات</th>
            <th style="width: 12%; text-align: center;">تعداد</th>
            <th style="width: 15%; text-align: left;">قیمت واحد (تومان)</th>
            <th style="width: 15%; text-align: left;">جمع کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-box">
        <div style="font-size: 13px;">جمع کل مبالغ فاکتور:</div>
        <div style="font-size: 16px; font-weight: 900; color: #0284c7; font-family: monospace;">${(order.totalAmount || 0).toLocaleString()} تومان</div>
      </div>

      <div class="footer">
        <p>این فاکتور جهت تایید سفارش صادر گردیده و به صورت سیستمی معتبر است.</p>
        <p>پلتفرم عمده‌فروشی آنلاین بنک‌کالا - خرید مستقیم از واردکنندگان و تولیدکنندگان اصلی سراسر کشور</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  doc.open();
  doc.write(invoiceHtml);
  doc.close();

  // Remove the iframe after printing is initiated
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);
}
