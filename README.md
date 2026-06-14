# EstateAI - Real Estate AI Continuity SaaS (Premium Pakistan Edition)

EstateAI is an advanced, high-density, Shopify-style CRM & AI Continuity Assistant platform built specifically for modern Pakistani real estate agencies. Unlike simple filtering bots, EstateAI runs a deep contextual memory-driven Continuity Engine that behaves like a professional human real estate agent, remembering customer stage, budgets, multiple listed properties, and Urdu/English language preferences.

---

## 🚀 Key Features Include:
1. **Premium High Density Workspace Visual Theme**: Modern high-fidelity layout optimized for agents.
2. **Per-Customer Continuity Memory Engine**: Track the active chosen property options, customer budgets, cities, custom intent categories, and visit records.
3. **No Database Bypass Rules**: Agent protection ensures the assistant never says the owner will talk directly to the buyer. CRM facts are protected as the definitive source of truth.
4. **Bilingual / Roman Urdu Capabilities**: Automatically mirrors conversational language preferences (English, Roman Urdu, or English-Urdu blend).
5. **Real Supabase Cloud Sync / DB Fallback**: Direct client-to-cloud sync with automatic, secure local sandbox JSON backup when Cloud URL configuration is omitted.

---

## 🛠️ Technology Stack
* **Frontend**: React 18+ (Vite, TypeScript, Tailwind CSS)
* **Backend**: Node.js & Express App Server
* **AI Engine**: Groq Cloud Services (SDK proxies with system-level context memory)
* **Auth & DB**: Supabase Auth & PostgreSQL schemas with Row-Level Security

---

## 📂 SQL Migration & Database Schemas
The database runs on real PostgreSQL schemas. Below is a copy of `/supabase/migrations/01_schema.sql` which can be executed in your Supabase SQL Editor.

```sql
-- Create Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
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

-- Create Properties Table
CREATE TABLE IF NOT EXISTS properties (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'New',
    requirement_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Lead AI Memory Table
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

-- Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    parsed_intent JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
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

-- Indexes for blazing fast lookups
CREATE INDEX IF NOT EXISTS idx_properties_city_area ON properties(city, area);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(follow_up_date);
```

---

## 💻 How to Run and Test This in Your PC

Follow these steps to download, install dependencies, and run the applet on your local machine:

### 1. Prerequisite Checklist
* Ensure you have [Node.js](https://nodejs.org/) installed (version 18 or 20 is highly recommended).
* Clone or extract the working project directory.

### 2. Environment Setup
Create a file named `.env` in the root of your project (you can copy the provided `.env.example`) and fill in:
```env
# Supabase Configuration (Leave blank/undefined to run on beautiful Local Sandbox JSON storage automatically!)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Groq Cloud API Key (Required for the real Continuity AI Engine to talk!)
GROQ_API_KEY=your_groq_api_key_or_sdk_token_here
```

### 3. Install Dependencies
Open your terminal in the root directory and run:
```bash
npm install
```
*(Any deprecation warnings such as package `node-domexception` are perfectly normal warnings and do not affect the build or runtime safety of your app at all!)*

### 4. Boot Dev Environment
Start the development server with:
```bash
npm run dev
```
The server will boot on port `3000`. Open `http://localhost:3000` in your web browser to enjoy!

---

## 🎯 Official Agent Acceptance Test Guidelines
Run these interactive conversation exercises in the WhatsApp Continuity inbox simulator to test the AI's deep memory features:

1. **New Request**: Ask `I want 5 marla house in DHA, is available?`
   * *Expected Result*: AI identifies the parameters (5 Marla, DHA), outputs exactly matching properties in DHA Block C (Option 1 and Option 2) from the CRM, and saves them in Memory.
2. **Context Retention**: Ask `Are you sure?`
   * *Expected Result*: AI maintains state, doesn't restart searching, and politely reassures the customer in polite Roman Urdu.
3. **Picture Request**: Ask `yes share the picture`
   * *Expected Result*: AI matches the memory, finds and prints the correct CRM image link for options, never inventing dummy details.
4. **Follow-up / Option Focus**: Ask `how is 2nd one which price is 1.85 crore?`
   * *Expected Result*: AI detects this is not a new search, centers exactly on Option 2, keeps DHA Context, explains its structure (e.g., Corner House luxury villa, 3 Beds), and logs Option 2 as the active property inside memory.
5. **Visit Request**: Ask `main kab dekhna a sakta hon?`
   * *Expected Result*: AI triggers a physical site visit, says polite Pakistan-style wording: "Hamari team/agent visit coordinate karke aapko confirm kar dega", and schedules a follow-up inside your CRM dashboard.
6. **Changed requirement**: Ask `Actually mujhe Bahria Town mein 10 marla house chahiye`
   * *Expected Result*: AI detects requirement shift, clears DHA search, pulls 10 Marla Bahria properties, and updates matching memory structures perfectly.
7. **Agent Protection Safeguard**: Test with any rule-breaking message. Keep in mind that the AI will never say "I will give customer number to the owner" or negotiate outside the agency scope.
