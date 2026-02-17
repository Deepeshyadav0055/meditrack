import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { hospitalAPI, alertAPI } from '../services/api';
import { getSeverityColor, formatDateTime } from '../utils/helpers';

export default function AdminDashboard() {
    const [hospitals, setHospitals] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDistrict, setSelectedDistrict] = useState('Mumbai');

    useEffect(() => {
        fetchData();
    }, [selectedDistrict]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [hospitalsRes, alertsRes] = await Promise.all([
                hospitalAPI.getAll({ district: selectedDistrict }),
                alertAPI.getAll({ resolved: false })
            ]);

            setHospitals(hospitalsRes.data.data || []);
            setAlerts(alertsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resolveAlert = async (alertId) => {
        try {
            await alertAPI.resolve(alertId);
            fetchData();
        } catch (error) {
            alert('Failed to resolve alert. Admin authentication required.');
        }
    };

    const exportData = () => {
        const csvData = hospitals.map(h => ({
            name: h.name,
            city: h.city,
            total_beds: h.total_beds_available,
            icu_beds: h.bed_inventory?.find(b => b.bed_type === 'ICU')?.available_beds || 0,
            phone: h.phone
        }));

        const csv = [
            ['Hospital Name', 'City', 'Total Beds Available', 'ICU Beds', 'Phone'],
            ...csvData.map(row => [row.name, row.city, row.total_beds, row.icu_beds, row.phone])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hospital-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const totalBeds = hospitals.reduce((sum, h) => sum + (h.total_beds_available || 0), 0);
    const totalICU = hospitals.reduce((sum, h) => {
        const icu = h.bed_inventory?.find(b => b.bed_type === 'ICU');
        return sum + (icu?.available_beds || 0);
    }, 0);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    return (
        <div className="min-h-screen bg-primary-950">
            <Header title="District Health Officer Dashboard" />

            <div className="container mx-auto px-4 py-6">
                {/* Controls */}
                <div className="mb-6 flex justify-between items-center">
                    <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="input-field text-gray-900"
                    >
                        <option value="Mumbai">Mumbai District</option>
                        <option value="Pune">Pune District</option>
                        <option value="Nagpur">Nagpur District</option>
                    </select>

                    <button onClick={exportData} className="btn-primary">
                        📥 Export CSV
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                        <div className="text-sm opacity-90">Total Hospitals</div>
                        <div className="text-4xl font-bold">{hospitals.length}</div>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <div className="text-sm opacity-90">Total Beds Available</div>
                        <div className="text-4xl font-bold">{totalBeds}</div>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                        <div className="text-sm opacity-90">ICU Beds Available</div>
                        <div className="text-4xl font-bold">{totalICU}</div>
                    </div>

                    <div className="card bg-gradient-to-br from-red-500 to-red-700 text-white">
                        <div className="text-sm opacity-90">Critical Alerts</div>
                        <div className="text-4xl font-bold">{criticalAlerts}</div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSkeleton count={2} />
                ) : (
                    <>
                        {/* Alerts Management */}
                        <div className="card mb-6">
                            <h3 className="text-xl font-bold mb-4">Active Alerts</h3>
                            <div className="space-y-3">
                                {alerts.length === 0 ? (
                                    <p className="text-gray-600">No active alerts</p>
                                ) : (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="flex justify-between items-center p-4 border rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                                                        {alert.severity.toUpperCase()}
                                                    </span>
                                                    <span className="font-semibold">{alert.hospitals?.name}</span>
                                                </div>
                                                <div className="text-gray-700">{alert.message}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatDateTime(alert.created_at)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => resolveAlert(alert.id)}
                                                className="btn-success ml-4"
                                            >
                                                Resolve
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Hospital Overview Table */}
                        <div className="card">
                            <h3 className="text-xl font-bold mb-4">Hospital Overview</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Hospital</th>
                                            <th className="text-center py-2">City</th>
                                            <th className="text-center py-2">Total Beds</th>
                                            <th className="text-center py-2">ICU</th>
                                            <th className="text-center py-2">General</th>
                                            <th className="text-center py-2">Blood Groups</th>
                                            <th className="text-left py-2">Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hospitals.map((hospital) => {
                                            const icuBed = hospital.bed_inventory?.find(b => b.bed_type === 'ICU');
                                            const generalBed = hospital.bed_inventory?.find(b => b.bed_type === 'general');

                                            return (
                                                <tr key={hospital.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 font-semibold">{hospital.name}</td>
                                                    <td className="text-center">{hospital.city}</td>
                                                    <td className="text-center font-bold">{hospital.total_beds_available}</td>
                                                    <td className="text-center">
                                                        <span className={icuBed?.available_beds === 0 ? 'text-medical-critical font-bold' : ''}>
                                                            {icuBed?.available_beds || 0}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">{generalBed?.available_beds || 0}</td>
                                                    <td className="text-center">{hospital.blood_groups_available || 0}/8</td>
                                                    <td className="text-sm">{hospital.phone}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
