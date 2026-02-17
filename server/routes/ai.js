const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { getHospitalRecommendation } = require('../services/claude');
const { aiLimiter } = require('../middleware/rateLimit');
const { calculateDistance } = require('../utils/distance');

/**
 * POST /api/ai/recommend
 * Get AI-powered hospital recommendations
 * Body: {
 *   patient_description: string,
 *   city: string,
 *   latitude: number,
 *   longitude: number
 * }
 */
router.post('/recommend', aiLimiter, async (req, res) => {
    try {
        const { patient_description, city, latitude, longitude } = req.body;

        if (!patient_description || !latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required fields: patient_description, latitude, longitude'
            });
        }

        // Fetch hospitals with availability data
        let query = supabase
            .from('hospitals')
            .select(`
        *,
        bed_inventory(*),
        blood_inventory(*)
      `)
            .eq('is_active', true);

        if (city) {
            query = query.eq('city', city);
        }

        const { data: hospitals, error } = await query;

        if (error) throw error;

        if (!hospitals || hospitals.length === 0) {
            return res.status(404).json({ error: 'No hospitals found in the specified area' });
        }

        // Calculate distances and prepare data for AI
        const hospitalsWithDistance = hospitals
            .filter(h => h.latitude && h.longitude)
            .map(h => {
                const distance_km = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(h.latitude),
                    parseFloat(h.longitude)
                );

                // Summarize bed availability
                const bedSummary = h.bed_inventory.reduce((acc, bed) => {
                    acc[bed.bed_type] = bed.available_beds;
                    return acc;
                }, {});

                // Summarize blood availability
                const bloodSummary = h.blood_inventory.reduce((acc, blood) => {
                    if (blood.units_available > 0) {
                        acc[blood.blood_group] = blood.units_available;
                    }
                    return acc;
                }, {});

                return {
                    name: h.name,
                    address: h.address,
                    phone: h.phone,
                    distance_km,
                    beds: bedSummary,
                    blood: bloodSummary,
                    total_beds_available: h.bed_inventory.reduce((sum, bed) => sum + bed.available_beds, 0)
                };
            })
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, 10); // Send top 10 to AI

        // Get AI recommendation
        const recommendation = await getHospitalRecommendation(
            patient_description,
            hospitalsWithDistance,
            { latitude, longitude }
        );

        res.json({
            success: true,
            patient_description,
            hospitals_analyzed: hospitalsWithDistance.length,
            recommendation
        });
    } catch (error) {
        console.error('Error getting AI recommendation:', error);

        if (error.message.includes('Anthropic API not configured')) {
            return res.status(503).json({
                error: 'AI service is not available. Please configure Anthropic API key.'
            });
        }

        res.status(500).json({ error: 'Failed to get AI recommendation' });
    }
});

module.exports = router;
