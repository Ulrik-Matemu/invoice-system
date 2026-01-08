import { enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { app } from "./firebase";

// Initialize Firestore with settings optimized for faster cold starts
export const db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: false, // Use WebSocket (faster) instead of long polling
});

// Enable offline persistence for faster subsequent loads
// This caches the user profile locally so future app launches are instant
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firestore persistence unavailable - multiple tabs open');
    } else if (err.code === 'unimplemented') {
        // Browser doesn't support required features
        console.warn('Firestore persistence not supported in this browser');
    }
});
