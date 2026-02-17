require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Only initialize Twilio if valid credentials are provided
if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
    try {
        client = twilio(accountSid, authToken);
        console.log('✅ Twilio SMS service initialized');
    } catch (error) {
        console.warn('⚠️  Twilio initialization failed:', error.message);
        console.warn('SMS notifications will be disabled');
    }
} else {
    console.log('ℹ️  Twilio not configured - SMS notifications disabled (this is optional)');
}

/**
 * Send SMS notification
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - Message body
 * @returns {Promise<object>} - Twilio message object
 */
async function sendSMS(to, message) {
    if (!client) {
        console.warn('Twilio not configured, skipping SMS:', message);
        return { success: false, error: 'Twilio not configured' };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioPhone,
            to: to
        });
        console.log(`SMS sent to ${to}: ${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('Error sending SMS:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send critical alert SMS to district officer
 * @param {string} hospitalName - Name of the hospital
 * @param {string} alertMessage - Alert message
 */
async function sendCriticalAlert(hospitalName, alertMessage) {
    const districtOfficerPhone = process.env.DISTRICT_OFFICER_PHONE;

    if (!districtOfficerPhone) {
        console.warn('District officer phone not configured');
        return;
    }

    const message = `🚨 CRITICAL ALERT - ${hospitalName}\n\n${alertMessage}\n\nMediTrack System`;

    return await sendSMS(districtOfficerPhone, message);
}

module.exports = {
    sendSMS,
    sendCriticalAlert
};
