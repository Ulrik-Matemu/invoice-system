import React from 'react';
import { useNavigate } from 'react-router-dom';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Play from 'lucide-react/dist/esm/icons/play';
import { useGoogleBilling } from '../hooks/useGoogleBilling';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Replace with your actual SKU from Google Play Console
const PRO_SUBSCRIPTION_SKU = 'premium_monthly_plan';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { handlePurchase, isVerifying } = useGoogleBilling();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleStartTrial = () => {
        handlePurchase(PRO_SUBSCRIPTION_SKU);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a192f] border border-primary/20 rounded-2xl max-w-md w-full p-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>

                <button
                    onClick={onClose}
                    disabled={isVerifying}
                    className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Professional</h2>
                    <p className="text-text-muted">You've reached your free invoice limit (5/month).</p>
                </div>

                <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Pro Features</h3>
                    <div className="flex items-center gap-3 text-text-main">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <span>Unlimited Invoices</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-main">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <span>Unlimited Custom Service Types</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-main">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <span>Advanced Tax & Expense Reports</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-main">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <span>Batch PDF Export</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-main">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <span>Edit Invoice Numbers & Client Details</span>
                    </div>
                </div>

                {/* Subscribe Button - Primary CTA */}
                <button
                    onClick={handleStartTrial}
                    disabled={isVerifying}
                    className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary-dark hover:to-purple-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                    {isVerifying ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            <span>Subscribe for $7/month</span>
                        </>
                    )}
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-text-muted text-xs">OR</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                    onClick={() => navigate('/ad-reward')}
                    className="w-full bg-[#112240] hover:bg-[#1d3557] text-white font-medium py-3 px-6 rounded-xl transition-all border border-primary/20 flex items-center justify-center gap-2 mb-3"
                >
                    <Play className="w-4 h-4 text-primary" />
                    <span>Watch Ad for 1 Free Invoice</span>
                </button>

                <p className="text-xs text-center text-text-muted">
                    Cancel anytime • Billed monthly
                </p>

                <p className="text-xs text-center text-text-muted mt-4 pt-4 border-t border-white/5">
                    Secure payment via Google Play. Your subscription will automatically renew unless cancelled.
                </p>
            </div>
        </div>
    );
};

