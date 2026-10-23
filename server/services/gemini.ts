import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { GEMINI_API_KEY, DEFAULT_ROUTING_RULES } from '../config.js';
import {
  Category,
  DraftAnalysis,
  ALLOWED_CATEGORIES,
  LocationData,
  UrgencyLevel,
  TechnicianDiagnosis,
  ClusterPattern,
  Ticket,
} from '../types.js';

// Schema for draft validation
const DraftResponseSchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(5).max(400),
  category: z.enum(['plumbing', 'electricity', 'cleanliness', 'internet_connectivity']),
  missingFields: z.array(z.string()),
  clarifyingQuestion: z.string().nullable(),
  routingSuggestion: z.string().min(3),
  routingReason: z.string().min(5),
  confidence: z.number().min(0).max(1),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']),
  safetyWarning: z.string().nullable(),
  detectedLanguage: z.string(),
  translatedText: z.string().nullable(),
});

let genAIClient: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    genAIClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.warn('[Gemini] Failed to initialize GoogleGenAI client:', err);
  }
}

/**
 * Deterministic fallback analysis when Gemini API is unavailable or unconfigured.
 */
function deterministicFallbackAnalysis(
  text: string,
  location: LocationData,
  answers: Array<{ question: string; answer: string }> = []
): DraftAnalysis {
  const combined = (text + ' ' + (location.details || '') + ' ' + answers.map(a => a.answer).join(' '));
  const lower = combined.toLowerCase();

  // Match category based on configured routing rules
  let matchedCategory: Category = 'cleanliness';
  let bestScore = 0;
  let matchingRule = DEFAULT_ROUTING_RULES[2];

  for (const rule of DEFAULT_ROUTING_RULES) {
    let score = 0;
    for (const term of rule.matchingTerms) {
      if (lower.includes(term)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      matchedCategory = rule.category;
      matchingRule = rule;
    }
  }

  // Safety & Urgency heuristic
  let urgency: UrgencyLevel = 'medium';
  let safetyWarning: string | null = null;

  if (lower.includes('spark') || lower.includes('shock') || lower.includes('smoke') || lower.includes('fire') || lower.includes('flood')) {
    urgency = 'critical';
    safetyWarning = 'CRITICAL HAZARD: Active electrical spark or flooding detected. Evacuate zone immediately and notify emergency desk.';
  } else if (lower.includes('buzz') || lower.includes('leak') || lower.includes('overflow') || lower.includes('urgent')) {
    urgency = 'high';
    safetyWarning = 'High priority: Potential equipment damage or slip risk if left unattended.';
  } else if (lower.includes('dust') || lower.includes('slow') || lower.includes('stain')) {
    urgency = 'low';
  }

  // Detect Hindi / Hinglish keywords
  let detectedLang = 'English';
  let translated: string | null = null;
  const hindiTokens = ['paani', 'pani', 'bijli', 'chal', 'raha', 'rahi', 'hai', 'bahut', 'kharab', 'saaf', 'nahi'];
  if (hindiTokens.some(tok => lower.includes(tok))) {
    detectedLang = 'Hindi / Hinglish';
    translated = text.replace(/paani/gi, 'water').replace(/bijli/gi, 'power').replace(/kharab/gi, 'faulty');
  }

  // Check missing fields
  const missing: string[] = [];
  let question: string | null = null;

  if (!location.building) {
    missing.push('building');
    question = 'Which campus building did this occur in?';
  } else if (!location.floor && !location.room && !location.zone && !lower.includes('floor') && !lower.includes('room')) {
    missing.push('exact_location');
    question = `Could you specify the floor, room number, or specific area inside ${location.building}?`;
  } else if (matchedCategory === 'internet_connectivity' && !lower.includes('all') && !lower.includes('my') && !lower.includes('device')) {
    missing.push('scope_of_issue');
    question = 'Is the Wi-Fi issue affecting multiple students/devices or just your personal device?';
  }

  const words = text.trim().split(/\s+/);
  const title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
  const summary = text.length > 180 ? text.slice(0, 177) + '...' : text;

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    summary,
    category: matchedCategory,
    missingFields: missing,
    clarifyingQuestion: question,
    routingSuggestion: matchingRule.departmentLabel,
    routingReason: `${matchingRule.sourceLabel}: matched keywords related to ${matchedCategory}.`,
    confidence: bestScore > 0 ? 0.88 : 0.65,
    urgencyLevel: urgency,
    safetyWarning,
    detectedLanguage: detectedLang,
    translatedText: translated,
  };
}

/**
 * Analyze an informal complaint using Gemini with Multilingual and Hazard Safety models
 */
