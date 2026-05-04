const express = require('express');
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * POST /api/content/reply-request
 * Submit a response/solution to a specific request
 */
router.post('/reply-request', verifyToken, requireVerifiedStudent, async (req, res) => {
  try {
    const { 
      request_id, 
      title, 
      description, 
      subject, 
      semester, 
      type, 
      file_url 
    } = req.body;
    
    const uploaderId = req.user.id;

    if (!request_id || !title || !subject || !semester || !type || !file_url) {
      return res.status(400).json({ error: 'Missing required fields for content reply.' });
    }

    // 1. Insert into content table
    const { data, error } = await req.supabase
      .from('content')
      .insert([
        {
          title,
          description,
          subject,
          semester: parseInt(semester),
          type,
          file_url,
          uploader_id: uploaderId,
          request_id,
          status: 'pending' // Requires admin approval
        }
      ])
      .select();

    if (error) throw error;

    // 2. Award +10 points to the uploader
    await req.supabase.rpc('add_user_points', { 
      p_user_id: uploaderId, 
      p_amount: 10 
    });

    // 3. Create a notification for the request author (optional but good)
    const { data: requestData } = await req.supabase
      .from('requests')
      .select('author_id, title')
      .eq('id', request_id)
      .single();

    if (requestData && requestData.author_id !== uploaderId) {
      await req.supabase.from('notifications').insert([{
        user_id: requestData.author_id,
        title: 'New Response to Your Request',
        message: `Someone replied to your request "${requestData.title}" with new content.`,
        type: 'content_reply'
      }]);
    }

    res.json({ 
      message: 'Response submitted successfully! Awaiting admin approval.', 
      content: data[0] 
    });

  } catch (error) {
    console.error('Error replying to request:', error);
    res.status(500).json({ error: 'Failed to submit response.' });
  }
});

module.exports = router;
