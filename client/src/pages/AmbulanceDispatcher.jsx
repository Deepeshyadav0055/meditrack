import { useState } from 'react';
import Header from '../components/Header';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ambulanceAPI } from '../services/api';

export default function AmbulanceDispatcher() {
    const [location, setLocation] = useState({ latitude: '', longitude: '' });
    const [needType, setNeedType] = useState('ICU');
    const [bloodGroup, setBloodGroup] = useState('O+');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                });
                setError('');
            },
            (error) => {
                setError('Unable to retrieve your location');
                console.error(error);
            }
        );
    };

    const handleSearch = async () => {
        if (!location.latitude || !location.longitude) {
            setError('Please provide location coordinates');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                latitude: parseFloat(location.latitude),
                longitude: parseFloat(location.longitude),
                need_type: needType,
                min_available: 1
            };

            if (needType === 'blood') {
                payload.blood_group = bloodGroup;
            }

            const response = await ambulanceAPI.findNearest(payload);
            setResults(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to find hospitals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-primary-950">
            <Header title="Ambulance Dispatcher" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="glass-card mb-6">
                    <h2 className="text-3xl font-bold text-center mb-6 text-white">
                        🚑 FIND NEAREST HOSPITAL
                    </h2>

                    {/* Location Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2 text-white">Patient Location</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="number"
                                step="any"
                                placeholder="Latitude"
                                value={location.latitude}
                                onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                                className="input-field"
                            />
                            <input
                                type="number"
                                step="any"
                                placeholder="Longitude"
                                value={location.longitude}
                                onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                                className="input-field"
                            />
                            <button
                                onClick={handleGetLocation}
                                className="btn-primary"
                            >
                                📍 Use My Location
                            </button>
                        </div>
                    </div>

                    {/* Resource Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2 text-white">Resource Needed</label>
                        <select
                            value={needType}
                            onChange={(e) => setNeedType(e.target.value)}
                            className="input-field"
                        >
                            <option value="ICU">ICU Bed</option>
                            <option value="general">General Bed</option>
                            <option value="paediatric">Paediatric Bed</option>
                            <option value="maternity">Maternity Bed</option>
                            <option value="isolation">Isolation Bed</option>
                            <option value="emergency">Emergency Bed</option>
                            <option value="ventilator">Ventilator</option>
                            <option value="blood">Blood</option>
                        </select>
                    </div>

                    {/* Blood Group Selector */}
                    {needType === 'blood' && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2 text-white">Blood Group</label>
                            <select
                                value={bloodGroup}
                                onChange={(e) => setBloodGroup(e.target.value)}
                                className="input-field"
                            >
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full btn-danger text-xl py-4 disabled:opacity-50"
                    >
                        {loading ? 'SEARCHING...' : '🔍 SEARCH NEAREST HOSPITALS'}
                    </button>

                    {error && (
                        <div className="mt-4 p-4 bg-medical-critical text-white rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Results */}
                {loading ? (
                    <LoadingSkeleton count={3} />
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            📍 Nearest Hospitals ({results.length})
                        </h3>
                        {results.map((result, idx) => (
                            <div key={idx} className={`card border-l-4 border-medical-info stagger-item`} style={{ animationDelay: `${idx * 0.15}s` }}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            #{idx + 1} {result.hospital_name}
                                        </div>
                                        <div className="text-sm text-gray-600">{result.address}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="stat-card">
                                        <div className="text-xs opacity-90">Distance</div>
                                        <div className="text-2xl font-bold">{result.distance_km} km</div>
                                    </div>

                                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-4 py-3 rounded-lg text-center shadow-lg">
                                        <div className="text-xs opacity-90">ETA</div>
                                        <div className="text-2xl font-bold">~{result.estimated_minutes} min</div>
                                    </div>

                                    <div className="stat-card stat-card-success">
                                        <div className="text-xs opacity-90">Available</div>
                                        <div className="text-2xl font-bold">
                                            {result.resource_type === 'bed' ? result.available_beds : result.units_available}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-gray-600 to-gray-800 text-white px-4 py-3 rounded-lg text-center shadow-lg">
                                        <div className="text-xs opacity-90">Type</div>
                                        <div className="text-lg font-bold">
                                            {result.resource_type === 'bed' ? result.bed_type : result.blood_group}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <a
                                        href={`tel:${result.phone}`}
                                        className="btn-success text-center"
                                    >
                                        📞 CALL HOSPITAL
                                    </a>
                                    <a
                                        href={result.google_maps_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary text-center"
                                    >
                                        🗺 GET DIRECTIONS
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
