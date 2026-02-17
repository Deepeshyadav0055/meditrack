require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;

let client = null;

// Only initialize Claude if valid API key is provided
if (apiKey && apiKey.length > 10) {
    try {
        client = new Anthropic({
            apiKey: apiKey,
        });
        console.log('✅ Claude AI service initialized');
    } catch (error) {
        console.warn('⚠️  Claude AI initialization failed:', error.message);
        console.warn('AI recommendations will be disabled');
    }
} else {
    console.log('ℹ️  Claude AI not configured - AI recommendations disabled (this is optional)');
}

/**
 * Get AI recommendation for hospital selection
 * @param {string} patientDescription - Description of patient condition
 * @param {array} hospitalData - Array of hospital objects with availability data
 * @param {object} location - { latitude, longitude } of patient
 * @returns {Promise<string>} - AI recommendation text
 */
async function getHospitalRecommendation(patientDescription, hospitalData, location) {
    if (!client) {
        throw new Error('Anthropic API not configured');
    }

    const systemPrompt = `You are a medical resource assistant for emergency situations in Indian government hospitals. You have access to real-time bed and blood availability data. Given a patient description and current hospital data, recommend the best 3 hospitals. Be concise, clear, and prioritize proximity and availability. Always include the phone number of recommended hospitals. Format: numbered list with hospital name, why recommended, distance, available resources.`;

    const userPrompt = `Patient Situation: ${patientDescription}

Available Hospitals:
${JSON.stringify(hospitalData, null, 2)}

Patient Location: Lat ${location.latitude}, Long ${location.longitude}

Please recommend the top 3 hospitals for this patient and explain your reasoning.`;

    try {
        const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            system: systemPrompt
        });

        return message.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API:', error.message);
        throw error;
    }
}

module.exports = {
    getHospitalRecommendation
};
