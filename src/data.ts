import { StaffProfile, DutyZone, Shift, RosterEntry } from './types';

export const INITIAL_STAFF: StaffProfile[] = [
  // Security staff
  {
    id: 's-1',
    name: 'លោក សុខ ជា (ភ្នាក់ងារសន្តិសុខ)',
    role: 'Security',
    workingHours: '06:30 - 15:30',
    email: 'sok.chea@school.edu',
    phone: '+855 (012) 101-2098',
    maxWeeklyDuties: 8
  },
  {
    id: 's-2',
    name: 'លោក វណ្ណា ហេង (ភ្នាក់ងារសន្តិសុខ)',
    role: 'Security',
    workingHours: '08:00 - 17:00',
    email: 'vanna.heng@school.edu',
    phone: '+855 (015) 101-4432',
    maxWeeklyDuties: 8
  },
  {
    id: 's-3',
    name: 'កញ្ញា ចាន់ណា ស៊ីម (ភ្នាក់ងារសន្តិសុខ)',
    role: 'Security',
    workingHours: '07:00 - 16:00',
    email: 'channa.sim@school.edu',
    phone: '+855 (099) 101-9988',
    maxWeeklyDuties: 8
  },
  
  // Management staff
  {
    id: 'm-1',
    name: 'លោកនាយក គឹម ស៊ា',
    role: 'Management',
    workingHours: '07:30 - 16:30',
    email: 'principal@school.edu',
    phone: '+855 (011) 101-1000',
    maxWeeklyDuties: 3
  },
  {
    id: 'm-2',
    name: 'លោកស្រីនាយករង ម៉ាលី សុខ',
    role: 'Management',
    workingHours: '07:30 - 16:30',
    email: 'maly.sok@school.edu',
    phone: '+855 (012) 101-1001',
    maxWeeklyDuties: 4
  },
  {
    id: 'm-3',
    name: 'លោកស្រីប្រធានការិយាល័យ លីដា ម៉ៅ',
    role: 'Management',
    workingHours: '07:30 - 16:30',
    email: 'lida.mao@school.edu',
    phone: '+855 (016) 101-1002',
    maxWeeklyDuties: 5
  },

  // Teachers
  {
    id: 't-1',
    name: 'លោកគ្រូ សុភ័ក្រ្ត ជួប',
    role: 'Teacher',
    workingHours: '07:30 - 15:30',
    email: 'sopheak.chuob@school.edu',
    phone: '+855 (012) 101-1234',
    maxWeeklyDuties: 4
  },
  {
    id: 't-2',
    name: 'អ្នកគ្រូ សុជាតា គង់',
    role: 'Teacher',
    workingHours: '07:30 - 15:30',
    email: 'socheata.kong@school.edu',
    phone: '+855 (017) 101-5678',
    maxWeeklyDuties: 4
  },
  {
    id: 't-3',
    name: 'លោកគ្រូ ចាន់ត្រា សេង',
    role: 'Teacher',
    workingHours: '07:30 - 15:30',
    email: 'chantra.seng@school.edu',
    phone: '+855 (085) 101-4321',
    maxWeeklyDuties: 4
  },
  {
    id: 't-4',
    name: 'អ្នកគ្រូ ទេវី ពេជ្រ',
    role: 'Teacher',
    workingHours: '08:00 - 16:00',
    email: 'devi.pich@school.edu',
    phone: '+855 (098) 101-8765',
    maxWeeklyDuties: 4
  },
  {
    id: 't-5',
    name: 'លោកគ្រូ សារ៉ាត់ អ៊ុន',
    role: 'Teacher',
    workingHours: '07:30 - 15:30',
    email: 'sarath.un@school.edu',
    phone: '+855 (093) 101-0987',
    maxWeeklyDuties: 3
  },
  {
    id: 't-6',
    name: 'អ្នកគ្រូ នារី រ័ត្ន',
    role: 'Teacher',
    workingHours: '08:00 - 16:00',
    email: 'neary.roth@school.edu',
    phone: '+855 (012) 101-3456',
    maxWeeklyDuties: 4
  },
  {
    id: 't-7',
    name: 'លោកគ្រូ ធារ៉ា លី',
    role: 'Teacher',
    workingHours: '07:30 - 15:30',
    email: 'theara.ly@school.edu',
    phone: '+855 (010) 101-7890',
    maxWeeklyDuties: 4
  }
];

