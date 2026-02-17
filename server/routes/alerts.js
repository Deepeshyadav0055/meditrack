const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/alerts
 * Get alerts with optional filters
 * Query params: ?city=Mumbai&resolved=false&severity=critical
 */
router.get('/', async (req, res) => {
    try {
        const { city, resolved, severity } = req.query;

        let query = supabase
            .from('alerts')
            .select(`
        *,
        hospitals(name, city, phone)
      `)
            .order('created_at', { ascending: false });

        if (resolved !== undefined) {
            query = query.eq('is_resolved', resolved === 'true');
        }

        if (severity) {
            query = query.eq('severity', severity);
        }

        const { data: alerts, error } = await query;

        if (error) throw error;

        // Filter by city if specified
        let filtered = alerts;
        if (city) {
            filtered = alerts.filter(alert => alert.hospitals.city === city);
        }

        res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

/**
 * POST /api/alerts/:id/resolve
 * Resolve an alert (admin only)
 */
router.post('/:id/resolve', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: alert, error } = await supabase
            .from('alerts')
            .update({
                is_resolved: true,
                resolved_by: req.user.id,
                resolved_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

module.exports = router;
