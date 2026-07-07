export type StaffRole = 'Teacher' | 'Management' | 'Security';

export interface StaffProfile {
  id: string;
  name: string;
  role: StaffRole;
  workingHours: string; // e.g., "07:30 - 16:30"
  email: string;
  phone: string;
  maxWeeklyDuties: number;
}

export type ZoneType = 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';

export interface DutyZone {
  id: string;
  zoneType: ZoneType;
  name: string;
  floor: 'Ground' | '1st Floor' | '2nd Floor' | '3rd Floor' | '4th Floor' | '5th Floor' | '6th Floor' | '3rd-6th Floors' | 'N/A';
  riskLevel: 'High' | 'Medium' | 'Low';
  minStaffRequired: number;
  description: string;
}

export interface Shift {
  id: string;
  name: string;
  timeSlot: string; // e.g., "07:30 - 08:30"
}

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface RosterEntry {
  id: string;
  day: WeekDay;
  shiftId: string;
  zoneId: string;
  staffIds: string[]; // Assigned staff member IDs
  status: 'Assigned' | 'Checked-In' | 'Completed';
  notes?: string;
}

export interface SafetyAuditResult {
  coverageScore: number; // percentage
  uncoveredZones: { day: string; shiftName: string; zoneName: string; riskLevel: string; reason: string }[];
  complianceAlerts: string[];
  aiSummary: string;
}

export interface IncidentReport {
  id: string;
  zoneId: string;
  reporterId: string;
  reporterName: string;
  severity: 'Low' | 'Medium' | 'High'; // ធម្មតា, មធ្យម, ធ្ងន់ធ្ងរ
  description: string;
  photoUrl?: string;
  timestamp: string;
  status: 'Reported' | 'In-Investigation' | 'Resolved';
}
