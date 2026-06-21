"use client";

import React, { useRef, useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Sparkles, X, Upload } from 'lucide-react';

interface InputPanelProps {
  onAnalyze: (requirement: string, pdfFile: File | null, imageFile: File | null) => void;
  isLoading: boolean;
}

const TEMPLATES = [
  {
    name: '🔑 Auth Flow',
    text: 'Implement user login, signup, password reset, and brute-force lockout policies. Lock users out for 15 minutes after 5 consecutive failed attempts.'
  },
  {
    name: '🛒 Checkout',
    text: 'Checkout system allowing credit card (Stripe) and PayPal. Validate items in stock, calculate local tax dynamically, and send email confirmations.'
  },
  {
    name: '🚀 API Limits',
    text: 'Public APIs should enforce rate limits of 100 requests/minute per client IP. Exceeded limits return HTTP 429 Too Many Requests.'
  }
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const InputPanel: React.FC<InputPanelProps> = ({ onAnalyze, isLoading }) => {
  const [requirement, setRequirement] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when image changes or unmounts to prevent memory leaks
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  const validateFile = (file: File, allowedTypes: string[]): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File "${file.name}" exceeds the maximum limit of 10MB. (Actual size: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return false;
    }
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeMatch = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return extension === type;
      }
      return file.type.startsWith(type.replace('*', ''));
    });

    if (!isMimeMatch) {
      alert(`Invalid format for "${file.name}". Please upload one of the following: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file, ['application/pdf', '.pdf'])) {
        setPdfFile(file);
      } else {
        if (pdfInputRef.current) pdfInputRef.current.value = '';
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file, ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])) {
        setImageFile(file);
      } else {
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim() && !pdfFile && !imageFile) {
      alert('Please fill out the requirement text or upload a specification document/image.');
      return;
    }
    onAnalyze(requirement, pdfFile, imageFile);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Requirement Input
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Describe functional specs or upload context docs (Max 10MB)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="requirement" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Write or paste requirements
          </label>
          <textarea
            id="requirement"
            rows={6}
            className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 dark:focus:ring-indigo-500/20 transition-all resize-none"
            placeholder="Type requirements here... (e.g., The signup page should require password complexity validation...)"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
          />
        </div>

        {/* Templates Selector */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Or use a preset template:
          </span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => setRequirement(tmpl.text)}
                className="text-xs px-3 py-1.5 font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* PDF Input */}
          <input
            type="file"
            ref={pdfInputRef}
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handlePdfChange}
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className={`flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border transition-all ${
              pdfFile
                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-red-500" />
            <span className="truncate">{pdfFile ? pdfFile.name : 'Upload PDF'}</span>
          </button>

          {/* Image Input */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className={`flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border transition-all ${
              imageFile
                ? 'bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span className="truncate">{imageFile ? imageFile.name : 'Upload Screenshot'}</span>
          </button>
        </div>

        {/* Selected Files Preview List */}
        {(pdfFile || imageFile) && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Attached Files
            </span>
            <div className="space-y-2">
              {pdfFile && (
                <div className="flex items-center justify-between text-xs text-slate-655 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 px-2.5 py-2 rounded-lg">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
                    <div className="truncate">
                      <p className="font-semibold truncate">{pdfFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPdfFile(null)} className="text-slate-400 hover:text-slate-655">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              {imageFile && (
                <div className="flex items-center justify-between text-xs text-slate-655 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 px-2.5 py-2 rounded-lg">
                  <div className="flex items-center gap-2.5 truncate">
                    {imagePreviewUrl ? (
                      <img 
                        src={imagePreviewUrl} 
                        alt="Preview" 
                        className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-semibold truncate">{imageFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setImageFile(null)} className="text-slate-400 hover:text-slate-655">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:disabled:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing visual document...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Analyze Requirements</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputPanel;
