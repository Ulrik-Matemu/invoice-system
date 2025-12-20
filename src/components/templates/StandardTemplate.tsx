import { forwardRef } from 'react';
import type { Invoice } from '../../lib/firestore';

interface TemplateProps {
    invoice: Invoice;
}

export const StandardTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ invoice }, ref) => {
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxRate = invoice.taxRate !== undefined ? invoice.taxRate : 0.1;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return (
        <div ref={ref} className="p-8 bg-white text-slate-900 max-w-4xl mx-auto print:max-w-full print:w-full" style={{ minHeight: '297mm' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">INVOICE</h1>
                    <p className="text-slate-500 font-medium">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900">{invoice.companyName || 'Ndito Travel'}</h2>
                    <p className="text-slate-500 text-sm mt-1">{invoice.companyAddress || 'Njiro Road, Arusha, Tanzania'}</p>
                    <p className="text-slate-500 text-sm">{invoice.companyEmail || 'office@nditotravel.co.tz'}</p>
                    {invoice.companyPhone && <p className="text-slate-500 text-sm">{invoice.companyPhone}</p>}
                    {invoice.companyWebsite && <p className="text-slate-500 text-sm">{invoice.companyWebsite}</p>}
                    <div className="mt-2 space-y-0.5">
                        {invoice.companyTaxId && <p className="text-slate-400 text-xs">TIN: {invoice.companyTaxId}</p>}
                        {invoice.companyTaxNumber && <p className="text-slate-400 text-xs">VRN: {invoice.companyTaxNumber}</p>}
                        {invoice.companyLicenseNumber && <p className="text-slate-400 text-xs">Lic: {invoice.companyLicenseNumber}</p>}
                    </div>
                </div>
            </div>

            {/* Client & Invoice Details */}
            <div className="flex justify-between mb-12">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                    <p className="font-bold text-slate-900 text-lg">{invoice.clientName}</p>
                    {invoice.agentName && (
                        <p className="text-slate-600 text-sm">Agent: {invoice.agentName}</p>
                    )}
                    <p className="text-slate-500 text-sm">{invoice.clientType}</p>
                </div>
                <div className="text-right">
                    <div className="mb-2">
                        <span className="text-slate-500 text-sm mr-4">Date:</span>
                        <span className="font-medium text-slate-900">
                            {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 text-sm mr-4">Due Date:</span>
                        <span className="font-medium text-slate-900">{invoice.dueDate}</span>
                    </div>
                    <div className="mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {invoice.status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-12">
                <thead>
                    <tr className="border-b-2 border-slate-100">
                        <th className="text-left py-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="text-center py-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                        <th className="text-right py-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Price</th>
                        <th className="text-right py-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-4">
                                <p className="font-bold text-slate-900">{item.serviceType}</p>
                                <p className="text-sm text-slate-500">{item.description}</p>
                                {(item.startDate || item.checkIn) && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        {(item.startDate || item.checkIn)}
                                        {(item.endDate || item.checkOut) ? ` - ${(item.endDate || item.checkOut)}` : ''}
                                    </p>
                                )}
                            </td>
                            <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-4 text-right text-slate-600">${item.price.toLocaleString()}</td>
                            <td className="py-4 text-right font-bold text-slate-900">
                                ${(item.quantity * item.price).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                        <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                        <span>${tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t-2 border-slate-100">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
                <p>Thank you for your business!</p>
                <p className="mt-2">Payment Terms: Net 30</p>
            </div>
        </div>
    );
});

StandardTemplate.displayName = 'StandardTemplate';
