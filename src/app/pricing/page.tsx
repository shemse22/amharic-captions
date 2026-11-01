'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingSection from '@/components/PricingSection';
import AuthModal from '@/components/AuthModal';
import { Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/20 text-[#0062FF] dark:text-[#60a5fa] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Affordable Local Telebirr & CBE Pricing</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
            Simple, Transparent Minutes
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
            Top up video transcription minutes using Telebirr or CBE. No international credit card required.
          </p>
        </div>

        <PricingSection
          currentUser={currentUser}
          onRequireLogin={() => setShowAuthModal(true)}
        />
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user) => setCurrentUser(user)}
        />
      )}
    </div>
  );
}
