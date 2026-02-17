/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} - Radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated travel time in minutes
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeed - Average speed in km/h (default 40)
 * @returns {number} - Estimated minutes
 */
function calculateTravelTime(distanceKm, avgSpeed = 40) {
    const hours = distanceKm / avgSpeed;
    const minutes = Math.ceil(hours * 60);
    return minutes;
}

/**
 * Generate Google Maps direction link
 * @param {number} fromLat
 * @param {number} fromLon
 * @param {number} toLat
 * @param {number} toLon
 * @returns {string} - Google Maps URL
 */
function getGoogleMapsLink(fromLat, fromLon, toLat, toLon) {
    return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLon}&destination=${toLat},${toLon}&travelmode=driving`;
}

module.exports = {
    calculateDistance,
    calculateTravelTime,
    getGoogleMapsLink
};
