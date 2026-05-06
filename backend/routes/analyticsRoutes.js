const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Get personal analytics
router.get('/my-twin', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch raw stats from various tables
    const [contentRes, requestsRes, downloadsRes] = await Promise.all([
      req.supabase.from('content').select('*', { count: 'exact', head: true }).eq('uploader_id', userId),
      req.supabase.from('requests').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      // For downloads, we assume there's a download_logs or similar, if not we use 0 for now
      // Or we can track bookmarks as a proxy
      req.supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    const stats = {
      uploads: contentRes.count || 0,
      requests: requestsRes.count || 0,
      bookmarks: downloadsRes.count || 0,
    };

    // 2. Calculate engagement score (Heuristic)
    // Points = (Uploads * 10) + (Requests * 5) + (Bookmarks * 2)
    const engagementScore = (stats.uploads * 10) + (stats.requests * 5) + (stats.bookmarks * 2);

    // 3. Update/Insert in user_analytics table
    const { error: upsertError } = await req.supabase
      .from('user_analytics')
      .upsert({ 
        user_id: userId, 
        uploads_count: stats.uploads,
        requests_activity: stats.requests,
        engagement_score: engagementScore,
        last_calculated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) console.error('[ANALYTICS] Sync failed:', upsertError);

    res.json({
      stats,
      engagementScore,
      interpretation: engagementScore > 50 ? 'Power User' : engagementScore > 20 ? 'Active Learner' : 'Getting Started',
      trends: [
        { name: 'Uploads', value: stats.uploads },
        { name: 'Requests', value: stats.requests },
        { name: 'Bookmarks', value: stats.bookmarks }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
