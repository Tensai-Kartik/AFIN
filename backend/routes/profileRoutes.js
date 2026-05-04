const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/profile/update
router.post('/update', verifyToken, async (req, res) => {
  try {
    const { full_name, prn, phone, avatar_url, id_card_url } = req.body;
    const userId = req.user.id;

    // Check if user already exists
    const { data: userData, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user for update:', userError);
      return res.status(500).json({ error: 'Failed to verify user status.' });
    }

    const isNewUser = !userData || userData.status === 'incomplete';

    // Validate required fields only for new users or if being explicitly set
    if (isNewUser && (!full_name || !prn || !phone || !id_card_url)) {
      return res.status(400).json({ error: 'Missing required fields for profile completion (full_name, prn, phone, id_card_url).' });
    }

    // Check if PRN is already taken by another user (only if PRN is provided)
    if (prn) {
      const { data: existingPrn, error: prnError } = await req.supabase
        .from('users')
        .select('id')
        .eq('prn', prn)
        .neq('id', userId)
        .maybeSingle();

      if (prnError) {
        console.error('Error checking PRN:', prnError);
        return res.status(500).json({ error: 'Error validating PRN uniqueness.' });
      }

      if (existingPrn) {
        return res.status(400).json({ error: 'PRN is already registered to another user.' });
      }
    }

    // Build update object dynamically
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (prn !== undefined) updateData.prn = prn;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (id_card_url !== undefined) updateData.id_card_url = id_card_url;
    if (req.body.cgpa !== undefined) updateData.cgpa = req.body.cgpa;

    // If it was a major update (new user or changing core info), set status to pending
    if (isNewUser || full_name || prn || id_card_url) {
      updateData.status = 'pending';
    }

    // Update the users table
    const { data, error } = await req.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile in database.' });
    }

    // Log the action
    await req.supabase
      .from('audit_logs')
      .insert([
        {
          action: 'profile_update',
          actor_id: userId,
          target_type: 'user',
          target_id: userId
        }
      ]);

    res.json({ message: 'Profile updated successfully', user: data[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/profile/award-points — Award points for actions
router.post('/award-points', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }
    await req.supabase.rpc('add_user_points', { p_user_id: userId, p_amount: Math.min(amount, 50) });
    res.json({ message: 'Points awarded.' });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ error: 'Failed to award points.' });
  }
});

module.exports = router;
