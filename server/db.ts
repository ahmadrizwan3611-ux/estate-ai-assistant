// Server-side database state and persistence manager
// Location: /server/db.ts

import fs from 'fs';
import path from 'path';
import { Agency, Property, Lead, LeadAIMemory, ConversationMessage, FollowUp } from '../src/types';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

interface DatabaseSchema {
  agency: Agency;
  properties: Property[];
  leads: Lead[];
  lead_ai_memory: Record<string, LeadAIMemory>; // keyed by lead_id
  conversations: ConversationMessage[];
  follow_ups: FollowUp[];
}

// Helper to normalize budgets from string like "2 crore" to numeric (e.g. 20000000)
export function parseBudgetToNumeric(budgetString: string | null): number {
  if (!budgetString) return Infinity;
  
  const text = budgetString.toLowerCase().trim();
  // Extract number part
  const numMatch = text.match(/([0-9.]+)/);
  if (!numMatch) return Infinity;
  
  const value = parseFloat(numMatch[1]);
  if (isNaN(value)) return Infinity;

  if (text.includes('crore') || text.includes('cr')) {
    return value * 10000000;
  }
  if (text.includes('lakh') || text.includes('lac')) {
    return value * 100000;
  }
  if (text.includes('million') || text.includes('m')) {
    return value * 1000000;
  }
  
  // Standard raw rupees or thousand-grouped raw units
  if (value < 1000) {
    // If user writes e.g. "2", assume they mean 2 Crore in context of Marla houses
    return value * 10000000;
  }
  
  return value;
}

// High-fidelity Initial Seed properties and data
const DEFAULT_AGENCY: Agency = {
  id: 'agency-id-1',
  name: 'EstateAI Premier Properties',
  owner_email: 'ahmadrizwanar069543@gmail.com',
  phone: '0300-1234567',
  logo_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80',
  tone_preference: 'roman_urdu_mix',
  ai_model_setting: 'llama-3.3-70b-versatile',
  created_at: new Date().toISOString()
};

