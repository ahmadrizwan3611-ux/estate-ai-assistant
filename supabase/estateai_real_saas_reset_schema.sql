-- ESTATEAI FULL-STACK PLATFORM RESET SCHEMA
-- Location: /supabase/estateai_real_saas_reset_schema.sql
-- Combined CRM core, Continuity tables, and SaaS portals structures cleanly.

DROP TABLE IF EXISTS agency_integrations CASCADE;
DROP TABLE IF EXISTS integration_catalog CASCADE;
DROP TABLE IF EXISTS usage_counters CASCADE;
DROP TABLE IF EXISTS agency_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS whatsapp_connections CASCADE;
DROP TABLE IF EXISTS agency_members CASCADE;
DROP TABLE IF EXISTS site_events CASCADE;
DROP TABLE IF EXISTS agency_site_settings CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS lead_ai_memory CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- 1. Create Agencies Table
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    logo_url VARCHAR(500),
    tone_preference VARCHAR(100) DEFAULT 'roman_urdu_mix',
    ai_model_setting VARCHAR(100) DEFAULT 'llama-3.3-70b-versatile',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Properties Table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    price_display VARCHAR(100) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    furnished_status VARCHAR(100),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    image_urls TEXT[],
    video_url VARCHAR(500),
    map_pin VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_notes TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'New',
    requirement_notes TEXT,
    source VARCHAR(100) DEFAULT 'crm_panel',
    assigned_member_id UUID,
    interested_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Lead AI Memory Table
CREATE TABLE lead_ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    current_requirement JSONB DEFAULT '{
        "city": null,
        "area": null,
        "area_group": null,
        "property_type": null,
        "size": null,
        "purpose": null,
        "max_budget": null,
        "bedrooms": null
    }'::jsonb,
    last_matched_options JSONB DEFAULT '[]'::jsonb,
    active_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    active_option_number INTEGER,
    conversation_summary TEXT,
    customer_language VARCHAR(50) DEFAULT 'roman_urdu_mix',
    conversation_stage VARCHAR(100) DEFAULT 'initial_contact',
    last_question_type VARCHAR(100),
    visit_preference VARCHAR(255),
    missing_info_requests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    parsed_intent JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Follow-ups Table
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    follow_up_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Agency Site Settings Table
CREATE TABLE agency_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    public_name VARCHAR(255) NOT NULL,
    hero_title VARCHAR(255),
    hero_subtitle VARCHAR(255),
    about_text TEXT,
    theme_id VARCHAR(50) DEFAULT 'classic_agency',
    primary_color VARCHAR(50) DEFAULT '#0d9488',
    whatsapp_number VARCHAR(50),
    is_published BOOLEAN DEFAULT FALSE,
    featured_property_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Site Events Table
CREATE TABLE site_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    path VARCHAR(500) NOT NULL,
    visitor_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Agency Team Members Table
CREATE TABLE agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID,
    invited_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'agent',
    status VARCHAR(50) NOT NULL DEFAULT 'invited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create WhatsApp Connections Table
CREATE TABLE whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(255),
    business_account_id VARCHAR(255),
    display_phone_number VARCHAR(100),
    access_token_placeholder TEXT,
    webhook_verify_token VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    auto_reply_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create Subscription Plans Catalog
CREATE TABLE subscription_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    max_properties INTEGER NOT NULL,
    max_leads_per_month INTEGER NOT NULL,
    max_team_members INTEGER NOT NULL,
    max_ai_replies_per_month INTEGER NOT NULL,
    includes_website_builder BOOLEAN DEFAULT FALSE,
    includes_whatsapp BOOLEAN DEFAULT FALSE,
    includes_analytics BOOLEAN DEFAULT FALSE,
    includes_custom_domain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Create Agency Subscriptions Table
CREATE TABLE agency_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    plan_id VARCHAR(100) REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'trial',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Create Usage Counters Table
CREATE TABLE usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    month_key VARCHAR(10) NOT NULL,
    leads_count INTEGER DEFAULT 0,
    ai_replies_count INTEGER DEFAULT 0,
    property_count_snapshot INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agency_id, month_key)
);

-- 14. Create Integration Catalog Table
CREATE TABLE integration_catalog (
    id VARCHAR(100) PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Create Agency Integrations Config Table
CREATE TABLE agency_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    integration_key VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_connected',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agency_id, integration_key)
);

-- INDEXES for supreme read and write operation throughputs
CREATE INDEX idx_properties_city_area ON properties(city, area);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_follow_ups_date ON follow_ups(follow_up_date);
CREATE INDEX idx_site_settings_slug ON agency_site_settings (slug);
CREATE INDEX idx_site_events_agency ON site_events (agency_id);
CREATE INDEX idx_agency_members_email ON agency_members (invited_email);
CREATE INDEX idx_agency_subs_agency ON agency_subscriptions (agency_id);

-- Enforing safe permissive RLS configuration
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies permissiveness" ON agencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Properties permissiveness" ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Leads permissiveness" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lead memory permissiveness" ON lead_ai_memory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Conversations permissiveness" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Followups permissiveness" ON follow_ups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Settings permissiveness" ON agency_site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Site events permissiveness" ON site_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Members permissiveness" ON agency_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "WhatsApp permissiveness" ON whatsapp_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Subscriptions permissiveness" ON agency_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Counters permissiveness" ON usage_counters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Integrations permissiveness" ON agency_integrations FOR ALL USING (true) WITH CHECK (true);

-- Seed Starter Catalog items
INSERT INTO subscription_plans (id, name, price_monthly, currency, max_properties, max_leads_per_month, max_team_members, max_ai_replies_per_month, includes_website_builder, includes_whatsapp, includes_analytics, includes_custom_domain)
VALUES 
('starter', 'Starter Package', 29.00, 'USD', 10, 50, 1, 100, true, false, false, false),
('growth', 'Growth Agent Plus', 79.00, 'USD', 50, 250, 3, 500, true, true, true, false),
('pro', 'Pro Workspace', 149.00, 'USD', 200, 1000, 10, 2500, true, true, true, true),
('enterprise', 'Quantum Agency Limitless', 499.00, 'USD', 9999, 99999, 999, 99999, true, true, true, true);

INSERT INTO integration_catalog (id, key, name, description, category, icon, is_active)
VALUES 
('whatsapp', 'whatsapp', 'WhatsApp Business Manager', 'Connect official Meta WhatsApp numbers and automate continuity chats.', 'Messaging', 'MessageSquareCode', true),
('fb_leads', 'fb_leads', 'Facebook Lead Pages Sync', 'Sync leads automatically from Facebook Ads directly to your CRM.', 'Marketing', 'Facebook', true),
('g_sheets', 'g_sheets', 'Google Sheets Exporter', 'Push new leads and property listings directly to Google Sheets.', 'Files', 'Database', true),
('g_maps', 'g_maps', 'Google Maps Premium', 'Show satellite 3D maps and nearby utilities for listed Pakistani properties.', 'Maps', 'MapPin', true),
('sms_gateway', 'sms_gateway', 'Pakistan SMS Portal Gateway', 'Send automated follow-up text messages via local SMS APIs.', 'Messaging', 'Send', true),
('csv_helper', 'csv_helper', 'OLX & Zameen CSV Importer', 'Bulk upload property listings in seconds using customized spreadsheets.', 'Files', 'FileSpreadsheet', true);
