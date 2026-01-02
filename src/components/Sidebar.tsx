import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import Settings from 'lucide-react/dist/esm/icons/settings';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Compass from 'lucide-react/dist/esm/icons/compass';
import X from 'lucide-react/dist/esm/icons/x';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import { clsx } from 'clsx';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCache } from '../context/CacheContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { logout, userProfile } = useAuth();
    const navigate = useNavigate();
    const { settings } = useCache();
    const [companyName, setCompanyName] = useState('Invoice System');

    useEffect(() => {
        if (settings?.companyName) {
            setCompanyName(settings.companyName);
        }
    }, [settings]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FileText, label: 'Invoices', path: '/invoices' },
        { icon: Receipt, label: 'Expenses', path: '/expenses' },
        { icon: Users, label: 'Clients', path: '/clients' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "fixed left-0 top-0 h-full w-64 glass-sidebar flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            <Compass className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{companyName}</h1>
                            <p className="text-xs text-text-muted">Invoice System</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden text-text-muted hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()}
                            id={item.path === '/settings' ? 'nav-settings' : undefined}
                            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {userProfile && !userProfile.isPro && (
                    <div className="px-6 py-4">
                        <div className="bg-surface-light/30 rounded-xl p-4 border border-white/10">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-text-muted">Free Invoices</span>
                                <span className={clsx(
                                    "font-bold",
                                    userProfile.invoiceCount >= 5 ? "text-red-400" : "text-white"
                                )}>
                                    {userProfile.invoiceCount}/5
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-500",
                                        userProfile.invoiceCount >= 5 ? "bg-red-500" : "bg-primary"
                                    )}
                                    style={{ width: `${Math.min((userProfile.invoiceCount / 5) * 100, 100)}%` }}
                                />
                            </div>
                            {userProfile.invoiceCount >= 3 && (
                                <p className="text-xs text-text-muted mt-2 text-center">
                                    {5 - userProfile.invoiceCount} invoices left
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
