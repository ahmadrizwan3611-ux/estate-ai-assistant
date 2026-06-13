// CRM Property Matching and Safe Response Generator
// Location: /server/engine.ts

import { GoogleGenAI } from '@google/genai';
import { dbStore, parseBudgetToNumeric } from './db';
import { ParsedAIIntent, Property, LeadAIMemory, ConversationMessage } from '../src/types';

// Matching Algorithm
export function matchCRMProperties(requirement: any): Property[] {
  const allProperties = dbStore.getProperties();
  
  const reqCity = requirement.city ? requirement.city.toLowerCase().trim() : null;
  const reqArea = requirement.area ? requirement.area.toLowerCase().trim() : null;
  const reqAreaGroup = requirement.area_group ? requirement.area_group.toLowerCase().trim() : null;
  const reqSize = requirement.size ? requirement.size.toLowerCase().trim() : null;
  const reqType = requirement.property_type ? requirement.property_type.toLowerCase().trim() : null;
  const reqPurpose = requirement.purpose ? requirement.purpose.toLowerCase().trim() : null;
  const maxBudgetNum = parseBudgetToNumeric(requirement.max_budget);

  console.log('Matching criteria:', { reqCity, reqArea, reqAreaGroup, reqSize, reqType, reqPurpose, maxBudgetNum });

  return allProperties.filter(p => {
    // 1. City Check (Strictly enforce same city)
    if (reqCity && p.city.toLowerCase() !== reqCity) {
      return false;
    }

    // 2. Area/Group Check
    // If user asked for DHA or DHA Lahore, match anything with DHA in Lahore (but not Citi Housing Gujranwala)
    if (reqAreaGroup && (reqAreaGroup.includes('dha') || reqAreaGroup.includes('defence'))) {
      if (!p.area.toLowerCase().includes('dha') && !p.title.toLowerCase().includes('dha')) {
        return false;
      }
      // Ensure city is Lahore if DHA Lahore is asked for
      if (p.city.toLowerCase() !== 'lahore') {
        return false;
      }
    } else if (reqArea) {
      // General area substring check
      const areaMatch = p.area.toLowerCase().includes(reqArea) || 
                        reqArea.includes(p.area.toLowerCase()) ||
                        p.title.toLowerCase().includes(reqArea);
      if (!areaMatch) return false;
    }

    // 3. Size check (Must copy exact size words. e.g. "5 Marla" matches "5 Marla" etc.)
    if (reqSize) {
      // Normalize comparison
      const normPropSize = p.size.toLowerCase().replace(/\s+/g, '');
      const normReqSize = reqSize.replace(/\s+/g, '');
      if (normPropSize !== normReqSize && !normPropSize.includes(normReqSize) && !normReqSize.includes(normPropSize)) {
        return false;
      }
    }

    // 4. Type check
    if (reqType) {
      if (p.type.toLowerCase() !== reqType) return false;
    }

    // 5. Purpose check
    if (reqPurpose) {
      if (p.purpose.toLowerCase() !== reqPurpose) return false;
    }

    // 6. Budget check
    if (p.price > maxBudgetNum) {
      return false;
    }

    return true;
  });
}

