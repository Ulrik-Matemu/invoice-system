import { useState, useEffect } from 'react';
import Save from 'lucide-react/dist/esm/icons/save';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import { useAuth } from '../context/AuthContext';
import { useBlocker, useNavigate } from 'react-router-dom';
import { updateUserSettings, deleteUserAccount, type ServiceTypeConfig } from '../lib/firestore';
import Swal from 'sweetalert2';

import { useCache } from '../context/CacheContext';

const Settings = () => {
    const { user, logout } = useAuth();
    const { settings: cachedSettings, loading: cacheLoading } = useCache();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [taxRate, setTaxRate] = useState(10); // Display as percentage
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyTaxId, setCompanyTaxId] = useState(''); // TIN
    const [companyTaxNumber, setCompanyTaxNumber] = useState(''); // VRN
    const [companyLicenseNumber, setCompanyLicenseNumber] = useState('');
    const [defaultTemplate, setDefaultTemplate] = useState<'standard' | 'premium'>('standard');
    const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
    const [enableAgentDetails, setEnableAgentDetails] = useState(true);
    const [newServiceType, setNewServiceType] = useState('');
    const [newServiceRequiresDates, setNewServiceRequiresDates] = useState(false);
    const [newServiceLabel, setNewServiceLabel] = useState('Description');
    const [initialSettings, setInitialSettings] = useState<string>('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (cachedSettings) {
            setTaxRate(cachedSettings.taxRate * 100);
            setCompanyName(cachedSettings.companyName || '');
            setCompanyAddress(cachedSettings.companyAddress || '');
            setCompanyEmail(cachedSettings.companyEmail || '');
            setCompanyPhone(cachedSettings.companyPhone || '');
            setCompanyWebsite(cachedSettings.companyWebsite || '');
            setCompanyTaxId(cachedSettings.companyTaxId || '');
            setCompanyTaxNumber(cachedSettings.companyTaxNumber || '');
            setCompanyLicenseNumber(cachedSettings.companyLicenseNumber || '');
            setDefaultTemplate(cachedSettings.defaultTemplate || 'standard');

            // Migration: Convert string[] to ServiceTypeConfig[] if needed
            const loadedServices = cachedSettings.serviceTypes || [];
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

            if (normalizedServices.length === 0) {
                setServiceTypes([
                    { name: 'Service', requiresDates: false, descriptionLabel: 'Description' },
                    { name: 'Product', requiresDates: false, descriptionLabel: 'Description' },
                    { name: 'Hours', requiresDates: false, descriptionLabel: 'Description' }
                ]);
            } else {
                setServiceTypes(normalizedServices);
            }
            setEnableAgentDetails(cachedSettings.enableAgentDetails !== undefined ? cachedSettings.enableAgentDetails : true);

            // Store initial state for dirty checking
            setInitialSettings(JSON.stringify({
                taxRate: cachedSettings.taxRate * 100,
                companyName: cachedSettings.companyName || '',
                companyAddress: cachedSettings.companyAddress || '',
                companyEmail: cachedSettings.companyEmail || '',
                companyPhone: cachedSettings.companyPhone || '',
                companyWebsite: cachedSettings.companyWebsite || '',
                companyTaxId: cachedSettings.companyTaxId || '',
                companyTaxNumber: cachedSettings.companyTaxNumber || '',
                companyLicenseNumber: cachedSettings.companyLicenseNumber || '',
                defaultTemplate: cachedSettings.defaultTemplate || 'standard',
                serviceTypes: normalizedServices,
                enableAgentDetails: cachedSettings.enableAgentDetails !== undefined ? cachedSettings.enableAgentDetails : true
            }));
        }
    }, [cachedSettings]);

    // Check for unsaved changes
    useEffect(() => {
        if (!cacheLoading) {
            const currentSettings = JSON.stringify({
                taxRate,
                companyName,
                companyAddress,
                companyEmail,
                companyPhone,
                companyWebsite,
                companyTaxId,
                companyTaxNumber,
                companyLicenseNumber,
                defaultTemplate,
                serviceTypes,
                enableAgentDetails
            });
            setIsDirty(currentSettings !== initialSettings);
        }
    }, [taxRate, companyName, companyAddress, companyEmail, companyPhone, companyWebsite, companyTaxId, companyTaxNumber, companyLicenseNumber, defaultTemplate, serviceTypes, enableAgentDetails, initialSettings, cacheLoading]);

    // Warn on navigation (Browser Refresh/Close)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Warn on navigation (In-App)
    // Note: To use `useBlocker` in react-router-dom v6.4+, your application must be configured with a Data Router (e.g., using createBrowserRouter and RouterProvider).
    // If you are not using a Data Router, `useBlocker` will not work.
    // For applications not using a Data Router, you would typically implement a custom navigation blocker
    // using `useNavigate` and `useLocation` with a state management approach, or a library like `react-router-dom-v5-compat`'s `usePrompt`.
    // Assuming the intent is to enable `useBlocker` and the root router will be updated to a Data Router.
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }: { currentLocation: any; nextLocation: any }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            Swal.fire({
                title: "Do you want to save changes?",
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: "Save",
                denyButtonText: `Don't save`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const success = await handleSave();
                    if (success) {
                        blocker.proceed();
                    } else {
                        blocker.reset();
                    }
                } else if (result.isDenied) {
                    blocker.proceed();
                } else {
                    blocker.reset();
                }
            });
        }
    }, [blocker]);

    const handleSave = async () => {
        if (!user) return false;
        setIsSaving(true);
        try {
            const newSettings = {
                taxRate: taxRate / 100,
                companyName,
                companyAddress,
                companyEmail,
                companyPhone,
                companyWebsite,
                companyTaxId,
                companyTaxNumber,
                companyLicenseNumber,
                defaultTemplate,
                serviceTypes,
                enableAgentDetails
            };
            await updateUserSettings(user.uid, newSettings);

            // Update initial settings to current state
            setInitialSettings(JSON.stringify({
                taxRate,
                companyName,
                companyAddress,
                companyEmail,
                companyPhone,
                companyWebsite,
                companyTaxId,
                companyTaxNumber,
                companyLicenseNumber,
                defaultTemplate,
                serviceTypes,
                enableAgentDetails
            }));
            setIsDirty(false);

            Swal.fire({
                title: 'Settings saved successfully',
                icon: 'success',
                showConfirmButton: false,
                timer: 1000
            })
            return true;
        } catch (error) {
            console.error("Error saving settings:", error);
            Swal.fire({
                title: 'Failed to save settings',
                icon: 'error',
                showConfirmButton: false,
                timer: 1500
            })
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        const result = await Swal.fire({
            title: 'Delete Account?',
            text: "This will permanently delete all your data, including invoices and clients. This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete my account'
        });

        if (result.isConfirmed) {
            try {
                setIsDeleting(true);
                // 1. Delete Firestore data
                await deleteUserAccount(user.uid);

                // 2. Delete Auth user
                await user.delete();

                // 3. Cleanup local state
                await logout();

                navigate('/login');

                Swal.fire(
                    'Deleted!',
                    'Your account has been deleted.',
                    'success'
                );
            } catch (error: any) {
                console.error("Error deleting account:", error);
                // If requires recent login
                if (error.code === 'auth/requires-recent-login') {
                    Swal.fire(
                        'Login Required',
                        'Please log out and log back in to delete your account.',
                        'error'
                    );
                } else {
                    Swal.fire(
                        'Error',
                        'Failed to delete account. Please try again.',
                        'error'
                    );
                }
                setIsDeleting(false);
            }
        }
    };

    const addServiceType = () => {
        if (newServiceType && !serviceTypes.find(s => s.name === newServiceType)) {
            setServiceTypes([...serviceTypes, {
                name: newServiceType,
                requiresDates: newServiceRequiresDates,
                descriptionLabel: newServiceLabel || 'Description'
            }]);
            setNewServiceType('');
            setNewServiceRequiresDates(false);
            setNewServiceLabel('Description');
        }
    };

    const removeServiceType = (name: string) => {
        setServiceTypes(serviceTypes.filter(t => t.name !== name));
    };

    if (cacheLoading || isDeleting) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="glass-panel p-4 md:p-8 rounded-2xl space-y-8 mb-20 md:mb-0">
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Invoice Configuration</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Default Tax Rate (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                            <p className="text-xs text-text-muted">This tax rate will be applied to all new invoices.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Features & Customization</h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-light/30 border border-white/10">
                            <div>
                                <h3 className="font-medium text-white">Agent & Referral Details</h3>
                                <p className="text-sm text-text-muted">Enable fields for Client Type (Direct/Agent) and Agent Name.</p>
                            </div>
                            <button
                                onClick={() => setEnableAgentDetails(!enableAgentDetails)}
                                className={`relative inline-flex h-6 w-1/2 md:w-11 items-center rounded-full transition-colors ${enableAgentDetails ? 'bg-primary' : 'bg-white/20'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableAgentDetails ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-white">Service Types</h3>
                            <p className="text-sm text-text-muted">Customize the types of services you offer and their details.</p>

                            <div className="p-4 rounded-xl bg-surface-light/30 border border-white/10 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-text-muted">Service Name</label>
                                        <input
                                            type="text"
                                            value={newServiceType}
                                            onChange={(e) => setNewServiceType(e.target.value)}
                                            placeholder="e.g. Consulting"
                                            className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-text-muted">Description Label</label>
                                        <input
                                            type="text"
                                            value={newServiceLabel}
                                            onChange={(e) => setNewServiceLabel(e.target.value)}
                                            placeholder="e.g. Project Name"
                                            className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="requiresDates"
                                            checked={newServiceRequiresDates}
                                            onChange={(e) => setNewServiceRequiresDates(e.target.checked)}
                                            className="w-4 h-4 rounded border-white/10 bg-surface-light/50 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="requiresDates" className="text-sm text-white select-none">Requires Dates?</label>
                                    </div>
                                </div>
                                <button
                                    onClick={addServiceType}
                                    disabled={!newServiceType}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Service Type
                                </button>
                            </div>

                            <div className="space-y-2">
                                {serviceTypes.map((service) => (
                                    <div key={service.name} className="flex items-center justify-between bg-surface-light/50 border border-white/10 px-4 py-3 rounded-xl">
                                        <div>
                                            <div className="font-medium text-white">{service.name}</div>
                                            <div className="text-xs text-text-muted flex gap-2">
                                                <span>Label: {service.descriptionLabel}</span>
                                                <span>•</span>
                                                <span>{service.requiresDates ? 'Requires Dates' : 'No Dates'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeServiceType(service.name)}
                                            className="text-text-muted hover:text-red-400 transition-colors p-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Invoice Template</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setDefaultTemplate('standard')}
                            className={`p-4 rounded-xl border text-left transition-all ${defaultTemplate === 'standard'
                                ? 'bg-primary/20 border-primary'
                                : 'bg-surface-light/30 border-white/10 hover:bg-surface-light/50'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-full border mb-3 ${defaultTemplate === 'standard'
                                ? 'border-primary bg-primary'
                                : 'border-white/30'
                                }`} />
                            <h3 className="font-bold text-white mb-1">Standard</h3>
                            <p className="text-sm text-text-muted">Clean and professional design suitable for most businesses.</p>
                        </button>

                        <button
                            onClick={() => setDefaultTemplate('premium')}
                            className={`p-4 rounded-xl border text-left transition-all ${defaultTemplate === 'premium'
                                ? 'bg-primary/20 border-primary'
                                : 'bg-surface-light/30 border-white/10 hover:bg-surface-light/50'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-full border mb-3 ${defaultTemplate === 'premium'
                                ? 'border-primary bg-primary'
                                : 'border-white/30'
                                }`} />
                            <h3 className="font-bold text-white mb-1">Premium</h3>
                            <p className="text-sm text-text-muted">Elegant, high-end design with modern typography and layout.</p>
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Company Details</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. New Travels"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Company Address</label>
                            <input
                                type="text"
                                value={companyAddress}
                                onChange={(e) => setCompanyAddress(e.target.value)}
                                placeholder="e.g. Njiro Road, Arusha, Tanzania"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Company Email</label>
                            <input
                                type="email"
                                value={companyEmail}
                                onChange={(e) => setCompanyEmail(e.target.value)}
                                placeholder="e.g. office@nditotravel.co.tz"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Phone Number</label>
                            <input
                                type="tel"
                                value={companyPhone}
                                onChange={(e) => setCompanyPhone(e.target.value)}
                                placeholder="e.g. +255 123 456 789"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Website</label>
                            <input
                                type="url"
                                value={companyWebsite}
                                onChange={(e) => setCompanyWebsite(e.target.value)}
                                placeholder="e.g. https://www.nditotravel.co.tz"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Tax ID (TIN)</label>
                            <input
                                type="text"
                                value={companyTaxId}
                                onChange={(e) => setCompanyTaxId(e.target.value)}
                                placeholder="Tax Identification Number"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Tax Number (VRN)</label>
                            <input
                                type="text"
                                value={companyTaxNumber}
                                onChange={(e) => setCompanyTaxNumber(e.target.value)}
                                placeholder="VAT Registration Number"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">License Number</label>
                            <input
                                type="text"
                                value={companyLicenseNumber}
                                onChange={(e) => setCompanyLicenseNumber(e.target.value)}
                                placeholder="Business License Number"
                                className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>
                </div>


                <div>
                    <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h3 className="font-bold text-white mb-2">Delete Account</h3>
                        <p className="text-sm text-text-muted mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-colors text-sm font-medium"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg ${isDirty
                            ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
                            : 'bg-white/10 text-white/50 cursor-not-allowed'
                            }`}
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isDirty ? 'Save Changes' : 'Saved'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default Settings;
