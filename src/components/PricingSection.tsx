'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Check,
  Clock,
  Coins,
  X,
  Copy,
  CheckCircle2,
  Smartphone,
  Zap,
  RefreshCw,
  UploadCloud,
  ImageIcon,
} from 'lucide-react';
import {
  PRICING_PLANS,
  OFFICIAL_PAYMENT_ACCOUNTS,
  PricingPlan,
  PaymentAccount,
  PlanId,
} from '@/lib/pricing-plans';
import { isSupportedReceiptFile } from '@/lib/payment-receipt';

const UPGRADE_FEATURES: Partial<Record<PlanId, string>> = {
  PLUS: 'Priority processing and karaoke caption support.',
  PRO: 'Advanced export support for consistent publishing.',
  MAX: 'Priority support for high-volume production.',
};

const getRequiredPlan = (id: PlanId): PricingPlan => {
  const plan = PRICING_PLANS.find((item) => item.id === id);
  if (!plan) throw new Error(`Pricing plan ${id} is missing.`);
  return plan;
};

const getSavingsPercent = (basePlan: PricingPlan, comparedPlan: PricingPlan) => {
  const baseRate = basePlan.priceEtb / basePlan.minutes;
  const comparedRate = comparedPlan.priceEtb / comparedPlan.minutes;
  return (((baseRate - comparedRate) / baseRate) * 100).toFixed(1);
};

interface PricingSectionProps {
  currentUser: { id: number; email: string; name: string } | null;
  onRequireLogin: () => void;
}

