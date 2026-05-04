const { createClient } = require('@supabase/supabase-js');

// Helper client to verify tokens using the user's JWT
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Using the service role key client attached in index.js to get the user from token
    const { data: { user }, error } = await req.supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user details from our users table to get role and status
    const { data: dbUser, error: dbError } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Error fetching DB user:', dbError);
      return res.status(500).json({ error: 'Internal server error while fetching user details' });
    }

    req.user = user;
    req.dbUser = dbUser; // Contains role, status, prn, etc.
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.dbUser || req.dbUser.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

const requireVerifiedStudent = (req, res, next) => {
  if (!req.dbUser || (req.dbUser.role !== 'verified_student' && req.dbUser.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied. Verified student role required.' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireVerifiedStudent
};
