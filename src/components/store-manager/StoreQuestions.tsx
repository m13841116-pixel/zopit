import React, { useState, useEffect } from "react";
import { MessageSquare, HelpCircle, Check, Loader2, Send } from "lucide-react";
import { toast } from "../GlobalToast";

interface StoreQuestionsProps {
  onUnansweredCountChange?: (count: number) => void;
}

export default function StoreQuestions({ onUnansweredCountChange }: StoreQuestionsProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("unanswered");
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/store-manager/questions", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
        
        // Count unanswered questions and update parent dashboard badge
        const unansweredCount = data.filter((q: any) => !q.isAnswered).length;
        if (onUnansweredCountChange) {
          onUnansweredCountChange(unansweredCount);
        }
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswerSubmit = async (questionId: number) => {
    if (!answerText.trim()) {
      toast("لطفاً متن پاسخ را وارد کنید.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/store-manager/questions/${questionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({ answerText: answerText.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast("پاسخ شما با موفقیت ثبت شد", "success");
        setAnsweringId(null);
        setAnswerText("");
        fetchQuestions();
      } else {
        toast(data.error || "خطا در ثبت پاسخ", "error");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      toast("خطای شبکه در ثبت پاسخ", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === "unanswered") return !q.isAnswered;
    if (filter === "answered") return q.isAnswered;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Filters & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-2xl border border-border-subtle shadow-sm">
        <div>
          <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-default" /> سوالات مشتریان
          </h3>
          <p className="text-xs text-text-muted mt-1">
            سوالات خریداران درباره محصولات خود را مشاهده و پاسخ دهید تا در ویترین شما نمایش داده شوند.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border-default self-start sm:self-auto">
          <button
            onClick={() => setFilter("unanswered")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "unanswered"
                ? "bg-primary-default text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            بی‌پاسخ ({questions.filter(q => !q.isAnswered).length})
          </button>
          <button
            onClick={() => setFilter("answered")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "answered"
                ? "bg-primary-default text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            پاسخ‌داده‌شده ({questions.filter(q => q.isAnswered).length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-primary-default text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            همه سوالات ({questions.length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-border-subtle shadow-sm">
          <Loader2 className="w-8 h-8 text-primary-default animate-spin mb-4" />
          <span className="text-xs text-text-muted font-bold">در حال بارگذاری سوالات...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border-subtle shadow-sm">
          <HelpCircle className="w-14 h-14 text-text-muted/40 mb-4" />
          <h4 className="text-base font-black text-text-primary mb-1">
            {filter === "unanswered" ? "هیچ سوال بی‌پاسخی یافت نشد" : "هیچ سوالی یافت نشد"}
          </h4>
          <p className="text-xs text-text-muted">
            {filter === "unanswered"
              ? "آفرین! به تمامی سوالات مشتریان پاسخ داده‌اید."
              : "هنوز سوالی برای محصولات شما ثبت نشده است."}
          </p>
        </div>
      ) : (
        /* Questions List */
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-4 hover:border-primary-default/20 transition-all"
            >
              {/* Product and asker info */}
              <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-border-default overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {q.product?.images?.[0]?.url ? (
                      <img
                        src={q.product.images[0].url}
                        alt={q.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-text-primary leading-tight">
                      {q.product?.name}
                    </h4>
                    <span className="text-[10px] text-text-muted mt-1 inline-block">
                      طرح شده توسط: <strong className="text-primary-default">{q.askerName || "کاربر ناشناس"}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] text-text-muted font-mono font-bold">
                    {new Date(q.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-surface/50 p-4 rounded-xl border border-border-default">
                <p className="text-xs font-bold text-text-primary leading-relaxed">
                  ❓ {q.questionText}
                </p>
              </div>

              {/* Answer View / Form */}
              {q.isAnswered ? (
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-500 text-xs font-black">✔️ پاسخ ثبت شده شما:</span>
                    {q.answeredAt && (
                      <span className="text-[9px] text-text-muted font-mono">
                        {new Date(q.answeredAt).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-bold">
                    {q.answerText}
                  </p>
                  
                  {/* Option to re-answer */}
                  {answeringId === q.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="پاسخ جدید خود را بنویسید..."
                        className="w-full bg-surface border border-border-default rounded-xl p-3 text-xs text-text-primary outline-none focus:border-primary-default font-bold resize-none leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAnsweringId(null)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          onClick={() => handleAnswerSubmit(q.id)}
                          disabled={submitting}
                          className="px-4 py-1.5 bg-primary-default hover:bg-primary-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>ثبت پاسخ جدید</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAnsweringId(q.id);
                        setAnswerText(q.answerText);
                      }}
                      className="text-primary-default hover:text-primary-hover text-[11px] font-black self-start mt-1 cursor-pointer"
                    >
                      ویرایش و تغییر پاسخ
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {answeringId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="پاسخ کامل، شفاف و محترمانه خود را بنویسید..."
                        className="w-full bg-surface border border-border-default rounded-xl p-3 text-xs text-text-primary outline-none focus:border-primary-default font-bold resize-none leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAnsweringId(null)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          onClick={() => handleAnswerSubmit(q.id)}
                          disabled={submitting}
                          className="px-4 py-1.5 bg-primary-default hover:bg-primary-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>ارسال پاسخ</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAnsweringId(q.id);
                        setAnswerText("");
                      }}
                      className="px-4 py-2.5 bg-primary-default/10 hover:bg-primary-default text-primary-default hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all self-start cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 rotate-180" />
                      <span>پاسخ به این سوال</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
