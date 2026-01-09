import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Save from 'lucide-react/dist/esm/icons/save';
import { ConfigurableTemplate } from './templates/ConfigurableTemplate';
import { baseConfig } from './templates/TemplateRegistry';
import type { TemplateConfig } from './templates/types';
import type { Invoice } from '../lib/firestore';
import { Timestamp } from 'firebase/firestore';
import { clsx } from 'clsx';

interface TemplateEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: TemplateConfig) => void;
    initialConfig?: TemplateConfig;
}

const dummyInvoice: Invoice = {
    id: 'preview',
    userId: 'preview',
    invoiceNumber: 'INV-001',
    createdAt: Timestamp.now(),
    dueDate: new Date().toISOString(),
    clientName: 'John Doe',
    clientType: 'Direct',
    status: 'Pending',
    items: [
        { id: '1', description: 'Web Design Project', price: 1500, quantity: 1, serviceType: 'Other' },
        { id: '2', description: 'Hosting (Annual)', price: 200, quantity: 1, serviceType: 'Other' }
    ],
    totalAmount: 1870,
    taxRate: 0.1,
    companyName: 'Acme Corp',
    companyAddress: '123 Innovation Dr, Tech City',
    companyEmail: 'contact@acmecorp.com',
    companyPhone: '+1 555 0123',
    companyWebsite: 'www.acmecorp.com'
};


const AutoScalingPreview = ({ children }: { children: React.ReactNode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (parent) {
                    // Get available width from parent, accounting for padding (32px)
                    const availableWidth = parent.clientWidth - 48;
                    const baseWidth = 794; // A4 width in px (210mm @ 96dpi)
                    // Calculate scale: fit width, but cap at 1.1x to avoid blurriness
                    const newScale = Math.min(Math.max(availableWidth / baseWidth, 0.3), 1.1);
                    setScale(newScale);
                }
            }
        };

        // Initial update
        // Small delay to ensure parent is rendered
        const timer = setTimeout(updateScale, 10);

        window.addEventListener('resize', updateScale);

        let observer: ResizeObserver | null = null;
        const parent = containerRef.current?.parentElement;
        if (parent) {
            observer = new ResizeObserver(updateScale);
            observer.observe(parent);
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
            if (observer) observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: `${794 * scale}px`,
                height: `${1123 * scale}px`,
                transition: 'width 0.2s ease-out, height 0.2s ease-out'
            }}
            className="relative mx-auto"
        >
            <div
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease-out'
                }}
                className="bg-white shadow-2xl absolute top-0 left-0"
            >
                {children}
            </div>
        </div>
    );
};

