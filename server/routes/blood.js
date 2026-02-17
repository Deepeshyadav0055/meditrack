const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authenticateUser, requireHospitalStaff } = require('../middleware/auth');
const { updateLimiter } = require('../middleware/rateLimit');
const { checkBloodThresholds } = require('../utils/thresholds');

/**
 * GET /api/blood
 * Get hospitals filtered by blood group and availability
 * Query params: ?city=Mumbai&group=O+&minUnits=1
 */
router.get('/', async (req, res) => {
    try {
        const { city, group, minUnits = 1 } = req.query;

        let query = supabase
            .from('blood_inventory')
            .select(`
        *,
        hospitals(*)
      `)
            .gte('units_available', parseInt(minUnits));

        if (group) {
            query = query.eq('blood_group', group);
        }

        const { data: bloodInventory, error } = await query;

        if (error) throw error;

        // Filter by city if specified
        let filtered = bloodInventory;
        if (city) {
            filtered = bloodInventory.filter(blood => blood.hospitals.city === city);
        }

        // Group by hospital
        const hospitalMap = new Map();
        filtered.forEach(blood => {
            const hospitalId = blood.hospital_id;
            if (!hospitalMap.has(hospitalId)) {
                hospitalMap.set(hospitalId, {
                    hospital: blood.hospitals,
                    blood_inventory: []
                });
            }
            hospitalMap.get(hospitalId).blood_inventory.push({
                id: blood.id,
                blood_group: blood.blood_group,
                units_available: blood.units_available,
                units_reserved: blood.units_reserved,
                last_updated: blood.last_updated
            });
        });

        const results = Array.from(hospitalMap.values());

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error fetching blood inventory:', error);
        res.status(500).json({ error: 'Failed to fetch blood availability' });
    }
});

/**
 * PATCH /api/blood/:id
 * Update blood inventory (requires authentication)
 * Body: { units_available: number, units_reserved?: number }
 */
router.patch('/:id', authenticateUser, requireHospitalStaff, updateLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { units_available, units_reserved } = req.body;

        if (typeof units_available !== 'number' || units_available < 0) {
            return res.status(400).json({ error: 'Invalid units_available value' });
        }

        // Get current blood data
        const { data: currentBlood, error: fetchError } = await supabase
            .from('blood_inventory')
            .select('*, hospitals(name, city)')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Verify staff belongs to this hospital
        if (currentBlood.hospital_id !== req.staff.hospital_id) {
            return res.status(403).json({ error: 'Not authorized to update this hospital' });
        }

        const updateData = {
            units_available: units_available,
            updated_by: req.user.id
        };

        if (typeof units_reserved === 'number' && units_reserved >= 0) {
            updateData.units_reserved = units_reserved;
        }

        // Update blood inventory
        const { data: updatedBlood, error: updateError } = await supabase
            .from('blood_inventory')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log the update
        await supabase.from('update_logs').insert({
            hospital_id: currentBlood.hospital_id,
            update_type: 'blood',
            field_changed: currentBlood.blood_group,
            old_value: currentBlood.units_available,
            new_value: units_available,
            changed_by: req.user.id
        });

        // Check thresholds and create alerts if needed
        const alerts = await checkBloodThresholds(
            currentBlood.hospital_id,
            currentBlood.blood_group,
            units_available,
            currentBlood.hospitals.name
        );

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(currentBlood.hospitals.city).emit('blood_updated', {
                hospital_id: currentBlood.hospital_id,
                hospital_name: currentBlood.hospitals.name,
                blood_group: currentBlood.blood_group,
                units_available: units_available,
                units_reserved: updateData.units_reserved || currentBlood.units_reserved
            });

            // Emit alerts if any
            if (alerts.length > 0) {
                alerts.forEach(alert => {
                    io.to(currentBlood.hospitals.city).emit('alert_created', {
                        hospital_name: currentBlood.hospitals.name,
                        message: alert.message,
                        severity: alert.severity
                    });
                });
            }
        }

        res.json({
            success: true,
            data: updatedBlood,
            alerts: alerts
        });
    } catch (error) {
        console.error('Error updating blood inventory:', error);
        res.status(500).json({ error: 'Failed to update blood inventory' });
    }
});

module.exports = router;
