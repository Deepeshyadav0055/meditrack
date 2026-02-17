import { Link, useLocation } from 'react-router-dom';

export default function Header({ title, showNav = true }) {
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Public Dashboard', icon: '🏥' },
        { path: '/ambulance', label: 'Ambulance', icon: '🚑' },
        { path: '/staff', label: 'Staff Panel', icon: '👨‍⚕️' },
        { path: '/admin', label: 'Admin', icon: '⚙️' }
    ];

    return (
        <header className="bg-gradient-to-r from-primary-900 to-primary-800 shadow-lg">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="text-3xl">🏥</div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">MediTrack</h1>
                            <p className="text-sm text-gray-300">{title || 'Hospital Resource Dashboard'}</p>
                        </div>
                    </div>

                    {showNav && (
                        <nav className="hidden md:flex space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${location.pathname === link.path
                                            ? 'bg-white text-primary-900 font-semibold'
                                            : 'text-white hover:bg-primary-700'
                                        }`}
                                >
                                    <span className="mr-2">{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Mobile navigation */}
                {showNav && (
                    <nav className="md:hidden mt-4 grid grid-cols-2 gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3 py-2 rounded-lg text-center transition-colors duration-200 ${location.pathname === link.path
                                        ? 'bg-white text-primary-900 font-semibold'
                                        : 'bg-primary-700 text-white hover:bg-primary-600'
                                    }`}
                            >
                                <span className="mr-1">{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </header>
    );
}
