import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    type User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile, getUserProfile, type UserProfile } from '../lib/firestore';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean; // True while Firebase Auth is initializing
    profileLoading: boolean; // True while profile is being fetched
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const refreshProfile = async () => {
        if (user) {
            setProfileLoading(true);
            try {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
            } finally {
                setProfileLoading(false);
            }
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false); // Auth state is now known - render the app immediately

            if (currentUser) {
                setProfileLoading(true);
                try {
                    // Create or get user profile (happens in background after render)
                    const profile = await createUserProfile({
                        uid: currentUser.uid,
                        email: currentUser.email
                    });
                    setUserProfile(profile);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                } finally {
                    setProfileLoading(false);
                }
            } else {
                setUserProfile(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
        setUserProfile(null);
    };

    const value = {
        user,
        userProfile,
        loading,
        profileLoading,
        signIn,
        signUp,
        logout,
        refreshProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
