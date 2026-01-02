import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useCache } from '../context/CacheContext';

const Dashboard = () => {
    const { invoices, loading } = useCache();

    const stats = {
        totalRevenue: invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.totalAmount, 0),
        pendingCount: invoices.filter(inv => inv.status === 'Pending').length,
        paidCount: invoices.filter(inv => inv.status === 'Paid').length,
        activeClients: new Set(invoices.map(inv => inv.clientName)).size
    };

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
