-- SQL Migration File for EstateAI Assistant Database Schema
-- Location: /supabase/migrations/01_schema.sql

-- 1. Create Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    logo_url VARCHAR(500),
    tone_preference VARCHAR(100) DEFAULT 'roman_urdu_mix', -- roman_urdu_mix, pure_english, pure_roman_urdu, urdu_script
    ai_model_setting VARCHAR(100) DEFAULT 'llama-3.3-70b-versatile',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL, -- e.g., '5 Marla', '10 Marla', '1 Kanal'
    city VARCHAR(100) NOT NULL, -- e.g., 'Lahore', 'Islamabad', 'Karachi'
    area VARCHAR(255) NOT NULL, -- e.g., 'DHA Phase 6', 'Bahria Town'
    type VARCHAR(100) NOT NULL, -- e.g., 'House', 'Plot', 'Commercial', 'Apartment'
    purpose VARCHAR(50) NOT NULL, -- e.g., 'Sale', 'Rent'
    price DECIMAL(15, 2) NOT NULL, -- Keep decimal representation (e.g. 18500000.00 for 1.85 Crore)
    price_display VARCHAR(100) NOT NULL, -- e.g. 'Rs. 1.85 crore'
    bedrooms INTEGER,
    bathrooms INTEGER,
    furnished_status VARCHAR(100), -- e.g., 'Furnished', 'Semi-Furnished', 'Unfurnished'
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- Available, Sold, Under Offer
    image_urls TEXT[], -- Array of image links
    video_url VARCHAR(500),
    map_pin VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'New', -- New, Hot, Warm, Cold, Closed
    requirement_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Lead AI Memory Table
CREATE TABLE IF NOT EXISTS lead_ai_memory (
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

-- 5. Create Conversations (Chat Log) Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'customer' or 'agent_ai' or 'agent_manual'
    message TEXT NOT NULL,
    parsed_intent JSONB, -- The extracted intent from Groq/Gemini
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    follow_up_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Call', 'Site Visit', 'WhatsApp Followup'
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Completed, Missed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add database performance indices
CREATE INDEX IF NOT EXISTS idx_properties_city_area ON properties(city, area);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(follow_up_date);
