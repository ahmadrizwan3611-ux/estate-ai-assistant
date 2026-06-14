// Server-side database state and persistence manager
// Supports both Real Supabase Cloud DB and local db.json file-based fallback
// Location: /server/db.ts

import fs from 'fs';
import path from 'path';
import { 
  Agency, 
  Property, 
  Lead, 
  LeadAIMemory, 
  ConversationMessage, 
  FollowUp,
  AgencySiteSettings,
  SiteEvent,
  AgencyMember,
  WhatsAppConnection,
  SubscriptionPlan,
  AgencySubscription,
  UsageCounter,
  IntegrationCatalogItem,
  AgencyIntegration
} from '../src/types';
import { supabase, isSupabaseConfigured } from './supabase';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

interface DatabaseSchema {
  agency: Agency;
  properties: Property[];
  leads: Lead[];
  lead_ai_memory: Record<string, LeadAIMemory>; // keyed by lead_id
  conversations: ConversationMessage[];
  follow_ups: FollowUp[];
  agency_site_settings: AgencySiteSettings[];
  site_events: SiteEvent[];
  agency_members: AgencyMember[];
  whatsapp_connections: WhatsAppConnection[];
  subscription_plans: SubscriptionPlan[];
  agency_subscriptions: AgencySubscription[];
  usage_counters: UsageCounter[];
  integration_catalog: IntegrationCatalogItem[];
  agency_integrations: AgencyIntegration[];
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
    const defaultSiteSettings: AgencySiteSettings[] = [
      {
        id: 'site-settings-1',
        agency_id: 'agency-id-1',
        slug: 'pak-prime',
        public_name: 'EstateAI Premier Properties',
        hero_title: 'Find Your Golden Home in Pakistan',
        hero_subtitle: 'Authentic listings verified directly by professional agents. Zero third party noise.',
        about_text: 'We are Punjab and Islamabads premium modern real estate consulting group.',
        theme_id: 'classic_agency',
        primary_color: '#0d9488',
        whatsapp_number: '0300-1234567',
        is_published: true,
        featured_property_ids: ['prop-1', 'prop-2']
      }
    ];

    const defaultPlans: SubscriptionPlan[] = [
      { id: 'starter', name: 'Starter Package', price_monthly: 29.00, currency: 'USD', max_properties: 10, max_leads_per_month: 50, max_team_members: 1, max_ai_replies_per_month: 100, includes_website_builder: true, includes_whatsapp: false, includes_analytics: false, includes_custom_domain: false },
      { id: 'growth', name: 'Growth Agent Plus', price_monthly: 79.00, currency: 'USD', max_properties: 50, max_leads_per_month: 250, max_team_members: 3, max_ai_replies_per_month: 500, includes_website_builder: true, includes_whatsapp: true, includes_analytics: true, includes_custom_domain: false },
      { id: 'pro', name: 'Pro Workspace', price_monthly: 149.00, currency: 'USD', max_properties: 200, max_leads_per_month: 1000, max_team_members: 10, max_ai_replies_per_month: 2500, includes_website_builder: true, includes_whatsapp: true, includes_analytics: true, includes_custom_domain: true },
      { id: 'enterprise', name: 'Quantum Agency Limitless', price_monthly: 499.00, currency: 'USD', max_properties: 9999, max_leads_per_month: 99999, max_team_members: 999, max_ai_replies_per_month: 99999, includes_website_builder: true, includes_whatsapp: true, includes_analytics: true, includes_custom_domain: true }
    ];

