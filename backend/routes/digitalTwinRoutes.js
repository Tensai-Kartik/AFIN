const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch student metrics from DB, if none exist, create a default record
    let { data: metrics, error: metricsError } = await req.supabase
      .from('student_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (metricsError && metricsError.code === 'PGRST116') { // not found
      const defaultMetrics = {
        user_id: userId,
        attendance_percentage: 75, // Sample default attendance
        uploads_count: 0,
        downloads_count: 0,
        requests_count: 0,
      };
      
      const { data: newMetrics, error: insertError } = await req.supabase
        .from('student_metrics')
        .insert(defaultMetrics)
        .select()
        .single();
        
      if (insertError) throw insertError;
      metrics = newMetrics;
    } else if (metricsError) {
      throw metricsError;
    }

    // You might want to update metrics from actual tables like analyticsRoutes does, 
    // but the prompt implied we read from student_metrics.
    // Let's do a quick sync from actual usage as well for real insights:
    const [contentRes, requestsRes] = await Promise.all([
      req.supabase.from('content').select('*', { count: 'exact', head: true }).eq('uploader_id', userId),
      req.supabase.from('requests').select('*', { count: 'exact', head: true }).eq('author_id', userId),
    ]);
    
    const uploads = contentRes.count || metrics.uploads_count;
    const requests = requestsRes.count || metrics.requests_count;
    const totalActivity = uploads + requests + metrics.downloads_count;

    // Derived Fields Logic (Lightweight)
    let failure_risk = 'low';
    if (metrics.attendance_percentage < 60) {
      failure_risk = 'high';
    } else if (metrics.attendance_percentage < 75) {
      failure_risk = 'medium';
    }

    let burnout_risk = 'low';
    if (totalActivity < 2) {
      burnout_risk = 'high'; // lack of engagement/motivation
    } else if (totalActivity < 5) {
      burnout_risk = 'medium';
    }

    let engagement_score = 'low';
    if (totalActivity > 10) {
      engagement_score = 'high';
    } else if (totalActivity > 4) {
      engagement_score = 'medium';
    }

    // Study Plan Generation
    let studyPlan = [];
    if (failure_risk === 'high') {
      studyPlan.push('Warning: Attendance is critically low. Focus on attending all upcoming classes.');
      studyPlan.push('Review recorded lectures for missed sessions.');
    } else if (failure_risk === 'medium') {
      studyPlan.push('Maintain attendance above 75% to stay safe.');
    }
    
    if (burnout_risk === 'high' || engagement_score === 'low') {
      studyPlan.push('Try to download notes or ask for help in requests to boost your engagement.');
      studyPlan.push('Focus 1 hour/day on core subjects and gradually increase.');
    } else {
      studyPlan.push('Great job staying engaged! Continue your current study habits.');
    }

    // Save derived back to DB just in case? No, the prompt says "CALCULATED IN BACKEND", we return them on the fly.
    
    res.json({
      attendance: metrics.attendance_percentage,
      activity: {
        uploads,
        downloads: metrics.downloads_count,
        requests
      },
      engagement_score,
      risk_indicators: {
        burnout_risk,
        failure_risk
      },
      suggested_actions: studyPlan
    });

  } catch (error) {
    console.error('[DIGITAL TWIN ERROR]', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
