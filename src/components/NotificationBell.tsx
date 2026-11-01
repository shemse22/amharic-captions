'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Sparkles,
  X,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export interface NotificationItem {
  id: number;
  userId?: number;
  targetRole?: 'USER' | 'ADMIN' | 'ALL';
  type: 'PAYMENT_PENDING' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'VIDEO_PENDING' | 'CREDIT_UPDATE' | 'SYSTEM';
  title: string;
  message: string;
  data?: {
    paymentId?: number;
    amountEtb?: number;
    planName?: string;
    minutesCredited?: number;
    creditsCredited?: number;
    transactionRef?: string;
    userName?: string;
    userEmail?: string;
    videoId?: number;
    videoTitle?: string;
    reason?: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  currentUser?: any;
  isAdminPanel?: boolean;
  className?: string;
}

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'አሁን (Just now)';
    if (diff < 3600) return `ከ ${Math.floor(diff / 60)} ደቂቃ በፊት`;
    if (diff < 86400) return `ከ ${Math.floor(diff / 3600)} ሰዓት በፊት`;
    return `ከ ${Math.floor(diff / 86400)} ቀን በፊት`;
  } catch {
    return '';
  }
}

export default function NotificationBell({ currentUser, isAdminPanel = false, className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [mobilePosition, setMobilePosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const fetchNotifications = async () => {
    try {
      const q = new URLSearchParams();
      if (currentUser?.id) q.set('userId', String(currentUser.id));
      if (currentUser?.email) q.set('userEmail', currentUser.email);
      q.set('scope', isAdminPanel ? 'admin' : 'user');
      q.set('limit', '25');

      const res = await fetch(`/api/notifications?${q.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        let rawList: NotificationItem[] = data.notifications || [];
        // Strict guard: on user account views, filter out any admin-targeted notifications or token warnings
        if (!isAdminPanel) {
          rawList = rawList.filter((notif) => {
            if (notif.targetRole === 'ADMIN') return false;
            const combined = `${notif.title} ${notif.message}`.toLowerCase();
            return !(
              combined.includes('hasab') ||
              combined.includes('tokens') ||
              combined.includes('token') ||
              combined.includes('api.hasab.ai') ||
              combined.includes('ቶከን')
            );
          });
        }
        setNotifications(rawList);
        setUnreadCount(rawList.filter((n) => !n.isRead).length);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 18000);

    const onAuthChange = () => fetchNotifications();
    const onRefresh = () => fetchNotifications();

    window.addEventListener('bgern_auth_change', onAuthChange);
    window.addEventListener('bgern_notif_refresh', onRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bgern_auth_change', onAuthChange);
      window.removeEventListener('bgern_notif_refresh', onRefresh);
    };
  }, [currentUser?.id, currentUser?.email, isAdminPanel]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setMobilePosition(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateMobilePosition = () => {
      if (!window.matchMedia('(max-width: 639px)').matches || !dropdownRef.current) {
        setMobilePosition(null);
        return;
      }

      const trigger = dropdownRef.current.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 16);
      const left = Math.max(8, Math.min(trigger.right - width, window.innerWidth - width - 8));
      const panelHeight = Math.min(434, window.innerHeight - 16);
      let top = trigger.bottom + 8;
      if (top + panelHeight > window.innerHeight - 8) {
        top = Math.max(8, trigger.top - panelHeight - 8);
      }

      setMobilePosition({
        left,
        top,
        width,
        maxHeight: Math.max(160, window.innerHeight - top - 8),
      });
    };

    updateMobilePosition();
    window.addEventListener('resize', updateMobilePosition);
    window.addEventListener('scroll', updateMobilePosition, true);
    window.visualViewport?.addEventListener('resize', updateMobilePosition);
    window.visualViewport?.addEventListener('scroll', updateMobilePosition);

    return () => {
      window.removeEventListener('resize', updateMobilePosition);
      window.removeEventListener('scroll', updateMobilePosition, true);
      window.visualViewport?.removeEventListener('resize', updateMobilePosition);
      window.visualViewport?.removeEventListener('scroll', updateMobilePosition);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
        }),
      });
      window.dispatchEvent(new Event('bgern_auth_change'));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAll: true,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          scope: isAdminPanel ? 'admin' : 'user',
        }),
      });
      window.dispatchEvent(new Event('bgern_auth_change'));
    } catch {}
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'PAYMENT_PENDING':
      case 'VIDEO_PENDING':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'PAYMENT_APPROVED':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'PAYMENT_REJECTED':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-[#0062FF]/15 border border-[#0062FF]/30 text-[#0062FF] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setMobilePosition(null);
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
          unreadCount > 0
            ? 'bg-[#0062FF]/10 text-[#0062FF] border-[#0062FF]/30 dark:bg-[#0062FF]/20 dark:border-[#0062FF]/40'
            : 'bg-white dark:bg-[#131924] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-[#256E96]/25 dark:border-[#256E96]/40'
        }`}
        title={`ማሳወቂያዎች (${unreadCount} አዲስ)`}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#0B0F17] shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/25 dark:border-[#256E96]/40 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={
            mobilePosition
              ? {
                  position: 'fixed',
                  left: mobilePosition.left,
                  right: 'auto',
                  top: mobilePosition.top,
                  width: mobilePosition.width,
                  maxHeight: mobilePosition.maxHeight,
                  marginTop: 0,
                }
              : undefined
          }
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[#256E96]/15 dark:border-[#256E96]/25 flex items-center justify-between bg-neutral-50/70 dark:bg-[#0E141F]/80">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#632450] dark:text-[#ECCC6E]">
                ማሳወቂያዎች (Notifications)
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0062FF] text-white">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-[#0062FF] dark:text-[#60a5fa] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>ሁሉንም አንብብ</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#256E96]/10 dark:divide-[#256E96]/20">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 dark:text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                <p className="text-xs font-semibold">ምንም አዲስ ማሳወቂያ የለም</p>
                <p className="text-[10px] mt-0.5">No notifications at the moment</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isAdminNotif = notif.targetRole === 'ADMIN';
                const isApproved = notif.type === 'PAYMENT_APPROVED';
                const isPending = notif.type === 'PAYMENT_PENDING' || notif.type === 'VIDEO_PENDING';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors flex gap-3 items-start relative ${
                      !notif.isRead
                        ? 'bg-[#0062FF]/5 dark:bg-[#0062FF]/10'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    {renderIcon(notif.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#0062FF] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Quick Action Links */}
                          {isAdminNotif && isPending && (
                            <Link
                              href="/shems"
                              onClick={() => {
                                handleMarkAsRead(notif.id);
                                setMobilePosition(null);
                                setIsOpen(false);
                              }}
                              className="text-[10px] font-bold text-[#0062FF] hover:underline flex items-center gap-0.5"
                            >
                              <span>እይ (Review)</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}

                          {isApproved && (
                            <Link
                              href="/profile"
                              onClick={() => {
                                handleMarkAsRead(notif.id);
                                setMobilePosition(null);
                                setIsOpen(false);
                              }}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>ሂሳብ እይ (Balance)</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}

                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-semibold"
                              title="Mark read"
                            >
                              አንብቤያለሁ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