const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    agency_id: 'agency-id-1',
    title: '5 Marla in DHA',
    size: '5 Marla', // MUST copy size field exactly
    city: 'Lahore',
    area: 'DHA Phase 6',
    type: 'House',
    purpose: 'Sale',
    price: 16200000,
    price_display: 'Rs. 1.62 crore',
    bedrooms: 3,
    bathrooms: 3,
    furnished_status: 'Semi-Furnished',
    description: 'Outstanding brand new 5 Marla house available for sale in DHA Phase 6 Lahore. This modern structure features a spacious TV lounge, open kitchen, 3 master bedrooms with attached bathrooms, and complete wooden paneling.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    map_pin: 'https://maps.google.com/?q=DHA+Phase+6+Lahore',
    latitude: 31.4697,
    longitude: 74.4485,
    location_notes: 'Excellent approach near Phase 6 Boulevard and sports park.'
  },
  {
    id: 'prop-2',
    agency_id: 'agency-id-1',
    title: '5 Marla House in DHA Phase 6',
    size: '5 Marla', // MUST copy size field exactly
    city: 'Lahore',
    area: 'DHA Phase 6Block C',
    type: 'House',
    purpose: 'Sale',
    price: 18500000,
    price_display: 'Rs. 1.85 crore',
    bedrooms: 3,
    bathrooms: 4,
    furnished_status: 'Completed Brand New',
    description: 'High-end luxury brand new double story 5 Marla house in DHA Phase 6 Lahore, featuring solid woodwork, Spain design tiles, double glazed energy-efficient windows, and 3 bedrooms.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: '',
    map_pin: 'https://maps.google.com/?q=DHA+Phase+6+Lahore+Block+C',
    latitude: 31.4720,
    longitude: 74.4510,
    location_notes: 'Walking distance to the sports complex and commercial block.'
  },
  {
    id: 'prop-3',
    agency_id: 'agency-id-1',
    title: '10 Marla Brand New House in Bahria Town',
    size: '10 Marla',
    city: 'Lahore',
    area: 'Bahria Town',
    type: 'House',
    purpose: 'Sale',
    price: 32000000,
    price_display: 'Rs. 3.2 crore',
    bedrooms: 5,
    bathrooms: 5,
    furnished_status: 'Unfurnished',
    description: 'Executive standard double story 10 Marla house in Bahria Town, Lahore. Featuring 5 fully tiled master bedrooms, spacious car porch, 2 kitchens, and premium imported sanity ware. Ready to move.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    map_pin: 'https://maps.google.com/?q=Bahria+Town+Lahore',
    latitude: 31.3685,
    longitude: 74.1950,
    location_notes: 'Located in a secure residential block with 24/7 power backup.'
  },
  {
    id: 'prop-4',
    agency_id: 'agency-id-1',
    title: '5 Marla Smart Villa in Citi Housing Gujranwala',
    size: '5 Marla',
    city: 'Gujranwala',
    area: 'Citi Housing',
    type: 'House',
    purpose: 'Sale',
    price: 12500000,
    price_display: 'Rs. 1.25 crore',
    bedrooms: 3,
    bathrooms: 3,
    furnished_status: 'Fully Furnished',
    description: 'Designer 5 Marla smart villa in Citi Housing Gujranwala. Comes with automation features, high performance security cameras, customized wardrobes, and stylish furniture.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: '',
    map_pin: 'https://maps.google.com/?q=Citi+Housing+Gujranwala',
    latitude: 32.2032,
    longitude: 74.1578,
    location_notes: 'Immediate master approach near Central Commercial sector.'
  },
  {
    id: 'prop-5',
    agency_id: 'agency-id-1',
    title: '1 Kanal Luxury Castle in DHA Phase 5',
    size: '1 Kanal',
    city: 'Lahore',
    area: 'DHA Phase 5',
    type: 'House',
    purpose: 'Sale',
    price: 75000000,
    price_display: 'Rs. 7.5 crore',
    bedrooms: 5,
    bathrooms: 6,
    furnished_status: 'Fully Furnished',
    description: 'Royal standard 1 Kanal house available in DHA Phase 5. Modern contemporary architecture design, swimming pool, home theater, landscaped garden, and high grade secure parking.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: '',
    map_pin: 'https://maps.google.com/?q=DHA+Phase+5+Lahore',
    latitude: 31.4745,
    longitude: 74.4285,
    location_notes: 'Premium phase 5 sector with wide access park entrance.'
  },
  {
    id: 'prop-6',
    agency_id: 'agency-id-1',
    title: '5 Marla Plot on installments in DHA Phase 9 Prism',
    size: '5 Marla',
    city: 'Lahore',
    area: 'DHA Phase 9 Prism',
    type: 'Plot',
    purpose: 'Sale',
    price: 6800000,
    price_display: 'Rs. 68 lakh',
    bedrooms: undefined,
    bathrooms: undefined,
    furnished_status: undefined,
    description: 'File available for 5 Marla premium block plot in DHA Phase 9 Prism Lahore. Excellent opportunity for investors under easy transfer documentation. Outstanding growth yield potential.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
    ],
    map_pin: 'https://maps.google.com/?q=DHA+Phase+9+Prism+Lahore',
    location_notes: 'Direct assignment and on-ground soon.'
  }
];

const SEED_LEADS: Lead[] = [
  {
    id: 'lead-1',
    agency_id: 'agency-id-1',
    name: 'Zain Ul Abideen',
    phone: '0321-4567890',
    email: 'zain@example.com',
    status: 'Warm',
    requirement_notes: 'Looking for a 5 Marla home in DHA Lahore under 2 crore. Serious buyer but wants to review features first.'
  },
  {
    id: 'lead-2',
    agency_id: 'agency-id-1',
    name: 'Hamza Chaudhry',
    phone: '0300-8765432',
    email: 'hamza@example.com',
    status: 'Hot',
    requirement_notes: 'Urgent 5 Marla site visit in DHA Lahore Phase 6. Needs map pins and wants office deal discussions.'
  },
  {
    id: 'lead-3',
    agency_id: 'agency-id-1',
    name: 'Rizwan Khan',
    phone: '0312-9876543',
    email: 'rizwan@example.com',
    status: 'New',
    requirement_notes: 'First inquiry via WhatsApp. Checking general pricing trend.'
  }
];

