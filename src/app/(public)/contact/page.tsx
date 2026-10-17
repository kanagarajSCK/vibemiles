'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { APP_CONFIG } from '@/constants';

interface InquiryDetails {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactPage() {
  const [inquiry, setInquiry] = useState<InquiryDetails | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setInquiry({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      message: String(formData.get('message') ?? ''),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12 pb-20">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Contact & Support Center</h1>
        <p className="text-xs text-slate-500">We are here to assist with booking inquiries, custom itineraries, and operator onboarding.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900">Send us a message</h3>
          <Input label="Your Full Name" name="name" placeholder="Rahul Sharma" required />
          <Input label="Email Address" name="email" type="email" placeholder="rahul@example.com" required />
          <Input label="Phone Number" name="phone" type="tel" placeholder="+91 98765 43210" required />
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea id="contact-message" name="message" rows={4} required className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none" placeholder="How can we help you?" />
          </div>
          <Button type="submit" variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />}>
            Submit Inquiry
          </Button>
          {inquiry && (
            <section aria-live="polite" className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
              <h4 className="font-bold text-teal-800">Inquiry details</h4>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="font-medium">Name</dt><dd>{inquiry.name}</dd>
                <dt className="font-medium">Email</dt><dd>{inquiry.email}</dd>
                <dt className="font-medium">Phone</dt><dd>{inquiry.phone}</dd>
                <dt className="font-medium">Message</dt><dd className="whitespace-pre-wrap">{inquiry.message}</dd>
              </dl>
            </section>
          )}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-teal-400">Headquarters Address</h3>
            <p className="text-slate-300 text-sm flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span>Vibe Miles Private Limited, 4th Floor, Tech Hub Tower, MG Road, Bengaluru, Karnataka 560001</span>
            </p>
            <p className="text-slate-300 text-sm flex items-center gap-3">
              <Phone className="w-5 h-5 text-teal-400 shrink-0" />
              <span>Toll-Free Helpline: {APP_CONFIG.supportPhone}</span>
            </p>
            <p className="text-slate-300 text-sm flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-400 shrink-0" />
              <span>Email: {APP_CONFIG.supportEmail}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



