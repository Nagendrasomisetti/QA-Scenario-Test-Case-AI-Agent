"use client";

import React, { useState } from 'react';
import { AnalysisResponse } from '../types/api';
import { CopyButton } from './CopyButton';
import { 
  FileText, ShieldCheck, CheckCircle2, XCircle, 
  HelpCircle, AlertTriangle, AlertOctagon, Eye, Award
} from 'lucide-react';

interface OutputTabsProps {
  data: AnalysisResponse;
}

type TabType = 
  | 'scenarios' 
  | 'test_cases' 
  | 'positive_cases' 
  | 'negative_cases' 
  | 'edge_cases' 
  | 'risks' 
  | 'missing_requirements';

export const OutputTabs: React.FC<OutputTabsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('scenarios');

  const tabsConfig = [
    { key: 'scenarios', label: 'Scenarios', icon: FileText, count: data.scenarios?.length || 0 },
    { key: 'test_cases', label: 'Test Cases', icon: ShieldCheck, count: data.test_cases?.length || 0 },
    { key: 'positive_cases', label: 'Positive Cases', icon: CheckCircle2, count: data.positive_cases?.length || 0 },
    { key: 'negative_cases', label: 'Negative Cases', icon: XCircle, count: data.negative_cases?.length || 0 },
    { key: 'edge_cases', label: 'Edge Cases', icon: HelpCircle, count: data.edge_cases?.length || 0 },
    { key: 'risks', label: 'Risks', icon: AlertTriangle, count: data.risks?.length || 0 },
    { key: 'missing_requirements', label: 'Missing Specs', icon: AlertOctagon, count: data.missing_requirements?.length || 0 },
  ] as const;

  // Format active tab data as a clean, copyable string
  const getCopyableText = () => {
    switch (activeTab) {
      case 'scenarios':
        return (data.scenarios || []).map(s => `[${s.id}] ${s.title}\nDescription: ${s.description}\n`).join('\n');
      case 'test_cases':
        return (data.test_cases || []).map(t => 
          `[${t.id}] ${t.title}\nPreconditions: ${t.preconditions}\nSteps:\n${t.steps.map((s, idx) => `  ${idx + 1}. ${s}`).join('\n')}\nExpected Result: ${t.expected_result}\n`
        ).join('\n');
      case 'positive_cases':
      case 'negative_cases':
      case 'edge_cases':
        const list = data[activeTab] || [];
        return list.map(c => 
          `[${c.id}] ${c.title}\nSteps:\n${c.steps.map((s, idx) => `  ${idx + 1}. ${s}`).join('\n')}\nExpected Result: ${c.expected_result}\n`
        ).join('\n');
      case 'risks':
        return (data.risks || []).map(r => `[${r.id}] Impact: ${r.impact}\nDescription: ${r.description}\nMitigation: ${r.mitigation}\n`).join('\n');
      case 'missing_requirements':
        return (data.missing_requirements || []).map(m => `[${m.id}] Impact: ${m.impact}\nDescription: ${m.description}\n`).join('\n');
      default:
        return '';
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
      case 'low':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'pdf':
        return { label: '📄 PDF Spec', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50' };
      case 'image':
        return { label: '🖼️ UI Screenshot', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50' };
      case 'text':
      default:
        return { label: '✍️ Input Text', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50' };
    }
  };

  const sourceBadgeInfo = getSourceBadge(data.source_type);

  return (
    <div className="space-y-6">
      
      {/* Header Metrics Block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${sourceBadgeInfo.color}`}>
            {sourceBadgeInfo.label}
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Confidence: {(data.confidence_score * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        {/* PDF Extraction Metrics */}
        {data.source_type === 'pdf' && (
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div>
              Pages: <span className="text-slate-800 dark:text-slate-200 font-bold">{data.pages_processed}</span>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              Characters: <span className="text-slate-800 dark:text-slate-200 font-bold">{data.characters_extracted.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Observations (Screenshot Mode only) */}
      {data.source_type === 'image' && data.visual_observations && data.visual_observations.length > 0 && (
        <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5 dark:bg-amber-950/10 dark:border-amber-900/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Visual UI Inventory & Observations
            </h4>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-655 dark:text-slate-350 list-inside list-disc">
            {data.visual_observations.map((obs, idx) => (
              <li key={idx} className="leading-relaxed">{obs}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Tabbed Output Panels */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden transition-all duration-300">
        {/* Scrollable Tabs Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide bg-slate-50/50 dark:bg-slate-950/20">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Panel Body */}
        <div className="p-6">
          {/* Copy Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Generated {tabsConfig.find(t => t.key === activeTab)?.label}
            </h3>
            <CopyButton textToCopy={getCopyableText()} />
          </div>

          {/* Tab Content Rendering */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            
            {/* SCENARIOS TAB */}
            {activeTab === 'scenarios' && (data.scenarios || []).map((scenario) => (
              <div
                key={scenario.id}
                className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all bg-slate-50/30 dark:bg-slate-950/10"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md">
                    {scenario.id}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {scenario.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed pl-1">
                  {scenario.description}
                </p>
              </div>
            ))}

            {/* TEST CASES TAB */}
            {activeTab === 'test_cases' && (data.test_cases || []).map((testCase) => (
              <div
                key={testCase.id}
                className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-950/10"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
                    {testCase.id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Ref: {testCase.scenario_id}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm ml-1 truncate">
                    {testCase.title}
                  </h4>
                </div>

                <div className="space-y-3.5 pl-1 text-xs">
                  <div>
                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                      Preconditions
                    </span>
                    <div className="p-2.5 bg-slate-100/60 dark:bg-slate-950/60 rounded-lg text-slate-700 dark:text-slate-300">
                      {testCase.preconditions}
                    </div>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                      Steps to Execute
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-655 dark:text-slate-300 pl-1">
                      {testCase.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="pl-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                      Expected Result
                    </span>
                    <div className="p-3 bg-indigo-50/40 border-l-4 border-indigo-500 rounded-r-lg text-slate-700 dark:bg-indigo-950/20 dark:border-indigo-400 dark:text-slate-300">
                      {testCase.expected_result}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* POSITIVE / NEGATIVE / EDGE CASES TAB */}
            {(activeTab === 'positive_cases' || activeTab === 'negative_cases' || activeTab === 'edge_cases') && 
              (data[activeTab] || []).map((item) => (
                <div
                  key={item.id}
                  className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-950/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      activeTab === 'positive_cases' 
                        ? 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/50' 
                        : activeTab === 'negative_cases'
                        ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50'
                        : 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/50'
                    }`}>
                      {item.id}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {item.title}
                    </h4>
                  </div>

                  <div className="space-y-3 pl-1 text-xs">
                    <div>
                      <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                        Execution Steps
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-655 dark:text-slate-300 pl-1">
                        {item.steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            <span className="pl-1">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                        Expected Output
                      </span>
                      <div className="p-2.5 bg-slate-100/50 border border-slate-200/50 rounded-lg text-slate-700 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-300">
                        {item.expected_result}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }

            {/* RISKS TAB */}
            {activeTab === 'risks' && (data.risks || []).map((risk) => (
              <div
                key={risk.id}
                className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-950/10"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-605 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {risk.id}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Risk Identification
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getImpactBadgeColor(risk.impact)}`}>
                    Impact: {risk.impact}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs pl-1">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5">
                      Risk Description
                    </span>
                    <p className="text-slate-700 dark:text-slate-350">{risk.description}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5 text-emerald-600 dark:text-emerald-400">
                      Recommended Mitigation
                    </span>
                    <p className="text-slate-700 dark:text-slate-350 bg-emerald-50/20 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 p-2 rounded-lg">
                      {risk.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* MISSING REQUIREMENTS TAB */}
            {activeTab === 'missing_requirements' && (data.missing_requirements || []).map((missing) => (
              <div
                key={missing.id}
                className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                      {missing.id}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Missing Specification Detail
                    </span>
                  </div>
                  <p className="text-slate-655 dark:text-slate-355 leading-relaxed pl-1">
                    {missing.description}
                  </p>
                </div>
                <div className="shrink-0 self-start md:self-center">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getImpactBadgeColor(missing.impact)}`}>
                    Impact: {missing.impact}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputTabs;
