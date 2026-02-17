
const supabase = require('../services/supabase');
const { sendCriticalAlert } = require('../services/twilio');

/**
 * Alert thresholds configuration
 */
const THRESHOLDS = {
    ICU_CRITICAL: 2,
    ICU_HIGH: 5,
    BLOOD_CRITICAL: 0,
    BLOOD_HIGH: 3,
    ANY_BED_CRITICAL: 0
};

/**
 * Check bed availability and create alerts if needed
 * @param {string} hospitalId - Hospital UUID
 * @param {string} bedType - Type of bed
 * @param {number} availableBeds - Number of available beds
 * @param {string} hospitalName - Hospital name for alert message
 */
async function checkBedThresholds(hospitalId, bedType, availableBeds, hospitalName) {
    const alerts = [];

    // ICU critical threshold
    if (bedType === 'ICU' && availableBeds < THRESHOLDS.ICU_CRITICAL) {
        const alert = await createAlert(
            hospitalId,
            'bed_shortage',
            `CRITICAL: Only ${availableBeds} ICU bed(s) available at ${hospitalName}`,
            'critical'
        );
        alerts.push(alert);

        // Send SMS to district officer
        await sendCriticalAlert(
            hospitalName,
            `Only ${availableBeds} ICU bed(s) remaining. Immediate action required.`
        );
    }
    // ICU high threshold
    else if (bedType === 'ICU' && availableBeds < THRESHOLDS.ICU_HIGH) {
        const alert = await createAlert(
            hospitalId,
            'bed_shortage',
            `WARNING: Only ${availableBeds} ICU beds available at ${hospitalName}`,
            'high'
        );
        alerts.push(alert);
    }

    // Any bed type completely full
    if (availableBeds === THRESHOLDS.ANY_BED_CRITICAL) {
        const alert = await createAlert(
            hospitalId,
            'bed_full',
            `CRITICAL: ${bedType} beds are completely full at ${hospitalName}`,
            'critical'
        );
        alerts.push(alert);

        // Send SMS
        await sendCriticalAlert(
            hospitalName,
            `${bedType} beds are completely full. No capacity available.`
        );
    }

    return alerts;
}

/**
 * Check blood availability and create alerts if needed
 * @param {string} hospitalId - Hospital UUID
 * @param {string} bloodGroup - Blood group
 * @param {number} unitsAvailable - Units available
 * @param {string} hospitalName - Hospital name for alert message
 */
async function checkBloodThresholds(hospitalId, bloodGroup, unitsAvailable, hospitalName) {
    const alerts = [];

    // Blood critical (completely out)
    if (unitsAvailable === THRESHOLDS.BLOOD_CRITICAL) {
        const alert = await createAlert(
            hospitalId,
            'blood_shortage',
            `CRITICAL: ${bloodGroup} blood completely out of stock at ${hospitalName}`,
            'critical'
        );
        alerts.push(alert);

        // Send SMS
        await sendCriticalAlert(
            hospitalName,
            `${bloodGroup} blood is OUT OF STOCK. Urgent replenishment needed.`
        );
    }
    // Blood high threshold
    else if (unitsAvailable <= THRESHOLDS.BLOOD_HIGH) {
        const alert = await createAlert(
            hospitalId,
            'blood_shortage',
            `WARNING: Only ${unitsAvailable} unit(s) of ${bloodGroup} blood at ${hospitalName}`,
            'high'
        );
        alerts.push(alert);
    }

    return alerts;
}

/**
 * Create an alert in the database
 * @param {string} hospitalId
 * @param {string} alertType
 * @param {string} message
 * @param {string} severity - 'low', 'medium', 'high', 'critical'
 * @returns {Promise<object>} - Created alert object
 */
async function createAlert(hospitalId, alertType, message, severity) {
    const { data, error } = await supabase
        .from('alerts')
        .insert({
            hospital_id: hospitalId,
            alert_type: alertType,
            message: message,
            severity: severity,
            is_resolved: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating alert:', error);
        throw error;
    }

    return data;
}

module.exports = {
    THRESHOLDS,
    checkBedThresholds,
    checkBloodThresholds,
    createAlert
};
