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
      .limit(50);

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
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
router.post('/:id/read', verifyToken, async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Utility function to send a notification (Database + Socket)
 * This should be used internally by other routes.
 */
async function sendNotification(supabase, io, { userId, message, type }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, message, type, is_read: false }])
      .select()
      .single();

    if (error) throw error;

    // Emit via Socket.IO to the user's private room
    if (io) {
      io.to(userId).emit('notification', data);
    }
    
    return data;
  } catch (err) {
    console.error('[NOTIFICATION ERROR]', err);
  }
}

module.exports = router;
module.exports.sendNotification = sendNotification;