const SEED_MEMORIES: Record<string, LeadAIMemory> = {
  'lead-1': {
    id: 'mem-1',
    lead_id: 'lead-1',
    current_requirement: {
      city: 'Lahore',
      area: 'DHA Phase 6',
      area_group: 'DHA Lahore',
      property_type: 'House',
      size: '5 Marla',
      purpose: 'Sale',
      max_budget: '2 crore',
      bedrooms: null
    },
    last_matched_options: [
      {
        option_number: 1,
        property_id: 'prop-1',
        title: '5 Marla in DHA',
        price: 'Rs. 1.62 crore',
        size: '5 Marla'
      },
      {
        option_number: 2,
        property_id: 'prop-2',
        title: '5 Marla House in DHA Phase 6',
        price: 'Rs. 1.85 crore',
        size: '5 Marla'
      }
    ],
    active_property_id: null,
    active_option_number: null,
    conversation_summary: 'Customer is looking for a 5 Marla house in DHA Lahore under Rs. 2 crore.',
    customer_language: 'english_roman_urdu_mix',
    conversation_stage: 'property_options_shared',
    last_question_type: 'new_search',
    visit_preference: null,
    missing_info_requests: []
  },
  'lead-2': {
    id: 'mem-2',
    lead_id: 'lead-2',
    current_requirement: {
      city: 'Lahore',
      area: 'DHA Phase 6',
      area_group: 'DHA Lahore',
      property_type: 'House',
      size: '5 Marla',
      purpose: 'Sale',
      max_budget: '2 crore',
      bedrooms: null
    },
    last_matched_options: [
      {
        option_number: 1,
        property_id: 'prop-1',
        title: '5 Marla in DHA',
        price: 'Rs. 1.62 crore',
        size: '5 Marla'
      },
      {
        option_number: 2,
        property_id: 'prop-2',
        title: '5 Marla House in DHA Phase 6',
        price: 'Rs. 1.85 crore',
        size: '5 Marla'
      }
    ],
    active_property_id: 'prop-2',
    active_option_number: 2,
    conversation_summary: 'Customer wants a physical site visit of DHA Phase 6 house. Confirmed hot buyer.',
    customer_language: 'english_roman_urdu_mix',
    conversation_stage: 'visit_requested',
    last_question_type: 'visit_request',
    visit_preference: 'Sunday Evening',
    missing_info_requests: []
  },
  'lead-3': {
    id: 'mem-3',
    lead_id: 'lead-3',
    current_requirement: {
      city: null,
      area: null,
      area_group: null,
      property_type: null,
      size: null,
      purpose: null,
      max_budget: null,
      bedrooms: null
    },
    last_matched_options: [],
    active_property_id: null,
    active_option_number: null,
    conversation_summary: 'New customer contact, just joined chat.',
    customer_language: 'roman_urdu_mix',
    conversation_stage: 'initial_contact',
    last_question_type: null,
    visit_preference: null,
    missing_info_requests: []
  }
};

const SEED_CONVERSATIONS: ConversationMessage[] = [
  // Conversation with Zain
  {
    id: 'msg-1',
    lead_id: 'lead-1',
    sender: 'customer',
    message: 'Salam, 5 marla house DHA Lahore mein available hai under 2 crore?',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'msg-2',
    lead_id: 'lead-1',
    sender: 'agent_ai',
    message: `Walaikum Assalam Zain Sahib, I found 2 exact matching properties for your requirement: 5 Marla House in DHA Lahore under Rs. 2 crore.

Here are the available options:

Option 1:
🏠 Property: 5 Marla in DHA
📏 Size: 5 Marla
📍 Location: DHA Phase 6, Lahore
🏘 Area: DHA Phase 6
🏙 City: Lahore
🏷 Type: House
📌 Purpose: Sale
💰 Price: Rs. 1.62 crore
🛏 Bedrooms: 3
🛁 Bathrooms: 3
✅ Status: Available

Option 2:
🏠 Property: 5 Marla House in DHA Phase 6
📏 Size: 5 Marla
📍 Location: DHA Phase 6, Lahore
🏘 Area: DHA Phase 6
🏙 City: Lahore
🏷 Type: House
📌 Purpose: Sale
💰 Price: Rs. 1.85 crore
🛏 Bedrooms: 3
✅ Status: Available

These options match your requirement.

Would you like me to share details, pictures, map pin, or schedule a visit?`,
    created_at: new Date(Date.now() - 3600000 * 2.9).toISOString()
  },
  
  // Conversation with Hamza
  {
    id: 'msg-3',
    lead_id: 'lead-2',
    sender: 'customer',
    message: 'Hamza here, I saw options. Option 2 looks best. Is negotiation possible?',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'msg-4',
    lead_id: 'lead-2',
    sender: 'agent_ai',
    message: `Ji Hamza Sahib, Option 2 (5 Marla House in DHA Phase 6) ki demand Rs. 1.85 crore hai. Price par minor negotiation table talks ya meeting ke dauran check ho sakti hai owner se.

Aap kab visit schedule karna pasand karein ge takay main team aur owner ke sath coordinate karwa doon?`,
    created_at: new Date(Date.now() - 3600000 * 1.95).toISOString()
  },
  {
    id: 'msg-5',
    lead_id: 'lead-2',
    sender: 'customer',
    message: 'Ok, make location visit on Sunday evening. Also send map location.',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: 'msg-6',
    lead_id: 'lead-2',
    sender: 'agent_ai',
    message: `Ji Sir, perfect! Maine aap ki Sunday visit request record kar li hai. Hamari team aapse jald confirm kare gi details.

Yeh Option 2 ka Google Maps location pin hai:
📍 https://maps.google.com/?q=DHA+Phase+6+Lahore+Block+C

Location notes: Walking distance to the sports complex and commercial block.

Main Sunday ko aap ke liye coordinate karwa deta hoon. Office location/timing confirm kar doon?`,
    created_at: new Date(Date.now() - 3600000 * 1.45).toISOString()
  },

  // Conversation with Rizwan
  {
    id: 'msg-7',
    lead_id: 'lead-3',
    sender: 'customer',
    message: 'AOA, aap k pas DHA Lahore k plots details hain?',
    created_at: new Date(Date.now() - 1200000).toISOString()
  }
];

