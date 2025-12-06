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
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

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
}

export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'invoices'), {
            ...invoiceData,
            createdAt: Timestamp.now(),
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

export const deleteClient = async (clientId: string) => {
    try {
        await deleteDoc(doc(db, 'clients', clientId));
    } catch (error) {
        console.error("Error deleting client: ", error);
        throw error;
    }
};
