"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySubscription = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const googleapis_1 = require("googleapis");
admin.initializeApp();
const androidPublisher = googleapis_1.google.androidpublisher("v3");
// Package name for your Android app - set this in Firebase environment config
// Run: firebase functions:config:set app.package_name="com.yourcompany.yourapp"
const getPackageName = () => {
    var _a;
    const packageName = (_a = functions.config().app) === null || _a === void 0 ? void 0 : _a.package_name;
    if (!packageName) {
        throw new functions.https.HttpsError("failed-precondition", "Package name not configured. Set app.package_name in Firebase config.");
    }
    return packageName;
};
/**
 * Determines if a subscription is in an "Active" state.
 * Active means: (payment received OR free trial) AND not expired
 */
const isSubscriptionActive = (paymentState, expiryTimeMillis, cancelReason) => {
    const now = Date.now();
    const expiryTime = parseInt(expiryTimeMillis || "0", 10);
    // Check if subscription has expired
    if (expiryTime > 0 && expiryTime < now) {
        return { isActive: false, reason: "Subscription has expired." };
    }
    // Check if subscription was cancelled and refunded (cancelReason: 1 = system cancelled, 2 = user cancelled, 3 = replaced)
    if (cancelReason !== undefined && cancelReason !== null) {
        // If cancelled but not yet expired, still active until expiry
        if (expiryTime > now) {
            return { isActive: true, reason: "Subscription active but cancelled. Will expire at end of period." };
        }
        return { isActive: false, reason: "Subscription cancelled." };
    }
    // Check payment state
    switch (paymentState) {
        case 1: // Payment received
            return { isActive: true, reason: "Payment received - subscription active." };
        case 2: // Free trial
            return { isActive: true, reason: "Free trial - subscription active." };
        case 0: // Payment pending
            return { isActive: false, reason: "Payment pending." };
        case 3: // Pending deferred upgrade/downgrade
            return { isActive: true, reason: "Subscription active with pending changes." };
        default:
            return { isActive: false, reason: "Unknown payment state." };
    }
};
exports.verifySubscription = functions.https.onCall(async (data, context) => {
    // 1. Security: Verify the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { purchaseToken, sku } = data;
    const userId = context.auth.uid;
    // 2. Validate required parameters
    if (!purchaseToken || typeof purchaseToken !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "A valid purchaseToken is required.");
    }
    if (!sku || typeof sku !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "A valid sku (subscription ID) is required.");
    }
    try {
        const packageName = getPackageName();
        // 3. Set up Google Play Developer API authentication
        // Use GoogleAuth directly - it handles credential selection automatically
        const auth = new googleapis_1.google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
        // Pass the GoogleAuth instance directly instead of a client
        googleapis_1.google.options({ auth });
        // 4. Verify the subscription with Google Play Developer API
        const result = await androidPublisher.purchases.subscriptions.get({
            packageName: packageName,
            subscriptionId: sku,
            token: purchaseToken,
        });
        const subscription = result.data;
        const expiryTimeMillis = subscription.expiryTimeMillis || "0";
        const paymentState = subscription.paymentState;
        const cancelReason = subscription.cancelReason;
        // 5. Check if subscription is in an Active state
        const { isActive, reason } = isSubscriptionActive(paymentState, expiryTimeMillis, cancelReason);
        console.log(`Subscription check for user ${userId}: ${reason}`, {
            paymentState,
            expiryTimeMillis,
            cancelReason,
            isActive
        });
        if (isActive) {
            // 6. Update Firestore with Pro status
            await admin.firestore().collection("users").doc(userId).update({
                isPro: true,
                subscriptionExpiry: parseInt(expiryTimeMillis, 10),
                subscriptionSku: sku,
                lastVerified: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                message: reason,
                expiryTimeMillis: parseInt(expiryTimeMillis, 10)
            };
        }
        else {
            // Subscription not active - ensure isPro is false
            await admin.firestore().collection("users").doc(userId).update({
                isPro: false,
                lastVerified: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: false, message: reason };
        }
    }
    catch (error) {
        console.error("Error verifying subscription:", error);
        // Handle specific Google API errors
        if (error && typeof error === "object" && "code" in error) {
            const apiError = error;
            if (apiError.code === 404) {
                throw new functions.https.HttpsError("not-found", "Subscription not found. The purchase token may be invalid or expired.");
            }
            if (apiError.code === 401 || apiError.code === 403) {
                throw new functions.https.HttpsError("permission-denied", "Server not authorized to verify subscriptions. Please contact support.");
            }
        }
        throw new functions.https.HttpsError("internal", "Failed to verify subscription with Google Play. Please try again later.");
    }
});
//# sourceMappingURL=index.js.map