const express = require('express');
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const { z } = require('zod');
const router = express.Router();

const requestSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(10).max(1500),
  subject: z.string().min(2).max(100),
});

// POST /api/requests/create
// Submit a new student request
router.post('/create', verifyToken, requireVerifiedStudent, async (req, res) => {
  try {
    const validatedData = requestSchema.parse(req.body);
    const authorId = req.user.id;

    const { data, error } = await req.supabase
      .from('requests')
      .insert([
        {
          ...validatedData,
          author_id: authorId
        }
      ])
      .select(`*, users(full_name, prn)`);

    if (error) throw error;

    res.json({ message: 'Request posted successfully.', request: data[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
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
