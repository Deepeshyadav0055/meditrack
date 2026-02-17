import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { hospitalAPI, alertAPI } from '../services/api';
import socketService from '../services/socket';
import { getBedStatusColor, getBloodStatusColor, formatTimestamp, getSeverityColor } from '../utils/helpers';

export default function PublicDashboard() {
    const [hospitals, setHospitals] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState('Mumbai');
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isTransitioning, setIsTransitioning] = useState(false);


    useEffect(() => {
        // Trigger transition animation
        setIsTransitioning(true);
        setLoading(true);

        // Delay to show fade-out animation
        const timer = setTimeout(() => {
            fetchData();
            setupRealtimeUpdates();
        }, 300);

        return () => {
            clearTimeout(timer);
            socketService.leaveCity(selectedCity);
        };
    }, [selectedCity]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [hospitalsRes, alertsRes] = await Promise.all([
                hospitalAPI.getAll({ city: selectedCity }),
                alertAPI.getAll({ city: selectedCity, resolved: false })
            ]);

            setHospitals(hospitalsRes.data.data || []);
            setAlerts(alertsRes.data.data || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            // Delay to show fade-in animation
            setTimeout(() => setIsTransitioning(false), 100);
        }
    };

    const setupRealtimeUpdates = () => {
        const socket = socketService.connect();
        socketService.joinCity(selectedCity);

        socketService.on('bed_updated', (data) => {
            console.log('Bed updated:', data);
            fetchData();
        });

        socketService.on('blood_updated', (data) => {
            console.log('Blood updated:', data);
            fetchData();
        });

        socketService.on('alert_created', (data) => {
            console.log('Alert created:', data);
            fetchData();
        });
    };

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalICUBeds = hospitals.reduce((sum, h) => {
        const icuBed = h.bed_inventory?.find(b => b.bed_type === 'ICU');
        return sum + (icuBed?.available_beds || 0);
    }, 0);

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    return (
        <div className="min-h-screen bg-primary-950">
            <Header title="Real-Time Hospital Resource Dashboard" />

            {/* Alert Banner */}
            {alerts.length > 0 && (
                <div className="bg-medical-critical text-white py-2 overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap">
                        {alerts.map((alert, idx) => (
                            <span key={alert.id} className="inline-block mx-8">
                                🚨 {alert.message}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-6">
                {/* Controls */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="input-field text-gray-900"
                    >
                        <option value="Mumbai">Mumbai</option>
                        <option value="Jaipur">Jaipur</option>
                        <option value="Pune">Pune</option>
                        <option value="Nagpur">Nagpur</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search hospital..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field text-gray-900 flex-1"
                    />

                    <div className="text-sm text-gray-300 flex items-center">
                        <span className="mr-2">🔄</span>
                        Updated {formatTimestamp(lastUpdated)}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                    <div className="stat-card scale-in" style={{ animationDelay: '0.1s' }}>
                        <div className="text-sm opacity-90 mb-1">Total Hospitals</div>
                        <div className="text-5xl font-bold">{hospitals.length}</div>
                    </div>

                    <div className="stat-card stat-card-success scale-in" style={{ animationDelay: '0.2s' }}>
                        <div className="text-sm opacity-90 mb-1">ICU Beds Available</div>
                        <div className="text-5xl font-bold">{totalICUBeds}</div>
                    </div>

                    <div className="stat-card stat-card-danger scale-in" style={{ animationDelay: '0.3s' }}>
                        <div className="text-sm opacity-90 mb-1">Critical Alerts</div>
                        <div className="text-5xl font-bold">{criticalAlerts}</div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSkeleton count={3} />
                ) : (
                    <>
                        {/* Hospital Cards */}
                        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                            {filteredHospitals.map((hospital, idx) => (
                                <div key={hospital.id} className={`card stagger-item hover-scale`} style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{hospital.name}</h3>
                                            <p className="text-sm text-gray-600">{hospital.address}</p>
                                            <p className="text-sm text-gray-600">📞 {hospital.phone}</p>
                                        </div>
                                        <div className="text-2xl">🏥</div>
                                    </div>

                                    {/* Bed Availability */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">Bed Availability</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {hospital.bed_inventory?.map((bed) => (
                                                <div
                                                    key={bed.id}
                                                    className={`px-3 py-2 rounded ${getBedStatusColor(bed.available_beds, bed.total_beds)}`}
                                                >
                                                    <div className="text-xs font-semibold uppercase">{bed.bed_type}</div>
                                                    <div className="text-lg font-bold">
                                                        {bed.available_beds}/{bed.total_beds}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Blood Inventory */}
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Blood Availability</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {hospital.blood_inventory?.map((blood) => (
                                                <div
                                                    key={blood.id}
                                                    className={`px-2 py-1 rounded text-center ${getBloodStatusColor(blood.units_available)}`}
                                                >
                                                    <div className="text-xs font-semibold">{blood.blood_group}</div>
                                                    <div className="text-sm font-bold">{blood.units_available}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
        </div>
    );
}
