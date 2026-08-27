import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  if (count === 1) {
    return (
      <div 
        className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${className}`} 
      />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${className}`} 
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle/50">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-16" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ cols?: number; rows?: number }> = ({ cols = 5, rows = 6 }) => {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="bg-surface/50 p-4 border-b border-border-subtle flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border-subtle/50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3.5 bg-slate-200 dark:bg-slate-700/60 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