export default function PricingSection({ currentUser, onRequireLogin }: PricingSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(OFFICIAL_PAYMENT_ACCOUNTS);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const receiptFileRef = useRef<HTMLInputElement | null>(null);
  const uploadRequestIdRef = useRef(0);

  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screenshotUploadError, setScreenshotUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!screenshotPreview) return;
    return () => URL.revokeObjectURL(screenshotPreview);
  }, [screenshotPreview]);

  useEffect(() => () => {
    uploadRequestIdRef.current += 1;
  }, []);

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

  const handleSelectPlan = (plan: PricingPlan) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    uploadRequestIdRef.current += 1;
    setSelectedPlan(plan);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setUploadedUrl(null);
    setIsUploadingScreenshot(false);
    setScreenshotUploadError(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    if (receiptFileRef.current) receiptFileRef.current.value = '';
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const requestId = ++uploadRequestIdRef.current;
    setIsUploadingScreenshot(true);
    setScreenshotUploadError(null);
    setErrorMessage(null);

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
        throw new Error(data.error || 'Failed to upload screenshot');
      }
      if (requestId === uploadRequestIdRef.current) {
        setUploadedUrl(data.url);
        return data.url;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload screenshot';
      if (requestId === uploadRequestIdRef.current) {
        setScreenshotUploadError(message);
        setErrorMessage(message);
      }
      return null;
    } finally {
      if (requestId === uploadRequestIdRef.current) {
        setIsUploadingScreenshot(false);
      }
    }
  };

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isSupportedReceiptFile(file)) {
      clearReceipt();
      const message = 'Choose a JPEG, PNG, or WebP receipt image no larger than 10 MB.';
      setScreenshotUploadError(message);
      setErrorMessage(message);
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setUploadedUrl(null);
    await uploadReceipt(file);
  };

  const clearReceipt = () => {
    uploadRequestIdRef.current += 1;
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setUploadedUrl(null);
    setIsUploadingScreenshot(false);
    setScreenshotUploadError(null);
    setErrorMessage(null);
    if (receiptFileRef.current) receiptFileRef.current.value = '';
  };

  const closePaymentModal = () => {
    clearReceipt();
    setSelectedPlan(null);
    setErrorMessage(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Direct Manual Transfer (Telebirr / CBE Transfer with Receipt Screenshot Only)
  const handleDirectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !currentUser) return;

    if (!screenshotFile && !uploadedUrl) {
      setErrorMessage('እባክዎ የክፍያዎን ስክሪንሾት ወይም ደረሰኝ ያያይዙ (Please attach payment receipt screenshot)');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let finalScreenshotUrl = uploadedUrl;

      // If file chosen but background upload hadn't finished
      if (!finalScreenshotUrl && screenshotFile) {
        const receiptUrl = await uploadReceipt(screenshotFile);
        if (!receiptUrl) throw new Error('Failed to upload screenshot. Please retry.');
        finalScreenshotUrl = receiptUrl;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.id,
          screenshotPath: finalScreenshotUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setSuccessMessage(
        data.message || 'ደረሰኝዎ በተሳካ ሁኔታ ተልኳል! በቅርቡ ተረጋግጦ ደቂቃዎ ይጨመራል። (Your receipt screenshot has been received and will be verified promptly!)'
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bgern_notif_refresh'));
        window.dispatchEvent(new Event('bgern_auth_change'));
      }
      setTimeout(() => {
        clearReceipt();
        setSelectedPlan(null);
        setSuccessMessage(null);
      }, 3500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Payment submission failed');
    } finally {
      setIsSubmitting(false);
      setIsUploadingScreenshot(false);
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 max-w-7xl mx-auto">
      {/* Title & Ethiopian Local Payment Banner */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/25 text-[#0062FF] dark:text-[#60a5fa] text-xs font-bold uppercase tracking-wider">
          <Smartphone className="w-3.5 h-3.5 text-[#0062FF] dark:text-[#60a5fa]" />
          <span>Telebirr & CBE Birr Direct Payment</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
          Pricing Plans
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
          Affordable local payment options designed for TikTok, Reels, YouTube, and Ethiopian video creators.
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Pro costs {getSavingsPercent(getRequiredPlan('LITE'), getRequiredPlan('PRO'))}% less per minute than
          {' '}Lite; Agency costs {getSavingsPercent(getRequiredPlan('PRO'), getRequiredPlan('MAX'))}% less
          {' '}than Pro.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {PRICING_PLANS.map((plan) => {
          const isPopular = plan.popular;
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border bg-white dark:bg-[#131924] ${
                isPopular
                  ? 'border-2 border-[#A6056F] shadow-xl shadow-[#A6056F]/10 scale-[1.02] ring-2 ring-[#A6056F]/15'
                  : 'border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/40 shadow-xs hover:shadow-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#A6056F] text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-[#A6056F]/20">
                  Most Popular
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#632450] dark:text-white">{plan.name}</h3>
                    <p className={`text-xs font-bold ${isPopular ? 'text-[#A6056F] dark:text-pink-400' : 'text-[#0062FF] dark:text-[#60a5fa]'}`}>{plan.tag}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 text-[#256E96] dark:text-neutral-300">
                    {plan.tagAmharic}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                    {plan.priceEtb}
                  </span>
                  <span className="text-sm font-bold text-neutral-500 font-mono">ETB</span>
                </div>
                <p className="mb-4 -mt-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {(plan.priceEtb / plan.minutes).toFixed(2)} ETB per video minute
                </p>

                <p className="mb-5 text-sm text-neutral-600 dark:text-neutral-300 min-h-[48px]">
                  {plan.description}
                </p>

                {/* Minutes & Credits Highlights */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/15 dark:border-[#256E96]/30 mb-6">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Clock className="w-4 h-4 text-[#ECCC6E] fill-[#ECCC6E] shrink-0" />
                    <span className="font-bold text-[#632450] dark:text-[#ECCC6E]">
                      {plan.minutes} minutes total video duration
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <Coins className="w-4 h-4 text-[#0062FF] fill-[#0062FF] shrink-0" />
                    <span className="text-[#0062FF] dark:text-[#60a5fa] font-bold font-mono">
                      {plan.credits.toLocaleString()} AI credits
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                      <Check className="w-3.5 h-3.5 text-[#0062FF] dark:text-[#60a5fa] mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                  isPopular
                    ? 'bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white shadow-[#0062FF]/20 active:scale-[0.98]'
                    : 'bg-[#0062FF] hover:bg-[#0052d9] text-white active:scale-[0.98]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{plan.buttonLabel}</span>
              </button>
            </div>
          );
        })}
      </div>

      <section
        aria-labelledby="plan-upgrades-heading"
        className="mt-12 rounded-3xl border border-[#A6056F]/20 bg-[#A6056F]/5 p-5 sm:p-7 dark:bg-[#A6056F]/10"
      >
        <div className="mb-5">
          <h3 id="plan-upgrades-heading" className="text-xl font-black text-[#632450] dark:text-white">
            Compare your upgrade options
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Pay more only when the extra minutes and features fit your workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRICING_PLANS.slice(1).map((plan, index) => {
            const previousPlan = PRICING_PLANS[index];
            return (
              <div
                key={`${previousPlan.id}-${plan.id}`}
                className="rounded-2xl border border-[#256E96]/15 bg-white p-4 dark:border-[#256E96]/30 dark:bg-[#131924]"
              >
                <p className="text-sm font-black text-[#632450] dark:text-[#ECCC6E]">
                  {previousPlan.name} <span aria-hidden="true">→</span> {plan.name}
                </p>
                <p className="mt-2 text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  +{plan.priceEtb - previousPlan.priceEtb} ETB for{' '}
                  {plan.minutes - previousPlan.minutes} extra minutes
                </p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                  +{(plan.credits - previousPlan.credits).toLocaleString()} AI credits
                </p>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
                  {UPGRADE_FEATURES[plan.id] ?? 'Additional capacity for your video projects.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="payment-details-heading"
        className="mt-8 rounded-3xl border border-[#256E96]/20 bg-white p-5 sm:p-7 dark:border-[#256E96]/35 dark:bg-[#131924]"
      >
        <div className="mb-5">
          <h3 id="payment-details-heading" className="text-xl font-black text-[#632450] dark:text-white">
            Clear local payment steps
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            The plan price shown above is the amount to send in ETB.
          </p>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <li className="rounded-2xl bg-[#F3F5F6] p-4 dark:bg-[#0B0F17]">
            <span className="font-black text-[#A6056F]">1.</span>{' '}
            Send the exact plan amount to one of the listed Telebirr or bank accounts.
          </li>
          <li className="rounded-2xl bg-[#F3F5F6] p-4 dark:bg-[#0B0F17]">
            <span className="font-black text-[#A6056F]">2.</span>{' '}
            Submit your payment receipt screenshot for verification.
          </li>
          <li className="rounded-2xl bg-[#F3F5F6] p-4 dark:bg-[#0B0F17]">
            <span className="font-black text-[#A6056F]">3.</span>{' '}
            Minutes and credits are added after the payment is verified by the Bgern team.
          </li>
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          Refunds may be requested within 15 days of purchase only while the package is completely unused.
          Once any minutes or credits have been used, the package is non-refundable. Unused balances do not
          roll over to future purchases. Contact{' '}
          <a
            href="https://t.me/bgern_supportbot"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#0062FF] underline dark:text-[#60a5fa]"
          >
            Bgern support
          </a>{' '}
          with payment or refund questions.
        </p>
      </section>

      {/* Direct Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl text-neutral-900 dark:text-[#F3F5F6] max-h-[90dvh] overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
            <button
                onClick={closePaymentModal}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/25 text-[#0062FF] dark:text-[#60a5fa] text-xs font-bold uppercase mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>{selectedPlan.name} Plan • {selectedPlan.minutes} Min</span>
              </div>
              <h3 className="text-2xl font-black text-[#632450] dark:text-[#ECCC6E]">
                Pay {selectedPlan.priceEtb} ETB (በቴሌብር ይክፈሉ)
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                ይህን መጠን ከዚህ በታች ባሉት የቴሌብር ወይም የባንክ አካውንቶች ይላኩና የደረሰኙን ስክሪንሾት ያያይዙ።
              </p>
            </div>

            {/* Official Payment Accounts */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#256E96] dark:text-[#ECCC6E] flex items-center justify-between">
                <span>ኦፊሴላዊ የክፍያ ቁጥሮች (Official Accounts):</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">100% ፈጣንና አስተማማኝ</span>
              </div>

              <div className="space-y-2.5">
                {paymentAccounts.map((acc) => (
                  <div
                    key={acc.name}
                    className="p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span>{acc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#131924] border border-[#256E96]/20 text-[#256E96] dark:text-neutral-300">
                          {acc.badge}
                        </span>
                      </div>
                      <div className="font-mono text-[#0062FF] dark:text-[#ECCC6E] font-bold text-sm tracking-wider select-all">
                        {acc.account}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">ስም (Name): {acc.holder}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.account, acc.name)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131924] hover:bg-[#0062FF] hover:text-white dark:hover:bg-[#0062FF] border border-[#256E96]/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      {copiedAccount === acc.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Direct Form: Receipt Screenshot Only */}
              <form onSubmit={handleDirectPaymentSubmit} className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#0062FF]" />
                      <span>የክፍያ ደረሰኝ ፎቶ / ስክሪንሾት (Receipt Screenshot):</span>
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
                    <div className="p-3 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#0062FF]/40 flex items-center justify-between gap-3 shadow-xs">
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
                            screenshotUploadError
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
                          {screenshotUploadError && (
                            <button
                              type="button"
                              onClick={() => screenshotFile && void uploadReceipt(screenshotFile)}
                              disabled={isUploadingScreenshot}
                              className="mt-1 text-[11px] font-bold text-[#0062FF] hover:underline disabled:opacity-50"
                            >
                              Retry upload
                            </button>
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
                          Tap to select photo from your phone or gallery
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingScreenshot || (!screenshotFile && !uploadedUrl)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#0062FF]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>እየተላከ ነው (Submitting)...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ክፍያውን ላክ • Submit Payment ({selectedPlan.priceEtb} ETB)</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error or Success Alert */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
