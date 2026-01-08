import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Menu from 'lucide-react/dist/esm/icons/menu';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from './Skeleton';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.email) return 'U';
        return user.email.charAt(0).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-background text-text-main">

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Header */}
            <motion.header
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="md:hidden p-4 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-30 print:hidden"
            >
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2.5 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
                    {getUserInitials()}
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="md:pl-72 min-h-screen pb-24 md:pb-0">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Suspense fallback={
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-64 w-full rounded-2xl" />
                                </div>
                            }>
                                <Outlet />
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Layout;
