const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Get all notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const { count, error } = await req.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read (Delete them)
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('notifications')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read (Delete it)
router.post('/:id/read', verifyToken, async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
