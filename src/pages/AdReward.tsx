import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { monetizationService } from '../lib/MonetizationService';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../lib/firestore';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Play from 'lucide-react/dist/esm/icons/play';
import Gift from 'lucide-react/dist/esm/icons/gift';

const AdReward = () => {
    const navigate = useNavigate();
    const { user, userProfile, refreshProfile } = useAuth();
    const [timeLeft, setTimeLeft] = useState(15);
    const [canSkip, setCanSkip] = useState(false);
    const [claiming, setClaiming] = useState(false);

    const adInitialized = useRef(false);

    useEffect(() => {
        if (adInitialized.current) return;
        adInitialized.current = true;

        // Initialize AdSense
        // TODO: Replace with your actual AdSense Client ID
        monetizationService.init('ca-pub-2822990308377679');

        // Push ad with a slight delay to ensure DOM is ready
        setTimeout(() => {
            try {
                monetizationService.pushAd({});
            } catch (e) {
                console.error("Ad push error:", e);
            }
        }, 500);

        // Timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanSkip(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleClaimReward = async () => {
        if (!user || !userProfile) return;

        setClaiming(true);
        try {
            const currentLimit = userProfile.allowedInvoices || 5;
            // Optimistic update
            await updateUserProfile(user.uid, {
                allowedInvoices: currentLimit + 1
            });
            await refreshProfile();
            navigate(-1); // Go back
        } catch (error) {
            console.error("Error claiming reward:", error);
            setClaiming(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020c1b] flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#112240] rounded-2xl p-8 border border-[#233554] shadow-xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Gift className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Watch Ad to Earn Free Invoice</h1>
                    <p className="text-text-muted">
                        Support us by watching a short ad and get 1 extra invoice limit instantly.
                    </p>
                </div>

                {/* Ad Container */}
                <div className="bg-black/40 rounded-xl border border-white/5 min-h-[300px] flex flex-col items-center justify-center mb-8 relative overflow-hidden p-4">
                    <div className="w-full flex justify-center">
                        {/* Placeholder for AdSense */}
                        <ins className="adsbygoogle"
                            style={{ display: 'block' }}
                            data-ad-client="ca-pub-2822990308377679"
                            data-ad-slot="8195194873"
                            data-ad-format="auto"
                            data-full-width-responsive="true"></ins>
                    </div>
                    <span className="text-text-muted text-xs mt-2 opacity-50">Ad Advertisement</span>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-4">
                    {!canSkip ? (
                        <div className="flex items-center gap-2 text-text-muted">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Reward available in {timeLeft}s</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleClaimReward}
                            disabled={claiming}
                            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary-dark hover:to-purple-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {claiming ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Claiming Reward...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>Claim Free Invoice</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => navigate(-1)}
                        className="text-text-muted hover:text-white text-sm transition-colors mt-2"
                    >
                        Cancel and Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdReward;
