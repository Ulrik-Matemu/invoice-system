import { useMemo } from 'react';
import { motion } from 'framer-motion';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { Link } from 'react-router-dom';
import { useCache } from '../context/CacheContext';
import { useAuth } from '../context/AuthContext';
import { DashboardSkeleton } from '../components/Skeleton';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
};

// Circular Progress Component
const CircularProgress = ({ percentage, color = '#38bdf8' }: { percentage: number, color?: string }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div
            className="relative w-24 h-24 flex items-center justify-center"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Paid invoices percentage"
        >
            <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    fill="none"
                />
                <motion.circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke={color}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
            </svg>
            <span className="absolute text-xl font-bold text-white">{percentage}%</span>
        </div>
    );
};

// Mini Bar Chart Component
const MiniBarChart = ({ data, color = '#38bdf8' }: { data: number[], color?: string }) => {
    const maxValue = Math.max(...data, 1);

    return (
        <div className="flex items-end gap-1 h-12">
            {data.map((value, i) => (
                <motion.div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((value / maxValue) * 100, 8)}%` }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                />
            ))}
        </div>
    );
};

const Dashboard = () => {
    const { invoices, loading } = useCache();
    const { user } = useAuth();

    const stats = useMemo(() => {
        const totalRevenue = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
        const pendingCount = invoices.filter(inv => inv.status === 'Pending').length;
        const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
        const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;
        const activeClients = new Set(invoices.map(inv => inv.clientName)).size;
        const totalInvoices = invoices.length;
        const paidPercentage = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;

        return { totalRevenue, pendingCount, paidCount, overdueCount, activeClients, totalInvoices, paidPercentage };
    }, [invoices]);

    // Generate chart data from recent invoices
    const chartData = useMemo(() => {
        // Get last 12 invoice values for mini chart
        const recentInvoices = invoices.slice(0, 12);
        return recentInvoices.map(inv => inv.totalAmount).reverse();
    }, [invoices]);

    // Get recent invoices for activity
    const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header with Greeting */}
            <motion.header variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                        {getGreeting()}, <span className="text-primary">{user?.email?.split('@')[0] || 'there'}</span>
                    </h1>
                    <p className="text-text-muted">Here's an overview of your invoices</p>
                </div>
                <Link
                    to="/invoices/new"
                    className="hidden md:flex items-center gap-2 btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    New Invoice
                </Link>
            </motion.header>

            {/* Overview Section */}
            <motion.section variants={itemVariants}>
                <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Invoices Card - Primary accent (like green card in image) */}
                    <motion.div
                        variants={itemVariants}
                        className="stat-card bg-gradient-to-br from-primary to-primary-dark text-white col-span-1 row-span-2 lg:row-span-1 lg:col-span-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium opacity-90">Invoices</span>
                        </div>
                        <div className="text-4xl font-bold mb-1">{stats.pendingCount}</div>
                        <div className="text-sm opacity-80 mb-4">Unpaid</div>
                        <Link
                            to="/invoices?status=Pending"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    {/* Projects/Total Card */}
                    <motion.div
                        variants={itemVariants}
                        className="stat-card stat-card-surface"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-accent/20 rounded-xl">
                                <FileText className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-sm font-medium text-text-muted">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalInvoices}</div>
                        <div className="text-sm text-text-muted">All time</div>
                    </motion.div>

                    {/* Clients Card */}
                    <motion.div
                        variants={itemVariants}
                        className="stat-card stat-card-surface"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-secondary/20 rounded-xl">
                                <Users className="w-5 h-5 text-secondary" />
                            </div>
                            <span className="text-sm font-medium text-text-muted">Clients</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.activeClients}</div>
                        <div className="text-sm text-text-muted">Active</div>
                    </motion.div>

                    {/* Paid Percentage Card with Circular Progress */}
                    <motion.div
                        variants={itemVariants}
                        className="stat-card stat-card-surface flex flex-col items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="flex items-center gap-2 mb-2 self-start">
                            <span className="text-sm font-medium text-text-muted">Paid Rate</span>
                        </div>
                        <CircularProgress percentage={stats.paidPercentage} color="#2dd4bf" />
                    </motion.div>
                </div>
            </motion.section>

            {/* Revenue & Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Card with Mini Chart */}
                <motion.div
                    variants={itemVariants}
                    className="stat-card stat-card-surface"
                >
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium text-text-muted">Revenue</span>
                            </div>
                            <div className="text-3xl font-bold text-white">
                                ${stats.totalRevenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-text-muted">Lifetime earnings</div>
                        </div>
                        <div className="flex flex-col items-end">
                            <MiniBarChart data={chartData.length > 0 ? chartData : [1, 2]} color="#22c55e" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                            <div className="text-xl font-bold text-emerald-400">{stats.paidCount}</div>
                            <div className="text-xs text-text-muted">Paid</div>
                        </div>
                        <div className="text-center border-x border-white/5">
                            <div className="text-xl font-bold text-amber-400">{stats.pendingCount}</div>
                            <div className="text-xs text-text-muted">Pending</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-red-400">{stats.overdueCount}</div>
                            <div className="text-xs text-text-muted">Overdue</div>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Activity Card */}
                <motion.div
                    variants={itemVariants}
                    className="stat-card stat-card-surface"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
                        <Link to="/invoices" className="text-primary text-sm font-medium hover:underline">
                            View all
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentInvoices.length === 0 ? (
                            <div className="text-center py-8 text-text-muted">
                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No invoices yet</p>
                                <Link to="/invoices/new" className="text-primary text-sm hover:underline">
                                    Create your first invoice
                                </Link>
                            </div>
                        ) : (
                            recentInvoices.map((invoice, index) => (
                                <motion.div
                                    key={invoice.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                >
                                    <Link
                                        to={`/invoices/${invoice.id}`}
                                        className="item-row group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white group-hover:text-primary transition-colors">
                                                    {invoice.clientName}
                                                </div>
                                                <div className="text-xs text-text-muted">
                                                    {invoice.invoiceNumber}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-white mb-2">
                                                ${invoice.totalAmount.toLocaleString()}
                                            </div>
                                            <span className={`status-badge status-${invoice.status.toLowerCase()}`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions - Mobile */}
            <motion.div
                variants={itemVariants}
                className="hidden md:block fixed bottom-6 right-6 z-40"
            >
                <Link
                    to="/invoices/new"
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30"
                >
                    <Plus className="w-6 h-6 text-white" />
                </Link>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
