import { useEffect, useState } from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInvoices, deleteInvoice, type Invoice } from '../lib/firestore';
import Swal from 'sweetalert2';

const Invoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch =
            invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (invoice.id && invoice.id.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (invoice: Invoice) => {
        setOpenDropdownId(null);

        if (!user || !invoice.id) return;

        const result = await Swal.fire({
            title: 'Delete Invoice?',
            text: `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                await deleteInvoice(invoice.id, user.uid);
                setInvoices(invoices.filter(i => i.id !== invoice.id));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Invoice has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error("Error deleting invoice:", error);
                Swal.fire('Error', 'Failed to delete invoice.', 'error');
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownId && !(event.target as Element).closest('.dropdown-container')) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

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
                <Link id="new-invoice-btn" to="/invoices/new" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20">
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search invoices..."
                            className="w-full bg-surface-light/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-surface-light/50 text-white focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
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
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted">
                                        No invoices found. Create your first one!
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
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
                                                <div className="relative dropdown-container">
                                                    <button
                                                        onClick={() => setOpenDropdownId(openDropdownId === invoice.id ? null : (invoice.id || null))}
                                                        className={`p-2 rounded-lg transition-colors ${openDropdownId === invoice.id ? 'text-white bg-white/10' : 'text-text-muted hover:text-white hover:bg-white/10'}`}
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    {openDropdownId === invoice.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-[#112240] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                            <button
                                                                onClick={() => handleDelete(invoice)}
                                                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete Invoice
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-white/5 text-center text-text-muted text-sm">
                    Showing {filteredInvoices.length} invoices
                </div>
            </div>
        </div>
    );
};

export default Invoices;
