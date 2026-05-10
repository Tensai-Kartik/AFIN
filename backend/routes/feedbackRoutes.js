const express = require('express');
const router = express.Router();

// Simple keyword-based sentiment scorer
const positiveWords = ['good', 'great', 'excellent', 'amazing', 'helpful', 'kind', 'knowledgeable', 'clear', 'best', 'wonderful', 'fantastic', 'inspiring', 'thorough', 'brilliant', 'patient'];
const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'boring', 'unclear', 'confusing', 'unhelpful', 'rude', 'worst', 'slow', 'disappointing', 'waste', 'absent', 'lazy'];

function calculateSentiment(text, rating) {
  if (!text) return (rating - 5) / 5; // normalize rating to -1..+1
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/);
  let score = 0;
  words.forEach(w => {
    if (positiveWords.includes(w)) score += 1;
    if (negativeWords.includes(w)) score -= 1;
  });
  // Blend text sentiment with rating sentiment
  const ratingScore = (rating - 5.5) / 4.5; // normalize 1-10 to ~-1..+1
  const textScore = words.length > 0 ? Math.max(-1, Math.min(1, score / Math.max(1, words.length) * 5)) : 0;
  return Math.round(((ratingScore + textScore) / 2) * 100) / 100;
}

// POST /api/feedback/create — Anonymous, no user_id stored
router.post('/create', async (req, res) => {
  try {
    // 1. Role Check (Block Admins)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error: authError } = await req.supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: dbUser } = await req.supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (dbUser && dbUser.role === 'admin') {
          return res.status(403).json({ error: 'Access denied. Administrators cannot submit feedback.' });
        }
      }
    }

    const { rating, comment, subject, faculty_name } = req.body;

    if (!rating || !subject || !faculty_name) {
      return res.status(400).json({ error: 'Rating, subject, and faculty_name are required.' });
    }

    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10.' });
    }

    const sentiment_score = calculateSentiment(comment, rating);

    const { data, error } = await req.supabase
      .from('feedback')
      .insert([{ rating: parseInt(rating), comment, subject, faculty_name, sentiment_score }])
      .select();

    if (error) throw error;

    console.log(`[FEEDBACK CREATED] Rating: ${rating}, Subject: ${subject}, Faculty: ${faculty_name}`);

    res.json({ message: 'Feedback submitted anonymously. Thank you!', id: data[0].id });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// POST /api/feedback/app — Authenticated

router.post('/app', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await req.supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { feedback_type, subject, message, screenshot_url } = req.body;

    if (!feedback_type || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const { data, error } = await req.supabase
      .from('app_feedback')
      .insert([{ 
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || 'Unknown',
        user_email: user.email || '',
        feedback_type,
        subject,
        message,
        screenshot_url
      }])
      .select();

    if (error) throw error;


    res.json({ message: 'Feedback submitted successfully.', feedback: data[0] });
  } catch (error) {
    console.error('Error submitting app feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

module.exports = router;
