const express = require('express');
const router = express.Router();
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const { z } = require('zod');

const skillSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price_or_barter: z.string().max(200).optional(),
  contact_number: z.string().min(10).max(15),
});

const marketRequestSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  budget: z.string().max(100).optional(),
  contact_number: z.string().min(10).max(15),
});

// --- Skills ---

// Get all active skills
router.get('/skills', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('skills')
      .select('*, users(full_name, avatar_url, prn)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // DEBUG: log first skill to verify contact_number is returned
    if (data && data.length > 0) {
      console.log('[MARKET] GET Skills - first record contact_number:', data[0].contact_number);
    }
    res.json(data);
  } catch (error) {
    console.error('[MARKET] GET Skills Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Post a skill
router.post('/skills', verifyToken, async (req, res) => {
  console.log('[MARKET] Post Skill Request:', req.body);
  try {
    const validatedData = skillSchema.parse(req.body);
    console.log('[MARKET] Validated Skill Data:', validatedData);

    const contactToInsert = String(validatedData.contact_number || req.body.contact_number || '');
    console.log('[MARKET] Final Skill Contact Number for Insert:', contactToInsert);

    const insertObj = { 
      user_id: req.user.id, 
      title: validatedData.title, 
      description: validatedData.description, 
      price_or_barter: validatedData.price_or_barter || null,
      contact_number: contactToInsert
    };
    console.log('[MARKET] Skill Insert Object:', JSON.stringify(insertObj, null, 2));

    const { data, error } = await req.supabase
      .from('skills')
      .insert([insertObj])
      .select();

    if (error) {
      console.error('[MARKET] DB Insert Error (Skills):', error);
      throw error;
    }
    
    console.log('[MARKET] Skill inserted successfully:', JSON.stringify(data[0], null, 2));
    res.json(data[0]);
  } catch (error) {
    console.error('[MARKET] Skill Post Catch Error:', error);
    if (error instanceof z.ZodError) {
      const errorMsg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ error: `Validation failed: ${errorMsg}` });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a skill (soft delete)
router.delete('/skills/:id', verifyToken, async (req, res) => {
  try {
    const skillId = req.params.id;
    const userId = req.user.id;
    const userRole = req.dbUser?.role;

    // First fetch the skill to check ownership
    const { data: skill, error: fetchError } = await req.supabase
      .from('skills')
      .select('user_id')
      .eq('id', skillId)
      .single();

    if (fetchError || !skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Permission check
    if (skill.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You can only delete your own listings.' });
    }

    // Soft delete
    const { error: updateError } = await req.supabase
      .from('skills')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', skillId);

    if (updateError) throw updateError;

    // Optional audit log
    await req.supabase.from('audit_logs').insert([{
      action: 'DELETE_SKILL',
      actor_id: userId,
      target_type: 'skill',
      target_id: skillId
    }]);

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Market Requests ---

// Get all active market requests
router.get('/requests', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('requests_market')
      .select('*, users(full_name, avatar_url, prn)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a market request
router.post('/requests', verifyToken, async (req, res) => {
  console.log('[MARKET] Post Market Request:', req.body);
  try {
    const validatedData = marketRequestSchema.parse(req.body);
    console.log('[MARKET] Validated Request Data:', validatedData);

    const contactToInsert = String(validatedData.contact_number || req.body.contact_number || '');
    console.log('[MARKET] Final Request Contact Number for Insert:', contactToInsert);

    const insertObj = { 
      user_id: req.user.id, 
      title: validatedData.title, 
      description: validatedData.description, 
      budget: validatedData.budget || null,
      contact_number: contactToInsert
    };
    console.log('[MARKET] Request Insert Object:', JSON.stringify(insertObj, null, 2));

    const { data, error } = await req.supabase
      .from('requests_market')
      .insert([insertObj])
      .select();

    if (error) {
      console.error('[MARKET] DB Insert Error (Requests):', error);
      throw error;
    }
    
    console.log('[MARKET] Market Request inserted successfully:', JSON.stringify(data[0], null, 2));
    res.json(data[0]);
  } catch (error) {
    console.error('[MARKET] Request Post Catch Error:', error);
    if (error instanceof z.ZodError) {
      const errorMsg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ error: `Validation failed: ${errorMsg}` });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a market request (soft delete)
router.delete('/requests/:id', verifyToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    const userRole = req.dbUser?.role;

    // First fetch the request to check ownership
    const { data: marketReq, error: fetchError } = await req.supabase
      .from('requests_market')
      .select('user_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !marketReq) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Permission check
    if (marketReq.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You can only delete your own listings.' });
    }

    // Soft delete
    const { error: updateError } = await req.supabase
      .from('requests_market')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Optional audit log
    await req.supabase.from('audit_logs').insert([{
      action: 'DELETE_MARKET_REQUEST',
      actor_id: userId,
      target_type: 'market_request',
      target_id: requestId
    }]);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
