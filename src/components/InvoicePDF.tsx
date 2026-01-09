import { forwardRef } from 'react';
import type { Invoice } from '../lib/firestore';
import { getTemplateById } from './templates/TemplateRegistry';
import type { TemplateConfig } from './templates/types';

interface InvoicePDFProps {
    invoice: Invoice;
    templateId?: string;
    customTemplates?: TemplateConfig[];
}

export const InvoicePDF = forwardRef<HTMLDivElement, InvoicePDFProps>(({ invoice, templateId, customTemplates = [] }, ref) => {
    const selectedId = templateId || invoice.templateId || 'standard';
    const templateDef = getTemplateById(selectedId, customTemplates);
    const TemplateComponent = templateDef.component;

    // Use invoice.templateConfig if available (for saved invoices), otherwise fallback to template default
    const config = invoice.templateConfig || templateDef.config;

    return <TemplateComponent ref={ref} invoice={invoice} config={config} />;
});

InvoicePDF.displayName = 'InvoicePDF';
