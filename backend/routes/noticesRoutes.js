const express = require('express');
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const { z } = require('zod');
const router = express.Router();

const noticeSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(2000),
  category: z.string().min(2).max(50),
  is_important: z.boolean().optional().default(false),
});

// POST /api/notices/create
// Submit a new notice for approval
router.post('/create', verifyToken, requireVerifiedStudent, async (req, res) => {
  try {
    const validatedData = noticeSchema.parse(req.body);
    const authorId = req.user.id;

    const { data, error } = await req.supabase
      .from('notices')
      .insert([
        {
          ...validatedData,
          author_id: authorId,
          status: 'pending'
        }
      ])
      .select();

    if (error) throw error;

    res.json({ message: 'Notice submitted for approval successfully.', notice: data[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating notice:', error);
    res.status(500).json({ error: 'Failed to create notice.' });
  }
});

module.exports = router;
