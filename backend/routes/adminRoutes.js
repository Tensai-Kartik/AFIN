const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/admin/pending-users
router.get('/pending-users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('users')
      .select('*')
      .eq('status', 'pending')
      .not('prn', 'is', null) // Ensure they have actually submitted the form
      .not('prn', 'ilike', 'PENDING-%') // Exclude those who haven't set a real PRN yet
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending users:', error);
      return res.status(500).json({ error: 'Failed to fetch pending users.' });
    }

    res.json({ users: data });
  } catch (error) {
    console.error('Admin pending-users error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/verify-user
router.post('/verify-user', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { targetUserId, action } = req.body; // action: 'approve' | 'reject'
    const adminId = req.user.id;

    if (!targetUserId || !action) {
      return res.status(400).json({ error: 'Missing targetUserId or action.' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject".' });
    }

    let newStatus = action === 'approve' ? 'verified' : 'rejected';
    let newRole = action === 'approve' ? 'verified_student' : 'user';

    // Update user
    const { data, error } = await req.supabase
      .from('users')
      .update({
        status: newStatus,
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select();

    if (error) {
      console.error('Error verifying user:', error);
      return res.status(500).json({ error: 'Failed to verify user.' });
    }

    // Log the action
    await req.supabase
      .from('audit_logs')
      .insert([
        {
          action: `admin_${action}_user`,
          actor_id: adminId,
          target_type: 'user',
          target_id: targetUserId
        }
      ]);

    res.json({ message: `User ${action}d successfully.`, user: data[0] });
  } catch (error) {
    console.error('Admin verify-user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/pending-content
router.get('/pending-content', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('content')
      .select(`
        *,
        users (
          full_name,
          prn
        )
      `)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending content:', error);
      return res.status(500).json({ error: 'Failed to fetch pending content.' });
    }

    res.json({ content: data });
  } catch (error) {
    console.error('Admin pending-content error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/verify-content
router.post('/verify-content', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { targetContentId, action } = req.body; // action: 'approve' | 'reject'
    const adminId = req.user.id;

    if (!targetContentId || !action) {
      return res.status(400).json({ error: 'Missing targetContentId or action.' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject".' });
    }

    let newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update content
    const { data, error } = await req.supabase
      .from('content')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetContentId)
      .select();

    if (error) {
      console.error('Error verifying content:', error);
      return res.status(500).json({ error: 'Failed to verify content.' });
    }

    // Log the action
    await req.supabase
      .from('audit_logs')
      .insert([
        {
          action: `admin_${action}_content`,
          actor_id: adminId,
          target_type: 'content',
          target_id: targetContentId
        }
      ]);

    // Award +20 points if content approved
    if (action === 'approve' && data && data[0] && data[0].uploader_id) {
      await req.supabase.rpc('add_user_points', { p_user_id: data[0].uploader_id, p_amount: 20 });
    }

    res.json({ message: `Content ${action}d successfully.`, content: data[0] });
  } catch (error) {
    console.error('Admin verify-content error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/pending-notices
router.get('/pending-notices', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('notices')
      .select(`
        *,
        users (
          full_name,
          prn
        )
      `)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending notices:', error);
      return res.status(500).json({ error: 'Failed to fetch pending notices.' });
    }

    res.json({ notices: data });
  } catch (error) {
    console.error('Admin pending-notices error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/verify-notice
router.post('/verify-notice', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { targetNoticeId, action } = req.body; // action: 'approve' | 'reject'
    const adminId = req.user.id;

    if (!targetNoticeId || !action) {
      return res.status(400).json({ error: 'Missing targetNoticeId or action.' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject".' });
    }

    let newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update notice
    const { data, error } = await req.supabase
      .from('notices')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetNoticeId)
      .select();

    if (error) {
      console.error('Error verifying notice:', error);
      return res.status(500).json({ error: 'Failed to verify notice.' });
    }

    // Log the action
    await req.supabase
      .from('audit_logs')
      .insert([
        {
          action: `admin_${action}_notice`,
          actor_id: adminId,
          target_type: 'notice',
          target_id: targetNoticeId
        }
      ]);

    res.json({ message: `Notice ${action}d successfully.`, notice: data[0] });
  } catch (error) {
    console.error('Admin verify-notice error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/feedback
router.get('/feedback', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log(`[ADMIN FETCH] Fetching all feedback...`);
    const { data, error } = await req.supabase
      .from('feedback')
      .select('id, rating, comment, subject, faculty_name, sentiment_score, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data.length;
    const avgRating = total > 0 ? data.reduce((sum, f) => sum + f.rating, 0) / total : 0;
    const avgSentiment = total > 0 ? data.reduce((sum, f) => sum + (f.sentiment_score || 0), 0) / total : 0;

    // Group by faculty
    const byFaculty = {};
    data.forEach(f => {
      if (!byFaculty[f.faculty_name]) {
        byFaculty[f.faculty_name] = { count: 0, total_rating: 0, ratings: [] };
      }
      byFaculty[f.faculty_name].count++;
      byFaculty[f.faculty_name].total_rating += f.rating;
      byFaculty[f.faculty_name].ratings.push(f.rating);
    });

    const facultySummary = Object.entries(byFaculty).map(([name, stats]) => ({
      faculty_name: name,
      count: stats.count,
      avg_rating: Math.round((stats.total_rating / stats.count) * 10) / 10
    })).sort((a, b) => b.avg_rating - a.avg_rating);

    res.json({
      total,
      avg_rating: Math.round(avgRating * 10) / 10,
      avg_sentiment: Math.round(avgSentiment * 100) / 100,
      by_faculty: facultySummary,
      feedback: data
    });
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    res.status(500).json({ error: 'Failed to fetch feedback summary.' });
  }
});

module.exports = router;
