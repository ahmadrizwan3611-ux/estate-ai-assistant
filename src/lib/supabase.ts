// Supabase client integration with local fallback support
// Location: /src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined';
};

// Create client only if configuration variables are actually filled in UI/env
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Robust services handling BOTH Supabase Mode and local REST API Fallback
 */

export interface UserSession {
  email: string;
  agencyName: string;
  agencyId: string;
  token?: string;
}

export const authService = {
  async signUp(email: string, password: string, agencyName: string): Promise<UserSession> {
    if (supabase) {
      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed.');

      // 2. Check or create Agency entry linked to this user
      // We also save agency name and owner_email details
      const agencyId = authData.user.id; // Using auth user ID as Agency ID for simplicity and direct mapping
      
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .upsert({
          id: agencyId,
          name: agencyName,
          owner_email: email,
          tone_preference: 'roman_urdu_mix',
          ai_model_setting: 'llama-3.3-70b-versatile'
        })
        .select()
        .single();

      if (agencyError) {
        console.warn('Error inserting agency workspace, might exist or RLS triggered:', agencyError);
      }

      // Pre-seed some default properties/leads for this new agency if brand new
      try {
        await seedNewAgencyData(agencyId);
      } catch (e) {
        console.error('Data seeding skipped / failed:', e);
      }

      return {
        email: authData.user.email || email,
        agencyName: agencyData?.name || agencyName,
        agencyId: agencyId,
        token: authData.session?.access_token,
      };
    } else {
      // Local fallback sign up (triggers server agency creation/update cache)
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agencyName, owner_email: email })
      });
      const agency = await res.json();
      return {
        email,
        agencyName: agency.name || agencyName,
        agencyId: agency.id || 'agency-id-1',
      };
    }
  },

  async signIn(email: string, password: string): Promise<UserSession> {
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Invalid email or password.');

      // Fetch corresponding Agency details
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('name, id')
        .eq('id', authData.user.id)
        .maybeSingle();

      return {
        email: authData.user.email || email,
        agencyName: agencyData?.name || 'Pak-Prime Realty',
        agencyId: authData.user.id,
        token: authData.session?.access_token,
      };
    } else {
      // Local fallback workspace lookup
      const res = await fetch('/api/agency');
      const agencyDetail = await res.json();
      return {
        email,
        agencyName: agencyDetail.name || 'Pak-Prime Realty',
        agencyId: agencyDetail.id || 'agency-id-1',
      };
    }
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
};

/**
 * Seeding handler to populate private table schemas with high fidelity mock options upon sign-up 
 */
async function seedNewAgencyData(agencyId: string) {
  if (!supabase) return;

  // Check if properties already exist
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('agency_id', agencyId)
    .limit(1);

  if (existing && existing.length > 0) return; // already has data

  // Seed standard Pakistani properties
  await supabase.from('properties').insert([
    {
      agency_id: agencyId,
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
      description: 'Brand new 5 Marla house available for sale in DHA Phase 6 Lahore.',
      status: 'Available',
      image_urls: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
      map_pin: 'https://maps.google.com/?q=DHA+Phase+6+Lahore'
    },
    {
      agency_id: agencyId,
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
      description: 'Brand new double story 5 Marla luxury villa.',
      status: 'Available',
      image_urls: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'],
      map_pin: 'https://maps.google.com/?q=DHA+Phase+6+Lahore+Block+C'
    },
    {
      agency_id: agencyId,
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
      image_urls: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80']
    }
  ]);

  // Seed default Leads
  const { data: insertedLeads } = await supabase.from('leads').insert([
    {
      agency_id: agencyId,
      name: 'Ahmed Ali',
      phone: '0300-1234567',
      email: 'ahmed@paksas.com',
      status: 'Warm',
      requirement_notes: 'Looking for 5 Marla in DHA Phase 6 under 2 crore.'
    }
  ]).select();

  // If lead created, set initial memory
  if (insertedLeads && insertedLeads[0]) {
    const leadId = insertedLeads[0].id;
    await supabase.from('lead_ai_memory').insert({
      lead_id: leadId,
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
      last_matched_options: [],
      active_property_id: null,
      active_option_number: null,
      conversation_summary: 'New customer signed via portal.',
      customer_language: 'roman_urdu_mix',
      conversation_stage: 'initial_contact',
      last_question_type: null,
      visit_preference: null,
      missing_info_requests: []
    });

    await supabase.from('conversations').insert({
      lead_id: leadId,
      sender: 'agent_ai',
      message: 'Assalam-o-Alaikum Sir! Main EstateAI Smart Continuity assistant hoon. Aap kis tarah ki properties check karna chahte hain?'
    });
  }
}
