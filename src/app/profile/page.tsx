'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isSupportedReceiptFile } from '@/lib/payment-receipt';
import {
  User,
  Clock,
  Coins,
  ShieldCheck,
  Video,
  CreditCard,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Lock,
  Trash2,
  Download,
  Copy,
  Check,
  Settings,
  Sparkles,
  Palette,
  Type,
  Smartphone,
  Monitor,
  LogOut,
  Search,
  FileText,
  RefreshCw,
  Zap,
  Sliders,
  Shield,
  ArrowUpRight,
  UploadCloud,
  Layers,
  Camera,
  RotateCcw,
  ListOrdered,
  TrendingDown,
  TrendingUp,
  ImageIcon,
  Hash,
  X,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  PRICING_PLANS,
  OFFICIAL_PAYMENT_ACCOUNTS,
  PACKAGES,
  PAYMENT_ACCOUNTS,
  PricingPlan,
  PaymentAccount,
} from '@/lib/pricing-plans';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'credits' | 'billing'>('videos');

  // Avatar State
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [avatarUploadMsg, setAvatarUploadMsg] = useState<string>('');

  // Video search & filter
  const [videoSearch, setVideoSearch] = useState('');
  const [videoFilter, setVideoFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Billing & Top-Up Payment State
  const [selectedPlan, setSelectedPlan] = useState<any>(PACKAGES[1]); // Default PLUS
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);
  const receiptFileRef = useRef<HTMLInputElement | null>(null);
  const receiptUploadIdRef = useRef(0);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(OFFICIAL_PAYMENT_ACCOUNTS);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.methods && data.methods.length > 0) {
          setPaymentAccounts(data.methods);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!screenshotPreview) return;
    return () => URL.revokeObjectURL(screenshotPreview);
  }, [screenshotPreview]);

  useEffect(() => () => {
    receiptUploadIdRef.current += 1;
  }, []);

  const openBilling = () => {
    setActiveTab('billing');
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('billing-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // Settings & Preferences State (Synced with localStorage)
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaveMsg, setNameSaveMsg] = useState('');
  const [preferences, setPreferences] = useState({
    defaultFont: 'Zemenay',
    defaultTextColor: '#FACC15',
    defaultBgColor: '#000000',
    defaultBgOpacity: 0.65,
    defaultAnimation: 'pop',
    defaultAspectRatio: '9:16',
    autoSafeZone: true,
  });
  const [prefSaveMsg, setPrefSaveMsg] = useState('');

  // Generate real Google / Gmail profile photo
  const getGmailAvatarUrl = (user: any) => {
    if (!user || !user.email) return '';
    const cleanEmail = user.email.trim().toLowerCase();
    const name = user.name || cleanEmail.split('@')[0] || 'User';
    return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${encodeURIComponent(name)}%26background%3D0062FF%26color%3Dfff%26size%3D256%26bold%3Dtrue`;
  };

  // Initial Data Fetch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('bgern_creator_preferences');
      if (savedPref) {
        try {
          setPreferences((prev) => ({ ...prev, ...JSON.parse(savedPref) }));
        } catch {}
      }
    }

    fetch('/api/auth/me', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setDisplayName(data.user.name || '');
          const resolvedAvatar = data.user.avatar || getGmailAvatarUrl(data.user);
          setUserAvatar(resolvedAvatar);

          // Fetch user's videos & payments
          Promise.all([
            fetch(`/api/videos?userId=${data.user.id}`),
            fetch('/api/payments'),
          ])
            .then(async ([vRes, pRes]) => {
              const vData = await vRes.json();
              const pData = await pRes.json();
              setVideos(vData.videos || []);
              const myPayments = (pData.payments || []).filter(
                (p: any) => p.userId === data.user.id || p.userEmail === data.user.email
              );
              setPayments(myPayments);

              // Check if returning from automated Chapa checkout
              if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const txRefParam = urlParams.get('tx_ref');
                const paymentStatus = urlParams.get('payment');
                if (txRefParam && (paymentStatus === 'success' || paymentStatus === 'simulated')) {
                  setActiveTab('billing');
                  fetch(`/api/payments/verify?tx_ref=${txRefParam}&simulate=${paymentStatus === 'simulated'}`)
                    .then((r) => r.json())
                    .then((vData) => {
                      if (vData.success && vData.payment) {
                        setPaymentSuccessMsg(`🎉 የክፍያ ማረጋገጫ ተሳክቷል! (Payment Verified! Reference: ${txRefParam})`);
                        // Refresh user profile for updated minutes and credits
                        fetch('/api/auth/me', {
                          credentials: 'same-origin',
                          cache: 'no-store',
                        })
                          .then((r) => r.json())
                          .then((d) => {
                            if (d.user) setCurrentUser(d.user);
                          });
                        // Refresh payments list
                        fetch('/api/payments')
                          .then((r) => r.json())
                          .then((p) => {
                            if (p.payments) {
                              setPayments(p.payments.filter((item: any) => item.userId === data.user.id || item.userEmail === data.user.email));
                            }
                          });
                      }
                    })
                    .catch(() => {});
                }
              }
            })
            .catch(() => {});
        } else {
          setCurrentUser(null);
          setDisplayName('');
          setUserAvatar(null);
          setVideos([]);
          setPayments([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('bgern_user');
          }
          router.push('/');
        }
      })
      .catch(() => {
        setCurrentUser(null);
        setDisplayName('');
        setUserAvatar(null);
        setVideos([]);
        setPayments([]);
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Handle Photo Upload (User can upload their own photo)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo is too large. Please choose an image smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUserAvatar(base64);

      if (typeof window !== 'undefined') {
        if (currentUser) {
          const updated = { ...currentUser, avatar: base64 };
          setCurrentUser(updated);
        }
        window.dispatchEvent(new Event('bgern_auth_change'));
        window.dispatchEvent(new Event('storage'));
      }

      // Sync to backend
      try {
        await fetch('/api/auth/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64 }),
        });
        setAvatarUploadMsg('✓ Custom photo uploaded and saved!');
        setTimeout(() => setAvatarUploadMsg(''), 3000);
      } catch {
        setAvatarUploadMsg('✓ Saved locally on your device!');
        setTimeout(() => setAvatarUploadMsg(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset Photo to Official Gmail Avatar
  const handleResetToGmailAvatar = async () => {
    const gmailAvatar = getGmailAvatarUrl(currentUser);
    setUserAvatar(gmailAvatar);

    if (typeof window !== 'undefined') {
      if (currentUser) {
        const updated = { ...currentUser, avatar: gmailAvatar };
        setCurrentUser(updated);
      }
      window.dispatchEvent(new Event('bgern_auth_change'));
      window.dispatchEvent(new Event('storage'));
    }

    try {
      await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: gmailAvatar }),
      });
      setAvatarUploadMsg('✓ Reset to Gmail profile avatar!');
      setTimeout(() => setAvatarUploadMsg(''), 3000);
    } catch {}
  };

  // Handle Account Number Copy
  const handleCopyAccount = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const requestId = ++receiptUploadIdRef.current;
    setIsUploadingScreenshot(true);
    setReceiptUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'payment-receipt');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to upload receipt.');
      }
      if (requestId === receiptUploadIdRef.current) {
        setUploadedUrl(data.url);
        return data.url;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload receipt.';
      if (requestId === receiptUploadIdRef.current) {
        setReceiptUploadError(message);
      }
      return null;
    } finally {
      if (requestId === receiptUploadIdRef.current) {
        setIsUploadingScreenshot(false);
      }
    }
  };

  // Handle Receipt Screenshot File Selection
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadedUrl(null);
    if (!isSupportedReceiptFile(file)) {
      receiptUploadIdRef.current += 1;
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setIsUploadingScreenshot(false);
      setReceiptUploadError('Choose a JPEG, PNG, or WebP receipt image no larger than 10 MB.');
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    await uploadReceipt(file);
  };

  const clearReceipt = () => {
    receiptUploadIdRef.current += 1;
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setUploadedUrl(null);
    setIsUploadingScreenshot(false);
    setReceiptUploadError(null);
    if (receiptFileRef.current) receiptFileRef.current.value = '';
  };

  // Submit Top-Up Payment with Receipt Screenshot Only
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile && !uploadedUrl) {
      alert('እባክዎ የክፍያዎን ስክሪንሾት ወይም ደረሰኝ ያያይዙ (Please attach payment receipt screenshot)');
      return;
    }

    setSubmittingPayment(true);
    try {
      let finalUrl = uploadedUrl;
      if (!finalUrl && screenshotFile) {
        const receiptUrl = await uploadReceipt(screenshotFile);
        if (!receiptUrl) throw new Error('Failed to upload receipt. Please retry.');
        finalUrl = receiptUrl;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.id,
          screenshotPath: finalUrl || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.payment) {
          setPayments((prev) => [data.payment, ...prev]);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bgern_notif_refresh'));
          window.dispatchEvent(new Event('bgern_auth_change'));
        }
        setPaymentSuccessMsg(
          data.message || 'የደረሰኝ ፎቶዎ ገብቷል! በቅርቡ ተረጋግጦ ደቂቃዎ ይጨመራል (Payment screenshot submitted!)'
        );
        clearReceipt();
        setTimeout(() => {
          setPaymentSuccessMsg('');
        }, 5000);
      } else {
        alert(data.error || 'Payment submission failed.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Network error submitting payment.');
    } finally {
      setSubmittingPayment(false);
      setIsUploadingScreenshot(false);
    }
  };

  // Delete Video Project
  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/videos?id=${videoId}`, { method: 'DELETE' });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
      } else {
        alert('Could not delete video project.');
      }
    } catch {
      alert('Error deleting video.');
    }
  };

  // Sign Out / Logout
  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bgern_user');
      localStorage.removeItem('bgern_user_avatar');
    }
    router.push('/');
  };

  // Filtered Videos
  const filteredVideos = videos.filter((v) => {
    const matchesSearch = (v.title || '').toLowerCase().includes(videoSearch.toLowerCase());
    const matchesFilter =
      videoFilter === 'all'
        ? true
        : videoFilter === 'approved'
        ? v.status === 'APPROVED'
        : v.status === 'PENDING_APPROVAL';
    return matchesSearch && matchesFilter;
  });

  // Real Credit Usage Transactions Ledger based on actual payments and video creations
  const approvedPayments = payments.filter((p) => p.status === 'approved');
  const creditLedger = [
    ...approvedPayments.map((p) => ({
      id: `CR-P${p.id}`,
      title: `Plan Allocation (${p.planName} Plan)`,
      category: 'Top-Up',
      type: 'IN',
      amount: p.creditsCredited || (p.minutesCredited ? p.minutesCredited * 6000 : 0),
      balanceAfter: currentUser?.credits || 0,
      description: `Payment approved via ${p.paymentMethod || 'Telebirr'} (Ref: ${p.transactionRef})`,
      date: new Date(p.createdAt).toLocaleDateString(),
      status: 'Approved',
    })),
    ...videos.map((v) => ({
      id: `CR-V${v.id}`,
      title: `Studio Captioning: ${v.title.length > 25 ? v.title.slice(0, 25) + '...' : v.title}`,
      category: 'AI Engine',
      type: 'OUT',
      amount: Math.round((v.durationSec || 60) / 60 * 6000),
      balanceAfter: currentUser?.credits || 0,
      description: `Amharic speech recognition and video burning (${v.durationSec || 60}s)`,
      date: new Date(v.createdAt).toLocaleDateString(),
      status: v.status === 'APPROVED' ? 'Completed' : 'Processing',
    })),
  ];

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col justify-between transition-colors duration-200">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-10 h-10 border-3 border-[#0062FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Loading your creator workspace...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const approvedCount = videos.filter((v) => v.status === 'APPROVED').length;
  const pendingCount = videos.filter((v) => v.status === 'PENDING_APPROVAL').length;
  const minutesBalance = currentUser.minutes_balance || 0;
  const quotaPercentage = Math.min(100, Math.round((minutesBalance / 60) * 100));

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* =========================================================================
            1. TOP HERO: CREATOR IDENTITY & PHOTO UPLOAD
        ========================================================================== */}
        <div className="relative rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 p-6 sm:p-8 shadow-xl overflow-hidden backdrop-blur-xl transition-colors">
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#0062FF]/10 dark:bg-[#0062FF]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#A6056F]/10 dark:bg-[#A6056F]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* User Profile Avatar with Photo Upload & Info */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                {/* Clickable Avatar Photo Container */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-[#0062FF] via-[#A6056F] to-[#632450] text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-[#0062FF]/20 border-2 border-white dark:border-[#256E96]/40 cursor-pointer relative select-none"
                  title="Click to upload custom photo"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={currentUser.name || 'User Avatar'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || currentUser.email?.split('@')[0] || 'User')}&background=0062FF&color=fff&size=256&bold=true`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span>{currentUser.name?.[0]?.toUpperCase() || 'C'}</span>
                  )}

                  {/* Camera Icon Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <Camera className="w-5 h-5 text-[#ECCC6E]" />
                    <span className="text-[9px] font-black uppercase mt-1">Change</span>
                  </div>
                </div>

                {/* Hidden File Input for User Photo Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                {/* Camera Quick-Upload Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#0062FF] hover:bg-[#0052d9] text-white border-2 border-white dark:border-[#131924] flex items-center justify-center shadow-lg transition-transform active:scale-90"
                  title="Upload profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
                    {currentUser.name || 'Creator'}
                  </h1>

                  {/* Role Badge */}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs ${
                      currentUser.isAdmin
                        ? 'bg-[#632450]/15 text-[#632450] dark:bg-[#ECCC6E]/15 dark:text-[#ECCC6E] border-[#632450]/30 dark:border-[#ECCC6E]/30'
                        : 'bg-[#0062FF]/15 text-[#0062FF] dark:bg-[#0062FF]/25 dark:text-[#60a5fa] border-[#0062FF]/30 dark:border-[#0062FF]/40'
                    }`}
                  >
                    {currentUser.isAdmin ? '★ System Admin' : '⚡ Pro Creator'}
                  </span>

                  {/* Gmail Verified Tag */}
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Real Gmail Verified</span>
                  </span>
                </div>

                {/* Email & Photo Management Actions */}
                <div className="flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 flex-wrap">
                  <span className="font-mono text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-[#256E96]/15 dark:border-white/5">
                    {currentUser.email}
                  </span>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-[#0062FF] dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>

                  <span>•</span>

                  <button
                    type="button"
                    onClick={handleResetToGmailAvatar}
                    className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                    title="Reset to your original Gmail profile photo"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Gmail Avatar</span>
                  </button>
                </div>

                {avatarUploadMsg && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{avatarUploadMsg}</p>
                )}
              </div>
            </div>

            {/* Quick Actions Bar with PROMINENT LOGOUT */}
            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
              <Link
                href="/studio"
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0062FF]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                Launch Studio
              </Link>

              {(currentUser?.isAdmin || currentUser?.role === 'ADMIN') && (
                <Link
                  href="/shems"
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-[#632450]/10 hover:bg-[#632450]/20 text-[#632450] dark:bg-[#ECCC6E]/10 dark:hover:bg-[#ECCC6E]/20 dark:text-[#ECCC6E] border border-[#632450]/30 dark:border-[#ECCC6E]/40 font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Portal
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveTab('billing');
                  const el = document.getElementById('billing-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#0062FF] hover:bg-[#0052d9] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0062FF]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Add Minutes (Telebirr)
              </button>
            </div>
          </div>

          {/* =========================================================================
              2. METRICS & USAGE ANALYTICS GRID
          ========================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#256E96]/15 dark:border-white/10">
            {/* Metric 1: Minutes Remaining */}
            <div className="p-4 rounded-2xl bg-[#F3F5F6]/80 dark:bg-[#0B0F17]/70 border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/40 transition-all space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0062FF]" />
                  Minutes Available
                </span>
                <button
                  type="button"
                  onClick={openBilling}
                  className="text-[10px] font-black text-[#0062FF] hover:underline uppercase"
                >
                  + Top Up
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#632450] dark:text-[#ECCC6E]">{minutesBalance}</span>
                <span className="text-xs text-neutral-500 font-semibold">Min</span>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0062FF] to-[#A6056F] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, quotaPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                  <span>Usage quota</span>
                  <span>{quotaPercentage}% allowance</span>
                </div>
              </div>
            </div>

            {/* Metric 2: AI Speech & Grammar Credits */}
            <div className="p-4 rounded-2xl bg-[#F3F5F6]/80 dark:bg-[#0B0F17]/70 border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/40 transition-all space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#0062FF]" />
                  AI Token Credits
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('credits')}
                  className="text-[10px] font-black text-[#0062FF] hover:underline uppercase"
                >
                  View List →
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#632450] dark:text-[#ECCC6E]">
                  {(currentUser.credits ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">Credits</span>
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex flex-col gap-0.5 font-medium">
                <span>⚡ 100 Credits / Second (6,000 Credits = 1 Minute)</span>
                <span className="text-neutral-400 dark:text-neutral-500 text-[9px]">• 15s: 1,500 Cr | 30s: 3,000 Cr | 45s: 4,500 Cr</span>
              </div>
            </div>

            {/* Metric 3: Video Projects Status */}
            <div className="p-4 rounded-2xl bg-[#F3F5F6]/80 dark:bg-[#0B0F17]/70 border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#256E96]/60 transition-all space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#256E96]" />
                  Total Projects
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {approvedCount} Ready
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#632450] dark:text-[#ECCC6E]">{videos.length}</span>
                <span className="text-xs text-neutral-500 font-semibold">Videos</span>
              </div>
              <div className="text-[10px] text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{approvedCount} Approved</span>
                <span>•</span>
                <span className="text-[#0062FF] font-bold">{pendingCount} Pending</span>
              </div>
            </div>

            {/* Metric 4: Estimated Time Saved */}
            <div className="p-4 rounded-2xl bg-[#F3F5F6]/80 dark:bg-[#0B0F17]/70 border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#A6056F]/40 transition-all space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#A6056F]" />
                  Productivity Saved
                </span>
                <span className="text-[10px] font-bold text-[#A6056F] bg-[#A6056F]/10 dark:bg-[#A6056F]/20 px-2 py-0.5 rounded-md border border-[#A6056F]/20">
                  {videos.length > 0 ? '98% Faster' : 'Ready'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#632450] dark:text-[#ECCC6E]">
                  {videos.length > 0 ? (videos.length * 0.8).toFixed(1) : '0'}
                </span>
                <span className="text-xs text-neutral-500 font-semibold">Hours Saved</span>
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <span>vs manual subtitle typing & sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PACKAGE ACTIVATION / PENDING APPROVAL STATUS BANNER
        ========================================================================== */}
        {(() => {
          const pendingPayment = payments.find((p) => p.status === 'pending');
          if (pendingPayment) {
            return (
              <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-600/50 text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-200/80 dark:bg-amber-800/60 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-800 dark:text-amber-200 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                        ክፍያዎ በግምገማ ላይ ነው (Package Pending Admin Approval)
                      </h4>
                      <span className="text-[10px] uppercase font-black bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                        Pending Verification
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      You submitted <strong>{pendingPayment.planName} Plan</strong> ({pendingPayment.amountEtb} ETB, Ref: <span className="font-mono font-bold">{pendingPayment.transactionRef}</span>). Once the administrator verifies your transaction, <strong>{pendingPayment.minutesCredited} Minutes</strong> and <strong>{pendingPayment.creditsCredited?.toLocaleString()} AI Credits</strong> will be credited directly to your account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-black shrink-0 shadow-xs"
                >
                  View Payment Status
                </button>
              </div>
            );
          }
          if ((currentUser.minutes_balance || 0) === 0 && (currentUser.credits ?? 0) === 0 && !currentUser.isAdmin) {
            return (
              <div className="p-5 rounded-3xl bg-blue-50/80 dark:bg-[#0062FF]/10 border border-[#0062FF]/30 dark:border-[#0062FF]/40 text-neutral-900 dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#632450] dark:text-[#ECCC6E]">
                      ደቂቃ የለዎትም? (Choose a Pricing Package to Get Started)
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                      Your current balance is <strong>0 Minutes</strong> and <strong>0 AI Credits</strong>. Select a package from the pricing plans, transfer via Telebirr or CBE Birr, and your minutes will be unlocked immediately once approved by admin.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openBilling}
                  className="px-4 py-2.5 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-black uppercase tracking-wider shrink-0 shadow-md shadow-[#0062FF]/20"
                >
                  Select Package →
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* =========================================================================
            STUDIO WORKSPACE EMBEDDED IN USER PROFILE
        ========================================================================== */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0062FF]/10 via-[#632450]/10 to-[#A6056F]/10 dark:from-[#0062FF]/20 dark:via-[#632450]/20 dark:to-[#A6056F]/20 border-2 border-[#0062FF]/30 dark:border-[#0062FF]/40 p-6 sm:p-7 shadow-lg backdrop-blur-md overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#0062FF]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0062FF] to-[#A6056F] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#0062FF]/25">
                <Sparkles className="w-7 h-7 fill-white" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-[#632450] dark:text-white">
                    Bgern AI Studio (የቪዲዮ ስቱዲዮ)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0062FF] text-white text-[10px] font-black uppercase tracking-wider">
                    Studio Ready
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-xl leading-relaxed">
                  ቪዲዮዎን ይጫኑ፣ በአማርኛ AI ጽሑፍ በቅጽበት ያዘጋጁ፣ ቅርጸ-ቁምፊ እና ቀለሞችን ያስተካክሉ፣ እና በ 1080p ያውርዱ።
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold flex-wrap">
                  <span className="flex items-center gap-1 text-[#0062FF] dark:text-[#ECCC6E] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {minutesBalance} Minutes Available
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold">
                    <Coins className="w-3.5 h-3.5 text-[#0062FF]" />
                    {(currentUser.credits ?? 0).toLocaleString()} Credits
                  </span>
                  <span>•</span>
                  <span>100 Credits / Sec (6,000 / Min)</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href="/tools/tiktok-generator"
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white dark:bg-[#131924] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#FF0050] border border-[#FF0050]/30 font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
              >
                <Hash className="w-4 h-4 text-[#FF0050]" />
                <span>TikTok Generator (ሃሽታግ)</span>
              </Link>
              <Link
                href="/studio"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-[#0062FF]/25 flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Launch Studio (ስቱዲዮ ይግቡ)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. TAB NAVIGATION (VIDEOS, CREDITS LIST, BILLING, PREFERENCES, SECURITY)
        ========================================================================== */}
        <div className="relative flex items-center justify-between gap-2 border-b border-[#256E96]/15 dark:border-white/10 pb-3 overflow-x-auto no-scrollbar after:absolute after:right-0 after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-l after:from-white dark:after:from-[#0B0F17] after:to-transparent after:pointer-events-none after:md:hidden">
          <div className="flex items-center gap-2">
            {[
              { id: 'videos', label: `Video Projects (${videos.length})`, icon: Video },
              { id: 'credits', label: `Credit List (${(currentUser.credits ?? 0).toLocaleString()})`, icon: Coins },
              { id: 'billing', label: `Plans & Billing (${payments.length})`, icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap shrink-0 select-none ${
                    isActive
                      ? 'bg-[#0062FF] text-white shadow-lg shadow-[#0062FF]/25 scale-[1.02]'
                      : 'bg-white dark:bg-[#131924] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-[#256E96]/20 dark:border-[#256E96]/35'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            TAB 1: VIDEO PROJECTS LIBRARY
        ========================================================================== */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Search, Filter & Quick Upload Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-xs">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search videos by title..."
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#0062FF]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#F3F5F6] dark:bg-[#0B0F17] p-1 rounded-xl border border-[#256E96]/20 dark:border-[#256E96]/35 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVideoFilter('all')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      videoFilter === 'all'
                        ? 'bg-[#0062FF] text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoFilter('approved')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      videoFilter === 'approved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoFilter('pending')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      videoFilter === 'pending'
                        ? 'bg-[#0062FF] text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>

              <Link
                href="/studio"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0062FF]/20 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Upload New Video
              </Link>
            </div>

            {/* 7-Day Storage Policy Banner */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-950 dark:text-amber-100 flex items-center gap-3.5 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 dark:bg-amber-800/60 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-800 dark:text-amber-200" />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-black text-amber-900 dark:text-amber-200">የ7 ቀናት ማቆያ ፖሊሲ (7-Day Cloud Retention Policy): </span>
                <span>ቪዲዮዎችዎ በድረ-ገጻችን ላይ የሚቆዩት ለ<strong>7 ቀናት ብቻ</strong> ነው። ከ7 ቀናት በኋላ ደህንነትዎን ለመጠበቅ እና ሰርቨሮችን ለማቀላጠፍ በራስ-ሰር ይሰረዛሉ። እባክዎ የተዘጋጁትን ቪዲዮዎች ወደ መሳሪያዎ ማውረድዎን ያረጋግጡ። (Videos are held on our website for 7 days only before automatic deletion. Please download your files).</span>
              </div>
            </div>

            {/* Videos Grid */}
            {filteredVideos.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 text-[#256E96] mx-auto flex items-center justify-center">
                  <Video className="w-8 h-8 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#632450] dark:text-[#ECCC6E]">No video projects found</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                    {videoSearch
                      ? `No projects matching "${videoSearch}". Try clearing your search.`
                      : 'Upload your first Amharic video to generate professional captions and subtitle files.'}
                  </p>
                </div>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0062FF] hover:bg-[#0052d9] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0062FF]/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Go to Caption Studio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVideos.map((vid) => {
                  const isApproved = vid.status === 'APPROVED';
                  const isRejected = vid.status === 'REJECTED';
                  const createdTime = new Date(vid.createdAt).getTime();
                  const expiresTime = createdTime + 7 * 24 * 60 * 60 * 1000;
                  const msRemaining = expiresTime - Date.now();
                  const daysLeft = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
                  const hoursLeft = Math.max(0, Math.ceil(msRemaining / (60 * 60 * 1000)));

                  return (
                    <div
                      key={vid.id}
                      className="p-5 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/40 transition-all shadow-sm flex flex-col justify-between gap-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/20 text-[#0062FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Video className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate max-w-[240px] sm:max-w-xs">
                                {vid.title}
                              </h4>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                <span>{new Date(vid.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="font-mono text-[#0062FF] font-bold">9:16 Vertical</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs ${
                                isApproved
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30'
                                  : isRejected
                                  ? 'bg-rose-500/10 text-rose-700 dark:bg-red-500/20 dark:text-red-300 border border-red-500/30'
                                  : 'bg-[#0062FF]/10 text-[#0062FF] dark:bg-blue-500/20 dark:text-blue-300 border border-[#0062FF]/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-[#0062FF] animate-ping'
                                }`}
                              />
                              {isApproved ? 'Approved (ጸድቋል)' : isRejected ? 'Rejected' : 'Under Review'}
                            </span>

                            {/* 7-Day Expiration Badge */}
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              <span>{daysLeft > 1 ? `${daysLeft} days left` : `${hoursLeft}h left`}</span>
                            </span>
                          </div>
                        </div>

                        {vid.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-red-950/40 border border-rose-200 dark:border-red-500/30 text-rose-700 dark:text-red-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Note: {vid.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#256E96]/15 dark:border-white/5 flex items-center justify-between gap-3">
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                          Project ID #{vid.id}
                        </div>

                        <div className="flex items-center gap-2">
                          {vid.videoUrl && (
                            <a
                              href={vid.videoUrl}
                              download={`bgern_video_${vid.id}.webm`}
                              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-[#0062FF]/15 hover:text-[#0062FF] text-neutral-600 dark:text-neutral-300 border border-[#256E96]/15 dark:border-white/5 transition-all"
                              title="Download video to your device (7-day storage)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-neutral-500 border border-[#256E96]/15 dark:border-white/5 transition-all"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {isApproved ? (
                            <Link
                              href="/studio"
                              className="px-4 py-2 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              <span>Open in Studio</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium px-2.5 py-1 bg-neutral-100 dark:bg-white/5 rounded-lg">
                              Pending admin approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: CREDIT LIST & LEDGER (DETAILED AI TOKEN BREAKDOWN)
        ========================================================================== */}
        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Credit Overview Banner */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0062FF]/10 dark:bg-blue-500/20 text-[#0062FF] dark:text-blue-300 border border-[#0062FF]/20">
                    AI Speech & Word Credits
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Never Expire</span>
                </div>
                <h3 className="text-2xl font-black text-[#632450] dark:text-white flex items-center gap-2">
                  <span>Current Balance:</span>
                  <span className="text-[#0062FF] dark:text-[#ECCC6E]">{(currentUser.credits ?? 0).toLocaleString()} Credits</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl">
                  Credits power the Amharic speech-to-text neural network, Ge'ez grammar auto-alignment, and 1080p full HD video rendering. 
                  Every <strong>6,000 Credits</strong> covers approximately 1 complete minute of high-definition Amharic video subtitles.
                </p>
              </div>

              <button
                type="button"
                onClick={openBilling}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0062FF]/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 fill-white" />
                Add More Credits
              </button>
            </div>

            {/* Credit Quota Rates Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-xs space-y-1">
                <div className="text-[11px] font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0062FF]" />
                  Speech STT Engine
                </div>
                <div className="text-xl font-black text-[#632450] dark:text-[#ECCC6E]">3,000 Credits</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Per minute of audio transcription</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-xs space-y-1">
                <div className="text-[11px] font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#A6056F]" />
                  AI Grammar & Polish
                </div>
                <div className="text-xl font-black text-[#632450] dark:text-[#ECCC6E]">1,500 Credits</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Per minute of Ge'ez spell & tone check</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-xs space-y-1">
                <div className="text-[11px] font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#256E96]" />
                  1080p Video Burner
                </div>
                <div className="text-xl font-black text-[#632450] dark:text-[#ECCC6E]">1,500 Credits</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Per minute of high-res subtitle burn</div>
              </div>
            </div>

            {/* Credit Activity & History List Table */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-[#632450] dark:text-[#ECCC6E] flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-[#0062FF]" />
                    <span>Credit Activity & Ledger List (የክሬዲት ዝርዝር)</span>
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Complete breakdown of your AI token allocations and processing usage.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#256E96]/15 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Transaction</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Credits</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#256E96]/10 dark:divide-white/5">
                    {creditLedger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Coins className="w-8 h-8 opacity-40 text-neutral-400" />
                            <p className="font-bold text-xs">No credit transactions yet</p>
                            <p className="text-[11px] max-w-sm">Credits are allocated as soon as your selected pricing package is approved by admin.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      creditLedger.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-neutral-900 dark:text-white text-xs">{item.title}</div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{item.description}</div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                            <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold border border-[#256E96]/15 dark:border-white/10">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {item.type === 'IN' ? (
                              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +{item.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[#A6056F] dark:text-[#ECCC6E] flex items-center gap-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                -{item.amount.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 font-mono">
                            {item.date}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#0062FF]/10 dark:bg-blue-500/20 text-[#0062FF] dark:text-blue-300 border border-[#0062FF]/25 dark:border-blue-500/40">
                              ✓ {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PLANS, TOP-UP & BILLING
        ========================================================================== */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            {/* Active Subscription Overview Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0062FF]/10 dark:bg-blue-500/20 text-[#0062FF] dark:text-blue-300 border border-[#0062FF]/20">
                    Active Creator Membership
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">30-Day Auto Renew</span>
                </div>
                <h3 className="text-2xl font-black text-[#632450] dark:text-white flex items-center gap-2">
                  <span>Bgern Creator Plan</span>
                  <span className="text-[#0062FF] dark:text-[#ECCC6E]">• {currentUser.minutes_balance || 0} Minutes Remaining</span>
                </h3>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1080p 60fps Full HD Export
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 11 Custom Amharic Fonts
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> TikTok & Reels Safe Area Presets
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zero Watermark
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={openBilling}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0062FF]/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 fill-white" />
                Add More Minutes (ETB)
              </button>
            </div>

            {/* Interactive In-Page Purchase */}
            <div id="billing-section" className="p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-6 shadow-sm">
              <div>
                <h4 className="text-base font-black text-[#632450] dark:text-[#ECCC6E] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0062FF]" />
                  <span>Purchase Minutes via Telebirr / CBE / Awash Bank</span>
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  የተመረጠውን ፓኬጅ በቴሌብር ወይም በባንክ ይክፈሉ፤ ደረሰኙ ከተረጋገጠ በኋላ ደቂቃዎ ይጨመራሉ።
                </p>
              </div>

              {/* Package Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PACKAGES.map((pkg: PricingPlan) => {
                  const isSelected = selectedPlan.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        if (selectedPlan.id !== pkg.id) clearReceipt();
                        setSelectedPlan(pkg);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#0062FF]/10 border-2 border-[#0062FF] text-neutral-900 dark:text-white ring-1 ring-[#0062FF]/30 shadow-md'
                          : 'bg-[#F3F5F6]/60 dark:bg-[#0B0F17]/60 border-[#256E96]/20 dark:border-[#256E96]/35 text-neutral-600 dark:text-neutral-400 hover:border-[#0062FF]/40'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -right-8 top-3 rotate-45 bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white text-[9px] font-black uppercase px-8 py-0.5 shadow-sm">
                          Popular
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-neutral-900 dark:text-white">{pkg.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0062FF]/10 text-[#0062FF] dark:bg-blue-500/20 dark:text-blue-300">
                            {pkg.tag}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-[#632450] dark:text-white mt-2">
                          {pkg.priceEtb}{' '}
                          <span className="text-xs font-bold text-neutral-500 font-sans">ETB</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#256E96]/15 dark:border-white/5 text-xs space-y-1">
                        <div className="font-bold text-[#0062FF]">+{pkg.minutes} Video Minutes</div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">+{pkg.credits.toLocaleString()} AI Credits</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Direct Payment Panel (Telebirr / Bank Accounts + Screenshot Upload) */}
              <div className="p-5 rounded-2xl bg-[#F3F5F6]/60 dark:bg-[#0B0F17]/50 border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-4">
                <div className="text-xs font-extrabold uppercase text-neutral-700 dark:text-neutral-300 tracking-wider flex items-center justify-between">
                  <span>Official Transfer Accounts (የባንክ እና የቴሌብር ቁጥሮች):</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">100% Secure & Verified</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentAccounts.map((acc: PaymentAccount) => (
                    <div
                      key={acc.name}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 flex items-center justify-between gap-3 text-xs hover:border-[#0062FF]/40 transition-all shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold">{acc.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0062FF]/10 text-[#0062FF] dark:bg-white/10 dark:text-neutral-300 font-bold">
                            {acc.badge}
                          </span>
                        </div>
                        <div className="font-mono text-[#0062FF] dark:text-[#ECCC6E] font-bold text-sm tracking-wider select-all">
                          {acc.account}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          ስም (Name): <span className="font-bold text-neutral-800 dark:text-neutral-200">{acc.holder}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyAccount(acc.account)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                      >
                        {copiedAccount === acc.account ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-white" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Screenshot Upload Form */}
                <form onSubmit={handleTopUpSubmit} className="pt-4 border-t border-[#256E96]/15 dark:border-white/5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#0062FF]" />
                        <span>የክፍያ ደረሰኝ ፎቶ / ስክሪንሾት (Payment Receipt Screenshot):</span>
                      </label>
                      <span className="text-[10px] font-bold text-[#0062FF]">አስገዳጅ (Required)</span>
                    </div>

                    <input
                      ref={receiptFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />

                    {screenshotPreview ? (
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#131924] border border-[#0062FF]/40 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <Image
                            src={screenshotPreview}
                            alt="Receipt Slip"
                            width={56}
                            height={56}
                            unoptimized
                            className="w-14 h-14 object-cover rounded-xl border border-[#256E96]/30 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate text-neutral-900 dark:text-white">
                              {screenshotFile?.name || 'receipt_screenshot.png'}
                            </div>
                            <div className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${
                              receiptUploadError
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {isUploadingScreenshot
                                  ? 'ፎቶው እየተጫነ ነው...'
                                  : uploadedUrl
                                    ? 'ደረሰኝ ተጫኗል (Receipt Uploaded)'
                                    : 'ደረሰኝ ተመርጧል (Receipt Selected)'}
                              </span>
                            </div>
                            {receiptUploadError && (
                              <>
                                <p role="alert" className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                                  {receiptUploadError}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => screenshotFile && void uploadReceipt(screenshotFile)}
                                  disabled={isUploadingScreenshot}
                                  className="mt-1 text-[11px] font-bold text-[#0062FF] hover:underline disabled:opacity-50"
                                >
                                  Retry upload
                                </button>
                              </>
                            )}
                            {receiptUploadError && !screenshotPreview && (
                              <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                                {receiptUploadError}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearReceipt}
                          className="p-2 text-neutral-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remove screenshot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => receiptFileRef.current?.click()}
                        className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-[#0062FF]/40 hover:border-[#0062FF] bg-[#0062FF]/5 hover:bg-[#0062FF]/10 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0062FF]/15 group-hover:scale-110 flex items-center justify-center transition-transform">
                          <UploadCloud className="w-5 h-5 text-[#0062FF]" />
                        </div>
                        <div className="text-center">
                          <span className="font-bold text-[#0062FF]">የቴሌብር ስክሪንሾት እዚህ ይጫኑ</span>
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Tap to upload receipt photo from your device/photos
                          </span>
                        </div>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment || isUploadingScreenshot || (!screenshotFile && !uploadedUrl)}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0062FF]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {submittingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>እየተላከ ነው (Submitting)...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ክፍያውን ላክ • Submit Payment ({selectedPlan.priceEtb || selectedPlan.price} ETB)</span>
                      </>
                    )}
                  </button>

                  {paymentSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{paymentSuccessMsg}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Payment Transaction History Table */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-4 shadow-sm">
              <h4 className="text-base font-black text-[#632450] dark:text-[#ECCC6E] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0062FF]" />
                <span>Transaction History (የክፍያ ታሪክ)</span>
              </h4>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#256E96]/15 dark:border-white/10 text-neutral-600 dark:text-neutral-400 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Minutes Credited</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#256E96]/10 dark:divide-white/5">
                      {payments.map((p) => {
                        const isApproved = p.status === 'approved';
                        return (
                          <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 font-mono">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                              {p.planName} Plan
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[#0062FF] dark:text-[#ECCC6E] font-bold">
                              {p.transactionRef}
                            </td>
                            <td className="py-3.5 px-4 text-neutral-900 dark:text-white font-bold">
                              {p.amountEtb} ETB
                            </td>
                            <td className="py-3.5 px-4 text-emerald-700 dark:text-emerald-400 font-bold">
                              +{p.minutesCredited} Min
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                  isApproved
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-[#0062FF]/10 text-[#0062FF] dark:bg-blue-500/20 dark:text-blue-300 border border-[#0062FF]/30'
                                }`}
                              >
                                {isApproved ? '✓ Approved' : '⏳ Checking'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