export async function analyzeComplaintWithGemini(
  text: string,
  location: LocationData,
  photoBase64?: string | null,
  answers: Array<{ question: string; answer: string }> = []
): Promise<DraftAnalysis> {
  if (!genAIClient) {
    return deterministicFallbackAnalysis(text, location, answers);
  }

  const prompt = `You are the CampusConnect facilities triage AI assistant for university operations.
Your job is to convert informal student maintenance complaints into structured, actionable tickets.

ALLOWED CATEGORIES:
1. plumbing (leaks, taps, washrooms, toilets, drainage, water supply)
2. electricity (lights, power sockets, AC, fans, breakers, sparks)
3. cleanliness (garbage, dirty washrooms, litter, pest, spills, dustbins)
4. internet_connectivity (Wi-Fi disconnections, LAN ports, network outages, captive portals)

ROUTING GUIDES:
- plumbing -> "Facilities / Plumbing & Water Systems"
- electricity -> "Estate Office / Electrical & Power Maintenance"
- cleanliness -> "Sanitation & Housekeeping Services"
- internet_connectivity -> "IT Services / Campus Network & Wi-Fi Operations"

INPUT DATA:
Complaint Description: "${text}"
Reported Campus Location: Building: "${location.building || 'Not specified'}", Floor: "${location.floor || ''}", Room/Zone: "${location.room || location.zone || ''}", Extra: "${location.details || ''}"
${answers.length > 0 ? `Student Clarification Answers:\n${answers.map(a => `Q: ${a.question} -> A: ${a.answer}`).join('\n')}` : ''}

INNOVATIVE TASKS:
1. Language Detection & Translation: If written in Hindi or Hinglish (e.g. "paani beh raha hai"), translate it into clear English in translatedText, set detectedLanguage to "Hindi" or "Hinglish". If English, set detectedLanguage to "English" and translatedText to null.
2. Safety & Urgency Assessment: Assess urgencyLevel as "low", "medium", "high", or "critical". If there is fire, smoke, sparking electrical wires near water, or structural danger, mark "critical" and provide an explicit safetyWarning. Otherwise set safetyWarning to null.
3. Missing Information: If critical location or hazard details are missing, set clarifyingQuestion to ONE focused question and list the missing field.
4. Professional Summary & Title: Concise title (under 10 words) and 1-2 sentence objective summary.`;

  try {
    const contents: any[] = [];
    if (photoBase64) {
      const match = photoBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: `image/${match[1]}`,
            data: match[2],
          },
        });
      }
    }
    contents.push({ text: prompt });

    const response = await genAIClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ['plumbing', 'electricity', 'cleanliness', 'internet_connectivity'],
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            clarifyingQuestion: { type: Type.STRING, nullable: true },
            routingSuggestion: { type: Type.STRING },
            routingReason: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            urgencyLevel: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high', 'critical'],
            },
            safetyWarning: { type: Type.STRING, nullable: true },
            detectedLanguage: { type: Type.STRING },
            translatedText: { type: Type.STRING, nullable: true },
          },
          required: [
            'title',
            'summary',
            'category',
            'missingFields',
            'routingSuggestion',
            'routingReason',
            'confidence',
            'urgencyLevel',
            'detectedLanguage',
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const validated = DraftResponseSchema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn('[Gemini] Schema mismatch, falling back to rule engine:', validated.error);
      return deterministicFallbackAnalysis(text, location, answers);
    }
  } catch (error) {
    console.error('[Gemini] Model request failed, using deterministic fallback:', error);
    return deterministicFallbackAnalysis(text, location, answers);
  }
}

/**
 * INNOVATIVE FEATURE: AI Technician Root Cause Diagnosis & Step-by-Step Repair Plan
 */
