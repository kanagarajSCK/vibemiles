import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    { q: 'How do I receive my digital travel voucher?', a: 'Once payment is completed, your voucher with QR Code and booking reference number is instantly available under your Account > Bookings dashboard and sent via SMS/WhatsApp.' },
    { q: 'Can I cancel or modify my booking?', a: 'Yes, cancellations made 7+ days prior to departure date are eligible for full instant refunds according to operator cancellation terms.' },
    { q: 'Are all tour operators verified?', a: 'Yes! Every operator lists PAN, GSTIN, and business registration details inspected by our compliance team.' },
    { q: 'What payment methods are supported?', a: 'We accept UPI (GPay, PhonePe, Paytm), Credit Cards, Debit Cards, Net Banking, and Razorpay/Stripe.' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 pb-20">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-8 h-8 text-teal-700" /> Frequently Asked Questions
        </h1>
        <p className="text-xs text-slate-500">Find answers to common questions about bookings, vouchers, payments, and cancellations.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
            <h3 className="font-bold text-base text-slate-900">{f.q}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
