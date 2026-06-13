// TypeScript Types for EstateAI Assistant
// Location: /src/types.ts

export type TonePreference = 'roman_urdu_mix' | 'pure_english' | 'pure_roman_urdu' | 'urdu_script';

export interface Agency {
  id: string;
  name: string;
  owner_email: string;
  phone?: string;
  logo_url?: string;
  tone_preference: TonePreference;
  ai_model_setting: string;
  created_at?: string;
}

export type PropertyStatus = 'Available' | 'Sold' | 'Under Offer';

export interface Property {
  id: string;
  agency_id?: string;
  title: string;
  size: string; // Keep string size exact, e.g. "5 Marla"
  city: string; // Lahore, Islamabad, etc.
  area: string; // DHA Phase 6, Bahria Town, etc.
  type: string; // House, Plot, Commercial, Apartment
  purpose: 'Sale' | 'Rent';
  price: number; // e.g. 18500000
  price_display: string; // e.g. "Rs. 1.85 crore"
  bedrooms?: number;
  bathrooms?: number;
  furnished_status?: string; // Furnished, Semi-Furnished, Unfurnished
  description?: string;
  status: PropertyStatus;
  image_urls: string[];
  video_url?: string;
  map_pin?: string;
  latitude?: number;
  longitude?: number;
  location_notes?: string;
  created_at?: string;
}

export type LeadStatus = 'New' | 'Hot' | 'Warm' | 'Cold' | 'Closed';

export interface Lead {
  id: string;
  agency_id?: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  requirement_notes?: string;
  created_at?: string;
}

export interface PropertyRequirement {
  city: string | null;
  area: string | null;
  area_group: string | null; // e.g. "DHA Lahore"
  property_type: string | null; // e.g. "House"
  size: string | null; // e.g. "5 Marla"
  purpose: 'Sale' | 'Rent' | null;
  max_budget: string | null; // e.g. "2 crore"
  bedrooms: number | null;
}

export interface MatchedOptionSummary {
  option_number: number;
  property_id: string;
  title: string;
  price: string;
  size: string;
}

export interface LeadAIMemory {
  id: string;
  lead_id: string;
  current_requirement: PropertyRequirement;
  last_matched_options: MatchedOptionSummary[];
  active_property_id: string | null;
  active_option_number: number | null;
  conversation_summary: string | null;
  customer_language: string;
  conversation_stage: string; // 'initial_contact' | 'property_options_shared' | 'visit_requested' | 'closed'
  last_question_type: string | null;
  visit_preference: string | null;
  missing_info_requests: string[];
  updated_at?: string;
}

export interface ConversationMessage {
  id: string;
  lead_id: string;
  sender: 'customer' | 'agent_ai' | 'agent_manual';
  message: string;
  parsed_intent?: any;
  created_at?: string;
}

export type FollowUpStatus = 'Scheduled' | 'Completed' | 'Missed';

export interface FollowUp {
  id: string;
  lead_id: string;
  lead_name?: string; // populated client-side
  property_id?: string;
  property_title?: string; // populated client-side
  follow_up_date: string;
  type: 'Call' | 'Site Visit' | 'WhatsApp Followup';
  notes?: string;
  status: FollowUpStatus;
  created_at?: string;
}

// AI brain parser output
export interface ParsedAIIntent {
  message_type: 'new_search' | 'follow_up' | 'option_question' | 'visit_request' | 'picture_request' | 'map_request' | 'negotiation' | 'missing_detail_question' | 'unrelated';
  selected_option_number: number | null;
  selected_price: string | null;
  is_new_requirement: boolean;
  customer_intent_summary: string;
  requirement_patch: {
    city: string | null;
    area: string | null;
    size: string | null;
    property_type: string | null;
    purpose: 'Sale' | 'Rent' | null;
    max_budget: string | null;
  };
  question_type: string | null;
  language: string;
  lead_status: LeadStatus;
}
