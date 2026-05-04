const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/placement/companies
router.get('/companies', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('visit_date', { ascending: true });

    if (error) throw error;
    res.json({ companies: data });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies.' });
  }
});

// GET /api/placement/eligible — Get companies user is eligible for
router.get('/eligible', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's CGPA
    const { data: userData, error: userError } = await req.supabase
      .from('users')
      .select('cgpa')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const userCgpa = userData?.cgpa || 0;

    // Get companies where user meets CGPA requirement
    const { data, error } = await req.supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .lte('min_cgpa', userCgpa)
      .order('visit_date', { ascending: true });

    if (error) throw error;
    res.json({ companies: data, user_cgpa: userCgpa });
  } catch (error) {
    console.error('Error fetching eligible companies:', error);
    res.status(500).json({ error: 'Failed to fetch eligible companies.' });
  }
});

// POST /api/placement/apply
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { company_id } = req.body;
    const userId = req.user.id;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required.' });
    }

    const { data, error } = await req.supabase
      .from('applications')
      .insert([{ user_id: userId, company_id, status: 'applied' }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You have already applied to this company.' });
      }
      throw error;
    }

    res.json({ message: 'Application submitted successfully!', application: data[0] });
  } catch (error) {
    console.error('Error applying:', error);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

// GET /api/placement/my-applications
router.get('/my-applications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await req.supabase
      .from('applications')
      .select('*, companies(name, package_lpa, visit_date, required_skills)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ applications: data });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

module.exports = router;
