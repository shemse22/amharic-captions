'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
            Privacy Policy (የግላዊነት ፖሊሲ)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Last updated: September 2026</p>
        </div>

        <div className="bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">1. Information We Collect</h2>
            <p>
              When you use Bgern, we collect account details provided during Gmail/Google authentication or email registration, including your name and email address. We also collect metadata related to uploaded videos (title and duration) and transaction reference codes for subscription payments.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">2. Video and Audio Content</h2>
            <p>
              Uploaded video files are processed exclusively to perform speech recognition and generate Amharic subtitle text. We do not sell or monetize your original media files. Audio extraction and subtitle burning may run directly on your browser for optimal privacy and speed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">3. Data Security</h2>
            <p>
              We implement industry-standard encryption protocols (HTTPS/TLS) and secure session tokens to protect your personal account information and transaction data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#632450] dark:text-[#ECCC6E]">4. Contact Us</h2>
            <p>
              If you have any questions regarding our privacy practices, please contact us at <span className="text-[#0062FF] font-mono font-bold">privacy@bgern.com</span> or via Telegram at <a href="https://t.me/bgern_supportbot" className="text-[#0062FF] font-mono font-bold hover:underline">@bgern_supportbot</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
