import { useState } from 'react';
import { useCache } from '../context/CacheContext';
import { useAuth } from '../context/AuthContext';
import { addExpense, deleteExpense } from '../lib/firestore';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Swal from 'sweetalert2';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { clsx } from 'clsx';
import { UpgradeModal } from '../components/UpgradeModal';

const Expenses = () => {
    const { user, userProfile } = useAuth();
    const { expenses, invoices, loading } = useCache();
    const [isAdding, setIsAdding] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = ['Rent', 'Supplies', 'Travel', 'Software', 'Other'];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsAdding(true);
        try {
            await addExpense({
                userId: user.uid,
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                category: newExpense.category as any,
                date: newExpense.date
            });
            setNewExpense({
                description: '',
                amount: '',
                category: 'Other',
                date: new Date().toISOString().split('T')[0]
            });
            Swal.fire({
                title: 'Expense Added',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error adding expense:", error);
            Swal.fire('Error', 'Failed to add expense', 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteExpense(id);
                Swal.fire(
                    'Deleted!',
                    'Your expense has been deleted.',
                    'success'
                );
            } catch (error) {
                console.error("Error deleting expense:", error);
                Swal.fire('Error', 'Failed to delete expense', 'error');
            }
        }
    };

    // Calculations
    const totalRevenue = invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Use tax rate from first invoice or default 10% if no invoices
    // Ideally this should come from settings, but for now this is a simple approximation
    const estimatedTaxRate = 0.1;
    const estimatedTaxLiability = (totalRevenue - totalExpenses) * estimatedTaxRate;

    const expensesByCategory = categories.map(cat => ({
        name: cat,
        value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    })).filter(item => item.value > 0);

    const isPro = userProfile?.isPro;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Expenses & Reports</h1>
                    <p className="text-text-muted">Track your spending and view financial reports</p>
                </div>
            </div>

            {/* Reports Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-sm font-medium text-text-muted mb-2">Total Revenue (Paid)</h3>
                    <p className="text-3xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                    <h3 className="text-sm font-medium text-text-muted mb-2">Total Expenses</h3>
                    <p className={clsx("text-3xl font-bold text-red-400", !isPro && "blur-sm")}>
                        ${totalExpenses.toLocaleString()}
                    </p>
                    {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setShowUpgradeModal(true)}>
                            <span className="text-white font-bold bg-primary px-4 py-2 rounded-lg shadow-lg">Upgrade to View</span>
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                    <h3 className="text-sm font-medium text-text-muted mb-2">Est. Tax Liability (10%)</h3>
                    <p className={clsx("text-3xl font-bold text-amber-400", !isPro && "blur-sm")}>
                        ${Math.max(0, estimatedTaxLiability).toLocaleString()}
                    </p>
                    {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setShowUpgradeModal(true)}>
                            <span className="text-white font-bold bg-primary px-4 py-2 rounded-lg shadow-lg">Upgrade to View</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10 min-h-[300px] relative overflow-hidden group">
                    <h3 className="text-lg font-bold text-white mb-4">Expenses by Category</h3>
                    <div className={clsx("h-[250px] w-full", !isPro && "blur-sm")}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expensesByCategory}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expensesByCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] z-10" onClick={() => setShowUpgradeModal(true)}>
                            <div className="text-center">
                                <p className="text-white font-bold text-xl mb-2">Pro Feature</p>
                                <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl transition-colors font-medium shadow-lg">
                                    Upgrade to Unlock Charts
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Expense Form */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Log New Expense</h3>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                            <label className="text-sm text-text-muted block mb-1">Description</label>
                            <input
                                type="text"
                                required
                                value={newExpense.description}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                placeholder="e.g. Office Rent"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-text-muted block mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-text-muted block mb-1">Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-text-muted block mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={newExpense.date}
                                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAdding}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl transition-colors font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Add Expense
                        </button>
                    </form>
                </div>
            </div>

            {/* Expenses List */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Recent Expenses</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-light/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                                        No expenses recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-bold">
                                            ${expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="text-text-muted hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </div>
    );
};

export default Expenses;
