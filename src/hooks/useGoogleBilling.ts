import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { functions } from '../lib/firebase';

/** Response type from the verifySubscription Cloud Function */
interface VerifySubscriptionResponse {
    success: boolean;
    message: string;
    expiryTimeMillis?: number;
}

export const useGoogleBilling = () => {
    const { user, refreshProfile } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if ('getDigitalGoodsService' in window) {
            setIsSupported(true);
        }
    }, []);

    /**
     * Verifies a purchase token with the backend Cloud Function.
     * The Cloud Function handles all verification with Google Play
     * and updates the user's Firestore document if valid.
     * 
     * Note: No direct Firestore writes happen here - all updates
     * are performed securely on the server side.
     */
    const verifyPurchaseOnBackend = useCallback(async (purchaseToken: string, sku: string): Promise<boolean> => {
        if (!user) {
            console.error("Cannot verify purchase: User not authenticated");
            return false;
        }

        if (!purchaseToken || !sku) {
            console.error("Cannot verify purchase: Missing purchaseToken or sku");
            return false;
        }

        setIsVerifying(true);
        console.log("Verifying purchase token on backend...");

        try {
            const verifySubscription = httpsCallable<
                { purchaseToken: string; sku: string },
                VerifySubscriptionResponse
            >(functions, 'verifySubscription');

            const result: HttpsCallableResult<VerifySubscriptionResponse> = await verifySubscription({
                purchaseToken,
                sku
            });

            const data = result.data;
            console.log("Verification result:", data);

            if (data.success) {
                // Refresh the user profile to get updated isPro status
                await refreshProfile();
                alert("🎉 Subscription verified and active!");
                return true;
            } else {
                console.warn("Verification failed:", data.message);
                alert("Verification failed: " + data.message);
                return false;
            }
        } catch (error: unknown) {
            console.error("Error calling verifySubscription:", error);

            // Extract error message if available
            let errorMessage = "An unexpected error occurred.";
            if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = (error as { message: string }).message;
            }

            alert("Error verifying subscription: " + errorMessage + "\nPlease contact support if this persists.");
            return false;
        } finally {
            setIsVerifying(false);
        }
    }, [user, refreshProfile]);

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

            await verifyPurchaseOnBackend(purchaseToken, sku);
            await response.complete('success');

        } catch (error) {
            console.error("Purchase failed:", error);
        }
    };

    return {
        isSupported,
        isVerifying,
        handlePurchase
    };
};
