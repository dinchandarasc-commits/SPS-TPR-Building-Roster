import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase.ts';
import { StaffProfile, DutyZone, RosterEntry, IncidentReport } from '../types';

// Load all staff profiles
export async function loadStaff(): Promise<StaffProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'staff'));
    const list: StaffProfile[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as StaffProfile);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'staff');
  }
}

// Save/update a single staff profile
export async function saveStaffMember(member: StaffProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'staff', member.id), member);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `staff/${member.id}`);
  }
}

// Delete a staff profile
export async function deleteStaffMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'staff', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff/${id}`);
  }
}

// Save full staff list and delete removed ones
export async function saveFullStaff(staff: StaffProfile[]): Promise<void> {
  try {
    const existingStaff = await loadStaff();
    const currentIds = new Set(staff.map((s) => s.id));
    const batch = writeBatch(db);

    staff.forEach((s) => {
      batch.set(doc(db, 'staff', s.id), s);
    });

    existingStaff.forEach((s) => {
      if (!currentIds.has(s.id)) {
        batch.delete(doc(db, 'staff', s.id));
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'staff/full');
  }
}

// Load all zones
export async function loadZones(): Promise<DutyZone[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'zones'));
    const list: DutyZone[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as DutyZone);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'zones');
  }
}

// Save/update a single zone
export async function saveZone(zone: DutyZone): Promise<void> {
  try {
    await setDoc(doc(db, 'zones', zone.id), zone);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `zones/${zone.id}`);
  }
}

// Save full zones list and delete removed ones
export async function saveFullZones(zones: DutyZone[]): Promise<void> {
  try {
    const existingZones = await loadZones();
    const currentIds = new Set(zones.map((z) => z.id));
    const batch = writeBatch(db);

    zones.forEach((z) => {
      batch.set(doc(db, 'zones', z.id), z);
    });

    existingZones.forEach((z) => {
      if (!currentIds.has(z.id)) {
        batch.delete(doc(db, 'zones', z.id));
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'zones/full');
  }
}

// Load weekly roster entries
export async function loadRoster(): Promise<RosterEntry[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'roster'));
    const list: RosterEntry[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as RosterEntry);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'roster');
  }
}

// Save/update a single roster entry
export async function saveRosterEntry(entry: RosterEntry): Promise<void> {
  try {
    await setDoc(doc(db, 'roster', entry.id), entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `roster/${entry.id}`);
  }
}

// Save the full roster (batch commit)
export async function saveFullRoster(entries: RosterEntry[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    entries.forEach((entry) => {
      batch.set(doc(db, 'roster', entry.id), entry);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'roster/batch');
  }
}

// Load all incident reports
export async function loadIncidents(): Promise<IncidentReport[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'incidents'));
    const list: IncidentReport[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as IncidentReport);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'incidents');
  }
}

// Save/update an incident report
export async function saveIncident(incident: IncidentReport): Promise<void> {
  try {
    await setDoc(doc(db, 'incidents', incident.id), incident);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `incidents/${incident.id}`);
  }
}

// Save full incidents list
export async function saveFullIncidents(incidents: IncidentReport[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    incidents.forEach((i) => {
      batch.set(doc(db, 'incidents', i.id), i);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'incidents/full');
  }
}

// Application Settings State Structure
export interface AppSettings {
  minStaffZoneA: number;
  minStaffZoneB: number;
  minStaffZoneD: number;
  maxWeeklyDutiesTeachers: number;
  isApproved: boolean;
  approvedBy: string;
  approvedAt: string;
  notificationSent: boolean;
  liveCheckInLogs: string[];
  escalationAlerts: any[];
}

// Load global configuration settings
export async function loadSettings(): Promise<AppSettings | null> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'config'));
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/config');
  }
}

// Save/update global configuration settings
export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'config'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/config');
  }
}

// Seed helper to populate empty database with static initials
export async function seedDatabaseIfEmpty(
  initialStaff: StaffProfile[],
  initialZones: DutyZone[],
  initialRoster: RosterEntry[],
  initialIncidents: IncidentReport[],
  defaultSettings: AppSettings
): Promise<{
  staff: StaffProfile[];
  zones: DutyZone[];
  roster: RosterEntry[];
  incidents: IncidentReport[];
  settings: AppSettings;
}> {
  try {
    const batch = writeBatch(db);
    let seeded = false;

    // 1. Check and seed staff
    const staffSnap = await getDocs(collection(db, 'staff'));
    let finalStaff = initialStaff;
    if (staffSnap.empty) {
      initialStaff.forEach((s) => {
        batch.set(doc(db, 'staff', s.id), s);
      });
      seeded = true;
    } else {
      finalStaff = [];
      staffSnap.forEach((doc) => finalStaff.push(doc.data() as StaffProfile));
    }

    // 2. Check and seed zones
    const zonesSnap = await getDocs(collection(db, 'zones'));
    let finalZones = initialZones;
    if (zonesSnap.empty) {
      initialZones.forEach((z) => {
        batch.set(doc(db, 'zones', z.id), z);
      });
      seeded = true;
    } else {
      finalZones = [];
      zonesSnap.forEach((doc) => finalZones.push(doc.data() as DutyZone));
    }

    // 3. Check and seed roster
    const rosterSnap = await getDocs(collection(db, 'roster'));
    let finalRoster = initialRoster;
    if (rosterSnap.empty) {
      initialRoster.forEach((r) => {
        batch.set(doc(db, 'roster', r.id), r);
      });
      seeded = true;
    } else {
      finalRoster = [];
      rosterSnap.forEach((doc) => finalRoster.push(doc.data() as RosterEntry));
    }

    // 4. Check and seed incidents
    const incidentsSnap = await getDocs(collection(db, 'incidents'));
    let finalIncidents = initialIncidents;
    if (incidentsSnap.empty) {
      initialIncidents.forEach((i) => {
        batch.set(doc(db, 'incidents', i.id), i);
      });
      seeded = true;
    } else {
      finalIncidents = [];
      incidentsSnap.forEach((doc) => finalIncidents.push(doc.data() as IncidentReport));
    }

    // 5. Check and seed settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
    let finalSettings = defaultSettings;
    if (!settingsSnap.exists()) {
      batch.set(doc(db, 'settings', 'config'), defaultSettings);
      seeded = true;
    } else {
      finalSettings = settingsSnap.data() as AppSettings;
    }

    if (seeded) {
      await batch.commit();
      console.log('Database successfully seeded with default values.');
    }

    return {
      staff: finalStaff,
      zones: finalZones,
      roster: finalRoster,
      incidents: finalIncidents,
      settings: finalSettings,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}
