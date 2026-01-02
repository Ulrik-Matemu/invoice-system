import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc
} from 'firebase/firestore';
import { db } from '../lib/db';
import { useAuth } from './AuthContext';
import type { Invoice, Client, UserSettings, Expense } from '../lib/firestore';

interface CacheContextType {
    invoices: Invoice[];
    clients: Client[];
    settings: UserSettings | null;
    expenses: Expense[];
    loading: boolean;
    refreshData: () => void; // Optional, as onSnapshot handles updates
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const useCache = () => {
    const context = useContext(CacheContext);
    if (context === undefined) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
};

interface CacheProviderProps {
    children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Track loading state for each subscription
    const [invoicesLoaded, setInvoicesLoaded] = useState(false);
    const [clientsLoaded, setClientsLoaded] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [expensesLoaded, setExpensesLoaded] = useState(false);

    useEffect(() => {
        if (!user) {
            setInvoices([]);
            setClients([]);
            setSettings(null);
            setExpenses([]);
            setLoading(false);
            setInvoicesLoaded(false);
            setClientsLoaded(false);
            setSettingsLoaded(false);
            setExpensesLoaded(false);
            return;
        }

        setLoading(true);
        setInvoicesLoaded(false);
        setClientsLoaded(false);
        setSettingsLoaded(false);
        setExpensesLoaded(false);

        // Invoices Subscription
        const qInvoices = query(
            collection(db, 'invoices'),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
            const newInvoices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Invoice[];
            setInvoices(newInvoices);
            setInvoicesLoaded(true);
        }, (error) => {
            console.error("Error listening to invoices:", error);
            setInvoicesLoaded(true); // Proceed even on error
        });

        // Clients Subscription
        const qClients = query(
            collection(db, 'clients'),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
            const newClients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[];
            setClients(newClients);
            setClientsLoaded(true);
        }, (error) => {
            console.error("Error listening to clients:", error);
            setClientsLoaded(true);
        });

        // Settings Subscription
        const settingsRef = doc(db, 'settings', user.uid);
        const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as UserSettings);
            } else {
                // Default settings if not found
                setSettings({ userId: user.uid, taxRate: 0.1 });
            }
            setSettingsLoaded(true);
        }, (error) => {
            console.error("Error listening to settings:", error);
            setSettingsLoaded(true);
        });

        // Expenses Subscription
        const qExpenses = query(
            collection(db, 'expenses'),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
            const newExpenses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            setExpenses(newExpenses);
            setExpensesLoaded(true);
        }, (error) => {
            console.error("Error listening to expenses:", error);
            setExpensesLoaded(true); // Proceed even on error
        });

        return () => {
            unsubscribeInvoices();
            unsubscribeClients();
            unsubscribeSettings();
            unsubscribeExpenses();
        };
    }, [user]);

    useEffect(() => {
        if (user && invoicesLoaded && clientsLoaded && settingsLoaded && expensesLoaded) {
            setLoading(false);
        }
    }, [invoicesLoaded, clientsLoaded, settingsLoaded, expensesLoaded, user]);

    const value = {
        invoices,
        clients,
        settings,
        expenses,
        loading,
        refreshData: () => { } // No-op for now as onSnapshot handles it
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};
