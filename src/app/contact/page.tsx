'use client';

import React, { useState } from 'react';
import { Send, Mail, Phone, MapPin, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-10 sm:space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0062FF]/10 border border-[#0062FF]/25 text-[#0062FF] text-xs font-extrabold uppercase">
            <MessageSquare className="w-3.5 h-3.5 text-[#A6056F]" />
            <span>Contact & Support (ያግኙን)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#632450] dark:text-white tracking-tight">
            Get in Touch with Bgern
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
            Have questions about subscriptions, payment verification, or custom captioning? Our Addis Ababa team is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Contact Details (5 cols on md) */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-5 shadow-sm">
              <h3 className="text-lg font-black text-[#632450] dark:text-white">Direct Channels</h3>

              <div className="space-y-3 text-xs">
                <a
                  href="https://t.me/bgern_supportbot"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] hover:bg-[#0062FF]/10 border border-[#256E96]/20 dark:border-[#256E96]/35 text-neutral-800 dark:text-neutral-200 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold group-hover:text-[#0062FF]">Telegram Support</div>
                    <div className="text-neutral-500 dark:text-neutral-400 font-mono">@bgern_supportbot</div>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-neutral-800 dark:text-neutral-200">
                  <div className="w-9 h-9 rounded-xl bg-[#A6056F]/15 text-[#A6056F] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Email Support</div>
                    <div className="text-neutral-500 dark:text-neutral-400 font-mono">support@bgern.com</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-neutral-800 dark:text-neutral-200">
                  <div className="w-9 h-9 rounded-xl bg-[#256E96]/15 text-[#256E96] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Phone / Telebirr</div>
                    <div className="text-neutral-500 dark:text-neutral-400 font-mono">+251 922 895 633</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-neutral-800 dark:text-neutral-200">
                  <div className="w-9 h-9 rounded-xl bg-[#632450]/15 dark:bg-[#ECCC6E]/15 text-[#632450] dark:text-[#ECCC6E] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Headquarters</div>
                    <div className="text-neutral-500 dark:text-neutral-400">Bole, Addis Ababa, Ethiopia</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-2 text-xs shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#632450] dark:text-[#ECCC6E]">
                <Clock className="w-4 h-4 text-[#0062FF]" />
                <span>Working Hours (የስራ ሰዓት)</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Monday – Saturday: 2:00 AM – 12:00 PM (Local Ethiopian Time / EAT). Automated Chapa payments processed 24/7.
              </p>
            </div>
          </div>

          {/* Contact Form (7 cols on md) */}
          <div className="md:col-span-7 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="py-12 sm:py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#632450] dark:text-white">Message Received!</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                  መልእክትዎ ደርሶናል! Thank you for reaching out. A member of our support team will get back to you promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-black text-[#632450] dark:text-white mb-2">Send us a Message</h3>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Abebe Kebede"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0062FF]/30 focus:border-[#0062FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email Address or Phone</label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abebe@gmail.com or 0911..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0062FF]/30 focus:border-[#0062FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you with Bgern?"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0062FF]/30 focus:border-[#0062FF] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-extrabold text-sm shadow-md shadow-[#0062FF]/20 transition-all active:scale-95"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
