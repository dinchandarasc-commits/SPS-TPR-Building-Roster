import React, { useState } from 'react';
import { StaffProfile, DutyZone, Shift, RosterEntry, StaffRole, WeekDay } from '../types';
import { Calendar, AlertCircle, CheckCircle2, UserPlus, X, Clock, HelpCircle, Shield, BookOpen, UserCheck, Sparkles } from 'lucide-react';

interface RosterBoardProps {
  staff: StaffProfile[];
  zones: DutyZone[];
  shifts: Shift[];
  roster: RosterEntry[];
  onUpdateAssignment: (day: RosterEntry['day'], shiftId: string, zoneId: string, staffIds: string[]) => void;
  onClearRoster: () => void;
  onAISolve: () => void;
  isAIWorking: boolean;
}

export default function RosterBoard({
  staff,
  zones,
  shifts,
  roster,
  onUpdateAssignment,
  onClearRoster,
  onAISolve,
  isAIWorking,
}: RosterBoardProps) {
  const [activeDay, setActiveDay] = useState<WeekDay>('Monday');
  const [selectedCell, setSelectedCell] = useState<{ shiftId: string; zoneId: string } | null>(null);

  const days: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getCellAssignment = (day: WeekDay, shiftId: string, zoneId: string) => {
    return roster.find((r) => r.day === day && r.shiftId === shiftId && r.zoneId === zoneId);
  };

  const getDayTranslation = (day: WeekDay) => {
    switch (day) {
      case 'Monday': return 'ចន្ទ';
      case 'Tuesday': return 'អង្គារ';
      case 'Wednesday': return 'ពុធ';
      case 'Thursday': return 'ព្រហស្បតិ៍';
      case 'Friday': return 'សុក្រ';
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

  const getStaffRoleColor = (role: StaffRole) => {
    switch (role) {
      case 'Security': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Management': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Teacher': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  const getRoleTranslation = (role: StaffRole) => {
    switch (role) {
      case 'Security': return 'សន្តិសុខ';
      case 'Management': return 'គណៈគ្រប់គ្រង';
      case 'Teacher': return 'គ្រូបង្រៀន';
    }
  };

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case 'Security': return <Shield className="w-3 h-3 text-rose-600 inline mr-1" />;
      case 'Management': return <UserCheck className="w-3 h-3 text-indigo-600 inline mr-1" />;
      case 'Teacher': return <BookOpen className="w-3 h-3 text-emerald-600 inline mr-1" />;
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

  const getFloorTranslation = (floor: string) => {
    switch (floor) {
      case 'Ground': return 'ជាន់ផ្ទាល់ដី';
      case '1st Floor': return 'ជាន់ទី ១';
      case '2nd Floor': return 'ជាន់ទី ២';
      case '3rd Floor': return 'ជាន់ទី ៣';
      case '4th Floor': return 'ជាន់ទី ៤';
      case '5th Floor': return 'ជាន់ទី ៥';
      default: return 'ក្រៅអគារ';
    }
  };

  // Open the edit selector for a specific cell
  const handleCellClick = (shiftId: string, zoneId: string) => {
    setSelectedCell({ shiftId, zoneId });
  };

  const activeZone = selectedCell ? zones.find(z => z.id === selectedCell.zoneId) : null;
  const activeShift = selectedCell ? shifts.find(s => s.id === selectedCell.shiftId) : null;
  const currentCellRoster = selectedCell ? getCellAssignment(activeDay, selectedCell.shiftId, selectedCell.zoneId) : null;
  const currentlyAssignedIds = currentCellRoster ? currentCellRoster.staffIds : [];

  const handleToggleStaff = (staffId: string) => {
    if (!selectedCell) return;
    let newStaffIds = [...currentlyAssignedIds];
    if (newStaffIds.includes(staffId)) {
      newStaffIds = newStaffIds.filter(id => id !== staffId);
    } else {
      newStaffIds.push(staffId);
    }
    onUpdateAssignment(activeDay, selectedCell.shiftId, selectedCell.zoneId, newStaffIds);
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        {/* Days Tab (Geometric Button Group) */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-md border border-slate-200">
          {days.map((day) => {
            const dayAssignmentsCount = roster.filter(r => r.day === day && r.staffIds.length > 0).length;
            const isSelected = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-3 py-1.5 text-xs font-bold font-display uppercase tracking-wider rounded-sm cursor-pointer transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>ថ្ងៃ{getDayTranslation(day)}</span>
                {dayAssignmentsCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-indigo-600'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* AI Auto-Schedule & Clear buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClearRoster}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider font-display text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md cursor-pointer transition-all hover:bg-slate-50"
          >
            សម្អាតទិន្នន័យថ្ងៃនេះ
          </button>
          <button
            onClick={onAISolve}
            disabled={isAIWorking}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-display rounded-md cursor-pointer transition-all flex items-center gap-2 border shadow-sm ${
              isAIWorking
                ? 'bg-indigo-50 border-indigo-200 text-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500 active:scale-98'
            }`}
          >
            {isAIWorking ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI កំពុងរៀបចំ...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
                រៀបចំដោយស្វ័យប្រវត្តិ (AI Assist)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-5 min-w-[260px] w-1/4 border-r border-slate-200 font-display">តំបន់ហានិភ័យសាលារៀន</th>
                {shifts.map((shift) => (
                  <th key={shift.id} className="py-4 px-4 min-w-[180px] w-1/4 border-r border-slate-200 last:border-r-0 text-center">
                    <div className="space-y-0.5">
                      <div className="text-slate-800 font-bold font-display">{getShiftTranslation(shift.name)}</div>
                      <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1 normal-case">
                        <Clock className="w-3 h-3" /> {shift.timeSlot}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {zones.map((zone) => {
                return (
                  <tr key={zone.id} className="hover:bg-slate-50/50 transition-all group">
                    {/* Zone Info cell */}
                    <td className="py-4 px-5 border-r border-slate-200 bg-slate-50/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-950 transition-colors font-display">
                            {zone.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider ${
                            zone.zoneType === 'Zone D' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            zone.zoneType === 'Zone B' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            zone.zoneType === 'Zone C' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {zone.zoneType === 'Zone A' ? 'តំបន់ A' : zone.zoneType === 'Zone B' ? 'តំបន់ B' : zone.zoneType === 'Zone C' ? 'តំបន់ C' : 'តំបន់ D'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {getFloorTranslation(zone.floor)} • តម្រូវការ៖ {zone.minStaffRequired} នាក់
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Shifts cells */}
                    {shifts.map((shift) => {
                      const assignment = getCellAssignment(activeDay, shift.id, zone.id);
                      const assignedCount = assignment ? assignment.staffIds.length : 0;
                      const reqCount = zone.minStaffRequired;
                      const isUnderstaffed = assignedCount < reqCount;

                      return (
                        <td
                          key={shift.id}
                          onClick={() => handleCellClick(shift.id, zone.id)}
                          className={`py-3 px-3 cursor-pointer hover:bg-indigo-50/30 transition-all border-r border-slate-200 last:border-r-0 relative`}
                        >
                          <div className="min-h-[55px] flex flex-col justify-between space-y-3">
                            {/* Assigned Staff tags */}
                            {assignedCount > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignment!.staffIds.map((sId) => {
                                  const member = staff.find((s) => s.id === sId);
                                  if (!member) return null;
                                  return (
                                    <span
                                      key={sId}
                                      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${getStaffRoleColor(
                                        member.role
                                      )}`}
                                    >
                                      {getRoleIcon(member.role)}
                                      {member.name.split(' ').slice(-1)[0]}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic font-medium pt-1">
                                មិនទាន់ចាត់តាំង
                              </div>
                            )}

                            {/* Status label */}
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              {assignedCount === 0 ? (
                                <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm border border-rose-100 uppercase tracking-wide">
                                  <AlertCircle className="w-3 h-3" /> គ្មានអ្នកយាម
                                </span>
                              ) : isUnderstaffed ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-100 uppercase tracking-wide">
                                  <AlertCircle className="w-3 h-3" /> ខ្វះមនុស្ស ({assignedCount}/{reqCount})
                                </span>
                              ) : assignment?.status === 'Checked-In' ? (
                                <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm border border-indigo-150 uppercase tracking-wide">
                                  <Shield className="w-3 h-3 text-indigo-600 animate-pulse" /> បាន Check-In
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100 uppercase tracking-wide">
                                  <CheckCircle2 className="w-3 h-3" /> មានសុវត្ថិភាព
                                </span>
                              )}

                              <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider text-[9px] font-black">
                                ចាត់តាំង +
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Footer Controls */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white border border-slate-300"></span>
            <span className="text-slate-500 font-medium">មិនទាន់ចាត់តាំង</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-100"></span>
            <span className="text-slate-500 font-medium font-semibold text-emerald-700">មានសុវត្ថិភាពគ្រប់គ្រាន់</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-100"></span>
            <span className="text-slate-500 font-medium font-semibold text-amber-700">ខ្វះបុគ្គលិកយាម</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-50 border border-rose-100"></span>
            <span className="text-slate-500 font-medium font-semibold text-rose-700">គ្មានអ្នកយាមទាំងស្រុង</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-bold shadow-xs uppercase tracking-wider font-display cursor-pointer"
          >
            ទាញយកជា PDF
          </button>
          <button
            onClick={() => {
              if (zones.length > 0) {
                handleCellClick(shifts[0].id, zones[0].id);
              }
            }}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow-md uppercase tracking-wider font-display cursor-pointer"
          >
            កែសម្រួលការចាត់តាំង
          </button>
        </div>
      </div>

      {/* Selector Drawer / Modal */}
      {selectedCell && activeZone && activeShift && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg border border-slate-200 w-full max-w-lg p-6 shadow-xl relative animate-scale-up max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block font-display">
                ថ្ងៃ{getDayTranslation(activeDay)} • {getShiftTranslation(activeShift.name)} ({activeShift.timeSlot})
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2 font-display uppercase tracking-tight">
                <UserPlus className="w-5 h-5 text-indigo-600" /> កែសម្រួលការចាត់តាំងបុគ្គលិក
              </h2>
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 font-medium">
                <span className="font-bold text-slate-800 font-display">តំបន់គោលដៅ៖</span> {activeZone.name} ({activeZone.zoneType === 'Zone A' ? 'តំបន់ A' : activeZone.zoneType === 'Zone B' ? 'តំបន់ B' : activeZone.zoneType === 'Zone C' ? 'តំបន់ C' : 'តំបន់ D'}) <br />
                <span className="font-bold text-slate-800 font-display">កម្រិតហានិភ័យ៖</span> {getRiskTranslation(activeZone.riskLevel)} <br />
                <span className="font-bold text-slate-800 font-display">ចំនួនបុគ្គលិកអប្បបរមាដែលត្រូវការ៖</span> {activeZone.minStaffRequired} នាក់
              </div>
            </div>

            {/* Staff checklist list */}
            <div className="overflow-y-auto flex-1 py-2 pr-1 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">បញ្ជីឈ្មោះបុគ្គលិកសាលារៀន</h4>
              {staff.filter((member) => member.role !== 'Management').map((member) => {
                const isSelected = currentlyAssignedIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleStaff(member.id)}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-xs ${
                        member.role === 'Security' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        member.role === 'Management' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-display">
                          {member.name}
                          <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${
                            member.role === 'Security' ? 'bg-rose-50 text-rose-600' :
                            member.role === 'Management' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {getRoleTranslation(member.role)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          ម៉ោងធ្វើការ៖ {member.workingHours} • ភារកិច្ចក្នុងសប្តាហ៍នេះ
                        </div>
                      </div>
                    </div>

                    {/* Selector Circle */}
                    <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer control */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs mt-4">
              <span className="text-slate-500 font-medium">
                បានចាត់តាំងបច្ចុប្បន្ន៖ <span className="font-bold text-indigo-600">{currentlyAssignedIds.length}</span> / {activeZone.minStaffRequired} នាក់ដែលត្រូវការ
              </span>
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md uppercase tracking-wider font-display cursor-pointer transition-colors"
              >
                រក្សាទុកការចាត់តាំង
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
