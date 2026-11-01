'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
            Terms of Service (የአገልግሎት ደንቦች)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Last updated: October 2026</p>
        </div>

        <div className="bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Bgern platform ("Bgern", "we", "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">2. Video Upload & Admin Approval Policy</h2>
            <p>
              To maintain system integrity and prevent unauthorized usage, all videos uploaded for caption generation may be subject to review and approval by Bgern administrators. Content containing harmful, illegal, or infringing material will be rejected immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">3. Payments & Credits</h2>
            <p>
              Packages purchased via Telebirr or bank transfer are credited after our team verifies the submitted payment receipt. Refund requests for a completely unused package may be made within 15 days of purchase. Once any package minutes or credits have been used, the package is non-refundable. Unused package balances do not roll over to future purchases. Contact Bgern support with payment or refund questions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">4. Intellectual Property</h2>
            <p>
              You retain full ownership of all video assets you upload and all subtitles you generate using Bgern. Bgern claims no copyright or proprietary rights over your creative media.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