export const TemplateEditor = ({ isOpen, onClose, onSave, initialConfig }: TemplateEditorProps) => {
    const [config, setConfig] = useState<TemplateConfig>(initialConfig || { ...baseConfig, name: 'My Custom Template' });
    const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'layout'>('colors');
    const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

    useEffect(() => {
        if (isOpen) {
            setConfig(initialConfig || { ...baseConfig, name: 'My Custom Template' });
        }
    }, [isOpen, initialConfig]);

    const handleColorChange = (key: keyof typeof baseConfig.colors, value: string) => {
        setConfig(prev => ({
            ...prev,
            colors: { ...prev.colors, [key]: value }
        }));
    };

    const handleFontChange = (key: keyof typeof baseConfig.fonts, value: string) => {
        setConfig(prev => ({
            ...prev,
            fonts: { ...prev.fonts, [key]: value }
        }));
    };

    const handleLayoutChange = (key: keyof typeof baseConfig.layout, value: string) => {
        setConfig(prev => ({
            ...prev,
            layout: { ...prev.layout, [key]: value }
        }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-surface w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Mobile Header & Toggle */}
                        <div className="md:hidden flex-none bg-surface border-b border-white/10">
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white">Editor</h2>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex">
                                <button
                                    onClick={() => setMobileTab('edit')}
                                    className={clsx(
                                        "flex-1 py-3 text-sm font-bold transition-colors border-b-2",
                                        mobileTab === 'edit' ? "text-primary border-primary bg-white/5" : "text-text-muted border-transparent"
                                    )}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setMobileTab('preview')}
                                    className={clsx(
                                        "flex-1 py-3 text-sm font-bold transition-colors border-b-2",
                                        mobileTab === 'preview' ? "text-primary border-primary bg-white/5" : "text-text-muted border-transparent"
                                    )}
                                >
                                    Preview
                                </button>
                            </div>
                        </div>

                        {/* Sidebar Controls */}
                        <div className={clsx(
                            "w-full md:w-80 border-r border-white/10 flex flex-col bg-surface-light/30",
                            "md:flex",
                            mobileTab === 'edit' ? "flex-1" : "hidden"
                        )}>
                            <div className="hidden md:flex p-6 border-b border-white/10 justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Editor</h2>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-white/10">
                                <label className="text-xs text-text-muted mb-1 block">Template Name</label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                />
                            </div>

                            <div className="flex border-b border-white/10">
                                {['colors', 'fonts', 'layout'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={clsx(
                                            "flex-1 py-3 text-sm font-medium capitalize transition-colors relative",
                                            activeTab === tab ? "text-white" : "text-text-muted hover:text-white"
                                        )}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {activeTab === 'colors' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Primary Color</label>
                                            <input
                                                type="color"
                                                value={config.colors.primary}
                                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                                className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Secondary Color</label>
                                            <input
                                                type="color"
                                                value={config.colors.secondary}
                                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                                className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Background Color</label>
                                            <input
                                                type="color"
                                                value={config.colors.background}
                                                onChange={(e) => handleColorChange('background', e.target.value)}
                                                className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Text Color</label>
                                            <input
                                                type="color"
                                                value={config.colors.text}
                                                onChange={(e) => handleColorChange('text', e.target.value)}
                                                className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'fonts' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Header Font</label>
                                            <select
                                                value={config.fonts.header}
                                                onChange={(e) => handleFontChange('header', e.target.value)}
                                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="Inter, sans-serif">Inter</option>
                                                <option value="Roboto, sans-serif">Roboto</option>
                                                <option value="Playfair Display, serif">Playfair Display</option>
                                                <option value="Montserrat, sans-serif">Montserrat</option>
                                                <option value="Lato, sans-serif">Lato</option>
                                                <option value="Open Sans, sans-serif">Open Sans</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Body Font</label>
                                            <select
                                                value={config.fonts.body}
                                                onChange={(e) => handleFontChange('body', e.target.value)}
                                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="Inter, sans-serif">Inter</option>
                                                <option value="Roboto, sans-serif">Roboto</option>
                                                <option value="Lato, sans-serif">Lato</option>
                                                <option value="Open Sans, sans-serif">Open Sans</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'layout' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Header Style</label>
                                            <select
                                                value={config.layout.headerStyle}
                                                onChange={(e) => handleLayoutChange('headerStyle', e.target.value)}
                                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="modern">Modern</option>
                                                <option value="classic">Classic</option>
                                                <option value="minimal">Minimal</option>
                                                <option value="bold">Bold</option>
                                                <option value="centered">Centered</option>
                                                <option value="split">Split</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-2 block">Items Table Style</label>
                                            <select
                                                value={config.layout.itemsStyle}
                                                onChange={(e) => handleLayoutChange('itemsStyle', e.target.value)}
                                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="simple">Simple</option>
                                                <option value="grid">Grid</option>
                                                <option value="striped">Striped</option>
                                                <option value="bordered">Bordered</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/10">
                                <button
                                    onClick={() => onSave(config)}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Template
                                </button>
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className={clsx(
                            "flex-1 bg-slate-100 overflow-hidden p-4 md:p-8 flex items-start justify-center",
                            "md:flex",
                            mobileTab === 'preview' ? "flex-1" : "hidden"
                        )}>
                            <div className="w-full h-full overflow-auto flex justify-center">
                                <AutoScalingPreview>
                                    <ConfigurableTemplate invoice={dummyInvoice} config={config} />
                                </AutoScalingPreview>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
