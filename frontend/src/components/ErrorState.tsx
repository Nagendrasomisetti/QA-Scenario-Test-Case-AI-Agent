import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border border-red-100 rounded-2xl bg-red-50/20 shadow-sm dark:bg-red-950/10 dark:border-red-900/20 min-h-[400px]">
      <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-full mb-6">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        Analysis Failed
      </h3>
      <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-md mb-8">
        {message || 'An unexpected error occurred while communicating with the analysis engine. Please verify the backend is running and try again.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
