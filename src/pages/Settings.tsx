import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserSettings, updateUserSettings } from '../lib/firestore';

const Settings = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [taxRate, setTaxRate] = useState(10); // Display as percentage
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                try {
                    const settings = await getUserSettings(user.uid);
                    setTaxRate(settings.taxRate * 100);
                    setCompanyName(settings.companyName || '');
                    setCompanyAddress(settings.companyAddress || '');
                    setCompanyEmail(settings.companyEmail || '');
                } catch (error) {
                    console.error("Error fetching settings:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateUserSettings(user.uid, {
                taxRate: taxRate / 100,
                companyName,
                companyAddress,
                companyEmail
            });
            alert('Settings saved successfully');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="glass-panel p-8 rounded-2xl space-y-8">
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
                    <h2 className="text-xl font-bold text-white mb-4">Company Details</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Ndito Travel"
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
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
