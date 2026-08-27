import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  Radio,
  RotateCcw,
  RotateCw,
  Gauge,
  Layers,
  Crown,
  Headphones,
  Sparkles
} from "lucide-react";

interface ProAccountMediaShowcaseProps {
  audioUrl?: string;
}

export function ProAccountMediaShowcase({ audioUrl }: ProAccountMediaShowcaseProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(180); // 3 minutes default demo
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const chapters = [
    { time: 0, title: "۱. معرفی امکانات اکانت پرو زوپیت" },
    { time: 35, title: "۲. ثبت دامنه ملی اختصاصی (.ir) و قالب وردپرس" },
    { time: 80, title: "۳. اخذ اینماد، درگاه پرداخت و پنل پستی" },
    { time: 130, title: "۴. اتصال به ترب و ایمالز جهت افزایش فروش" },
  ];

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    }
  };

  const handleSkipAudio = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioDuration, audioRef.current.currentTime + seconds));
  };

  const handleSpeedChange = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-fade-in my-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Headphones className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">
                پادکست صوتی راهنمای اکانت پرو زوپیت
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                فایل صوتی اختصاصی
              </span>
            </div>
            <p className="text-xs text-indigo-200 font-medium mt-0.5">
              توضیحات کامل مزایا، نحوه فعال‌سازی دامنه، درگاه و نماد اعتماد اکانت پرو
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpeedChange}
          className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>سرعت پخش: {playbackSpeed}x</span>
        </button>
      </div>

      {/* Audio Waveform & Player Box */}
      <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={audioUrl || "https://actions.google.com/sounds/v1/ambiences/outdoor_park.ogg"}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              setAudioDuration(audioRef.current.duration || 180);
              setAudioProgress((audioRef.current.currentTime / (audioRef.current.duration || 180)) * 100);
            }
          }}
          onEnded={() => setIsAudioPlaying(false)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">پادکست بررسی راهکارهای رشد فروشگاه با اکانت پرو</h4>
              <p className="text-[11px] text-emerald-300 font-medium">گوینده: تیم توسعه کسب‌وکار زوپیت</p>
            </div>
          </div>
          <span className="font-mono text-xs text-emerald-400 font-black bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/30 dir-ltr">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </span>
        </div>

        {/* Waveform graphic visualization */}
        <div className="flex items-center gap-1 h-14 bg-slate-900/80 p-2.5 rounded-xl border border-indigo-500/20 overflow-hidden">
          {[40, 65, 30, 85, 95, 45, 60, 75, 90, 100, 35, 55, 80, 65, 40, 70, 85, 95, 50, 60, 75, 40, 65, 85, 90, 45, 60, 75, 30, 80, 95, 60, 45, 70, 85, 90].map((height, i) => {
            const barProgress = (i / 36) * 100;
            const isPlayed = barProgress <= audioProgress;
            return (
              <div
                key={i}
                onClick={() => {
                  if (audioRef.current) {
                    const targetTime = (barProgress / 100) * audioDuration;
                    audioRef.current.currentTime = targetTime;
                  }
                }}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full cursor-pointer transition-all duration-200 ${
                  isPlayed ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-700 hover:bg-slate-500"
                }`}
              />
            );
          })}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-xs text-indigo-300 font-bold">{formatTime(currentTime)}</span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSkipAudio(-15)}
              className="p-2.5 text-indigo-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="۱۵ ثانیه قبل"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">۱۵ ثانیه عقب</span>
            </button>

            <button
              type="button"
              onClick={handleToggleAudio}
              className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
            >
              {isAudioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSkipAudio(15)}
              className="p-2.5 text-indigo-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-1 text-xs"
              title="۱۵ ثانیه بعد"
            >
              <span className="hidden sm:inline">۱۵ ثانیه جلو</span>
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <span className="font-mono text-xs text-indigo-300 font-bold">{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Audio Chapters */}
      <div className="space-y-2 pt-2">
        <h5 className="text-xs font-black text-indigo-200 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          سرفصل‌های گفتگو و زمان‌بندی صوتی:
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chapters.map((ch, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = ch.time;
                  if (!isAudioPlaying) handleToggleAudio();
                }
              }}
              className="flex items-center justify-between p-2.5 bg-slate-900/60 hover:bg-slate-800 border border-indigo-500/20 rounded-xl text-xs text-right cursor-pointer transition-all group"
            >
              <span className="font-bold text-indigo-100 group-hover:text-emerald-300 transition-colors">{ch.title}</span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {formatTime(ch.time)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
