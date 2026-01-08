import { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Download from 'lucide-react/dist/esm/icons/download';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { clsx } from 'clsx';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteInvoice, type Invoice } from '../lib/firestore';
import Swal from 'sweetalert2';
import { useCache } from '../context/CacheContext';
import { UpgradeModal } from '../components/UpgradeModal';
import { InvoicesSkeleton } from '../components/Skeleton';

// Animation variants
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
};

// Extracted InvoiceCard component for performance
const InvoiceCard = memo(({
    invoice,
    isSelected,
    isDropdownOpen,
    onToggleSelection,
    onToggleDropdown,
    onDelete,
    getStatusColor,
    getStatusIcon
}: {
    invoice: Invoice;
    isSelected: boolean;
    isDropdownOpen: boolean;
    onToggleSelection: (id: string) => void;
    onToggleDropdown: (e: React.MouseEvent, id: string) => void;
    onDelete: (invoice: Invoice) => void;
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => any;
}) => {
    const StatusIcon = getStatusIcon(invoice.status);

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
                "stat-card stat-card-surface group cursor-pointer relative overflow-visible",
                isSelected && "ring-2 ring-primary"
            )}
            whileHover={{ y: -4 }}
        >
            {/* Selection checkbox */}
            <div
                className="absolute -top-2 -left-2 z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(invoice.id!);
                }}
            >
                <div className={clsx(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
                    isSelected
                        ? "bg-primary border-primary"
                        : "bg-surface border-white/20 opacity-0 group-hover:opacity-100"
                )}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
            </div>

            <Link to={`/invoices/${invoice.id}`} className="block">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                                {invoice.clientName}
                            </h3>
                            <p className="text-sm text-text-muted">{invoice.invoiceNumber}</p>
                        </div>
                    </div>

                    {/* Dropdown */}
                    <div className="dropdown-container relative">
                        <button
                            onClick={(e) => onToggleDropdown(e, invoice.id!)}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                isDropdownOpen
                                    ? 'text-white bg-white/10'
                                    : 'text-text-muted hover:text-white hover:bg-white/10'
                            )}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onDelete(invoice);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Invoice
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Amount */}
                <div className="text-2xl font-bold text-white mb-4">
                    ${invoice.totalAmount.toLocaleString()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-sm text-text-muted">
                        {invoice.createdAt?.toDate().toLocaleDateString()}
                    </span>
                    <span className={clsx('status-badge', getStatusColor(invoice.status))}>
                        <StatusIcon className="w-3 h-3 mr-1 inline" />
                        {invoice.status}
                    </span>
                </div>
            </Link>
        </motion.div>
    );
});

