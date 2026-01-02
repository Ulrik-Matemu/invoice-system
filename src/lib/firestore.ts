import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
    setDoc,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './db';

export interface InvoiceItem {
    id: string;
    serviceType: 'Hotel' | 'Safari' | 'Transfer' | 'Flight' | 'Custom Package' | 'Other';
    description: string;
    startDate?: string;
    endDate?: string;
    checkIn?: string; // Kept for backward compatibility
    checkOut?: string; // Kept for backward compatibility
    price: number;
    quantity: number;
}

export interface Invoice {
    id?: string;
    userId: string;
    clientName: string;
    agentName?: string;
    clientType: 'Direct' | 'Agent';
    items: InvoiceItem[];
    totalAmount: number;
    status: 'Pending' | 'Paid' | 'Overdue';
    createdAt: Timestamp;
    dueDate: string;
    invoiceNumber: string;
    taxRate: number;
    companyName?: string;
    companyAddress?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyWebsite?: string;
    companyTaxId?: string; // TIN
    companyTaxNumber?: string; // VRN
    companyLicenseNumber?: string;
    templateId?: 'standard' | 'premium';
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export interface UserProfile {
    uid: string;
    email: string;
    isPro: boolean;
    invoiceCount: number;
}

export interface Expense {
    id: string;
    userId: string;
    description: string;
    amount: number;
    category: 'Rent' | 'Supplies' | 'Travel' | 'Software' | 'Other';
    date: string;
    createdAt: any;
}

export const getUserProfile = async (uid: string) => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw error;
    }
};

export const createUserProfile = async (user: { uid: string; email: string | null }) => {
    try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                isPro: false,
                invoiceCount: 0
            };
            await setDoc(docRef, newProfile);
            return newProfile;
        }
        return docSnap.data() as UserProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
        // Check user limits
        const userProfile = await getUserProfile(invoiceData.userId);

        if (userProfile) {
            if (!userProfile.isPro && userProfile.invoiceCount >= 5) {
                throw new Error("Free limit reached. Please upgrade to Pro.");
            }
        }

        const docRef = await addDoc(collection(db, 'invoices'), {
            ...invoiceData,
            createdAt: Timestamp.now(),
        });

        // Increment invoice count
        const userRef = doc(db, 'users', invoiceData.userId);
        await updateDoc(userRef, {
            invoiceCount: increment(1)
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding invoice: ", error);
        throw error;
    }
};

export const getInvoices = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'invoices'),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Invoice[];
    } catch (error) {
        console.error("Error getting invoices: ", error);
        throw error;
    }
};

export const getDashboardStats = async (userId: string) => {
    try {
        const invoices = await getInvoices(userId);

        const totalRevenue = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const pendingCount = invoices.filter(inv => inv.status === 'Pending').length;
        const paidCount = invoices.filter(inv => inv.status === 'Paid').length;

        // Unique clients
        const uniqueClients = new Set(invoices.map(inv => inv.clientName)).size;

        return {
            totalRevenue,
            pendingCount,
            paidCount,
            activeClients: uniqueClients
        };
    } catch (error) {
        console.error("Error getting stats: ", error);
        throw error;
    }
};

export const getInvoice = async (invoiceId: string) => {
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Invoice;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting invoice:", error);
        throw error;
    }
};

export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Invoice>) => {
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        await updateDoc(docRef, invoiceData);
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
};

export const deleteInvoice = async (invoiceId: string, userId: string) => {
    try {
        // Delete the invoice
        await deleteDoc(doc(db, 'invoices', invoiceId));

        // Decrement invoice count
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            invoiceCount: increment(-1)
        });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        throw error;
    }
};

// Client Management

export interface Client {
    id?: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Timestamp;
}

export const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'clients'), {
            ...clientData,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding client: ", error);
        throw error;
    }
};

export const getClients = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'clients'),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Client[];
    } catch (error) {
        console.error("Error getting clients: ", error);
        throw error;
    }
};

export const deleteUserAccount = async (userId: string) => {
    try {
        // Delete invoices
        const invoices = await getInvoices(userId);
        for (const invoice of invoices) {
            if (invoice.id) await deleteDoc(doc(db, 'invoices', invoice.id));
        }

        // Delete clients
        const clients = await getClients(userId);
        for (const client of clients) {
            if (client.id) await deleteDoc(doc(db, 'clients', client.id));
        }

        // Delete settings
        await deleteDoc(doc(db, 'settings', userId));

        // Delete user profile
        await deleteDoc(doc(db, 'users', userId));

    } catch (error) {
        console.error("Error deleting user account:", error);
        throw error;
    }
};

export const deleteClient = async (clientId: string) => {
    try {
        await deleteDoc(doc(db, 'clients', clientId));
    } catch (error) {
        console.error("Error deleting client: ", error);
        throw error;
    }
};

// User Settings

export interface ServiceTypeConfig {
    name: string;
    requiresDates: boolean;
    descriptionLabel: string;
}

export interface UserSettings {
    userId: string;
    taxRate: number;
    companyName?: string;
    companyAddress?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyWebsite?: string;
    companyTaxId?: string; // TIN
    companyTaxNumber?: string; // VRN
    companyLicenseNumber?: string;
    defaultTemplate?: 'standard' | 'premium';
    hasSeenTour?: boolean;
    serviceTypes?: ServiceTypeConfig[];
    enableAgentDetails?: boolean;
}

export const getUserSettings = async (userId: string) => {
    try {
        const docRef = doc(db, 'settings', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserSettings;
        } else {
            // Default settings
            return { userId, taxRate: 0.1 };
        }
    } catch (error) {
        console.error("Error getting settings:", error);
        throw error;
    }
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    try {
        const docRef = doc(db, 'settings', userId);
        // Use setDoc with merge: true to create if not exists or update
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, { ...settings, userId }, { merge: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

// Expenses
export const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
        await addDoc(collection(db, 'expenses'), {
            ...expenseData,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding expense:", error);
        throw error;
    }
};

export const getExpenses = async (userId: string) => {
    try {
        const q = query(collection(db, 'expenses'), where("userId", "==", userId), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    } catch (error) {
        console.error("Error getting expenses:", error);
        throw error;
    }
};

export const deleteExpense = async (expenseId: string) => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
        console.error("Error deleting expense:", error);
        throw error;
    }
};
