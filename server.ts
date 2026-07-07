import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please add it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI-Powered Campus Roster Generation
  app.post('/api/generate-roster', async (req, res) => {
    const { staff, zones, shifts, currentRoster } = req.body;

    try {
      const ai = getGeminiClient();

      const prompt = `
        You are an expert school safety scheduling assistant. Your goal is to generate a comprehensive, highly-optimized weekly duty roster (Monday to Friday) that maximizes school safety across all building levels (up to 5 stories high) and common grounds.

        Here is the campus metadata:
        - STAFF PROFILES: ${JSON.stringify(staff)}
        - DUTY ZONES (RISK AREAS): ${JSON.stringify(zones)}
        - SHIFTS AVAILABLE: ${JSON.stringify(shifts)}
        - CURRENT TEMPLATE ROSTER (Use for guidance or override as needed): ${JSON.stringify(currentRoster || [])}

        STRICT SAFETY SCHEDULING CONSTRAINTS:
        1. "Security" staff MUST be prioritized for Zone D (School Entrances and Exits) such as the Main Front Gate or Rear Exit, especially during morning admission ('ម៉ោងចូលរៀនព្រឹក') and dismissal/going home times ('ម៉ោងទៅផ្ទះពេលព្រឹក' and 'ម៉ោងទៅផ្ទះពេលរសៀល').
        2. "Teacher" roles should be primarily allocated to Zone A (Common Areas like Playground, Cafeteria, Reading Corner) and Zone B (Corridors and Restroom Entrances from 1st to 5th Floor).
        3. "Management" staff (acting as Admins) MUST NEVER be assigned to any duty shifts or zones. They do not have duty shifts/hours.
        4. Staff should NOT be over-scheduled. Respect each staff member's "maxWeeklyDuties". Do not assign a staff member to multiple zones in the very same shift/day.
        5. For each zone, try to assign the minimum number of staff specified by "minStaffRequired".

        Return a complete JSON array of roster entries for the week (Monday to Friday). Assign as many staff members as possible to ensure full coverage, but stay within constraints.
        
        CRITICAL MULTILINGUAL REQUIREMENT:
        All explanation, text, notes and descriptive values MUST be written in the Khmer language.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite campus security planner. Always return a perfectly formed JSON array following the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of roster assignments for the school week',
            items: {
              type: Type.OBJECT,
              properties: {
                day: {
                  type: Type.STRING,
                  description: 'Monday, Tuesday, Wednesday, Thursday, or Friday'
                },
                shiftId: {
                  type: Type.STRING,
                  description: 'The shift ID matching one of the provided shifts'
                },
                zoneId: {
                  type: Type.STRING,
                  description: 'The zone ID matching one of the provided zones'
                },
                staffIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Array of assigned staff IDs meeting the minimum required'
                },
                notes: {
                  type: Type.STRING,
                  description: 'Brief, highly professional explanation of why this assignment was made'
                }
              },
              required: ['day', 'shiftId', 'zoneId', 'staffIds']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini model');
      }

      const generatedRoster = JSON.parse(responseText.trim());
      res.json({ success: true, roster: generatedRoster, mode: 'AI' });

    } catch (error: any) {
      console.error('Gemini Roster Generation Error:', error.message);
      
      // Local Heuristic fallback in case API key is missing or there is a quota error
      const fallbackRoster = generateHeuristicRoster(staff, zones, shifts);
      res.json({
        success: true,
        roster: fallbackRoster,
        mode: 'Heuristic Fallback',
        warning: error.message.includes('GEMINI_API_KEY') 
          ? 'កូដសម្ងាត់ Gemini API មិនទាន់ត្រូវបានកំណត់កំណត់រចនាសម្ព័ន្ធទេ។ កំពុងបង្ហាញតារាងដែលបង្កើតឡើងដោយក្បួនដោះស្រាយជំនួសវិញ។'
          : `សេវាកម្ម AI មិនដំណើរការ (${error.message})។ កំពុងបង្ហាញតារាងដែលបង្កើតឡើងដោយក្បួនដោះស្រាយជំនួសវិញ។`
      });
    }
  });

  // AI-Powered Campus Safety & Compliance Audit
  app.post('/api/safety-audit', async (req, res) => {
    const { staff, zones, shifts, roster } = req.body;

    try {
      const ai = getGeminiClient();

      const prompt = `
        You are an elite school administration auditor specializing in campus student safety and staff logistics.
        Perform a rigorous safety audit of our current weekly duty roster.

        Here is the campus state:
        - STAFF PROFILES: ${JSON.stringify(staff)}
        - DUTY ZONES: ${JSON.stringify(zones)}
        - SHIFTS AVAILABLE: ${JSON.stringify(shifts)}
        - CURRENT WEEKLY SCHEDULE: ${JSON.stringify(roster)}

        Analyze this data and assess:
        1. **Coverage Score**: Calculate the safety coverage as a percentage (0-100%). It is 100% if all shifts on all days have at least the "minStaffRequired" for every single zone. Deduct points for uncovered or understaffed zones (especially high risk ones).
        2. **Uncovered/Understaffed Zones**: Identify specific combinations of day, shift, and zone that have less staff than the required "minStaffRequired".
        3. **Compliance Alerts**: Flag if any staff member is assigned to more duties than their "maxWeeklyDuties", or if they are assigned to multiple locations at the same time, or if Security guards are missing from entrances, or if Teachers are overloaded.
        4. **AI Summary**: Write a concise, 2-3 paragraph professional brief summarizing the safety posture, highlighting critical vulnerabilities (especially restrooms on the 4th/5th floors, or entry gates), and listing actionable steps for the administration.

        CRITICAL MULTILINGUAL REQUIREMENT:
        All explanation, warnings, alerts, comments, and summaries MUST be written in the Khmer language.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an institutional safety auditor. Provide a detailed, realistic safety assessment of the school roster as JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coverageScore: {
                type: Type.INTEGER,
                description: 'Overall safety coverage percentage from 0 to 100'
              },
              uncoveredZones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    shiftName: { type: Type.STRING },
                    zoneName: { type: Type.STRING },
                    riskLevel: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ['day', 'shiftName', 'zoneName', 'riskLevel', 'reason']
                },
                description: 'List of zones that are unstaffed or under-staffed during specific shifts'
              },
              complianceAlerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of warnings (over-scheduling, role misalignment, double bookings)'
              },
              aiSummary: {
                type: Type.STRING,
                description: '2-3 paragraph administrative safety brief and recommendations'
              }
            },
            required: ['coverageScore', 'uncoveredZones', 'complianceAlerts', 'aiSummary']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini model');
      }

      const auditResult = JSON.parse(responseText.trim());
      res.json({ success: true, audit: auditResult, mode: 'AI' });

    } catch (error: any) {
      console.error('Gemini Safety Audit Error:', error.message);

      // Perform local heuristic audit in case of failure or missing key
      const fallbackAudit = performHeuristicAudit(staff, zones, shifts, roster);
      res.json({
        success: true,
        audit: fallbackAudit,
        mode: 'Heuristic Fallback',
        warning: error.message.includes('GEMINI_API_KEY')
          ? 'កូដសម្ងាត់ Gemini API មិនទាន់ត្រូវបានកំណត់កំណត់រចនាសម្ព័ន្ធទេ។ កំពុងដំណើរការម៉ាស៊ីនវាយតម្លៃសុវត្ថិភាពក្នុងតំបន់។'
          : `សេវាកម្ម AI មិនដំណើរការ (${error.message})។ កំពុងដំណើរការម៉ាស៊ីនវាយតម្លៃសុវត្ថិភាពក្នុងតំបន់។`
      });
    }
  });

  // Serve static assets / Vite files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Duty Roster Server listening on port ${PORT}`);
  });
}

