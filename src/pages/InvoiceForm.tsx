import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Save from 'lucide-react/dist/esm/icons/save';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Download from 'lucide-react/dist/esm/icons/download';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';
import { addInvoice, updateInvoice, type Invoice, type Client, type ServiceTypeConfig } from '../lib/firestore';
import { InvoicePDF } from '../components/InvoicePDF';
import { UpgradeModal } from '../components/UpgradeModal';
import { clsx } from 'clsx';
import { useCache } from '../context/CacheContext';
import { TemplateSelector } from '../components/TemplateSelector';
import { getTemplateById } from '../components/templates/TemplateRegistry';
import type { TemplateConfig } from '../components/templates/types';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const InvoiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, userProfile } = useAuth();
    const isPro = userProfile?.isPro;
    const { invoices, clients: cachedClients, settings: cachedSettings, loading: cacheLoading } = useCache();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    const [clientName, setClientName] = useState('');
    const [agentName, setAgentName] = useState('');
    const [clientType, setClientType] = useState<'Direct' | 'Agent'>('Direct');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<'Pending' | 'Paid' | 'Overdue'>('Pending');
    const [taxRate, setTaxRate] = useState(0.1);
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
    const [templateId, setTemplateId] = useState<string>('standard');
    const [templateConfig, setTemplateConfig] = useState<TemplateConfig | undefined>(undefined);
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
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

    const dataLoadedRef = useRef<string | boolean>(false);

    useEffect(() => {
        if (cacheLoading || !user) return;
        if (dataLoadedRef.current && id === dataLoadedRef.current) return;

        if (cachedSettings) {
            setTaxRate(cachedSettings.taxRate);
            setCompanyDetails({
                name: cachedSettings.companyName || '',
                address: cachedSettings.companyAddress || '',
                email: cachedSettings.companyEmail || '',
                phone: cachedSettings.companyPhone || '',
                website: cachedSettings.companyWebsite || '',
                taxId: cachedSettings.companyTaxId || '',
                taxNumber: cachedSettings.companyTaxNumber || '',
                licenseNumber: cachedSettings.companyLicenseNumber || ''
            });
            setTemplateId(cachedSettings?.defaultTemplate || 'standard');
            setTemplateConfig(cachedSettings?.templateConfig);
        }
        if (cachedSettings?.serviceTypes && cachedSettings.serviceTypes.length > 0) {
            const loadedServices = cachedSettings.serviceTypes;
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

            if (!id && items.length === 1 && (items[0].serviceType === 'Hotel' || items[0].serviceType === 'Service') && !items[0].description) {
                const firstService = normalizedServices[0];
                if (firstService) {
                    setItems([{
                        ...items[0],
                        serviceType: firstService.name,
                    }]);
                }
            }
        } else {
            setServiceTypes([
                { name: 'Service', requiresDates: false, descriptionLabel: 'Description' },
                { name: 'Product', requiresDates: false, descriptionLabel: 'Description' },
                { name: 'Hours', requiresDates: false, descriptionLabel: 'Description' }
            ]);
        }
        setEnableAgentDetails(cachedSettings?.enableAgentDetails !== undefined ? cachedSettings.enableAgentDetails : true);


        setClients(cachedClients);

        if (id) {
            const invoiceData = invoices.find(i => i.id === id);
            if (invoiceData) {
                setInvoiceNumber(invoiceData.invoiceNumber);
                setClientName(invoiceData.clientName);
                setAgentName(invoiceData.agentName || '');
                setClientType(invoiceData.clientType);
                setDueDate(invoiceData.dueDate);
                setStatus(invoiceData.status);
                if (invoiceData.taxRate !== undefined) {
                    setTaxRate(invoiceData.taxRate);
                }
                if (invoiceData.templateId) {
                    setTemplateId(invoiceData.templateId);
                }
                if (invoiceData.templateConfig) {
                    setTemplateConfig(invoiceData.templateConfig);
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
                (dataLoadedRef as any).current = id;
            } else {
                console.warn("Invoice not found in cache");
            }
        } else {
            (dataLoadedRef as any).current = 'new';
        }

    }, [user, id, cacheLoading, cachedSettings, cachedClients, invoices]);

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

        const limit = userProfile?.allowedInvoices || 5;
        if (!id && userProfile && !userProfile.isPro && userProfile.invoiceCount >= limit) {
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
                    id: item.id.toString(),
                    serviceType: item.serviceType as any
                })),
                totalAmount: calculateTotal(),
                status: status,
                taxRate: taxRate,
                companyName: companyDetails.name,
                companyAddress: companyDetails.address,
                companyEmail: companyDetails.email,
                companyPhone: companyDetails.phone,
                companyWebsite: companyDetails.website,
                companyTaxId: companyDetails.taxId,
                companyTaxNumber: companyDetails.taxNumber,
                companyLicenseNumber: companyDetails.licenseNumber,
                templateId,
                templateConfig: templateConfig || null
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

    if (cacheLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

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

    // Find selected client for display
    const selectedClient = clients.find(c => c.name === clientName);

    return (
        <motion.div
            className="max-w-4xl mx-auto pb-24"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Hidden PDF Component */}
            <div className="hidden print:block">
                <InvoicePDF ref={componentRef} invoice={currentInvoice} customTemplates={cachedSettings?.customTemplates} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 print:hidden">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between py-4">
                    <button
                        type="button"
                        onClick={() => navigate('/invoices')}
                        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors p-2 -ml-2 rounded-xl hover:bg-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Back</span>
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        {id ? 'Edit Invoice' : 'Create new invoice'}
                    </h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </motion.div>

                {/* Send To Section */}
                <motion.section variants={itemVariants}>
                    <h2 className="text-lg font-semibold text-white mb-3">Send to</h2>

                    {/* Client Card - Like green card in image */}
                    <motion.div
                        className="client-card cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        layout
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Client name"
                                    list="clients-list"
                                    disabled={!!id && !isPro}
                                    className={clsx(
                                        "w-full bg-transparent text-lg font-semibold text-white placeholder:text-white/50 focus:outline-none",
                                        !!id && !isPro && "opacity-50 cursor-not-allowed"
                                    )}
                                />
                                <datalist id="clients-list">
                                    {clients.map(client => (
                                        <option key={client.id} value={client.name} />
                                    ))}
                                </datalist>
                                {selectedClient && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-sm text-white/70"
                                    >
                                        <div>{selectedClient.address}</div>
                                        <div>{selectedClient.email}</div>
                                    </motion.div>
                                )}
                                {!selectedClient && clientName && (
                                    <div className="text-sm text-white/50">
                                        New client
                                    </div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                    {!!id && !isPro && (
                        <p className="text-xs text-text-muted mt-2 cursor-pointer hover:text-primary" onClick={() => setShowUpgradeModal(true)}>
                            Upgrade to edit client
                        </p>
                    )}
                </motion.section>

                {/* Agent Details (if enabled) */}
                {enableAgentDetails && (
                    <motion.section variants={itemVariants} className="space-y-4">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setClientType('Direct')}
                                className={clsx(
                                    "flex-1 py-3 rounded-2xl border text-sm font-medium transition-all",
                                    clientType === 'Direct'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'border-white/10 text-text-muted hover:bg-white/5'
                                )}
                            >
                                Direct Client
                            </button>
                            <button
                                type="button"
                                onClick={() => setClientType('Agent')}
                                className={clsx(
                                    "flex-1 py-3 rounded-2xl border text-sm font-medium transition-all",
                                    clientType === 'Agent'
                                        ? 'bg-secondary/20 border-secondary text-secondary'
                                        : 'border-white/10 text-text-muted hover:bg-white/5'
                                )}
                            >
                                Travel Agent
                            </button>
                        </div>
                        {clientType === 'Agent' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <input
                                    type="text"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    placeholder="Agent name"
                                    className="input-modern"
                                />
                            </motion.div>
                        )}
                    </motion.section>
                )}

                {/* Invoice Details Header */}
                <motion.section variants={itemVariants} className="w-full max-w-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-lg font-semibold text-white">Invoice details</h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                            <span className="text-lg">+</span> Add item
                        </button>
                    </div>

                    {/* Item List */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row gap-4 sm:items-start group transition-all hover:border-white/20"
                                >
                                    {/* Index Badge - Top Left on Mobile */}
                                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center sm:static sm:w-10 sm:h-10 sm:rounded-xl sm:bg-primary/10 flex-shrink-0">
                                        <span className="text-xs sm:text-sm font-bold text-white sm:text-primary">{index + 1}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-4">
                                        {/* Main Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold ml-1">Service Type</label>
                                                <select
                                                    value={item.serviceType}
                                                    onChange={(e) => updateItem(item.id, 'serviceType', e.target.value)}
                                                    className="w-full bg-white/5 text-white border border-transparent focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all"
                                                >
                                                    {serviceTypes.map(type => (
                                                        <option key={type.name} value={type.name} className="bg-neutral-900">
                                                            {type.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold ml-1">Description</label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    placeholder={serviceTypes.find(t => t.name === item.serviceType)?.descriptionLabel || 'Description'}
                                                    className="w-full bg-white/5 text-white border border-transparent focus:border-primary/50 focus:ring-0 rounded-lg px-3 py-2 text-sm transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Dates Row */}
                                        {serviceTypes.find(t => t.name === item.serviceType)?.requiresDates && (
                                            <div className="flex flex-col xs:flex-row gap-2 items-end sm:items-center">
                                                <div className="w-full">
                                                    <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold ml-1">Duration</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <input
                                                            type="date"
                                                            value={item.startDate}
                                                            onChange={(e) => updateItem(item.id, 'startDate', e.target.value)}
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                                                        />
                                                        <span className="text-text-muted text-xs">to</span>
                                                        <input
                                                            type="date"
                                                            value={item.endDate}
                                                            onChange={(e) => updateItem(item.id, 'endDate', e.target.value)}
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pricing & Quantity Footer */}
                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-text-muted uppercase font-bold">Qty</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-12 bg-transparent text-white text-sm font-medium focus:outline-none border-b border-white/10 focus:border-primary transition-all"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-text-muted uppercase font-bold">Price</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-primary text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.price}
                                                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-20 bg-transparent text-white text-sm font-medium focus:outline-none border-b border-white/10 focus:border-primary transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.section>
                {/* Due Date & Invoice Number */}
                <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted">Due Date</label>
                        <div className="relative">

                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input-modern pl-12 mt-2"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted">Invoice Number</label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={!!id && !isPro}
                            className={clsx(
                                "input-modern mt-2",
                                !!id && !isPro && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>
                </motion.section>

                {/* Status (for editing) */}
                {id && (
                    <motion.section variants={itemVariants} className="space-y-2">
                        <label className="text-sm font-medium text-text-muted">Status</label>
                        <div className="flex gap-3">
                            {(['Pending', 'Paid', 'Overdue'] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={clsx(
                                        "flex-1 py-3 rounded-2xl border text-sm font-medium transition-all",
                                        status === s
                                            ? s === 'Paid' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : s === 'Pending' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                    : 'bg-red-500/20 border-red-500 text-red-400'
                                            : 'border-white/10 text-text-muted hover:bg-white/5'
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Template Selection */}
                <motion.section variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">Template</label>
                    <button
                        type="button"
                        onClick={() => setIsTemplateSelectorOpen(true)}
                        className="w-full py-3 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                <LayoutTemplate className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{getTemplateById(templateId, cachedSettings?.customTemplates).name}</p>
                                <p className="text-xs text-text-muted">{getTemplateById(templateId, cachedSettings?.customTemplates).description}</p>
                            </div>
                        </div>
                        <div className="text-xs font-medium text-primary px-3 py-1 rounded-full bg-primary/10">
                            Change
                        </div>
                    </button>
                </motion.section>

                <TemplateSelector
                    isOpen={isTemplateSelectorOpen}
                    onClose={() => setIsTemplateSelectorOpen(false)}
                    onSelect={(id, config) => {
                        setTemplateId(id);
                        setTemplateConfig(config);
                        setIsTemplateSelectorOpen(false);
                    }}
                    currentTemplateId={templateId}
                    currentConfig={templateConfig}
                    customTemplates={cachedSettings?.customTemplates}
                    disableCustomization={true}
                />

                {/* Total Amount */}
                <motion.section
                    variants={itemVariants}
                    className="glass-panel rounded-3xl p-6 space-y-4"
                >
                    <div className="flex justify-between text-text-muted">
                        <span>Subtotal</span>
                        <span>${calculateSubtotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                        <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                        <span>${calculateTax().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-white pt-4 border-t border-white/10">
                        <span>Total amount</span>
                        <span>${calculateTotal().toLocaleString()}</span>
                    </div>
                </motion.section>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="space-y-3 pt-4">
                    {id && (
                        <button
                            type="button"
                            onClick={() => handlePrint && handlePrint()}
                            className="btn-outline w-full flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download PDF
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-dark w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {id ? 'Update invoice' : 'Save invoice'}
                    </button>
                </motion.div>
            </form>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </motion.div>
    );
};

export default InvoiceForm;
