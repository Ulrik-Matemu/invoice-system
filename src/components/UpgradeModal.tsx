import React from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { useGoogleBilling } from '../hooks/useGoogleBilling';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { handlePurchase } = useGoogleBilling();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a192f] border border-primary/20 rounded-2xl max-w-md w-full p-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
                    <p className="text-text-muted">You've reached your free invoice limit.</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-text-main">
                        <Check className="w-5 h-5 text-primary" />
                        <span>Unlimited Invoices</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-main">
                        <Check className="w-5 h-5 text-primary" />
                        <span>Premium Templates</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-main">
                        <Check className="w-5 h-5 text-primary" />
                        <span>Remove Watermarks</span>
                    </div>
                </div>

                <button
                    onClick={() => handlePurchase('pro_monthly')}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                    <span>Subscribe for $7/mo</span>
                </button>

                <p className="text-xs text-center text-text-muted mt-4">
                    Cancel anytime. Secure payment via Google Play.
                </p>
            </div>
        </div>
    );
};