// ==========================================
// LOCAL HEURISTIC FALLBACK ALGORITHMS
// ==========================================

function generateHeuristicRoster(staff: any[], zones: any[], shifts: any[]): any[] {
  const roster: any[] = [];
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Track assigned duty counts per staff member to respect maxWeeklyDuties
  const dutyCounts: Record<string, number> = {};
  staff.forEach(s => { dutyCounts[s.id] = 0; });

  days.forEach(day => {
    shifts.forEach(shift => {
      // Keep track of who is already scheduled in this SPECIFIC shift
      const assignedInCurrentShift = new Set<string>();

      // Filter and score zones: prioritize High Risk ones first
      const sortedZones = [...zones].sort((a, b) => {
        const riskVal = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return riskVal[b.riskLevel as 'High' | 'Medium' | 'Low'] - riskVal[a.riskLevel as 'High' | 'Medium' | 'Low'];
      });

      sortedZones.forEach(zone => {
        const assignedStaff: string[] = [];
        const needed = zone.minStaffRequired || 1;

        // Try to find matching staff members who are free
        for (let i = 0; i < staff.length; i++) {
          if (assignedStaff.length >= needed) break;

          const member = staff[i];
          if (member.role === 'Management') continue; // Skip Management/Admin who do not have duty hours

          const currentCount = dutyCounts[member.id] || 0;

          // Constraints checklist:
          // - Staff not exceeded max duties
          // - Staff not already working this shift
          // - Role-to-Zone suitability: Security guards suited for Zone D, Teachers/Management for A & B
          const isSecurity = member.role === 'Security';
          const isZoneD = zone.zoneType === 'Zone D';
          const roleMatch = (isZoneD && isSecurity) || (!isZoneD && !isSecurity) || (Math.random() > 0.4); // allow slight mixed assignments if security is scarce

          if (currentCount < member.maxWeeklyDuties && !assignedInCurrentShift.has(member.id) && roleMatch) {
            assignedStaff.push(member.id);
            assignedInCurrentShift.add(member.id);
            dutyCounts[member.id] = currentCount + 1;
          }
        }

        // If we still need staff, relax the role matching criteria
        if (assignedStaff.length < needed) {
          for (let i = 0; i < staff.length; i++) {
            if (assignedStaff.length >= needed) break;

            const member = staff[i];
            if (member.role === 'Management') continue; // Skip Management/Admin who do not have duty hours

            const currentCount = dutyCounts[member.id] || 0;

            if (currentCount < member.maxWeeklyDuties && !assignedInCurrentShift.has(member.id)) {
              assignedStaff.push(member.id);
              assignedInCurrentShift.add(member.id);
              dutyCounts[member.id] = currentCount + 1;
            }
          }
        }

        if (assignedStaff.length > 0) {
          roster.push({
            id: `heur-${day}-${shift.id}-${zone.id}`,
            day,
            shiftId: shift.id,
            zoneId: zone.id,
            staffIds: assignedStaff,
            status: 'Assigned',
            notes: `បានចាត់តាំងបុគ្គលិកចំនួន ${assignedStaff.length} នាក់ទៅកាន់ ${zone.name} ដោយផ្តល់អាទិភាពដល់តម្រូវការសុវត្ថិភាព។`
          });
        }
      });
    });
  });

  return roster;
}

