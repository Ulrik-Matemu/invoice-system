import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Calendar, Loader2, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';
import { addInvoice, getInvoice, updateInvoice, type Invoice } from '../lib/firestore';
import { InvoicePDF } from '../components/InvoicePDF';

const InvoiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);

    const [clientName, setClientName] = useState('');
    const [agentName, setAgentName] = useState('');
    const [clientType, setClientType] = useState<'Direct' | 'Agent'>('Direct');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<'Pending' | 'Paid' | 'Overdue'>('Pending');
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
    const [createdAt, setCreatedAt] = useState<any>(null);

    const [items, setItems] = useState([
        {
            id: 1,
            serviceType: 'Hotel',
            description: '',
            startDate: '',
            endDate: '',
            quantity: 1,
            price: 0
        }
    ]);

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice-${invoiceNumber}`,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    if (id) {
                        const invoiceData = await getInvoice(id);
                        if (invoiceData) {
                            setInvoiceNumber(invoiceData.invoiceNumber);
                            setClientName(invoiceData.clientName);
                            setAgentName(invoiceData.agentName || '');
                            setClientType(invoiceData.clientType);
                            setDueDate(invoiceData.dueDate);
                            setStatus(invoiceData.status);
                            setItems(invoiceData.items.map((item, index) => ({
                                ...item,
                                id: index + 1,
                                serviceType: item.serviceType,
                                startDate: item.startDate || item.checkIn || '',
                                endDate: item.endDate || item.checkOut || '',
                                description: item.description || ''
                            })));
                            setCreatedAt(invoiceData.createdAt);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [user, id]);

    const addItem = () => {
        setItems([...items, {
            id: items.length + 1,
            serviceType: 'Hotel',
            description: '',
            startDate: '',
            endDate: '',
            quantity: 1,
            price: 0
        }]);
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.1; // 10% tax
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            const invoiceData = {
                userId: user.uid,
                invoiceNumber,
                clientName,
                agentName,
                clientType,
                dueDate,
                items: items.map(item => ({
                    ...item,
                    id: item.id.toString(), // Convert ID to string for Firestore
                    serviceType: item.serviceType as any
                })),
                totalAmount: calculateTotal(),
                status: status
            };

            if (id) {
                await updateInvoice(id, invoiceData);
            } else {
                await addInvoice(invoiceData);
            }
            navigate('/invoices');
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Failed to save invoice");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Construct invoice object for PDF
    const currentInvoice: Invoice = {
        id: id || '',
        userId: user?.uid || '',
        invoiceNumber,
        clientName,
        agentName,
        clientType,
        dueDate,
        items: items.map(item => ({
            ...item,
            id: item.id.toString(),
            serviceType: item.serviceType as any
        })),
        totalAmount: calculateTotal(),
        status: status,
        createdAt: createdAt
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Hidden PDF Component */}
            <div style={{ display: 'none' }}>
                <InvoicePDF ref={componentRef} invoice={currentInvoice} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                    <button
                        type="button"
                        onClick={() => navigate('/invoices')}
                        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Invoices
                    </button>
                    <div className="flex gap-3">
                        {id && (
                            <button
                                type="button"
                                onClick={() => handlePrint && handlePrint()}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium"
                            >
                                <Printer className="w-5 h-5" />
                                Print / PDF
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {id ? 'Update Invoice' : 'Save Invoice'}
                        </button>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-4 md:p-8 space-y-8">
                    <div className="flex justify-between items-start border-b border-white/5 pb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">{id ? 'Edit Invoice' : 'New Invoice'}</h1>
                            <p className="text-text-muted">Create a new invoice for your client</p>
                        </div>
                        <div className="flex gap-4">
                            {id && (
                                <div className="text-right">
                                    <label className="block text-sm text-text-muted mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white text-right focus:outline-none focus:border-primary/50 transition-colors w-full"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>
                            )}
                            <div className="text-right">
                                <label className="block text-sm text-text-muted mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white text-right focus:outline-none focus:border-primary/50 transition-colors w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Client Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Client Name</label>
                            <label className="text-sm font-medium text-text-muted">Client Name</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Enter client name"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Client Type</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setClientType('Direct')}
                                    className={`flex-1 py-3 rounded-xl border transition-colors ${clientType === 'Direct'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'border-white/10 text-text-muted hover:bg-white/5'
                                        }`}
                                >
                                    Direct Client
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClientType('Agent')}
                                    className={`flex-1 py-3 rounded-xl border transition-colors ${clientType === 'Agent'
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                        : 'border-white/10 text-text-muted hover:bg-white/5'
                                        }`}
                                >
                                    Travel Agent
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Agent Name (Optional)</label>
                            <input
                                type="text"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                placeholder="Enter agent name"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Services & Items</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-primary hover:text-primary-light text-sm font-medium flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-text-muted">Service Type</label>
                                                <select
                                                    value={item.serviceType}
                                                    onChange={(e) => updateItem(item.id, 'serviceType', e.target.value)}
                                                    className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                                >
                                                    <option>Hotel</option>
                                                    <option>Safari</option>
                                                    <option>Flight</option>
                                                    <option>Custom Package</option>
                                                    <option>Transfer</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-text-muted">
                                                    {item.serviceType === 'Hotel' ? 'Hotel Name' :
                                                        item.serviceType === 'Safari' ? 'Safari Details' :
                                                            item.serviceType === 'Flight' ? 'Flight Details' :
                                                                item.serviceType === 'Custom Package' ? 'Package Details' :
                                                                    'Description'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-6"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-text-muted">
                                                {item.serviceType === 'Flight' ? 'Travel Date' : 'Start Date / Check In'}
                                            </label>
                                            <input
                                                type="date"
                                                value={item.startDate}
                                                onChange={(e) => updateItem(item.id, 'startDate', e.target.value)}
                                                className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-text-muted">
                                                {item.serviceType === 'Flight' ? 'Return Date (Optional)' : 'End Date / Check Out'}
                                            </label>
                                            <input
                                                type="date"
                                                value={item.endDate}
                                                onChange={(e) => updateItem(item.id, 'endDate', e.target.value)}
                                                className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-text-muted">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                                                className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-text-muted">Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                                                className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-white/5 pt-8 flex justify-end">
                        <div className="w-full max-w-xs space-y-3">
                            <div className="flex justify-between text-text-muted">
                                <span>Subtotal</span>
                                <span>${calculateSubtotal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-text-muted">
                                <span>Tax (10%)</span>
                                <span>${calculateTax().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-white pt-4 border-t border-white/10">
                                <span>Total</span>
                                <span>${calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
