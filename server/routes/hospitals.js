const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');

/**
 * GET /api/hospitals
 * Get all active hospitals with bed and blood summary
 * Query params: ?city=Mumbai&district=Mumbai&state=Maharashtra
 */
router.get('/', async (req, res) => {
    try {
        const { city, district, state } = req.query;

        let query = supabase
            .from('hospitals')
            .select(`
        *,
        bed_inventory(*),
        blood_inventory(*)
      `)
            .eq('is_active', true);

        if (city) query = query.eq('city', city);
        if (district) query = query.eq('district', district);
        if (state) query = query.eq('state', state);

        const { data: hospitals, error } = await query;

        if (error) throw error;

        // Calculate summary stats for each hospital
        const hospitalsWithStats = hospitals.map(hospital => ({
            ...hospital,
            total_beds_available: hospital.bed_inventory.reduce((sum, bed) => sum + bed.available_beds, 0),
            total_beds: hospital.bed_inventory.reduce((sum, bed) => sum + bed.total_beds, 0),
            blood_groups_available: hospital.blood_inventory.filter(b => b.units_available > 0).length
        }));

        res.json({
            success: true,
            count: hospitalsWithStats.length,
            data: hospitalsWithStats
        });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
});

/**
 * GET /api/hospitals/:id
 * Get single hospital with full details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: hospital, error } = await supabase
            .from('hospitals')
            .select(`
        *,
        bed_inventory(*),
        blood_inventory(*),
        alerts(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.json({
            success: true,
            data: hospital
        });
    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ error: 'Failed to fetch hospital details' });
    }
});

module.exports = router;
