import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-text-main">

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Header */}
            <div className="md:hidden p-4 flex items-center gap-4 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-30 print:hidden">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 text-text-muted hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="font-bold text-white">Invoice System</span>
            </div>

            <main className="md:pl-64 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
