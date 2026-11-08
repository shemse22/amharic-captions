'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, CheckCircle2, Clock, Coins, X } from 'lucide-react';

interface ApprovalNotif {
  id: number;
  title: string;
  message: string;
  data?: {
    paymentId?: number;
    amountEtb?: number;
    planName?: string;
    minutesCredited?: number;
    creditsCredited?: number;
    transactionRef?: string;
  };
}

export default function PaymentApprovalModal({
  currentUser,
}: {
  currentUser?: { id?: number; email?: string } | null;
}) {
  const currentUserId = currentUser?.id;
  const currentUserEmail = currentUser?.email;
  const [approvalNotif, setApprovalNotif] = useState<ApprovalNotif | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissError, setDismissError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const pollRequestIdRef = useRef(0);
  const dismissedNotificationIdsRef = useRef(new Set<number>());

  const checkApprovedPayment = useCallback(async () => {
    if ((!currentUserId && !currentUserEmail) || isSubmittingRef.current) return;
    const requestId = ++pollRequestIdRef.current;
    try {
      const q = new URLSearchParams();
      if (currentUserId) q.set('userId', String(currentUserId));
      if (currentUserEmail) q.set('userEmail', currentUserEmail);
      q.set('unreadOnly', 'true');
      q.set('limit', '10');

      const res = await fetch(`/api/notifications?${q.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (requestId !== pollRequestIdRef.current || isSubmittingRef.current) return;
      if (data.success && Array.isArray(data.notifications)) {
        const approved = data.notifications.find(
          (n: ApprovalNotif & { type: string; isRead: boolean }) =>
            n.type === 'PAYMENT_APPROVED' &&
            !n.isRead &&
            !dismissedNotificationIdsRef.current.has(n.id)
        );
        if (approved) {
          setApprovalNotif(approved);
        } else {
          setApprovalNotif(null);
        }
      }
    } catch (error) {
      console.error('Failed to check for approved payments:', error);
    }
  }, [currentUserId, currentUserEmail]);

  useEffect(() => {
    checkApprovedPayment();
    const interval = setInterval(checkApprovedPayment, 20000);

    const onAuthChange = () => checkApprovedPayment();
    window.addEventListener('bgern_auth_change', onAuthChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bgern_auth_change', onAuthChange);
    };
  }, [checkApprovedPayment]);

  const handleDismiss = async () => {
    if (!approvalNotif || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setDismissError(null);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: approvalNotif.id,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not dismiss this notification. Please try again.');
      }

      dismissedNotificationIdsRef.current.add(approvalNotif.id);
      pollRequestIdRef.current += 1;
      setApprovalNotif(null);
      // Notify entire app to update minutes, credits, and profile
      window.dispatchEvent(new Event('bgern_auth_change'));
      window.dispatchEvent(new Event('bgern_notif_refresh'));
    } catch (error) {
      setDismissError(
        error instanceof Error
          ? error.message
          : 'Could not dismiss this notification. Please try again.'
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!approvalNotif) return null;

  const data = approvalNotif.data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#131924] rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 text-center overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow background accent */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#0062FF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close icon button */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 transition-all cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Celebratory Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ክፍያዎ ጸድቋል (Payment Approved)</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-1">
          እንኳን ደስ አለዎት! 🎉
        </h3>

        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-2 font-geez leading-relaxed">
          {approvalNotif.message ||
            'የላኩት የክፍያ ደረሰኝ በአስተዳዳሪው ተረጋግጦ ደቂቃዎ በተሳካ ሁኔታ ወደ አካውንትዎ ገብቷል!'}
        </p>

        {/* Reward Stats Card */}
        <div className="grid grid-cols-2 gap-3 mt-5 p-3.5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0E141F] border border-[#256E96]/20 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ECCC6E]/20 text-[#ECCC6E] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">የተጨመረ ደቂቃ</span>
              <span className="text-sm font-black text-[#632450] dark:text-[#ECCC6E]">
                +{data.minutesCredited || 14} Min
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0062FF]/20 text-[#0062FF] flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">የተጨመረ ክሬዲት</span>
              <span className="text-sm font-black text-[#0062FF]">
                +{(data.creditsCredited || (data.minutesCredited || 14) * 3000).toLocaleString()} Cr
              </span>
            </div>
          </div>
        </div>

        {data.transactionRef && (
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-3 font-mono">
            Ref: {data.transactionRef}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isSubmitting}
          className="w-full mt-5 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSubmitting ? 'እያረጋገጠ ነው...' : 'ደቂቃዎችን ተቀበል / እሺ (Accept & Continue)'}</span>
        </button>

        {dismissError && (
          <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
            {dismissError}
          </p>
        )}
      </div>
    </div>
  );
}
