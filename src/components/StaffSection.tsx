import React, { useState } from 'react';
import { StaffProfile, StaffRole } from '../types';
import { Search, Plus, UserCheck, Shield, BookOpen, Trash2, Edit, X, Phone, Mail, Clock } from 'lucide-react';

interface StaffSectionProps {
  staff: StaffProfile[];
  onAddStaff: (newStaff: Omit<StaffProfile, 'id'>) => void;
  onEditStaff: (updated: StaffProfile) => void;
  onDeleteStaff: (id: string) => void;
  getStaffDutyCount: (id: string) => number;
}

export default function StaffSection({
  staff,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  getStaffDutyCount,
}: StaffSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Teacher');
  const [workingHours, setWorkingHours] = useState('07:30 - 15:30');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maxDuties, setMaxDuties] = useState(4);

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAddForm = () => {
    setEditingStaff(null);
    setName('');
    setRole('Teacher');
    setWorkingHours('07:30 - 15:30');
    setEmail('');
    setPhone('');
    setMaxDuties(4);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (s: StaffProfile) => {
    setEditingStaff(s);
    setName(s.name);
    setRole(s.role);
    setWorkingHours(s.workingHours);
    setEmail(s.email);
    setPhone(s.phone);
    setMaxDuties(s.maxWeeklyDuties);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStaff) {
      onEditStaff({
        id: editingStaff.id,
        name,
        role,
        workingHours,
        email,
        phone,
        maxWeeklyDuties: maxDuties,
      });
    } else {
      onAddStaff({
        name,
        role,
        workingHours,
        email,
        phone,
        maxWeeklyDuties: maxDuties,
      });
    }
    setIsFormOpen(false);
  };

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case 'Security':
        return <Shield className="w-4 h-4 text-rose-600" />;
      case 'Management':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'Teacher':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getRoleTranslation = (role: StaffRole) => {
    switch (role) {
      case 'Security': return 'ភ្នាក់ងារសន្តិសុខ';
      case 'Management': return 'គណៈគ្រប់គ្រង';
      case 'Teacher': return 'គ្រូបង្រៀន';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកបុគ្គលិកតាមរយៈឈ្មោះ ឬអុីមែល..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white text-slate-700 font-bold font-display uppercase tracking-wider"
          >
            <option value="All">តួនាទីទាំងអស់</option>
            <option value="Teacher">គ្រូបង្រៀន</option>
            <option value="Management">គណៈគ្រប់គ្រង</option>
            <option value="Security">ភ្នាក់ងារសន្តិសុខ</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display uppercase tracking-wider text-xs px-4 py-2 rounded-md cursor-pointer transition-all active:scale-98 shadow-sm"
        >
          <Plus className="w-4 h-4" /> បន្ថែមគណនីបុគ្គលិក
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => {
          const dutyCount = getStaffDutyCount(member.id);
          const percent = Math.min((dutyCount / member.maxWeeklyDuties) * 100, 100);
          const isOverloaded = dutyCount > member.maxWeeklyDuties;

          return (
            <div
              key={member.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 shadow-xs transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Role badge and name */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-wider border ${
                      member.role === 'Security' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      member.role === 'Management' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {getRoleIcon(member.role)}
                      {getRoleTranslation(member.role)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base font-display">
                      {member.name}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditForm(member)}
                      title="កែសម្រួលព័ត៌មានបុគ្គលិក"
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-md cursor-pointer transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteStaff(member.id)}
                      title="លុបព័ត៌មានបុគ្គលិក"
                      className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ម៉ោងធ្វើការ៖ {member.workingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                </div>
              </div>

              {/* Workload Progress */}
              <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-display">បន្ទុកភារកិច្ចប្រចាំសប្តាហ៍</span>
                  <span className={`font-extrabold font-display text-xs ${isOverloaded ? 'text-rose-600' : 'text-slate-700'}`}>
                    {dutyCount} / {member.maxWeeklyDuties} អតិបរមា
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all duration-500 ${
                      isOverloaded ? 'bg-rose-500' :
                      percent >= 100 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {isOverloaded && (
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider text-right font-display">
                    ⚠️ លើសបន្ទុកការងារគ្រោះថ្នាក់
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">រកមិនឃើញគណនីបុគ្គលិកណាដែលត្រូវនឹងលក្ខខណ្ឌដែលអ្នកស្វែងរកឡើយ។</p>
        </div>
      )}

      {/* Staff Editor Slide-over / Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 font-display uppercase tracking-tight">
              {editingStaff ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-slate-800" />}
              {editingStaff ? 'កែសម្រួលគណនីបុគ្គលិក' : 'បន្ថែមគណនីបុគ្គលិកថ្មី'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ឈ្មោះពេញ</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ លោកគ្រូ សុភ័ក្រ្ត ជួប"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">តួនាទី</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    <option value="Teacher">គ្រូបង្រៀន</option>
                    <option value="Management">គណៈគ្រប់គ្រង</option>
                    <option value="Security">ភ្នាក់ងារសន្តិសុខ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ភារកិច្ចអតិបរមា / សប្តាហ៍</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={maxDuties}
                    onChange={(e) => setMaxDuties(parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ម៉ោងធ្វើការផ្លូវការ</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ 07:30 - 16:30"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">អាសយដ្ឋានអុីមែល</label>
                <input
                  type="email"
                  required
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">លេខទូរស័ព្ទ</label>
                <input
                  type="text"
                  required
                  placeholder="+855 (012) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider font-display text-slate-600 hover:text-slate-800 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider font-display text-white bg-indigo-600 hover:bg-indigo-500 rounded-md cursor-pointer transition-colors"
                >
                  {editingStaff ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'បន្ថែមបុគ្គលិក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
