import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import { getTemplates } from './templates/TemplateRegistry';
import { clsx } from 'clsx';
import type { TemplateConfig } from './templates/types';

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (templateId: string, config?: TemplateConfig) => void;
    currentTemplateId: string;
    currentConfig?: TemplateConfig;
    customTemplates?: TemplateConfig[];
    disableCustomization?: boolean;
}

export const TemplateSelector = ({ isOpen, onClose, onSelect, currentTemplateId, currentConfig, customTemplates = [], disableCustomization = false }: TemplateSelectorProps) => {
    const [selectedId, setSelectedId] = useState(currentTemplateId);
    const [customConfig, setCustomConfig] = useState<TemplateConfig | undefined>(currentConfig);

    const allTemplates = getTemplates(customTemplates);

    // Reset state when opening or changing currentTemplateId
    useEffect(() => {
        if (isOpen) {
            setSelectedId(currentTemplateId);
            setCustomConfig(currentConfig);
        }
    }, [isOpen, currentTemplateId, currentConfig]);

    const handleSelectTemplate = (id: string) => {
        setSelectedId(id);
        const template = allTemplates.find(t => t.id === id);
        // Reset custom config to template default when switching templates
        if (template?.config) {
            setCustomConfig(template.config);
        } else {
            setCustomConfig(undefined);
        }
    };

    const handleColorChange = (color: string) => {
        if (!customConfig) return;
        setCustomConfig({
            ...customConfig,
            colors: {
                ...customConfig.colors,
                primary: color
            }
        });
    };

    const handleConfirm = () => {
        onSelect(selectedId, customConfig);
        onClose();
    };

    const selectedTemplate = allTemplates.find(t => t.id === selectedId);

    // Mini preview component
    const TemplatePreview = ({ template, isSelected }: { template: any, isSelected: boolean }) => {
        // Use custom config if selected, otherwise template default
        const config = (isSelected && customConfig) ? customConfig : (template.config || { colors: { primary: '#334155' } });
        const primaryColor = config.colors.primary;

        return (
            <button
                type="button"
                onClick={() => handleSelectTemplate(template.id)}
                className={clsx(
                    "relative w-full aspect-[210/297] rounded-xl overflow-hidden border-2 transition-all duration-200 group text-left",
                    isSelected
                        ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                        : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                )}
            >
                {/* Mock Invoice UI */}
                <div className="absolute inset-0 bg-white p-3 flex flex-col gap-2">
                    {/* Header */}
                    <div className={clsx(
                        "mb-1 flex",
                        config.layout?.headerStyle === 'centered' ? "justify-center flex-col items-center gap-1" :
                            config.layout?.headerStyle === 'classic' ? "justify-center flex-col items-center gap-1" :
                                config.layout?.headerStyle === 'split' ? "justify-between flex-row-reverse" :
                                    "justify-between items-start"
                    )}>
                        <div className={clsx(
                            "rounded",
                            config.layout?.headerStyle === 'bold' ? "w-full h-8 -mt-3 -mx-3 mb-2" : "w-1/3 h-2"
                        )} style={{ backgroundColor: primaryColor }} />

                        {config.layout?.headerStyle !== 'bold' && (
                            <div className="w-1/4 h-2 rounded bg-slate-100" />
                        )}
                    </div>

                    {/* Body */}
                    <div className="space-y-1">
                        <div className="w-full h-1.5 rounded bg-slate-50" />
                        <div className="w-full h-1.5 rounded bg-slate-50" />
                        <div className="w-2/3 h-1.5 rounded bg-slate-50" />
                    </div>

                    {/* Table Header */}
                    <div className="w-full h-4 rounded bg-slate-100 mt-2" style={{ opacity: 0.5 }} />

                    {/* Table Rows */}
                    <div className="space-y-1">
                        <div className="w-full h-2 border-b border-slate-50" />
                        <div className="w-full h-2 border-b border-slate-50" />
                        <div className="w-full h-2 border-b border-slate-50" />
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex justify-end">
                        <div className="w-1/3 h-4 rounded bg-slate-100" />
                    </div>
                </div>

                {/* Overlay */}
                <div className={clsx(
                    "absolute inset-0 transition-opacity flex items-center justify-center",
                    isSelected ? "bg-primary/10 opacity-100" : "bg-black/0 opacity-0 group-hover:bg-black/5"
                )}>
                    {isSelected && (
                        <div className="bg-primary text-white rounded-full p-1 shadow-lg">
                            <Check className="w-5 h-5" />
                        </div>
                    )}
                </div>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {template.name}
                </div>
            </button>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-white/10 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <LayoutTemplate className="w-5 h-5 text-primary" />
                                    Select Template
                                </h2>
                                <p className="text-sm text-text-muted">Choose a design for your invoice</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {allTemplates.map((template) => (
                                    <div key={template.id} className="space-y-2">
                                        <TemplatePreview template={template} isSelected={selectedId === template.id} />
                                        <div className="text-center">
                                            <p className={clsx(
                                                "text-sm font-medium transition-colors",
                                                selectedId === template.id ? "text-primary" : "text-text-muted"
                                            )}>
                                                {template.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Customization Section */}
                            {selectedTemplate?.isCustomizable && customConfig && !disableCustomization && (
                                <div className="pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        Customize Colors
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-text-muted mb-3 block">Primary Theme Color</label>
                                            <div className="flex gap-3 flex-wrap">
                                                {['#2563eb', '#0f172a', '#15803d', '#b45309', '#7c3aed', '#dc2626', '#000000', '#be185d'].map(color => (
                                                    <button
                                                        type="button"
                                                        key={color}
                                                        onClick={() => handleColorChange(color)}
                                                        className={clsx(
                                                            "w-10 h-10 rounded-full border-2 transition-all shadow-sm",
                                                            customConfig.colors.primary === color
                                                                ? "border-white scale-110 ring-2 ring-white/20"
                                                                : "border-transparent hover:scale-105 hover:border-white/50"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                        aria-label={`Select color ${color}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-surface">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Confirm Selection
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
