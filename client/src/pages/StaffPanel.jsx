import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { supabase } from '../services/supabase';
import { bedAPI, bloodAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';

export default function StaffPanel() {
    const [user, setUser] = useState(null);
    const [staff, setStaff] = useState(null);
    const [bedInventory, setBedInventory] = useState([]);
    const [bloodInventory, setBloodInventory] = useState([]);
    const [updateLogs, setUpdateLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            await fetchStaffData(session.user.id);
        } else {
            setLoading(false);
        }
    };

    const fetchStaffData = async (userId) => {
        try {
            // Fetch staff info
            const { data: staffData } = await supabase
                .from('hospital_staff')
                .select('*, hospitals(*)')
                .eq('user_id', userId)
                .single();

            if (!staffData) {
                setLoginError('No staff record found');
                await supabase.auth.signOut();
                return;
            }

            setStaff(staffData);

            // Fetch bed inventory
            const { data: beds } = await supabase
                .from('bed_inventory')
                .select('*')
                .eq('hospital_id', staffData.hospital_id);

            setBedInventory(beds || []);

            // Fetch blood inventory
            const { data: blood } = await supabase
                .from('blood_inventory')
                .select('*')
                .eq('hospital_id', staffData.hospital_id);

            setBloodInventory(blood || []);

            // Fetch update logs
            const { data: logs } = await supabase
                .from('update_logs')
                .select('*')
                .eq('hospital_id', staffData.hospital_id)
                .order('changed_at', { ascending: false })
                .limit(20);

            setUpdateLogs(logs || []);
        } catch (error) {
            console.error('Error fetching staff data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            setUser(data.user);
            await fetchStaffData(data.user.id);
        } catch (error) {
            setLoginError(error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setStaff(null);
        navigate('/staff');
    };

    const updateBedCount = async (bedId, currentAvailable, delta) => {
        const newAvailable = Math.max(0, currentAvailable + delta);

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            localStorage.setItem('supabase_token', token);

            await bedAPI.update(bedId, { available_beds: newAvailable });

            // Refresh data
            await fetchStaffData(user.id);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update bed count');
        }
    };

    const updateBloodUnits = async (bloodId, currentUnits, delta) => {
        const newUnits = Math.max(0, currentUnits + delta);

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            localStorage.setItem('supabase_token', token);

            await bloodAPI.update(bloodId, { units_available: newUnits });

            // Refresh data
            await fetchStaffData(user.id);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update blood units');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-primary-950">
                <Header title="Hospital Staff Login" showNav={false} />
                <div className="container mx-auto px-4 py-12 max-w-md">
                    <div className="card">
                        <h2 className="text-2xl font-bold text-center mb-6">Staff Login</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            {loginError && (
                                <div className="mb-4 p-3 bg-medical-critical text-white rounded">
                                    {loginError}
                                </div>
                            )}
                            <button type="submit" className="w-full btn-primary">
                                Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-primary-950">
                <Header title="Hospital Staff Panel" />
                <div className="container mx-auto px-4 py-6">
                    <LoadingSkeleton count={3} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-950">
            <Header title="Hospital Staff Panel" />

            <div className="container mx-auto px-4 py-6">
                {/* Hospital Info */}
                <div className="card mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">{staff?.hospitals?.name}</h2>
                            <p className="text-gray-600">{staff?.name} - {staff?.role}</p>
                        </div>
                        <button onClick={handleLogout} className="btn-danger">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Bed Update Panel */}
                <div className="card mb-6">
                    <h3 className="text-xl font-bold mb-4">Bed Inventory Management</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Bed Type</th>
                                    <th className="text-center py-2">Total</th>
                                    <th className="text-center py-2">Available</th>
                                    <th className="text-center py-2">Actions</th>
                                    <th className="text-left py-2">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bedInventory.map((bed) => (
                                    <tr key={bed.id} className="border-b">
                                        <td className="py-3 font-semibold uppercase">{bed.bed_type}</td>
                                        <td className="text-center">{bed.total_beds}</td>
                                        <td className="text-center">
                                            <span className="text-2xl font-bold">{bed.available_beds}</span>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => updateBedCount(bed.id, bed.available_beds, -1)}
                                                    className="bg-medical-critical text-white px-3 py-1 rounded hover:bg-red-600"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() => updateBedCount(bed.id, bed.available_beds, 1)}
                                                    className="bg-medical-available text-white px-3 py-1 rounded hover:bg-green-600"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="text-sm text-gray-600">{formatDateTime(bed.last_updated)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Blood Update Panel */}
                <div className="card mb-6">
                    <h3 className="text-xl font-bold mb-4">Blood Inventory Management</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {bloodInventory.map((blood) => (
                            <div key={blood.id} className="border rounded-lg p-4">
                                <div className="text-center mb-2">
                                    <div className="text-xl font-bold">{blood.blood_group}</div>
                                    <div className="text-3xl font-bold text-medical-critical">{blood.units_available}</div>
                                    <div className="text-xs text-gray-600">units</div>
                                </div>
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => updateBloodUnits(blood.id, blood.units_available, -1)}
                                        className="bg-medical-critical text-white px-3 py-1 rounded"
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={() => updateBloodUnits(blood.id, blood.units_available, 1)}
                                        className="bg-medical-available text-white px-3 py-1 rounded"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Update History */}
                <div className="card">
                    <h3 className="text-xl font-bold mb-4">Recent Updates</h3>
                    <div className="space-y-2">
                        {updateLogs.map((log) => (
                            <div key={log.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <span className="font-semibold">{log.field_changed}</span>
                                    <span className="text-gray-600 mx-2">
                                        {log.old_value} → {log.new_value}
                                    </span>
                                    <span className="text-xs text-gray-500">({log.update_type})</span>
                                </div>
                                <div className="text-sm text-gray-600">{formatDateTime(log.changed_at)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
