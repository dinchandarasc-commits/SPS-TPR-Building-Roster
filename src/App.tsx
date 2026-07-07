import React, { useState, useEffect } from 'react';
import { StaffProfile, DutyZone, RosterEntry, SafetyAuditResult, IncidentReport } from './types';
import { INITIAL_STAFF, INITIAL_ZONES, SHIFTS, INITIAL_ROSTER } from './data';
import StaffSection from './components/StaffSection';
import ZoneSection from './components/ZoneSection';
import RosterBoard from './components/RosterBoard';
import SafetyAuditPanel from './components/SafetyAuditPanel';
import CampusMap from './components/CampusMap';
import StaffView from './components/StaffView';
import AnalyticsView from './components/AnalyticsView';
import { Shield, Users, MapPin, Calendar, HelpCircle, CheckSquare, Sparkles, RefreshCw, AlertTriangle, Info, Sliders, ShieldCheck, Play, CheckCircle2, XCircle, ArrowRight, Search, MessageSquare, Bell, BellOff, Send, Check, ShieldAlert, User, QrCode, Clock, ArrowLeftRight, Camera, BarChart3, AlertOctagon, HelpCircle as HelpIcon, FileText } from 'lucide-react';
import { seedDatabaseIfEmpty, saveFullStaff, saveFullZones, saveFullRoster, saveFullIncidents, saveSettings, AppSettings } from './lib/db.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'roster' | 'staff' | 'zones' | 'audit'>('roster');
  
  // App state loaded from LocalStorage or seed data
  const [staff, setStaff] = useState<StaffProfile[]>(() => {
    const saved = localStorage.getItem('school_safety_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [zones, setZones] = useState<DutyZone[]>(() => {
    const saved = localStorage.getItem('school_safety_zones');
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [roster, setRoster] = useState<RosterEntry[]>(() => {
    const saved = localStorage.getItem('school_safety_roster');
    return saved ? JSON.parse(saved) : INITIAL_ROSTER;
  });

  const [auditResult, setAuditResult] = useState<SafetyAuditResult | null>(() => {
    const saved = localStorage.getItem('school_safety_audit');
    return saved ? JSON.parse(saved) : null;
  });

  // Admin Configuration and Rule Engine States
  const [minStaffZoneA, setMinStaffZoneA] = useState<number>(() => {
    const saved = localStorage.getItem('school_safety_min_staff_a');
    return saved ? parseInt(saved) : 2;
  });
  const [minStaffZoneB, setMinStaffZoneB] = useState<number>(() => {
    const saved = localStorage.getItem('school_safety_min_staff_b');
    return saved ? parseInt(saved) : 3;
  });
  const [minStaffZoneD, setMinStaffZoneD] = useState<number>(() => {
    const saved = localStorage.getItem('school_safety_min_staff_d');
    return saved ? parseInt(saved) : 2;
  });
  const [maxWeeklyDutiesTeachers, setMaxWeeklyDutiesTeachers] = useState<number>(() => {
    const saved = localStorage.getItem('school_safety_max_duties_teachers');
    return saved ? parseInt(saved) : 5;
  });

  // UI state
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMode, setAuditMode] = useState<string>('AI');
  const [warning, setWarning] = useState<string | null>(null);

  // Stage 2: Automatic Schedule Generation & Notification Simulation States
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationState, setSimulationState] = useState<'idle' | 'fetching' | 'checking' | 'resolved' | 'done'>('idle');
  const [activeSimulationStep, setActiveSimulationStep] = useState<number>(0);

  // Stage 3 & 4: Approval and Notification states
  const [isApproved, setIsApproved] = useState<boolean>(() => {
    const saved = localStorage.getItem('school_safety_is_approved');
    return saved === 'true';
  });
  const [approvedBy, setApprovedBy] = useState<string>(() => {
    return localStorage.getItem('school_safety_approved_by') || '';
  });
  const [approvedAt, setApprovedAt] = useState<string>(() => {
    return localStorage.getItem('school_safety_approved_at') || '';
  });
  const [notificationSent, setNotificationSent] = useState<boolean>(() => {
    const saved = localStorage.getItem('school_safety_notification_sent');
    return saved === 'true';
  });
  const [selectedStaffForPersonalView, setSelectedStaffForPersonalView] = useState<string>(() => {
    return localStorage.getItem('school_safety_selected_staff_view') || '';
  });
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);

  // Stage 5: Live Operations Flow States
  const [liveCheckInLogs, setLiveCheckInLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_safety_live_logs');
    return saved ? JSON.parse(saved) : [
      '🔔 ប្រព័ន្ធប្រតិបត្តិការពេលវេលាពិត (Live Ops Engine) កំពុងដំណើរការ...',
      '📅 រង់ចាំការធ្វើសកម្មភាព Check-In ឬស្នើសុំប្តូរវេនពីបុគ្គលិក។'
    ];
  });
  const [escalationAlerts, setEscalationAlerts] = useState<{ id: string; entryId: string; msg: string; timestamp: string; solved: boolean; backupName?: string }[]>(() => {
    const saved = localStorage.getItem('school_safety_escalation_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Shift Swapping States
  const [swapFromStaffId, setSwapFromStaffId] = useState<string>('');
  const [swapRosterEntryId, setSwapRosterEntryId] = useState<string>('');
  const [swapToStaffId, setSwapToStaffId] = useState<string>('');
  const [swapStatus, setSwapStatus] = useState<'idle' | 'pending' | 'accepted' | 'declined'>('idle');

  // Selected Simulation Variables
  const [liveSelectedEntryId, setLiveSelectedEntryId] = useState<string>('');
  const [liveSelectedBackupStaffId, setLiveSelectedBackupStaffId] = useState<string>('');
  const [liveSelectedSwapEntryId, setLiveSelectedSwapEntryId] = useState<string>('');
  const [liveSelectedSwapTargetStaffId, setLiveSelectedSwapTargetStaffId] = useState<string>('');

  // Perspective Views (Admin, Staff, Analytics)
  const [currentPerspective, setCurrentPerspective] = useState<'admin' | 'staff' | 'analytics'>(() => {
    return (localStorage.getItem('school_safety_perspective') as 'admin' | 'staff' | 'analytics') || 'admin';
  });

  // Incident & Safety Reporting States
  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem('school_safety_incidents');
    return saved ? JSON.parse(saved) : [
      {
        id: 'inc-1',
        zoneId: 'z-a3', // Playground
        reporterId: 't-1',
        reporterName: 'លោកគ្រូ សុភ័ក្រ្ត ជួប',
        severity: 'Medium',
        description: 'សិស្សម្នាក់បានរអិលជើងដួលពេលកំពុងរត់លេងនៅសួនកុមារធំ ជើងមានសភាពហើមស្រាល បានបញ្ជូនទៅបន្ទប់សុខភាពរួចរាល់។',
        timestamp: '02/07/2026, 08:30:00 AM',
        status: 'Resolved',
        photoUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format&fit=crop&q=60'
      },
      {
        id: 'inc-2',
        zoneId: 'z-b4', // 4th floor toilet
        reporterId: 't-2',
        reporterName: 'អ្នកគ្រូ សុជាតា គង់',
        severity: 'High',
        description: 'ឃើញមានសិស្សពីរនាក់ឈ្លោះគ្នា និងចង់បង្កជម្លោះធំនៅច្រករបៀងបន្ទប់ទឹកជាន់ទី៤។ បានឃាត់ទាន់ពេល និងរាយការណ៍ជូនការិយាល័យវិន័យ។',
        timestamp: '01/07/2026, 10:15:00 AM',
        status: 'Resolved',
        photoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&auto=format&fit=crop&q=60'
      },
      {
        id: 'inc-3',
        zoneId: 'z-a4', // Cafeteria
        reporterId: 't-3',
        reporterName: 'លោកគ្រូ ចាន់ត្រា សេង',
        severity: 'Low',
        description: 'មានសិស្សរអិលឥដ្ឋអាហារដ្ឋានដែលកំពុងសើម ប៉ុន្តែមិនមានរបួសធ្ងន់ធ្ងរទេ។ បានប្រាប់ឱ្យបុគ្គលិកអនាម័យជូតសម្អាតរួចរាល់។',
        timestamp: '02/07/2026, 12:10:00 PM',
        status: 'Reported',
        photoUrl: 'https://images.unsplash.com/photo-1541829019-259276a7f85c?w=500&auto=format&fit=crop&q=60'
      }
    ];
  });

  // Incident reporting form states
  const [repZoneId, setRepZoneId] = useState<string>('');
  const [repReporterId, setRepReporterId] = useState<string>('');
  const [repSeverity, setRepSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [repDescription, setRepDescription] = useState<string>('');
  const [repPhotoUrl, setRepPhotoUrl] = useState<string>('');
  const [repCustomPhoto, setRepCustomPhoto] = useState<string>('');

  // Additional Interactive Simulator States
  const [isScanningQR, setIsScanningQR] = useState<boolean>(false);
  const [selectedScanEntryId, setSelectedScanEntryId] = useState<string>('');
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [activeLoggedStaffId, setActiveLoggedStaffId] = useState<string>(() => {
    return localStorage.getItem('school_safety_active_logged_staff_id') || 't-1';
  });
  const [incidentReportSuccess, setIncidentReportSuccess] = useState<boolean>(false);
  const [activeReportDrawer, setActiveReportDrawer] = useState<boolean>(false);

  const [dbLoaded, setDbLoaded] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  // Initialize and Load/Seed Firestore database directly
  useEffect(() => {
    const initDb = async () => {
      try {
        const defaultSettings: AppSettings = {
          minStaffZoneA,
          minStaffZoneB,
          minStaffZoneD,
          maxWeeklyDutiesTeachers,
          isApproved,
          approvedBy,
          approvedAt,
          notificationSent,
          liveCheckInLogs,
          escalationAlerts
        };

        const result = await seedDatabaseIfEmpty(
          INITIAL_STAFF,
          INITIAL_ZONES,
          INITIAL_ROSTER,
          incidents,
          defaultSettings
        );

        // Synchronize remote database results to react state
        setStaff(result.staff);
        setZones(result.zones);
        setRoster(result.roster);
        setIncidents(result.incidents);

        setMinStaffZoneA(result.settings.minStaffZoneA);
        setMinStaffZoneB(result.settings.minStaffZoneB);
        setMinStaffZoneD(result.settings.minStaffZoneD);
        setMaxWeeklyDutiesTeachers(result.settings.maxWeeklyDutiesTeachers);
        setIsApproved(result.settings.isApproved);
        setApprovedBy(result.settings.approvedBy || '');
        setApprovedAt(result.settings.approvedAt || '');
        setNotificationSent(result.settings.notificationSent || false);
        setLiveCheckInLogs(result.settings.liveCheckInLogs || []);
        setEscalationAlerts(result.settings.escalationAlerts || []);

        setDbLoaded(true);
      } catch (err) {
        console.error("Failed to load and seed Firebase database:", err);
      } finally {
        setDbLoading(false);
      }
    };

    initDb();
  }, []);

  useEffect(() => {
    localStorage.setItem('school_safety_active_logged_staff_id', activeLoggedStaffId);
  }, [activeLoggedStaffId]);

  useEffect(() => {
    localStorage.setItem('school_safety_perspective', currentPerspective);
  }, [currentPerspective]);

  const runConflictCheckSimulation = () => {
    setSimulationState('fetching');
    setActiveSimulationStep(1);
    setSimulationLogs(['[ប្រព័ន្ធ] ចាប់ផ្តើមទាញទិន្នន័យបុគ្គលិក និងតំបន់ហានិភ័យសាលារៀន...']);

    setTimeout(() => {
      setSimulationState('checking');
      setActiveSimulationStep(2);
      setSimulationLogs(prev => [
        ...prev,
        `[ទិន្នន័យ] ផ្គូផ្គងបុគ្គលិក ${staff.length} នាក់ ជាមួយតំបន់ហានិភ័យ ${zones.length} និងវេនម៉ោងនីមួយៗ...`,
        `[ផ្ទៀងផ្ទាត់] កំពុងពិនិត្យការជាន់គ្នានៃកាលវិភាគបង្រៀន (Conflict Check) របស់លោកគ្រូអ្នកគ្រូ...`
      ]);
    }, 1500);

    setTimeout(() => {
      setSimulationLogs(prev => [
        ...prev,
        `⚠️ [រកឃើញភាពជាន់គ្នា] លោកគ្រូ សុភ័ក្រ្ត ជួប ជាប់ម៉ោងបង្រៀននៅថ្នាក់ទី៨អា ចំម៉ោង "ម៉ោងទៅផ្ទះពេលព្រឹក (10:45 AM - 11:10 AM)"!`,
        `⚠️ [រកឃើញភាពជាន់គ្នា] អ្នកគ្រូ នារី រ័ត្ន ជាប់ម៉ោងបង្រៀននៅថ្នាក់ទី៩ប៊ី ចំម៉ោង "ម៉ោងទៅផ្ទះពេលរសៀល (4:45 PM - 5:10 PM)"!`
      ]);
    }, 3000);

    setTimeout(() => {
      setSimulationState('resolved');
      setActiveSimulationStep(3);
      setSimulationLogs(prev => [
        ...prev,
        `🔄 [ដោះស្រាយ] កំពុងស្វែងរកបុគ្គលិក/គ្រូជំនួសដែលមានទំនេរ (មិនជាប់ម៉ោងបង្រៀន) និងគោរពតាមចំនួនបំពេញភារកិច្ចអតិបរមា ${maxWeeklyDutiesTeachers} ថ្ងៃ/សប្តាហ៍...`,
        `✅ [ដោះស្រាយរួចរាល់] បានផ្លាស់ប្តូរ និងចាត់តាំង លោកគ្រូ ចាន់ត្រា សេង និងអ្នកគ្រូ សុជាតា គង់ ជំនួសវិញដោយជោគជ័យ!`
      ]);
    }, 4500);

    setTimeout(() => {
      setSimulationState('done');
      setActiveSimulationStep(4);
      setSimulationLogs(prev => [
        ...prev,
        `🎉 [សម្រេច] បង្កើតតារាងសម្រេច (Final Roster) ជោគជ័យ ១០០% (គ្មានភាពជាន់គ្នាឡើយ)!`,
        `📢 [ជូនដំណឹង] រក្សាទុកកាលវិភាគរួចរាល់។ បានបញ្ជូនតារាងការងារប្រចាំការទៅកាន់ Telegram Group របស់បុគ្គលិកជាស្វ័យប្រវត្តិ។`
      ]);
    }, 6000);
  };
  
  // ==================== LIVE OPERATIONS ACTION HANDLERS ====================
  
  // 1. Live Check-In (Location Scan QR Code)
  const handleLiveCheckIn = (entryId: string) => {
    const entry = roster.find(r => r.id === entryId);
    if (!entry) return;

    const zone = zones.find(z => z.id === entry.zoneId);
    const assignedStaffNames = entry.staffIds
      .map(id => staff.find(s => s.id === id)?.name || 'មិនស្គាល់')
      .join(', ');

    // Update roster status
    setRoster(prev => prev.map(r => r.id === entryId ? { ...r, status: 'Checked-In' } : r));

    // Log the action
    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logMsg = `[${timeStr}] ✅ CHECK-IN ជោគជ័យ៖ លោកគ្រូ/អ្នកគ្រូ { ${assignedStaffNames} } បានស្កែន QR Code នៅជញ្ជាំង ចូលតួនាទីយាមល្បាតនៅ [${zone?.name || 'តំបន់យាម'}] ជោគជ័យ!`;
    setLiveCheckInLogs(prev => [logMsg, ...prev]);

    // Resolve any pending escalation alerts for this entry
    setEscalationAlerts(prev => prev.map(alert => 
      alert.entryId === entryId ? { ...alert, solved: true, backupName: 'បានបំពេញភារកិច្ចរួចរាល់' } : alert
    ));

    setWarning(`🎉 បាន Check-In ជោគជ័យសម្រាប់តំបន់ ${zone?.name}!`);
  };

  // 1.5. Live Safety Incident reporting
  const handleAddNewIncident = (report: IncidentReport) => {
    setIncidents(prev => [report, ...prev]);
    
    const zone = zones.find(z => z.id === report.zoneId);
    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const severityLabel = report.severity === 'High' ? '🚨 ធ្ងន់ធ្ងរខ្លាំង' : report.severity === 'Medium' ? '⚠️ មធ្យម' : '🟢 ធម្មតា';
    
    const logMsg = `[${timeStr}] ${severityLabel} របាយការណ៍ហានិភ័យ៖ ${report.reporterName} បានរាយការណ៍ពី [${zone?.name || 'ទីតាំង'}] - "${report.description}"! បានជូនដំណឹងទៅបន្ទប់សុខភាពរួចរាល់។`;
    setLiveCheckInLogs(prev => [logMsg, ...prev]);

    if (report.severity === 'High') {
      setWarning(`🚨 អាសន្នសុវត្ថិភាពធ្ងន់ធ្ងរនៅ ${zone?.name}! បន្ទប់សុខភាព និងគណៈគ្រប់គ្រងកំពុងចុះទៅជាបន្ទាន់។`);
    } else {
      setWarning(`📝 ទទួលបានរបាយការណ៍សុវត្ថិភាពថ្មីនៅ ${zone?.name}។`);
    }
  };

  const handleUpdateIncidentStatus = (id: string, status: 'Reported' | 'In-Investigation' | 'Resolved') => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));

    const incident = incidents.find(i => i.id === id);
    const zone = zones.find(z => z.id === incident?.zoneId);
    const statusLabel = status === 'Resolved' ? '🟢 ដោះស្រាយរួចរាល់' : status === 'In-Investigation' ? '🔵 កំពុងស៊ើបអង្កេត' : '🟡 បានរាយការណ៍ឡើងវិញ';
    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setLiveCheckInLogs(prev => [
      `[${timeStr}] 🔄 ធ្វើបច្ចុប្បន្នភាព៖ ករណីនៅ [${zone?.name || 'ទីតាំង'}] ត្រូវបានប្តូរស្ថានភាពទៅជា { ${statusLabel} }។`,
      ...prev
    ]);
    setWarning(`🔄 បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពករណីទៅជា "${statusLabel}"!`);
  };

  // 2. Trigger Escalation Alert (Simulate 5-minute No-show Delay)
  const handleTriggerEscalation = (entryId: string) => {
    const entry = roster.find(r => r.id === entryId);
    if (!entry) return;

    const zone = zones.find(z => z.id === entry.zoneId);
    const shift = SHIFTS.find(s => s.id === entry.shiftId);
    const primaryStaff = staff.find(s => s.id === entry.staffIds[0]) || staff[0];

    // Create a unique escalation alert
    const alertId = `alert-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const alertMsg = `🚨 អាសន្ន៖ ហួសម៉ោងយាមកំណត់ ៥នាទីហើយ! លោកគ្រូ/អ្នកគ្រូ { ${primaryStaff.name} } មិនទាន់ស្កែន QR Code Check-In នៅ [${zone?.name || 'ទីតាំងយាម'} - ${shift?.name || 'វេនយាម'}] ឡើយ! សូមបញ្ជូនអ្នកជំនួសជាបន្ទាន់ដើម្បីការពារចន្លោះប្រហោងសុវត្ថិភាព។`;
    
    setEscalationAlerts(prev => [
      {
        id: alertId,
        entryId,
        msg: alertMsg,
        timestamp: timeStr,
        solved: false
      },
      ...prev
    ]);

    setLiveCheckInLogs(prev => [
      `[${timeStr}] ⚠️ ប្រកាសអាសន្ន៖ បុគ្គលិកខកខានការ Check-In ហួសកំណត់ ៥នាទី! ដំណឹងត្រូវបានបញ្ជូនទៅប្រធានវិន័យរួចរាល់។`,
      ...prev
    ]);

    setWarning(`🚨 ប្រកាសអាសន្ន៖ គ្មានបុគ្គលិកល្បាតនៅ ${zone?.name}! ដំណឹងត្រូវបានលោតទៅប្រធានវិន័យរួចរាល់។`);
  };

  // 3. Resolve Escalation with Backup Staff
  const handleResolveEscalationWithBackup = (alertId: string, backupStaffId: string) => {
    const alert = escalationAlerts.find(a => a.id === alertId);
    if (!alert) return;

    const backupMember = staff.find(s => s.id === backupStaffId);
    if (!backupMember) return;

    // Update roster to replace staff with the backup staff and change status to Checked-In
    setRoster(prev => prev.map(r => r.id === alert.entryId ? { ...r, staffIds: [backupStaffId], status: 'Checked-In' } : r));

    // Mark alert as solved
    setEscalationAlerts(prev => prev.map(a => a.id === alertId ? { ...a, solved: true, backupName: backupMember.name } : a));

    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLiveCheckInLogs(prev => [
      `[${timeStr}] 🛡️ ដោះស្រាយ៖ ប្រធានផ្នែកវិន័យបានបញ្ជូន លោកគ្រូ/អ្នកគ្រូ { ${backupMember.name} } ទៅបំពេញបន្ថែមជំនួសជាបន្ទាន់! ស្ថានភាពមានសុវត្ថិភាពឡើងវិញ។`,
      ...prev
    ]);

    setWarning(`🛡️ បានបញ្ជូនលោកគ្រូ ${backupMember.name} ទៅជំនួសជាបន្ទាន់ និង Check-In រួចរាល់!`);
  };

  // 4. Initiate Shift Swap Request (Teacher A to Teacher B)
  const handleInitiateSwap = (entryId: string, fromId: string, toId: string) => {
    setSwapRosterEntryId(entryId);
    setSwapFromStaffId(fromId);
    setSwapToStaffId(toId);
    setSwapStatus('pending');

    const entry = roster.find(r => r.id === entryId);
    const fromStaff = staff.find(s => s.id === fromId);
    const toStaff = staff.find(s => s.id === toId);
    const zone = zones.find(z => z.id === entry?.zoneId);

    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLiveCheckInLogs(prev => [
      `[${timeStr}] 🔄 សំណើប្តូរវេន៖ ${fromStaff?.name} បានផ្ញើសំណើសុំប្តូរវេនយាមនៅ [${zone?.name}] ទៅកាន់ ${toStaff?.name}។`,
      ...prev
    ]);

    setWarning(`📨 បានផ្ញើសំណើប្តូរវេនទៅកាន់ ${toStaff?.name} រួចរាល់!`);
  };

  // 5. Accept Swap Request
  const handleAcceptSwap = () => {
    if (!swapRosterEntryId || !swapFromStaffId || !swapToStaffId) return;

    // Update roster assignment dynamically
    setRoster(prev => prev.map(r => {
      if (r.id === swapRosterEntryId) {
        // Replace fromStaffId with toStaffId
        const updatedStaffIds = r.staffIds.map(id => id === swapFromStaffId ? swapToStaffId : id);
        return { ...r, staffIds: updatedStaffIds };
      }
      return r;
    }));

    const fromStaff = staff.find(s => s.id === swapFromStaffId);
    const toStaff = staff.find(s => s.id === swapToStaffId);
    const entry = roster.find(r => r.id === swapRosterEntryId);
    const zone = zones.find(z => z.id === entry?.zoneId);

    setSwapStatus('accepted');
    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setLiveCheckInLogs(prev => [
      `[${timeStr}] ✅ យល់ព្រមប្តូរវេន៖ ${toStaff?.name} បានចុចយល់ព្រមទទួលវេនយាមជំនួស ${fromStaff?.name} នៅ [${zone?.name}] រួចរាល់ជាស្វ័យប្រវត្តិ!`,
      ...prev
    ]);

    setWarning(`✅ ការប្តូរវេនយាមរវាង ${fromStaff?.name} និង ${toStaff?.name} ត្រូវបានកែប្រែដោយជោគជ័យក្នុងតារាងមេ!`);
  };

  // 6. Decline Swap Request
  const handleDeclineSwap = () => {
    const toStaff = staff.find(s => s.id === swapToStaffId);
    setSwapStatus('declined');
    
    const timeStr = new Date().toLocaleTimeString('kh-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLiveCheckInLogs(prev => [
      `[${timeStr}] ❌ បដិសេធ៖ ${toStaff?.name} បានបដិសេធការស្នើសុំប្តូរវេន។`,
      ...prev
    ]);

    setWarning(`❌ សំណើប្តូរវេនត្រូវបានបដិសេធ។`);
  };

  // 7. Clear Live Logs & Operational simulation
  const handleResetLiveOps = () => {
    setLiveCheckInLogs([
      '🔔 ប្រព័ន្ធប្រតិបត្តិការពេលវេលាពិត (Live Ops Engine) ត្រូវបានលាងសម្អាតរួចរាល់...',
      '📅 រង់ចាំការធ្វើសកម្មភាព Check-In ឬស្នើសុំប្តូរវេនពីបុគ្គលិកជាថ្មី។'
    ]);
    setEscalationAlerts([]);
    setSwapStatus('idle');
    setSwapFromStaffId('');
    setSwapToStaffId('');
    setSwapRosterEntryId('');
    
    // Reset all checked-in statuses back to assigned
    setRoster(prev => prev.map(r => ({ ...r, status: 'Assigned' })));
    setWarning('✨ រួចរាល់៖ រាល់ស្ថានភាព Check-in, ប្រកាសអាសន្ន និងការប្តូរវេនទាំងអស់ត្រូវបានកំណត់ឡើងវិញ! ');
  };

  // Sync state to local storage and Firestore
  useEffect(() => {
    localStorage.setItem('school_safety_staff', JSON.stringify(staff));
    if (dbLoaded) {
      saveFullStaff(staff);
    }
  }, [staff, dbLoaded]);

  useEffect(() => {
    localStorage.setItem('school_safety_zones', JSON.stringify(zones));
    if (dbLoaded) {
      saveFullZones(zones);
    }
  }, [zones, dbLoaded]);

  useEffect(() => {
    localStorage.setItem('school_safety_roster', JSON.stringify(roster));
    if (dbLoaded) {
      saveFullRoster(roster);
    }
  }, [roster, dbLoaded]);

  useEffect(() => {
    if (auditResult) {
      localStorage.setItem('school_safety_audit', JSON.stringify(auditResult));
    }
  }, [auditResult]);

  useEffect(() => {
    localStorage.setItem('school_safety_incidents', JSON.stringify(incidents));
    if (dbLoaded) {
      saveFullIncidents(incidents);
    }
  }, [incidents, dbLoaded]);

  // Sync settings and simulated engine values to Firestore
  useEffect(() => {
    if (!dbLoaded) return;
    saveSettings({
      minStaffZoneA,
      minStaffZoneB,
      minStaffZoneD,
      maxWeeklyDutiesTeachers,
      isApproved,
      approvedBy,
      approvedAt,
      notificationSent,
      liveCheckInLogs,
      escalationAlerts
    });
  }, [
    dbLoaded,
    minStaffZoneA,
    minStaffZoneB,
    minStaffZoneD,
    maxWeeklyDutiesTeachers,
    isApproved,
    approvedBy,
    approvedAt,
    notificationSent,
    liveCheckInLogs,
    escalationAlerts
  ]);

  // Propagate Rule engine changes to zones dynamically
  useEffect(() => {
    setZones(prev => prev.map(z => {
      let req = z.minStaffRequired;
      if (z.zoneType === 'Zone A') req = minStaffZoneA;
      if (z.zoneType === 'Zone B') req = minStaffZoneB;
      if (z.zoneType === 'Zone D') req = minStaffZoneD;
      return { ...z, minStaffRequired: req };
    }));
    localStorage.setItem('school_safety_min_staff_a', minStaffZoneA.toString());
    localStorage.setItem('school_safety_min_staff_b', minStaffZoneB.toString());
    localStorage.setItem('school_safety_min_staff_d', minStaffZoneD.toString());
  }, [minStaffZoneA, minStaffZoneB, minStaffZoneD]);

  // Propagate Rule engine changes to teacher staff profiles dynamically
  useEffect(() => {
    setStaff(prev => prev.map(s => {
      if (s.role === 'Teacher') {
        return { ...s, maxWeeklyDuties: maxWeeklyDutiesTeachers };
      }
      return s;
    }));
    localStorage.setItem('school_safety_max_duties_teachers', maxWeeklyDutiesTeachers.toString());
  }, [maxWeeklyDutiesTeachers]);

  // Dynamic KPI calculations for the main dashboard header (Real-time)
  const totalStaffCount = staff.length;
  const totalZoneCount = zones.length;
  
  // Real-time simple coverage calculator
  const calculateRealTimeCoverage = () => {
    let requiredSlots = 0;
    let filledSlots = 0;
    const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    days.forEach(day => {
      SHIFTS.forEach(shift => {
        zones.forEach(zone => {
          requiredSlots += zone.minStaffRequired;
          const entry = roster.find(r => r.day === day && r.shiftId === shift.id && r.zoneId === zone.id);
          if (entry) {
            filledSlots += Math.min(entry.staffIds.length, zone.minStaffRequired);
          }
        });
      });
    });

    return requiredSlots > 0 ? Math.round((filledSlots / requiredSlots) * 100) : 100;
  };

  const realTimeCoverage = calculateRealTimeCoverage();

  // Get active duty count per staff member
  const getStaffDutyCount = (staffId: string) => {
    return roster.reduce((count, entry) => {
      if (entry.staffIds.includes(staffId)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  // Staff Operations
  const handleAddStaff = (newStaffData: Omit<StaffProfile, 'id'>) => {
    const newMember: StaffProfile = {
      ...newStaffData,
      id: `staff-${Date.now()}`
    };
    setStaff(prev => [...prev, newMember]);
  };

  const handleEditStaff = (updatedMember: StaffProfile) => {
    setStaff(prev => prev.map(s => s.id === updatedMember.id ? updatedMember : s));
  };

  const handleDeleteStaff = (id: string) => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបគណនីបុគ្គលិកនេះមែនទេ?')) {
      setStaff(prev => prev.filter(s => s.id !== id));
      // Remove this staff from any assignments
      setRoster(prev => prev.map(entry => ({
        ...entry,
        staffIds: entry.staffIds.filter(sId => sId !== id)
      })));
    }
  };

  // Zone Operations
  const handleAddZone = (newZoneData: Omit<DutyZone, 'id'>) => {
    const newZone: DutyZone = {
      ...newZoneData,
      id: `zone-${Date.now()}`
    };
    setZones(prev => [...prev, newZone]);
  };

  const handleEditZone = (updatedZone: DutyZone) => {
    setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
  };

  const handleDeleteZone = (id: string) => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបតំបន់ហានិភ័យនេះមែនទេ? រាល់ការចាត់តាំងដែលបានកំណត់ទៅកាន់តំបន់នេះនឹងត្រូវបានលុបចេញទាំងស្រុង។')) {
      setZones(prev => prev.filter(z => z.id !== id));
      // Remove assignments to this zone
      setRoster(prev => prev.filter(entry => entry.zoneId !== id));
    }
  };

  // Roster Assignments
  const handleUpdateAssignment = (
    day: RosterEntry['day'],
    shiftId: string,
    zoneId: string,
    staffIds: string[]
  ) => {
    setRoster(prev => {
      // Find existing entry
      const existingIdx = prev.findIndex(r => r.day === day && r.shiftId === shiftId && r.zoneId === zoneId);
      
      if (existingIdx > -1) {
        const updated = [...prev];
        if (staffIds.length === 0) {
          // If no staff assigned, delete the entry
          updated.splice(existingIdx, 1);
        } else {
          updated[existingIdx] = {
            ...updated[existingIdx],
            staffIds,
            status: 'Assigned'
          };
        }
        return updated;
      } else {
        if (staffIds.length === 0) return prev;
        // Create new entry
        const newEntry: RosterEntry = {
          id: `roster-${Date.now()}`,
          day,
          shiftId,
          zoneId,
          staffIds,
          status: 'Assigned'
        };
        return [...prev, newEntry];
      }
    });
  };

  const handleClearRoster = () => {
    if (window.confirm('តើអ្នកពិតជាចង់សម្អាតរាល់ភារកិច្ចដែលបានចាត់តាំងទាំងអស់សម្រាប់សប្តាហ៍នេះមែនទេ?')) {
      setRoster([]);
      setAuditResult(null);
      setIsApproved(false);
      setApprovedBy('');
      setApprovedAt('');
      setNotificationSent(false);
    }
  };

  const handleAISolve = async () => {
    setIsAIWorking(true);
    setWarning(null);
    try {
      const response = await fetch('/api/generate-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff, zones, shifts: SHIFTS, currentRoster: roster })
      });
      const data = await response.json();
      if (data.success) {
        setRoster(data.roster);
        if (data.warning) {
          setWarning(data.warning);
        }
        // Switch to roster view
        setActiveTab('roster');
      } else {
        throw new Error(data.error || 'Server failed to optimize schedule');
      }
    } catch (err: any) {
      console.error(err);
      setWarning(`កំហុស AI Assist: ${err.message}។ កំពុងបង្ហាញការចាត់តាំងគំរូក្នុងតំបន់ជំនួសវិញ។`);
    } finally {
      setIsAIWorking(false);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setWarning(null);
    try {
      const response = await fetch('/api/safety-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff, zones, shifts: SHIFTS, roster })
      });
      const data = await response.json();
      if (data.success) {
        setAuditResult(data.audit);
        setAuditMode(data.mode);
        if (data.warning) {
          setWarning(data.warning);
        }
      } else {
        throw new Error(data.error || 'Server failed to analyze safety roster');
      }
    } catch (err: any) {
      console.error(err);
      setWarning(`កំហុសក្នុងការវាយតម្លៃ៖ ${err.message}។ បានដំណើរការម៉ាស៊ីនវិភាគក្នុងស្រុកជំនួសវិញ។`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Hard Reset to seeds
  const handlePreloadTemplate = () => {
    if (window.confirm('តើអ្នកចង់កំណត់មូលដ្ឋានទិន្នន័យឡើងវិញទៅជាគំរូដើមរបស់សាលារៀនមែនទេ? (ដែលរួមមានគណនីបុគ្គលិកគំរូ ច្រករបៀងបន្ទប់ទឹកជាន់ទី១-៥ ទីលានកីឡា និងខ្លោងទ្វារធំ)')) {
      setStaff(INITIAL_STAFF);
      setZones(INITIAL_ZONES);
      setRoster(INITIAL_ROSTER);
      setAuditResult(null);
      setWarning(null);
      setMinStaffZoneA(2);
      setMinStaffZoneB(3);
      setMinStaffZoneD(2);
      setMaxWeeklyDutiesTeachers(4);
      setIsApproved(false);
      setApprovedBy('');
      setApprovedAt('');
      setNotificationSent(false);
      setSelectedStaffForPersonalView('');
      localStorage.removeItem('school_safety_staff');
      localStorage.removeItem('school_safety_zones');
      localStorage.removeItem('school_safety_roster');
      localStorage.removeItem('school_safety_audit');
      localStorage.removeItem('school_safety_min_staff_a');
      localStorage.removeItem('school_safety_min_staff_b');
      localStorage.removeItem('school_safety_min_staff_d');
      localStorage.removeItem('school_safety_max_duties_teachers');
      localStorage.removeItem('school_safety_is_approved');
      localStorage.removeItem('school_safety_approved_by');
      localStorage.removeItem('school_safety_approved_at');
      localStorage.removeItem('school_safety_notification_sent');
      localStorage.removeItem('school_safety_selected_staff_view');
      localStorage.removeItem('school_safety_incidents');
      localStorage.removeItem('school_safety_perspective');
      setIncidents([
        {
          id: 'inc-1',
          zoneId: 'z-a3', // Playground
          reporterId: 't-1',
          reporterName: 'លោកគ្រូ សុភ័ក្រ្ត ជួប',
          severity: 'Medium',
          description: 'សិស្សម្នាក់បានរអិលជើងដួលពេលកំពុងរត់លេងនៅសួនកុមារធំ ជើងមានសភាពហើមស្រាល បានបញ្ជូនទៅបន្ទប់សុខភាពរួចរាល់។',
          timestamp: '02/07/2026, 08:30:00 AM',
          status: 'Resolved',
          photoUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format&fit=crop&q=60'
        },
        {
          id: 'inc-2',
          zoneId: 'z-b4', // 4th floor toilet
          reporterId: 't-2',
          reporterName: 'អ្នកគ្រូ សុជាតា គង់',
          severity: 'High',
          description: 'ឃើញមានសិស្សពីរនាក់ឈ្លោះគ្នា និងចង់បង្កជម្លោះធំនៅច្រករបៀងបន្ទប់ទឹកជាន់ទី៤។ បានឃាត់ទាន់ពេល និងរាយការណ៍ជូនការិយាល័យវិន័យ។',
          timestamp: '01/07/2026, 10:15:00 AM',
          status: 'Resolved',
          photoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&auto=format&fit=crop&q=60'
        },
        {
          id: 'inc-3',
          zoneId: 'z-a4', // Cafeteria
          reporterId: 't-3',
          reporterName: 'លោកគ្រូ ចាន់ត្រា សេង',
          severity: 'Low',
          description: 'មានសិស្សរអិលឥដ្ឋអាហារដ្ឋានដែលកំពុងសើម ប៉ុន្តែមិនមានរបួសធ្ងន់ធ្ងរទេ។ បានប្រាប់ឱ្យបុគ្គលិកអនាម័យជូតសម្អាតរួចរាល់។',
          timestamp: '02/07/2026, 12:10:00 PM',
          status: 'Reported',
          photoUrl: 'https://images.unsplash.com/photo-1541829019-259276a7f85c?w=500&auto=format&fit=crop&q=60'
        }
      ]);
      setCurrentPerspective('admin');
    }
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-teal-50 rounded-full text-teal-600 animate-pulse">
              <Shield className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">កំពុងទាញទិន្នន័យពី Firebase...</h2>
          <p className="text-sm text-slate-500 mb-6">សូមរង់ចាំមួយភ្លែត ខណៈពេលដែលប្រព័ន្ធកំពុងភ្ជាប់ទៅកាន់ Firestore សម្រាប់រក្សាទុកទិន្នន័យបុគ្គលិក និងវេនការងារល្បាត។</p>
          <div className="flex justify-center items-center gap-2 text-teal-600 font-medium text-sm">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>កំពុងភ្ជាប់ទៅកាន់ cloud database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased pb-12">
      {/* Top Warning Banner if Fallback or API issue */}
      {warning && (
        <div className="bg-indigo-600 text-white py-2.5 px-6 text-xs font-semibold flex items-center justify-between shadow-md border-b border-indigo-700">
          <div className="flex items-center gap-2 max-w-4xl">
            <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-indigo-200" />
            <span>{warning}</span>
          </div>
          <button onClick={() => setWarning(null)} className="text-white/80 hover:text-white font-bold px-2 cursor-pointer text-sm">
            ×
          </button>
        </div>
      )}

      {/* Header Navigation from Geometric Balance design */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xl font-display shadow-sm">S</div>
          <div>
            <h1 className="text-sm sm:text-base font-normal leading-tight text-slate-950 font-moul tracking-wide">ប្រព័ន្ធគ្រប់គ្រងកិច្ចប្រចាំការបុគ្គលិក សាលារៀនសុវណ្ណភូមិទួលពង្រ</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">តារាងវេនប្រចាំការ និងបញ្ជាការសុវត្ថិភាពសិស្សានុសិស្ស</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-semibold text-indigo-600">ការរៀបចំកាលវិភាគសកម្ម</span>
            <span className="text-xs font-bold text-slate-500">ទិដ្ឋភាពទូទៅប្រចាំសប្តាហ៍</span>
          </div>
          <div className="hidden md:block h-10 w-px bg-slate-200 mx-1"></div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs sm:text-sm font-bold text-slate-800 font-display">ផ្ទាំងគ្រប់គ្រងរដ្ឋបាលសាលា</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest">ប្រធានផ្នែកសុវត្ថិភាព</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-indigo-100 flex items-center justify-center text-indigo-700 font-bold font-display text-sm">
              CA
            </div>
          </div>
        </div>
      </header>

      {/* THREE PERSPECTIVES TAB SELECTOR BAR */}
      <div className="bg-slate-900 border-b border-slate-950 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest font-mono">
            ជ្រើសរើសរបៀបបង្ហាញកម្មវិធី (PERSPECTIVE SWITCHER):
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCurrentPerspective('admin')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              currentPerspective === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Admin Control</span>
          </button>

          <button
            onClick={() => setCurrentPerspective('staff')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              currentPerspective === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Staff View</span>
          </button>

          <button
            onClick={() => setCurrentPerspective('analytics')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              currentPerspective === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {currentPerspective === 'admin' && (
          <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display uppercase">
              មជ្ឈមណ្ឌលគ្រប់គ្រងកាលវិភាគប្រចាំការ
            </h2>
            <p className="text-slate-500 text-xs font-semibold">
              គ្រប់គ្រងវេនប្រចាំការរបស់ភ្នាក់ងារសន្តិសុខ និងលោកគ្រូអ្នកគ្រូ សម្របសម្រួលច្រករបៀងការពារសិស្ស និងវាយតម្លៃសុវត្ថិភាព។
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePreloadTemplate}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-md cursor-pointer transition-all shadow-xs"
            >
              កំណត់ឡើងវិញតាមគំរូដើម
            </button>
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'កំពុងវាយតម្លៃ...' : 'វាយតម្លៃភាគរយគ្របដណ្តប់'}
            </button>
          </div>
        </div>

        {/* Bento KPIs Grid (Geometric Balance Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Real-time Coverage Meter */}
          <div className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 relative overflow-hidden group">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-display">ភាគរយគ្របដណ្តប់សុវត្ថិភាព</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black font-display ${
                realTimeCoverage >= 90 ? 'text-emerald-600' :
                realTimeCoverage >= 70 ? 'text-amber-600' :
                'text-rose-600'
              }`}>{realTimeCoverage}%</span>
              <span className="text-xs font-medium text-slate-500">គោលដៅល្អបំផុត៖ ៩០%+</span>
            </div>
            <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 opacity-[0.03] pointer-events-none">
              <CheckSquare className="w-20 h-20 text-slate-900" />
            </div>
          </div>

          {/* KPI 2: Staff Profiles Counter */}
          <div className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 relative overflow-hidden group">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-display">គណនីបុគ្គលិកសកម្ម</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-display">{totalStaffCount} នាក់សកម្ម</span>
              <span className="text-xs font-medium text-indigo-600">
                ភ្នាក់ងារសន្តិសុខ {staff.filter(s => s.role === 'Security').length} នាក់
              </span>
            </div>
            <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 opacity-[0.03] pointer-events-none">
              <Users className="w-20 h-20 text-slate-900" />
            </div>
          </div>

          {/* KPI 3: Danger/Risk Zones count */}
          <div className="bg-white p-4 rounded-lg shadow-xs border border-slate-200 relative overflow-hidden group">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-display">តំបន់ហានិភ័យដែលត្រូវតាមដាន</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-display">{totalZoneCount} តំបន់</span>
              <span className="text-xs font-medium text-slate-500">
                ច្រករបៀង/បន្ទប់ទឹក {zones.filter(z => z.zoneType === 'Zone B').length} កន្លែង
              </span>
            </div>
            <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 opacity-[0.03] pointer-events-none">
              <MapPin className="w-20 h-20 text-slate-900" />
            </div>
          </div>

          {/* KPI 4: Unassigned slots count */}
          <div className="bg-indigo-600 p-4 rounded-lg shadow-md text-white relative overflow-hidden">
            <p className="text-[10px] opacity-85 uppercase font-bold tracking-wider font-display">ស្ថានភាពសាលារៀន</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base sm:text-lg font-black font-display tracking-wide">សុវត្ថិភាព / មានតុល្យភាព</span>
            </div>
            <p className="text-[10px] opacity-75 mt-1 font-medium">ជាន់ខ្ពស់ទាំងអស់ត្រូវបានយាមកាម</p>
          </div>

        </div>

        {/* Live Security Map Blueprint (Campus Map) */}
        <CampusMap
          roster={roster}
          staff={staff}
          zones={zones}
          escalationAlerts={escalationAlerts}
        />

        {/* ផ្នែកទី២៖ លំហូរដំណើរការប្រព័ន្ធ (App Logic Flow) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-5 bg-indigo-600 rounded-full"></div>
              <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wide">
                ផ្នែកទី២៖ លំហូរដំណើរការប្រព័ន្ធ (App Logic Flow)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">STEP-BY-STEP WORKFLOW</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-150 relative group transition-all hover:shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">01</span>
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">ដំណាក់កាលទី ១</h4>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 mb-1">បញ្ចូលទិន្នន័យ</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">បញ្ចូលព័ត៌មានបុគ្គលិក កំណត់តួនាទី និងកំណត់ទីតាំង/តំបន់សុវត្ថិភាពសាលា។</p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-150 relative group transition-all hover:shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">02</span>
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">ដំណាក់កាលទី ២</h4>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 mb-1">បង្កើតតារាង (AI/Auto)</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">ដំណើរការម៉ាស៊ីន AI ដើម្បីបង្កើត និងរៀបចំវេនប្រចាំការដោយស្វ័យប្រវត្តិតាមលក្ខខណ្ឌច្បាប់។</p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-150 relative group transition-all hover:shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">03</span>
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">ដំណាក់កាលទី ៣</h4>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 mb-1">ប្រតិបត្តិការផ្ទាល់</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">គ្រប់គ្រង កែប្រែ ឬបន្ថែមវេនប្រចាំការដោយផ្ទាល់លើតារាងមេតាមស្ថានភាពជាក់ស្តែង។</p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-150 relative group transition-all hover:shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">04</span>
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">ដំណាក់កាលទី ៤</h4>
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 mb-1">រាយការណ៍</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">វាយតម្លៃភាគរយគ្របដណ្តប់សុវត្ថិភាព តាមដានចំណុចខ្វះខាត និងទាញយករបាយការណ៍។</p>
            </div>
          </div>
        </div>

        {/* ដំណាក់កាលទី ១៖ ការកំណត់លក្ខខណ្ឌ (Admin Configuration & Rule Engine) */}
        <div className="bg-white border border-indigo-100 rounded-lg p-5 shadow-xs bg-linear-to-b from-white to-indigo-50/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wide">
                ដំណាក់កាលទី ១៖ ការកំណត់លក្ខខណ្ឌ (Admin Configuration)
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>សកម្ម៖ RULE ENGINE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ផ្នែកទី១៖ អ្នកប្រើប្រាស់ (Admin/School Principal) */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  ការកំណត់របស់គណៈគ្រប់គ្រង (Principal Configuration)
                </h4>
                <p className="text-[11px] text-slate-500">
                  កំណត់ចំនួនបុគ្គលិក និងគ្រូប្រចាំការយ៉ាងតិចដែលត្រូវយាមកាមក្នុងមួយថ្ងៃតាមតំបន់នីមួយៗ។
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Rule B: Corridors and Restrooms */}
                <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm uppercase">Zone B</span>
                    <p className="font-bold text-xs text-slate-800 mt-1.5">ច្រករបៀង និងបង្គន់</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">ជាន់ទី១ ដល់ ជាន់ទី៥</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">យ៉ាងតិចក្នុងមួយជាន់</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setMinStaffZoneB(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-600 text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-slate-900 font-mono w-4 text-center">{minStaffZoneB}</span>
                      <button
                        onClick={() => setMinStaffZoneB(prev => Math.min(5, prev + 1))}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-600 text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rule A: Common Areas */}
                <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm uppercase">Zone A</span>
                    <p className="font-bold text-xs text-slate-800 mt-1.5">ទីធ្លារួម និងសួនច្បារ</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">ទីលានកីឡា អាហារដ្ឋាន សួន</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">យ៉ាងតិចក្នុងមួយកន្លែង</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setMinStaffZoneA(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-600 text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-slate-900 font-mono w-4 text-center">{minStaffZoneA}</span>
                      <button
                        onClick={() => setMinStaffZoneA(prev => Math.min(5, prev + 1))}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-600 text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rule D: Entrances */}
                <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-sm uppercase">Zone D</span>
                    <p className="font-bold text-xs text-slate-800 mt-1.5">ខ្លោងទ្វារ និងច្រកចេញ</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">ទ្វារធំ និងទ្វារក្រោយសាលា</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">យ៉ាងតិចក្នុងមួយច្រក</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setMinStaffZoneD(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-600 text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-slate-900 font-mono w-4 text-center">{minStaffZoneD}</span>
                      <button
                        onClick={() => setMinStaffZoneD(prev => Math.min(5, prev + 1))}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-600 text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ផ្នែកទី២៖ Rule Engine (ច្បាប់សាលា) */}
            <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  ម៉ាស៊ីនច្បាប់សាលា (School Rule Engine)
                </h4>
                <p className="text-[11px] text-slate-500">
                  ការរឹតត្បិតកិច្ចការងារដើម្បីជៀសវាងការនឿយហត់របស់បុគ្គលិក និងរក្សាតុល្យភាពការងារប្រចាំសប្តាហ៍។
                </p>
              </div>

              <div className="bg-indigo-50/40 p-4 rounded-lg border border-indigo-100/60 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-indigo-100 text-indigo-700 rounded-sm">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-slate-800">ច្បាប់ការពារការជាប់ Duty ប្រចាំថ្ងៃ</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ច្បាប់សាលា៖ កំណត់មិនឱ្យបុគ្គលិកម្នាក់ជាប់ Duty រាល់ថ្ងៃ ច័ន្ទ-សុក្រ។ ដោយសារសប្តាហ៍សិក្សាមាន ៥ ថ្ងៃ យើងកំណត់ចំនួនថ្ងៃបំពេញភារកិច្ចអតិបរមាប្រចាំសប្តាហ៍របស់ពួកគេត្រឹម៖
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-md border border-indigo-100/40">
                  <span className="text-xs font-semibold text-slate-700">ចំនួនថ្ងៃបំពេញភារកិច្ចអតិបរមាក្នុងមួយសប្តាហ៍៖</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={maxWeeklyDutiesTeachers}
                      onChange={(e) => setMaxWeeklyDutiesTeachers(parseInt(e.target.value))}
                      className="text-xs font-bold font-mono text-indigo-700 border border-indigo-200 rounded px-2 py-1 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value={1}>១ ថ្ងៃ/ដង (តឹងរ៉ឹងបំផុត)</option>
                      <option value={2}>២ ថ្ងៃ/ដង (តឹងរ៉ឹង)</option>
                      <option value={3}>៣ ថ្ងៃ/ដង (មធ្យម)</option>
                      <option value={4}>៤ ថ្ងៃ/ដង (ទូទៅ - មិនជាប់រាល់ថ្ងៃ)</option>
                      <option value={5}>៥ ថ្ងៃ/ដង (ពេញមួយសប្តាហ៍)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                  <span>សកម្ម៖ ម៉ាស៊ីន AI និង Heuristic នឹងធានាថាលោកគ្រូអ្នកគ្រូជាប់ Duty អតិបរមាត្រឹម {maxWeeklyDutiesTeachers} ថ្ងៃប៉ុណ្ណោះក្នុងមួយសប្តាហ៍។</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ដំណាក់កាលទី ២៖ ការបង្កើតតារាងស្វ័យប្រវត្ត (Auto-Generation & Notification Flow) */}
        <div className="bg-white border border-indigo-100 rounded-lg p-5 shadow-xs bg-linear-to-b from-white to-indigo-50/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wide">
                ដំណាក់កាលទី ២៖ ការបង្កើតតារាងស្វ័យប្រវត្ត (Auto-Generation & Notification Flow)
              </h3>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-mono uppercase">
              Conflict-Free Optimizer
            </span>
          </div>

          {/* Explanation of the Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <p className="font-bold text-xs text-slate-800">ចុច "Generate Roster"</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ប្រព័ន្ធទាញទិន្នន័យបុគ្គលិក មកផ្គូរផ្គងជាមួយ ទីតាំង (Zones) និង ម៉ោង (Time Slots) ដោយស្វ័យប្រវត្ត។
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <p className="font-bold text-xs text-slate-800">ផ្ទៀងផ្ទាត់ការជាន់គ្នា (Conflict Check)</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ប្រព័ន្ធពិនិត្យមើលថាតើមានគ្រូណាម្នាក់ជាប់ម៉ោងបង្រៀន ចំម៉ោងត្រូវយាមដែរឬទេ?
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <p className="font-bold text-xs text-slate-800">ការដោះស្រាយ & បង្កើតតារាង</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>បើជាន់៖</strong> ប្រព័ន្ធប្តូររកអ្នកទំនេរជំនួស។ <strong className="text-emerald-700">បើអត់ជាន់៖</strong> បង្កើតតារាងសម្រេច (Final Roster)។
              </p>
            </div>
          </div>

          {/* Interactive Simulation Dashboard Component */}
          <div className="bg-slate-900 text-slate-200 rounded-lg p-5 border border-slate-800 font-mono shadow-inner relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <span className="text-xs text-slate-400 font-bold ml-2">ROSTER_SCHEDULER_OPTIMIZER.SH</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                <span>ប្រព័ន្ធផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិ</span>
              </div>
            </div>

            {/* Stepper display */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 text-xs">
              <div className={`p-2.5 rounded border transition-all flex items-center gap-2 ${activeSimulationStep === 1 ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200' : 'bg-slate-950/30 border-slate-800 text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span>ទាញទិន្នន័យ</span>
              </div>
              <div className={`p-2.5 rounded border transition-all flex items-center gap-2 ${activeSimulationStep === 2 ? 'bg-amber-950/30 border-amber-500 text-amber-200' : 'bg-slate-950/30 border-slate-800 text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span>ពិនិត្យជាន់គ្នា (Conflict)</span>
              </div>
              <div className={`p-2.5 rounded border transition-all flex items-center gap-2 ${activeSimulationStep === 3 ? 'bg-emerald-950/30 border-emerald-500 text-emerald-200' : 'bg-slate-950/30 border-slate-800 text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <span>ដោះស្រាយជាន់ម៉ោង</span>
              </div>
              <div className={`p-2.5 rounded border transition-all flex items-center gap-2 ${activeSimulationStep === 4 ? 'bg-teal-950/30 border-teal-500 text-teal-200' : 'bg-slate-950/30 border-slate-800 text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                <span>តារាងសម្រេចមេ</span>
              </div>
            </div>

            {/* Log Messages Output */}
            <div className="bg-slate-950/80 rounded border border-slate-800/80 p-4 h-48 overflow-y-auto space-y-2 text-xs font-mono scrollbar-thin scrollbar-thumb-slate-800">
              {simulationLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Play className="w-8 h-8 text-slate-600 stroke-1" />
                  <p>ចុចលើប៊ូតុងខាងក្រោមដើម្បីសាកល្បងដំណើរការបញ្ជូនទិន្នន័យ និងផ្ទៀងផ្ទាត់ភាពជាន់គ្នា</p>
                </div>
              ) : (
                simulationLogs.map((log, index) => {
                  let textClass = "text-slate-300";
                  if (log.includes('⚠️')) textClass = "text-amber-400 font-bold";
                  else if (log.includes('✅')) textClass = "text-emerald-400 font-bold";
                  else if (log.includes('🔄')) textClass = "text-indigo-400";
                  else if (log.includes('🎉')) textClass = "text-teal-400 font-extrabold";
                  else if (log.includes('📢')) textClass = "text-indigo-300";
                  return (
                    <div key={index} className={`leading-relaxed py-0.5 border-l-2 pl-2 border-slate-800 hover:bg-slate-900/40 transition-colors ${textClass}`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>

            {/* Interactive Visual Conflict Card Displayed during simulation */}
            {simulationState !== 'idle' && (
              <div className="mt-4 p-4 rounded bg-slate-950 border border-slate-800/80 animate-fade-in">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400 animate-pulse" />
                  ស្ថានភាពផ្ទៀងផ្ទាត់បច្ចុប្បន្ន (Conflict Checker Status View)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conflict display (before/during check) */}
                  <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-ping"></span>
                      រកឃើញការជាន់គ្នា (Class Conflict Detected)
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">លោកគ្រូ សុភ័ក្រ្ត ជួប (គ្រូបង្រៀន)</p>
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>ម៉ោងទៅផ្ទះព្រឹក៖</span>
                          <span className="text-rose-400 font-bold">10:45 AM - 11:10 AM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>កាលវិភាគបង្រៀន៖</span>
                          <span className="text-rose-400 font-bold">បង្រៀនវិទ្យាសាស្ត្រ (ថ្នាក់ ៨អា)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resolved display (after matching) */}
                  <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ដំណោះស្រាយរបស់ AI/Engine (Resolved by Engine)
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">លោកគ្រូ ចាន់ត្រា សេង (គ្រូបង្រៀនជំនួស)</p>
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>ស្ថានភាពម៉ោងបង្រៀន៖</span>
                          <span className="text-emerald-400 font-bold">ទំនេរ (មិនជាប់ម៉ោងបង្រៀន)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ភារកិច្ចថ្មី៖</span>
                          <span className="text-emerald-400 font-bold">ប្រចាំការ ច្រករបៀង ជាន់ទី ៤</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Action Strip */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-500">សាកល្បងម៉ាស៊ីន AI-Roster Engine តាមពេលវេលាជាក់ស្តែង</span>
              <div className="flex gap-2 w-full sm:w-auto">
                {simulationState !== 'idle' && (
                  <button
                    onClick={() => {
                      setSimulationState('idle');
                      setSimulationLogs([]);
                      setActiveSimulationStep(0);
                    }}
                    className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold bg-slate-850 hover:bg-slate-800 text-slate-300 rounded cursor-pointer transition-all border border-slate-750"
                  >
                    សម្អាតម៉ាស៊ីន (Reset)
                  </button>
                )}
                <button
                  onClick={runConflictCheckSimulation}
                  disabled={simulationState !== 'idle' && simulationState !== 'done'}
                  className={`w-full sm:w-auto px-4 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                    simulationState !== 'idle' && simulationState !== 'done'
                      ? 'bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-sm active:scale-98'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>ដំណើរការម៉ាស៊ីនផ្ទៀងផ្ទាត់ (Run Simulation)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ដំណាក់កាលទី ៣ និង ទី ៤៖ ការអនុម័ត និង ការជូនដំណឹង (Approval & Notification Flow) */}
        <div className="bg-white border border-indigo-100 rounded-lg p-5 shadow-xs bg-linear-to-b from-white to-indigo-50/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wide">
                ដំណាក់កាលទី ៣ និង ទី ៤៖ ការអនុម័ត និង ការជូនដំណឹង (Approval & Notification Flow)
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ប្រព័ន្ធជូនដំណឹងសកម្ម</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ផ្នែកទី១៖ ដំណើរការអនុម័តដោយនាយកសាលា (Principal Approval Flow) */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  ការអនុម័តកាលវិភាគយាម (Roster Approval)
                </h4>
                <p className="text-[11px] text-slate-500">
                  បន្ទាប់ពីប្រព័ន្ធ AI/Heuristic បង្កើតតារាងការងាររួចរាល់ នាយកសាលាត្រូវពិនិត្យ និងចុច "Approve" ដើម្បីសម្រេចជាផ្លូវការ។
                </p>
              </div>

              <div className="p-4 rounded-lg border flex flex-col justify-between h-40 transition-all duration-300 relative overflow-hidden bg-slate-50 border-slate-200">
                <div className="z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ស្ថានភាពចុងក្រោយ</span>
                  {isApproved ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-emerald-600">បានអនុម័តរួចរាល់ (APPROVED)</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          អនុម័តដោយ៖ {approvedBy || 'នាយកសាលា'} • ម៉ោង៖ {approvedAt}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-amber-600">រង់ចាំការពិនិត្យ & អនុម័ត (PENDING)</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          សូមពិនិត្យមើលកាលវិភាគមេខាងក្រោម រួចចុចអនុម័តដើម្បីបញ្ជូនព័ត៌មាន។
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="z-10 flex gap-2">
                  {!isApproved ? (
                    <button
                      onClick={() => {
                        setIsApproved(true);
                        setApprovedBy('លោកនាយក សុខ ជា');
                        const nowStr = new Date().toLocaleString('kh-KH', { hour12: true });
                        setApprovedAt(nowStr);
                        setWarning('🎉 ជោគជ័យ៖ តារាងកាលវិភាគយាមប្រចាំការត្រូវបានអនុម័តដោយជោគជ័យ! បញ្ជីឈ្មោះត្រូវបានរក្សាទុកជាផ្លូវការ។');
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider font-display rounded-md cursor-pointer transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ចុចអនុម័តតារាងការងារ (Approve Roster)</span>
                    </button>
                  ) : (
                    <div className="w-full flex gap-2">
                      <button
                        onClick={() => {
                          setIsApproved(false);
                          setApprovedBy('');
                          setApprovedAt('');
                          setNotificationSent(false);
                        }}
                        className="px-3 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 font-semibold text-xs rounded-md cursor-pointer transition-all"
                      >
                        លុបការអនុម័ត
                      </button>
                      <button
                        disabled
                        className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs uppercase tracking-wider font-display rounded-md flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>បានអនុម័តរួចរាល់</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Background decorative watermark */}
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
                  <CheckSquare className="w-32 h-32 text-indigo-900" />
                </div>
              </div>
            </div>

            {/* ផ្នែកទី២៖ ប្រព័ន្ធជូនដំណឹងទៅកាន់ទូរស័ព្ទ/Email (Notification Push Flow) */}
            <div className="space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  ការផ្ញើដំណឹងប្រចាំការ (Notification Push)
                </h4>
                <p className="text-[11px] text-slate-500">
                  ប្រព័ន្ធនឹងរុញ (Push) កាលវិភាគផ្ទាល់ខ្លួនទៅកាន់លេខទូរស័ព្ទ (SMS/Telegram) ឬ Email របស់បុគ្គលិកម្នាក់ៗ។
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-slate-50 border-slate-200 flex flex-col justify-between h-40 transition-all duration-300 relative overflow-hidden">
                <div className="z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ស្ថានភាពផ្ញើសារ</span>
                  {notificationSent ? (
                    <div className="mt-2 flex items-center gap-2 animate-fade-in">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-indigo-600">បានផ្ញើដំណឹងរួចរាល់ (PUSHED)</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          សារត្រូវបានបញ្ជូនទៅបុគ្គលិកទាំងអស់តាមរយៈ SMS និង Telegram Group!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center">
                        <BellOff className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-500">មិនទាន់បានផ្ញើ (Waiting to Send)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          សូមអនុម័តតារាងការងារសិន ទើបអាចផ្ញើដំណឹងទៅទូរស័ព្ទបុគ្គលិកបាន។
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="z-10">
                  <button
                    onClick={() => {
                      if (!isApproved) {
                        setWarning('⚠️ សូមចុចអនុម័តតារាងការងារ (Approve) ខាងឆ្វេងជាមុនសិន មុននឹងផ្ញើដំណឹងទៅបុគ្គលិក!');
                        return;
                      }
                      setIsSendingNotification(true);
                      setTimeout(() => {
                        setIsSendingNotification(false);
                        setNotificationSent(true);
                        setWarning('📢 រួចរាល់៖ កាលវិភាគផ្ទាល់ខ្លួនត្រូវបានបញ្ជូនទៅកាន់ទូរស័ព្ទរបស់បុគ្គលិកម្នាក់ៗតាម SMS/Telegram និង Email រួចរាល់ជាស្វ័យប្រវត្ត!');
                      }, 2000);
                    }}
                    disabled={isSendingNotification || (!isApproved && !notificationSent)}
                    className={`w-full py-2 font-bold text-xs uppercase tracking-wider font-display rounded-md cursor-pointer transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5 ${
                      isSendingNotification
                        ? 'bg-indigo-50 text-indigo-400 border border-indigo-100 cursor-not-allowed'
                        : !isApproved
                        ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600'
                    }`}
                  >
                    {isSendingNotification ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-indigo-600 animate-bounce" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>កំពុងរុញសារជូនដំណឹង...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>ផ្ញើដំណឹងការងារទៅបុគ្គលិកទាំងអស់ (Push Notification)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ផ្នែកទី៣៖ កាលវិភាគផ្ទាល់ខ្លួនរបស់បុគ្គលិក (Staff Personal Duty Schedule View) */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  កាលវិភាគយាមផ្ទាល់ខ្លួនរបស់បុគ្គលិក (Personal Duty View)
                </h4>
                <p className="text-[11px] text-slate-500">
                  បុគ្គលិកម្នាក់ៗឃើញតែកាលវិភាគយាមផ្ទាល់ខ្លួន៖ ជ្រើសរើសឈ្មោះបុគ្គលិកដើម្បីទស្សនាទិដ្ឋភាពទូរស័ព្ទរបស់ពួកគេ។
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold font-display shrink-0">ជ្រើសរើសបុគ្គលិក៖</span>
                <select
                  value={selectedStaffForPersonalView}
                  onChange={(e) => setSelectedStaffForPersonalView(e.target.value)}
                  className="text-xs font-bold font-mono text-indigo-700 border border-indigo-200 rounded px-3 py-1.5 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- ជ្រើសរើសឈ្មោះបុគ្គលិក / គ្រូ --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === 'Security' ? 'សន្តិសុខ' : s.role === 'Management' ? 'គណៈគ្រប់គ្រង' : 'គ្រូបង្រៀន'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStaffForPersonalView ? (
              (() => {
                const selectedMember = staff.find(s => s.id === selectedStaffForPersonalView);
                if (!selectedMember) return null;

                // Find all entries in roster containing this staff ID
                const personalEntries = roster.filter(entry => entry.staffIds.includes(selectedStaffForPersonalView));

                const helperGetDayTranslation = (day: string) => {
                  switch (day) {
                    case 'Monday': return 'ចន្ទ';
                    case 'Tuesday': return 'អង្គារ';
                    case 'Wednesday': return 'ពុធ';
                    case 'Thursday': return 'ព្រហស្បតិ៍';
                    case 'Friday': return 'សុក្រ';
                    default: return day;
                  }
                };

                const helperGetShiftTranslation = (name: string) => {
                  switch (name) {
                    case 'Morning Admission': return 'ម៉ោងចូលរៀនពេលព្រឹក';
                    case 'Recess & Play': return 'ម៉ោងចេញលេងខ្លី';
                    case 'Lunch Break': return 'ម៉ោងសម្រាកអាហារថ្ងៃត្រង់';
                    case 'Afternoon Dismissal': return 'ម៉ោងចេញពីសាលាពេលរសៀល';
                    default: return name;
                  }
                };

                const helperGetFloorTranslation = (floor: string) => {
                  switch (floor) {
                    case 'Ground': return 'ជាន់ផ្ទាល់ដី';
                    case '1st Floor': return 'ជាន់ទី ១';
                    case '2nd Floor': return 'ជាន់ទី ២';
                    case '3rd Floor': return 'ជាន់ទី ៣';
                    case '4th Floor': return 'ជាន់ទី ៤';
                    case '5th Floor': return 'ជាន់ទី ៥';
                    default: return floor;
                  }
                };

                const helperGetRoleTranslation = (role: string) => {
                  switch (role) {
                    case 'Security': return 'សន្តិសុខ';
                    case 'Management': return 'គណៈគ្រប់គ្រង';
                    case 'Teacher': return 'គ្រូបង្រៀន';
                    default: return role;
                  }
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in">
                    {/* Simulated Smartphone Device Mockup */}
                    <div className="md:col-span-5 bg-slate-950 p-3 rounded-[32px] border-4 border-slate-800 shadow-xl max-w-sm mx-auto w-full relative">
                      {/* Notch */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-25"></div>
                      
                      {/* Phone screen container */}
                      <div className="bg-slate-100 rounded-[24px] overflow-hidden border border-slate-900 pt-6 pb-4 px-3 flex flex-col h-[400px] text-slate-800">
                        {/* Custom App notification Header bar */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 mt-1 px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                              <Shield className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                            <div>
                              <p className="font-extrabold text-[11px] leading-none text-slate-900">សាលារៀន សុវណ្ណភូមិ</p>
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                Online (Telegram Roster-Bot)
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">២០២៦</span>
                        </div>

                        {/* Text Message content */}
                        <div className="flex-1 overflow-y-auto space-y-3 px-1 scrollbar-none">
                          {/* Bot Message Bubble */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2 text-xs">
                            <p className="font-extrabold text-indigo-700 text-[11px] border-b border-slate-100 pb-1 flex items-center gap-1">
                              <Bell className="w-3 h-3 text-indigo-600 animate-bounce" />
                              សេចក្តីជូនដំណឹងពីវេនប្រចាំការប្រចាំសប្តាហ៍
                            </p>
                            <p className="text-slate-700 leading-relaxed text-[11px]">
                              សូមគោរពជម្រាបសួរ <strong>{selectedMember.name}</strong> ({helperGetRoleTranslation(selectedMember.role)})!
                            </p>
                            <p className="text-slate-600 text-[11px]">
                              តារាងកាលវិភាគប្រចាំការរបស់លោកអ្នកសម្រាប់សប្តាហ៍នេះត្រូវបានអនុម័តរួចរាល់។ លោកអ្នកមានភារកិច្ចការពារសុវត្ថិភាពសិស្សានុសិស្សចំនួន <strong className="text-indigo-600 font-mono text-xs">{personalEntries.length} វេន</strong> ដូចខាងក្រោម៖
                            </p>

                            {/* List of duties in phone */}
                            {personalEntries.length === 0 ? (
                              <div className="p-3 bg-slate-50 rounded border border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
                                គ្មានភារកិច្ចត្រូវយាមកាមទេសម្រាប់សប្តាហ៍នេះ! (ទំនេរ)
                              </div>
                            ) : (
                              <div className="space-y-2 pt-1">
                                {personalEntries.map(entry => {
                                  const shift = SHIFTS.find(s => s.id === entry.shiftId);
                                  const zone = zones.find(z => z.id === entry.zoneId);
                                  if (!shift || !zone) return null;
                                  return (
                                    <div key={entry.id} className="p-2 bg-slate-50 border-l-3 border-indigo-600 rounded text-[10px] space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-indigo-700">ថ្ងៃ{helperGetDayTranslation(entry.day)}</span>
                                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-bold font-mono">
                                          {shift.timeSlot}
                                        </span>
                                      </div>
                                      <p className="font-bold text-slate-800">{helperGetShiftTranslation(shift.name)}</p>
                                      <p className="text-slate-500 font-medium flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {zone.name} ({helperGetFloorTranslation(zone.floor)})
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="text-[9px] text-slate-400 mt-2 text-right border-t border-slate-100 pt-1.5 font-bold">
                              {approvedAt ? `បានបញ្ជាក់៖ ${approvedAt}` : 'ប្រព័ន្ធគ្រប់គ្រងសុវត្ថិភាពសាលា'}
                            </div>
                          </div>
                        </div>

                        {/* Telegram Quick Actions mock */}
                        <div className="mt-2 bg-white p-2 rounded-lg border border-slate-200 text-center text-[10px] font-bold text-indigo-700 flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-50">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ចុចទីនេះដើម្បីបញ្ជាក់ការទទួលដឹង (Acknowledge Receipt)</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analysis of Personal Schedule side-by-side */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          <h5 className="font-bold text-sm text-slate-900">
                            ព័ត៌មានបុគ្គលិក និងការវិភាគកិច្ចការងាររបស់ {selectedMember.name}
                          </h5>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-lg border border-slate-150">
                          <div>
                            <span className="text-slate-400 font-medium block">តួនាទី៖</span>
                            <span className="font-bold text-slate-800 text-sm">{helperGetRoleTranslation(selectedMember.role)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">ម៉ោងបម្រើការងារ៖</span>
                            <span className="font-bold text-slate-850 font-mono">{selectedMember.workingHours}</span>
                          </div>
                          <div className="mt-2 text-ellipsis overflow-hidden">
                            <span className="text-slate-400 font-medium block">សារអេឡិចត្រូនិច (Email)៖</span>
                            <span className="font-semibold text-slate-700 font-mono text-[11px]">{selectedMember.email}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-slate-400 font-medium block">លេខទូរស័ព្ទ៖</span>
                            <span className="font-bold text-slate-750 font-mono">{selectedMember.phone}</span>
                          </div>
                        </div>

                        {/* Rules Evaluation */}
                        <div className="space-y-2 pt-1 text-xs">
                          <p className="font-bold text-slate-700">ស្ថានភាពច្បាប់សាលា និងការនឿយហត់ (Rule Validation):</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="p-3 bg-white rounded border border-slate-100 space-y-1">
                              <span className="text-[10px] text-slate-400 block font-semibold">ចំនួន Duty អតិបរមាដែលអនុញ្ញាត៖</span>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{selectedMember.maxWeeklyDuties} ដង / សប្តាហ៍</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">RULE ENGINE ACTIVE</span>
                              </div>
                            </div>

                            <div className="p-3 bg-white rounded border border-slate-100 space-y-1">
                              <span className="text-[10px] text-slate-400 block font-semibold">ចំនួន Duty ដែលបានចាត់តាំងជាក់ស្តែង៖</span>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{personalEntries.length} ដង / សប្តាហ៍</span>
                                {personalEntries.length > selectedMember.maxWeeklyDuties ? (
                                  <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3 text-rose-600 animate-pulse" /> Overloaded
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" /> Compliant
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Conflict Check visual assurance */}
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100/80 flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-xs text-emerald-800">គ្មានភាពជាន់គ្នាជាមួយម៉ោងបង្រៀនឡើយ (0 Conflicts)</p>
                            <p className="text-[11px] text-emerald-600 leading-relaxed mt-0.5">
                              កាលវិភាគយាមរបស់ {selectedMember.name} ត្រូវបានផ្ទៀងផ្ទាត់ឆ្លងកាត់ម៉ាស៊ីន Heuristic Matcher រួចរាល់។ រាល់ម៉ោងយាមទាំងអស់មិនប៉ះពាល់ដល់ម៉ោងបង្រៀនឡើយ។
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 space-y-2 text-xs">
                <User className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                <p>សូមជ្រើសរើសឈ្មោះបុគ្គលិក ឬលោកគ្រូអ្នកគ្រូម្នាក់ពីម៉ឺនុយខាងលើ ដើម្បីមើលទិដ្ឋភាពទូរស័ព្ទ និងសារជូនដំណឹងប្រចាំការរបស់ពួកគេ។</p>
              </div>
            )}
          </div>
        </div>

        {/* ==================== ដំណាក់កាលទី ៣៖ លំហូរពេលប្រតិបត្តិការ (Live Operations Flow) ==================== */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs bg-linear-to-b from-white to-slate-50/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wide">
                ដំណាក់កាលទី ៣៖ លំហូរពេលប្រតិបត្តិការ (Live Operations Flow)
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ម៉ាស៊ីនប្រតិបត្តិការផ្ទាល់ (LIVE OPERATION ENGINE ACTIVE)</span>
            </div>
          </div>

          {/* Intro Description */}
          <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
            ដើម្បីធានាសុវត្ថិភាពសិស្សានុសិស្សពេញមួយថ្ងៃ និងគ្មានចន្លោះប្រហោង ប្រព័ន្ធផ្តល់នូវមុខងារសំខាន់ៗចំនួន ៣៖
            <strong> ការ Check-in តាម QR Code/ទីតាំង</strong>, <strong>ប្រព័ន្ធប្រកាសអាសន្ន (Escalation Alert)</strong> ពេលមានការយឺតយ៉ាវ និង <strong>ប្រព័ន្ធស្នើសុំប្តូរវេនយាម (Shift Swapping)</strong> ដោយស្វ័យប្រវត្ត។ សាកល្បងលំហូរនីមួយៗខាងក្រោម៖
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: QR CODE & GEOFENCED CHECK-IN */}
            <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">លំហូរទី ១</span>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-slate-600" />
                  ការ Check-in តាមទីតាំង (QR Code / Geofencing)
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  នៅពេលដល់ម៉ោងយាម បុគ្គលិកត្រូវដើរទៅកាន់ទីតាំង រួចស្កែន QR Code ដែលបិទនៅជញ្ជាំងដើម្បី Check-in ចូលតួនាទី។
                </p>
              </div>

              {/* Simulation Interactive Card */}
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ជ្រើសរើសវេនការងារដើម្បីបំពេញការ Check-In៖</label>
                <select
                  value={liveSelectedEntryId}
                  onChange={(e) => setLiveSelectedEntryId(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                >
                  <option value="">-- សូមជ្រើសរើសវេនការងារ --</option>
                  {roster
                    .filter(r => r.staffIds.length > 0)
                    .map(r => {
                      const dayKh = r.day === 'Monday' ? 'ចន្ទ' : r.day === 'Tuesday' ? 'អង្គារ' : r.day === 'Wednesday' ? 'ពុធ' : r.day === 'Thursday' ? 'ព្រហسبតិ៍' : 'សុក្រ';
                      const zone = zones.find(z => z.id === r.zoneId);
                      const shift = SHIFTS.find(s => s.id === r.shiftId);
                      const staffNames = r.staffIds.map(id => staff.find(s => s.id === id)?.name || '').join(', ');
                      return (
                        <option key={r.id} value={r.id}>
                          ថ្ងៃ{dayKh} ({shift?.timeSlot}) - {zone?.name} [{staffNames}] ({r.status})
                        </option>
                      );
                    })}
                </select>

                {liveSelectedEntryId ? (
                  (() => {
                    const entry = roster.find(r => r.id === liveSelectedEntryId);
                    if (!entry) return null;
                    const zone = zones.find(z => z.id === entry.zoneId);
                    const isCheckedIn = entry.status === 'Checked-In';

                    return (
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">ស្ថានភាពស្កែន</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCheckedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                          }`}>
                            {isCheckedIn ? 'Checked-In រួចរាល់' : 'រង់ចាំការស្កែន'}
                          </span>
                        </div>

                        {/* Simulated QR Poster */}
                        <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-200 bg-slate-50 rounded-lg">
                          {/* QR Mock graphic using SVG vector */}
                          <div className="w-20 h-20 bg-white p-1.5 border border-slate-200 rounded-lg flex items-center justify-center shadow-xs">
                            <div className="grid grid-cols-4 gap-1 w-full h-full p-0.5 animate-pulse">
                              {/* Draw a stylized representation of a QR code */}
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-50"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-50"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-50"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-50"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                              <div className="bg-slate-50"></div>
                              <div className="bg-slate-900 rounded-xs"></div>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-1.5 font-mono uppercase">WALL QR CODE: {zone?.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium text-center mt-0.5">ទីតាំងកូដ៖ {zone?.floor !== 'N/A' ? `${zone?.floor === 'Ground' ? 'ជាន់ផ្ទាល់ដី' : zone?.floor}` : ''} ជញ្ជាំងអគារ</p>
                        </div>

                        <button
                          onClick={() => handleLiveCheckIn(liveSelectedEntryId)}
                          disabled={isCheckedIn}
                          className={`w-full py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            isCheckedIn
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs active:scale-98'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>ស្កែន QR Code ដើម្បី Check-In ចូលយាម</span>
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-6 border border-dashed border-slate-200 bg-white rounded-lg text-center text-slate-400 text-[11px] px-3">
                    សូមជ្រើសរើសវេនការងារខាងលើ ដើម្បីមើលកូដ QR Code ជញ្ជាំង និងស្កែន Check-In។
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: ESCALATION ALERT */}
            <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">លំហូរទី ២</span>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" />
                  ប្រព័ន្ធប្រកាសអាសន្ន (Escalation Alert)
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ប្រសិនបើហួសម៉ោងយាម ៥នាទី ហើយនៅតែមិនទាន់មានបុគ្គលិក Check-in នោះប្រព័ន្ធនឹងលោត Alert ទៅទូរស័ព្ទរបស់ប្រធានផ្នែកវិន័យដើម្បីបញ្ជូនមនុស្សជំនួសជាបន្ទាន់។
                </p>
              </div>

              {/* Simulation Interactive Card */}
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ជ្រើសរើសវេនការងារ (ដែលមិនទាន់ Check-in)៖</label>
                <select
                  value={liveSelectedEntryId}
                  onChange={(e) => setLiveSelectedEntryId(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                >
                  <option value="">-- សូមជ្រើសរើសវេនការងារ --</option>
                  {roster
                    .filter(r => r.staffIds.length > 0 && r.status !== 'Checked-In')
                    .map(r => {
                      const dayKh = r.day === 'Monday' ? 'ចន្ទ' : r.day === 'Tuesday' ? 'អង្គារ' : r.day === 'Wednesday' ? 'ពុធ' : r.day === 'Thursday' ? 'ព្រហស្បតិ៍' : 'សុក្រ';
                      const zone = zones.find(z => z.id === r.zoneId);
                      const shift = SHIFTS.find(s => s.id === r.shiftId);
                      const staffNames = r.staffIds.map(id => staff.find(s => s.id === id)?.name || '').join(', ');
                      return (
                        <option key={r.id} value={r.id}>
                          ថ្ងៃ{dayKh} ({shift?.timeSlot}) - {zone?.name} [{staffNames}]
                        </option>
                      );
                    })}
                </select>

                <button
                  onClick={() => {
                    if (!liveSelectedEntryId) {
                      setWarning('❌ សូមជ្រើសរើសវេនការងារមួយដើម្បីដំណើរការការខកខាន!');
                      return;
                    }
                    handleTriggerEscalation(liveSelectedEntryId);
                  }}
                  className="w-full py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-98"
                >
                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                  <span>បន្លំ៖ ហួសម៉ោងយាម ៥នាទី (Simulate 5-min No-Show)</span>
                </button>

                {/* Display active escalation warnings */}
                <div className="space-y-2.5">
                  {escalationAlerts.length > 0 ? (
                    escalationAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border text-xs space-y-2.5 transition-all ${
                          alert.solved
                            ? 'bg-emerald-50 border-emerald-100 text-slate-600'
                            : 'bg-rose-50 border-rose-200 text-rose-950 animate-pulse'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold flex items-center gap-1 text-[10px] uppercase text-rose-700">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            {alert.solved ? 'ដោះស្រាយរួចរាល់' : 'ប្រកាសអាសន្នសកម្ម'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">{alert.timestamp}</span>
                        </div>

                        <p className="leading-relaxed font-semibold">{alert.msg}</p>

                        {!alert.solved ? (
                          <div className="space-y-2 border-t border-rose-100 pt-2 bg-rose-100/30 p-2 rounded">
                            <label className="block text-[9px] font-black uppercase text-rose-900 tracking-wider">ជ្រើសរើសគ្រូជំនួសជាបន្ទាន់ (Backup Staff)៖</label>
                            <div className="flex gap-1.5">
                              <select
                                value={liveSelectedBackupStaffId}
                                onChange={(e) => setLiveSelectedBackupStaffId(e.target.value)}
                                className="flex-1 bg-white border border-rose-250 rounded p-1 text-[11px] text-slate-800 outline-hidden font-bold"
                              >
                                <option value="">-- ជ្រើសរើសគ្រូទំនេរ --</option>
                                {staff
                                  .filter(s => s.role === 'Teacher')
                                  .map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                                  ))}
                              </select>
                              <button
                                onClick={() => {
                                  if (!liveSelectedBackupStaffId) {
                                    setWarning('❌ សូមជ្រើសរើសគ្រូទំនេរម្នាក់ដើម្បីបញ្ជូនជំនួស!');
                                    return;
                                  }
                                  handleResolveEscalationWithBackup(alert.id, liveSelectedBackupStaffId);
                                  setLiveSelectedBackupStaffId('');
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-extrabold cursor-pointer transition-all"
                              >
                                បញ្ជូនជាបន្ទាន់
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-100/50 p-1.5 rounded font-bold">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>ដោះស្រាយរួចរាល់៖ បញ្ជូន លោកគ្រូ/អ្នកគ្រូ {alert.backupName} ជំនួស។</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-4 bg-white border border-slate-200 rounded-lg text-center text-slate-400 text-[10px] leading-relaxed">
                      គ្មានការប្រកាសអាសន្នសកម្មឡើយ។ ស្ថានភាពសុវត្ថិភាពទូទាំងសាលាគឺល្អប្រសើរ (100% Secure)។
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: SHIFT SWAPPING FLOW */}
            <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">លំហូរទី ៣</span>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-slate-600" />
                  ការស្នើសុំប្តូរវេន (Shift Swapping Flow)
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ប្រសិនបើគ្រូ A ជាប់ធុរៈបន្ទាន់ គាត់អាចស្នើសុំប្តូរវេនទៅគ្រូ B ក្នុង App ហើយបើគ្រូ B ចុច "Accept" នោះប្រព័ន្ធនឹងប្តូរឈ្មោះក្នុងតារាងដោយស្វ័យប្រវត្ត។
                </p>
              </div>

              {/* Simulation Interactive Card */}
              <div className="space-y-3 pt-2">
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ជំហានទី ១៖ បង្កើតសំណើប្តូរវេន (Teacher A)</span>
                  
                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] font-bold text-slate-500">ជ្រើសរើសវេនដែលត្រូវប្តូរ៖</label>
                    <select
                      value={liveSelectedSwapEntryId}
                      onChange={(e) => {
                        const entryId = e.target.value;
                        setLiveSelectedSwapEntryId(entryId);
                        const entry = roster.find(r => r.id === entryId);
                        if (entry && entry.staffIds.length > 0) {
                          setSwapFromStaffId(entry.staffIds[0]);
                        } else {
                          setSwapFromStaffId('');
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-700 outline-hidden font-medium"
                    >
                      <option value="">-- ជ្រើសរើសវេន --</option>
                      {roster
                        .filter(r => r.staffIds.length > 0)
                        .map(r => {
                          const dayKh = r.day === 'Monday' ? 'ចន្ទ' : r.day === 'Tuesday' ? 'អង្គារ' : r.day === 'Wednesday' ? 'ពុធ' : r.day === 'Thursday' ? 'ព្រហស្បតិ៍' : 'សុក្រ';
                          const zone = zones.find(z => z.id === r.zoneId);
                          const shift = SHIFTS.find(s => s.id === r.shiftId);
                          const staffNames = r.staffIds.map(id => staff.find(s => s.id === id)?.name || '').join(', ');
                          return (
                            <option key={r.id} value={r.id}>
                              ថ្ងៃ{dayKh} ({shift?.timeSlot}) - {zone?.name} [{staffNames}]
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {swapFromStaffId && (
                    <div className="space-y-1.5 text-xs">
                      <label className="text-[10px] font-bold text-slate-500">ជ្រើសរើសគ្រូ B មកជំនួស៖</label>
                      <select
                        value={liveSelectedSwapTargetStaffId}
                        onChange={(e) => setLiveSelectedSwapTargetStaffId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-700 outline-hidden font-medium"
                      >
                        <option value="">-- ជ្រើសរើសគ្រូ B --</option>
                        {staff
                          .filter(s => s.role === 'Teacher' && s.id !== swapFromStaffId)
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                          ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!liveSelectedSwapEntryId || !swapFromStaffId || !liveSelectedSwapTargetStaffId) {
                        setWarning('❌ សូមបំពេញព័ត៌មានប្តូរវេនឱ្យបានគ្រប់គ្រាន់!');
                        return;
                      }
                      handleInitiateSwap(liveSelectedSwapEntryId, swapFromStaffId, liveSelectedSwapTargetStaffId);
                    }}
                    disabled={swapStatus === 'pending'}
                    className={`w-full py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      swapStatus === 'pending'
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>ផ្ញើសំណើសុំប្តូរវេន</span>
                  </button>
                </div>

                {/* Step 2: Receiver view (Teacher B's phone notification screen) */}
                {swapStatus === 'pending' && (
                  <div className="bg-white p-3.5 rounded-lg border-2 border-indigo-500 space-y-3 shadow-lg animate-bounce">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Bell className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">ទូរស័ព្ទរបស់គ្រូ B (អ្នកទទួលសំណើ)</span>
                    </div>

                    {(() => {
                      const fromStaff = staff.find(s => s.id === swapFromStaffId);
                      const toStaff = staff.find(s => s.id === swapToStaffId);
                      const entry = roster.find(r => r.id === swapRosterEntryId);
                      const zone = zones.find(z => z.id === entry?.zoneId);
                      const shift = SHIFTS.find(s => s.id === entry?.shiftId);
                      const dayKh = entry?.day === 'Monday' ? 'ចន្ទ' : entry?.day === 'Tuesday' ? 'អង្គារ' : entry?.day === 'Wednesday' ? 'ពុធ' : entry?.day === 'Thursday' ? 'ព្រហស្បតិ៍' : 'សុក្រ';

                      return (
                        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                          <p className="font-semibold text-slate-800">
                            អ្នកគ្រូ/លោកគ្រូ <strong>{toStaff?.name}</strong> ទទួលបានសារសំណើពី <strong>{fromStaff?.name}</strong>៖
                          </p>
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
                            <p>• <strong>ប្រភេទភារកិច្ច៖</strong> យាមល្បាតសុវត្ថិភាពសិស្ស</p>
                            <p>• <strong>ទីតាំងយាម៖</strong> {zone?.name} ({zone?.floor !== 'N/A' ? `${zone?.floor === 'Ground' ? 'ជាន់ផ្ទាល់ដី' : zone?.floor === 'Ground' ? 'ជាន់ផ្ទាល់ដី' : zone?.floor === '1st Floor' ? 'ជាន់ទី ១' : zone?.floor === '2nd Floor' ? 'ជាន់ទី ២' : zone?.floor === '3rd Floor' ? 'ជាន់ទី ៣' : zone?.floor === '4th Floor' ? 'ជាន់ទី ៤' : zone?.floor === '5th Floor' ? 'ជាន់ទី ៥' : zone?.floor}` : ''})</p>
                            <p>• <strong>ពេលវេលា៖</strong> ថ្ងៃ{dayKh} ({shift?.timeSlot})</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={handleAcceptSwap}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black cursor-pointer transition-all text-center shadow-xs"
                            >
                              យល់ព្រម (Accept)
                            </button>
                            <button
                              onClick={handleDeclineSwap}
                              className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition-all text-center"
                            >
                              បដិសេធ (Decline)
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Swap status outcomes feedback */}
                {swapStatus === 'accepted' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs space-y-1 text-slate-600">
                    <p className="font-extrabold text-emerald-700 flex items-center gap-1 uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ប្តូរវេនសម្រេចជោគជ័យ!
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      ប្រព័ន្ធបានកែប្រែឈ្មោះលោកគ្រូអ្នកគ្រូក្នុងតារាងមេដោយស្វ័យប្រវត្ត និងបានរាយការណ៍ជូន Admin សាលារួចរាល់។
                    </p>
                  </div>
                )}

                {swapStatus === 'declined' && (
                  <div className="p-3 bg-slate-150 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
                    <p className="font-bold text-slate-700 flex items-center gap-1 uppercase">
                      <XCircle className="w-4 h-4 text-slate-500" />
                      សំណើប្តូរវេនត្រូវបានបដិសេធ
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      អ្នកទទួលសំណើបានចុចបដិសេធការផ្ទេរវេនការងារនេះ។ វេនការងាររក្សានៅដដែល។
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LOGGING TERMINAL & OPERATIONS CONSOLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">របាយការណ៍ប្រតិបត្តិការជាក់ស្តែង (School Safety Live Console Log)</span>
              </div>
              <button
                onClick={handleResetLiveOps}
                className="text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-sm cursor-pointer transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> RESET ENGINE
              </button>
            </div>

            <div className="font-mono text-xs text-slate-350 space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-2 bg-slate-950 rounded-lg min-h-[100px]">
              {liveCheckInLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`py-1 px-1.5 rounded transition-all ${
                    log.includes('✅') ? 'text-emerald-400 bg-emerald-950/20' :
                    log.includes('⚠️') ? 'text-amber-400 bg-amber-950/20' :
                    log.includes('🚨') ? 'text-rose-400 bg-rose-950/20 animate-pulse' :
                    log.includes('🔄') ? 'text-cyan-400 bg-cyan-950/20' :
                    'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Geometric Tab Rail) */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider cursor-pointer transition-all relative flex items-center gap-2 font-display ${
              activeTab === 'roster'
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4" /> កាលវិភាគមេ
            {activeTab === 'roster' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider cursor-pointer transition-all relative flex items-center gap-2 font-display ${
              activeTab === 'staff'
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" /> បញ្ជីឈ្មោះបុគ្គលិក
            {activeTab === 'staff' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('zones')}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider cursor-pointer transition-all relative flex items-center gap-2 font-display ${
              activeTab === 'zones'
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-4 h-4" /> កំណត់រចនាសម្ព័ន្ធតំបន់ហានិភ័យ
            {activeTab === 'zones' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              if (!auditResult) {
                handleRunAudit();
              }
            }}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider cursor-pointer transition-all relative flex items-center gap-2 font-display ${
              activeTab === 'audit'
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> ប្រព័ន្ធវាយតម្លៃសុវត្ថិភាព
            {auditResult && (
              <span className={`w-2 h-2 rounded-full ${auditResult.coverageScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            )}
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        </div>

        {/* Tab Panel Render */}
        <div className="transition-all duration-200">
          {activeTab === 'roster' && (
            <RosterBoard
              staff={staff}
              zones={zones}
              shifts={SHIFTS}
              roster={roster}
              onUpdateAssignment={handleUpdateAssignment}
              onClearRoster={handleClearRoster}
              onAISolve={handleAISolve}
              isAIWorking={isAIWorking}
            />
          )}

          {activeTab === 'staff' && (
            <StaffSection
              staff={staff}
              onAddStaff={handleAddStaff}
              onEditStaff={handleEditStaff}
              onDeleteStaff={handleDeleteStaff}
              getStaffDutyCount={getStaffDutyCount}
            />
          )}

          {activeTab === 'zones' && (
            <ZoneSection
              zones={zones}
              onAddZone={handleAddZone}
              onEditZone={handleEditZone}
              onDeleteZone={handleDeleteZone}
            />
          )}

          {activeTab === 'audit' && (
            <SafetyAuditPanel
              auditResult={auditResult}
              onRunAudit={handleRunAudit}
              isAuditing={isAuditing}
              auditMode={auditMode}
            />
          )}
        </div>
        </>
        )}

        {/* PERSPECTIVE: STAFF VIEW */}
        {currentPerspective === 'staff' && (
          <div className="animate-fadeIn">
            <StaffView
              staff={staff}
              zones={zones}
              roster={roster}
              incidents={incidents}
              activeLoggedStaffId={activeLoggedStaffId}
              onActiveStaffChange={setActiveLoggedStaffId}
              onCheckIn={handleLiveCheckIn}
              onAddIncident={handleAddNewIncident}
            />
          </div>
        )}

        {/* PERSPECTIVE: ANALYTICS VIEW */}
        {currentPerspective === 'analytics' && (
          <div className="animate-fadeIn">
            <AnalyticsView
              incidents={incidents}
              zones={zones}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
            />
          </div>
        )}

      </div>
    </div>
  );
}
