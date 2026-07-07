import React, { useState } from 'react';
import { DutyZone, ZoneType } from '../types';
import { Search, Plus, MapPin, AlertTriangle, Layers, Edit, Trash2, X, Users, QrCode, Printer } from 'lucide-react';

interface ZoneSectionProps {
  zones: DutyZone[];
  onAddZone: (newZone: Omit<DutyZone, 'id'>) => void;
  onEditZone: (updated: DutyZone) => void;
  onDeleteZone: (id: string) => void;
}

export default function ZoneSection({
  zones,
  onAddZone,
  onEditZone,
  onDeleteZone,
}: ZoneSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DutyZone | null>(null);
  
  // Printable QR Modal state
  const [activeQrZone, setActiveQrZone] = useState<DutyZone | null>(null);

  // Form states
  const [zoneType, setZoneType] = useState<ZoneType>('Zone A');
  const [name, setName] = useState('');
  const [floor, setFloor] = useState<DutyZone['floor']>('Ground');
  const [riskLevel, setRiskLevel] = useState<DutyZone['riskLevel']>('Medium');
  const [minStaff, setMinStaff] = useState(1);
  const [description, setDescription] = useState('');

  const floors: DutyZone['floor'][] = ['Ground', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor', '6th Floor', '3rd-6th Floors'];

  const getFloorTranslation = (fl: string) => {
    switch (fl) {
      case 'Ground': return 'ជាន់ផ្ទាល់ដី';
      case '1st Floor': return 'ជាន់ទី ១';
      case '2nd Floor': return 'ជាន់ទី ២';
      case '3rd Floor': return 'ជាន់ទី ៣';
      case '4th Floor': return 'ជាន់ទី ៤';
      case '5th Floor': return 'ជាន់ទី ៥';
      case '6th Floor': return 'ជាន់ទី ៦';
      case '3rd-6th Floors': return 'ជាន់ទី ៣ ដល់ទី ៦';
      default: return 'ក្រៅអគារ';
    }
  };

  const handlePrintQr = (zone: DutyZone) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${zone.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              background: white;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="max-w-md mx-auto border-4 border-dashed border-indigo-600 p-8 rounded-2xl text-center space-y-6">
            <div class="flex items-center justify-center gap-2">
              <span class="w-8 h-8 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-lg">S</span>
              <div class="text-left">
                <h1 class="text-xs font-bold text-slate-800 uppercase tracking-wider">សាលារៀនសុវណ្ណភូមិទួលពង្រ</h1>
                <p class="text-[9px] text-slate-500 uppercase tracking-widest">School Security Patrol QR Code</p>
              </div>
            </div>
            
            <hr class="border-slate-200" />
            
            <div class="space-y-1">
              <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                ${zone.zoneType === 'Zone A' ? 'တំបន់ A' : zone.zoneType === 'Zone B' ? 'តំបន់ B' : 'តំបន់ D'} • ${getFloorTranslation(zone.floor)}
              </span>
              <h2 class="text-2xl font-extrabold text-slate-900 pt-2">${zone.name}</h2>
              <p class="text-xs text-slate-500 max-w-xs mx-auto pt-1 leading-relaxed">${zone.description}</p>
            </div>
            
            <div class="flex justify-center py-4">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ZONE_${zone.id}&color=4f46e5" class="w-56 h-56 border border-slate-200 p-2 rounded-xl bg-white shadow-sm" />
            </div>
            
            <div class="space-y-2">
              <p class="text-[11px] text-slate-600 font-bold leading-relaxed">
                👉 សូមបុគ្គលិកប្រចាំការស្កែនកូដ QR នេះដើម្បីស្កែន Check-In ចូលយាមល្បាតតំបន់ហានិភ័យ។
              </p>
              <div class="text-[9px] text-slate-400 font-mono uppercase tracking-widest pt-2">
                ZONE ID: ${zone.id}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getRiskTranslation = (risk: string) => {
    switch (risk) {
      case 'High': return 'ហានិភ័យខ្ពស់';
      case 'Medium': return 'ហានិភ័យមធ្យម';
      case 'Low': return 'ហានិភ័យទាប';
      default: return risk;
    }
  };

  const getZoneTypeTranslation = (type: string) => {
    switch (type) {
      case 'Zone A': return 'តំបន់ A (ជាន់ផ្ទាល់ដី)';
      case 'Zone B': return 'តំបន់ B (ជាន់ទី ១)';
      case 'Zone C': return 'តំបន់ C (ជាន់ទី ២)';
      case 'Zone D': return 'តំបន់ D (ជាន់ទី ៣ ដល់ទី ៦)';
      default: return type;
    }
  };

  const filteredZones = zones.filter((z) => {
    const matchesSearch = z.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          z.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || z.zoneType === selectedType;
    const matchesFloor = selectedFloor === 'All' || z.floor === selectedFloor;
    return matchesSearch && matchesType && matchesFloor;
  });

  const handleOpenAddForm = () => {
    setEditingZone(null);
    setZoneType('Zone A');
    setName('');
    setFloor('Ground');
    setRiskLevel('Medium');
    setMinStaff(1);
    setDescription('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (z: DutyZone) => {
    setEditingZone(z);
    setZoneType(z.zoneType);
    setName(z.name);
    setFloor(z.floor);
    setRiskLevel(z.riskLevel);
    setMinStaff(z.minStaffRequired);
    setDescription(z.description);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingZone) {
      onEditZone({
        id: editingZone.id,
        zoneType,
        name,
        floor,
        riskLevel,
        minStaffRequired: minStaff,
        description,
      });
    } else {
      onAddZone({
        zoneType,
        name,
        floor,
        riskLevel,
        minStaffRequired: minStaff,
        description,
      });
    }
    setIsFormOpen(false);
  };

  const getRiskColor = (risk: DutyZone['riskLevel']) => {
    switch (risk) {
      case 'High':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'Medium':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Low':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 5-Story Floor Visual Selector */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-display">
          <Layers className="w-4 h-4 text-slate-400 animate-pulse" /> ប្រព័ន្ធរុករកទីតាំងតាមជាន់អគារសិក្សា
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFloor('All')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all border font-display ${
              selectedFloor === 'All'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            គ្រប់ជាន់ទាំងអស់
          </button>
          {floors.map((fl) => {
            const count = zones.filter(z => z.floor === fl).length;
            const isSelected = selectedFloor === fl;
            return (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all border font-display flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{getFloorTranslation(fl)}</span>
                <span className={`inline-flex items-center justify-center px-1.5 py-0.25 rounded-sm text-[9px] font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតំបន់តាមរយៈឈ្មោះ ឬការពិពណ៌នា..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white text-slate-700 font-bold font-display uppercase tracking-wider"
          >
            <option value="All">ប្រភេទតំបន់ទាំងអស់</option>
            <option value="Zone A">តំបន់ A: ទីធ្លារួម (ជាន់ផ្ទាល់ដី)</option>
            <option value="Zone B">តំបន់ B: ទីធ្លារួម (ជាន់ទី ១)</option>
            <option value="Zone C">តំបន់ C: ទីធ្លារួម (ជាន់ទី ២)</option>
            <option value="Zone D">តំបន់ D: ទីធ្លារួម (ជាន់ទី ៣ ដល់ទី ៦)</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display uppercase tracking-wider text-xs px-4 py-2 rounded-md cursor-pointer transition-all active:scale-98 shadow-sm"
        >
          <Plus className="w-4 h-4" /> បន្ថែមតំបន់ហានិភ័យ
        </button>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredZones.map((zone) => {
          return (
            <div
              key={zone.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 font-display">
                      {zone.zoneType === 'Zone A' ? 'តំបន់ A' : zone.zoneType === 'Zone B' ? 'តំបន់ B' : zone.zoneType === 'Zone C' ? 'តំបន់ C' : 'តំបន់ D'} • {getFloorTranslation(zone.floor)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5 font-display">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      {zone.name}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setActiveQrZone(zone)}
                      title="បង្កើត និងបោះពុម្ពកូដ QR ជញ្ជាំង"
                      className="p-1.5 hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 rounded-md cursor-pointer transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditForm(zone)}
                      title="កែសម្រួលតំបន់"
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-md cursor-pointer transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteZone(zone.id)}
                      title="លុបតំបន់"
                      className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  {zone.description}
                </p>
              </div>

              {/* Badges footer */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-wide border ${getRiskColor(zone.riskLevel)}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {getRiskTranslation(zone.riskLevel)}
                </span>

                <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-bold font-display uppercase tracking-wider">
                  <Users className="w-4 h-4 text-slate-400" />
                  ត្រូវការ៖ {zone.minStaffRequired} នាក់
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredZones.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">រកមិនឃើញតំបន់ហានិភ័យសុវត្ថិភាពណាដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ។</p>
        </div>
      )}

      {/* Zone Editor Modal */}
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
              {editingZone ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-slate-800" />}
              {editingZone ? 'កែសម្រួលតំបន់ហានិភ័យ' : 'បន្ថែមតំបន់ហានិភ័យថ្មី'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ប្រភេទតំបន់</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value as ZoneType)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white text-slate-700"
                  >
                    <option value="Zone A">តំបន់ A (ជាន់ផ្ទាល់ដី)</option>
                    <option value="Zone B">តំបន់ B (ជាន់ទី ១)</option>
                    <option value="Zone C">តំបន់ C (ជាន់ទី ២)</option>
                    <option value="Zone D">តំបន់ D (ជាន់ទី ៣ ដល់ទី ៦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ជាន់អគារ</label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value as DutyZone['floor'])}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white text-slate-700"
                  >
                    <option value="Ground">ជាន់ផ្ទាល់ដី</option>
                    <option value="1st Floor">ជាន់ទី ១</option>
                    <option value="2nd Floor">ជាន់ទី ២</option>
                    <option value="3rd Floor">ជាន់ទី ៣</option>
                    <option value="4th Floor">ជាន់ទី ៤</option>
                    <option value="5th Floor">ជាន់ទី ៥</option>
                    <option value="6th Floor">ជាន់ទី ៦</option>
                    <option value="3rd-6th Floors">ជាន់ទី ៣ ដល់ទី ៦</option>
                    <option value="N/A">ក្រៅអគារ (ទីធ្លាក្រៅ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ឈ្មោះតំបន់</label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ ច្រករបៀង និងបន្ទប់ទឹកជាន់ទី ៥"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">កម្រិតហានិភ័យ</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as DutyZone['riskLevel'])}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white text-slate-700"
                  >
                    <option value="Low">ហានិភ័យទាប</option>
                    <option value="Medium">ហានិភ័យមធ្យម</option>
                    <option value="High">ហានិភ័យខ្ពស់</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ចំនួនបុគ្គលិកអប្បបរមា</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={minStaff}
                    onChange={(e) => setMinStaff(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">ការពិពណ៌នាអំពីតំបន់ហានិភ័យ</label>
                <textarea
                  required
                  rows={3}
                  placeholder="រៀបរាប់អំពីហានិភ័យសុវត្ថិភាព និងចំណុចគួរប្រុងប្រយ័ត្នសម្រាប់បុគ្គលិក..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {editingZone ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'បន្ថែមតំបន់'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Wall QR Code Modal */}
      {activeQrZone && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="zone-qr-printable-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-6 relative animate-scaleUp">
            {/* Close button */}
            <button
              onClick={() => setActiveQrZone(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide font-display">
                Wall QR Code Generator (កូដ QR សម្រាប់បិទជញ្ជាំង)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">បង្កើតកូដ QR សម្រាប់បោះពុម្ព និងបិទនៅទីតាំងយាមល្បាតផ្ទាល់</p>
            </div>

            {/* Poster content frame */}
            <div className="border-4 border-dashed border-indigo-100 p-6 rounded-xl text-center space-y-4 bg-slate-50/45" id="qr-poster-preview">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-sm">S</span>
                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">សាលារៀនសុវណ្ណភូមិទួលពង្រ</h4>
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest">Patrol Duty Station</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded-full uppercase tracking-wider">
                  {activeQrZone.zoneType === 'Zone A' ? 'តំបន់ A' : activeQrZone.zoneType === 'Zone B' ? 'តំបន់ B' : activeQrZone.zoneType === 'Zone C' ? 'តំបន់ C' : 'តំបន់ D'} • {getFloorTranslation(activeQrZone.floor)}
                </span>
                <h4 className="text-lg font-extrabold text-slate-950 pt-1">{activeQrZone.name}</h4>
              </div>

              {/* QR Code Graphic wrapper */}
              <div className="flex justify-center py-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ZONE_${activeQrZone.id}&color=4f46e5`}
                  alt={`${activeQrZone.name} QR Code`}
                  className="w-44 h-44 border border-slate-200 p-1.5 rounded-lg bg-white shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </div>

              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                👉 សូមបុគ្គលិកប្រចាំការស្កែនកូដ QR នេះដើម្បីស្កែន Check-In ចូលយាមល្បាតតំបន់ហានិភ័យ។
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveQrZone(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
              >
                បិទឡើយវិញ (Close)
              </button>
              <button
                type="button"
                onClick={() => handlePrintQr(activeQrZone)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ពកូដ QR (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