    const defaultCatalog: IntegrationCatalogItem[] = [
      { id: 'whatsapp1', key: 'whatsapp', name: 'WhatsApp Business Manager', description: 'Connect official Meta WhatsApp numbers and automate continuity chats.', category: 'Messaging', icon: 'MessageSquareCode', is_active: true },
      { id: 'fb_leads1', key: 'fb_leads', name: 'Facebook Lead Pages Sync', description: 'Automate lead captures directly from Meta lead forms to CRM.', category: 'Marketing', icon: 'Facebook', is_active: true },
      { id: 'g_sheets1', key: 'g_sheets', name: 'Google Sheets Exporter', description: 'Instantly push updated client logs and listings directly to spreadsheets.', category: 'Files', icon: 'Database', is_active: true },
      { id: 'g_maps1', key: 'g_maps', name: 'Google Maps Premium', description: 'High resolution 3D map layouts with detailed commercial proximity markings.', category: 'Maps', icon: 'MapPin', is_active: true },
      { id: 'sms_gateway1', key: 'sms_gateway', name: 'SMS Portal Gateway', description: 'Ping automated notifications via SMS when new lists are shared.', category: 'Messaging', icon: 'Send', is_active: true },
      { id: 'csv_helper1', key: 'csv_helper', name: 'OLX & Zameen CSV Importer', description: 'Upload spreadsheets to sync catalog entries instantaneously on your portal.', category: 'Files', icon: 'FileSpreadsheet', is_active: true }
    ];

    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Backward-compatible migration triggers for existing db.json files
        if (!parsed.agency_site_settings || parsed.agency_site_settings.length === 0) parsed.agency_site_settings = defaultSiteSettings;
        if (!parsed.site_events) parsed.site_events = [];
        if (!parsed.agency_members || parsed.agency_members.length === 0) {
          parsed.agency_members = [
            { id: 'member-1', agency_id: 'agency-id-1', invited_email: 'ahmadrizwanar069543@gmail.com', name: 'Ahmad Rizwan', role: 'owner', status: 'active' }
          ];
        }
        if (!parsed.whatsapp_connections || parsed.whatsapp_connections.length === 0) {
          parsed.whatsapp_connections = [
            { id: 'wa-1', agency_id: 'agency-id-1', phone_number_id: '10984857263544', business_account_id: '8837465261', display_phone_number: '+92 300 1234567', access_token_placeholder: 'EAAGb...', webhook_verify_token: 'estateai_verify_token_secure', status: 'simulation_mode', auto_reply_enabled: true }
          ];
        }
        if (!parsed.subscription_plans || parsed.subscription_plans.length === 0) parsed.subscription_plans = defaultPlans;
        if (!parsed.agency_subscriptions || parsed.agency_subscriptions.length === 0) {
          parsed.agency_subscriptions = [
            { id: 'sub-1', agency_id: 'agency-id-1', plan_id: 'growth', status: 'trial', current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 86400000 * 30).toISOString(), trial_ends_at: new Date(Date.now() + 86400000 * 14).toISOString() }
          ];
        }
        if (!parsed.usage_counters || parsed.usage_counters.length === 0) {
          parsed.usage_counters = [
            { id: 'uc-1', agency_id: 'agency-id-1', month_key: '2026-06', leads_count: 5, ai_replies_count: 22, property_count_snapshot: 3 }
          ];
        }
        if (!parsed.integration_catalog || parsed.integration_catalog.length === 0) parsed.integration_catalog = defaultCatalog;
        if (!parsed.agency_integrations || parsed.agency_integrations.length === 0) {
          parsed.agency_integrations = [
            { id: 'ai-int-1', agency_id: 'agency-id-1', integration_key: 'whatsapp', status: 'simulation_mode', settings: {} },
            { id: 'ai-int-2', agency_id: 'agency-id-1', integration_key: 'csv_helper', status: 'simulation_mode', settings: {} }
          ];
        }

        // Keep properties view-counts initialized
        if (Array.isArray(parsed.properties)) {
          parsed.properties.forEach((p: any) => {
            if (p.view_count === undefined) p.view_count = 0;
          });
        }
        // Keep leads source initialized
        if (Array.isArray(parsed.leads)) {
          parsed.leads.forEach((l: any) => {
            if (!l.source) l.source = 'crm_panel';
          });
        }

        return parsed;
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
      follow_ups: SEED_FOLLOWUPS,
      agency_site_settings: defaultSiteSettings,
      site_events: [],
      agency_members: [
        { id: 'member-1', agency_id: 'agency-id-1', invited_email: 'ahmadrizwanar069543@gmail.com', name: 'Ahmad Rizwan', role: 'owner', status: 'active' }
      ],
      whatsapp_connections: [
        { id: 'wa-1', agency_id: 'agency-id-1', phone_number_id: '10984857263544', business_account_id: '8837465261', display_phone_number: '+92 300 1234567', access_token_placeholder: 'EAAGb...', webhook_verify_token: 'estateai_verify_token_secure', status: 'simulation_mode', auto_reply_enabled: true }
      ],
      subscription_plans: defaultPlans,
      agency_subscriptions: [
        { id: 'sub-1', agency_id: 'agency-id-1', plan_id: 'growth', status: 'trial', current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 86400000 * 30).toISOString(), trial_ends_at: new Date(Date.now() + 86400000 * 14).toISOString() }
      ],
      usage_counters: [
        { id: 'uc-1', agency_id: 'agency-id-1', month_key: '2026-06', leads_count: 5, ai_replies_count: 22, property_count_snapshot: 3 }
      ],
      integration_catalog: defaultCatalog,
      agency_integrations: [
        { id: 'ai-int-1', agency_id: 'agency-id-1', integration_key: 'whatsapp', status: 'simulation_mode', settings: {} },
        { id: 'ai-int-2', agency_id: 'agency-id-1', integration_key: 'csv_helper', status: 'simulation_mode', settings: {} }
      ]
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

  // ==========================================
  // NEW SaaS PORTAL PLATFORM ENGINE METHODS
  // ==========================================

  // --- WEBSITE SETTINGS ---
  public async getWebsiteSettings(): Promise<AgencySiteSettings> {
    if (supabase) {
      const { data, error } = await supabase.from('agency_site_settings').select('*').limit(1).maybeSingle();
      if (!error && data) return data;
    }
    if (!this.data.agency_site_settings || this.data.agency_site_settings.length === 0) {
      this.data.agency_site_settings = [{
        id: 'site-settings-1',
        agency_id: 'agency-id-1',
        slug: 'pak-prime',
        public_name: 'EstateAI Premier Properties',
        hero_title: 'Find Your Golden Home in Pakistan',
        hero_subtitle: 'Authentic listings verified directly by professional agents. Zero third party noise.',
        about_text: 'We are Punjab and Islamabads premium modern real estate consulting group.',
        theme_id: 'classic_agency',
        primary_color: '#0d9488',
        whatsapp_number: '0300-1234567',
        is_published: true,
        featured_property_ids: ['prop-1', 'prop-2']
      }];
      this.saveData(this.data);
    }
    return this.data.agency_site_settings[0];
  }

  public async updateWebsiteSettings(settingsPatch: Partial<AgencySiteSettings>): Promise<AgencySiteSettings> {
    if (supabase) {
      const current = await this.getWebsiteSettings();
      const { data, error } = await supabase
        .from('agency_site_settings')
        .update(settingsPatch)
        .eq('id', current.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const current = await this.getWebsiteSettings();
    const updated = { ...current, ...settingsPatch, updated_at: new Date().toISOString() };
    this.data.agency_site_settings[0] = updated;
    this.saveData(this.data);
    return updated;
  }

  public async getWebsiteSettingsBySlug(slug: string): Promise<(AgencySiteSettings & { agency: Agency; properties: Property[] }) | null> {
    const rawSettings = this.data.agency_site_settings.find(s => s.slug === slug);
    if (!rawSettings) return null;
    const agency = this.data.agency;
    const properties = this.data.properties;
    return {
      ...rawSettings,
      agency,
      properties
    };
  }

  // --- SITE EVENTS / ANALYTICS ---
  public async getSiteEvents(): Promise<SiteEvent[]> {
    if (supabase) {
      const { data, error } = await supabase.from('site_events').select('*');
      if (!error && data) return data;
    }
    return this.data.site_events || [];
  }

  public async addSiteEvent(event: Omit<SiteEvent, 'id'>): Promise<SiteEvent> {
    if (event.event_type === 'property_view' && event.property_id) {
      await this.incrementPropertyViewCount(event.property_id);
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('site_events')
        .insert({
          agency_id: event.agency_id || 'agency-id-1',
          event_type: event.event_type,
          property_id: event.property_id || null,
          lead_id: event.lead_id || null,
          path: event.path,
          visitor_id: event.visitor_id || null,
          metadata: event.metadata || {}
        })
        .select()
        .single();
      if (!error && data) return data;
    }
    const newEvent: SiteEvent = {
      ...event,
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };
    if (!this.data.site_events) this.data.site_events = [];
    this.data.site_events.push(newEvent);
    this.saveData(this.data);
    return newEvent;
  }

  private async incrementPropertyViewCount(propertyId: string) {
    const properties = this.data.properties;
    const p = properties.find(prop => prop.id === propertyId);
    if (p) {
      p.view_count = (p.view_count || 0) + 1;
      this.saveData(this.data);
    }
    if (supabase) {
      const currentView = p ? p.view_count : 1;
      await supabase.from('properties').update({ view_count: currentView }).eq('id', propertyId);
    }
  }

  // --- TEAM MEMBERS ---
  public async getTeamMembers(): Promise<AgencyMember[]> {
    if (supabase) {
      const { data, error } = await supabase.from('agency_members').select('*');
      if (!error && data) return data;
    }
    return this.data.agency_members || [];
  }

  public async addTeamMember(member: Omit<AgencyMember, 'id'>): Promise<AgencyMember> {
    if (supabase) {
      const { data, error } = await supabase
        .from('agency_members')
        .insert({
          agency_id: member.agency_id || 'agency-id-1',
          invited_email: member.invited_email,
          name: member.name,
          role: member.role || 'agent',
          status: member.status || 'invited'
        })
        .select()
        .single();
      if (!error && data) return data;
    }
    const newMember: AgencyMember = {
      ...member,
      id: `mem-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!this.data.agency_members) this.data.agency_members = [];
    this.data.agency_members.push(newMember);
    this.saveData(this.data);
    return newMember;
  }

  public async updateTeamMember(id: string, patch: Partial<AgencyMember>): Promise<AgencyMember> {
    if (supabase) {
      const { data, error } = await supabase
        .from('agency_members')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    if (!this.data.agency_members) this.data.agency_members = [];
    const idx = this.data.agency_members.findIndex(m => m.id === id);
    if (idx !== -1) {
      const updated = { ...this.data.agency_members[idx], ...patch, updated_at: new Date().toISOString() };
      this.data.agency_members[idx] = updated;
      this.saveData(this.data);
      return updated;
    }
    throw new Error('Team member not found');
  }

  public async deleteTeamMember(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('agency_members').delete().eq('id', id);
      if (!error) return true;
    }
    if (!this.data.agency_members) this.data.agency_members = [];
    const before = this.data.agency_members.length;
    this.data.agency_members = this.data.agency_members.filter(m => m.id !== id);
    if (this.data.agency_members.length !== before) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- WHATSAPP CONFIGS ---
  public async getWhatsAppSettings(): Promise<WhatsAppConnection> {
    if (supabase) {
      const { data, error } = await supabase.from('whatsapp_connections').select('*').limit(1).maybeSingle();
      if (!error && data) return data;
    }
    if (!this.data.whatsapp_connections || this.data.whatsapp_connections.length === 0) {
      this.data.whatsapp_connections = [{
        id: 'wa-1',
        agency_id: 'agency-id-1',
        phone_number_id: '10984857263544',
        business_account_id: '8837465261',
        display_phone_number: '+92 300 1234567',
        access_token_placeholder: 'EAAGb... (Meta Setup Access Token Key)',
        webhook_verify_token: 'estateai_verify_token_secure',
        status: 'simulation_mode',
        auto_reply_enabled: true
      }];
      this.saveData(this.data);
    }
    return this.data.whatsapp_connections[0];
  }

  public async updateWhatsAppSettings(patch: Partial<WhatsAppConnection>): Promise<WhatsAppConnection> {
    if (supabase) {
      const current = await this.getWhatsAppSettings();
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .update(patch)
        .eq('id', current.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const current = await this.getWhatsAppSettings();
    const updated = { ...current, ...patch, updated_at: new Date().toISOString() };
    this.data.whatsapp_connections[0] = updated;
    this.saveData(this.data);
    return updated;
  }

  // --- BILLING / SUBSCRIPTIONS ---
  public async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.data.subscription_plans || [];
  }

  public async getAgencySubscription(): Promise<AgencySubscription> {
    if (supabase) {
      const { data, error } = await supabase.from('agency_subscriptions').select('*').limit(1).maybeSingle();
      if (!error && data) return data;
    }
    if (!this.data.agency_subscriptions || this.data.agency_subscriptions.length === 0) {
      this.data.agency_subscriptions = [{
        id: 'sub-1',
        agency_id: 'agency-id-1',
        plan_id: 'growth',
        status: 'trial',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 86400000 * 30).toISOString(),
        trial_ends_at: new Date(Date.now() + 86400000 * 14).toISOString()
      }];
      this.saveData(this.data);
    }
    return this.data.agency_subscriptions[0];
  }

  public async updateAgencySubscription(planId: string): Promise<AgencySubscription> {
    if (supabase) {
      const current = await this.getAgencySubscription();
      const { data, error } = await supabase
        .from('agency_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 86400000 * 30).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', current.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const current = await this.getAgencySubscription();
    const updated: AgencySubscription = {
      ...current,
      plan_id: planId,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.agency_subscriptions[0] = updated;
    this.saveData(this.data);
    return updated;
  }

  public async getUsageCounters(): Promise<UsageCounter> {
    if (supabase) {
      const { data, error } = await supabase.from('usage_counters').select('*').eq('month_key', '2026-06').maybeSingle();
      if (!error && data) return data;
    }
    if (!this.data.usage_counters || this.data.usage_counters.length === 0) {
      this.data.usage_counters = [{
        id: 'uc-1',
        agency_id: 'agency-id-1',
        month_key: '2026-06',
        leads_count: 5,
        ai_replies_count: 22,
        property_count_snapshot: this.data.properties.length
      }];
      this.saveData(this.data);
    }
    this.data.usage_counters[0].property_count_snapshot = this.data.properties.length;
    this.data.usage_counters[0].leads_count = this.data.leads.length;
    return this.data.usage_counters[0];
  }

  public async incrementAICounter(): Promise<void> {
    const uc = await this.getUsageCounters();
    uc.ai_replies_count += 1;
    this.saveData(this.data);
    if (supabase) {
      await supabase.from('usage_counters').update({ ai_replies_count: uc.ai_replies_count }).eq('id', uc.id);
    }
  }

  // --- INTEGRATIONS ---
  public async getIntegrationsCatalog(): Promise<IntegrationCatalogItem[]> {
    return this.data.integration_catalog || [];
  }

  public async getAgencyIntegrations(): Promise<AgencyIntegration[]> {
    if (supabase) {
      const { data, error } = await supabase.from('agency_integrations').select('*');
      if (!error && data) return data;
    }
    return this.data.agency_integrations || [];
  }

  public async updateAgencyIntegration(integrationKey: string, status: 'connected' | 'not_connected' | 'simulation_mode', settings: any): Promise<AgencyIntegration> {
    if (supabase) {
      const { data, error } = await supabase
        .from('agency_integrations')
        .upsert({
          agency_id: 'agency-id-1',
          integration_key: integrationKey,
          status,
          settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (!error && data) return data;
    }
    
    if (!this.data.agency_integrations) this.data.agency_integrations = [];
    const idx = this.data.agency_integrations.findIndex(i => i.integration_key === integrationKey);
    if (idx !== -1) {
      this.data.agency_integrations[idx] = {
        ...this.data.agency_integrations[idx],
        status,
        settings,
        updated_at: new Date().toISOString()
      };
      this.saveData(this.data);
      return this.data.agency_integrations[idx];
    } else {
      const newInt: AgencyIntegration = {
        id: `ai-int-${Date.now()}`,
        agency_id: 'agency-id-1',
        integration_key: integrationKey,
        status,
        settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.agency_integrations.push(newInt);
      this.saveData(this.data);
      return newInt;
    }
  }
}

export const dbStore = new MemoryDatabase();
