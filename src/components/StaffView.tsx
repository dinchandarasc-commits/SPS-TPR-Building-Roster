import React, { useState, useEffect, useRef } from 'react';
import { StaffProfile, DutyZone, RosterEntry, IncidentReport, Shift } from '../types';
import { QrCode, AlertOctagon, User, Clock, MapPin, Camera, Check, Sparkles, Send, XCircle, ChevronRight, FileText, Compass, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface StaffViewProps {
  staff: StaffProfile[];
  zones: DutyZone[];
  shifts: Shift[];
  roster: RosterEntry[];
  incidents: IncidentReport[];
  activeLoggedStaffId: string;
  onActiveStaffChange: (id: string) => void;
  onCheckIn: (entryId: string) => void;
  onAddIncident: (report: IncidentReport) => void;
  targetLat?: number;
  targetLon?: number;
  onLogout?: () => void;
}

export default function StaffView({
  staff,
  zones,
  shifts,
  roster,
  incidents,
  activeLoggedStaffId,
  onActiveStaffChange,
  onCheckIn,
  onAddIncident,
  targetLat: targetLatProp = 11.556400,
  targetLon: targetLonProp = 104.928200,
  onLogout
}: StaffViewProps) {
  // Local States
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [selectedScanEntryId, setSelectedScanEntryId] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  // QR Scanning Tab (Simulator vs Real Camera)
  const [scannerTab, setScannerTab] = useState<'simulator' | 'camera'>('simulator');
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // GPS Location Verification States
  const [gpsMode, setGpsMode] = useState<'near' | 'far' | 'real'>('near');
  const [bypassGps, setBypassGps] = useState(false);
  
  const [targetLat, setTargetLat] = useState<number>(targetLatProp);
  const [targetLon, setTargetLon] = useState<number>(targetLonProp);

  useEffect(() => {
    setTargetLat(targetLatProp);
  }, [targetLatProp]);

  useEffect(() => {
    setTargetLon(targetLonProp);
  }, [targetLonProp]);

  const [userLat, setUserLat] = useState(11.556410); // Simulated near Lat
  const [userLon, setUserLon] = useState(104.928210); // Simulated near Lon
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Distance calculator using Haversine formula
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculatedDistance = getDistanceInMeters(userLat, userLon, targetLat, targetLon);
  const isWithinRange = bypassGps || calculatedDistance <= 4.0;

  const handleGpsModeChange = (mode: 'near' | 'far' | 'real') => {
    setGpsMode(mode);
    setGpsError(null);
    if (mode === 'near') {
      setUserLat(11.556410); // ~1.5 meters away
      setUserLon(104.928210);
    } else if (mode === 'far') {
      setUserLat(11.556550); // ~23 meters away (fails > 4m limit)
      setUserLon(104.928350);
    } else if (mode === 'real') {
      setIsLocating(true);
      if (!navigator.geolocation) {
        setGpsError('កម្មវិធីរុករកមិនគាំទ្រ Geolocation ឡើយ (Geolocation not supported)');
        setIsLocating(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude);
          setUserLon(position.coords.longitude);
          setIsLocating(false);
        },
        (error) => {
          let msg = 'មិនអាចទាញយកទីតាំង៖ ';
          if (error.code === 1) msg += 'ការអនុញ្ញាតត្រូវបានបដិសេធ (Permission Denied)';
          else if (error.code === 2) msg += 'ទីតាំងមិនមាន (Position Unavailable)';
          else if (error.code === 3) msg += 'អស់ពេលកំណត់ (Timeout)';
          else msg += error.message;
          setGpsError(msg);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Calibrate phone current location as school target
  const calibrateGpsAsSchool = () => {
    if (gpsMode !== 'real') {
      alert('សូមជ្រើសរើស "GPS ពិត" ជាមុនសិន ដើម្បីទាញយកទីតាំងទូរស័ព្ទពិតប្រាកដរបស់អ្នក រួចសន្សឹមធ្វើការកំណត់!');
      return;
    }
    setTargetLat(userLat);
    setTargetLon(userLon);
    alert(`🎯 បានកំណត់ទីតាំងទូរស័ព្ទរបស់អ្នក (Lat: ${userLat.toFixed(6)}, Lon: ${userLon.toFixed(6)}) ជាទីតាំងសាលាជាបណ្តោះអាសន្នសម្រាប់ការសាកល្បងដោយជោគជ័យ! គម្លាតឥឡូវនេះគឺ ០ ម៉ែត្រ។`);
  };

  // Real Camera QR Code Scanning Logic
  const handleScannedCode = (decodedText: string) => {
    // Format: ZONE_<zoneId> (e.g. ZONE_z-a1)
    if (decodedText.startsWith('ZONE_')) {
      const scannedZoneId = decodedText.replace('ZONE_', '');
      
      // Look for active duty assigned for this zone
      const correspondingDuty = myAssignedDuties.find(
        d => d.zoneId === scannedZoneId && d.status === 'Assigned'
      );
      
      if (correspondingDuty) {
        setSelectedScanEntryId(correspondingDuty.id);
        const zone = zones.find(z => z.id === scannedZoneId);
        alert(`🎉 ស្កែនកូដជោគជ័យ! រកឃើញ៖ ${zone?.name || scannedZoneId}។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ជាក់ Check-In។`);
      } else {
        const zone = zones.find(z => z.id === scannedZoneId);
        if (zone) {
          // If no duty matches but zone is valid, try to find ANY duty that matches or alert
          alert(`📍 បានរកឃើញតំបន់៖ ${zone.name} ប៉ុន្តែអ្នកមិនទាន់មានឈ្មោះក្នុងបញ្ជីភារកិច្ចចាត់តាំងនៅទីនេះឡើយ។ អ្នកអាចជ្រើសរើសវេនយាមដែលត្រូវគ្នាក្នុងបញ្ជីដោយដៃ។`);
        } else {
          alert(`⚠️ កូដ QR នេះមិនត្រឹមត្រូវ ឬមិនមែនជាតំបន់យាមល្បាតក្នុងប្រព័ន្ធឡើយ (ស្កែនបាន៖ ${decodedText})`);
        }
      }
    } else {
      alert(`⚠️ កូដ QR នេះមិនត្រឹមត្រូវ ឬមិនមែនជាតំបន់យាមល្បាតក្នុងប្រព័ន្ធឡើយ (ស្កែនបាន៖ ${decodedText})`);
    }
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    if (isScanningQR && scannerTab === 'camera') {
      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              handleScannedCode(decodedText);
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Error stopping scanner:", err));
              }
            },
            () => {}
          );
          setCameraPermission('granted');
        } catch (err: any) {
          console.error("Failed to start scanner:", err);
          setCameraPermission('denied');
          setGpsError('មិនអាចបើកកាមេរ៉ាស្កែនបានទេ៖ ' + (err.message || err));
          setScannerTab('simulator');
        }
      };

      const timer = setTimeout(() => {
        startScanner();
      }, 350);

      return () => {
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error on clean up stopping scanner:", err));
        }
      };
    }
  }, [isScanningQR, scannerTab]);

  const [activeReportDrawer, setActiveReportDrawer] = useState(false);
  const [repZoneId, setRepZoneId] = useState('');
  const [repSeverity, setRepSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [repDescription, setRepDescription] = useState('');
  const [repPhotoUrl, setRepPhotoUrl] = useState('');
  const [repCustomPhoto, setRepCustomPhoto] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Active user details
  const activeUser = staff.find(s => s.id === activeLoggedStaffId) || staff[0];

  // Assigned duties for the active simulated user
  const myAssignedDuties = roster.filter(r => r.staffIds.includes(activeLoggedStaffId));

  // Preloaded Incident Situation Photos
  const presetPhotos = [
    {
      id: 'p-1',
      label: 'សិស្សដួលនៅសួនកុមារ',
      url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'p-2',
      label: 'ឥដ្ឋរអិលនៅអាហារដ្ឋាន',
      url: 'https://images.unsplash.com/photo-1541829019-259276a7f85c?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'p-3',
      label: 'ជម្លោះ/ការឈ្លោះគ្នា',
      url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'p-4',
      label: 'ហានិភ័យទូទៅ/បាក់បែក',
      url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=500&auto=format&fit=crop&q=60'
    }
  ];

  const handleScanSubmit = () => {
    if (!selectedScanEntryId) return;

    // GPS Verification check before checking-in
    const distance = getDistanceInMeters(userLat, userLon, targetLat, targetLon);
    if (distance > 4.0) {
      alert(`មិនអនុញ្ញាតឱ្យ Check-In ទេ! គម្លាតទីតាំងរបស់អ្នកលើសពី ៤ ម៉ែត្រ (${distance.toFixed(1)} ម៉ែត្រ)។`);
      return;
    }

    onCheckIn(selectedScanEntryId);
    setScanSuccess(true);
    setTimeout(() => {
      setScanSuccess(false);
      setIsScanningQR(false);
      setSelectedScanEntryId('');
    }, 2000);
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repZoneId || !repDescription) {
      alert('សូមបំពេញទីតាំង និងពណ៌នាហេតុការណ៍ឲ្យបានត្រឹមត្រូវ!');
      return;
    }

    const finalPhoto = repCustomPhoto || repPhotoUrl || presetPhotos[0].url;

    const newReport: IncidentReport = {
      id: `inc-${Date.now()}`,
      zoneId: repZoneId,
      reporterId: activeLoggedStaffId,
      reporterName: activeUser.name,
      severity: repSeverity,
      description: repDescription,
      photoUrl: finalPhoto,
      timestamp: new Date().toLocaleString('kh-KH', { hour12: true }),
      status: 'Reported'
    };

    onAddIncident(newReport);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setActiveReportDrawer(false);
      setRepZoneId('');
      setRepSeverity('Low');
      setRepDescription('');
      setRepPhotoUrl('');
      setRepCustomPhoto('');
    }, 2500);
  };

  // Filter incidents reported by this staff member
  const myReportedIncidents = incidents.filter(i => i.reporterId === activeLoggedStaffId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="staff-operations-view">
      {/* Simulation Session Switcher */}
      <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-800 border-2 border-indigo-400 flex items-center justify-center text-white font-black text-lg">
              {activeUser.name.charAt(0) || '👤'}
            </div>
            <div>
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">គណនីបុគ្គលិកកំពុងសាកល្បង</p>
              <h3 className="font-extrabold text-sm sm:text-base font-display">{activeUser.name}</h3>
              <p className="text-xs text-indigo-200 mt-0.5">{activeUser.role === 'Security' ? '👮 ភ្នាក់ងារសន្តិសុខសាលា' : '🧑‍🏫 លោកគ្រូ/អ្នកគ្រូប្រចាំការ'}</p>
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto text-[11px] font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>ប្តូរគណនីប្រើប្រាស់ (Switch Account)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TWO GIANT ACTION BUTTONS (MANDATED FOR STAFF VIEW) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* BUTTON 1: SCAN QR CODE */}
        <button
          onClick={() => {
            setIsScanningQR(true);
            setActiveReportDrawer(false);
          }}
          className="group p-6 bg-linear-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-2xl shadow-md border border-indigo-500/30 text-white flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 cursor-pointer hover:scale-101 active:scale-99 hover:shadow-lg"
          id="btn-scan-qr-duty"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all">
            <QrCode className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide font-display">Scan QR ដើម្បីយាម</h4>
            <p className="text-[11px] opacity-80 mt-1 max-w-[210px] leading-relaxed">
              ស្កែនកូដ QR នៅតាមជញ្ជាំងអាគារដើម្បីបញ្ជាក់ការចាប់ផ្តើមចុះល្បាត និងសម្រេចភារកិច្ច។
            </p>
          </div>
        </button>

        {/* BUTTON 2: REPORT EMERGENCY INCIDENT */}
        <button
          onClick={() => {
            setActiveReportDrawer(true);
            setIsScanningQR(false);
          }}
          className="group p-6 bg-linear-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-2xl shadow-md border border-rose-500/30 text-white flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 cursor-pointer hover:scale-101 active:scale-99 hover:shadow-lg"
          id="btn-report-emergency-incident"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all">
            <AlertOctagon className="w-7 h-7 text-white animate-bounce" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide font-display">រាយការណ៍គ្រោះថ្នាក់បន្ទាន់</h4>
            <p className="text-[11px] opacity-80 mt-1 max-w-[210px] leading-relaxed">
              ថតរូបភាព កំណត់កម្រិតគ្រោះថ្នាក់ និងបញ្ជូនរាយការណ៍បន្ទាន់ទៅកាន់គណៈគ្រប់គ្រង និងបន្ទប់សុខភាព។
            </p>
          </div>
        </button>
      </div>

      {/* QR SCANNING DIALOG OVERLAY SIMULATOR */}
      {isScanningQR && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-lg border-t-4 border-t-indigo-600 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              ប្រព័ន្ធស្កែន QR Code ប្រចាំការជាក់ស្តែង (Live Wall QR Simulator)
            </h3>
            <button
              onClick={() => setIsScanningQR(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 cursor-pointer"
            >
              ×
            </button>
          </div>

          {scanSuccess ? (
            <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-150 animate-scaleUp">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6 stroke-[3px]" />
              </div>
              <h4 className="font-black text-sm text-emerald-800">ស្កែន QR Check-In ជោគជ័យ!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ប្រព័ន្ធបានកត់ត្រាការចុះយាមល្បាតរបស់អ្នករួចរាល់ និងបានបញ្ជូនដំណឹងទៅកាន់ប្រព័ន្ធគ្រប់គ្រងសាលា និង Telegram Group ជាស្វ័យប្រវត្ត។
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TAB SWITCHER: SIMULATOR VS REAL CAMERA */}
              <div className="flex border-b border-slate-100 pb-1 gap-1">
                <button
                  type="button"
                  onClick={() => setScannerTab('simulator')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
                    scannerTab === 'simulator'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  🖥️ ផ្ទាំងសាកល្បង (Simulator)
                </button>
                <button
                  type="button"
                  onClick={() => setScannerTab('camera')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
                    scannerTab === 'camera'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  📷 កាមេរ៉ាស្កែនពិត (Real Phone Camera)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Scanner Content Frame */}
                <div>
                  {scannerTab === 'simulator' ? (
                    /* QR Viewfinder Screen (High Fidelity Camera Simulator) */
                    <div className="bg-slate-950 rounded-2xl overflow-hidden p-6 relative flex flex-col items-center justify-center border border-slate-800 min-h-[250px] shadow-inner select-none">
                      {/* 1. Camera Reticle Corner Brackets */}
                      <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-indigo-400 opacity-85"></div>
                      <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-indigo-400 opacity-85"></div>
                      <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-indigo-400 opacity-85"></div>
                      <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-indigo-400 opacity-85"></div>

                      {/* 2. Pulsing REC indicator */}
                      <div className="absolute top-4 left-6 flex items-center gap-1.5 text-[9px] font-mono font-bold text-rose-500 tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-white/5 backdrop-blur-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span>REC</span>
                      </div>

                      {/* 3. Camera settings display */}
                      <div className="absolute top-4 right-6 text-[8px] font-mono font-bold text-slate-400 flex gap-2">
                        <span>AF-C</span>
                        <span>ISO 400</span>
                        <span>1/125s</span>
                      </div>

                      {/* 4. Scanning laser scanline */}
                      <div className="absolute left-0 right-0 h-0.5 bg-indigo-400 opacity-90 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-laser"></div>

                      {/* 5. Center targeting box */}
                      <div className="absolute w-32 h-32 border border-dashed border-indigo-400/40 rounded-lg flex items-center justify-center pointer-events-none">
                        <div className="w-3 h-3 border-t-2 border-l-2 border-indigo-400"></div>
                        <div className="w-3 h-3 border-t-2 border-r-2 border-indigo-400 absolute top-0 right-0"></div>
                        <div className="w-3 h-3 border-b-2 border-l-2 border-indigo-400 absolute bottom-0 left-0"></div>
                        <div className="w-3 h-3 border-b-2 border-r-2 border-indigo-400 absolute bottom-0 right-0"></div>
                      </div>

                      {/* 6. Simulated QR code target */}
                      <div className="p-4 bg-white rounded-xl shadow-lg z-10 animate-pulse duration-1000 scale-95">
                        <QrCode className="w-14 h-14 text-slate-900" />
                      </div>

                      {/* 7. Bottom lens zoom indicator */}
                      <div className="absolute bottom-4 left-6 text-[8px] font-mono font-bold text-slate-400 flex gap-1 items-center">
                        <span>ZOOM 1.0X</span>
                      </div>

                      {/* 8. Viewfinder Status */}
                      <span className="text-[9px] text-slate-500 mt-4 uppercase font-bold tracking-widest font-mono z-10">Viewfinder active</span>
                      <span className="text-[10px] text-indigo-300 font-bold font-display mt-1 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80 z-10">ស្កែនកូដ QR នៅតាមជញ្ជាំងអាគារ</span>
                    </div>
                  ) : (
                    /* Real Phone Camera QR Reader using HTML5-QRCode */
                    <div className="space-y-2">
                      <div
                        id="qr-reader"
                        className="w-full min-h-[250px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex flex-col items-center justify-center text-center p-4 shadow-inner"
                      >
                        <QrCode className="w-10 h-10 text-indigo-500/40 animate-pulse mb-2" />
                        <span className="text-xs text-slate-400">កំពុងតភ្ជាប់ទៅកាន់កាមេរ៉ាទូរស័ព្ទ...</span>
                        <span className="text-[10px] text-slate-500 mt-1">សូមប្រាកដថាអ្នកអនុញ្ញាតសិទ្ធិប្រើប្រាស់កាមេរ៉ា (Camera Permission)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-medium text-center leading-relaxed">
                        💡 ចង្អុលកាមេរ៉ាទូរស័ព្ទទៅកាន់រូបភាពកូដ QR របស់តំបន់យាមល្បាតដែលបានបោះពុម្ព ឬបង្ហាញលើអេក្រង់ផ្សេងទៀត ដើម្បីអានកូដស្វ័យប្រវត្ត។
                      </p>
                    </div>
                  )}
                </div>

                {/* QR controls and GPS Verification Section */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Step 1: Shift Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">១. ជ្រើសរើសវេនយាមដែលចង់ Check-In (Select Duty Shift)៖</label>
                      
                      {myAssignedDuties.filter(d => d.status === 'Assigned').length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-medium">
                          ⚠️ គ្មានភារកិច្ចដែលមិនទាន់ Check-In ក្នុងបញ្ជីរបស់អ្នកទេ! បុគ្គលិកផ្សេងទៀតអាចស្កែនជំនួសបាន។
                        </div>
                      ) : (
                        <select
                          value={selectedScanEntryId}
                          onChange={(e) => setSelectedScanEntryId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          <option value="">-- សូមជ្រើសរើសវេនយាម --</option>
                          {myAssignedDuties
                            .filter(d => d.status === 'Assigned')
                            .map(d => {
                              const zone = zones.find(z => z.id === d.zoneId);
                              const shift = shifts.find(s => s.id === d.shiftId);
                              return (
                                <option key={d.id} value={d.id}>
                                  [{d.day}] {zone?.name || 'តំបន់'} - {shift?.name || 'ម៉ោង'} ({shift?.timeSlot})
                                </option>
                              );
                            })}
                        </select>
                      )}
                    </div>

                    {/* Step 2: GPS Verification Controls */}
                    <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/25 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-indigo-100/45 pb-1.5">
                        <span className="text-[11px] text-indigo-900 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
                          ២. ផ្ទៀងផ្ទាត់កូអរដោនេ GPS (GPS Verification)
                        </span>
                      </div>

                      {/* Simulation mode selector to make it 100% testable */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGpsModeChange('near')}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            gpsMode === 'near'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          📍 ជិតសាលា (1.5m)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGpsModeChange('far')}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            gpsMode === 'far'
                              ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          ❌ ឆ្ងាយ (23m)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGpsModeChange('real')}
                          className={`py-1 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                            gpsMode === 'real'
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isLocating ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          <span>GPS ពិត</span>
                        </button>
                      </div>

                      {/* Geolocation status / error message */}
                      {gpsError ? (
                        <div className="p-2 bg-rose-50 border border-rose-150 rounded text-[10px] text-rose-800 font-semibold leading-relaxed">
                          ⚠️ {gpsError} (សូមជ្រើសរើស 📍 ជិតសាលា ឬជ្រើសរើស រំលង GPS ខាងក្រោម)
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 font-mono bg-white p-2 rounded border border-indigo-100/50">
                          <div className="space-y-0.5">
                            <p className="text-slate-400 font-bold text-[9px]">ទីតាំងគោលដៅសាលា៖</p>
                            <p>Lat: {targetLat.toFixed(6)}</p>
                            <p>Lon: {targetLon.toFixed(6)}</p>
                          </div>
                          <div className="space-y-0.5 border-l border-indigo-100/55 pl-2">
                            <p className="text-indigo-500 font-bold text-[9px] flex items-center gap-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isLocating ? 'bg-amber-400 animate-ping' : 'bg-indigo-500'}`}></span>
                              ទីតាំងទូរស័ព្ទរបស់អ្នក៖
                            </p>
                            <p>Lat: {userLat.toFixed(6)}</p>
                            <p>Lon: {userLon.toFixed(6)}</p>
                          </div>
                        </div>
                      )}

                      {/* Extra controls for easy real phone testing */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-indigo-100/40">
                        <button
                          type="button"
                          onClick={calibrateGpsAsSchool}
                          className="flex-1 py-1 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="កំណត់កូអរដោនេបច្ចុប្បន្នរបស់ទូរស័ព្ទជាកូអរដោនេសាលា ដូច្នេះអ្នកអាចធ្វើតេស្តបានជោគជ័យគ្រប់ទីកន្លែង"
                        >
                          <span>🎯 កំណត់ទីតាំងទូរស័ព្ទជាសាលា (Calibrate GPS)</span>
                        </button>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none self-center">
                          <input
                            type="checkbox"
                            checked={bypassGps}
                            onChange={(e) => setBypassGps(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="text-[10px] text-slate-600 font-extrabold uppercase">រំលង GPS (Bypass GPS)</span>
                        </label>
                      </div>
                    </div>

                    {/* Distance deviation result */}
                    <div className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between transition-all ${
                      isWithinRange
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                        : 'bg-rose-50 border-rose-250 text-rose-800'
                    }`}>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">គម្លាតចម្ងាយ៖</span>
                        <span className="font-mono">{calculatedDistance.toFixed(1)}m</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isWithinRange ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {isWithinRange ? '✓ ក្នុងរង្វង់ 4m (អនុញ្ញាត)' : '✗ លើសពី 4m (មិនអនុញ្ញាត)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Check-in controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsScanningQR(false)}
                    className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    onClick={handleScanSubmit}
                    disabled={!selectedScanEntryId || !isWithinRange}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      selectedScanEntryId && isWithinRange
                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-100'
                        : 'bg-slate-300 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>បញ្ជាក់ការស្កែន Check-In</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INCIDENT REPORT FORM DIALOG OVERLAY */}
      {activeReportDrawer && (
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-lg border-t-4 border-t-rose-600 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              របាយការណ៍ហានិភ័យ & គ្រោះថ្នាក់បន្ទាន់ (Live Incident Reporting)
            </h3>
            <button
              onClick={() => setActiveReportDrawer(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 cursor-pointer"
            >
              ×
            </button>
          </div>

          {reportSuccess ? (
            <div className="p-8 text-center space-y-3 bg-rose-50 rounded-xl border border-rose-150 animate-scaleUp">
              <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-black text-sm text-rose-800">បានផ្ញើរបាយការណ៍គ្រោះថ្នាក់ដោយជោគជ័យ!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ព័ត៌មាននេះនឹងរត់ទៅកាន់ <strong>បន្ទប់សុខភាពសាលា</strong> និង <strong>គណៈគ្រប់គ្រងសាលា</strong> ភ្លាមៗជា Real-time តាម Telegram Alert របស់គណៈគ្រប់គ្រង។
              </p>
            </div>
          ) : (
            <form onSubmit={handleIncidentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left col: inputs */}
                <div className="space-y-3">
                  {/* Location selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">១. ជ្រើសរើសទីតាំងកើតហេតុ (Select Location) <span className="text-rose-500">*</span></label>
                    <select
                      value={repZoneId}
                      onChange={(e) => setRepZoneId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                    >
                      <option value="">-- សូមជ្រើសរើសទីតាំង --</option>
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.floor !== 'N/A' ? `${z.floor}` : 'ក្រៅអគារ'}) [ហានិភ័យ៖ {z.riskLevel}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity Level Buttons */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">២. កម្រិតគ្រោះថ្នាក់ (Hazard Severity) <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRepSeverity('Low')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${
                          repSeverity === 'Low'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-inner'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🟢 ធម្មតា (Low)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepSeverity('Medium')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${
                          repSeverity === 'Medium'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 font-extrabold shadow-inner'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🟡 មធ្យម (Med)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepSeverity('High')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${
                          repSeverity === 'High'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 font-extrabold shadow-inner'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🔴 ធ្ងន់ធ្ងរ (High)
                      </button>
                    </div>
                  </div>

                  {/* Description area */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">៣. ព័ត៌មានលម្អិតពីហេតុការណ៍ (Incident Description) <span className="text-rose-500">*</span></label>
                    <textarea
                      value={repDescription}
                      onChange={(e) => setRepDescription(e.target.value)}
                      placeholder="ឧទាហរណ៍៖ សិស្សម្នាក់បានរត់ដួល និងប៉ះទង្គិចក្បាលហើមស្រាលនៅក្បែរឧបករណ៍សួនកុមារធំ..."
                      required
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-semibold focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Right col: photo selection */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">៤. ថតរូបភាពស្ថានភាពជាក់ស្តែង (Situation Photo Capture)</label>
                    <p className="text-[10px] text-slate-400 mt-0.5">ជ្រើសរើសរូបភាពគំរូ ឬបញ្ចូលតំណភ្ជាប់រូបថតផ្ទាល់ខ្លួន៖</p>
                    
                    {/* Preset Photos Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {presetPhotos.map(p => {
                        const isSelected = repPhotoUrl === p.url && !repCustomPhoto;
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              setRepPhotoUrl(p.url);
                              setRepCustomPhoto('');
                            }}
                            className={`p-1 rounded border text-left flex items-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-500'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <img
                              src={p.url}
                              alt={p.label}
                              className="w-8 h-8 rounded object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] font-bold text-slate-700 line-clamp-2">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="url"
                          placeholder="ឬបញ្ចូល URL រូបភាពផ្ទាល់ខ្លួន (Optional)..."
                          value={repCustomPhoto}
                          onChange={(e) => {
                            setRepCustomPhoto(e.target.value);
                            setRepPhotoUrl('');
                          }}
                          className="w-full bg-transparent text-[10px] focus:outline-hidden text-slate-700 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReportDrawer(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-200"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>បញ្ជូនរបាយការណ៍បន្ទាន់</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Your Assigned Roster Schedule Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-800 font-display uppercase tracking-wide">
            ការងារយាមល្បាតដែលបានចាត់តាំង (Your Assigned Duty Schedule)
          </h3>
        </div>

        {myAssignedDuties.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-medium">
            🌴 ល្អណាស់! អ្នកមិនមានកាលវិភាគយាមដែលបានចាត់តាំងសម្រាប់សប្តាហ៍នេះឡើយ។
          </div>
        ) : (
          <div className="space-y-3">
            {myAssignedDuties.map(d => {
              const zone = zones.find(z => z.id === d.zoneId);
              const shift = shifts.find(s => s.id === d.shiftId);
              const isChecked = d.status === 'Checked-In';
              const isCompleted = d.status === 'Completed';

              return (
                <div
                  key={d.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    isChecked
                      ? 'bg-emerald-50/45 border-emerald-150'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg ${
                      isChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-800">{zone?.name || 'តំបន់'}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isChecked
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCompleted
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isChecked ? 'Checked-In' : isCompleted ? 'Completed' : 'Assigned (រង់ចាំស្កែន)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>ថ្ងៃ {d.day} • {shift?.name} ({shift?.timeSlot})</span>
                      </p>
                    </div>
                  </div>

                  {!isChecked && !isCompleted && (
                    <button
                      onClick={() => {
                        setSelectedScanEntryId(d.id);
                        setIsScanningQR(true);
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>ចុចស្កែន QR ទីនេះ</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Your Recent Safety Reports Panel */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-rose-600" />
          <h3 className="font-extrabold text-sm text-slate-800 font-display uppercase tracking-wide">
            របាយការណ៍ដែលអ្នកបានរាយការណ៍ចុងក្រោយ (Your Recent Incident Reports)
          </h3>
        </div>

        {myReportedIncidents.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">
            📝 មិនមានរបាយការណ៍ហានិភ័យ ឬគ្រោះថ្នាក់ណាដែលរាយការណ៍ដោយអ្នកចុងក្រោយឡើយ។
          </div>
        ) : (
          <div className="space-y-3">
            {myReportedIncidents.map(i => {
              const zone = zones.find(z => z.id === i.zoneId);
              return (
                <div key={i.id} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 flex items-start gap-3">
                  {i.photoUrl && (
                    <img
                      src={i.photoUrl}
                      alt="Incident situation"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{zone?.name || 'តំបន់'}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        i.severity === 'High' ? 'bg-rose-100 text-rose-800' :
                        i.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {i.severity === 'High' ? 'ធ្ងន់ធ្ងរ' : i.severity === 'Medium' ? 'មធ្យម' : 'ធម្មតា'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{i.description}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                      <span>ម៉ោងរាយការណ៍៖ {i.timestamp}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-500 uppercase">ស្ថានភាព៖ {i.status}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
