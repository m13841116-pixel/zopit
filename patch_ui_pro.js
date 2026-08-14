const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

// Replace the proFeaturesList
const featuresOld = `const proFeaturesList = [
    {
      id: 1,
      title: "دامنه رایگان اختصاصی (.ir)",
      desc: "یک دامنه ملی رایگان جهت برندسازی و اعتبار وب‌سایت فروشگاه شما",
      value: "100,000 تومان",
      icon: Globe,
      color: "from-blue-500/20 to-blue-600/5 text-blue-500"
    },
    {
      id: 2,
      title: "قالب آماده حرفه‌ای وردپرس (وودمارت / WoodMart)",
      desc: "طراحی کاملا سفارشی‌سازی شده، آماده فروش و واکنش‌گرا (مخصوص فروشگاهی)",
      value: "2,000,000 تومان",
      icon: LayoutDashboardIcon,
      color: "from-purple-500/20 to-purple-600/5 text-purple-500"
    },
    {
      id: 3,
      title: "هاست رایگان ۱ ماهه ابری",
      desc: "میزبانی پرسرعت اختصاصی برای بارگذاری اولیه بدون دغدغه فنی",
      value: "500,000 تومان",
      icon: Server,
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-500"
    },
    {
      id: 4,
      title: "پنل اختصاصی لجستیک و پست",
      desc: "مدیریت خودکار ثبت سفارشات پستی، چاپ فاکتور و شناسه مرسولات",
      value: "998,000 تومان",
      icon: PackageCheck,
      color: "from-amber-500/20 to-amber-600/5 text-amber-500"
    },
    {
      id: 5,
      title: "راه‌اندازی درگاه، پرونده مالیاتی و آموزش کامل",
      desc: "قابلیت انجام کامل توسط تیم فنی زوپیت یا ارسال دوره‌های ویدئویی آموزشی (به انتخاب شما)",
      value: "1,500,000 تومان",
      icon: CreditCard,
      color: "from-pink-500/20 to-pink-600/5 text-pink-500"
    },
    {
      id: 6,
      title: "افزونه‌های ۱۰۰٪ رایگان و کاربردی وردپرس",
      desc: "پکیج کامل افزونه‌های ضروری امنیت، سئو، پیامک و بهینه‌سازی سرعت",
      value: "1,200,000 تومان",
      icon: Puzzle,
      color: "from-cyan-500/20 to-cyan-600/5 text-cyan-500"
    },
    {
      id: 7,
      title: "اتصال به موتورهای جستجوی کالا (ترب و ایمالز)",
      desc: "اتصال به یکی از قوی‌ترین کانال‌های جذب مشتری و افزایش فوری فروش آنلاین",
      value: "750,000 تومان",
      icon: TrendingUp,
      color: "from-indigo-500/20 to-indigo-600/5 text-indigo-500"
    },
    {
      id: 8,
      title: "دسترسی رایگان به استارتاپ‌های آینده زوپیت",
      desc: "عضویت ویژه و دسترسی بدون هزینه به تمامی سرویس‌ها و ابزارهای جدید آتی مجموعه",
      value: "1,500,000 تومان",
      icon: Sparkles,
      color: "from-violet-500/20 to-violet-600/5 text-violet-500"
    }
  ];`;

const featuresNew = `const proFeaturesList = [
    {
      id: 1,
      title: "دامنه رایگان اختصاصی (.ir)",
      desc: "یک دامنه ملی رایگان جهت برندسازی و اعتبار وب‌سایت فروشگاه شما",
      value: "200,000 تومان",
      icon: Globe,
      color: "from-blue-500/20 to-blue-600/5 text-blue-500"
    },
    {
      id: 2,
      title: "قالب آماده حرفه‌ای وردپرس (وودمارت / WoodMart)",
      desc: "طراحی کاملا سفارشی‌سازی شده، آماده فروش و واکنش‌گرا (مخصوص فروشگاهی)",
      value: "2,500,000 تومان",
      icon: Crown,
      color: "from-purple-500/20 to-purple-600/5 text-purple-500"
    },
    {
      id: 3,
      title: "هاست رایگان ۱ ماهه ابری",
      desc: "میزبانی پرسرعت اختصاصی برای بارگذاری اولیه بدون دغدغه فنی",
      value: "500,000 تومان",
      icon: Server,
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-500"
    },
    {
      id: 4,
      title: "پنل اختصاصی لجستیک و پست",
      desc: "مدیریت خودکار ثبت سفارشات پستی، چاپ فاکتور و شناسه مرسولات",
      value: "950,000 تومان",
      icon: PackageCheck,
      color: "from-amber-500/20 to-amber-600/5 text-amber-500"
    },
    {
      id: 5,
      title: "راه‌اندازی درگاه، پرونده مالیاتی و آموزش کامل",
      desc: "قابلیت انجام کامل توسط تیم فنی زوپیت یا ارسال دوره‌های ویدئویی آموزشی (به انتخاب شما)",
      value: "1,800,000 تومان",
      icon: CreditCard,
      color: "from-pink-500/20 to-pink-600/5 text-pink-500"
    },
    {
      id: 6,
      title: "افزونه‌های ۱۰۰٪ رایگان و کاربردی وردپرس",
      desc: "پکیج کامل افزونه‌های ضروری امنیت، سئو، پیامک و بهینه‌سازی سرعت",
      value: "1,250,000 تومان",
      icon: Puzzle,
      color: "from-cyan-500/20 to-cyan-600/5 text-cyan-500"
    },
    {
      id: 7,
      title: "اتصال به موتورهای جستجوی کالا (ترب و ایمالز)",
      desc: "اتصال به یکی از قوی‌ترین کانال‌های جذب مشتری و افزایش فوری فروش آنلاین",
      value: "800,000 تومان",
      icon: TrendingUp,
      color: "from-indigo-500/20 to-indigo-600/5 text-indigo-500"
    },
    {
      id: 8,
      title: "دسترسی رایگان به استارتاپ‌های آینده زوپیت",
      desc: "عضویت ویژه و دسترسی بدون هزینه به تمامی سرویس‌ها و ابزارهای جدید آتی مجموعه",
      value: "1,500,000 تومان",
      icon: Sparkles,
      color: "from-violet-500/20 to-violet-600/5 text-violet-500"
    }
  ];`;
  
code = code.replace(featuresOld, featuresNew);
code = code.replace(/<div className="text-sm text-slate-400 line-through font-mono decoration-rose-500 decoration-2">\s*۸,۵۴۸,۰۰۰ تومان\s*<\/div>/g, 
  `<div className="text-lg text-emerald-400 font-mono font-bold">
    ۹,۵۰۰,۰۰۰ تومان
  </div>`);

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
