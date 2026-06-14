// Server-side database state and persistence manager
// Supports both Real Supabase Cloud DB and local db.json file-based fallback
// Location: /server/db.ts

import fs from 'fs';
import path from 'path';
import { Agency, Property, Lead, LeadAIMemory, ConversationMessage, FollowUp } from '../src/types';
import { supabase, isSupabaseConfigured } from './supabase';

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
  if (value < 1000) {
    return value * 10000000;
  }
  return value;
}

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
    size: '5 Marla',
    city: 'Lahore',
    area: 'DHA Phase 6',
    type: 'House',
    purpose: 'Sale',
    price: 16200000,
    price_display: 'Rs. 1.62 crore',
    bedrooms: 3,
    bathrooms: 3,
    furnished_status: 'Semi-Furnished',
    description: 'Outstanding brand new 5 Marla house available for sale in DHA Phase 6 Lahore.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: '',
    map_pin: 'https://maps.google.com/?q=DHA+Phase+6+Lahore',
    latitude: 31.4697,
    longitude: 74.4485,
    location_notes: 'Excellent approach near Phase 6 Boulevard and sports park.'
  },
  {
    id: 'prop-2',
    agency_id: 'agency-id-1',
    title: '5 Marla House in DHA Phase 6',
    size: '5 Marla',
    city: 'Lahore',
    area: 'DHA Phase 6 Block C',
    type: 'House',
    purpose: 'Sale',
    price: 18500000,
    price_display: 'Rs. 1.85 crore',
    bedrooms: 3,
    bathrooms: 4,
    furnished_status: 'Completed Brand New',
    description: 'High-end luxury brand new double story 5 Marla house in DHA Phase 6 Lahore.',
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
    description: 'Executive standard double story 10 Marla house in Bahria Town, Lahore.',
    status: 'Available',
    image_urls: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
    ],
    video_url: '',
    map_pin: 'https://maps.google.com/?q=Bahria+Town+Lahore',
    latitude: 31.3685,
    longitude: 74.1950,
    location_notes: 'Located in a secure residential block with 24/7 power backup.'
  }
];

const SEED_LEADS: Lead[] = [
  {
    id: 'lead-1',
    agency_id: 'agency-id-1',
    name: 'Ahmed Ali',
    phone: '0300-1234567',
    email: 'ahmed@example.com',
    status: 'Warm',
    requirement_notes: 'Looking for a 5 Marla home in DHA Lahore under 2 crore.'
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
  }
};

const SEED_CONVERSATIONS: ConversationMessage[] = [
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
    message: `Walaikum Assalam Ahmed Sahib, I found 2 exact matching properties for your requirement: 5 Marla House in DHA Lahore under Rs. 2 crore.

Here are the available options:

Option 1:
🏠 Property: 5 Marla in DHA
📏 Size: 5 Marla
📍 Location: DHA Phase 6, Lahore
💰 Price: Rs. 1.62 crore
🛏 Bedrooms: 3
🛁 Bathrooms: 3
✅ Status: Available

Option 2:
🏠 Property: 5 Marla House in DHA Phase 6
📏 Size: 5 Marla
📍 Location: DHA Phase 6, Lahore
💰 Price: Rs. 1.85 crore
🛏 Bedrooms: 3
✅ Status: Available

Would you like me to share details, pictures, map pin, or schedule a physical visit?`,
    created_at: new Date(Date.now() - 3600000 * 2.9).toISOString()
  }
];

const SEED_FOLLOWUPS: FollowUp[] = [];

class MemoryDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
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

  // --- AGENCY ---
  public async getAgency(): Promise<Agency> {
    if (supabase) {
      // Return workspace details based on user
      const { data, error } = await supabase.from('agencies').select('*').limit(1).maybeSingle();
      if (data) return data;
    }
    return this.data.agency;
  }

  public async updateAgency(agencyPatch: Partial<Agency>): Promise<Agency> {
    if (supabase) {
      const current = await this.getAgency();
      const { data, error } = await supabase
        .from('agencies')
        .update(agencyPatch)
        .eq('id', current.id)
        .select()
        .single();
      if (!error && data) return data;
    }

    this.data.agency = { ...this.data.agency, ...agencyPatch };
    this.saveData(this.data);
    return this.data.agency;
  }

  // --- PROPERTIES ---
  public async getProperties(): Promise<Property[]> {
    if (supabase) {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error && data) return data;
    }
    return this.data.properties;
  }

  public async addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    if (supabase) {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...property,
          image_urls: property.image_urls || []
        })
        .select()
        .single();
      if (!error && data) return data;
      else {
        console.error('Error inserting property to Supabase:', error);
      }
    }

    const newProp: Property = {
      ...property,
      id: `prop-${Date.now()}`
    };
    this.data.properties.push(newProp);
    this.saveData(this.data);
    return newProp;
  }

  public async updateProperty(id: string, propertyPatch: Partial<Property>): Promise<Property> {
    if (supabase) {
      const { data, error } = await supabase
        .from('properties')
        .update(propertyPatch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }

    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.properties[idx] = { ...this.data.properties[idx], ...propertyPatch };
      this.saveData(this.data);
      return this.data.properties[idx];
    }
    throw new Error('Property not found');
  }

  public async deleteProperty(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (!error) return true;
    }

    const lengthBefore = this.data.properties.length;
    this.data.properties = this.data.properties.filter(p => p.id !== id);
    if (this.data.properties.length !== lengthBefore) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- LEADS ---
  public async getLeads(): Promise<Lead[]> {
    if (supabase) {
      const { data, error } = await supabase.from('leads').select('*');
      if (!error && data) return data;
    }
    return this.data.leads;
  }

  public async addLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
    const freshId = `lead-${Date.now()}`;
    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          status: lead.status || 'New',
          requirement_notes: lead.requirement_notes || ''
        })
        .select()
        .single();
        
      if (!error && data) {
        // Also auto initialize raw memory and conversation
        await supabase.from('lead_ai_memory').insert({
          lead_id: data.id,
          current_requirement: {
            city: null,
            area: null,
            area_group: null,
            property_type: null,
            size: null,
            purpose: null,
            max_budget: null
          }
        });

        await supabase.from('conversations').insert({
          lead_id: data.id,
          sender: 'agent_ai',
          message: `Assalam-o-Alaikum Sir/Ma'am! Warm welcome. Main EstateAI Continuity expert assistant hoon. Aap kis city aur location par property talash kar rahe hain?`
        });

        return data;
      } else {
        console.error('Failed to create lead in Supabase:', error);
      }
    }

    const newLead: Lead = {
      ...lead,
      id: freshId
    };
    this.data.leads.push(newLead);
    
    // Auto-create blank AI memory
    this.data.lead_ai_memory[freshId] = {
      id: `mem-${Date.now()}`,
      lead_id: freshId,
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
      lead_id: freshId,
      sender: 'agent_ai',
      message: `Assalam-o-Alaikum Sir/Ma'am! Warm welcome. Main EstateAI Continuity expert assistant hoon. Aap kis city aur location par property talash kar rahe hain?`,
      created_at: new Date().toISOString()
    });

    this.saveData(this.data);
    return newLead;
  }

  public async updateLead(id: string, leadPatch: Partial<Lead>): Promise<Lead> {
    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .update(leadPatch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }

    const idx = this.data.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.leads[idx] = { ...this.data.leads[idx], ...leadPatch };
      this.saveData(this.data);
      return this.data.leads[idx];
    }
    throw new Error('Lead not found');
  }

  // --- MEMORY ---
  public async getLeadMemory(leadId: string): Promise<LeadAIMemory> {
    if (supabase) {
      const { data, error } = await supabase
        .from('lead_ai_memory')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      if (!error && data) return data;
    }

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

  public async updateLeadMemory(leadId: string, memoryPatch: Partial<LeadAIMemory>): Promise<LeadAIMemory> {
    if (supabase) {
      const current = await this.getLeadMemory(leadId);
      const requirementMerged = {
        ...current.current_requirement,
        ...(memoryPatch.current_requirement || {})
      };
      const writeMemory = {
        ...current,
        ...memoryPatch,
        current_requirement: requirementMerged
      };
      
      const { data, error } = await supabase
        .from('lead_ai_memory')
        .upsert(writeMemory)
        .select()
        .single();
      if (!error && data) return data;
    }

    const currentMemory = await this.getLeadMemory(leadId);
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

  // --- CONVERSATIONS ---
  public async getConversations(leadId: string): Promise<ConversationMessage[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return this.data.conversations.filter(c => c.lead_id === leadId);
  }

  public async addMessage(leadId: string, sender: 'customer' | 'agent_ai' | 'agent_manual', message: string, parsedIntent?: any): Promise<ConversationMessage> {
    if (supabase) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          lead_id: leadId,
          sender,
          message,
          parsed_intent: parsedIntent
        })
        .select()
        .single();
      if (!error && data) return data;
    }

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

  // --- FOLLOW-UPS ---
  public async getFollowUps(): Promise<FollowUp[]> {
    if (supabase) {
      const { data, error } = await supabase.from('follow_ups').select('*');
      if (!error && data) return data;
    }
    return this.data.follow_ups;
  }

  public async addFollowUp(followUp: Omit<FollowUp, 'id'>): Promise<FollowUp> {
    if (supabase) {
      const { data, error } = await supabase
        .from('follow_ups')
        .insert({
          lead_id: followUp.lead_id,
          property_id: followUp.property_id || null,
          follow_up_date: followUp.follow_up_date,
          type: followUp.type,
          notes: followUp.notes,
          status: followUp.status || 'Scheduled'
        })
        .select()
        .single();
      if (!error && data) return data;
    }

    const newFollowUp: FollowUp = {
      ...followUp,
      id: `fol-${Date.now()}`
    };
    this.data.follow_ups.push(newFollowUp);
    this.saveData(this.data);
    return newFollowUp;
  }

  public async updateFollowUp(id: string, followUpPatch: Partial<FollowUp>): Promise<FollowUp> {
    if (supabase) {
      const { data, error } = await supabase
        .from('follow_ups')
        .update(followUpPatch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }

    const idx = this.data.follow_ups.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.data.follow_ups[idx] = { ...this.data.follow_ups[idx], ...followUpPatch };
      this.saveData(this.data);
      return this.data.follow_ups[idx];
    }
    throw new Error('Followup not found');
  }

  public async deleteFollowUp(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('follow_ups').delete().eq('id', id);
      if (!error) return true;
    }

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