const Invoices = () => {
    const { user, userProfile } = useAuth();
    const { invoices, loading } = useCache();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const isPro = userProfile?.isPro;

    // Stats
    const stats = useMemo(() => ({
        all: invoices.length,
        pending: invoices.filter(i => i.status === 'Pending').length,
        paid: invoices.filter(i => i.status === 'Paid').length,
        overdue: invoices.filter(i => i.status === 'Overdue').length,
    }), [invoices]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'status-paid';
            case 'Pending': return 'status-pending';
            case 'Overdue': return 'status-overdue';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Paid': return CheckCircle;
            case 'Pending': return Clock;
            case 'Overdue': return AlertCircle;
            default: return FileText;
        }
    };

    const filteredInvoices = useMemo(() => invoices.filter(invoice => {
        const matchesSearch =
            invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (invoice.id && invoice.id.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    }), [invoices, searchQuery, statusFilter]);

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
            confirmButtonText: 'Yes, delete it',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await deleteInvoice(invoice.id, user.uid);
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Invoice has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#f8fafc'
                });
            } catch (error) {
                console.error("Error deleting invoice:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to delete invoice.',
                    icon: 'error',
                    background: '#1e293b',
                    color: '#f8fafc'
                });
            }
        }
    };

    const toggleSelection = (id: string) => {
        if (selectedInvoices.includes(id)) {
            setSelectedInvoices(selectedInvoices.filter(i => i !== id));
        } else {
            setSelectedInvoices([...selectedInvoices, id]);
        }
    };

    const handleToggleDropdown = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleBatchExport = () => {
        if (selectedInvoices.length === 0) return;

        if (!isPro && selectedInvoices.length > 1) {
            Swal.fire({
                title: 'Pro Feature',
                text: 'Batch exporting is a Pro feature. Free users can only export one invoice at a time.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Upgrade',
                cancelButtonText: 'Cancel',
                background: '#1e293b',
                color: '#f8fafc'
            }).then((result) => {
                if (result.isConfirmed) {
                    setShowUpgradeModal(true);
                }
            });
            return;
        }

        if (selectedInvoices.length === 1) {
            Swal.fire({
                title: 'Success',
                text: 'Invoice exported successfully!',
                icon: 'success',
                background: '#1e293b',
                color: '#f8fafc'
            });
        } else {
            Swal.fire({
                title: 'Success',
                text: `Exported ${selectedInvoices.length} invoices into a merged PDF!`,
                icon: 'success',
                background: '#1e293b',
                color: '#f8fafc'
            });
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
        return <InvoicesSkeleton />;
    }

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white">Invoices</h1>
                    <p className="text-text-muted mt-1">Manage and track your invoices</p>
                </div>
                <Link
                    id="new-invoice-btn"
                    to="/invoices/new"
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden md:inline">New Invoice</span>
                </Link>
            </motion.div>

            {/* Status Filter Tabs */}
            <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2 -mb-2">
                {[
                    { key: 'All', label: 'All', count: stats.all, color: 'text-white' },
                    { key: 'Pending', label: 'Pending', count: stats.pending, color: 'text-amber-400' },
                    { key: 'Paid', label: 'Paid', count: stats.paid, color: 'text-emerald-400' },
                    { key: 'Overdue', label: 'Overdue', count: stats.overdue, color: 'text-red-400' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={clsx(
                            "px-4 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
                            statusFilter === tab.key
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:bg-white/5'
                        )}
                    >
                        {tab.label}
                        <span className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            statusFilter === tab.key ? 'bg-white/20' : 'bg-white/5',
                            tab.color
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </motion.div>

            {/* Search & Selection Bar */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 mt-6 md:mt-4">
                <div className="relative flex-1 max-w-md">

                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search invoices..."
                        className="input-modern pl-12"
                    />
                </div>

                <AnimatePresence>
                    {selectedInvoices.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3"
                        >
                            <span className="text-white font-medium">{selectedInvoices.length} selected</span>
                            <button
                                onClick={handleBatchExport}
                                className="btn-ghost flex items-center gap-2 py-2"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={() => setSelectedInvoices([])}
                                className="text-text-muted hover:text-white text-sm"
                            >
                                Clear
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Invoice Grid/Cards */}
            <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                <AnimatePresence mode="popLayout">
                    {filteredInvoices.length === 0 ? (
                        <motion.div
                            key="empty"
                            variants={itemVariants}
                            className="col-span-full text-center py-16"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
                            <p className="text-text-muted mb-6">
                                {searchQuery || statusFilter !== 'All'
                                    ? 'Try adjusting your search or filters'
                                    : 'Create your first invoice to get started'}
                            </p>
                            {!searchQuery && statusFilter === 'All' && (
                                <Link to="/invoices/new" className="btn-primary inline-flex items-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Create Invoice
                                </Link>
                            )}
                        </motion.div>
                    ) : (
                        filteredInvoices.map((invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                isSelected={selectedInvoices.includes(invoice.id!)}
                                isDropdownOpen={openDropdownId === invoice.id}
                                onToggleSelection={toggleSelection}
                                onToggleDropdown={handleToggleDropdown}
                                onDelete={handleDelete}
                                getStatusColor={getStatusColor}
                                getStatusIcon={getStatusIcon}
                            />
                        ))
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Footer count */}
            {filteredInvoices.length > 0 && (
                <motion.div variants={itemVariants} className="text-center text-text-muted text-sm pt-4">
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                </motion.div>
            )}

            {/* Mobile FAB */}
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

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </motion.div>
    );
};

export default Invoices;
