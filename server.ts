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

      // 11. Sync statuses and persist memory shifts
      await dbStore.updateLead(leadId, { status: parsedIntent.lead_status });
      await dbStore.updateLeadMemory(leadId, memory);

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
