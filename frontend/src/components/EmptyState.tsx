import React from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 min-h-[450px]">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full mb-6 relative">
        <ClipboardList className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full text-white animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 text-center">
        Ready for Analysis
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
        Enter your application requirements, upload a PDF specification, or upload user interface mockups on the left, then click <strong>Analyze Requirements</strong> to generate structured QA scenarios and test assets.
      </p>
    </div>
  );
};

export default EmptyState;