export const INITIAL_ZONES: DutyZone[] = [
  // Zone A: Ground Floor - Common Areas
  {
    id: 'z-a1',
    zoneType: 'Zone A',
    name: 'តារាងបាល់ទាត់',
    floor: 'Ground',
    riskLevel: 'Medium',
    minStaffRequired: 2,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - តារាងបាល់ទាត់សម្រាប់សកម្មភាពកីឡា និងការលេងកម្សាន្តរបស់សិស្ស។'
  },
  {
    id: 'z-a2',
    zoneType: 'Zone A',
    name: 'សួនច្បារ',
    floor: 'Ground',
    riskLevel: 'Low',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - សួនច្បារសម្រាប់សិស្សសម្រាកលំហែកាយ និងបង្ការការចោលសំរាម។'
  },
  {
    id: 'z-a3',
    zoneType: 'Zone A',
    name: 'PLAYGROUND',
    floor: 'Ground',
    riskLevel: 'High',
    minStaffRequired: 2,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - កន្លែងលេងកុមារដែលមានឧបករណ៍លេងសកម្ម ត្រូវការការតាមដានខ្ពស់។'
  },
  {
    id: 'z-a4',
    zoneType: 'Zone A',
    name: 'មុខបន្ទប់ទឹក',
    floor: 'Ground',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - មុខបន្ទប់ទឹកជាន់ផ្ទាល់ដី ការពារការរអិលដួល និងរក្សាសណ្តាប់ធ្នាប់។'
  },
  {
    id: 'z-a5',
    zoneType: 'Zone A',
    name: 'មុខបន្ទប់កុំព្យូទ័រ',
    floor: 'Ground',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - មុខបន្ទប់កុំព្យូទ័រ តាមដានការចេញចូល និងសុវត្ថិភាពសម្ភារៈ។'
  },
  {
    id: 'z-a6',
    zoneType: 'Zone A',
    name: 'មុខបន្ទប់ Receptionist',
    floor: 'Ground',
    riskLevel: 'Low',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - មុខការិយាល័យទទួលភ្ញៀវ និងច្រកចូលធំសាលារៀន។'
  },
  {
    id: 'z-a7',
    zoneType: 'Zone A',
    name: 'មុខទូរទស្សន៍',
    floor: 'Ground',
    riskLevel: 'Low',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ផ្ទាល់ដី - មុខទូរទស្សន៍ព័ត៌មាន ជាកន្លែងដែលសិស្សចូលចិត្តប្រមូលផ្តុំ។'
  },

  // Zone B: 1st Floor - Common Areas
  {
    id: 'z-b1',
    zoneType: 'Zone B',
    name: 'អាហារដ្ឋាន',
    floor: '1st Floor',
    riskLevel: 'High',
    minStaffRequired: 2,
    description: 'តំបន់ទីធ្លារួមជាន់ទី១ - អាហារដ្ឋានកណ្តាលសាលា កន្លែងទិញអាហារ និងទទួលទានអាហារដែលមានសិស្សកកកុញខ្លាំង។'
  },
  {
    id: 'z-b2',
    zoneType: 'Zone B',
    name: 'READING CORNER',
    floor: '1st Floor',
    riskLevel: 'Low',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី១ - ជ្រុងអានសៀវភៅ សម្រាប់សិស្សអានសៀវភៅ និងសិក្សាដោយស្ងប់ស្ងាត់។'
  },
  {
    id: 'z-b3',
    zoneType: 'Zone B',
    name: 'ក្បែរជណ្តើរមុខ',
    floor: '1st Floor',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី១ - ក្បែរជណ្តើរមុខ ការពារការរត់លេង ឬរអិលដួលឡើងចុះជណ្តើរ។'
  },
  {
    id: 'z-b4',
    zoneType: 'Zone B',
    name: 'ក្បែរជណ្តើរក្រោយ',
    floor: '1st Floor',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី១ - ក្បែរជណ្តើរក្រោយ និងច្រករបៀងខាងក្រោយអាគារ។'
  },

  // Zone C: 2nd Floor - Common Areas
  {
    id: 'z-c1',
    zoneType: 'Zone C',
    name: 'ក្បែរជណ្តើរមុខ',
    floor: '2nd Floor',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី២ - ក្បែរជណ្តើរមុខ តាមដានការឡើងចុះ និងរក្សាសណ្តាប់ធ្នាប់របៀងជាន់ទី២។'
  },
  {
    id: 'z-c2',
    zoneType: 'Zone C',
    name: 'ក្បែរជណ្តើរក្រោយ',
    floor: '2nd Floor',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី២ - ក្បែរជណ្តើរក្រោយ ការពារសុវត្ថិភាពសិស្សតាមច្រកចេញអាសន្នខាងក្រោយ។'
  },

  // Zone D: 3rd to 6th Floor - Common Areas
  {
    id: 'z-d1',
    zoneType: 'Zone D',
    name: 'ក្បែរជណ្តើរមុខ',
    floor: '3rd-6th Floors',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី៣ ដល់ទី៦ - ក្បែរជណ្តើរមុខ តាមដាន និងការពារសុវត្ថិភាពសិស្សនៅជាន់ខ្ពស់ៗ។'
  },
  {
    id: 'z-d2',
    zoneType: 'Zone D',
    name: 'ក្បែរជណ្តើរក្រោយ',
    floor: '3rd-6th Floors',
    riskLevel: 'Medium',
    minStaffRequired: 1,
    description: 'តំបន់ទីធ្លារួមជាន់ទី៣ ដល់ទី៦ - ក្បែរជណ្តើរក្រោយ តាមដានច្រករបៀង និងបង្ការគ្រោះថ្នាក់នានា។'
  }
];

