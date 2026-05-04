const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// ─── LOST & FOUND ────────────────────────────────────────────────────────────

// GET /api/utility/lost-found
router.get('/lost-found', async (req, res) => {
  try {
    const { type } = req.query; // 'lost' | 'found'
    let query = req.supabase
      .from('lost_found')
      .select('*, users(full_name)')
      .eq('is_resolved', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ items: data });
  } catch (error) {
    console.error('Error fetching lost_found:', error);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// POST /api/utility/lost-found
router.post('/lost-found', verifyToken, async (req, res) => {
  try {
    const { title, description, location, contact_info, type, images } = req.body;
    const userId = req.user.id;

    if (!title || !contact_info || !type) {
      return res.status(400).json({ error: 'Title, contact info, and type are required.' });
    }

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "lost" or "found".' });
    }

    const { data, error } = await req.supabase
      .from('lost_found')
      .insert([{ title, description, location, contact_info, type, created_by: userId, images: images || [] }])
      .select();

    if (error) throw error;

    res.json({ message: 'Item posted successfully.', item: data[0] });
  } catch (error) {
    console.error('Error posting lost_found:', error);
    res.status(500).json({ error: 'Failed to post item.' });
  }
});

// PATCH /api/utility/lost-found/:id/resolve
router.patch('/lost-found/:id/resolve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Only creator can resolve
    const { data, error } = await req.supabase
      .from('lost_found')
      .update({ is_resolved: true })
      .eq('id', id)
      .eq('created_by', userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(403).json({ error: 'Not authorized or item not found.' });
    }

    res.json({ message: 'Item marked as resolved.' });
  } catch (error) {
    console.error('Error resolving item:', error);
    res.status(500).json({ error: 'Failed to resolve item.' });
  }
});

// ─── ACCOMMODATION ────────────────────────────────────────────────────────────

// GET /api/utility/accommodation
router.get('/accommodation', async (req, res) => {
  try {
    const { type } = req.query;
    let query = req.supabase
      .from('accommodation')
      .select('*, users(full_name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ listings: data });
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    res.status(500).json({ error: 'Failed to fetch accommodation listings.' });
  }
});

// POST /api/utility/accommodation
router.post('/accommodation', verifyToken, async (req, res) => {
  try {
    const { type, description, contact_info, location, rent_range, images } = req.body;
    const userId = req.user.id;

    if (!type || !description || !contact_info) {
      return res.status(400).json({ error: 'Type, description, and contact info are required.' });
    }

    const { data, error } = await req.supabase
      .from('accommodation')
      .insert([{ type, description, contact_info, location, rent_range, created_by: userId, images: images || [] }])
      .select();

    if (error) throw error;

    res.json({ message: 'Listing posted successfully.', listing: data[0] });
  } catch (error) {
    console.error('Error posting accommodation:', error);
    res.status(500).json({ error: 'Failed to post listing.' });
  }
});

module.exports = router;
