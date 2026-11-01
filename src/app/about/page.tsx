'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Video, Users, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0062FF]/10 border border-[#0062FF]/25 text-[#0062FF] text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#A6056F]" />
            <span>About Bgern (ስለ ብገርን)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#632450] dark:text-white leading-tight">
            Empowering Ethiopian Creators with AI Video Subtitles
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed">
            Bgern was built with a clear purpose: to bridge the technology gap for Amharic and Ethiopian digital content creators on TikTok, YouTube, Reels, and social media.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#0062FF]/15 border border-[#0062FF]/30 text-[#0062FF] flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#632450] dark:text-white">Ge'ez Script Accuracy</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Trained specifically on native Ethiopian Amharic speech patterns to ensure accurate transcription and proper fidel typography.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#A6056F]/15 border border-[#A6056F]/30 text-[#A6056F] flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#632450] dark:text-white">Viral Subtitle Animations</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Up-down bounce, scale pop, and modern slide animations engineered specifically for viral short-form video engagement.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-3 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-[#256E96]/15 border border-[#256E96]/30 text-[#256E96] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#632450] dark:text-white">Local Ethiopian Payments</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              No foreign cards needed. Instant automated top-ups through Telebirr and Commercial Bank of Ethiopia (CBE).
            </p>
          </div>
        </div>

        {/* Community Proof */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-[#0062FF]">1080p</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold mt-1">Full HD Burner</div>
          </div>
          <div className="h-8 w-px bg-[#256E96]/20 hidden sm:block" />
          <div>
            <div className="text-3xl font-black text-[#A6056F]">11+</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold mt-1">Ethiopic Fonts</div>
          </div>
          <div className="h-8 w-px bg-[#256E96]/20 hidden sm:block" />
          <div>
            <div className="text-3xl font-black text-[#632450] dark:text-[#ECCC6E]">100%</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold mt-1">Local Payment</div>
          </div>
        </div>

        {/* Mission Statement Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#632450] via-[#A6056F] to-[#0062FF] border border-white/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl text-white">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              Ready to elevate your Amharic videos?
            </h2>
            <p className="text-sm text-neutral-200 leading-relaxed">
              Join hundreds of Ethiopian creators who use Bgern to produce broadcast-quality captions in seconds.
            </p>
          </div>

          <Link
            href="/studio"
            className="px-8 py-3.5 rounded-2xl bg-[#ECCC6E] hover:bg-[#ffe38a] text-[#632450] font-black text-sm shadow-xl transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-4 h-4 text-[#632450]" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
