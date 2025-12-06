import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, Trash2, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClients, addClient, deleteClient, type Client } from '../lib/firestore';

const Clients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    const fetchClients = async () => {
        if (user) {
            try {
                const data = await getClients(user.uid);
                setClients(data);
            } catch (error) {
                console.error("Error fetching clients:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchClients();
    }, [user]);

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            await addClient({
                userId: user.uid,
                ...newClient
            });
            setIsModalOpen(false);
            setNewClient({ name: '', email: '', phone: '', address: '' });
            fetchClients(); // Refresh list
        } catch (error) {
            console.error("Error adding client:", error);
            alert("Failed to add client");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (confirm('Are you sure you want to delete this client?')) {
            try {
                await deleteClient(id);
                setClients(clients.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error deleting client:", error);
                alert("Failed to delete client");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Clients</h1>
                    <p className="text-text-muted mt-1">Manage your client base</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    Add Client
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client) => (
                    <div key={client.id} className="glass-panel p-6 rounded-2xl group hover:bg-surface/90 transition-colors relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => client.id && handleDeleteClient(client.id)}
                                className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                                {client.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{client.name}</h3>
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Active
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-text-muted">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-muted">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">{client.phone}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-xs text-text-muted">Added {client.createdAt?.toDate().toLocaleDateString()}</span>
                            <button className="text-sm text-primary hover:text-primary-light font-medium">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Add New Client</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddClient} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="Client Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Phone</label>
                                <input
                                    type="tel"
                                    value={newClient.phone}
                                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Address</label>
                                <input
                                    type="text"
                                    value={newClient.address}
                                    onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                                    className="w-full bg-surface-light/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="123 Main St, City"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-text-muted hover:text-white hover:bg-white/5 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
