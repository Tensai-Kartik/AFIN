const express = require('express');
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/requests/create
// Submit a new student request
router.post('/create', verifyToken, requireVerifiedStudent, async (req, res) => {
  try {
    const { title, description, subject } = req.body;
    const authorId = req.user.id;

    if (!title || !description || !subject) {
      return res.status(400).json({ error: 'Title, description, and subject are required.' });
    }

    const { data, error } = await req.supabase
      .from('requests')
      .insert([
        {
          title,
          description,
          subject,
          author_id: authorId
        }
      ])
      .select(`*, users(full_name, prn)`);

    if (error) throw error;

    res.json({ message: 'Request posted successfully.', request: data[0] });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request.' });
  }
});

// GET /api/requests
// Get all requests
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('requests')
      .select(`*, users(full_name, prn)`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ requests: data });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests.' });
  }
});

module.exports = router;