const SEED_FOLLOWUPS: FollowUp[] = [
  {
    id: 'fol-1',
    lead_id: 'lead-2',
    property_id: 'prop-2',
    follow_up_date: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow
    type: 'Site Visit',
    notes: 'Sunday Evening visit of 5 Marla house DHA Phase 6 Block C. Client Hamza requested. Share location notes.',
    status: 'Scheduled'
  },
  {
    id: 'fol-2',
    lead_id: 'lead-1',
    property_id: 'prop-1',
    follow_up_date: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    type: 'Call',
    notes: 'Initial requirement check. Zain is interested in DHA Phase 6 but of standard pricing under 1.8 crore.',
    status: 'Completed'
  }
];

class MemoryDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      // Ensure folder exists
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Error reading persistence DB, using defaults', e);
    }

    // Default seeded state
    const defaultData: DatabaseSchema = {
      agency: DEFAULT_AGENCY,
      properties: SEED_PROPERTIES,
      leads: SEED_LEADS,
      lead_ai_memory: SEED_MEMORIES,
      conversations: SEED_CONVERSATIONS,
      follow_ups: SEED_FOLLOWUPS
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(updatedData: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(updatedData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database state', e);
    }
  }

  public getAgency(): Agency {
    return this.data.agency;
  }

  public updateAgency(agencyPatch: Partial<Agency>): Agency {
    this.data.agency = { ...this.data.agency, ...agencyPatch };
    this.saveData(this.data);
    return this.data.agency;
  }

  public getProperties(): Property[] {
    return this.data.properties;
  }

  public addProperty(property: Omit<Property, 'id'>): Property {
    const newProp: Property = {
      ...property,
      id: `prop-${Date.now()}`
    };
    this.data.properties.push(newProp);
    this.saveData(this.data);
    return newProp;
  }

  public updateProperty(id: string, propertyPatch: Partial<Property>): Property {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.properties[idx] = { ...this.data.properties[idx], ...propertyPatch };
      this.saveData(this.data);
      return this.data.properties[idx];
    }
    throw new Error('Property not found');
  }

  public deleteProperty(id: string): boolean {
    const lengthBefore = this.data.properties.length;
    this.data.properties = this.data.properties.filter(p => p.id !== id);
    if (this.data.properties.length !== lengthBefore) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public getLeads(): Lead[] {
    return this.data.leads;
  }

  public addLead(lead: Omit<Lead, 'id'>): Lead {
    const leadId = `lead-${Date.now()}`;
    const newLead: Lead = {
      ...lead,
      id: leadId
    };
    this.data.leads.push(newLead);
    
    // Auto-create blank AI memory
    this.data.lead_ai_memory[leadId] = {
      id: `mem-${Date.now()}`,
      lead_id: leadId,
      current_requirement: {
        city: null,
        area: null,
        area_group: null,
        property_type: null,
        size: null,
        purpose: null,
        max_budget: null,
        bedrooms: null
      },
      last_matched_options: [],
      active_property_id: null,
      active_option_number: null,
      conversation_summary: 'New lead added manually.',
      customer_language: 'roman_urdu_mix',
      conversation_stage: 'initial_contact',
      last_question_type: null,
      visit_preference: null,
      missing_info_requests: []
    };

    // Add immediate welcoming conversation message
    this.data.conversations.push({
      id: `msg-${Date.now()}`,
      lead_id: leadId,
      sender: 'agent_ai',
      message: `Assalam-o-Alaikum Sir/Ma'am! Warm welcome to ${this.data.agency.name}. Main EstateAI Assistant hoon. Aap kis city aur location par property talash kar rahe hain?`,
      created_at: new Date().toISOString()
    });

    this.saveData(this.data);
    return newLead;
  }

  public updateLead(id: string, leadPatch: Partial<Lead>): Lead {
    const idx = this.data.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.leads[idx] = { ...this.data.leads[idx], ...leadPatch };
      this.saveData(this.data);
      return this.data.leads[idx];
    }
    throw new Error('Lead not found');
  }

  public getLeadMemory(leadId: string): LeadAIMemory {
    if (!this.data.lead_ai_memory[leadId]) {
      this.data.lead_ai_memory[leadId] = {
        id: `mem-${Date.now()}`,
        lead_id: leadId,
        current_requirement: {
          city: null,
          area: null,
          area_group: null,
          property_type: null,
          size: null,
          purpose: null,
          max_budget: null,
          bedrooms: null
        },
        last_matched_options: [],
        active_property_id: null,
        active_option_number: null,
        conversation_summary: 'AI Memory initialized.',
        customer_language: 'roman_urdu_mix',
        conversation_stage: 'initial_contact',
        last_question_type: null,
        visit_preference: null,
        missing_info_requests: []
      };
      this.saveData(this.data);
    }
    return this.data.lead_ai_memory[leadId];
  }

  public updateLeadMemory(leadId: string, memoryPatch: Partial<LeadAIMemory>): LeadAIMemory {
    const currentMemory = this.getLeadMemory(leadId);
    this.data.lead_ai_memory[leadId] = {
      ...currentMemory,
      ...memoryPatch,
      current_requirement: {
        ...currentMemory.current_requirement,
        ...(memoryPatch.current_requirement || {})
      },
      updated_at: new Date().toISOString()
    };
    this.saveData(this.data);
    return this.data.lead_ai_memory[leadId];
  }

  public getConversations(leadId: string): ConversationMessage[] {
    return this.data.conversations.filter(c => c.lead_id === leadId);
  }

  public addMessage(leadId: string, sender: 'customer' | 'agent_ai' | 'agent_manual', message: string, parsedIntent?: any): ConversationMessage {
    const newMsg: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lead_id: leadId,
      sender,
      message,
      parsed_intent: parsedIntent,
      created_at: new Date().toISOString()
    };
    this.data.conversations.push(newMsg);
    this.saveData(this.data);
    return newMsg;
  }

  public getFollowUps(): FollowUp[] {
    return this.data.follow_ups;
  }

  public addFollowUp(followUp: Omit<FollowUp, 'id'>): FollowUp {
    const newFollowUp: FollowUp = {
      ...followUp,
      id: `fol-${Date.now()}`
    };
    this.data.follow_ups.push(newFollowUp);
    this.saveData(this.data);
    return newFollowUp;
  }

  public updateFollowUp(id: string, followUpPatch: Partial<FollowUp>): FollowUp {
    const idx = this.data.follow_ups.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.data.follow_ups[idx] = { ...this.data.follow_ups[idx], ...followUpPatch };
      this.saveData(this.data);
      return this.data.follow_ups[idx];
    }
    throw new Error('Followup not found');
  }

  public deleteFollowUp(id: string): boolean {
    const before = this.data.follow_ups.length;
    this.data.follow_ups = this.data.follow_ups.filter(f => f.id !== id);
    if (this.data.follow_ups.length !== before) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }
}

export const dbStore = new MemoryDatabase();
