import type { Invoice } from '../../lib/firestore';

export interface TemplateConfig {
    id?: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        textMuted: string;
        background: string;
        headerBackground?: string;
        headerText?: string;
        tableHeaderBackground?: string;
        tableHeaderText?: string;
    };
    fonts: {
        header: string;
        body: string;
    };
    layout: {
        headerStyle: 'classic' | 'modern' | 'minimal' | 'centered' | 'split' | 'bold';
        itemsStyle: 'simple' | 'grid' | 'striped' | 'bordered';
    };
    styles: {
        borderRadius: string;
        borderWidth?: string;
    };
}

export interface TemplateProps {
    invoice: Invoice;
    config?: TemplateConfig; // Optional for custom templates
}

export interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    component: React.ComponentType<any>;
    config?: TemplateConfig;
    isCustomizable: boolean;
}
