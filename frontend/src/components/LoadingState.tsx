import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-slate-100 rounded-2xl bg-white shadow-sm dark:bg-slate-900/50 dark:border-slate-800/50 min-h-[400px]">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-12 h-12 border-4 border-indigo-100 dark:border-indigo-950/50 rounded-full"></div>
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin relative" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        Analyzing Requirements
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-8">
        Extracting functional flows, edge cases, negative test scenarios, and security risks...
      </p>

      {/* Shimmer Skeletons */}
      <div className="w-full max-w-lg space-y-4">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
