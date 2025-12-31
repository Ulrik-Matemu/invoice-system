import { useState, useEffect, useRef } from 'react';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Save from 'lucide-react/dist/esm/icons/save';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Printer from 'lucide-react/dist/esm/icons/printer';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';
import { addInvoice, getInvoice, updateInvoice, getUserSettings, getClients, type Invoice, type Client, type ServiceTypeConfig } from '../lib/firestore';
import { InvoicePDF } from '../components/InvoicePDF';
import { UpgradeModal } from '../components/UpgradeModal';

const InvoiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, userProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);
    const [clients, setClients] = useState<Client[]>([]);

    const [clientName, setClientName] = useState('');
    const [agentName, setAgentName] = useState('');
    const [clientType, setClientType] = useState<'Direct' | 'Agent'>('Direct');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<'Pending' | 'Paid' | 'Overdue'>('Pending');
    const [taxRate, setTaxRate] = useState(0.1); // Default 10%
    const [companyDetails, setCompanyDetails] = useState({
        name: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        taxId: '',
        taxNumber: '',
        licenseNumber: ''
    });
    const [templateId, setTemplateId] = useState<'standard' | 'premium'>('standard');
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
    const [createdAt, setCreatedAt] = useState<any>(null);
    const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
    const [enableAgentDetails, setEnableAgentDetails] = useState(true);

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
                    // Fetch user settings for default tax rate and company details
                    const settings = await getUserSettings(user.uid);
                    setTaxRate(settings.taxRate);
                    setCompanyDetails({
                        name: settings.companyName || '',
                        address: settings.companyAddress || '',
                        email: settings.companyEmail || '',
                        phone: settings.companyPhone || '',
                        website: settings.companyWebsite || '',
                        taxId: settings.companyTaxId || '',
                        taxNumber: settings.companyTaxNumber || '',
                        licenseNumber: settings.companyLicenseNumber || ''
                    });
                    setTemplateId(settings.defaultTemplate || 'standard');
                    if (settings.serviceTypes && settings.serviceTypes.length > 0) {
                        // Handle migration from string[] to ServiceTypeConfig[]
                        const loadedServices = settings.serviceTypes;
                        const normalizedServices: ServiceTypeConfig[] = loadedServices.map((s: any) => {
                            if (typeof s === 'string') {
                                return {
                                    name: s,
                                    requiresDates: ['Hotel', 'Safari', 'Flight', 'Custom Package'].includes(s),
                                    descriptionLabel: s === 'Hotel' ? 'Hotel Name' :
                                        s === 'Safari' ? 'Safari Details' :
                                            s === 'Flight' ? 'Flight Details' :
                                                'Description'
                                };
                            }
                            return s;
                        });
                        setServiceTypes(normalizedServices);

                        // Update initial item if it exists and hasn't been modified
                        // We check if it's the default 'Hotel' or 'Service' and has no description
                        if (items.length === 1 && (items[0].serviceType === 'Hotel' || items[0].serviceType === 'Service') && !items[0].description) {
                            const firstService = normalizedServices[0];
                            if (firstService) {
                                setItems([{
                                    ...items[0],
                                    serviceType: firstService.name,
                                    // We don't set description here to keep it empty for the user to fill
                                }]);
                            }
                        }
                    } else {
                        // Default services if none found
                        setServiceTypes([
                            { name: 'Service', requiresDates: false, descriptionLabel: 'Description' },
                            { name: 'Product', requiresDates: false, descriptionLabel: 'Description' },
                            { name: 'Hours', requiresDates: false, descriptionLabel: 'Description' }
                        ]);
                    }
                    setEnableAgentDetails(settings.enableAgentDetails !== undefined ? settings.enableAgentDetails : true);

                    // Fetch clients for suggestions
                    const clientsData = await getClients(user.uid);
                    setClients(clientsData);

                    if (id) {
                        const invoiceData = await getInvoice(id);
                        if (invoiceData) {
                            setInvoiceNumber(invoiceData.invoiceNumber);
                            setClientName(invoiceData.clientName);
                            setAgentName(invoiceData.agentName || '');
                            setClientType(invoiceData.clientType);
                            setDueDate(invoiceData.dueDate);
                            setStatus(invoiceData.status);
                            // If invoice has a stored tax rate, use it. Otherwise keep default from settings
                            if (invoiceData.taxRate !== undefined) {
                                setTaxRate(invoiceData.taxRate);
                            }
                            if (invoiceData.templateId) {
                                setTemplateId(invoiceData.templateId);
                            }
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
            serviceType: serviceTypes[0]?.name || 'Service',
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
        return calculateSubtotal() * taxRate;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Check limits for new invoices
        if (!id && userProfile && !userProfile.isPro && userProfile.invoiceCount >= 5) {
            setShowUpgradeModal(true);
            return;
        }

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
                status: status,
                taxRate: taxRate,
                templateId: templateId,
                // Include company details snapshot
                companyName: companyDetails.name,
                companyAddress: companyDetails.address,
                companyEmail: companyDetails.email,
                companyPhone: companyDetails.phone,
                companyWebsite: companyDetails.website,
                companyTaxId: companyDetails.taxId,
                companyTaxNumber: companyDetails.taxNumber,
                companyLicenseNumber: companyDetails.licenseNumber
            };

            if (id) {
                await updateInvoice(id, invoiceData);
            } else {
                await addInvoice(invoiceData);
            }
            navigate('/invoices');
        } catch (error: any) {
            console.error("Error saving invoice:", error);
            if (error.message === "Free limit reached. Please upgrade to Pro.") {
                setShowUpgradeModal(true);
            } else {
                alert("Failed to save invoice");
            }
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
        createdAt: createdAt,
        taxRate: taxRate,
        companyName: companyDetails.name,
        companyAddress: companyDetails.address,
        companyEmail: companyDetails.email,
        companyPhone: companyDetails.phone,
        companyWebsite: companyDetails.website,
        companyTaxId: companyDetails.taxId,
        companyTaxNumber: companyDetails.taxNumber,
        companyLicenseNumber: companyDetails.licenseNumber,
        templateId: templateId
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Hidden PDF Component */}
            <div className="hidden print:block">
                <InvoicePDF ref={componentRef} invoice={currentInvoice} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 print:hidden">
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
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 md:px-6 rounded-xl flex items-center gap-2 transition-colors font-medium"
                            >
                                <Printer className="w-5 h-5" />
                                <span className="hidden md:inline">Print / PDF</span>
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {id ? 'Update' : 'Save'}
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

                    {/* Template Selection */}
                    <div className="flex gap-4 border-t border-white/5 pt-4">
                        <div className="flex-1">
                            <label className="block text-sm text-text-muted mb-2">Invoice Template</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTemplateId('standard')}
                                    className={`flex-1 py-2 px-4 rounded-xl border transition-colors text-sm ${templateId === 'standard'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'border-white/10 text-text-muted hover:bg-white/5'
                                        }`}
                                >
                                    Standard
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTemplateId('premium')}
                                    className={`flex-1 py-2 px-4 rounded-xl border transition-colors text-sm ${templateId === 'premium'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'border-white/10 text-text-muted hover:bg-white/5'
                                        }`}
                                >
                                    Premium
                                </button>
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
                                list="clients-list"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                            <datalist id="clients-list">
                                {clients.map(client => (
                                    <option key={client.id} value={client.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {enableAgentDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
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
                    )}

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
                                                    className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                                                >
                                                    {serviceTypes.map(type => (
                                                        <option key={type.name} value={type.name}>{type.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-text-muted">
                                                    {serviceTypes.find(t => t.name === item.serviceType)?.descriptionLabel || 'Description'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
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
                                        {serviceTypes.find(t => t.name === item.serviceType)?.requiresDates && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-text-muted">
                                                        {item.serviceType === 'Flight' ? 'Travel Date' : 'Start Date / Check In'}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={item.startDate}
                                                        onChange={(e) => updateItem(item.id, 'startDate', e.target.value)}
                                                        className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
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
                                                        className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div className="space-y-1">
                                            <label className="text-xs text-text-muted">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                                                className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-text-muted">Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                                                className="w-full bg-surface-light/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
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
                                <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
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

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </div>
    );
};

export default InvoiceForm;
