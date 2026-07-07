import React from 'react';
import { IncidentReport, DutyZone } from '../types';
import { BarChart3, ShieldCheck, AlertTriangle, Hammer, CheckSquare, Sparkles, Clock, MapPin, Eye, ExternalLink } from 'lucide-react';

interface AnalyticsViewProps {
  incidents: IncidentReport[];
  zones: DutyZone[];
  onUpdateIncidentStatus: (incidentId: string, newStatus: 'Reported' | 'In-Investigation' | 'Resolved') => void;
}

export default function AnalyticsView({
  incidents,
  zones,
  onUpdateIncidentStatus
}: AnalyticsViewProps) {
  // Aggregate KPIs
  const totalIncidents = incidents.length;
  const pendingIncidents = incidents.filter(i => i.status === 'Reported').length;
  const inInvestigation = incidents.filter(i => i.status === 'In-Investigation').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length;

  // 1. Calculate incident count by Building Zone Group
  const playgroundCount = incidents.filter(i => i.zoneId === 'z-a3' || i.zoneId === 'z-a1').length;
  const cafeteriaCount = incidents.filter(i => i.zoneId === 'z-a4').length;
  const restroomCount = incidents.filter(i => i.zoneId.startsWith('z-b')).length;
  const gatesCount = incidents.filter(i => i.zoneId.startsWith('z-d')).length;

  const totalCalculated = Math.max(1, playgroundCount + cafeteriaCount + restroomCount + gatesCount);

  const playgroundPct = Math.round((playgroundCount / totalCalculated) * 100);
  const cafeteriaPct = Math.round((cafeteriaCount / totalCalculated) * 100);
  const restroomPct = Math.round((restroomCount / totalCalculated) * 100);
  const gatesPct = Math.round((gatesCount / totalCalculated) * 100);

  // 2. Calculate by Floor Level
  const groundFloorCount = incidents.filter(i => {
    const zone = zones.find(z => z.id === i.zoneId);
    return zone?.floor === 'Ground';
  }).length;

  const highFloorCount = incidents.filter(i => {
    const zone = zones.find(z => z.id === i.zoneId);
    return zone?.floor !== 'Ground' && zone?.floor !== 'N/A';
  }).length;

  const otherFloorCount = Math.max(0, totalIncidents - groundFloorCount - highFloorCount);
  const totalFloorCalculated = Math.max(1, totalIncidents);

  const groundFloorPct = Math.round((groundFloorCount / totalFloorCalculated) * 100);
  const highFloorPct = Math.round((highFloorCount / totalFloorCalculated) * 100);
  const otherFloorPct = Math.round((otherFloorCount / totalFloorCalculated) * 100);

  // Dynamic recommendations based on actual safety issues
  const recommendations = [
    {
      id: 'rec-1',
      title: 'តម្លើងរបាំងកៅស៊ូការពារ និងកម្រាលប្រឆាំងការរអិលនៅសួនកុមារធំ',
      condition: playgroundCount > 0,
      zoneName: 'សួនកុមារធំ (Playground)',
      threatLevel: 'High',
      desc: 'ផ្អែកលើទិន្នន័យគ្រោះថ្នាក់៖ មានសិស្សានុសិស្សរអិលជើងដួល និងប៉ះទង្គិចញឹកញាប់។ សាលាគួរតែតម្លើងកម្រាលជ័រទន់ការពារនៅខាងក្រោមឧបករណ៍លេង និងបន្ថែមរបាំងការពារកៅស៊ូតាមជ្រុងដែកមុនខែក្រោយ។',
      action: 'បន្ថែមរបាំងកៅស៊ូការពារ និងឧបករណ៍សម្រូបកម្លាំងដួល'
    },
    {
      id: 'rec-2',
      title: 'តម្លើងឧបករណ៍ចាប់ផ្សែង និងបង្កើនការយាមល្បាតនៅជាន់ខ្ពស់បំផុត',
      condition: restroomCount > 0,
      zoneName: 'ច្រករបៀងបន្ទប់ទឹកជាន់ទី៤ និងទី៥',
      threatLevel: 'Medium',
      desc: 'ផ្អែកលើទិន្នន័យ៖ របៀង និងបន្ទប់ទឹកជាន់ខ្ពស់ជាតំបន់ដាច់ស្រយាល ងាយនឹងមានសិស្សានុសិស្សបង្កជម្លោះ ឬជក់បារីអេឡិចត្រូនិច។ សាលាគួរតែតម្លើងឧបករណ៍សញ្ញាផ្សែង និងបន្ថែមភ្នាក់ងារយាមល្បាតប្រចាំការ ២នាក់នៅម៉ោងសម្រាក។',
      action: 'បន្ថែមភ្នាក់ងារយាមល្បាត និងប្រព័ន្ធសញ្ញាផ្សែង'
    },
    {
      id: 'rec-3',
      title: 'ដាក់ស្លាកសញ្ញាព្រមានឥដ្ឋសើម និងម៉ាស៊ីនសម្ងួតនៅអាហារដ្ឋាន',
      condition: cafeteriaCount > 0,
      zoneName: 'អាហារដ្ឋានកណ្តាល (Cafeteria Hall)',
      threatLevel: 'Low',
      desc: 'ផ្អែកលើទិន្នន័យ៖ មានសិស្សរអិលដួលដោយសារឥដ្ឋសើមអំឡុងពេលសម្អាត។ សាលាត្រូវធានាថាមានការដាក់ស្លាកសញ្ញាពណ៌លឿងព្រមានឱ្យបានទូលំទូលាយ និងប្រើប្រាស់ម៉ាស៊ីនផ្លុំខ្យល់ឱ្យស្ងួតលឿន។',
      action: 'ដាក់ស្លាកព្រមានឥដ្ឋសើម និងម៉ាស៊ីនផ្លុំខ្យល់'
    }
  ];

  return (
    <div className="space-y-6" id="analytics-operations-view">
      {/* Analytics KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider font-display">សរុបករណីគ្រោះថ្នាក់ដែលបានរាយការណ៍</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900 font-display">{totalIncidents} ករណី</span>
            <span className="text-xs font-semibold text-rose-600">សរុបសរុប</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider font-display">ករណីថ្មី (រង់ចាំការពិនិត្យ)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-amber-600 font-display">{pendingIncidents} ករណី</span>
            <span className="text-xs font-semibold text-slate-400">Reported</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider font-display font-display">កំពុងស៊ើបអង្កេតដោះស្រាយ</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-indigo-600 font-display">{inInvestigation} ករណី</span>
            <span className="text-xs font-semibold text-indigo-400">Investigating</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider font-display">បានដោះស្រាយជោគជ័យ</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-600 font-display">{resolvedIncidents} ករណី</span>
            <span className="text-xs font-semibold text-emerald-500">Resolved</span>
          </div>
        </div>
      </div>

      {/* Main Aggregations (Hotspots Analytics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hotspots By Building Zone */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 font-display uppercase tracking-wide">
                ១. ស្ថិតិគ្រោះថ្នាក់តាមតំបន់/អគារ (Incident Hotspots by Building)
              </h3>
              <p className="text-[10px] text-slate-400">បង្ហាញភាគរយអត្រាគ្រោះថ្នាក់ដែលកើតឡើងតាមតំបន់នីមួយៗ</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Building 1: Playground */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🎡 ទីលានកីឡា & សួនកុមារធំ</span>
                <span>{playgroundCount} ករណី ({playgroundPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${playgroundPct}%` }}
                ></div>
              </div>
            </div>

            {/* Building 2: Restrooms / High floor corridors */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🚻 ច្រករបៀងបន្ទប់ទឹក & អគារសិក្សា</span>
                <span>{restroomCount} ករណី ({restroomPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${restroomPct}%` }}
                ></div>
              </div>
            </div>

            {/* Building 3: Cafeteria */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🍽️ អាហារដ្ឋានកណ្តាល (Cafeteria)</span>
                <span>{cafeteriaCount} ករណី ({cafeteriaPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${cafeteriaPct}%` }}
                ></div>
              </div>
            </div>

            {/* Building 4: Entrance & Parking */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🚪 ខ្លោងទ្វារ និងចំណតរថយន្ត</span>
                <span>{gatesCount} ករណី ({gatesPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${gatesPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Hotspots By Floor Level */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 font-display uppercase tracking-wide">
                ២. ស្ថិតិគ្រោះថ្នាក់តាមកម្ពស់ជាន់ (Incident Hotspots by Floor Level)
              </h3>
              <p className="text-[10px] text-slate-400">អគារជាន់ខ្ពស់ធៀបនឹងជាន់ផ្ទាល់ដី និងកន្លែងលេងក្រៅអគារ</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Ground Level */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🧱 ជាន់ផ្ទាល់ដី & ទីធ្លាក្រៅអគារ (Ground Floor / Outside)</span>
                <span>{groundFloorCount} ករណី ({groundFloorPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${groundFloorPct}%` }}
                ></div>
              </div>
            </div>

            {/* Upper Levels */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🏢 ជាន់សិក្សាខាងលើ (ជាន់ទី ១ ដល់ ទី ៥) (Upper Floors)</span>
                <span>{highFloorCount} ករណី ({highFloorPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${highFloorPct}%` }}
                ></div>
              </div>
            </div>

            {/* Other N/A */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>🌐 កន្លែងផ្សេងទៀត/មិនទាន់កំណត់ (Other / General)</span>
                <span>{otherFloorCount} ករណី ({otherFloorPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${otherFloorPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI SAFETY RECOMENDATIONS ENGINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 font-display uppercase tracking-wide">
                សេចក្តីណែនាំដើម្បីកែលម្អសុវត្ថិភាពសាលា (Actionable AI Safety Recommendations)
              </h3>
              <p className="text-[10px] text-slate-400">ការណែនាំស្វ័យប្រវត្តចំពោះការបន្ថែមរបាំងសុវត្ថិភាព ឬបង្កើនចំនួនអ្នកយាមនៅចំណុចហានិភ័យ</p>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase font-mono">Auto Safety Advisor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map(r => (
            <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    {r.zoneName}
                  </span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    r.threatLevel === 'High' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                    r.threatLevel === 'Medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    កម្រិតហានិភ័យ៖ {r.threatLevel}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 font-display leading-snug pt-1">{r.title}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{r.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-250/50 flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold uppercase">
                <Hammer className="w-3.5 h-3.5" />
                <span>សកម្មភាព៖ {r.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INCIDENT MANAGEMENT DESK (TABLE) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 font-display uppercase tracking-wide">
                មជ្ឈមណ្ឌលដោះស្រាយគ្រោះថ្នាក់ (Live School Incident & Safety Action Desk)
              </h3>
              <p className="text-[10px] text-slate-400">ពិនិត្យមើលរូបថត ទីតាំង ព័ត៌មានលម្អិត និងធ្វើបច្ចុប្បន្នភាពស្ថានភាពដោះស្រាយរបស់របាយការណ៍</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-black text-slate-400">SAFETY LOGS</span>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            🎉 គ្មានព័ត៌មានរបាយការណ៍គ្រោះថ្នាក់ណាមួយត្រូវបានរាយការណ៍ឡើយ! សាលារៀនមានសុវត្ថិភាពទាំងស្រុង។
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">រូបភាពគំរូ</th>
                  <th className="py-2.5 px-3">ទីតាំង និងពេលវេលា</th>
                  <th className="py-2.5 px-3">អ្នករាយការណ៍</th>
                  <th className="py-2.5 px-3">រៀបរាប់ពីហេតុការណ៍</th>
                  <th className="py-2.5 px-3">កម្រិតគ្រោះថ្នាក់</th>
                  <th className="py-2.5 px-3">ស្ថានភាព</th>
                  <th className="py-2.5 px-3">សកម្មភាពបញ្ជា</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {incidents.map(i => {
                  const zone = zones.find(z => z.id === i.zoneId);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/65 transition-all">
                      {/* Photo preview */}
                      <td className="py-3 px-3">
                        {i.photoUrl ? (
                          <div className="relative group/photo">
                            <img
                              src={i.photoUrl}
                              alt="Incident"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs cursor-zoom-in group-hover/photo:scale-105 transition-all"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-bold">
                            គ្មានរូប
                          </div>
                        )}
                      </td>

                      {/* Location & Time */}
                      <td className="py-3 px-3 space-y-1">
                        <p className="font-extrabold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{zone?.name || 'មិនស្គាល់ទីតាំង'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{i.timestamp}</span>
                        </p>
                      </td>

                      {/* Reporter */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          👤 {i.reporterName}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="text-slate-600 leading-relaxed font-medium line-clamp-2" title={i.description}>
                          {i.description}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          i.severity === 'High' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                          i.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {i.severity === 'High' ? '🔴 ធ្ងន់ធ្ងរ' : i.severity === 'Medium' ? '🟡 មធ្យម' : '🟢 ធម្មតា'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          i.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          i.status === 'In-Investigation' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {i.status === 'Resolved' ? 'ដោះស្រាយរួចរាល់' :
                           i.status === 'In-Investigation' ? 'កំពុងស៊ើបអង្កេត' : 'បានរាយការណ៍'}
                        </span>
                      </td>

                      {/* Action buttons (Dropdown or button toggles) */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1.5 w-28">
                          <select
                            value={i.status}
                            onChange={(e) => onUpdateIncidentStatus(i.id, e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 text-[10px] font-bold px-1.5 py-1 rounded cursor-pointer text-slate-700 hover:bg-slate-100 focus:outline-hidden"
                          >
                            <option value="Reported">🔴 បានរាយការណ៍</option>
                            <option value="In-Investigation">🔵 កំពុងស៊ើបអង្កេត</option>
                            <option value="Resolved">🟢 ដោះស្រាយរួច</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
