import { useEffect, useState } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../lib/firestore';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingCount: 0,
        paidCount: 0,
        activeClients: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (user) {
                try {
                    const data = await getDashboardStats(user.uid);
                    setStats(data);
                } catch (error) {
                    console.error("Error fetching stats:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchStats();
    }, [user]);

    const statItems = [
        { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, change: 'Lifetime', icon: TrendingUp, color: 'text-emerald-400' },
        { label: 'Pending Invoices', value: stats.pendingCount.toString(), change: 'Awaiting payment', icon: Clock, color: 'text-amber-400' },
        { label: 'Paid Invoices', value: stats.paidCount.toString(), change: 'Completed', icon: CheckCircle, color: 'text-blue-400' },
        { label: 'Active Clients', value: stats.activeClients.toString(), change: 'Total clients', icon: AlertCircle, color: 'text-purple-400' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-text-muted">Welcome back, here's what's happening today.</p>
            </header>

            <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map((stat, index) => (
                    <div key={index} className="glass-panel p-6 rounded-2xl hover:bg-surface/90 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-text-muted">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-text-muted text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="glass-panel rounded-2xl p-6 min-h-[400px]">
                <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                <div className="text-text-muted text-center py-20">
                    Activity timeline coming soon
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
