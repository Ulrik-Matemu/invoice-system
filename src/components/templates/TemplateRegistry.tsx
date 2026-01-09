import { StandardTemplate } from './StandardTemplate';
import { PremiumTemplate } from './PremiumTemplate';
import { ConfigurableTemplate } from './ConfigurableTemplate';
import type { TemplateDefinition, TemplateConfig } from './types';

export const baseConfig: TemplateConfig = {
    name: 'Base',
    colors: {
        primary: '#0f172a',
        secondary: '#94a3b8',
        accent: '#38bdf8',
        text: '#0f172a',
        textMuted: '#64748b',
        background: '#ffffff',
    },
    fonts: {
        header: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
    },
    layout: {
        headerStyle: 'modern',
        itemsStyle: 'simple',
    },
    styles: {
        borderRadius: '0.5rem',
    },
};

export const templates: TemplateDefinition[] = [
    {
        id: 'standard',
        name: 'Standard',
        description: 'Clean and professional standard layout',
        component: StandardTemplate,
        isCustomizable: false,
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'High-end design with bold headers',
        component: PremiumTemplate,
        isCustomizable: false,
    },
    {
        id: 'modern-blue',
        name: 'Modern Blue',
        description: 'Contemporary design with blue accents',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Modern Blue',
            colors: { ...baseConfig.colors, primary: '#2563eb', headerText: '#1e3a8a' },
            layout: { ...baseConfig.layout, headerStyle: 'modern', itemsStyle: 'striped' },
        },
    },
    {
        id: 'classic-serif',
        name: 'Classic Serif',
        description: 'Traditional look with serif fonts',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Classic Serif',
            fonts: { header: 'Georgia, serif', body: 'Georgia, serif' },
            colors: { ...baseConfig.colors, primary: '#334155' },
            layout: { ...baseConfig.layout, headerStyle: 'classic', itemsStyle: 'bordered' },
        },
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'Simple, clean, and distraction-free',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Minimalist',
            colors: { ...baseConfig.colors, primary: '#000000', secondary: '#666666' },
            layout: { ...baseConfig.layout, headerStyle: 'minimal', itemsStyle: 'simple' },
        },
    },
    {
        id: 'bold-dark',
        name: 'Bold Dark',
        description: 'Strong visual impact with dark headers',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Bold Dark',
            colors: { ...baseConfig.colors, primary: '#0f172a', headerBackground: '#0f172a', headerText: '#ffffff' },
            layout: { ...baseConfig.layout, headerStyle: 'bold', itemsStyle: 'striped' },
        },
    },
    {
        id: 'corporate-grey',
        name: 'Corporate Grey',
        description: 'Professional and understated',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Corporate Grey',
            colors: { ...baseConfig.colors, primary: '#475569', secondary: '#94a3b8', tableHeaderBackground: '#f1f5f9' },
            layout: { ...baseConfig.layout, headerStyle: 'split', itemsStyle: 'grid' },
        },
    },
    {
        id: 'creative-purple',
        name: 'Creative Purple',
        description: 'Vibrant and modern',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Creative Purple',
            colors: { ...baseConfig.colors, primary: '#7c3aed', secondary: '#a78bfa', headerText: '#5b21b6' },
            layout: { ...baseConfig.layout, headerStyle: 'modern', itemsStyle: 'striped' },
        },
    },
    {
        id: 'tech-mono',
        name: 'Tech Mono',
        description: 'Technical and precise',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Tech Mono',
            fonts: { header: 'Courier Prime, monospace', body: 'Courier Prime, monospace' },
            colors: { ...baseConfig.colors, primary: '#059669', secondary: '#34d399' },
            layout: { ...baseConfig.layout, headerStyle: 'minimal', itemsStyle: 'bordered' },
        },
    },
    {
        id: 'elegant-gold',
        name: 'Elegant Gold',
        description: 'Sophisticated and luxurious',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Elegant Gold',
            fonts: { header: 'Playfair Display, serif', body: 'Inter, sans-serif' },
            colors: { ...baseConfig.colors, primary: '#b45309', secondary: '#d97706', headerBackground: '#fffbeb' },
            layout: { ...baseConfig.layout, headerStyle: 'centered', itemsStyle: 'simple' },
        },
    },
    {
        id: 'compact-red',
        name: 'Compact Red',
        description: 'Dense layout for data-heavy invoices',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Compact Red',
            colors: { ...baseConfig.colors, primary: '#dc2626', secondary: '#f87171' },
            layout: { ...baseConfig.layout, headerStyle: 'split', itemsStyle: 'bordered' },
        },
    },
    {
        id: 'nature-green',
        name: 'Nature Green',
        description: 'Fresh and organic feel',
        component: ConfigurableTemplate,
        isCustomizable: true,
        config: {
            ...baseConfig,
            name: 'Nature Green',
            colors: { ...baseConfig.colors, primary: '#15803d', secondary: '#4ade80', tableHeaderBackground: '#f0fdf4' },
            layout: { ...baseConfig.layout, headerStyle: 'modern', itemsStyle: 'striped' },
        },
    },
];

export const getTemplates = (customConfigs: TemplateConfig[] = []): TemplateDefinition[] => {
    const customTemplates: TemplateDefinition[] = customConfigs.map(config => ({
        id: config.id || `custom-${config.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: config.name,
        description: 'Custom template',
        component: ConfigurableTemplate,
        config: config,
        isCustomizable: true
    }));
    return [...templates, ...customTemplates];
};

export const getTemplateById = (id: string, customConfigs: TemplateConfig[] = []) => {
    const allTemplates = getTemplates(customConfigs);
    return allTemplates.find(t => t.id === id) || templates[0];
};
