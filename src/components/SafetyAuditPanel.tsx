import React from 'react';
import { SafetyAuditResult } from '../types';
import { ShieldCheck, AlertCircle, RefreshCw, Layers, Bell, CheckCircle, Info } from 'lucide-react';

interface SafetyAuditPanelProps {
  auditResult: SafetyAuditResult | null;
  onRunAudit: () => void;
  isAuditing: boolean;
  auditMode: string;
}

export default function SafetyAuditPanel({
  auditResult,
  onRunAudit,
  isAuditing,
  auditMode,
}: SafetyAuditPanelProps) {

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 border-emerald-300 bg-emerald-50/50';
    if (score >= 70) return 'text-amber-600 border-amber-300 bg-amber-50/50';
    return 'text-rose-600 border-rose-300 bg-rose-50/50';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-rose-50 border border-rose-200 text-rose-700';
      case 'Medium': return 'bg-amber-50 border border-amber-200 text-amber-700';
      default: return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
    }
  };

  const getDayTranslation = (day: string) => {
    switch (day) {
      case 'Monday': return 'ចន្ទ';
      case 'Tuesday': return 'អង្គារ';
      case 'Wednesday': return 'ពុធ';
      case 'Thursday': return 'ព្រហស្បតិ៍';
      case 'Friday': return 'សុក្រ';
      default: return day;
    }
  };

  const getShiftTranslation = (name: string) => {
    switch (name) {
      case 'Morning Admission': return 'ម៉ោងចូលរៀនពេលព្រឹក';
      case 'Recess & Play': return 'ម៉ោងចេញលេងខ្លី';
      case 'Lunch Break': return 'ម៉ោងសម្រាកអាហារថ្ងៃត្រង់';
      case 'Afternoon Dismissal': return 'ម៉ោងចេញពីសាលាពេលរសៀល';
      default: return name;
    }
  };

  const getRiskTranslation = (risk: string) => {
    switch (risk) {
      case 'High': return 'ខ្ពស់';
      case 'Medium': return 'មធ្យម';
      case 'Low': return 'ទាប';
      default: return risk;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 font-display uppercase tracking-tight">
            <ShieldCheck className="w-5 h-5 text-indigo-600 animate-pulse" /> ប្រព័ន្ធវាយតម្លៃសុវត្ថិភាព និងអនុលោមភាព AI
          </h2>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">
            ដំណើរការការវាយតម្លៃសន្តិសុខពេញលេញលើកាលវិភាគប្រចាំសប្តាហ៍ ដើម្បីកំណត់រកចំណុចងាយរងគ្រោះនៅក្នុងបរិវេណសាលា។
          </p>
        </div>

        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className={`flex items-center justify-center gap-2 font-bold font-display uppercase tracking-wider text-xs px-5 py-2.5 rounded-md border cursor-pointer transition-all active:scale-98 shadow-xs ${
            isAuditing 
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? 'កំពុងវាយតម្លៃសុវត្ថិភាព...' : 'ដំណើរការវាយតម្លៃសុវត្ថិភាព'}
        </button>
      </div>

      {auditResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Coverage Metrics */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col items-center justify-center text-center">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 font-display">
                ភាគរយគ្របដណ្តប់សុវត្ថិភាពសាលារៀន
              </h3>

              {/* Radial circle */}
              <div className={`w-32 h-32 rounded-sm border-2 flex flex-col items-center justify-center ${getScoreColor(auditResult.coverageScore)}`}>
                <span className="text-4xl font-black font-display">{auditResult.coverageScore}%</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-85 mt-1 font-display">កម្រិតពិន្ទុ</span>
              </div>

              <div className="mt-5 text-xs text-slate-500 font-semibold">
                {auditResult.coverageScore >= 90 ? (
                  <p className="text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1 font-display">
                    <CheckCircle className="w-4 h-4" /> ស្ថានភាពសុវត្ថិភាពរឹងមាំល្អ
                  </p>
                ) : auditResult.coverageScore >= 75 ? (
                  <p className="text-amber-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1 font-display">
                    ⚠️ ការការពារកម្រិតមធ្យម
                  </p>
                ) : (
                  <p className="text-rose-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1 font-display">
                    🚨 ការប្រឈមហានិភ័យខ្ពស់
                  </p>
                )}
                <span className="block mt-1 text-[10px] text-slate-400 font-medium italic">
                  វាយតម្លៃតាមរយៈ៖ ម៉ាស៊ីន {auditMode === 'AI' ? 'AI' : 'ក្បួនដោះស្រាយក្នុងតំបន់ (Local)'}
                </span>
              </div>
            </div>

            {/* Compliance Alerts */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
              <h3 className="text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 font-display">
                <Bell className="w-4 h-4 text-amber-500" /> ករណីលើកលែងគោលនយោបាយកាលវិភាគ
              </h3>

              {auditResult.complianceAlerts.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {auditResult.complianceAlerts.map((alert, idx) => (
                    <div key={idx} className="flex gap-2.5 p-2.5 rounded-sm bg-amber-50/50 border border-amber-200 text-xs text-amber-900 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-700 text-xs font-bold font-display uppercase tracking-wider">អនុលោមតាមគោលនយោបាយ ១០០%!</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">មិនមានរកឃើញការលើសការងារ ឬការខុសតួនាទីឡើយ។</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Details & AI Narrative Brief */}
          <div className="space-y-6 lg:col-span-2">
            {/* AI Briefing Brief */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
              <h3 className="text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 font-display">
                <Layers className="w-4 h-4 text-indigo-500" /> បន្ទប់រាយការណ៍ព័ត៌មានរដ្ឋបាល AI
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed space-y-3 font-semibold whitespace-pre-line pl-2 bg-slate-50/40 p-3 rounded-sm border border-slate-150">
                {auditResult.aiSummary}
              </div>
            </div>

            {/* Uncovered & Understaffed Zones */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
              <h3 className="text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 font-display">
                <AlertCircle className="w-4 h-4 text-rose-500" /> តំបន់ហានិភ័យគ្រោះថ្នាក់ដែលគ្មានអ្នកយាម ឬខ្វះបុគ្គលិក
              </h3>

              {auditResult.uncoveredZones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider pb-2 font-display">
                        <th className="pb-2">ថ្ងៃ និងម៉ោងប្រចាំការ</th>
                        <th className="pb-2">តំបន់ក្នុងសាលា</th>
                        <th className="pb-2 text-center">កម្រិតហានិភ័យ</th>
                        <th className="pb-2">កង្វះខាតសុវត្ថិភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {auditResult.uncoveredZones.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-slate-900 font-display">
                            ថ្ងៃ{getDayTranslation(item.day)} • {getShiftTranslation(item.shiftName)}
                          </td>
                          <td className="py-2.5 font-semibold text-slate-800">{item.zoneName}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold tracking-wider ${getRiskBadgeColor(item.riskLevel)}`}>
                              {getRiskTranslation(item.riskLevel)}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-rose-600">
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-emerald-200 rounded-lg bg-emerald-50/10">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-800 text-xs font-bold font-display uppercase tracking-wider">សម្រេចបានការការពារដ៏ល្អឥតខ្ចោះ!</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">រាល់តំបន់ហានិភ័យនៅក្នុងបរិវេណសាលាត្រូវបានការពារយ៉ាងពេញលេញដោយបុគ្គលិកសុវត្ថិភាពគ្រប់ពេលវេលា។</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg shadow-xs">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-sm font-display uppercase tracking-wider">មិនទាន់មានរបាយការណ៍វាយតម្លៃនៅឡើយទេ</p>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto font-medium">
            សូមចុចប៊ូតុង "ដំណើរការវាយតម្លៃសុវត្ថិភាព" ខាងលើដើម្បីវាយតម្លៃកាលវិភាគការងាររបស់សាលារៀន និងកំណត់រកចំណុចខ្វះខាតសុវត្ថិភាព។
          </p>
        </div>
      )}
    </div>
  );
}
