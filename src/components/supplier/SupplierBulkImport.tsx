import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  FileUp,
  RefreshCw,
  FileCheck,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  Info,
  X,
  Eye,
  Check,
  Database,
  ExternalLink
} from "lucide-react";
import { toast } from "../GlobalToast";

interface TargetField {
  key: string;
  label: string;
  required: boolean;
  description: string;
  aliases: string[];
}

const TARGET_FIELDS: TargetField[] = [
  {
    key: "name",
    label: "نام محصول",
    required: true,
    description: "عنوان کامل و گویای محصول برای نمایش در ویترین",
    aliases: [
      "نام محصول", "نام کالا", "عنوان", "عنوان محصول", "نام", "product_name",
      "product name", "title", "name", "product"
    ],
  },
  {
    key: "supplierBasePrice",
    label: "قیمت پایه تامین‌کننده (تومان)",
    required: true,
    description: "مبلغ خالص فروش عمده شما بدون در نظر گرفتن حاشیه سود زوپیت",
    aliases: [
      "قیمت", "قیمت پایه", "قیمت تامین کننده", "قیمت تامین‌کننده", "قیمت عمده",
      "قیمت خرید", "قیمت پایه (تومان)", "supplier_price", "base_price",
      "wholesale_price", "price", "cost"
    ],
  },
  {
    key: "inventory",
    label: "موجودی انبار",
    required: true,
    description: "تعداد قطعی موجود در انبار برای ارسال فوری",
    aliases: [
      "موجودی", "تعداد", "موجودی انبار", "تعداد موجود", "موجودی (عدد)",
      "inventory", "stock", "quantity", "qty", "count"
    ],
  },
  {
    key: "category",
    label: "دسته‌بندی",
    required: true,
    description: "یکی از دسته‌بندی‌های استاندارد پلتفرم زوپیت",
    aliases: [
      "دسته‌بندی", "دسته بندی", "دسته", "گروه کالا", "نام دسته", "گروه",
      "category", "cat", "category_name", "category_title"
    ],
  },
  {
    key: "sku",
    label: "کد محصول (SKU)",
    required: false,
    description: "شناسه یکتای انبارداری شما جهت به‌روزرسانی قیمت و موجودی در آینده",
    aliases: [
      "کد محصول", "شناسه کالا", "شناسه محصول", "کد کالا", "کد", "sku",
      "product_code", "code", "barcode", "شناسه"
    ],
  },
  {
    key: "brand",
    label: "برند / تولیدکننده",
    required: false,
    description: "نام برند تجاری یا کمپانی سازنده",
    aliases: [
      "برند", "نام برند", "مارک", "شرکت سازنده", "تولید کننده", "brand",
      "make", "manufacturer"
    ],
  },
  {
    key: "shortDescription",
    label: "توضیحات کوتاه",
    required: false,
    description: "خلاصه ویژگی‌های کلیدی (یک الی دو جمله)",
    aliases: [
      "توضیحات کوتاه", "خلاصه", "معرفی کوتاه", "short_description", "summary",
      "short description", "brief"
    ],
  },
  {
    key: "longDescription",
    label: "توضیحات کامل",
    required: false,
    description: "شرح جامع مشخصات، کاربردها و نکات استفاده از محصول",
    aliases: [
      "توضیحات کامل", "توضیحات", "شرح", "مشخصات کلی", "معرفی محصول",
      "description", "details", "long_description"
    ],
  },
  {
    key: "mainImage",
    label: "لینک تصویر اصلی",
    required: false,
    description: "آدرس اینترنتی عکس باکیفیت محصول (URL با فرمت jpg, png, webp)",
    aliases: [
      "آدرس تصویر", "تصویر اصلی", "عکس", "لینک عکس", "تصویر", "image",
      "image_url", "main_image", "imageUrl", "photo", "pic"
    ],
  },
  {
    key: "additionalImages",
    label: "سایر تصاویر (گالری)",
    required: false,
    description: "آدرس تصاویر بیشتر جدا شده با کاما یا خط تیره",
    aliases: [
      "سایر تصاویر", "تصاویر بیشتر", "گالری", "عکس های بیشتر", "images",
      "additional_images", "gallery", "more_images"
    ],
  },
  {
    key: "phoneModel",
    label: "مدل سازگار / مدل گوشی",
    required: false,
    description: "برای لوازم جانبی (مثال: iPhone 13 Pro Max)",
    aliases: [
      "مدل سازگار", "مدل گوشی", "مدل", "سازگاری", "phone_model", "model",
      "compatible_model"
    ],
  },
  {
    key: "color",
    label: "رنگ‌بندی اولیه",
    required: false,
    description: "رنگ محصول (مثال: مشکی مات، تیتانیوم)",
    aliases: ["رنگ", "رنگ بندی", "رنگ‌بندی", "color", "colour"],
  },
];

interface ValidatedRow {
  rowNum: number;
  data: Record<string, any>;
  errors: { column: string; message: string; suggestion: string }[];
  warnings: { column: string; message: string }[];
  isValid: boolean;
}

interface ImportBatchHistory {
  id: number;
  fileName: string;
  fileType: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  status: string;
  createdAt: string;
}

