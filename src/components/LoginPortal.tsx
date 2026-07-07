import React, { useState } from 'react';
import { StaffProfile } from '../types';
import { Lock, Unlock, Users, Shield, Key, Eye, EyeOff, AlertTriangle, HelpCircle } from 'lucide-react';

interface LoginPortalProps {
  staff: StaffProfile[];
  onLoginSuccess: (staffId: string, isAdminMode: boolean) => void;
}

export default function LoginPortal({ staff, onLoginSuccess }: LoginPortalProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);

  // Filter staff into Management (Admin) and general staff
  const adminStaff = staff.filter(s => s.role === 'Management');
  const regularStaff = staff.filter(s => s.role !== 'Management');

  const handleProfileClick = (member: StaffProfile) => {
    setSelectedStaff(member);
    setPinInput('');
    setPinError(null);

    // If it's general staff, login instantly without password
    if (member.role !== 'Management') {
      onLoginSuccess(member.id, false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput.toLowerCase() === 'admin') {
      if (selectedStaff) {
        onLoginSuccess(selectedStaff.id, true);
      }
    } else {
      setPinError('លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! (Default is 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl" />

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        
        {/* App Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center text-white font-bold text-3xl shadow-xl shadow-indigo-600/20 border border-indigo-400/20 mb-2">
            <Shield className="w-8 h-8 animate-pulse text-indigo-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-display uppercase">
            ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងកាលវិភាគល្បាត
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 font-medium tracking-widest uppercase max-w-lg mx-auto leading-relaxed">
            Staff Duty Roster & Security Patrol System
            <span className="block text-[11px] text-indigo-400 mt-1 font-bold">សាលារៀនសុវណ្ណភូមិទួលពង្រ (Sovannaphumi School)</span>
          </p>
        </div>

        {/* Access Role Selection Matrix */}
        {!selectedStaff || selectedStaff.role !== 'Management' ? (
          <div className="bg-slate-850/90 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 backdrop-blur-md">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-slate-100">សូមជ្រើសរើសគណនីរបស់អ្នកដើម្បីចូលប្រើប្រាស់</h2>
              <p className="text-xs text-slate-400">ប្រព័ន្ធនឹងផ្ទៀងផ្ទាត់សិទ្ធិ (Role-Based Access) របស់លោកអ្នកបន្ទាប់ពីជ្រើសរើសរួច</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* ADMIN / MANAGEMENT SECTION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2.5">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-black uppercase text-rose-400 tracking-wider font-display">
                    ១. គណៈគ្រប់គ្រង / អភិបាល (Admin / Management)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  មានសិទ្ធិ៖ បង្កើត QR Code, កំណត់កូអរដោនេទីតាំង, មើលរបាយការណ៍ទាំងអស់, និងកែប្រែកាលវិភាគការងារ។
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {adminStaff.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleProfileClick(member)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 hover:bg-rose-950/20 border border-slate-750 hover:border-rose-800/40 text-left transition-all duration-200 cursor-pointer group hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                          💼
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-200 group-hover:text-rose-300 transition-colors">{member.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400/80 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-900/40">
                        <Key className="w-3 h-3 animate-pulse" />
                        <span>បញ្ចូល PIN</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STAFF / TEACHERS & SECURITY SECTION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2.5">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider font-display">
                    ២. បុគ្គលិកទូទៅ / ភ្នាក់ងារ (General Staff / Officers)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  មានសិទ្ធិ៖ ចូលមើលកាលវិភាគ (Roster) ផ្ទាល់ខ្លួន, ស្កែន QR Check-In និងរាយការណ៍ឧប្បត្តិហេតុ។
                </p>
                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-750">
                  {regularStaff.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleProfileClick(member)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 hover:bg-emerald-950/20 border border-slate-750 hover:border-emerald-800/40 text-left transition-all duration-200 cursor-pointer group hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {member.role === 'Security' ? '👮' : '🧑‍🏫'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-200 group-hover:text-emerald-300 transition-colors">{member.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{member.role === 'Security' ? '👮 ភ្នាក់ងារសន្តិសុខសាលា' : '🧑‍🏫 លោកគ្រូ/អ្នកគ្រូប្រចាំការ'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-900/40">
                        <span>ចូលផ្ទាល់ 🔓</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Hint Box */}
            <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-4 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs text-indigo-300">ព័ត៌មានជំនួយសម្រាប់ការសាកល្បង៖</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ដើម្បីសាកល្បងសិទ្ធិជា <span className="font-bold text-indigo-300">Admin</span> សូមចុចយកគណនីក្នុងក្រុមទី ១ រួចបញ្ចូលលេខកូដសម្ងាត់ <span className="font-mono font-bold bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded">1234</span> ឬ <span className="font-mono font-bold bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded">admin</span>។ គណនីក្នុងក្រុមទី ២ អាចចុចចូលដោយសេរីដោយពុំបាច់វាយលេខកូដឡើយ។
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ADMIN PASSWORD INPUT MODAL */
          <div className="max-w-md mx-auto bg-slate-850 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
            
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl">
                💼
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider">ផ្ទៀងផ្ទាត់សិទ្ធិគ្រប់គ្រង</p>
                <h3 className="font-extrabold text-base text-slate-100">{selectedStaff.name}</h3>
                <p className="text-xs text-slate-400">សូមបញ្ចូលលេខកូដសម្ងាត់ Admin ដើម្បីអនុញ្ញាតការចូលប្រើប្រាស់</p>
              </div>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-5 mt-6">
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  លេខកូដសម្ងាត់ (ADMIN PASSCODE)៖
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-center text-xl font-bold font-mono text-white tracking-widest focus:ring-2 focus:ring-rose-500 focus:bg-slate-750 focus:border-rose-500 outline-hidden transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-[11px] text-rose-400 font-bold text-center mt-1.5 flex items-center justify-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="bg-slate-800/50 border border-slate-750 p-3 rounded-xl text-[10px] text-slate-400 text-center">
                លេខកូដសម្ងាត់ Admin លំនាំដើមគឺ៖ <span className="font-mono font-bold bg-slate-700 px-1.5 py-0.5 rounded text-white">1234</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl border border-slate-700 transition-all text-center cursor-pointer"
                >
                  ត្រឡប់ក្រោយ (Back)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all active:scale-95 text-center cursor-pointer"
                >
                  ផ្ទៀងផ្ទាត់ (Verify PIN)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer legal credits */}
        <div className="text-center">
          <p className="text-[10px] text-slate-500">
            © {new Date().getFullYear()} Swanbhumi Tuol Pongro School. រក្សាសិទ្ធិគ្រប់យ៉ាង។
          </p>
          <p className="text-[9px] text-indigo-500/60 font-mono mt-0.5">
            Cloud Sync Powered by Google Cloud Run & Firebase Firestore
          </p>
        </div>

      </div>
    </div>
  );
}
