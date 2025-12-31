import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../lib/firestore';

export const useGoogleBilling = () => {
    const { user, refreshProfile } = useAuth();
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('getDigitalGoodsService' in window) {
            setIsSupported(true);
        }
    }, []);

    const verifyPurchaseOnBackend = async (purchaseToken: string) => {
        // Placeholder for backend verification
        console.log("Verifying purchase token:", purchaseToken);

        if (user) {
            // In a real app, you would validate the token with your backend
            // which would then validate with Google Play Developer API

            // For this implementation, we trust the client and update Firestore
            await updateUserProfile(user.uid, { isPro: true });
            await refreshProfile();
        }
    };

    const handlePurchase = async (sku: string) => {
        if (!isSupported) {
            console.warn("Digital Goods API not supported");
            // Fallback or alert for testing on non-TWA environments
            alert("Digital Goods API not available. This feature works in TWA.");
            return;
        }

        try {
            const service = await (window as any).getDigitalGoodsService("https://play.google.com/billing");
            const details = await service.getDetails([sku]);

            if (details.length === 0) {
                console.error("Could not find product:", sku);
                alert("Product not found");
                return;
            }

            const request = new PaymentRequest([{
                supportedMethods: "https://play.google.com/billing",
                data: {
                    sku: sku,
                },
            }], {
                total: { label: details[0].title, amount: { currency: details[0].price.currency, value: details[0].price.value } }
            });

            const response = await request.show();
            const { purchaseToken } = response.details;

            await verifyPurchaseOnBackend(purchaseToken);
            await response.complete('success');

        } catch (error) {
            console.error("Purchase failed:", error);
        }
    };

    return {
        isSupported,
        handlePurchase
    };
};
