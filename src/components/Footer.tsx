'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, Heart } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Footer() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCheckError, setAuthCheckError] = useState('');

  const handleStudioClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setAuthCheckError('');

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Could not verify your sign-in. Please try again.');
      }

      const data = await response.json();
      if (data.authenticated && data.user) {
        router.push('/studio');
      } else {
        setShowAuthModal(true);
      }
    } catch (error) {
      setAuthCheckError(
        error instanceof Error ? error.message : 'Could not verify your sign-in. Please try again.'
      );
    }
  };

  return (
    <>
    <footer className="border-t border-[#632450]/30 bg-[#632450] text-neutral-200 text-sm mt-20 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand Col (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Bgern Logo"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-white/20 shadow-lg shrink-0"
              />
              <span className="text-xl font-black text-white">
                Bgern
              </span>
            </Link>

            <p className="text-xs text-neutral-300 leading-relaxed max-w-sm">
              Create and refine Amharic captions and subtitles with Bgern Studio.
              Export finished videos or subtitle files for your publishing workflow.
            </p>

            <div className="pt-2">
              <a
                href="https://t.me/bgern_supportbot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0062FF] text-white text-xs font-semibold hover:bg-[#0052d9] transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Join Bgern Telegram Community
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECCC6E]">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/studio" onClick={handleStudioClick} className="hover:text-white transition-colors">
                  Caption Studio
                </Link>
                {authCheckError && (
                  <p role="alert" className="mt-1 text-red-200">
                    {authCheckError}
                  </p>
                )}
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog &amp; Guides
                </Link>
              </li>
              <li>
                <Link href="/tools/tiktok-generator" className="hover:text-white transition-colors">
                  TikTok Hashtag Generator
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/1080p-video-burner" className="hover:text-white transition-colors">
                  1080p Video Burner
                </Link>
              </li>
              <li>
                <Link href="/subtitle-animations" className="hover:text-white transition-colors">
                  Subtitle Animations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECCC6E]">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Ethiopian Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECCC6E]">Accepted Payments</h4>
            <p className="text-[11px] text-neutral-300">
              Support local Ethiopian mobile banking and transfers:
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10 text-xs text-neutral-200">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0062FF]" />
                <span className="font-semibold">Telebirr</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10 text-xs text-neutral-200">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A6056F]" />
                <span className="font-semibold">Commercial Bank of Ethiopia (CBE)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-300">
          <div>
            © {new Date().getFullYear()} Bgern. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-neutral-300">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#A6056F] fill-[#A6056F]" />
            <span>for Ethiopian Digital Creators</span>
          </div>
        </div>
      </div>
    </footer>
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onLoginSuccess={() => {
        setShowAuthModal(false);
        router.push('/studio');
      }}
    />
    </>
  );
}
