import { forwardRef } from 'react';
import type { Invoice } from '../../lib/firestore';

interface TemplateProps {
    invoice: Invoice;
}

export const PremiumTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ invoice }, ref) => {
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxRate = invoice.taxRate !== undefined ? invoice.taxRate : 0.1;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return (
        <div ref={ref} className="bg-white text-slate-900 max-w-4xl mx-auto flex flex-col print:max-w-full print:w-full" style={{ minHeight: '297mm' }}>
            {/* Header Section */}
            <div className="bg-slate-900 text-white p-12 flex justify-between items-center">
                <div>
                    <h1 className="text-5xl font-light tracking-widest uppercase mb-2">Invoice</h1>
                    <p className="text-slate-400 tracking-wider">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold tracking-wide text-amber-500">{invoice.companyName || 'Ndito Travel'}</h2>
                    <p className="text-slate-300 mt-1">{invoice.companyAddress || 'Njiro Road, Arusha, Tanzania'}</p>
                    <p className="text-slate-300">{invoice.companyEmail || 'office@nditotravel.co.tz'}</p>
                    {invoice.companyPhone && <p className="text-slate-300">{invoice.companyPhone}</p>}
                    {invoice.companyWebsite && <p className="text-slate-300">{invoice.companyWebsite}</p>}
                    <div className="mt-2 space-y-0.5">
                        {invoice.companyTaxId && <p className="text-slate-400 text-xs tracking-wider">TIN: {invoice.companyTaxId}</p>}
                        {invoice.companyTaxNumber && <p className="text-slate-400 text-xs tracking-wider">VRN: {invoice.companyTaxNumber}</p>}
                        {invoice.companyLicenseNumber && <p className="text-slate-400 text-xs tracking-wider">LIC: {invoice.companyLicenseNumber}</p>}
                    </div>
                </div>
            </div>

            <div className="p-12 flex-1 flex flex-col">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-16">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bill To</h3>
                        <p className="text-2xl font-bold text-slate-900 mb-1">{invoice.clientName}</p>
                        {invoice.agentName && (
                            <p className="text-slate-600 mb-1">Agent: {invoice.agentName}</p>
                        )}
                        <p className="text-slate-500">{invoice.clientType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date</h3>
                            <p className="font-medium text-slate-900">
                                {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Due Date</h3>
                            <p className="font-medium text-slate-900">{invoice.dueDate}</p>
                        </div>
                        <div className="col-span-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</h3>
                            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                invoice.status === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="text-left py-4 text-xs font-bold text-slate-900 uppercase tracking-widest">Description</th>
                                <th className="text-center py-4 text-xs font-bold text-slate-900 uppercase tracking-widest">Qty</th>
                                <th className="text-right py-4 text-xs font-bold text-slate-900 uppercase tracking-widest">Price</th>
                                <th className="text-right py-4 text-xs font-bold text-slate-900 uppercase tracking-widest">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-6">
                                        <p className="font-bold text-slate-900 text-lg">{item.serviceType}</p>
                                        <p className="text-slate-500 mt-1">{item.description}</p>
                                        {(item.startDate || item.checkIn) && (
                                            <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
                                                {(item.startDate || item.checkIn)}
                                                {(item.endDate || item.checkOut) ? ` — ${(item.endDate || item.checkOut)}` : ''}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-6 text-center text-slate-600 font-medium">{item.quantity}</td>
                                    <td className="py-6 text-right text-slate-600 font-medium">${item.price.toLocaleString()}</td>
                                    <td className="py-6 text-right font-bold text-slate-900 text-lg">
                                        ${(item.quantity * item.price).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                    <div className="w-80 bg-slate-50 p-8 rounded-lg space-y-4">
                        <div className="flex justify-between text-slate-500">
                            <span className="font-medium">Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span className="font-medium">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                            <span>${tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                            <span>Total</span>
                            <span>${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400 text-sm">
                    <p className="font-medium">Thank you for choosing us.</p>
                    <p>Payment Terms: Net 30</p>
                </div>
            </div>
        </div>
    );
});

PremiumTemplate.displayName = 'PremiumTemplate';
