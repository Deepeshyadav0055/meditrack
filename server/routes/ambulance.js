const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { calculateDistance, calculateTravelTime, getGoogleMapsLink } = require('../utils/distance');

/**
 * POST /api/ambulance/nearest
 * Find nearest hospitals based on location and resource needs
 * Body: {
 *   latitude: number,
 *   longitude: number,
 *   need_type: 'ICU' | 'general' | 'blood' | etc,
 *   blood_group?: string,
 *   min_available?: number
 * }
 */
router.post('/nearest', async (req, res) => {
    try {
        const { latitude, longitude, need_type, blood_group, min_available = 1 } = req.body;

        if (!latitude || !longitude || !need_type) {
            return res.status(400).json({
                error: 'Missing required fields: latitude, longitude, need_type'
            });
        }

        let hospitals = [];

        if (need_type === 'blood') {
            // Blood requirement
            if (!blood_group) {
                return res.status(400).json({ error: 'blood_group required for blood need_type' });
            }

            const { data, error } = await supabase
                .from('blood_inventory')
                .select(`
          *,
          hospitals(*)
        `)
                .eq('blood_group', blood_group)
                .gte('units_available', min_available)
                .eq('hospitals.is_active', true);

            if (error) throw error;

            hospitals = data.map(blood => ({
                hospital: blood.hospitals,
                resource_type: 'blood',
                blood_group: blood.blood_group,
                units_available: blood.units_available,
                last_updated: blood.last_updated
            }));
        } else {
            // Bed requirement
            const { data, error } = await supabase
                .from('bed_inventory')
                .select(`
          *,
          hospitals(*)
        `)
                .eq('bed_type', need_type)
                .gte('available_beds', min_available)
                .eq('hospitals.is_active', true);

            if (error) throw error;

            hospitals = data.map(bed => ({
                hospital: bed.hospitals,
                resource_type: 'bed',
                bed_type: bed.bed_type,
                available_beds: bed.available_beds,
                total_beds: bed.total_beds,
                last_updated: bed.last_updated
            }));
        }

        // Calculate distances
        const hospitalsWithDistance = hospitals
            .filter(h => h.hospital.latitude && h.hospital.longitude)
            .map(h => {
                const distance_km = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(h.hospital.latitude),
                    parseFloat(h.hospital.longitude)
                );
                const estimated_minutes = calculateTravelTime(distance_km);
                const google_maps_link = getGoogleMapsLink(
                    latitude,
                    longitude,
                    parseFloat(h.hospital.latitude),
                    parseFloat(h.hospital.longitude)
                );

                return {
                    hospital_id: h.hospital.id,
                    hospital_name: h.hospital.name,
                    address: h.hospital.address,
                    city: h.hospital.city,
                    phone: h.hospital.phone,
                    distance_km,
                    estimated_minutes,
                    google_maps_link,
                    resource_type: h.resource_type,
                    ...(h.resource_type === 'bed' ? {
                        bed_type: h.bed_type,
                        available_beds: h.available_beds,
                        total_beds: h.total_beds
                    } : {
                        blood_group: h.blood_group,
                        units_available: h.units_available
                    }),
                    last_updated: h.last_updated
                };
            });

        // Sort by distance and get top 5
        const nearest = hospitalsWithDistance
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, 5);

        res.json({
            success: true,
            count: nearest.length,
            search_params: {
                location: { latitude, longitude },
                need_type,
                blood_group,
                min_available
            },
            data: nearest
        });
    } catch (error) {
        console.error('Error finding nearest hospitals:', error);
        res.status(500).json({ error: 'Failed to find nearest hospitals' });
    }
});

module.exports = router;
