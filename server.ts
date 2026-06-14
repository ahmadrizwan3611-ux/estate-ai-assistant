// Full-Stack Express Server Entry Point
// Location: /server.ts

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/db';
import { parseIntentAndContext } from './server/ai';
import { matchCRMProperties, composeAIResponse } from './server/engine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // --- API ROUTES ---

  // Service health test
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Agency Endpoints
  app.get('/api/agency', async (req, res) => {
    try {
      const data = await dbStore.getAgency();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/agency', async (req, res) => {
    try {
      const updated = await dbStore.updateAgency(req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Properties Listings Endpoints
  app.get('/api/properties', async (req, res) => {
    try {
      const data = await dbStore.getProperties();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/properties', async (req, res) => {
    try {
      const { title, size, city, area, type, purpose, price, price_display, bedrooms, bathrooms, furnished_status, description, image_urls, video_url, map_pin, latitude, longitude, location_notes } = req.body;
      if (!title || !size || !city || !area || !type || !purpose || !price) {
        return res.status(400).json({ error: "Missing required property parameters." });
      }
      
      const newProperty = await dbStore.addProperty({
        title,
        size,
        city,
        area,
        type,
        purpose,
        price: Number(price),
        price_display: price_display || `Rs. ${(price / 10000000).toFixed(2)} crore`,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        furnished_status: furnished_status || 'Unfurnished',
        description,
        status: 'Available',
        image_urls: Array.isArray(image_urls) ? image_urls : [image_urls || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
        video_url,
        map_pin,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        location_notes
      });
      res.json(newProperty);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/properties/:id', async (req, res) => {
    try {
      const updated = await dbStore.updateProperty(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/properties/:id', async (req, res) => {
    try {
      const success = await dbStore.deleteProperty(req.params.id);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Leads Endpoints
  app.get('/api/leads', async (req, res) => {
    try {
      const leads = await dbStore.getLeads();
      res.json(leads);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/leads', async (req, res) => {
    try {
      const { name, phone, email, status, requirement_notes } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: "Name and Phone are mandatory." });
      }
      const lead = await dbStore.addLead({
        name,
        phone,
        email,
        status: status || 'New',
        requirement_notes: requirement_notes || ''
      });
      res.json(lead);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/leads/:id', async (req, res) => {
    try {
      const updated = await dbStore.updateLead(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Unique Lead AI Memory Endpoints
  app.get('/api/leads/:leadId/memory', async (req, res) => {
    try {
      const memory = await dbStore.getLeadMemory(req.params.leadId);
      res.json(memory);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/leads/:leadId/memory', async (req, res) => {
    try {
      const updated = await dbStore.updateLeadMemory(req.params.leadId, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Chat/Dialog Log Get Endpoint
  app.get('/api/leads/:leadId/chat', async (req, res) => {
    try {
      const chat = await dbStore.getConversations(req.params.leadId);
      res.json(chat);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Core WhatsApp-Style Continuity Message Submission Endpoint
  app.post('/api/leads/:leadId/chat', async (req, res) => {
    const { leadId } = req.params;
    const { message, simulateReply = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message content required." });
    }

    try {
      // 1. Record the Customer message
      const customerMsg = await dbStore.addMessage(leadId, 'customer', message);
      
      if (!simulateReply) {
        return res.json({ status: 'recorded', message: customerMsg });
      }

      // 2. Load context history and memory
      const history = await dbStore.getConversations(leadId);
      const memory = await dbStore.getLeadMemory(leadId);

      // 3. Trigger context-brain parser
      const parsedIntent = await parseIntentAndContext(message, history, memory);
      console.log('Parsed Customer Intent:', JSON.stringify(parsedIntent, null, 2));

      // 4. Update core memory parameters with extracted patches
      const currentReq = memory.current_requirement;
      if (parsedIntent.requirement_patch) {
        const patch = parsedIntent.requirement_patch;
        
        if (parsedIntent.message_type === 'new_search') {
          // New requirement search triggers a smart merge or reset
          memory.current_requirement = {
            city: patch.city || currentReq.city || 'Lahore', // fallback default
            area: patch.area || currentReq.area,
            area_group: patch.area || currentReq.area_group,
            property_type: patch.property_type || currentReq.property_type || 'House',
            size: patch.size || currentReq.size, // MUST COPY SIZE WORD EXACTLY
            purpose: patch.purpose || currentReq.purpose || 'Sale',
            max_budget: patch.max_budget || currentReq.max_budget,
            bedrooms: null
          };
        } else {
          // Soft inline requirement patch (the customer changed a filter)
          if (patch.city) currentReq.city = patch.city;
          if (patch.area) {
            currentReq.area = patch.area;
            currentReq.area_group = patch.area;
          }
          if (patch.size) currentReq.size = patch.size;
          if (patch.property_type) currentReq.property_type = patch.property_type;
          if (patch.purpose) currentReq.purpose = patch.purpose;
          if (patch.max_budget) currentReq.max_budget = patch.max_budget;
        }
      }

      // 5. Query matching engine for actual property records
      const allProperties = await dbStore.getProperties();
      const matchedCRMProps = matchCRMProperties(memory.current_requirement, allProperties);

      // 6. If search, register new Options array in Memory block
      if (parsedIntent.message_type === 'new_search') {
        memory.last_matched_options = matchedCRMProps.slice(0, 3).map((p, idx) => ({
          option_number: idx + 1,
          property_id: p.id,
          title: p.title,
          price: p.price_display,
          size: p.size // Exact copy size rule
        }));
        memory.active_property_id = null;
        memory.active_option_number = null;
      }

      // 7. Track referred selected options (follow-up about a specific shown option)
      if (parsedIntent.selected_option_number) {
        const foundOpt = memory.last_matched_options.find(
          o => o.option_number === parsedIntent.selected_option_number
        );
        if (foundOpt) {
          memory.active_property_id = foundOpt.property_id;
          memory.active_option_number = foundOpt.option_number;
        }
      }

      // 8. Handle context stage transition rules
      if (parsedIntent.message_type === 'visit_request') {
        memory.conversation_stage = 'visit_requested';
        // Auto-extract visit time window if any
        memory.visit_preference = parsedIntent.customer_intent_summary || 'Requested visit';
        
        // Auto-schedule a physical followup within CRM database!
        await dbStore.addFollowUp({
          lead_id: leadId,
          property_id: memory.active_property_id || undefined,
          follow_up_date: new Date(Date.now() + 3600000 * 48).toISOString(), // set default 2 days out
          type: 'Site Visit',
          notes: `Site visit requested of property options. Direct memo: ${parsedIntent.customer_intent_summary}`,
          status: 'Scheduled'
        });
      } else if (parsedIntent.message_type === 'new_search') {
        memory.conversation_stage = 'property_options_shared';
      }

      // Record any missing information details request if they asked about non-listed parameter
      if (parsedIntent.message_type === 'missing_detail_question' && parsedIntent.question_type) {
        if (!memory.missing_info_requests.includes(parsedIntent.question_type)) {
          memory.missing_info_requests.push(parsedIntent.question_type);
        }
      }

      // 9. Compose natural and authentic agent response
      const answer = await composeAIResponse(message, parsedIntent, memory, history, matchedCRMProps);

      // 10. Record AI response message
      const aiMsgObj = await dbStore.addMessage(leadId, 'agent_ai', answer, parsedIntent);

      // 11. Sync statuses, persist memory shifts, and increment analytics replies usage
      await dbStore.updateLead(leadId, { status: parsedIntent.lead_status });
      await dbStore.updateLeadMemory(leadId, memory);
      await dbStore.incrementAICounter();

      res.json({
        userMessage: customerMsg,
        aiMessage: aiMsgObj,
        memory,
        intent: parsedIntent,
        matchedCount: matchedCRMProps.length
      });

    } catch (e: any) {
      console.error('Error handling EstateAI continuity chat lifecycle:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Follow-ups Endpoints
  app.get('/api/followups', async (req, res) => {
    try {
      const data = await dbStore.getFollowUps();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/followups', async (req, res) => {
    try {
      const { lead_id, property_id, follow_up_date, type, notes } = req.body;
      if (!lead_id || !follow_up_date || !type) {
        return res.status(400).json({ error: "Missing required fields (lead_id, follow_up_date, type)." });
      }
      const added = await dbStore.addFollowUp({
        lead_id,
        property_id,
        follow_up_date,
        type,
        notes,
        status: 'Scheduled'
      });
      res.json(added);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/followups/:id', async (req, res) => {
    try {
      const updated = await dbStore.updateFollowUp(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/followups/:id', async (req, res) => {
    try {
      const success = await dbStore.deleteFollowUp(req.params.id);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // =========================================================================
  // --- MODULES ENGINES & Webhooks, Protected SaaS Dashboard Endpoints ---
  // =========================================================================

  // 1. AGENCY WEBSITE BUILDER + PUBLIC PAGES (SETTINGS GET/PUT)
  app.get('/api/website-settings', async (req, res) => {
    try {
      const data = await dbStore.getWebsiteSettings();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/website-settings', async (req, res) => {
    try {
      const updated = await dbStore.updateWebsiteSettings(req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public portal lookups (slug-based agency landing context)
  app.get('/api/public/site/:slug', async (req, res) => {
    try {
      const data = await dbStore.getWebsiteSettingsBySlug(req.params.slug);
      if (!data) {
        return res.status(404).json({ error: 'Portals agency page not found with this slug.' });
      }
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/public/site/:slug/property/:propertyId', async (req, res) => {
    try {
      const data = await dbStore.getWebsiteSettingsBySlug(req.params.slug);
      if (!data) {
        return res.status(404).json({ error: 'Agency clinic settings not found.' });
      }
      const prop = data.properties.find(p => p.id === req.params.propertyId);
      if (!prop) {
        return res.status(404).json({ error: 'Listed property detail not found.' });
      }
      res.json({ property: prop, site: data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public visitor lead capture inquiry submissions (with Continuity Memory injections)
  app.post('/api/public/site/:slug/lead', async (req, res) => {
    try {
      const { name, phone, email, interested_property_id, message } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone fields are mandatory.' });
      }

      const addedLead = await dbStore.addLead({
        name,
        phone,
        email,
        status: 'Warm',
        source: 'public_website',
        requirement_notes: `Website form inquiry: "${message || 'Requests property details.'}"` + 
          (interested_property_id ? ` (CRM Property Refer ID: ${interested_property_id})` : '')
      });

      // Inject default memory stage context
      const propList = await dbStore.getProperties();
      const matchedProp = propList.find(p => p.id === interested_property_id);
      const matchedSummaryText = matchedProp 
        ? `Website inquiry received: Interested specifically in "${matchedProp.title}" listed in ${matchedProp.area} (Size: ${matchedProp.size}, Price: ${matchedProp.price_display})`
        : `Website inquiry received. Context notes: ${message || 'Wants contact.'}`;

      await dbStore.updateLeadMemory(addedLead.id, {
        conversation_stage: 'public_website_inquiry',
        conversation_summary: matchedSummaryText,
        customer_language: 'english_roman_urdu_mix',
        active_property_id: interested_property_id || null,
        last_question_type: 'site_inquiry'
      });

      res.json({ success: true, lead: addedLead });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public visitor traffic events logging (site views, property detail opens, search terms tracker)
  app.post('/api/public/site/:slug/event', async (req, res) => {
    try {
      const { event_type, property_id, path, visitor_id, metadata } = req.body;
      if (!event_type || !path) {
        return res.status(400).json({ error: 'Required event parameters missing.' });
      }
      const addedEvent = await dbStore.addSiteEvent({
        agency_id: 'agency-id-1',
        event_type,
        property_id,
        path,
        visitor_id,
        metadata
      });
      res.json({ success: true, event: addedEvent });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 2. ANALYTICS METRICS OVERVIEW
  app.get('/api/analytics/overview', async (req, res) => {
    try {
      const events = await dbStore.getSiteEvents();
      const counters = await dbStore.getUsageCounters();
      const properties = await dbStore.getProperties();
      const leads = await dbStore.getLeads();
      const followUps = await dbStore.getFollowUps();

      res.json({
        events,
        usage: counters,
        metrics: {
          totalPropertiesCount: properties.length,
          totalLeadsCount: leads.length,
          totalVisitsCount: followUps.filter(f => f.type === 'Site Visit').length
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. TEAM INTERFACES 
  app.get('/api/team', async (req, res) => {
    try {
      const data = await dbStore.getTeamMembers();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/team', async (req, res) => {
    try {
      const { invited_email, name, role } = req.body;
      if (!invited_email || !name) {
        return res.status(400).json({ error: 'Name and email are required to invite team.' });
      }
      const newMember = await dbStore.addTeamMember({
        agency_id: 'agency-id-1',
        invited_email,
        name,
        role: role || 'agent',
        status: 'invited'
      });
      res.json(newMember);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/team/:id', async (req, res) => {
    try {
      const updated = await dbStore.updateTeamMember(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/team/:id', async (req, res) => {
    try {
      const success = await dbStore.deleteTeamMember(req.params.id);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 4. WHATSAPP METRICS / SIMULATION GATEWAYS
  app.get('/api/whatsapp/settings', async (req, res) => {
    try {
      const settings = await dbStore.getWhatsAppSettings();
      res.json(settings);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/whatsapp/settings', async (req, res) => {
    try {
      const updated = await dbStore.updateWhatsAppSettings(req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Verification URL challenge (Meta webhook registration validation)
  app.get('/api/webhooks/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === 'estateai_verify_token_secure') {
        console.log('WhatsApp Webhook Handshake Verification succeeded!');
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Verification token mismatch.');
    }
    res.status(200).json({ status: 'whatsapp_webhook_simulator_live' });
  });

  // Recieving webhooks payload from Meta servers
  app.post('/api/webhooks/whatsapp', async (req, res) => {
    try {
      console.log('Incoming Meta Webhook body:', JSON.stringify(req.body, null, 2));
      const entry = req.body?.entry?.[0];
      const change = entry?.changes?.[0];
      const val = change?.value;
      const messageObj = val?.messages?.[0];
      const contactObj = val?.contacts?.[0];

      if (messageObj && messageObj.text?.body) {
        const fromPhone = messageObj.from; // e.g. "923001234567"
        const customerName = contactObj?.profile?.name || 'WhatsApp Client';
        const rawMessageText = messageObj.text.body;

        const leads = await dbStore.getLeads();
        let targetLead = leads.find(l => {
          const norm1 = l.phone.replace(/[^0-9]/g, '');
          const norm2 = fromPhone.replace(/[^0-9]/g, '');
          return norm1.includes(norm2) || norm2.includes(norm1);
        });

        if (!targetLead) {
          targetLead = await dbStore.addLead({
            name: customerName,
            phone: fromPhone,
            status: 'New',
            source: 'whatsapp_webhook',
            requirement_notes: 'Created automatically via incoming WhatsApp SMS.'
          });
        }

        // Add lead chat logs
        await dbStore.addMessage(targetLead.id, 'customer', rawMessageText);

        const whatsappConfig = await dbStore.getWhatsAppSettings();
        if (whatsappConfig.auto_reply_enabled) {
          // Execute primary AI Continuity parsing & response compositor
          const history = await dbStore.getConversations(targetLead.id);
          const memory = await dbStore.getLeadMemory(targetLead.id);
          const parsedIntent = await parseIntentAndContext(rawMessageText, history, memory);

          const currentReq = memory.current_requirement;
          if (parsedIntent.requirement_patch) {
            const patch = parsedIntent.requirement_patch;
            if (parsedIntent.message_type === 'new_search') {
              memory.current_requirement = {
                city: patch.city || currentReq.city || 'Lahore',
                area: patch.area || currentReq.area,
                area_group: patch.area || currentReq.area_group,
                property_type: patch.property_type || currentReq.property_type || 'House',
                size: patch.size || currentReq.size,
                purpose: patch.purpose || currentReq.purpose || 'Sale',
                max_budget: patch.max_budget || currentReq.max_budget,
                bedrooms: null
              };
            } else {
              if (patch.city) currentReq.city = patch.city;
              if (patch.area) { currentReq.area = patch.area; currentReq.area_group = patch.area; }
              if (patch.size) currentReq.size = patch.size;
              if (patch.property_type) currentReq.property_type = patch.property_type;
              if (patch.purpose) currentReq.purpose = patch.purpose;
              if (patch.max_budget) currentReq.max_budget = patch.max_budget;
            }
          }

          const allProperties = await dbStore.getProperties();
          const matchedCRMProps = matchCRMProperties(memory.current_requirement, allProperties);

          if (parsedIntent.message_type === 'new_search') {
            memory.last_matched_options = matchedCRMProps.slice(0, 3).map((p, idx) => ({
              option_number: idx + 1,
              property_id: p.id,
              title: p.title,
              price: p.price_display,
              size: p.size
            }));
            memory.active_property_id = null;
            memory.active_option_number = null;
          }

          if (parsedIntent.selected_option_number) {
            const foundOpt = memory.last_matched_options.find(o => o.option_number === parsedIntent.selected_option_number);
            if (foundOpt) {
              memory.active_property_id = foundOpt.property_id;
              memory.active_option_number = foundOpt.option_number;
            }
          }

          if (parsedIntent.message_type === 'visit_request') {
            memory.conversation_stage = 'visit_requested';
            memory.visit_preference = parsedIntent.customer_intent_summary || 'Requested visit';
            await dbStore.addFollowUp({
              lead_id: targetLead.id,
              property_id: memory.active_property_id || undefined,
              follow_up_date: new Date(Date.now() + 3600000 * 48).toISOString(),
              type: 'Site Visit',
              notes: `WhatsApp visit request logged: ${parsedIntent.customer_intent_summary}`,
              status: 'Scheduled'
            });
          }

          const answer = await composeAIResponse(rawMessageText, parsedIntent, memory, history, matchedCRMProps);
          await dbStore.addMessage(targetLead.id, 'agent_ai', answer, parsedIntent);
          await dbStore.updateLead(targetLead.id, { status: parsedIntent.lead_status });
          await dbStore.updateLeadMemory(targetLead.id, memory);
          await dbStore.incrementAICounter();
        }
      }

      res.status(200).json({ status: 'whatsapp_inbound_recieved_and_simulated' });
    } catch (e: any) {
      console.error('Error serving WhatsApp inbound Webhook text:', e);
      res.status(200).json({ error: e.message }); // Hook never crashes Express
    }
  });

  // 5. BILLING & SUBSCRIPTIONS ENGINES
  app.get('/api/billing/plans', async (req, res) => {
    try {
      const plans = await dbStore.getSubscriptionPlans();
      res.json(plans);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/billing/subscription', async (req, res) => {
    try {
      const subscription = await dbStore.getAgencySubscription();
      const usages = await dbStore.getUsageCounters();
      res.json({ subscription, usages });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/billing/subscription', async (req, res) => {
    try {
      const { plan_id } = req.body;
      if (!plan_id) {
        return res.status(400).json({ error: 'plan_id is required' });
      }
      const updated = await dbStore.updateAgencySubscription(plan_id);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 6. INTEGRATION / APPS SYSTEM
  app.get('/api/integrations', async (req, res) => {
    try {
      const catalog = await dbStore.getIntegrationsCatalog();
      const connected = await dbStore.getAgencyIntegrations();
      res.json({ catalog, connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/integrations/:key', async (req, res) => {
    try {
      const { status, settings } = req.body;
      const key = req.params.key;
      const updated = await dbStore.updateAgencyIntegration(key, status, settings);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EstateAI Server listening cleanly at http://localhost:${PORT}`);
  });
}

startServer();
export default startServer;
