import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Gauge,
  Layers,
  Headphones,
  ChevronDown,
  ChevronUp,
  Volume2
} from "lucide-react";

interface ProAccountMediaShowcaseProps {
  audioUrl?: string;
}

export function ProAccountMediaShowcase({ audioUrl }: ProAccountMediaShowcaseProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(180); // 3 minutes default
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showChapters, setShowChapters] = useState<boolean>(false);

  const chapters = [
    { time: 0, title: "۱. معرفی امکانات اکانت پرو" },
    { time: 35, title: "۲. ثبت دامنه ملی و قالب وردپرس" },
    { time: 80, title: "۳. اخذ اینماد، درگاه و پنل پستی" },
    { time: 130, title: "۴. اتصال به ترب و ایمالز" },
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
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-emerald-500/30 rounded-2xl p-3.5 md:p-4 shadow-lg text-white space-y-3 animate-fade-in my-4" dir="rtl">
      {/* Hidden audio element */}
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

      {/* Top compact row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs md:text-sm font-black text-white truncate">
                پادکست صوتی راهنمای راه‌اندازی و رشد فروشگاه با اکانت پرو
              </h4>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                فایل صوتی ۳ دقیقه
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSpeedChange}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
            title="سرعت پخش"
          >
            <Gauge className="w-3 h-3" />
            <span>{playbackSpeed}x</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChapters(!showChapters)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">سرفصل‌ها</span>
            {showChapters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Streamlined audio controls & slim progress bar */}
      <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 sm:p-2.5 rounded-xl">
        {/* Play / Skip Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSkipAudio(-15)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="۱۵ ثانیه قبل"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleAudio}
            className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/20 transition-transform active:scale-95 shrink-0"
          >
            {isAudioPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSkipAudio(15)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="۱۵ ثانیه بعد"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Time display current */}
        <span className="font-mono text-[11px] text-emerald-400 font-bold shrink-0 w-8 text-center">
          {formatTime(currentTime)}
        </span>

        {/* Interactive Slim Waveform / Slider */}
        <div
          onClick={(e) => {
            if (!audioRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            // RTL calculation: click from right is 0
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const ratio = (width - clickX) / width;
            const targetTime = Math.max(0, Math.min(audioDuration, ratio * audioDuration));
            audioRef.current.currentTime = targetTime;
          }}
          className="flex-1 h-6 flex items-center gap-0.5 cursor-pointer px-1 bg-slate-950/60 rounded-lg border border-slate-800 overflow-hidden"
        >
          {Array.from({ length: 32 }).map((_, i) => {
            const barProgress = (i / 32) * 100;
            const isPlayed = barProgress <= audioProgress;
            // Heights pattern
            const pattern = [35, 60, 85, 45, 95, 70, 40, 80, 100, 65, 40, 75, 90, 50, 65, 80, 45, 85, 95, 60, 40, 75, 90, 100, 55, 70, 85, 45, 60, 80, 50, 40];
            const height = pattern[i % pattern.length];
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayed ? "bg-emerald-400" : "bg-slate-700"
                }`}
              />
            );
          })}
        </div>

        {/* Time display total */}
        <span className="font-mono text-[11px] text-slate-400 font-medium shrink-0 w-8 text-center">
          {formatTime(audioDuration)}
        </span>
      </div>

      {/* Collapsible Chapters (Compact tags) */}
      {showChapters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-fade-in">
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
              className="flex items-center justify-between p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-[11px] text-right cursor-pointer transition-all group"
            >
              <span className="font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                {ch.title}
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0 mr-1.5">
                {formatTime(ch.time)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
