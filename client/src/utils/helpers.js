export function getBedStatusColor(available, total) {
    if (available === 0) return 'status-critical';
    const percentage = (available / total) * 100;
    if (percentage < 20) return 'status-warning';
    return 'status-available';
}

export function getBloodStatusColor(units) {
    if (units === 0) return 'status-critical';
    if (units <= 3) return 'status-warning';
    return 'status-available';
}

export function getSeverityColor(severity) {
    const colors = {
        critical: 'bg-medical-critical text-white',
        high: 'bg-medical-warning text-gray-900',
        medium: 'bg-medical-info text-white',
        low: 'bg-gray-400 text-white'
    };
    return colors[severity] || colors.medium;
}

export function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

export function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
