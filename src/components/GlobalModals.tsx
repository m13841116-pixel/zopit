import React, { useEffect, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

export const GlobalModals = () => {
  const [confirmConfig, setConfirmConfig] = useState<{ message: string; resolve: (val: boolean) => void } | null>(null);
  const [promptConfig, setPromptConfig] = useState<{ message: string; resolve: (val: string | null) => void } | null>(null);
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    (window as any).customConfirm = (message: string) => {
      return new Promise<boolean>((resolve) => {
        setConfirmConfig({ message, resolve });
      });
    };

    (window as any).customPrompt = (message: string) => {
      return new Promise<string | null>((resolve) => {
        setPromptValue("");
        setPromptConfig({ message, resolve });
      });
    };
  }, []);

  const handleConfirm = (val: boolean) => {
    if (confirmConfig) {
      confirmConfig.resolve(val);
      setConfirmConfig(null);
    }
  };

  const handlePrompt = (submit: boolean) => {
    if (promptConfig) {
      promptConfig.resolve(submit ? promptValue : null);
      setPromptConfig(null);
    }
  };

  if (!confirmConfig && !promptConfig) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      {confirmConfig && (
        <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <h3 className="font-bold text-lg">تاییدیه سیستم</h3>
          </div>
          <p className="text-secondary text-sm mb-6 leading-relaxed">
            {confirmConfig.message}
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleConfirm(false)} className="flex-1 px-4 py-2.5 bg-surface hover:bg-surface/80 text-secondary rounded-xl font-bold transition-colors">
              خیر، انصراف
            </button>
            <button onClick={() => handleConfirm(true)} className="flex-1 px-4 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold transition-colors">
              بله، مطمئنم
            </button>
          </div>
        </div>
      )}

      {promptConfig && (
        <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <HelpCircle className="w-6 h-6 text-indigo-500" />
            <h3 className="font-bold text-lg">دریافت اطلاعات</h3>
          </div>
          <p className="text-secondary text-sm mb-4 leading-relaxed">
            {promptConfig.message}
          </p>
          <input
            type="text"
            autoFocus
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePrompt(true)}
            className="w-full bg-background border border-subtle rounded-xl px-4 py-3 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default transition-all"
          />
          <div className="flex gap-3">
            <button onClick={() => handlePrompt(false)} className="flex-1 px-4 py-2.5 bg-surface hover:bg-surface/80 text-secondary rounded-xl font-bold transition-colors">
              انصراف
            </button>
            <button onClick={() => handlePrompt(true)} className="flex-1 px-4 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold transition-colors">
              تایید
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
