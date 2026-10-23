import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { GEMINI_API_KEY, DEFAULT_ROUTING_RULES } from '../config.js';
import { Category, DraftAnalysis, ALLOWED_CATEGORIES, LocationData } from '../types.js';

// Schema for draft validation
const DraftResponseSchema = z.object({
  title: z.string().min(3).max(100),
  summary: z.string().min(5).max(300),
  category: z.enum(['plumbing', 'electricity', 'cleanliness', 'internet_connectivity']),
  missingFields: z.array(z.string()),
  clarifyingQuestion: z.string().nullable(),
  routingSuggestion: z.string().min(3),
  routingReason: z.string().min(5),
  confidence: z.number().min(0).max(1),
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
  const lower = (text + ' ' + (location.details || '') + ' ' + answers.map(a => a.answer).join(' ')).toLowerCase();

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

  // Derive title & summary cleanly
  const words = text.trim().split(/\s+/);
  const title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
  const summary = text.length > 150 ? text.slice(0, 147) + '...' : text;

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    summary,
    category: matchedCategory,
    missingFields: missing,
    clarifyingQuestion: question,
    routingSuggestion: matchingRule.departmentLabel,
    routingReason: `${matchingRule.sourceLabel}: matched keywords related to ${matchedCategory}.`,
    confidence: bestScore > 0 ? 0.85 : 0.6,
  };
}

/**
 * Analyze an informal complaint using Gemini (or fallback)
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

ALLOWED CATEGORIES (You must select exactly one):
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

RULES:
- Extract a concise title (under 10 words).
- Provide a clear, objective 1-2 sentence summary.
- Determine if critical operational info is missing (e.g. which floor/room, or whether power is out in an entire room, or if a leak is actively flooding).
- If crucial info is missing and not already answered in clarifications, set clarifyingQuestion to ONE focused, helpful question, and list the missing field name in missingFields.
- If sufficient info exists, set missingFields to empty array [] and clarifyingQuestion to null.
- Provide a routingReason explaining the category choice citing the symptom.
- Do NOT invent policies or staff names.`;

  try {
    const contents: any[] = [];
    if (photoBase64) {
      // Support optional image analysis
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
          },
          required: [
            'title',
            'summary',
            'category',
            'missingFields',
            'routingSuggestion',
            'routingReason',
            'confidence',
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const validated = DraftResponseSchema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn('[Gemini] Output schema validation mismatch:', validated.error);
      return deterministicFallbackAnalysis(text, location, answers);
    }
  } catch (error) {
    console.error('[Gemini] Call failed, falling back to deterministic analysis:', error);
    return deterministicFallbackAnalysis(text, location, answers);
  }
}
