import { useEffect, useState } from 'react';
import { Plus, Search, Filter, MoreVertical, FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInvoices, type Invoice } from '../lib/firestore';

const Invoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (user) {
                try {
                    const data = await getInvoices(user.uid);
                    setInvoices(data);
                } catch (error) {
                    console.error("Error fetching invoices:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchInvoices();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Overdue': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Invoices</h1>
                    <p className="text-text-muted mt-1">Manage and track your invoices</p>
                </div>
                <Link to="/invoices/new" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5" />
                    <span>New Invoice</span>
                </Link>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            className="w-full bg-surface-light/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <button className="px-4 py-2 rounded-xl border border-white/10 text-text-muted hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-text-muted text-sm">
                                <th className="p-4 font-medium">Invoice ID</th>
                                <th className="p-4 font-medium">Client</th>
                                <th className="p-4 font-medium">Amount</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted">
                                        No invoices found. Create your first one!
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-white">{invoice.invoiceNumber || invoice.id?.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-text-main">{invoice.clientName}</td>
                                        <td className="p-4 text-white font-medium">${invoice.totalAmount.toLocaleString()}</td>
                                        <td className="p-4 text-text-muted">{invoice.createdAt?.toDate().toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={clsx('px-3 py-1 rounded-full text-xs font-medium border', getStatusColor(invoice.status))}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/invoices/${invoice.id}/edit`}
                                                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </Link>
                                                <button className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-white/5 text-center text-text-muted text-sm">
                    Showing {invoices.length} invoices
                </div>
            </div>
        </div>
    );
};

export default Invoices;