// Secure Response Generation
export async function composeAIResponse(
  message: string, 
  intent: ParsedAIIntent, 
  memory: LeadAIMemory, 
  history: ConversationMessage[],
  matchedCRMProps: Property[]
): Promise<string> {
  const agency = dbStore.getAgency();
  const provider = process.env.AI_PROVIDER || 'groq';
  const hasGroqKey = !!process.env.GROQ_API_KEY;

  // Build static summary of CRM facts to seed into the context
  let crmFactsSummary = '';
  if (matchedCRMProps.length > 0) {
    crmFactsSummary = matchedCRMProps.map((p, idx) => `
Option ${idx + 1}:
🏠 Property ID: ${p.id}
🏠 Title: ${p.title}
📏 Size: ${p.size} (COPY SIZE WORD EXACTLY, NEVER USE FRACTIONS OR ALTERNATIVES)
📍 Location: ${p.area}, ${p.city}
🏙 City: ${p.city}
🏘 Area: ${p.area}
🏷 Type: ${p.type}
📌 Purpose: ${p.purpose}
💰 Price: ${p.price_display}
🛏 Bedrooms: ${p.bedrooms ?? 'Not Mentioned'}
🛁 Bathrooms: ${p.bathrooms ?? 'Not Mentioned'}
✅ Furnished Status: ${p.furnished_status ?? 'Not Mentioned'}
📄 Description: ${p.description ?? ''}
📍 Map Pin: ${p.map_pin ?? 'Not Mentioned'}
`).join('\n---\n');
  } else {
    crmFactsSummary = 'NO EXACT CRM PROPERTIES MATCHING AT THE MOMENT.';
  }

  // Active property details if follow up on option
  let activePropertyFact = '';
  if (memory.active_property_id) {
    const activeP = dbStore.getProperties().find(p => p.id === memory.active_property_id);
    if (activeP) {
      activePropertyFact = `
Currently Discussed Active Option:
🏠 Title: ${activeP.title}
📏 Size: ${activeP.size}
Price: ${activeP.price_display}
Bedrooms: ${activeP.bedrooms ?? 'Not Mentioned'}
Bathrooms: ${activeP.bathrooms ?? 'Not Mentioned'}
Furnished Status: ${activeP.furnished_status ?? 'Not Mentioned'}
Map Pin: ${activeP.map_pin ?? 'Not Mentioned'}
Image URLs: ${activeP.image_urls.join(', ')}
Video URL: ${activeP.video_url || 'Not Mentioned'}
Location Notes: ${activeP.location_notes ?? 'Not Mentioned'}
`;
    }
  }

  const SYSTEM_WRITER_PROMPT = `
You are the brilliant, highly professional, and extremely polite Pakistani sales manager representing "${agency.name}".
Your duty is to reply to the customer's message on WhatsApp. You must talk inside the strict boundaries of provided CRM facts.

CORE LAWS:
1. STRICT TRUTH: Never invent, assume, guess, or extrapolate property features.
   - If bedrooms count, furnished status, documents, registry, final discount, payment plan is NOT mentioned in the ACTIVE listings, do not manufacture a fact.
   - Strictly follow the MISSING INFORMATION RULE: "Ji Sir, current listing details mein yeh information mention nahi hai. Main team se confirm karwa deta hoon."
2. EXACT SIZE RULE: When listing property options, output the 'Size' field word-for-word exactly how it is in the database CRM (e.g. "5 Marla", "10 Marla", "1 Kanal"). Never abbreviate or write fractions.
3. FOLLOW-UP NO-REPEAT RULE: If the customer is asking a follow-up about a specific select Option (Option 1, 2 or 3), talk ONLY about that option. Do NOT repeat the full properties list. Keep response compact and context-aware.
4. LANGUAGE TONE: Use a warm, professional, authentic "Roman Urdu mixed with English" (standard Urdu slang written in English letters, e.g., 'Ji Sir, Main check kar leta hoon'). Keep formatting spaced with clean bullet points and WhatsApp-friendly line returns.
5. IF NO MATCH EXISTS: Politely state no exact match was found at this moment, then ask if they would consider alternative surrounding areas or nearby sizes. Never list mismatching cities or properties.
6. ACTIVES: Utilize the provided Active Property context for follow ups. Deliver map pins/images links directly when user asks, but only if they actually exist in facts.
`;

  const promptContent = `
Real estate Agency: ${agency.name}
Tone Goal: Roman Urdu Mix
Customer message: "${message}"

Matched properties in CRM:
${crmFactsSummary}

${activePropertyFact}

Convo history:
${history.slice(-6).map(h => `${h.sender.toUpperCase()}: ${h.message}`).join('\n')}

Analyze context. Compose a friendly, authentic, and safe real estate sales agent WhatsApp reply.
`;

  // Try Groq API first, else fallback to Gemini
  if (provider === 'groq' && hasGroqKey) {
    try {
      const gResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.GROQ_FALLBACK_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_WRITER_PROMPT },
            { role: 'user', content: promptContent }
          ],
          temperature: 0.6
        })
      });

      if (gResponse.ok) {
        const payload = await gResponse.json();
        return payload.choices[0].message.content;
      } else {
        const text = await gResponse.text();
        console.warn(`Groq writer failed. Trying fallback Gemini: ${text}`);
      }
    } catch (e) {
      console.error("Groq writer crashed. Attempting Gemini backup:", e);
    }
  }

  // Backup: Google Gemini API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Local pre-composed script fallback
    return getPreComposedFallback(intent, memory, matchedCRMProps);
  }

  try {
    const gemini = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await gemini.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptContent,
      config: {
        systemInstruction: SYSTEM_WRITER_PROMPT,
        temperature: 0.6
      }
    });

    return response.text || getPreComposedFallback(intent, memory, matchedCRMProps);
  } catch (err) {
    console.error("Gemini writer error, using backup templates.", err);
    return getPreComposedFallback(intent, memory, matchedCRMProps);
  }
}

// Emergency Precomposed fallback if all AI models fail
function getPreComposedFallback(intent: ParsedAIIntent, memory: LeadAIMemory, props: Property[]): string {
  if (intent.message_type === 'new_search') {
    if (props.length === 0) {
      return `Ji Sir, is budget aur area mein exact double cabinet property available nahi hai filhal. Kya aap nearby locations ya alternative option dekhna pasand karein ge?`;
    }
    
    let text = `Yes Sir, I found ${props.length} exact matching properties for your requirement: ${memory.current_requirement.size} ${memory.current_requirement.property_type} in ${memory.current_requirement.area_group} under ${memory.current_requirement.max_budget}.\n\nHere are the available options:\n`;
    
    props.forEach((p, idx) => {
      text += `\nOption ${idx + 1}:\n🏠 Property: ${p.title}\n📏 Size: ${p.size}\n📍 Location: ${p.area}, ${p.city}\n🏙 City: ${p.city}\n💰 Price: ${p.price_display}\n🛏 Bedrooms: ${p.bedrooms ?? 'Not Mentioned'}\n✅ Status: Available\n`;
    });
    
    text += `\nWould you like me to share pictures, map pin, or schedule a physical visit?`;
    return text;
  }

  if (intent.message_type === 'visit_request') {
    return `Ji Sir, bilkul! Main physical site visit schedule karwa deta hoon Sunday ke liye. Humari sales team aapse coordinate kar le gi timing details. Office map share kar doon?`;
  }

  if (intent.message_type === 'picture_request') {
    return `Ji Sir, current property ki details available hain but media team se photos fetch ho rahi hain. Main direct WhatsApp par share kar deta hoon immediate confirmation ke baad.`;
  }

  return `Ji Sir, check kar liya hai maine. Is bare mein main customized deal confirmation ke liye dynamic coordination karwane laga hoon senior owner team ke sath.`;
}
