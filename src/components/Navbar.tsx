'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Clock,
  Coins,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import AuthModal from './AuthModal';
import { useTheme } from './ThemeProvider';
import NotificationBell from './NotificationBell';
import PaymentApprovalModal from './PaymentApprovalModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('bgern_user');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      fetch('/api/auth/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            try {
              localStorage.setItem('bgern_user', JSON.stringify(data.user));
            } catch {}
          } else if (data.authenticated === false) {
            setCurrentUser(null);
            try {
              localStorage.removeItem('bgern_user');
              localStorage.removeItem('bgern_user_avatar');
            } catch {}
          }
        })
        .catch(() => {
          // On network error or reload lag, keep cached user so state does not flicker
        });
    };

    syncAuth();
    window.addEventListener('bgern_auth_change', syncAuth);
    return () => window.removeEventListener('bgern_auth_change', syncAuth);
  }, [pathname]);

  const getGmailAvatarUrl = (user: any) => {
    if (!user || !user.email) return '';
    const cleanEmail = user.email.trim().toLowerCase();
    return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${encodeURIComponent(user.name || cleanEmail.split('@')[0])}%26background%3D0062FF%26color%3Dfff%26size%3D256%26bold%3Dtrue`;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bgern_user');
      window.dispatchEvent(new Event('bgern_auth_change'));
    }
    setCurrentUser(null);
    router.push('/');
  };

  const navLinks: { name: string; href: string; requiresAuth?: boolean; hideOnMedium?: boolean }[] = [
    { name: 'Home', href: '/' },
    ...(currentUser ? [{ name: 'Studio', href: '/studio' }] : []),
    { name: 'TikTok Tool', href: '/tools/tiktok-generator' },
    { name: 'Blog', href: '/blog' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about', hideOnMedium: true },
    { name: 'Contact', href: '/contact', hideOnMedium: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#256E96]/20 dark:border-[#256E96]/30 bg-[#F3F5F6]/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2 md:gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/logo.png"
              alt="Bgern Logo"
              width={40}
              height={40}
              fetchPriority="high"
              decoding="async"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white dark:bg-[#131924] p-0.5 border border-[#256E96]/30 shadow-md shadow-[#0062FF]/10 group-hover:scale-105 transition-transform shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#632450] dark:text-white transition-colors whitespace-nowrap">
                  Bgern
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-[#0062FF]/10 border border-[#0062FF]/25 text-[#0062FF] text-[9px] sm:text-[10px] font-extrabold uppercase whitespace-nowrap">
                  Amharic AI
                </span>
              </div>
              <p className="text-[10px] text-[#256E96] font-medium -mt-0.5 hidden xl:block whitespace-nowrap">
                Amharic Captions Generator
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-3 lg:gap-4 xl:gap-6 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300 shrink min-w-0">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    if (link.requiresAuth && !currentUser) {
                      e.preventDefault();
                      setShowAuthModal(true);
                    }
                  }}
                  className={`whitespace-nowrap transition-colors ${
                    link.hideOnMedium ? 'hidden xl:inline-block' : 'inline-block'
                  } ${
                    isActive
                      ? 'text-[#0062FF] dark:text-[#0062FF] font-bold border-b-2 border-[#0062FF] pb-0.5'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-[#0062FF] dark:hover:text-[#0062FF]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Auth State */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Minutes & Credits Pills */}
                {(() => {
                  const is70PercentUsed = Boolean(
                    currentUser.total_credits_granted &&
                    currentUser.total_credits_granted > 0 &&
                    currentUser.credits !== undefined &&
                    ((currentUser.total_credits_granted - currentUser.credits) / currentUser.total_credits_granted) >= 0.7
                  );
                  return (
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <Link
                        href="/profile"
                        className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 rounded-xl bg-white dark:bg-[#131924] border text-xs shadow-xs transition-colors whitespace-nowrap shrink-0 ${
                          is70PercentUsed
                            ? 'border-amber-500/50 hover:border-amber-500'
                            : 'border-[#256E96]/25 dark:border-[#256E96]/40 hover:border-[#0062FF]/40'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-[#ECCC6E] fill-[#ECCC6E] shrink-0" />
                          <span className="font-extrabold text-[#632450] dark:text-[#ECCC6E]">{currentUser.minutes_balance}</span>
                          <span className="text-[11px] text-neutral-500">Min</span>
                        </div>
                        <div className="h-3 w-px bg-[#256E96]/20" />
                        <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          <Coins className="w-3.5 h-3.5 text-[#0062FF] fill-[#0062FF] shrink-0" />
                          <span className="font-extrabold text-[#0062FF]">
                            {currentUser.credits?.toLocaleString()}
                          </span>
                        </div>
                        {is70PercentUsed && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] border border-amber-500/30 whitespace-nowrap" title="You have used 70% or more of your AI credits">
                            70%+
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/pricing"
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all hover:scale-105 whitespace-nowrap shrink-0 ${
                          is70PercentUsed
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/60 text-amber-600 dark:text-amber-400 animate-pulse'
                            : 'bg-[#0062FF]/10 hover:bg-[#0062FF]/20 border-[#0062FF]/30 text-[#0062FF]'
                        }`}
                        title={is70PercentUsed ? '⚠️ ከክሬዲትዎ 70% በላይ ተጠቅመዋል! አሁን ደቂቃ ይሙሉ' : 'Top up minutes via Telebirr or CBE Birr'}
                      >
                        + ደቂቃ ጨምር
                      </Link>
                    </div>
                  );
                })()}

                {/* Profile Link with Avatar & Truncated Name */}
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#131924] hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-[#256E96]/25 dark:border-[#256E96]/40 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
                  title={currentUser.name || 'User Profile'}
                >
                  {(() => {
                    const avatarSrc = currentUser.avatar || getGmailAvatarUrl(currentUser);
                    return avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={currentUser.name || 'User'}
                        width={24}
                        height={24}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=0062FF&color=fff&size=256&bold=true`;
                        }}
                        className="w-6 h-6 rounded-full object-cover border border-[#0062FF]/50 shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center font-bold text-[11px] shrink-0">
                        {currentUser.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    );
                  })()}
                  <span className="hidden sm:inline-block max-w-[85px] lg:max-w-[125px] xl:max-w-[160px] truncate text-neutral-800 dark:text-neutral-200 whitespace-nowrap font-bold">
                    {currentUser.name}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-xs font-bold transition-all whitespace-nowrap shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xl:inline whitespace-nowrap">Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-bold text-xs transition-all shadow-md shadow-[#0062FF]/20 active:scale-95"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Sign in <span className="hidden xs:inline">with Gmail</span></span>
              </button>
            )}

            {currentUser && (
              <NotificationBell currentUser={currentUser} isAdminPanel={false} />
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-white dark:bg-[#131924] text-neutral-700 dark:text-neutral-200 lg:hidden border border-[#256E96]/25 dark:border-[#256E96]/40 active:scale-95 shadow-xs"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#256E96]/20 dark:border-[#256E96]/30 bg-[#F3F5F6]/98 dark:bg-[#0B0F17]/98 backdrop-blur-xl p-4 space-y-3 animate-in fade-in duration-200 shadow-xl">
            {/* Mobile Theme Toggle Row */}
            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white dark:bg-[#131924] border border-[#256E96]/20 text-xs font-semibold shadow-xs">
              <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-[#ECCC6E]" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>Phone Mode: <strong className="text-[#0062FF] dark:text-[#ECCC6E]">{theme === 'dark' ? 'Dark 🌙' : 'Light ☀️'}</strong></span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-[#256E96]/20 text-xs font-bold text-[#0062FF] dark:text-[#ECCC6E] flex items-center gap-1.5 transition-all active:scale-95"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>

            {currentUser && (
              <div className="p-3 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 flex items-center justify-between mb-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const avatarSrc = currentUser.avatar || getGmailAvatarUrl(currentUser);
                    return avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={currentUser.name || 'User'}
                        width={32}
                        height={32}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=0062FF&color=fff&size=256&bold=true`;
                        }}
                        className="w-8 h-8 rounded-full object-cover border border-[#0062FF]/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center font-bold text-xs">
                        {currentUser.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[150px]">{currentUser.name}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">{currentUser.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-[#632450] dark:text-[#ECCC6E]">{currentUser.minutes_balance} Min</div>
                  <div className="text-[10px] text-[#0062FF] font-bold">{currentUser.credits?.toLocaleString()} Cr</div>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (link.requiresAuth && !currentUser) {
                    e.preventDefault();
                    setShowAuthModal(true);
                  }
                }}
                className={`flex items-center justify-between py-2.5 px-2 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? 'text-[#0062FF] bg-[#0062FF]/10'
                    : 'text-neutral-800 dark:text-neutral-200 hover:text-[#0062FF]'
                }`}
              >
                <span>{link.name}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
            ))}

            {!currentUser && (
              <div className="pt-2 border-t border-[#256E96]/20">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <User className="w-4 h-4" />
                  <span>Sign in with Gmail (ግባ)</span>
                </button>
              </div>
            )}

            {currentUser && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl text-sm font-semibold text-[#0062FF] hover:bg-[#0062FF]/10 transition-colors"
                >
                  <span>My Profile & Credit Top-up</span>
                  <ChevronRight className="w-4 h-4 text-[#0062FF]" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left py-2.5 px-2 text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 border-t border-[#256E96]/20 pt-3 hover:text-rose-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out (ውጣ)</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          router.push('/studio');
        }}
      />

      {currentUser && <PaymentApprovalModal currentUser={currentUser} />}
    </>
  );
}