export const SHIFTS: Shift[] = [
  {
    id: 'sh-1',
    name: 'ម៉ោងចូលរៀនព្រឹក',
    timeSlot: '6:45 AM - 7:30 AM'
  },
  {
    id: 'sh-2',
    name: 'ម៉ោងចេញលេង(KGE-EK-1)',
    timeSlot: '8:15 AM - 8:45 AM'
  },
  {
    id: 'sh-3',
    name: 'ម៉ោងចេញលេង (GEP-Prim)',
    timeSlot: '9:00 AM - 9:30 AM'
  },
  {
    id: 'sh-4',
    name: 'ម៉ោងចេញលេង(EK-2)',
    timeSlot: '9:30 AM - 9:45 AM'
  },
  {
    id: 'sh-9',
    name: 'ម៉ោងទៅផ្ទះពេលព្រឹក',
    timeSlot: '10:45 AM - 11:10 AM'
  },
  {
    id: 'sh-5',
    name: 'ម៉ោងចូលវេន ថ្ងៃត្រង់',
    timeSlot: '12:45 PM - 1:30 PM'
  },
  {
    id: 'sh-6',
    name: 'ម៉ោងចេញលេង(KGE-EK-1) រសៀល',
    timeSlot: '2:15 PM - 2:45 PM'
  },
  {
    id: 'sh-7',
    name: 'ម៉ោងចេញលេង (GEP-Prim) រសៀល',
    timeSlot: '3:00 PM - 3:30 PM'
  },
  {
    id: 'sh-8',
    name: 'ម៉ោងចេញលេង(EK-2) រសៀល',
    timeSlot: '3:30 PM - 3:45 PM'
  },
  {
    id: 'sh-10',
    name: 'ម៉ោងទៅផ្ទះពេលរសៀល',
    timeSlot: '4:45 PM - 5:10 PM'
  }
];

// Initial assignments to show on screen
export const INITIAL_ROSTER: RosterEntry[] = [
  // Monday Assignments
  {
    id: 'r-1',
    day: 'Monday',
    shiftId: 'sh-1',
    zoneId: 'z-a1', // Football field
    staffIds: ['s-1', 's-2'], // Security staff
    status: 'Checked-In'
  },
  {
    id: 'r-2',
    day: 'Monday',
    shiftId: 'sh-2',
    zoneId: 'z-a3', // Playground
    staffIds: ['t-1', 't-2'], // Teachers
    status: 'Completed'
  },
  {
    id: 'r-3',
    day: 'Monday',
    shiftId: 'sh-5',
    zoneId: 'z-b1', // Cafeteria
    staffIds: ['m-2', 't-3', 't-4'], // Vice Principal + Teachers
    status: 'Completed'
  },
  {
    id: 'r-4',
    day: 'Monday',
    shiftId: 'sh-6',
    zoneId: 'z-d1', // 3rd-6th front stairs
    staffIds: ['t-5'], // Xavier / Sarath
    status: 'Completed'
  },

  // Tuesday Assignments
  {
    id: 'r-5',
    day: 'Tuesday',
    shiftId: 'sh-1',
    zoneId: 'z-a3', // Playground
    staffIds: ['s-1', 's-3'], // Security staff
    status: 'Assigned'
  },
  {
    id: 'r-6',
    day: 'Tuesday',
    shiftId: 'sh-5',
    zoneId: 'z-b1', // Cafeteria
    staffIds: ['t-6', 't-7', 'm-3'], // Teachers + Office chief
    status: 'Assigned'
  },
  {
    id: 'r-7',
    day: 'Tuesday',
    shiftId: 'sh-2',
    zoneId: 'z-b4', // 1st floor back stairs
    staffIds: ['t-2'], // Socheata
    status: 'Assigned'
  },
  
  // Wednesday Assignments
  {
    id: 'r-8',
    day: 'Wednesday',
    shiftId: 'sh-1',
    zoneId: 'z-a1',
    staffIds: ['s-2', 's-3'],
    status: 'Assigned'
  },
  {
    id: 'r-9',
    day: 'Wednesday',
    shiftId: 'sh-5',
    zoneId: 'z-a1', // Football field
    staffIds: ['t-1', 't-7'],
    status: 'Assigned'
  },
  
  // Thursday Assignments
  {
    id: 'r-10',
    day: 'Thursday',
    shiftId: 'sh-5',
    zoneId: 'z-b1', // Cafeteria
    staffIds: ['t-3', 't-4', 'm-1'], // Teachers + Principal
    status: 'Assigned'
  },

  // Friday Assignments
  {
    id: 'r-11',
    day: 'Friday',
    shiftId: 'sh-8',
    zoneId: 'z-d2', // 3rd-6th back stairs
    staffIds: ['s-2'], // Vanna
    status: 'Assigned'
  }
];
