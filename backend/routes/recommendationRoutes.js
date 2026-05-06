const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * GET /api/recommendations
 * Simple heuristic-based recommendations
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get user's preferred subjects/semester from their profile or recent bookmarks
    const { data: userProfile } = await req.supabase
      .from('users')
      .select('semester')
      .eq('id', userId)
      .single();

    const userSemester = userProfile?.semester;

    // 2. Fetch recommendations
    // Logic A: Same semester, high popularity (bookmarks count - simulated)
    // Logic B: Recently uploaded in same semester
    
    let query = req.supabase
      .from('content')
      .select('*, users(full_name)')
      .is('deleted_at', null)
      .eq('status', 'approved');

    if (userSemester) {
      query = query.eq('semester', userSemester);
    }

    const { data: recommendations, error } = await query
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    res.json({ 
      recommendations,
      reason: userSemester ? `Based on your Semester ${userSemester} profile` : 'Trending in AFIN'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
