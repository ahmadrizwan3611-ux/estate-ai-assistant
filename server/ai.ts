// Server-side AI Continuity Brain
// Location: /server/ai.ts

import { GoogleGenAI, Type } from '@google/genai';
import { ConversationMessage, LeadAIMemory, ParsedAIIntent } from '../src/types';

// Initialize Gemini client as fallback, setting the required User-Agent for telemetry
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

const SYSTEM_PARSER_PROMPT = `
You are the EstateAI Continuity Brain, working behind the scenes in a Pakistani real estate SaaS.
Your absolute only output must be a valid, parsed JSON object describing the customer's message intent, language, requirements, and lead classification.

Analyze the direct message from the customer, their previous convo history, and their current cached AI memory (requirements and last matched properties).

Understand these cases:
- Is this a "new_search" for property? (e.g. "dha phase 6 me 5 marla house chahiye")
- Is this a "follow_up" questions generally? (e.g. "is there a park nearby?")
- Is this an "option_question"? Asking specifically about Option 1, Option 2, or Option 3 presented earlier? (e.g. "how is 2nd one which price is 1.85 crore?"). Match correct option number and price if mentioned.
- Is this a "visit_request"? (e.g. "mujhe sunday visit karna hai", "milne kab aaein").
- Is this a "picture_request"? (e.g. "send design photos", "images share karein").
- Is this a "map_request"? (e.g. "location pin de dein").
- Is this "negotiation"? (e.g. "rate thora kam hoga?", "price check karein").
- Is this a "missing_detail_question" asking details like: furnished status, bedrooms count, registry/document status? (e.g. "furnished hai ya flat?").
- Is this "unrelated"? Greetings ("salam", "hi") or random general things.

CRITICAL:
1. "requirement_patch": If customer specifies a change, extract properties into requirement_patch. Set fields to null if NOT modified.
2. If customer says "are you sure?", they are NOT changing their requirements; is_new_requirement is FALSE, message_type is "follow_up".
3. Check if they explicitly changed their previous requirements (e.g. "Actually mujhe Bahria Town mein 10 marla chahiye" when previous was DHA). Set "is_new_requirement" to true.
4. Sizes MUST NEVER be re-calculated or abbreviated. Copy size words EXACTLY (e.g., "5 Marla", "10 Marla", "1 Kanal", "5 marla").
5. Detect customer language. Usually "english_roman_urdu_mix", "pure_english", "pure_roman_urdu".
6. lead_status can be:
   - "hot": wants visit, ready to call, token discuss, office deal finalize.
   - "warm": asks property details, pictures, price negotiation, map pin, options compare.
   - "cold": says no interest, unrelated random chat.
   - "new": first greeting or unclear.

JSON Output Schema:
{
  "message_type": "new_search" | "follow_up" | "option_question" | "visit_request" | "picture_request" | "map_request" | "negotiation" | "missing_detail_question" | "unrelated",
  "selected_option_number": number | null,
  "selected_price": "string" | null,
  "is_new_requirement": boolean,
  "customer_intent_summary": "string describing in 1 human sentence what customer wants",
  "requirement_patch": {
    "city": "string" | null,
    "area": "string" | null,
    "size": "string" | null,
    "property_type": "string" | null,
    "purpose": "Sale" | "Rent" | null,
    "max_budget": "string" | null
  },
  "question_type": "string" | null,
  "language": "string",
  "lead_status": "hot" | "warm" | "cold" | "new"
}
`;

// Direct Groq API completions call using fetch
async function callGroqAPI(message: string, history: ConversationMessage[], memory: LeadAIMemory): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const fallbackModel = process.env.GROQ_FALLBACK_MODEL || 'llama-3.3-70b-versatile';

  console.log(`Connecting to Groq API using model preference: ${model}, fallback: ${fallbackModel}`);

  const messagesPayload = [
    { role: 'system', content: SYSTEM_PARSER_PROMPT },
    { role: 'system', content: `Current cached Lead memory context:\n${JSON.stringify(memory, null, 2)}` },
    ...history.slice(-10).map(h => ({
      role: h.sender === 'customer' ? 'user' : 'assistant',
      content: h.message
    })),
    { role: 'user', content: message }
  ];

  // Try standard model first
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messagesPayload,
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.choices[0].message.content;
    } else {
      const errorMsg = await response.text();
      console.warn(`Groq main model failed, trying fallback: ${errorMsg}`);
    }
  } catch (err) {
    console.warn("Groq main API request failed:", err);
  }

  // Try fallback model
  const responseFallback = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: fallbackModel,
      messages: messagesPayload,
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!responseFallback.ok) {
    const text = await responseFallback.text();
    throw new Error(`Groq Fallback API failed as well: ${text}`);
  }

  const resultFallback = await responseFallback.json();
  return resultFallback.choices[0].message.content;
}

