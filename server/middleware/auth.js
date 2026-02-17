const supabase = require('../services/supabase');

/**
 * Middleware to verify Supabase JWT token
 */
async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Middleware to check if user is hospital staff
 */
async function requireHospitalStaff(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const { data: staff, error } = await supabase
            .from('hospital_staff')
            .select('*, hospitals(name)')
            .eq('user_id', req.user.id)
            .eq('is_active', true)
            .single();

        if (error || !staff) {
            return res.status(403).json({ error: 'Not authorized as hospital staff' });
        }

        req.staff = staff;
        next();
    } catch (error) {
        console.error('Staff check error:', error);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
}

/**
 * Middleware to check if user is admin
 */
async function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const { data: staff, error } = await supabase
            .from('hospital_staff')
            .select('role')
            .eq('user_id', req.user.id)
            .eq('is_active', true)
            .single();

        if (error || !staff || staff.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.staff = staff;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
}

module.exports = {
    authenticateUser,
    requireHospitalStaff,
    requireAdmin
};
