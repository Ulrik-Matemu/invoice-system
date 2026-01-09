import { forwardRef } from 'react';
import type { TemplateProps } from './types';
import { clsx } from 'clsx';

export const ConfigurableTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ invoice, config }, ref) => {
    if (!config) return null;

    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxRate = invoice.taxRate !== undefined ? invoice.taxRate : 0.1;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const { colors, fonts, layout } = config;

    const containerStyle = {
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: fonts.body,
        minHeight: '297mm',
    };

    const headerStyle = {
        fontFamily: fonts.header,
        backgroundColor: colors.headerBackground || 'transparent',
        color: colors.headerText || colors.text,
    };

    return (
        <div
            ref={ref}
            className="w-full max-w-4xl mx-auto flex flex-col print:max-w-full print:w-full"
            style={containerStyle}
        >
            {/* Header Section */}
            <div className={clsx(
                "p-12",
                layout.headerStyle === 'modern' && "flex justify-between items-start",
                layout.headerStyle === 'classic' && "flex flex-col items-center text-center",
                layout.headerStyle === 'minimal' && "flex justify-between items-end border-b-2",
                layout.headerStyle === 'centered' && "text-center",
                layout.headerStyle === 'split' && "grid grid-cols-2 gap-8",
                layout.headerStyle === 'bold' && "bg-primary text-white"
            )} style={layout.headerStyle === 'bold' ? { backgroundColor: colors.primary, color: 'white' } : headerStyle}>

                <div className={clsx(layout.headerStyle === 'split' && "order-2 text-right")}>
                    <h1 className="text-5xl font-bold uppercase tracking-wider mb-2" style={{ color: layout.headerStyle === 'bold' ? 'white' : colors.primary }}>
                        Invoice
                    </h1>
                    <p className="opacity-70 text-lg">#{invoice.invoiceNumber}</p>
                </div>

                <div className={clsx(layout.headerStyle === 'split' && "order-1")}>
                    <h2 className="text-2xl font-bold mb-2">{invoice.companyName || 'Company Name'}</h2>
                    <div className="space-y-1 opacity-80 text-sm">
                        <p>{invoice.companyAddress || 'Address Line 1'}</p>
                        <p>{invoice.companyEmail || 'email@example.com'}</p>
                        {invoice.companyPhone && <p>{invoice.companyPhone}</p>}
                        {invoice.companyWebsite && <p>{invoice.companyWebsite}</p>}
                    </div>
                    <div className="mt-4 space-y-0.5 text-xs opacity-60">
                        {invoice.companyTaxId && <p>TIN: {invoice.companyTaxId}</p>}
                        {invoice.companyTaxNumber && <p>VRN: {invoice.companyTaxNumber}</p>}
                    </div>
                </div>
            </div>

            <div className="p-12 flex-1 flex flex-col">
                {/* Client & Dates Grid */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: colors.secondary }}>Bill To</h3>
                        <p className="text-xl font-bold mb-2">{invoice.clientName}</p>
                        {invoice.agentName && (
                            <p className="opacity-70 mb-1">Attn: {invoice.agentName}</p>
                        )}
                        <p className="opacity-70">{invoice.clientType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.secondary }}>Date</h3>
                            <p className="font-medium">
                                {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.secondary }}>Due Date</h3>
                            <p className="font-medium">{invoice.dueDate}</p>
                        </div>
                        <div className="col-span-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.secondary }}>Status</h3>
                            <span
                                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                style={{
                                    backgroundColor: invoice.status === 'Paid' ? '#dcfce7' : invoice.status === 'Overdue' ? '#ffe4e6' : '#fef3c7',
                                    color: invoice.status === 'Paid' ? '#15803d' : invoice.status === 'Overdue' ? '#be123c' : '#b45309'
                                }}
                            >
                                {invoice.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full">
                        <thead>
                            <tr style={{
                                backgroundColor: colors.tableHeaderBackground || 'transparent',
                                borderBottom: `2px solid ${colors.secondary}`
                            }}>
                                <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: colors.tableHeaderText || colors.secondary }}>Description</th>
                                <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: colors.tableHeaderText || colors.secondary }}>Qty</th>
                                <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: colors.tableHeaderText || colors.secondary }}>Price</th>
                                <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: colors.tableHeaderText || colors.secondary }}>Total</th>
                            </tr>
                        </thead>
                        <tbody className={clsx(
                            layout.itemsStyle === 'striped' && "divide-y divide-gray-100",
                            layout.itemsStyle === 'bordered' && "divide-y divide-gray-200"
                        )}>
                            {invoice.items.map((item, index) => (
                                <tr key={index} className={clsx(
                                    layout.itemsStyle === 'striped' && index % 2 === 0 && "bg-gray-50/50"
                                )}>
                                    <td className="py-4 px-2">
                                        <p className="font-bold text-lg" style={{ color: colors.primary }}>{item.serviceType}</p>
                                        <p className="opacity-70 text-sm mt-1">{item.description}</p>
                                        {(item.startDate || item.checkIn) && (
                                            <p className="text-xs opacity-50 mt-1">
                                                {(item.startDate || item.checkIn)}
                                                {(item.endDate || item.checkOut) ? ` - ${(item.endDate || item.checkOut)}` : ''}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 px-2 text-center font-medium opacity-80">{item.quantity}</td>
                                    <td className="py-4 px-2 text-right font-medium opacity-80">${item.price.toLocaleString()}</td>
                                    <td className="py-4 px-2 text-right font-bold">
                                        ${(item.quantity * item.price).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                    <div
                        className="w-80 p-6 rounded-lg space-y-3"
                        style={{ backgroundColor: colors.headerBackground || '#f8fafc' }}
                    >
                        <div className="flex justify-between opacity-70">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between opacity-70">
                            <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                            <span>${tax.toLocaleString()}</span>
                        </div>
                        <div
                            className="flex justify-between text-xl font-bold pt-4 border-t"
                            style={{ borderColor: colors.secondary, color: colors.primary }}
                        >
                            <span>Total</span>
                            <span>${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t flex flex-col md:flex-row justify-between items-center text-sm opacity-60" style={{ borderColor: colors.secondary }}>
                    <p>Thank you for your business.</p>
                    <p>Payment Terms: Net 30</p>
                </div>
            </div>
        </div>
    );
});

ConfigurableTemplate.displayName = 'ConfigurableTemplate';
