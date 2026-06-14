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
  view_count?: number;
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
  source?: string;
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

// ==========================================
// 7 NEW PLATFORM SaaS MODULES FOUNDATIONS
// ==========================================

export interface AgencySiteSettings {
  id: string;
  agency_id: string;
  slug: string;
  public_name: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  theme_id: 'classic_agency' | 'luxury_dark' | 'modern_clean';
  primary_color: string;
  whatsapp_number: string;
  is_published: boolean;
  featured_property_ids: string[]; // JSON array
  created_at?: string;
  updated_at?: string;
}

export type SiteEventType = 'site_view' | 'property_view' | 'inquiry_submitted' | 'whatsapp_click' | 'visit_request' | 'search_used';

export interface SiteEvent {
  id: string;
  agency_id: string;
  event_type: SiteEventType;
  property_id?: string | null;
  lead_id?: string | null;
  path: string;
  visitor_id?: string | null;
  metadata?: any;
  created_at?: string;
}

export type MemberRole = 'owner' | 'manager' | 'agent' | 'viewer';
export type MemberStatus = 'invited' | 'active';

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id?: string | null;
  invited_email: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppConnection {
  id: string;
  agency_id: string;
  phone_number_id?: string;
  business_account_id?: string;
  display_phone_number?: string;
  access_token_placeholder?: string;
  webhook_verify_token?: string;
  status: 'disconnected' | 'connected' | 'simulation_mode';
  auto_reply_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  currency: string;
  max_properties: number;
  max_leads_per_month: number;
  max_team_members: number;
  max_ai_replies_per_month: number;
  includes_website_builder: boolean;
  includes_whatsapp: boolean;
  includes_analytics: boolean;
  includes_custom_domain: boolean;
  created_at?: string;
}

export interface AgencySubscription {
  id: string;
  agency_id: string;
  plan_id: string;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsageCounter {
  id: string;
  agency_id: string;
  month_key: string; // e.g., "2026-06"
  leads_count: number;
  ai_replies_count: number;
  property_count_snapshot: number;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationCatalogItem {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
}

export interface AgencyIntegration {
  id: string;
  agency_id: string;
  integration_key: string;
  status: 'not_connected' | 'connected' | 'simulation_mode';
  settings: any;
  created_at?: string;
  updated_at?: string;
}