function performHeuristicAudit(staff: any[], zones: any[], shifts: any[], roster: any[]) {
  const uncoveredZones: any[] = [];
  const complianceAlerts: string[] = [];
  
  // 1. Calculate Roster Coverage
  let totalRequirements = 0;
  let metRequirements = 0;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const staffDutyCounts: Record<string, number> = {};
  staff.forEach(s => { staffDutyCounts[s.id] = 0; });

  days.forEach(day => {
    shifts.forEach(shift => {
      // Find all assignments for this day & shift
      const entriesForShift = roster.filter(r => r.day === day && r.shiftId === shift.id);
      const busyStaffThisShift = new Set<string>();

      zones.forEach(zone => {
        totalRequirements += zone.minStaffRequired;
        
        const entry = entriesForShift.find(r => r.zoneId === zone.id);
        const assignedCount = entry ? entry.staffIds.length : 0;
        
        metRequirements += Math.min(assignedCount, zone.minStaffRequired);

        if (assignedCount < zone.minStaffRequired) {
          uncoveredZones.push({
            day,
            shiftName: shift.name,
            zoneName: zone.name,
            riskLevel: zone.riskLevel,
            reason: assignedCount === 0 
              ? 'គ្មានការយាមកាមទាំងស្រុង (មិនទាន់ចាត់តាំងបុគ្គលិក)' 
              : `ខ្វះបុគ្គលិកយាមកាម (បានចាត់តាំង ${assignedCount} នាក់ តែតម្រូវការគឺ ${zone.minStaffRequired} នាក់)`
          });
        }

        // Add to workload counts & check double booking
        if (entry) {
          entry.staffIds.forEach((id: string) => {
            staffDutyCounts[id] = (staffDutyCounts[id] || 0) + 1;
            
            if (busyStaffThisShift.has(id)) {
              const staffName = staff.find(s => s.id === id)?.name || id;
              complianceAlerts.push(`ការកក់ស្ទួន៖ លោក/លោកស្រី ${staffName} ត្រូវបានចាត់តាំងឱ្យទៅកាន់តំបន់ច្រើនក្នុងពេលតែមួយនៅថ្ងៃ ${day} ក្នុងម៉ោង ${shift.name}។`);
            }
            busyStaffThisShift.add(id);

            // Guard Role Check
            const sMember = staff.find(s => s.id === id);
            if (sMember) {
              if (sMember.role === 'Security' && zone.zoneType !== 'Zone D') {
                complianceAlerts.push(`ការចាត់តាំងខុសតួនាទី៖ ភ្នាក់ងារសន្តិសុខ ${sMember.name} ត្រូវបានចាត់តាំងឱ្យទៅកាន់ ${zone.name} (${zone.zoneType}) ជំនួសឱ្យការយាមនៅច្រកចេញចូលសាលា។`);
              }
              if (sMember.role === 'Teacher' && zone.zoneType === 'Zone D') {
                complianceAlerts.push(`ការព្រមានអំពីសុវត្ថិភាព៖ លោកគ្រូ/អ្នកគ្រូ ${sMember.name} ត្រូវបានចាត់តាំងឱ្យទៅយាមនៅខ្លោងទ្វារធំ/ច្រកចេញចូល ដែលការងារនេះគួរតែត្រូវបានចាត់ចែងដោយភ្នាក់ងារសន្តិសុខដែលមានជំនាញ។`);
              }
            }
          });
        }
      });
    });
  });

  // 2. Check Overload
  staff.forEach(member => {
    const assignedCount = staffDutyCounts[member.id] || 0;
    if (assignedCount > member.maxWeeklyDuties) {
      complianceAlerts.push(`ការព្រមានអំពីការលើសការងារ៖ លោក/លោកស្រី ${member.name} (${member.role === 'Security' ? 'ភ្នាក់ងារសន្តិសុខ' : member.role === 'Management' ? 'គណៈគ្រប់គ្រង' : 'គ្រូបង្រៀន'}) ត្រូវបានចាត់តាំងការងារចំនួន ${assignedCount} លើសពីកម្រិតកំណត់ប្រចាំសប្តាហ៍អតិបរមាគឺ ${member.maxWeeklyDuties} ភារកិច្ច។`);
    }
  });

  const coverageScore = totalRequirements > 0 ? Math.round((metRequirements / totalRequirements) * 100) : 100;

  // 3. AI / Local Summary Generation
  const totalStaff = staff.length;
  const highRiskIssuesCount = uncoveredZones.filter(uz => uz.riskLevel === 'High').length;

  const aiSummary = `
    សាលារៀនមានបុគ្គលិកសកម្មសរុបចំនួន ${totalStaff} នាក់ ដែលត្រូវបានត្រួតពិនិត្យនៅទូទាំងតំបន់សុវត្ថិភាពចំនួន ${zones.length} តំបន់។ ផ្អែកលើកាលវិភាគបច្ចុប្បន្ន ភាគរយគ្របដណ្តប់សុវត្ថិភាពទូទាំងសាលារៀនត្រូវបានវាយតម្លៃនៅកម្រិត ${coverageScore}%។
    
    ${highRiskIssuesCount > 0 
      ? `មានបញ្ហាសុវត្ថិភាពសំខាន់ៗមួយចំនួន៖ មានតំបន់ហានិភ័យខ្ពស់ចំនួន ${highRiskIssuesCount} កន្លែងដែលគ្មានការយាមកាម ឬខ្វះបុគ្គលិកយាមកាម ជាពិសេសនៅច្រករបៀងបន្ទប់ទឹកនៃជាន់ខាងលើ ឬនៅតាមខ្លោងទ្វារចេញចូលអំឡុងម៉ោងមមាញឹក។ នេះធ្វើឱ្យសិស្សានុសិស្សងាយប្រឈមនឹងគ្រោះថ្នាក់។` 
      : 'មិនមានតំបន់ហានិភ័យខ្ពស់ណាមួយដែលគ្មានការយាមកាមនោះទេ ដែលនេះបង្ហាញពីស្ថានភាពសុវត្ថិភាពដ៏រឹងមាំ។ ទោះជាយ៉ាងណាក៏ដោយ ការកែសម្រួលបន្តិចបន្តួចត្រូវបានណែនាំដើម្បីឱ្យការបែងចែកការងារមានតុល្យភាពកាន់តែល្អប្រសើរ។'
    }
    
    យើងសូមណែនាំយ៉ាងទទូចឱ្យបែងចែកភារកិច្ចយាមកាមនៅខ្លោងទ្វារចេញចូល (តំបន់ D) ទៅឱ្យភ្នាក់ងារសន្តិសុខដែលមានជំនាញ និងចាត់តាំងលោកគ្រូអ្នកគ្រូ ឬគណៈគ្រប់គ្រងទៅយាមនៅតាមច្រករបៀងបន្ទប់ទឹក (ជាន់ទី ១ ដល់ទី ៥)។ សូមធានាថាមិនមានលោកគ្រូអ្នកគ្រណាម្នាក់បំពេញភារកិច្ចលើសពីដែនកំណត់ការងារអតិបរមារបស់ពួកគេឡើយ ដើម្បីជៀសវាងការនឿយហត់ហួសកម្រិត និងដើម្បីរក្សាការប្រុងប្រយ័ត្នខ្ពស់។
  `.trim();

  return {
    coverageScore,
    uncoveredZones: uncoveredZones.slice(0, 12), // limit size
    complianceAlerts: Array.from(new Set(complianceAlerts)).slice(0, 15),
    aiSummary
  };
}

startServer();