// Fallback Google Gemini call
async function callGeminiAPI(message: string, history: ConversationMessage[], memory: LeadAIMemory): Promise<string> {
  const gemini = getGeminiClient();
  if (!gemini) {
    throw new Error("No Groq API Key and No Gemini API Key are available.");
  }

  const promptContent = `
MESSAGE CONTEXT:
Cached Memory: ${JSON.stringify(memory)}
Recent Dialogs:
${history.map(h => `${h.sender.toUpperCase()}: ${h.message}`).join('\n')}

Active Message: ${message}

Analyze using the system instructions provided below and return structured JSON representation.
`;

  const response = await gemini.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: promptContent,
    config: {
      systemInstruction: SYSTEM_PARSER_PROMPT,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: [
          'message_type',
          'selected_option_number',
          'selected_price',
          'is_new_requirement',
          'customer_intent_summary',
          'requirement_patch',
          'question_type',
          'language',
          'lead_status'
        ],
        properties: {
          message_type: {
            type: Type.STRING,
            description: "Category of the customer message intention."
          },
          selected_option_number: {
            type: Type.INTEGER,
            description: "Option index user references if any.",
            nullable: true
          },
          selected_price: {
            type: Type.STRING,
            description: "Price referenced if any.",
            nullable: true
          },
          is_new_requirement: {
            type: Type.BOOLEAN,
            description: "If current message initiates a requirement deviation."
          },
          customer_intent_summary: {
            type: Type.STRING,
            description: "A short 1-line conceptual understanding."
          },
          requirement_patch: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING, nullable: true },
              area: { type: Type.STRING, nullable: true },
              size: { type: Type.STRING, nullable: true },
              property_type: { type: Type.STRING, nullable: true },
              purpose: { type: Type.STRING, nullable: true },
              max_budget: { type: Type.STRING, nullable: true }
            }
          },
          question_type: { type: Type.STRING, nullable: true },
          language: { type: Type.STRING },
          lead_status: { type: Type.STRING }
        }
      }
    }
  });

  return response.text || "{}";
}

// Global Parser Entry Point
export async function parseIntentAndContext(message: string, history: ConversationMessage[], memory: LeadAIMemory): Promise<ParsedAIIntent> {
  const provider = process.env.AI_PROVIDER || 'groq';
  const hasGroqKey = !!process.env.GROQ_API_KEY;

  let rawJsonResult = '';
  
  if (provider === 'groq' && hasGroqKey) {
    try {
      rawJsonResult = await callGroqAPI(message, history, memory);
    } catch (e) {
      console.error("Groq Brain completed with error, attempting Gemini switch...", e);
      rawJsonResult = await callGeminiAPI(message, history, memory);
    }
  } else {
    console.log("Using Google Gemini API as primary AI parser.");
    rawJsonResult = await callGeminiAPI(message, history, memory);
  }

  try {
    const cleaned = rawJsonResult.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const result: ParsedAIIntent = JSON.parse(cleaned);
    return result;
  } catch (error) {
    console.error("Failed to parse AI intent response. Returning basic mock structure.", error);
    // Graceful baseline parser in case of parsing faults
    return createBaselineIntentParser(message, memory);
  }
}

// Baseline regex-based parser in extreme case of API/parsing failure
function createBaselineIntentParser(message: string, memory: LeadAIMemory): ParsedAIIntent {
  const msg = message.toLowerCase();
  let type: any = 'follow_up';
  let num: number | null = null;
  let isNew = false;

  if (msg.includes('sund') || msg.includes('visit') || msg.includes('mili') || msg.includes('office')) {
    type = 'visit_request';
  } else if (msg.includes('pict') || msg.includes('photo') || msg.includes('tasweer')) {
    type = 'picture_request';
  } else if (msg.includes('pin') || msg.includes('maps') || msg.includes('locat')) {
    type = 'map_request';
  } else if (msg.includes('rate') || msg.includes('kam') || msg.includes('negotiat') || msg.includes('discount')) {
    type = 'negotiation';
  } else if (/\b(1|one|2|two|3|three|first|second|third|second\b)/i.test(msg)) {
    type = 'option_question';
    if (msg.includes('2') || msg.includes('second') || msg.includes('doosra')) {
      num = 2;
    } else if (msg.includes('1') || msg.includes('first') || msg.includes('pehla')) {
      num = 1;
    } else if (msg.includes('3') || msg.includes('third')) {
      num = 3;
    }
  } else if (msg.includes('marla') || msg.includes('kanal') || msg.includes('house') || msg.includes('dha') || msg.includes('bahria')) {
    type = 'new_search';
    isNew = true;
  }

  return {
    message_type: type,
    selected_option_number: num,
    selected_price: null,
    is_new_requirement: isNew,
    customer_intent_summary: `Customer message keyword detected for ${type}`,
    requirement_patch: {
      city: msg.includes('lahore') ? 'Lahore' : msg.includes('islamabad') ? 'Islamabad' : null,
      area: msg.includes('6') ? 'DHA Phase 6' : msg.includes('bahria') ? 'Bahria Town' : null,
      size: msg.includes('5') ? '5 Marla' : msg.includes('10') ? '10 Marla' : null,
      property_type: 'House',
      purpose: 'Sale',
      max_budget: null
    },
    question_type: null,
    language: 'english_roman_urdu_mix',
    lead_status: 'Warm'
  };
}
