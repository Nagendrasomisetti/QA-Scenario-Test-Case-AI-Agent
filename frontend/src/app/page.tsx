"use client";

import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { AnalysisResponse, DashboardStats } from '../types/api';
import { InputPanel } from '../components/InputPanel';
import { OutputTabs } from '../components/OutputTabs';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Sidebar } from '../components/Sidebar';
import { 
  ShieldCheck, Moon, Sun, Globe, FileText, 
  Image as ImageIcon, Sparkles, BarChart2, Calendar, Clock, Database
} from 'lucide-react';

export default function Dashboard() {
  const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Dashboard Statistics
  const loadStats = async () => {
    try {
      const stats = await ApiService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const handleAnalyze = async (
    requirement: string,
    pdfFile: File | null,
    imageFile: File | null
  ) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setActiveAnalysisId(null);

    try {
      const result = await ApiService.analyzeRequirements(requirement, pdfFile, imageFile);
      setAnalysisData(result);
      if (result.id) {
        setActiveAnalysisId(result.id);
      }
      setRefreshTrigger(prev => prev + 1);
      alert('QA Analysis generated and saved successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'QA Analysis engine call failed. Please check your backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnalysis = async (id: number) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setActiveAnalysisId(id);

    try {
      const result = await ApiService.getAnalysisDetail(id);
      setAnalysisData(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load historical analysis details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisData(null);
    setActiveAnalysisId(null);
    setError(null);
    loadStats();
  };

  const handleExportPdf = () => {
    if (activeAnalysisId) {
      ApiService.triggerPdfDownload(activeAnalysisId);
    }
  };

  const handleExportExcel = () => {
    if (activeAnalysisId) {
      ApiService.triggerExcelDownload(activeAnalysisId);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'pdf':
        return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      case 'image':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'text':
      default:
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-md shadow-indigo-500/10 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight">
                QA Scenario & Test Case AI Agent
              </h1>
              <span className="text-[9px] text-slate-400 font-bold dark:text-slate-500 tracking-wider uppercase">
                Enterprise Dashboard & History Persist
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Sidebar + Main panel structure */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left History Sidebar */}
        <Sidebar
          activeAnalysisId={activeAnalysisId}
          onSelectAnalysis={handleSelectAnalysis}
          onNewAnalysis={handleNewAnalysis}
          refreshTrigger={refreshTrigger}
        />

        {/* Right Dashboard Workspace */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* If no analysis is active and not loading, show SaaS statistics dashboard */}
            {!analysisData && !isLoading && !error && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Dashboard Stats Summary Cards */}
                {dashboardStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Analyses</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{dashboardStats.total_analyses}</h4>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PDFs Processed</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{dashboardStats.pdf_analyses}</h4>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Screenshots Scanned</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{dashboardStats.image_analyses}</h4>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Response Speed</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">
                          {dashboardStats.average_processing_time_ms > 0 
                            ? `${(dashboardStats.average_processing_time_ms / 1000).toFixed(1)}s` 
                            : 'N/A'}
                        </h4>
                      </div>
                    </div>
                  </div>
                )}

                {/* Two Column Section: Input on left, Recent Activity on right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7">
                    <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
                  </div>
                  
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <BarChart2 className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Recent QA Activity
                      </h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {dashboardStats && dashboardStats.recent_activity.length > 0 ? (
                        dashboardStats.recent_activity.map((act) => (
                          <div 
                            key={act.id}
                            onClick={() => handleSelectAnalysis(act.id)}
                            className="p-3 bg-slate-50 hover:bg-indigo-50/20 border border-slate-100 dark:bg-slate-950/40 dark:border-slate-850 dark:hover:bg-indigo-950/10 rounded-xl cursor-pointer transition-all space-y-1"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold text-xs truncate text-slate-700 dark:text-slate-200">
                                {act.title}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getSourceBadge(act.source_type)}`}>
                                {act.source_type}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 block font-medium">
                              {new Date(act.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-400">
                          No recent activity recorded
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Display loading block */}
            {isLoading && <LoadingState />}

            {/* Display error block */}
            {error && (
              <ErrorState 
                message={error} 
                onRetry={handleNewAnalysis} 
              />
            )}

            {/* Display analysis workspace with export options */}
            {!isLoading && !error && analysisData && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Exporter Toolbar */}
                {activeAnalysisId && (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleNewAnalysis}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850"
                      >
                        ← Back to Dashboard
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExportPdf}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-red-650/10 focus:outline-none"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Export PDF</span>
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-650/10 focus:outline-none"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>
                )}
                
                <OutputTabs data={analysisData} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
