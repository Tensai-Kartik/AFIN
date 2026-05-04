const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/bookmarks
// Fetch all bookmarks for the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await req.supabase
      .from('bookmarks')
      .select(`
        id,
        content_id,
        created_at,
        content!inner (
          id,
          title,
          description,
          subject,
          semester,
          type,
          file_url,
          created_at,
          deleted_at,
          users (
            full_name,
            prn
          )
        )
      `)
      .is('content.deleted_at', null)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ bookmarks: data });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

// POST /api/bookmarks/add
// Add a new bookmark
router.post('/add', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content_id } = req.body;

    if (!content_id) {
      return res.status(400).json({ error: 'Missing content_id.' });
    }

    // Insert (Supabase unique constraint on user_id, content_id will prevent duplicates,
    // but we can use upsert to avoid errors or just let it fail and handle it)
    const { data, error } = await req.supabase
      .from('bookmarks')
      .insert([{ user_id: userId, content_id }])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Bookmark already exists.' });
      }
      throw error;
    }

    res.json({ message: 'Bookmarked successfully', bookmark: data[0] });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ error: 'Failed to add bookmark.' });
  }
});

// DELETE /api/bookmarks/remove
// Remove a bookmark
router.delete('/remove', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content_id } = req.body;

    if (!content_id) {
      return res.status(400).json({ error: 'Missing content_id.' });
    }

    const { error } = await req.supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', content_id);

    if (error) throw error;

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Failed to remove bookmark.' });
  }
});

module.exports = router;
