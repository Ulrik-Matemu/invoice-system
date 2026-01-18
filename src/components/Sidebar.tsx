import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import Settings from 'lucide-react/dist/esm/icons/settings';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Compass from 'lucide-react/dist/esm/icons/compass';
import X from 'lucide-react/dist/esm/icons/x';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { clsx } from 'clsx';

import { useAuth } from '../context/AuthContext';
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

    // Mobile bottom nav items (subset)
    const mobileNavItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: FileText, label: 'Invoices', path: '/invoices' },
        { icon: Plus, label: 'New', path: '/invoices/new', isAction: true },
        { icon: Receipt, label: 'Expenses', path: '/expenses' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={clsx(
                    "fixed left-0 top-0 h-full w-72 glass-sidebar flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            <Compass className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">{companyName}</h1>
                            <p className="text-xs text-text-muted">Invoice Manager</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()}
                            id={item.path === '/settings' ? 'nav-settings' : undefined}
                            className={({ isActive }) => clsx(
                                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-text-muted hover:text-white hover:bg-white/5'
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={clsx(
                                        "p-2 rounded-xl transition-colors",
                                        isActive ? 'bg-primary/20' : 'bg-transparent group-hover:bg-white/5'
                                    )}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Pro Status Card */}
                {userProfile && !userProfile.isPro && (
                    <div className="px-4 py-4">
                        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
                            <div className="flex justify-between text-sm mb-3">
                                <span className="text-text-muted">Free Plan</span>
                                <span className={clsx(
                                    "font-bold",
                                    userProfile.invoiceCount >= (userProfile.allowedInvoices || 5) ? "text-red-400" : "text-white"
                                )}>
                                    {userProfile.invoiceCount}/{userProfile.allowedInvoices || 5}
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((userProfile.invoiceCount / (userProfile.allowedInvoices || 5)) * 100, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={clsx(
                                        "h-full rounded-full",
                                        userProfile.invoiceCount >= (userProfile.allowedInvoices || 5) ? "bg-red-500" : "bg-gradient-to-r from-primary to-accent"
                                    )}
                                />
                            </div>
                            <p className="text-xs text-text-muted text-center">
                                {(userProfile.allowedInvoices || 5) - userProfile.invoiceCount > 0
                                    ? `${(userProfile.allowedInvoices || 5) - userProfile.invoiceCount} invoices remaining`
                                    : 'Upgrade for unlimited invoices'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                        <div className="p-2 rounded-xl bg-red-500/10">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Bottom Navigation (like reference image) */}
            <nav className="md:hidden fixed bottom-0 z-40 print:hidden w-full">
                <div className="bg-surface/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 safe-area-pb w-full">
                    <div className="flex items-center justify-around w-full">
                        {mobileNavItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => clsx(
                                    'flex flex-col items-center py-2 px-3 rounded-2xl transition-all',
                                    item.isAction
                                        ? 'bg-primary text-white -mt-6 shadow-lg shadow-primary/30'
                                        : isActive
                                            ? 'text-primary'
                                            : 'text-text-muted'
                                )}
                            >
                                {item.isAction ? (
                                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                        <item.icon className="w-7 h-7 text-white" />
                                    </div>
                                ) : (
                                    <>
                                        <item.icon className="w-6 h-6" />
                                        <span className="text-xs mt-1 font-medium">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Sidebar;
