
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="min-h-screen bg-background text-text-main">
            <Sidebar />
            <main className="pl-64 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-8 max-w-7xl animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
