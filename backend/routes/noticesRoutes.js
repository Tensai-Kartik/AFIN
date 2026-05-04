const express = require('express');
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/notices/create
// Submit a new notice for approval
router.post('/create', verifyToken, requireVerifiedStudent, async (req, res) => {
  try {
    const { title, description, category, is_important } = req.body;
    const authorId = req.user.id;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required.' });
    }

    const { data, error } = await req.supabase
      .from('notices')
      .insert([
        {
          title,
          description,
          category,
          is_important: is_important || false,
          author_id: authorId,
          status: 'pending'
        }
      ])
      .select();

    if (error) throw error;

    res.json({ message: 'Notice submitted for approval successfully.', notice: data[0] });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ error: 'Failed to create notice.' });
  }
});

module.exports = router;