interface SupplierBulkImportProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const SupplierBulkImport: React.FC<SupplierBulkImportProps> = ({
  onSuccess,
  onCancel,
  showNotification,
}) => {
  // State
  const [activeSubTab, setActiveSubTab] = useState<"import" | "history">("import");
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "result">("upload");

  // File & Raw Data
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column Mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Categories cache
  const [categories, setCategories] = useState<any[]>([
    { id: 1, name: "دیجیتال و لوازم جانبی" },
    { id: 2, name: "پوشاک و مد" },
    { id: 3, name: "زیبایی و سلامت" },
    { id: 4, name: "خانه و آشپزخانه" },
    { id: 5, name: "ورزش و سفر" },
    { id: 6, name: "اسباب بازی و کودک" },
    { id: 7, name: "موبایل و تبلت" },
    { id: 8, name: "لوازم خانگی برقی" },
  ]);

  // Preview & Validation
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "invalid">("all");

  // Import Settings
  const [duplicateAction, setDuplicateAction] = useState<"update" | "skip" | "create_new">("update");
  const [targetStatus, setTargetStatus] = useState<"PENDING_APPROVAL" | "DRAFT">("PENDING_APPROVAL");

  // Import Execution & Progress
  const [importProgress, setImportProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    percentage: number;
  }>({ currentBatch: 0, totalBatches: 0, percentage: 0 });

  // Final Results
  const [importResult, setImportResult] = useState<{
    total: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    errorsCount: number;
    errors: { row: number; column: string; name: string; error: string; suggestion: string }[];
  }>({
    total: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorsCount: 0,
    errors: [],
  });

  // History
  const [historyList, setHistoryList] = useState<ImportBatchHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/public/categories");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.categories || [];
          if (list.length > 0) {
            setCategories(list);
            return;
          }
        }
        const res2 = await fetch("/api/categories");
        if (res2.ok) {
          const data2 = await res2.json();
          const list2 = Array.isArray(data2) ? data2 : data2?.categories || [];
          if (list2.length > 0) setCategories(list2);
        }
      } catch (err) {
        console.warn("Categories fetch fallback");
      }
    }
    loadCategories();
  }, []);

  // Fetch history when history tab is active
  useEffect(() => {
    if (activeSubTab === "history") {
      fetchImportHistory();
    }
  }, [activeSubTab]);

  const fetchImportHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/products/import-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.warn("Error fetching import history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper normalizer
  const cleanStr = (val: any): string => {
    if (val === undefined || val === null) return "";
    return String(val)
      .replace(/[ي]/g, "ی")
      .replace(/[ك]/g, "ک")
      .replace(/[۰]/g, "0").replace(/[۱]/g, "1").replace(/[۲]/g, "2").replace(/[۳]/g, "3").replace(/[۴]/g, "4")
      .replace(/[۵]/g, "5").replace(/[۶]/g, "6").replace(/[۷]/g, "7").replace(/[۸]/g, "8").replace(/[۹]/g, "9")
      .replace(/[٠]/g, "0").replace(/[١]/g, "1").replace(/[٢]/g, "2").replace(/[٣]/g, "3").replace(/[٤]/g, "4")
      .replace(/[٥]/g, "5").replace(/[٦]/g, "6").replace(/[٧]/g, "7").replace(/[٨]/g, "8").replace(/[٩]/g, "9")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
  };

  // 1. Download Sample Excel (.xlsx)
  const handleDownloadExcelTemplate = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sample rows
      const sampleHeaders = [
        "کد محصول (SKU)",
        "نام محصول (الزامی)",
        "دسته‌بندی (الزامی)",
        "قیمت پایه تامین‌کننده (تومان)",
        "موجودی انبار",
        "برند",
        "توضیحات کوتاه",
        "توضیحات کامل",
        "مدل سازگار / گوشی",
        "رنگ",
        "آدرس تصویر اصلی",
        "سایر تصاویر (جدا شده با کاما)",
      ];

      const sampleData = [
        sampleHeaders,
        [
          "ZP-SAMPLE-01",
          "قاب ژله‌ای شفاف ضدضربه آیفون ۱۳ پرو",
          categories[0]?.name || "موبایل و تبلت",
          "120000",
          "50",
          "Zopit Gear",
          "شفاف و بادوام با محافظ لنز دوربین",
          "تولید شده از بهترین متریال TPU آلمانی با لبه‌های تقویت شده و مقاومت در برابر زردی در درازمدت.",
          "iPhone 13 Pro",
          "شفاف",
          "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        ],
        [
          "ZP-SAMPLE-02",
          "کابل تبدیل لایتنینگ به تایپ سی فست شارژ",
          categories[0]?.name || "دیجیتال و لوازم جانبی",
          "95000",
          "120",
          "Baseus",
          "پشتیبانی از شارژ سریع PD تا توان ۲۰ وات",
          "روکش کنفی بافته شده مقاوم در برابر پارگی و خمش به همراه چیپست هوشمند محافظت از باتری.",
          "کلیه محصولات اپل",
          "مشکی",
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
          "",
        ],
        [
          "ZP-SAMPLE-03",
          "پاوربانک ۲۰۰۰۰ میلی‌آمپر با خروجی شارژ سریع",
          categories[0]?.name || "دیجیتال و لوازم جانبی",
          "650000",
          "25",
          "Anker",
          "شارژ همزمان ۳ دستگاه با نمایشگر درصد شارژ",
          "بدنه ضد حرارت و سبک با گواهی استانداردهای ایمنی بین‌المللی هواپیمایی.",
          "همه گوشی‌های هوشمند",
          "سفید",
          "https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=600&auto=format&fit=crop&q=80",
          "",
        ],
      ];

      const wsProducts = XLSX.utils.aoa_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, wsProducts, "محصولات");

      // Guidance sheet
      const categoryRows = [
        ["ردیف", "نام دسته‌بندی معتبر در زوپیت", "توضیحات"],
        ...categories.map((c, idx) => [
          idx + 1,
          c.name,
          "جهت وارد کردن در ستون دسته‌بندی فایل اکسل",
        ]),
      ];
      const wsCategories = XLSX.utils.aoa_to_sheet(categoryRows);
      XLSX.utils.book_append_sheet(workbook, wsCategories, "دسته‌بندی‌های مجاز");

      XLSX.writeFile(workbook, "zopit_sample_products.xlsx");
      toast.success("قالب استاندارد اکسل زوپیت با موفقیت دانلود شد.");
    } catch (err) {
      toast.error("خطا در ایجاد فایل اکسل نمونه.");
    }
  };

  // 2. Download Sample CSV (UTF-8 BOM)
  const handleDownloadCsvTemplate = () => {
    try {
      const headers = [
        "کد محصول (SKU)",
        "نام محصول (الزامی)",
        "دسته‌بندی (الزامی)",
        "قیمت پایه تامین‌کننده (تومان)",
        "موجودی انبار",
        "برند",
        "توضیحات کوتاه",
        "توضیحات کامل",
        "مدل سازگار / گوشی",
        "رنگ",
        "آدرس تصویر اصلی",
      ];
      const row1 = [
        "ZP-CSV-01",
        "هولدر مگنتی خودرو با پایه چسبی ۳M",
        categories[0]?.name || "دیجیتال و لوازم جانبی",
        "185000",
        "40",
        "Zopit Gear",
        "مگنت نئودیمیومی پرقدرت بدون اختلال در سیگنال",
        "قابلیت چرخش ۳۶۰ درجه و سازگار با انواع گوشی‌ها",
        "یونیورسال",
        "مشکی",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80",
      ];

      const csvContent =
        "\uFEFF" +
        [
          headers.map((h) => `"${h}"`).join(","),
          row1.map((r) => `"${r}"`).join(","),
        ].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "zopit_sample_products.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("قالب استاندارد CSV با پشتیبانی زبان فارسی دانلود شد.");
    } catch (err) {
      toast.error("خطا در دانلود فایل CSV نمونه.");
    }
  };

  // 3. Handle File Upload & Parsing
  const handleFileProcess = (file: File) => {
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۱۵ مگابایت باشد.");
      return;
    }

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error("لطفاً یک فایل با پسوند .xlsx ، .xls یا .csv انتخاب فرمایید.");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        setWorkbookRef(workbook);
        setSheetNames(workbook.SheetNames);
        const defaultSheet = workbook.SheetNames[0];
        setSelectedSheet(defaultSheet);

        parseSheetData(workbook, defaultSheet);
      } catch (err: any) {
        toast.error("خطا در خواندن فایل اکسل. لطفاً از صحت و عدم خرابی فایل اطمینان حاصل کنید.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      toast.error("برگه انتخاب شده در فایل اکسل یافت نشد.");
      return;
    }

    // Read as 2D array
    const raw: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    if (raw.length < 2) {
      toast.error("فایل بارگذاری شده حاوی سطر داده نیست یا فقط دارای هدر می‌باشد.");
      return;
    }

    // First row = headers
    const rawHeaders = raw[0].map((h: any) => cleanStr(h));
    const dataRows = raw.slice(1).filter((r) => r.some((c) => cleanStr(c).length > 0));

    if (dataRows.length === 0) {
      toast.error("هیچ سطر اطلاعاتی در برگه یافت نشد.");
      return;
    }

    setFileHeaders(rawHeaders);
    setRawRows(dataRows);

    // Auto-detect mappings
    autoMapColumns(rawHeaders);
    setStep("mapping");
  };

  // 4. Auto Column Detection
  const autoMapColumns = (headers: string[]) => {
    const newMapping: Record<string, string> = {};

    TARGET_FIELDS.forEach((target) => {
      let matchedHeader = "";

      for (const h of headers) {
        const cleanH = cleanStr(h).toLowerCase();
        // Exact alias check
        const match = target.aliases.some((alias) => {
          const cleanAlias = cleanStr(alias).toLowerCase();
          return cleanH === cleanAlias || cleanH.includes(cleanAlias) || cleanAlias.includes(cleanH);
        });

        if (match) {
          matchedHeader = h;
          break;
        }
      }

      if (matchedHeader) {
        newMapping[target.key] = matchedHeader;
      }
    });

    setColumnMapping(newMapping);
  };

  // 5. Run Validation on Mapped Rows
  const runValidation = () => {
    // Check required fields mapped
    const unmappedRequired = TARGET_FIELDS.filter((f) => f.required && !columnMapping[f.key]);
    if (unmappedRequired.length > 0) {
      toast.error(
        `لطفاً ستون‌های الزامی (${unmappedRequired.map((f) => f.label).join("، ")}) را نگاشت کنید.`
      );
      return;
    }

    const headerIndexMap = new Map<string, number>();
    fileHeaders.forEach((h, idx) => headerIndexMap.set(h, idx));

    const validated: ValidatedRow[] = [];
    const seenSkus = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header row
      const errors: { column: string; message: string; suggestion: string }[] = [];
      const warnings: { column: string; message: string }[] = [];
      const rowData: Record<string, any> = {};

      // Extract values according to mapping
      TARGET_FIELDS.forEach((field) => {
        const mappedHeader = columnMapping[field.key];
        if (mappedHeader && headerIndexMap.has(mappedHeader)) {
          const colIdx = headerIndexMap.get(mappedHeader)!;
          rowData[field.key] = row[colIdx];
        } else {
          rowData[field.key] = "";
        }
      });

      // 1. Name Check
      const name = cleanStr(rowData.name);
      if (!name) {
        errors.push({
          column: "نام محصول",
          message: "نام محصول خالی است.",
          suggestion: "یک عنوان توصیفی برای کالا در این ردیف درج نمایید.",
        });
      }

      // 2. Price Check
      const rawPrice = cleanStr(rowData.supplierBasePrice).replace(/[,_]/g, "");
      const price = parseFloat(rawPrice);
      if (isNaN(price) || price <= 0) {
        errors.push({
          column: "قیمت پایه تامین‌کننده",
          message: `قیمت پایه نامعتبر است: «${rowData.supplierBasePrice || "خالی"}»`,
          suggestion: "قیمت عمده را به تومان و به صورت عدد مثبت بزرگتر از صفر وارد کنید.",
        });
      } else {
        rowData.supplierBasePrice = price;
      }

      // 3. Inventory Check
      const rawStock = cleanStr(rowData.inventory).replace(/[,_]/g, "");
      const stock = parseInt(rawStock);
      if (isNaN(stock) || stock < 0) {
        errors.push({
          column: "موجودی انبار",
          message: `موجودی انبار نامعتبر است: «${rowData.inventory || "خالی"}»`,
          suggestion: "تعداد را به صورت عدد صحیح بزرگتر یا مساوی ۰ وارد نمایید.",
        });
      } else {
        rowData.inventory = stock;
      }

      // 4. Category Check against Zopit categories
      const rawCat = cleanStr(rowData.category);
      if (!rawCat) {
        errors.push({
          column: "دسته‌بندی",
          message: "دسته‌بندی محصول مشخص نشده است.",
          suggestion: "نام یکی از دسته‌بندی‌های فعال زوپیت را وارد فرمایید.",
        });
      } else {
        const normInputCat = rawCat.toLowerCase();
        const matchedCategory = categories.find((c) => {
          const normC = cleanStr(c.name).toLowerCase();
          return normC === normInputCat || normC.includes(normInputCat) || normInputCat.includes(normC);
        });

        if (!matchedCategory) {
          errors.push({
            column: "دسته‌بندی",
            message: `دسته‌بندی «${rawCat}» در زوپیت یافت نشد.`,
            suggestion: `از دسته‌بندی‌های مجاز زوپیت (${categories.slice(0, 4).map((c) => c.name).join("، ")} و...) استفاده کنید.`,
          });
        } else {
          rowData.category = matchedCategory.name;
        }
      }

      // 5. SKU Duplicate in-file check
      const rawSku = cleanStr(rowData.sku);
      if (rawSku) {
        if (seenSkus.has(rawSku)) {
          warnings.push({
            column: "کد محصول (SKU)",
            message: `کد محصول «${rawSku}» در چند سطر این فایل تکرار شده است.`,
          });
        } else {
          seenSkus.add(rawSku);
        }
      }

      // 6. Image warnings
      const rawImg = cleanStr(rowData.mainImage);
      if (rawImg && !rawImg.startsWith("http://") && !rawImg.startsWith("https://") && !rawImg.startsWith("/uploads/")) {
        warnings.push({
          column: "تصویر اصلی",
          message: "فرمت آدرس تصویر با http یا https آغاز نمی‌شود.",
        });
      } else if (!rawImg) {
        warnings.push({
          column: "تصویر اصلی",
          message: "تصویر اصلی خالی است. تصویر پیش‌فرض موقت جایگزین خواهد شد.",
        });
      }

      validated.push({
        rowNum,
        data: rowData,
        errors,
        warnings,
        isValid: errors.length === 0,
      });
    });

    setValidatedRows(validated);
    setStep("preview");
  };

  // 6. Execute Import in Batches
  const handleExecuteImport = async () => {
    const validRowsToImport = validatedRows.filter((r) => r.isValid);

    if (validRowsToImport.length === 0) {
      toast.error("هیچ ردیف معتبری برای ورود اطلاعات یافت نشد. ابتدا خطاهای فایل را برطرف کنید.");
      return;
    }

    setStep("importing");

    const batchSize = 50;
    const totalBatches = Math.ceil(validRowsToImport.length / batchSize);
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const allServerErrors: any[] = [];

    const token = localStorage.getItem("token") || "";

    for (let b = 0; b < totalBatches; b++) {
      const batchItems = validRowsToImport.slice(b * batchSize, (b + 1) * batchSize);
      const payloadProducts = batchItems.map((item) => ({
        ...item.data,
        name: cleanStr(item.data.name),
        category: cleanStr(item.data.category),
        supplierBasePrice: item.data.supplierBasePrice,
        inventory: item.data.inventory,
        sku: cleanStr(item.data.sku),
        brand: cleanStr(item.data.brand),
        shortDescription: cleanStr(item.data.shortDescription),
        longDescription: cleanStr(item.data.longDescription),
        mainImage: cleanStr(item.data.mainImage),
        additionalImages: cleanStr(item.data.additionalImages),
        phoneModel: cleanStr(item.data.phoneModel),
        color: cleanStr(item.data.color),
      }));

      setImportProgress({
        currentBatch: b + 1,
        totalBatches,
        percentage: Math.round(((b + 1) / totalBatches) * 100),
      });

      try {
        const res = await fetch("/api/supplier/products/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            products: payloadProducts,
            duplicateAction,
            targetStatus,
            fileName: fileName || "import.xlsx",
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          totalCreated += data.createdCount || data.count || 0;
          totalUpdated += data.updatedCount || 0;
          totalSkipped += data.skippedCount || 0;
          if (Array.isArray(data.errors) && data.errors.length > 0) {
            allServerErrors.push(...data.errors);
          }
        } else {
          allServerErrors.push({
            row: b * batchSize + 1,
            column: "دسته",
            name: `بسته شماره ${b + 1}`,
            error: data.error || "خطا در پردازش این بخش از فایل",
            suggestion: "لطفاً اتصال اینترنت و مقادیر این ردیف‌ها را بررسی کنید.",
          });
        }
      } catch (err: any) {
        allServerErrors.push({
          row: b * batchSize + 1,
          column: "شبکه",
          name: `بسته شماره ${b + 1}`,
          error: "خطا در اتصال به سرور زوپیت",
          suggestion: "لطفاً دقایقی دیگر مجدداً تلاش فرمایید.",
        });
      }
    }

    setImportResult({
      total: validRowsToImport.length,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      skippedCount: totalSkipped,
      errorsCount: allServerErrors.length,
      errors: allServerErrors,
    });

    setStep("result");

    if (totalCreated > 0 || totalUpdated > 0) {
      toast.success(
        `ورود اطلاعات به پایان رسید: ${totalCreated} محصول جدید ثبت و ${totalUpdated} محصول به‌روزرسانی شد.`
      );
      if (showNotification) {
        showNotification(
          `تعداد ${totalCreated} محصول جدید و ${totalUpdated} محصول به‌روزرسانی با موفقیت پردازش گردید.`,
          "success"
        );
      }
    } else {
      toast.error("هیچ محصولی با موفقیت ثبت نشد. گزارش خطاها را بررسی کنید.");
    }
  };

  // 7. Download Error Report
  const handleDownloadErrorReport = () => {
    try {
      const errorRows: any[] = [];

      // Combine client validation errors and server errors
      if (step === "preview") {
        validatedRows
          .filter((r) => !r.isValid)
          .forEach((r) => {
            errorRows.push({
              "شماره ردیف فایل اصلی": r.rowNum,
              "نام محصول": r.data.name || "نامشخص",
              "کد محصول (SKU)": r.data.sku || "",
              "دسته‌بندی": r.data.category || "",
              "قیمت پایه": r.data.supplierBasePrice || "",
              "موجودی": r.data.inventory || "",
              "ستون دارای خطا": r.errors.map((e) => e.column).join(" | "),
              "علت خطا": r.errors.map((e) => e.message).join(" | "),
              "پیشنهاد رفع نقص": r.errors.map((e) => e.suggestion).join(" | "),
            });
          });
      } else if (step === "result") {
        importResult.errors.forEach((e) => {
          errorRows.push({
            "شماره ردیف": e.row || "-",
            "ستون": e.column || "-",
            "عنوان کالا": e.name || "-",
            "علت خطا": e.error || "-",
            "پیشنهاد اصلاح": e.suggestion || "-",
          });
        });
      }

      if (errorRows.length === 0) {
        toast.info("هیچ خطایی جهت خروجی اکسل وجود ندارد.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(errorRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "گزارش خطاها");
      XLSX.writeFile(wb, `zopit_import_errors_${Date.now()}.xlsx`);
      toast.success("فایل اکسل ردیف‌های دارای خطا دانلود شد.");
    } catch (err) {
      toast.error("خطا در ایجاد گزارش خطاهای اکسل.");
    }
  };

  // Filtered rows for preview table
  const filteredPreviewRows = validatedRows.filter((r) => {
    if (previewFilter === "valid") return r.isValid;
    if (previewFilter === "invalid") return !r.isValid;
    return true;
  });

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.filter((r) => !r.isValid).length;

  return (
    <div id="supplier-bulk-import-container" className="space-y-6 animate-fade-in font-sans pb-12" dir="rtl">
      {/* Header Banner */}
      <div className="bg-card border border-border-default rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black border border-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-text-primary">
                  ورود دسته‌جمعی محصولات با اکسل و CSV
                </h1>
                <p className="text-text-muted text-xs md:text-sm">
                  بارگذاری کاتالوگ انبوه، نگاشت خودکار ستون‌ها، اعتبارسنجی دقیق و به‌روزرسانی آسان محصولات
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("import")}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "import"
                  ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                  : "bg-surface hover:bg-subtle text-text-secondary border border-border-default"
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>بارگذاری فایل جدید</span>
            </button>
            <button
              onClick={() => setActiveSubTab("history")}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "history"
                  ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                  : "bg-surface hover:bg-subtle text-text-secondary border border-border-default"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>تاریخچه بارگذاری‌ها</span>
            </button>
          </div>
        </div>

        {/* Lifecycle Notice */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-black">سیاست چرخه انتشار محصولات زوپیت:</span> کلیه محصولات بارگذاری شده از طریق فایل اکسل پس از ثبت به صورت{" "}
            <strong>«در انتظار تایید کارشناس» (PENDING_APPROVAL)</strong> یا <strong>«پیش‌نویس» (DRAFT)</strong> ثبت شده و هرگز بلافاصله در فروشگاه منتشر نمی‌شوند. انتشار عمومی پس از تایید مدیریت و اعمال حاشیه سود پلتفرم انجام خواهد پذیرفت.
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: IMPORT PROCESS */}
      {activeSubTab === "import" && (
        <div className="space-y-6">
          {/* Stepper Wizard Indicator */}
          <div className="bg-card border border-border-default rounded-2xl p-4 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
              <div
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  step === "upload"
                    ? "bg-primary-default text-white shadow-xs"
                    : "bg-surface text-text-muted"
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  ۱
                </span>
                <span>انتخاب فایل</span>
              </div>

              <div
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  step === "mapping"
                    ? "bg-primary-default text-white shadow-xs"
                    : "bg-surface text-text-muted"
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  ۲
                </span>
                <span>نگاشت ستون‌ها</span>
              </div>

              <div
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  step === "preview"
                    ? "bg-primary-default text-white shadow-xs"
                    : "bg-surface text-text-muted"
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  ۳
                </span>
                <span>اعتبارسنجی و پیش‌نمایش</span>
              </div>

              <div
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  step === "importing" || step === "result"
                    ? "bg-primary-default text-white shadow-xs"
                    : "bg-surface text-text-muted"
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  ۴
                </span>
                <span>نتیجه و گزارش</span>
              </div>
            </div>
          </div>

          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Template Download Box */}
              <div className="bg-gradient-to-l from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                      قالب‌های استاندارد زوپیت را دانلود کنید
                    </h3>
                    <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
                      برای جلوگیری از بروز هرگونه خطا در پردازش، می‌توانید فایل پیش‌فرض آماده را با ستون‌ها، نمونه کالاها و برگه راهنمای دسته‌بندی‌های مجاز دریافت نمایید.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود قالب اکسل (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="px-4 py-2.5 bg-surface hover:bg-subtle text-text-primary border border-border-default rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-text-muted" />
                      <span>دانلود قالب CSV (فارسی)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileProcess(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 md:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? "border-primary-default bg-primary-default/5 scale-[1.01]"
                    : "border-border-default hover:border-primary-default/50 hover:bg-surface/50 bg-card"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileProcess(file);
                    e.target.value = "";
                  }}
                  accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                />

                <div className="w-20 h-20 rounded-3xl bg-primary-default/10 text-primary-default flex items-center justify-center shadow-xs">
                  <Upload className="w-10 h-10" />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <h4 className="text-base font-black text-text-primary">
                    فایل اکسل یا CSV محصولات خود را اینجا بکشید یا کلیک کنید
                  </h4>
                  <p className="text-xs text-text-muted">
                    فرمت‌های مجاز: <code className="text-primary-default font-mono">.xlsx</code> ،{" "}
                    <code className="text-primary-default font-mono">.xls</code> ،{" "}
                    <code className="text-primary-default font-mono">.csv</code> (حداکثر ۱۵ مگابایت)
                  </p>
                </div>

                <div className="mt-2 px-5 py-2 rounded-xl bg-surface border border-border-default text-xs font-bold text-text-secondary">
                  انتخاب فایل از کامپیوتر یا گوشی
                </div>
              </div>

              {/* Requirement Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border-default rounded-2xl p-5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                    ۱
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">اطلاعات الزامی</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    نام کالا، دسته‌بندی، قیمت پایه تامین‌کننده (بزرگ‌تر از صفر) و موجودی انبار الزامی می‌باشند.
                  </p>
                </div>

                <div className="bg-card border border-border-default rounded-2xl p-5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ۲
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">به‌روزرسانی با شناسه (SKU)</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    اگر در فایل کد کالا (SKU) وارد شود، می‌توانید در آینده صرفاً با بارگذاری مجدد فایل، قیمت و موجودی را به‌روزرسانی کنید.
                  </p>
                </div>

                <div className="bg-card border border-border-default rounded-2xl p-5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
                    ۳
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">تطبیق دسته‌بندی‌ها</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    دسته‌بندی‌های وارد شده در فایل باید با عناوین دسته‌بندی پلتفرم زوپیت همخوانی داشته باشند.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === "mapping" && (
            <div className="bg-card border border-border-default rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-default">
                <div>
                  <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-default" />
                    تطبیق و نگاشت ستون‌های فایل
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    فایل: <strong className="text-text-primary">{fileName}</strong> ({rawRows.length.toLocaleString("fa-IR")} ردیف اطلاعاتی یافت شد)
                  </p>
                </div>

                {/* Multi-sheet selector if multiple sheets exist */}
                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-text-secondary">انتخاب برگه (Sheet):</label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => {
                        const newSheet = e.target.value;
                        setSelectedSheet(newSheet);
                        if (workbookRef) parseSheetData(workbookRef, newSheet);
                      }}
                      className="px-3 py-1.5 bg-surface border border-border-default rounded-xl text-xs font-bold"
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-border-default text-xs leading-relaxed text-text-secondary">
                سیستم با هوشمندی ستون‌های فایل شما را بر اساس عناوین فارسی و انگلیسی تشخیص داده است. در صورت نیاز به تغییر، ستون مربوطه را در منوی آبشاری هر فیلد انتخاب نمایید.
              </div>

              {/* Mapping Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TARGET_FIELDS.map((target) => {
                  const mappedCol = columnMapping[target.key] || "";
                  const headerIdx = fileHeaders.indexOf(mappedCol);
                  const sampleValues =
                    headerIdx >= 0
                      ? rawRows
                          .slice(0, 3)
                          .map((r) => String(r[headerIdx] || ""))
                          .filter((v) => v.trim().length > 0)
                      : [];

                  return (
                    <div
                      key={target.key}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        mappedCol
                          ? "bg-card border-border-default"
                          : target.required
                          ? "bg-rose-500/5 border-rose-500/30"
                          : "bg-surface/50 border-border-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-text-primary">{target.label}</span>
                          {target.required ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 text-[10px] font-black">
                              الزامی
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-surface text-text-muted text-[10px] font-bold">
                              اختیاری
                            </span>
                          )}
                        </div>
                        {mappedCol && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-text-muted leading-tight">{target.description}</p>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary">ستون متناظر در فایل شما:</label>
                        <select
                          value={mappedCol}
                          onChange={(e) => {
                            const val = e.target.value;
                            setColumnMapping((prev) => ({
                              ...prev,
                              [target.key]: val,
                            }));
                          }}
                          className="w-full px-3 py-2 bg-background border border-border-default rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default"
                        >
                          <option value="">[انتخاب نشده]</option>
                          {fileHeaders.map((h, i) => (
                            <option key={`${h}-${i}`} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sample values preview */}
                      {sampleValues.length > 0 && (
                        <div className="text-[10px] text-text-muted bg-surface/80 p-2 rounded-xl border border-border-subtle truncate">
                          <span className="font-bold text-text-secondary">نمونه مقادیر: </span>
                          {sampleValues.join(" | ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border-default text-text-secondary hover:bg-surface text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت و انتخاب فایل دیگر</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => autoMapColumns(fileHeaders)}
                    className="px-4 py-2.5 bg-surface hover:bg-subtle text-text-secondary border border-border-default rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>نگاشت هوشمند مجدد</span>
                  </button>

                  <button
                    type="button"
                    onClick={runValidation}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>اعتبارسنجی و پیش‌نمایش</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION RESULTS */}
          {step === "preview" && (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border-default rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-text-muted font-bold">کل ردیف‌ها</span>
                  <div className="text-xl font-black text-text-primary">
                    {validatedRows.length.toLocaleString("fa-IR")}
                  </div>
                </div>

                <div className="bg-card border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">معتبر و آماده ورود</span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {validCount.toLocaleString("fa-IR")}
                  </div>
                </div>

                <div className="bg-card border border-rose-500/30 bg-rose-500/5 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">دارای خطا</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {invalidCount.toLocaleString("fa-IR")}
                  </div>
                </div>

                <div className="bg-card border border-border-default rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-text-muted font-bold">نرخ صحت اطلاعات</span>
                  <div className="text-xl font-black text-primary-default">
                    {validatedRows.length > 0
                      ? Math.round((validCount / validatedRows.length) * 100).toLocaleString("fa-IR") + "٪"
                      : "۰٪"}
                  </div>
                </div>
              </div>

              {/* Import Options Settings */}
              <div className="bg-card border border-border-default rounded-3xl p-6 space-y-4 shadow-xs">
                <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary-default" />
                  تنظیمات نحوه ورود و به‌روزرسانی اطلاعات
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duplicate Handling */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary">
                      عملیات در صورت وجود کد محصول مشابه (Duplicate SKU):
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-border-default hover:bg-surface cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="duplicateAction"
                          value="update"
                          checked={duplicateAction === "update"}
                          onChange={() => setDuplicateAction("update")}
                          className="accent-primary-default"
                        />
                        <div>
                          <strong className="text-text-primary">به‌روزرسانی محصولات موجود (پیشنهادی)</strong>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            قیمت پایه، موجودی انبار و اطلاعات کالا به‌روز خواهد شد.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl border border-border-default hover:bg-surface cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="duplicateAction"
                          value="skip"
                          checked={duplicateAction === "skip"}
                          onChange={() => setDuplicateAction("skip")}
                          className="accent-primary-default"
                        />
                        <div>
                          <strong className="text-text-primary">صرف‌نظر از ردیف‌های تکراری</strong>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            کالاهایی که کد SKU آن‌ها قبلاً در سیستم ثبت شده نادیده گرفته می‌شوند.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl border border-border-default hover:bg-surface cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="duplicateAction"
                          value="create_new"
                          checked={duplicateAction === "create_new"}
                          onChange={() => setDuplicateAction("create_new")}
                          className="accent-primary-default"
                        />
                        <div>
                          <strong className="text-text-primary">ایجاد محصول جدید با کد یکتای تصادفی</strong>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            یک شناسه جدید تولید شده و محصول به عنوان کالای مجزا ثبت می‌گردد.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Target Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary">
                      وضعیت اولیه برای محصولات جدید ایجاد شده:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-border-default hover:bg-surface cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="targetStatus"
                          value="PENDING_APPROVAL"
                          checked={targetStatus === "PENDING_APPROVAL"}
                          onChange={() => setTargetStatus("PENDING_APPROVAL")}
                          className="accent-primary-default"
                        />
                        <div>
                          <strong className="text-text-primary">در انتظار بررسی و تایید مدیر (توصیه می‌شود)</strong>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            محصول مستقیماً وارد صف بررسی کارشناسان جهت تعیین حاشیه سود زوپیت می‌شود.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl border border-border-default hover:bg-surface cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="targetStatus"
                          value="DRAFT"
                          checked={targetStatus === "DRAFT"}
                          onChange={() => setTargetStatus("DRAFT")}
                          className="accent-primary-default"
                        />
                        <div>
                          <strong className="text-text-primary">ذخیره موقت به عنوان پیش‌نویس (DRAFT)</strong>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            محصولات در پیش‌نویس‌های شما ذخیره شده و بعداً می‌توانید آن‌ها را ارسال نمایید.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Table Header with Filters */}
              <div className="bg-card border border-border-default rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewFilter("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === "all"
                          ? "bg-primary-default text-white"
                          : "bg-surface hover:bg-subtle text-text-secondary"
                      }`}
                    >
                      همه ردیف‌ها ({validatedRows.length.toLocaleString("fa-IR")})
                    </button>
                    <button
                      onClick={() => setPreviewFilter("valid")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === "valid"
                          ? "bg-emerald-600 text-white"
                          : "bg-surface hover:bg-subtle text-emerald-600"
                      }`}
                    >
                      فقط معتبرها ({validCount.toLocaleString("fa-IR")})
                    </button>
                    <button
                      onClick={() => setPreviewFilter("invalid")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === "invalid"
                          ? "bg-rose-600 text-white"
                          : "bg-surface hover:bg-subtle text-rose-600"
                      }`}
                    >
                      دارای خطا ({invalidCount.toLocaleString("fa-IR")})
                    </button>
                  </div>

                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود اکسل ردیف‌های خطا دار</span>
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="border border-border-default rounded-2xl overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-surface sticky top-0 border-b border-border-default text-text-secondary font-black z-10">
                      <tr>
                        <th className="px-3 py-3 w-12 text-center">ردیف</th>
                        <th className="px-3 py-3 w-20 text-center">وضعیت</th>
                        <th className="px-3 py-3">کد (SKU)</th>
                        <th className="px-3 py-3 min-w-[180px]">نام محصول</th>
                        <th className="px-3 py-3">دسته‌بندی</th>
                        <th className="px-3 py-3">قیمت پایه (تومان)</th>
                        <th className="px-3 py-3 text-center">موجودی</th>
                        <th className="px-3 py-3 min-w-[200px]">پیام‌ها / خطاها</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-card">
                      {filteredPreviewRows.slice(0, 100).map((row) => (
                        <tr
                          key={row.rowNum}
                          className={`hover:bg-surface/50 transition-colors ${
                            !row.isValid ? "bg-rose-500/5" : ""
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center text-text-muted font-mono">{row.rowNum}</td>
                          <td className="px-3 py-2.5 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3" /> صحیح
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
                                <X className="w-3 h-3" /> دارای خطا
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-text-secondary">
                            {row.data.sku || "—"}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-text-primary">{row.data.name || "—"}</td>
                          <td className="px-3 py-2.5 text-text-secondary">{row.data.category || "—"}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-text-primary">
                            {typeof row.data.supplierBasePrice === "number"
                              ? row.data.supplierBasePrice.toLocaleString("fa-IR")
                              : row.data.supplierBasePrice || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold">
                            {typeof row.data.inventory === "number"
                              ? row.data.inventory.toLocaleString("fa-IR")
                              : row.data.inventory || "۰"}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.errors.length > 0 ? (
                              <div className="space-y-1">
                                {row.errors.map((err, i) => (
                                  <div key={i} className="text-rose-600 text-[10px] leading-tight">
                                    • {err.message}
                                  </div>
                                ))}
                              </div>
                            ) : row.warnings.length > 0 ? (
                              <div className="space-y-1">
                                {row.warnings.map((w, i) => (
                                  <div key={i} className="text-amber-600 text-[10px] leading-tight">
                                    • {w.message}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted">بدون خطا</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredPreviewRows.length > 100 && (
                  <p className="text-[11px] text-text-muted text-center">
                    نمایش ۱۰۰ ردیف اول از میان {filteredPreviewRows.length.toLocaleString("fa-IR")} ردیف
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("mapping")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border-default text-text-secondary hover:bg-surface text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>اصلاح نگاشت ستون‌ها</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {invalidCount > 0 && validCount > 0 && (
                    <span className="text-xs text-amber-600 font-bold hidden md:inline">
                      ({validCount.toLocaleString("fa-IR")} ردیف معتبر وارد خواهد شد و ردیف‌های خطا نادیده گرفته می‌شوند)
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={validCount === 0}
                    onClick={handleExecuteImport}
                    className="flex-1 sm:flex-none px-7 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>تایید نهایی و شروع ورود {validCount.toLocaleString("fa-IR")} کالا</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORTING IN PROGRESS */}
          {step === "importing" && (
            <div className="bg-card border border-border-default rounded-3xl p-12 text-center space-y-6 shadow-xs max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-text-primary">در حال پردازش و ثبت کالاها...</h3>
                <p className="text-xs text-text-muted">
                  ردیف‌های معتبر به صورت بسته‌های ۵۰ تایی با دقت اعتبارسنجی و ذخیره می‌شوند. لطفاً از بستن این برگه خودداری فرمایید.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-surface border border-border-default rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary-default h-full transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-muted font-bold">
                  <span>
                    بسته {importProgress.currentBatch.toLocaleString("fa-IR")} از {importProgress.totalBatches.toLocaleString("fa-IR")}
                  </span>
                  <span>{importProgress.percentage.toLocaleString("fa-IR")}٪</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: RESULT & FINAL REPORT */}
          {step === "result" && (
            <div className="space-y-6">
              <div className="bg-card border border-border-default rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
                <div className="flex items-center gap-3 pb-6 border-b border-border-default">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-text-primary">عملیات ورود اطلاعات تکمیل گردید</h3>
                    <p className="text-xs text-text-muted">
                      گزارش نهایی پردازش اقلام فایل <strong className="text-text-primary">{fileName}</strong>
                    </p>
                  </div>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-surface border border-border-default space-y-1">
                    <span className="text-xs text-text-muted font-bold">کل اقلام ارسالی</span>
                    <div className="text-xl font-black text-text-primary">
                      {importResult.total.toLocaleString("fa-IR")}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 space-y-1">
                    <span className="text-xs font-bold">کالاهای جدید ثبت‌شده</span>
                    <div className="text-xl font-black">
                      {importResult.createdCount.toLocaleString("fa-IR")}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 space-y-1">
                    <span className="text-xs font-bold">کالاهای به‌روزرسانی‌شده</span>
                    <div className="text-xl font-black">
                      {importResult.updatedCount.toLocaleString("fa-IR")}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 space-y-1">
                    <span className="text-xs font-bold">تکراری / رد شده</span>
                    <div className="text-xl font-black">
                      {importResult.skippedCount.toLocaleString("fa-IR")}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 space-y-1">
                    <span className="text-xs font-bold">خطاها</span>
                    <div className="text-xl font-black">
                      {importResult.errorsCount.toLocaleString("fa-IR")}
                    </div>
                  </div>
                </div>

                {/* Notice on Approval */}
                <div className="p-4 rounded-2xl bg-primary-default/5 border border-primary-default/20 text-xs text-primary-default leading-relaxed flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    محصولات جدید ایجاد شده با وضعیت <strong>«در انتظار تایید»</strong> در کاتالوگ شما قرار گرفته‌اند. تیم بررسی زوپیت طی ساعات آینده حاشیه سود پلتفرم را تعیین و وضعیت را به منتشرشده تغییر خواهد داد.
                  </div>
                </div>

                {/* Error details if any */}
                {importResult.errors.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border-default">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        موارد دارای خطا در ثبت:
                      </h4>
                      <button
                        type="button"
                        onClick={handleDownloadErrorReport}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود فایل اکسل ردیف‌های ناموفق</span>
                      </button>
                    </div>

                    <div className="border border-border-default rounded-2xl overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-surface sticky top-0 text-text-secondary font-bold">
                          <tr>
                            <th className="px-3 py-2 w-16 text-center">ردیف</th>
                            <th className="px-3 py-2">ستون</th>
                            <th className="px-3 py-2">نام کالا</th>
                            <th className="px-3 py-2">شرح خطا</th>
                            <th className="px-3 py-2">راهکار اصلاح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle bg-card">
                          {importResult.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-surface/50">
                              <td className="px-3 py-2 text-center text-text-muted font-mono">{err.row || "-"}</td>
                              <td className="px-3 py-2 font-bold text-text-secondary">{err.column || "-"}</td>
                              <td className="px-3 py-2 font-bold text-text-primary">{err.name || "-"}</td>
                              <td className="px-3 py-2 text-rose-600">{err.error}</td>
                              <td className="px-3 py-2 text-text-muted text-[11px]">{err.suggestion || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Final Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-border-default">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("upload");
                      setFileName("");
                      setRawRows([]);
                      setValidatedRows([]);
                      setColumnMapping({});
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border-default text-text-secondary hover:bg-surface text-xs font-bold transition-all cursor-pointer"
                  >
                    بارگذاری فایل اکسل جدید
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSuccess) onSuccess();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>مشاهده محصولات در کاتالوگ من</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: IMPORT HISTORY */}
      {activeSubTab === "history" && (
        <div className="bg-card border border-border-default rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-border-default">
            <div>
              <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-default" />
                سوابق بارگذاری و ورودهای دسته‌جمعی شما
              </h3>
              <p className="text-xs text-text-muted mt-1">
                مشاهده وضعیت، تاریخ و آمار پردازش فایل‌های اکسل و CSV قبلی
              </p>
            </div>
            <button
              onClick={fetchImportHistory}
              disabled={isLoadingHistory}
              className="px-3.5 py-2 bg-surface hover:bg-subtle text-text-secondary border border-border-default rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
              <span>تازه‌سازی</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center space-y-2 text-text-muted text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-default" />
              <span>در حال دریافت سوابق...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto text-text-muted border border-border-default">
                <FileSpreadsheet className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">هنوز فایلی بارگذاری نشده است</h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                هر زمان که فایلی برای ثبت دسته‌جمعی محصولات ارسال کنید، تاریخچه و گزارش پردازش آن در این بخش ثبت می‌گردد.
              </p>
              <button
                onClick={() => setActiveSubTab("import")}
                className="px-4 py-2 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                شروع اولین ورود فایل
              </button>
            </div>
          ) : (
            <div className="border border-border-default rounded-2xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface border-b border-border-default text-text-secondary font-black">
                  <tr>
                    <th className="px-4 py-3">نام فایل</th>
                    <th className="px-4 py-3">تاریخ و ساعت</th>
                    <th className="px-4 py-3 text-center">کل اقلام</th>
                    <th className="px-4 py-3 text-center">ایجاد شده</th>
                    <th className="px-4 py-3 text-center">به‌روزرسانی</th>
                    <th className="px-4 py-3 text-center">رد شده</th>
                    <th className="px-4 py-3 text-center">خطا</th>
                    <th className="px-4 py-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-card">
                  {historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-text-primary flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{item.fileName}</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("fa-IR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono">
                        {item.totalRows?.toLocaleString("fa-IR") || "۰"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono text-emerald-600">
                        {item.importedCount?.toLocaleString("fa-IR") || "۰"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono text-blue-600">
                        {item.updatedCount?.toLocaleString("fa-IR") || "۰"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono text-amber-600">
                        {item.skippedCount?.toLocaleString("fa-IR") || "۰"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono text-rose-600">
                        {item.errorCount?.toLocaleString("fa-IR") || "۰"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {item.status === "COMPLETED" ? "تکمیل شده" : "دارای خطا"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
