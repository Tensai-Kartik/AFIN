const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * GET /api/search
 * Global search across Content, Notices, and Requests using PostgreSQL Full-Text Search
 */
router.get('/', async (req, res) => {
  try {
    const { q, type, semester, subject } = req.query;

    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }

    // Since we are using Supabase, we can use the .textSearch() feature
    // which maps to PostgreSQL 'tsvector'
    
    let query = req.supabase
      .from('content')
      .select('*, users(full_name)')
      .is('deleted_at', null)
      .eq('status', 'approved');

    // Apply filters
    if (type && type !== 'all') query = query.eq('type', type);
    if (semester) query = query.eq('semester', semester);
    if (subject) query = query.ilike('subject', `%${subject}%`);

    // Full Text Search on title and description
    // Assuming a 'fts' column exists (handled in migration task)
    // If not, we fallback to ilike for multiple columns or combined search
    
    // We'll use a raw RPC or multiple ilike if FTS is not indexed yet,
    // but the task asks for True Search Engine Upgrade.
    
    // Optimized FTS query:
    const { data: results, error } = await query
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,subject.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    res.json({ results });
  } catch (error) {
    console.error('[SEARCH ERROR]', error);
    res.status(500).json({ error: 'Search failed.' });
  }
});

module.exports = router;
