const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authenticateUser, requireHospitalStaff } = require('../middleware/auth');
const { updateLimiter } = require('../middleware/rateLimit');
const { checkBedThresholds } = require('../utils/thresholds');

/**
 * GET /api/beds
 * Get hospitals filtered by bed type and availability
 * Query params: ?city=Mumbai&type=ICU&minAvailable=1
 */
router.get('/', async (req, res) => {
    try {
        const { city, type, minAvailable = 1 } = req.query;

        let query = supabase
            .from('bed_inventory')
            .select(`
        *,
        hospitals(*)
      `)
            .gte('available_beds', parseInt(minAvailable));

        if (type) {
            query = query.eq('bed_type', type);
        }

        const { data: beds, error } = await query;

        if (error) throw error;

        // Filter by city if specified
        let filteredBeds = beds;
        if (city) {
            filteredBeds = beds.filter(bed => bed.hospitals.city === city);
        }

        // Group by hospital
        const hospitalMap = new Map();
        filteredBeds.forEach(bed => {
            const hospitalId = bed.hospital_id;
            if (!hospitalMap.has(hospitalId)) {
                hospitalMap.set(hospitalId, {
                    hospital: bed.hospitals,
                    beds: []
                });
            }
            hospitalMap.get(hospitalId).beds.push({
                id: bed.id,
                bed_type: bed.bed_type,
                total_beds: bed.total_beds,
                available_beds: bed.available_beds,
                last_updated: bed.last_updated
            });
        });

        const results = Array.from(hospitalMap.values());

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error fetching beds:', error);
        res.status(500).json({ error: 'Failed to fetch bed availability' });
    }
});

/**
 * PATCH /api/beds/:id
 * Update bed availability (requires authentication)
 * Body: { available_beds: number }
 */
router.patch('/:id', authenticateUser, requireHospitalStaff, updateLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { available_beds } = req.body;

        if (typeof available_beds !== 'number' || available_beds < 0) {
            return res.status(400).json({ error: 'Invalid available_beds value' });
        }

        // Get current bed data
        const { data: currentBed, error: fetchError } = await supabase
            .from('bed_inventory')
            .select('*, hospitals(name)')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Verify staff belongs to this hospital
        if (currentBed.hospital_id !== req.staff.hospital_id) {
            return res.status(403).json({ error: 'Not authorized to update this hospital' });
        }

        // Check if available_beds exceeds total_beds
        if (available_beds > currentBed.total_beds) {
            return res.status(400).json({
                error: `Available beds (${available_beds}) cannot exceed total beds (${currentBed.total_beds})`
            });
        }

        // Update bed inventory
        const { data: updatedBed, error: updateError } = await supabase
            .from('bed_inventory')
            .update({
                available_beds: available_beds,
                updated_by: req.user.id
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log the update
        await supabase.from('update_logs').insert({
            hospital_id: currentBed.hospital_id,
            update_type: 'bed',
            field_changed: currentBed.bed_type,
            old_value: currentBed.available_beds,
            new_value: available_beds,
            changed_by: req.user.id
        });

        // Check thresholds and create alerts if needed
        const alerts = await checkBedThresholds(
            currentBed.hospital_id,
            currentBed.bed_type,
            available_beds,
            currentBed.hospitals.name
        );

        // Emit socket event (will be handled by socket service)
        const io = req.app.get('io');
        if (io) {
            io.to(currentBed.hospitals.city).emit('bed_updated', {
                hospital_id: currentBed.hospital_id,
                hospital_name: currentBed.hospitals.name,
                bed_type: currentBed.bed_type,
                available_beds: available_beds,
                total_beds: currentBed.total_beds
            });

            // Emit alerts if any
            if (alerts.length > 0) {
                alerts.forEach(alert => {
                    io.to(currentBed.hospitals.city).emit('alert_created', {
                        hospital_name: currentBed.hospitals.name,
                        message: alert.message,
                        severity: alert.severity
                    });
                });
            }
        }

        res.json({
            success: true,
            data: updatedBed,
            alerts: alerts
        });
    } catch (error) {
        console.error('Error updating bed inventory:', error);
        res.status(500).json({ error: 'Failed to update bed inventory' });
    }
});

module.exports = router;
