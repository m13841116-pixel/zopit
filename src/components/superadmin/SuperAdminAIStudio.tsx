import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Check,
  RefreshCw,
  Code,
  Palette,
  Sliders,
  Settings,
  X,
  FileCode,
  Shield,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Paperclip,
  FileImage
} from "lucide-react";
import { toast } from "../GlobalToast";
import {
  getAppliedAIStudioChanges,
  applyAIStudioChanges,
  clearAIStudioChanges,
  saveDraftAIStudioChanges,
  getDraftAIStudioChanges,
  AIStudioChanges
} from "../../utils/aiStudioTheme";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  model?: string;
  proposedChanges?: {
    explanation?: string;
    customCss?: string;
    announcementBanner?: any;
    uiTheme?: any;
    codeSnippet?: string;
  };
}

export default function SuperAdminAIStudio() {
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");
  const [systemInstruction, setSystemInstruction] = useState<string>(
    "شما دستیار هوشمند، طراح و برنامه‌نویس توسعه‌دهنده زوپیت هستید. کدهای CSS و تغییرات ظاهری را دقیق ارائه دهید."
  );
  const [showSystemModal, setShowSystemModal] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast("حداکثر حجم فایل مجاز ۵ مگابایت می‌باشد.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const commaIdx = base64String.indexOf(",");
      const rawBase64 = commaIdx !== -1 ? base64String.substring(commaIdx + 1) : base64String;

      setAttachedFile({
        name: file.name,
        mimeType: file.type || "image/png",
        data: rawBase64
      });
      toast("📎 فایل با موفقیت ضمیمه گردید.", "success");
    };
    reader.readAsDataURL(file);
  };

  // Chat conversation
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "ai",
      text: "سلام مدیر گرامی! به پنل اختصاصی گوگل AI استودیو خوش آمدید. من آماده‌ام تا طبق دستورات شما، استایل، رنگ‌بندی، بنرها و پوسته ظاهر سایت زوپیت را بصورت زنده تغییر دهم. هر تغییری که بخواهید را بگویید تا پیش‌نمایش آن آماده شود و پس از تایید شما، بدون هیچ دستیابی به دیتابیس روی سایت اعمال گردد.",
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  // Preview & Applied State
  const [activeDraft, setActiveDraft] = useState<AIStudioChanges | null>(getDraftAIStudioChanges());
  const [appliedChanges, setAppliedChanges] = useState<AIStudioChanges | null>(getAppliedAIStudioChanges());
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Listen to AI Studio custom events to keep UI in sync
  useEffect(() => {
    const handleUpdated = (e: any) => {
      setAppliedChanges(e.detail);
      setPreviewKey((prev) => prev + 1);
    };
    window.addEventListener("zopit_aistudio_updated", handleUpdated);
    return () => window.removeEventListener("zopit_aistudio_updated", handleUpdated);
  }, []);

  const handleSendPrompt = async (textToSend?: string) => {
    const finalPrompt = (textToSend || promptInput).trim();
    if (!finalPrompt) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: attachedFile 
        ? `${finalPrompt}\n\n📎 [ضمیمه: ${attachedFile.name}]`
        : finalPrompt,
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput("");
    setLoading(true);

    // Keep reference to attached file and clear it immediately from the UI input
    const fileToSend = attachedFile;
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      const token = localStorage.getItem("token") || "";
      const currentCss = activeDraft?.customCss || appliedChanges?.customCss || "";

      const res = await fetch("/api/superadmin/ai-studio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: selectedModel,
          systemInstruction,
          currentCss,
          imageFile: fileToSend
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const aiResult = data.aiResult || {};
        const explanation = aiResult.explanation || data.responseText || "تغییرات درخواستی آماده شد.";

        const proposed: AIStudioChanges = {
          customCss: aiResult.customCss || "",
          announcementBanner: aiResult.announcementBanner || null,
          uiTheme: aiResult.uiTheme || null,
          promptSummary: finalPrompt
        };

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: explanation,
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
          model: data.model,
          proposedChanges: {
            explanation: aiResult.explanation,
            customCss: aiResult.customCss,
            announcementBanner: aiResult.announcementBanner,
            uiTheme: aiResult.uiTheme,
            codeSnippet: aiResult.codeSnippet
          }
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Auto update draft for live preview
        if (proposed.customCss || proposed.announcementBanner) {
          setActiveDraft(proposed);
          saveDraftAIStudioChanges(proposed);
          toast("پیش‌نمایش تغییرات هوش مصنوعی در کادر سمت چپ آماده گردید.", "info");
        }
      } else {
        throw new Error(data.error || "خطا در پاسخ‌دهی گوگل AI استودیو");
      }
    } catch (err: any) {
      console.error("AI Studio send error:", err);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ خطا: ${err.message || "امکان برقراری ارتباط با سرویس هوش مصنوعی وجود ندارد."}`,
        timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
      toast(err.message || "خطا در دریافت پاسخ AI", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewChanges = (customChanges?: AIStudioChanges) => {
    const targetChanges = customChanges || activeDraft || {
      customCss: messages[messages.length - 1]?.proposedChanges?.customCss || "",
      announcementBanner: messages[messages.length - 1]?.proposedChanges?.announcementBanner,
      uiTheme: messages[messages.length - 1]?.proposedChanges?.uiTheme,
      promptSummary: "پیش‌نویس تغییرات هوش مصنوعی"
    };

    if (!targetChanges.customCss && !targetChanges.announcementBanner) {
      toast("هیچ تغییر جدیدی برای پیش‌نمایش وجود ندارد.", "error");
      return;
    }

    setActiveDraft(targetChanges);
    saveDraftAIStudioChanges(targetChanges);
    setPreviewKey((prev) => prev + 1);
    toast("✨ پیش‌نمایش تغییرات با موفقیت بارگذاری شد (بدون اعمال نهایی روی سایت).", "success");
  };

  const handleApplyChanges = (customChanges?: AIStudioChanges) => {
    const targetChanges = customChanges || activeDraft || {
      customCss: messages[messages.length - 1]?.proposedChanges?.customCss || "",
      announcementBanner: messages[messages.length - 1]?.proposedChanges?.announcementBanner,
      uiTheme: messages[messages.length - 1]?.proposedChanges?.uiTheme,
      promptSummary: "تغییرات تایید شده هوش مصنوعی"
    };

    if (!targetChanges.customCss && !targetChanges.announcementBanner) {
      toast("هیچ تغییری برای اعمال وجود ندارد.", "error");
      return;
    }

    applyAIStudioChanges(targetChanges);
    setAppliedChanges(targetChanges);
    setPreviewKey((prev) => prev + 1);

    toast("✅ تغییرات با موفقیت روی پوسته اصلی سایت اعمال گردید (دیتابیس دست‌نخورده ماند).", "success");
  };

  const handleResetTheme = () => {
    clearAIStudioChanges();
    setActiveDraft(null);
    setAppliedChanges(null);
    setPreviewKey((prev) => prev + 1);
    toast("تغییرات سفارشی AI پاکسازی شد و پوسته به حالت اولیه بازگشت.", "info");
  };

  const quickPrompts = [
    "🎨 تم بنفش ارغوانی مدرن و جذاب برای دکمه‌ها و هدر",
    "📢 افزودن بنر قرمز اعلان ارسال رایگان سفارشات بالادستی",
    "📱 گرد کردن حاشیه‌های کارت محصولات تا ۱۸ پیکسل",
    "✨ استایل تاریک لوکس و مدرن با پس‌زمینه زغالی",
    "🛍️ برجسته‌سازی دکمه‌های خرید و تسویه‌حساب"
  ];

  return (
    <div
      className={`space-y-4 animate-fade-in transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-[100] bg-background p-4 md:p-6 overflow-hidden flex flex-col h-screen w-screen"
          : "pb-10"
      }`}
      dir="rtl"
    >
      {/* Top Header Panel */}
      <div className="bg-card border border-border-subtle rounded-3xl p-4 md:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-primary">پنل زنده گوگل AI استودیو (Google AI Studio)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold">
                PRO AI ENGINE
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              توسعه و اعمال تغییرات ظاهری و پوسته سایت بصورت زنده با API هوش مصنوعی گوگل (بدون دستکاری دیتابیس)
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-2xl text-xs font-bold transition-all border border-purple-500/20 flex items-center gap-1.5 cursor-pointer"
            title={isFullscreen ? "خروج از تمام‌صفحه" : "حالت تمام‌صفحه"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? "خروج از تمام صفحه" : "تمام صفحه"}</span>
          </button>

          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-2xl border border-subtle">
            <Code className="w-4 h-4 text-purple-500" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (سریع & بهینه)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (پیشرفته & هوشمند)</option>
            </select>
          </div>

          {/* System Instruction Button */}
          <button
            type="button"
            onClick={() => setShowSystemModal(true)}
            className="px-3 py-2 bg-surface hover:bg-subtle text-secondary rounded-2xl text-xs font-bold transition-all border border-subtle flex items-center gap-1.5"
            title="دستورالعمل سیستم (System Instruction)"
          >
            <Sliders className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">تنظیم دستورالعمل AI</span>
          </button>

          {/* Preview Changes Action */}
          <button
            type="button"
            onClick={() => handlePreviewChanges()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/10 transition-all flex items-center gap-2 cursor-pointer border border-purple-500/20"
          >
            <Eye className="w-4 h-4" />
            <span>پیش‌نمایش درخواست</span>
          </button>

          {/* Apply Changes Primary Action */}
          <button
            type="button"
            onClick={() => handleApplyChanges()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>اعمال تغییرات (بدون تغییر در دیتابیس)</span>
          </button>
        </div>
      </div>

      {/* Main Split View Grid (Left: Chat & Controls, Right: Live Preview) */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${
          isFullscreen ? "flex-1 min-h-0 overflow-hidden" : "h-[740px]"
        }`}
      >
        {/* Left Column: AI Conversation & Prompts (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border-subtle rounded-3xl flex flex-col overflow-hidden shadow-xl">
          {/* Chat Console Header */}
          <div className="p-4 bg-surface border-b border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-black text-primary">کنسول گفتگو و دستورات</span>
            </div>
            <span className="text-[10px] text-muted font-mono">
              {messages.length - 1} دستور صادر شده
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl space-y-2 ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-br-none shadow-md"
                      : "bg-surface border border-subtle text-primary rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1 text-[10px] opacity-80">
                    <span className="font-bold flex items-center gap-1">
                      {msg.sender === "user" ? "مدیر کل (شما)" : "گوگل AI استودیو"}
                    </span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-line text-justify">{msg.text}</p>

                  {/* Proposed Changes Preview Badge inside message */}
                  {msg.proposedChanges?.customCss && (
                    <div className="mt-2 pt-2 border-t border-purple-500/20 bg-purple-500/10 p-2.5 rounded-xl text-[11px] space-y-2">
                      <div className="flex items-center justify-between font-bold text-purple-600 dark:text-purple-400">
                        <span className="flex items-center gap-1">
                          <Palette className="w-3.5 h-3.5" /> استایل پیشنهادی آماده است
                        </span>
                        <span className="font-mono text-[10px]">
                          {msg.proposedChanges.customCss.length} کاراکتر CSS
                        </span>
                      </div>
                      <p className="text-muted text-[10px]">
                        می‌توانید ابتدا پیش‌نمایش این درخواست را مشاهده کرده و سپس در صورت تمایل آن را به صورت زنده روی سایت اعمال کنید.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handlePreviewChanges({
                            customCss: msg.proposedChanges?.customCss || "",
                            announcementBanner: msg.proposedChanges?.announcementBanner || null,
                            uiTheme: msg.proposedChanges?.uiTheme || null,
                            promptSummary: msg.text.substring(0, 30)
                          })}
                          className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>پیش‌نمایش درخواست</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyChanges({
                            customCss: msg.proposedChanges?.customCss || "",
                            announcementBanner: msg.proposedChanges?.announcementBanner || null,
                            uiTheme: msg.proposedChanges?.uiTheme || null,
                            promptSummary: msg.text.substring(0, 30)
                          })}
                          className="px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>اعمال تغییرات (بدون دیتابیس)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-end">
                <div className="bg-surface border border-subtle p-3.5 rounded-2xl rounded-bl-none flex items-center gap-2 text-muted">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                  <span className="font-bold">گوگل AI استودیو در حال پردازش دستور شماست...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="p-3 bg-surface/50 border-t border-subtle overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
            <span className="text-[10px] text-muted font-bold shrink-0">پیشنهاد سریع:</span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPrompt(qp)}
                disabled={loading}
                className="px-2.5 py-1 bg-background hover:bg-purple-500/10 hover:text-purple-600 text-muted border border-subtle rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Prompt Input Box */}
          <div className="p-3 bg-card border-t border-subtle flex flex-col gap-2">
            {attachedFile && (
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-xs text-purple-700 dark:text-purple-300">
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  <span className="font-mono text-[11px] truncate max-w-[200px]">{attachedFile.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAttachedFile(null)}
                  className="p-1 hover:bg-purple-500/20 rounded-full transition-all text-purple-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-11 h-11 bg-surface hover:bg-subtle text-secondary rounded-2xl flex items-center justify-center shrink-0 transition-all border border-subtle cursor-pointer disabled:opacity-50"
                title="ضمیمه کردن تصویر یا فایل"
              >
                <Paperclip className="w-5 h-5 text-purple-500" />
              </button>

              <textarea
                rows={2}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder={attachedFile ? "دستوری برای تصویر ضمیمه‌شده وارد کنید..." : "دستور خود را برای هوش مصنوعی بنویسید (مثلاً: رنگ دکمه‌ها را سبز و حاشیه‌ها را گرد کن)..."}
                className="flex-1 px-3.5 py-2.5 bg-background border border-subtle rounded-2xl text-xs text-primary focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />

              <button
                type="button"
                onClick={() => handleSendPrompt()}
                disabled={loading || (!promptInput.trim() && !attachedFile)}
                className="w-11 h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Store Preview (7 cols) */}
        <div className="lg:col-span-7 bg-card border border-border-subtle rounded-3xl flex flex-col overflow-hidden shadow-xl">
          {/* Live Preview Header Toolbar */}
          <div className="p-3.5 bg-surface border-b border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black text-primary">پیش‌نمایش زنده تغییرات بر روی سایت</span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-subtle">
              <button
                onClick={() => setDeviceView("desktop")}
                className={`p-1.5 rounded-lg transition-all ${
                  deviceView === "desktop" ? "bg-purple-600 text-white" : "text-muted hover:text-primary"
                }`}
                title="نمایش دسکتاپ"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceView("tablet")}
                className={`p-1.5 rounded-lg transition-all ${
                  deviceView === "tablet" ? "bg-purple-600 text-white" : "text-muted hover:text-primary"
                }`}
                title="نمایش تبلت"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceView("mobile")}
                className={`p-1.5 rounded-lg transition-all ${
                  deviceView === "mobile" ? "bg-purple-600 text-white" : "text-muted hover:text-primary"
                }`}
                title="نمایش موبایل"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewKey((prev) => prev + 1)}
                className="p-1.5 bg-background text-muted hover:text-primary rounded-xl border border-subtle"
                title="بازنشانی پیش‌نمایش"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {appliedChanges && (
                <button
                  type="button"
                  onClick={handleResetTheme}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-rose-500/20"
                >
                  بازگشت به پوسته پیش‌فرض
                </button>
              )}
            </div>
          </div>

          {/* Active Banner Preview Alert */}
          {(activeDraft?.announcementBanner?.enabled || appliedChanges?.announcementBanner?.enabled) && (
            <div
              className="px-4 py-2 text-xs font-bold text-center transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor:
                  activeDraft?.announcementBanner?.bgColor || appliedChanges?.announcementBanner?.bgColor || "#7c3aed",
                color: activeDraft?.announcementBanner?.textColor || appliedChanges?.announcementBanner?.textColor || "#ffffff"
              }}
            >
              <Sparkles className="w-4 h-4 animate-bounce" />
              <span>
                {activeDraft?.announcementBanner?.text || appliedChanges?.announcementBanner?.text}
              </span>
            </div>
          )}

          {/* Live Preview Iframe Container */}
          <div className="flex-1 bg-slate-950/20 flex items-center justify-center p-4 overflow-hidden relative">
            <div
              className={`h-full bg-background rounded-2xl overflow-hidden border border-subtle shadow-2xl transition-all duration-300 relative ${
                deviceView === "desktop"
                  ? "w-full"
                  : deviceView === "tablet"
                  ? "w-[680px]"
                  : "w-[375px]"
              }`}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                src="/"
                title="Live Website Preview"
                className="w-full h-full border-none"
                onLoad={() => {
                  // Inject draft/applied CSS into iframe on load
                  try {
                    const doc = iframeRef.current?.contentDocument;
                    if (doc) {
                      const cssToInject = activeDraft?.customCss || appliedChanges?.customCss || "";
                      let styleEl = doc.getElementById("zopit-aistudio-styles") as HTMLStyleElement;
                      if (!styleEl) {
                        styleEl = doc.createElement("style");
                        styleEl.id = "zopit-aistudio-styles";
                        doc.head.appendChild(styleEl);
                      }
                      styleEl.textContent = cssToInject;
                    }
                  } catch (err) {
                    console.error("Iframe style injection warning:", err);
                  }
                }}
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="p-3 bg-surface border-t border-subtle flex items-center justify-between text-[11px] text-muted">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>حالت امن: دیتابیس اصلی دست‌نخورده باقی می‌ماند.</span>
            </div>
            {appliedChanges?.appliedAt && (
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                تغییرات فعال است ({new Date(appliedChanges.appliedAt).toLocaleTimeString("fa-IR")})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SYSTEM INSTRUCTIONS MODAL */}
      {showSystemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-subtle rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="text-base font-black text-primary flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-500" />
                <span>تنظیم دستورالعمل اولیه هوش مصنوعی (System Instruction)</span>
              </h3>
              <button
                onClick={() => setShowSystemModal(false)}
                className="text-muted hover:text-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              دستورالعمل سیستم به گوگل AI استودیو مشخص می‌کند که چه نوع رفتار، لحن و چارچوبی در پاسخ‌دهی داشته باشد.
            </p>

            <textarea
              rows={5}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-subtle rounded-2xl text-xs text-primary leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                onClick={() => setShowSystemModal(false)}
                className="px-5 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-all"
              >
                ذخیره دستورالعمل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
