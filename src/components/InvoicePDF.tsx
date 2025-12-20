import { forwardRef } from 'react';
import type { Invoice } from '../lib/firestore';
import { StandardTemplate } from './templates/StandardTemplate';
import { PremiumTemplate } from './templates/PremiumTemplate';

interface InvoicePDFProps {
    invoice: Invoice;
    templateId?: 'standard' | 'premium';
}

export const InvoicePDF = forwardRef<HTMLDivElement, InvoicePDFProps>(({ invoice, templateId }, ref) => {
    // Use passed templateId or fallback to invoice's stored templateId, or default to standard
    const selectedTemplate = templateId || invoice.templateId || 'standard';

    if (selectedTemplate === 'premium') {
        return <PremiumTemplate ref={ref} invoice={invoice} />;
    }

    return <StandardTemplate ref={ref} invoice={invoice} />;
});

InvoicePDF.displayName = 'InvoicePDF';