export async function generateTechnicianDiagnosis(ticket: {
  title: string;
  summary: string;
  originalText: string;
  category: Category;
  location: LocationData;
}): Promise<TechnicianDiagnosis> {
  const fallbackPlan: Record<Category, TechnicianDiagnosis> = {
    plumbing: {
      likelyRootCause: 'Degraded neoprene washer or failed valve seal on water supply feed pipe.',
      recommendedTools: ['Adjustable pipe wrench', 'Basin wrench', 'PTFE thread sealing tape', 'Catch bucket'],
      replacementParts: ['1/2" flexible stainless steel braided hose', '15mm rubber washer gasket kit'],
      actionPlanSteps: [
        'Isolate the local water shutoff valve immediately under the fixture or floor riser.',
        'Drain remaining line pressure into catch bucket.',
        'Inspect fitting threads for calcium buildup or hairline fractures.',
        'Wrap 4-5 layers of PTFE tape clockwise and torque replacement washer.',
        'Re-pressurize system and observe for micro-weeping over 10 minutes.',
      ],
      estimatedRepairMinutes: 30,
    },
    electricity: {
      likelyRootCause: 'Loose neutral terminal screw or overloaded ballast/choke causing intermittent arcing.',
      recommendedTools: ['Digital Multimeter (CAT III 600V)', 'Insulated VDE Screwdriver Set (1000V)', 'Wire strippers', 'Non-contact voltage tester'],
      replacementParts: ['16A Type-C Miniature Circuit Breaker (MCB)', 'LED Electronic Driver Ballast', 'WAGO wire connectors'],
      actionPlanSteps: [
        'Lockout/Tagout (LOTO) sub-distribution board breaker feeding the lecture hall circuit.',
        'Verify zero voltage using non-contact tester and calibrated multimeter.',
        'Check terminal screws for heat discoloration or loose copper strands.',
        'Replace failing ballast or charred terminal block.',
        'Restore power and test current draw under full projector load.',
      ],
      estimatedRepairMinutes: 45,
    },
    cleanliness: {
      likelyRootCause: 'Capacity exceeded during peak meal hours combined with missing secondary collection bins.',
      recommendedTools: ['Heavy-duty custodial trolley', 'Biological disinfectant spray', 'Long-reach grabbers', 'Wet floor caution cones'],
      replacementParts: ['120-litre heavy mil biodegradable liners', 'Color-coded recycling lid flaps'],
      actionPlanSteps: [
        'Position warning cones around spill radius.',
        'Clear overflow waste with protective puncture-resistant gloves into heavy-mil liners.',
        'Apply quaternary ammonium disinfectant to receptacle interiors.',
        'Install fresh liner and position secondary overflow bin for peak dining hours.',
      ],
      estimatedRepairMinutes: 20,
    },
    internet_connectivity: {
      likelyRootCause: 'DHCP IP pool exhaustion on VLAN 40 or excessive 2.4GHz RF channel interference.',
      recommendedTools: ['Wi-Fi 6 Spectrum Analyzer / Laptop', 'Cat6 Cable Continuity Tester', 'Console rollover cable'],
      replacementParts: ['PoE+ Gigabit Injector 802.3at', 'Pre-terminated 2m Cat6 patch cord'],
      actionPlanSteps: [
        'Query AP controller syslog for DHCP timeout and de-authentication spikes on AP-04.',
        'Flush lease pool on campus core router for VLAN 40 and expand subnet mask.',
        'Verify PoE negotiated wattage at switch port (requires min 25.5W).',
        'Execute channel auto-tune script to shift 5GHz frequency away from co-channel overlap.',
        'Conduct throughput test from three client stations.',
      ],
      estimatedRepairMinutes: 25,
    },
  };

  if (!genAIClient) {
    return fallbackPlan[ticket.category] || fallbackPlan.plumbing;
  }

  const prompt = `You are a Senior Facilities Operations Engineer.
Generate a structured engineering diagnosis and field action plan for a technician dispatched to this ticket:

Ticket Title: "${ticket.title}"
Category: "${ticket.category}"
Location: "${ticket.location.building}, Floor ${ticket.location.floor || 'N/A'}, Room ${ticket.location.room || 'N/A'}"
Description: "${ticket.originalText}"

Provide:
1. likelyRootCause: Specific technical root cause (not generic).
2. recommendedTools: List of 3-5 real tools the technician must bring in their toolbox.
3. replacementParts: 2-4 exact hardware/electrical/plumbing/networking replacement parts.
4. actionPlanSteps: 4-5 numbered chronological execution steps including safety isolation.
5. estimatedRepairMinutes: realistic time in minutes (number).`;

  try {
    const response = await genAIClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            likelyRootCause: { type: Type.STRING },
            recommendedTools: { type: Type.ARRAY, items: { type: Type.STRING } },
            replacementParts: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlanSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedRepairMinutes: { type: Type.NUMBER },
          },
          required: [
            'likelyRootCause',
            'recommendedTools',
            'replacementParts',
            'actionPlanSteps',
            'estimatedRepairMinutes',
          ],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('[Gemini] Diagnosis plan error, falling back to rule blueprint:', err);
    return fallbackPlan[ticket.category] || fallbackPlan.plumbing;
  }
}

/**
 * INNOVATIVE FEATURE: AI Campus Infrastructure Recurring Cluster Detection
 */
export async function analyzeCampusClusters(tickets: Ticket[]): Promise<ClusterPattern[]> {
  const groups: Record<string, { count: number; category: Category; titles: string[] }> = {};

  for (const t of tickets) {
    const key = `${t.location.building}__${t.category}`;
    if (!groups[key]) {
      groups[key] = { count: 0, category: t.category, titles: [] };
    }
    groups[key].count += 1;
    groups[key].titles.push(t.title);
  }

  const clusters: ClusterPattern[] = [];
  for (const [key, val] of Object.entries(groups)) {
    const [building, cat] = key.split('__');
    if (val.count >= 2) {
      clusters.push({
        building,
        category: cat as Category,
        ticketCount: val.count,
        patternSummary: `Multiple recurring incidents (${val.count} reports) in ${building} affecting ${cat.replace('_', ' ')}. Symptoms include: ${val.titles.slice(0, 2).join('; ')}.`,
        systemicRisk: val.count >= 3 ? 'high' : 'medium',
        recommendedAction: `Schedule comprehensive departmental audit of ${building} ${cat} infrastructure rather than addressing isolated symptoms.`,
      });
    }
  }

  return clusters;
}
