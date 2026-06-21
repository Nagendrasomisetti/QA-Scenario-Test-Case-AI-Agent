"use client";

import React, { useState, useEffect } from 'react';
import { AnalysisSummary } from '../types/api';
import { ApiService } from '../services/api';
import { Search, Plus, Trash2, Calendar, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeAnalysisId: number | null;
  onSelectAnalysis: (id: number) => void;
  onNewAnalysis: () => void;
  refreshTrigger: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeAnalysisId,
  onSelectAnalysis,
  onNewAnalysis,
  refreshTrigger,
}) => {
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load analysis history on mount and when refreshTrigger changes
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      let data: AnalysisSummary[];
      if (searchQuery.trim()) {
        data = await ApiService.searchAnalyses(searchQuery);
      } else {
        data = await ApiService.listAnalyses(50, 0);
      }
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete the analysis: "${title}"?`);
    if (!confirmDelete) return;

    try {
      await ApiService.deleteAnalysis(id);
      loadHistory();
      if (activeAnalysisId === id) {
        onNewAnalysis();
      }
    } catch (err) {
      alert('Failed to delete history record.');
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-red-500" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'text':
      default:
        return <Plus className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 h-[calc(100vh-4rem)] flex flex-col shrink-0">
      
      {/* Sidebar Top Action */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
        <button
          onClick={onNewAnalysis}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/10 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
        />
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Analysis History ({history.length})
          </span>
        </div>

        {isLoading && history.length === 0 ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 dark:bg-slate-950 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-medium">
            No previous records found
          </div>
        ) : (
          history.map((item) => {
            const isActive = activeAnalysisId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectAnalysis(item.id)}
                className={`group relative p-3 border rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/20 dark:border-slate-800/60 dark:hover:border-slate-850 dark:bg-slate-950/20'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {getSourceIcon(item.source_type)}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {item.source_type}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-250 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Delete Hover Action */}
                <button
                  onClick={(e) => handleDelete(e, item.id, item.title)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  title="Delete analysis"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
