const express = require('express');
const router = express.Router();

// GET /api/search?q=&type=&subject=&semester=&sort=newest|most_bookmarked
router.get('/', async (req, res) => {
  try {
    const { q = '', type, subject, semester, sort = 'newest' } = req.query;
    const results = { content: [], notices: [], requests: [] };

    if (!q.trim()) {
      return res.json(results);
    }

    const tsQuery = q.trim().split(/\s+/).join(' & ');

    // --- Content Search ---
    let contentQuery = req.supabase
      .from('content')
      .select('id, title, description, subject, semester, type, file_url, created_at, users(full_name)')
      .eq('status', 'approved')
      .is('deleted_at', null);

    if (type) contentQuery = contentQuery.eq('type', type);
    if (subject) contentQuery = contentQuery.ilike('subject', `%${subject}%`);
    if (semester) contentQuery = contentQuery.eq('semester', parseInt(semester));

    // Try FTS first, fallback to ilike
    const { data: ftsContent } = await contentQuery
      .textSearch('title', `'${tsQuery}'`, { type: 'plain', config: 'english' })
      .limit(20);

    if (ftsContent && ftsContent.length > 0) {
      results.content = ftsContent;
    } else {
      const { data: ilikeContent } = await contentQuery
        .or(`title.ilike.%${q}%,subject.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(20);
      results.content = ilikeContent || [];
    }

    // --- Notices Search (only approved) ---
    const { data: ftsNotices } = await req.supabase
      .from('notices')
      .select('id, title, description, category, created_at')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(10);

    results.notices = ftsNotices || [];

    // --- Requests Search ---
    const { data: ftsRequests } = await req.supabase
      .from('requests')
      .select('id, title, description, subject, created_at, users(full_name)')
      .is('deleted_at', null)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,subject.ilike.%${q}%`)
      .limit(10);

    results.requests = ftsRequests || [];

    // Sort content results
    if (sort === 'newest') {
      results.content.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const total = results.content.length + results.notices.length + results.requests.length;
    res.json({ ...results, total, query: q });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
});

module.exports = router;
