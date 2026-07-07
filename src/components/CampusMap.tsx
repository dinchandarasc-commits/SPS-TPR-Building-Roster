import React from 'react';
import { DutyZone, RosterEntry, StaffProfile } from '../types';
import { Shield, MapPin, Users, Calendar, User, HelpCircle } from 'lucide-react';

interface CampusMapProps {
  roster: RosterEntry[];
  staff: StaffProfile[];
  zones: DutyZone[];
  escalationAlerts: { id: string; entryId: string; msg: string; solved: boolean }[];
}

export default function CampusMap({ roster, staff, zones, escalationAlerts }: CampusMapProps) {
  const getZoneStatusColor = (zoneId: string) => {
    // Check unresolved escalation alerts
    const hasUnresolvedAlert = escalationAlerts.some(
      a => !a.solved && roster.find(r => r.id === a.entryId)?.zoneId === zoneId
    );
    if (hasUnresolvedAlert) return 'red';

    // Find entries for this zone
    const entries = roster.filter(r => r.zoneId === zoneId);
    if (entries.length === 0) return 'red';

    // Check if any has assigned staff
    const hasStaff = entries.some(e => e.staffIds && e.staffIds.length > 0);
    if (!hasStaff) return 'red';

    return 'green';
  };

  const getAssignedStaffNames = (zoneId: string) => {
    // Collect unique staff assigned to this zone across any day or shift
    const staffIds = new Set<string>();
    roster.filter(r => r.zoneId === zoneId).forEach(r => {
      r.staffIds.forEach(id => staffIds.add(id));
    });

    if (staffIds.size === 0) return '';
    return Array.from(staffIds)
      .map(id => staff.find(s => s.id === id)?.name || '')
      .filter(Boolean)
      .map(name => name.replace(' (ភ្នាក់ងារសន្តិសុខ)', '').replace('លោកគ្រូ ', '').replace('អ្នកគ្រូ ', ''))
      .join(', ');
  };

  const campusBuildings = [
    {
      id: 'cb-1',
      name: 'ខ្លោងទ្វារធំមុខសាលា & ប៉ុស្តិ៍យាម',
      primaryZoneId: 'z-d1',
      icon: Shield,
      description: 'ច្រកចូលធំសម្រាប់ការចេញចូលសិស្សានុសិស្ស និងភ្ញៀវ។ ហានិភ័យចរាចរណ៍ខ្ពស់។',
    },
    {
      id: 'cb-2',
      name: 'ទីលានកីឡា & សួនកុមារធំ',
      primaryZoneId: 'z-a3',
      icon: MapPin,
      description: 'កន្លែងរត់លេង និងលេងឧបករណ៍សកម្ម។ ងាយមានគ្រោះថ្នាក់ដួល ឬប៉ះទង្គិច។',
    },
    {
      id: 'cb-3',
      name: 'អាហារដ្ឋានកណ្តាល (Cafeteria)',
      primaryZoneId: 'z-a4',
      icon: Users,
      description: 'ទីធ្លាទទួលទានអាហារកណ្តាល។ កកកុញខ្លាំងពេលសម្រាក និងហានិភ័យឥដ្ឋសើម។',
    },
    {
      id: 'cb-4',
      name: 'អគារសិក្សា & របៀងជាន់ខ្ពស់',
      primaryZoneId: 'z-b5',
      icon: Calendar,
      description: 'បន្ទប់ទឹក និងជណ្តើរជាន់ខ្ពស់បំផុត (ជាន់ទី៥)។ ជាតំបន់ដាច់ស្រយាល ងាយលួចជក់បារី។',
    },
    {
      id: 'cb-5',
      name: 'ច្រកចេញក្រោយ & ចំណតឡាន',
      primaryZoneId: 'z-d2',
      icon: User,
      description: 'ច្រកទ្វារក្រោយសម្រាប់ចំណតឡានបុគ្គលិក និងម៉ូតូសិស្សធំៗ។',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs" id="campus-security-live-map">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600 animate-bounce" />
            ផែនទីសន្តិសុខ និងតំបន់យាមកាមប្រចាំការ (Interactive Security & Duty Live Map)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            បង្ហាញស្ថានភាពយាមកាមជាក់ស្តែងនៃចំណុចអគារគន្លឹះទាំង ៥ របស់សាលារៀន។ ពណ៌ផ្លាស់ប្តូរដោយស្វ័យប្រវត្តិតាមការ Check-In និងការប្រកាសអាសន្ន។
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="text-emerald-700">🟢 មានមនុស្សយាមត្រឹមត្រូវ</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
            <span className="text-rose-700">🔴 អត់មនុស្សឈរជើង / ត្រូវការបន្ទាន់</span>
          </span>
        </div>
      </div>

      {/* Interactive Grid Map Blueprint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {campusBuildings.map((b) => {
          const isGreen = getZoneStatusColor(b.primaryZoneId) === 'green';
          const assignedNames = getAssignedStaffNames(b.primaryZoneId);
          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:shadow-md ${
                isGreen
                  ? 'bg-emerald-50/35 border-emerald-200/60 hover:bg-emerald-50/65'
                  : 'bg-rose-50/50 border-rose-200/60 hover:bg-rose-50 animate-pulse'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isGreen
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isGreen ? '🟢 សុវត្ថិភាព' : '🔴 ត្រូវការជំនួយ'}
                  </span>
                  <b.icon className={`w-4 h-4 ${isGreen ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800 mt-3 font-display leading-tight">{b.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">{b.description}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100/60 flex flex-col gap-0.5 text-[9px] sm:text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">បុគ្គលិកយាមល្បាត៖</span>
                <span className={`font-bold ${isGreen ? 'text-slate-700' : 'text-rose-600 italic'}`}>
                  {assignedNames ? `👤 ${assignedNames}` : '⚠️ គ្មានអ្នកយាមប្រចាំការ'}
                </span>
              </div>

              {/* Quick dispatch alert indicator */}
              {!isGreen && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
