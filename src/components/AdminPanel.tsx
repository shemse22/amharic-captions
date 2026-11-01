'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Video, CreditCard, Check, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface AdminPanelProps {
  onVideoApproved?: (videoId: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ onVideoApproved, isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'videos' | 'payments'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch('/api/videos?scope=all'),
        fetch('/api/payments'),
      ]);
      const vData = await vRes.json();
      const pData = await pRes.json();
      setVideos(vData.videos || []);
      setPayments(pData.payments || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleApproveVideo = async (videoId: number) => {
    try {
      const res = await fetch(`/api/videos/${videoId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Video #${videoId} approved! Caption generation unlocked.`);
        fetchData();
        if (onVideoApproved) onVideoApproved(videoId);
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  const handleRejectVideo = async (videoId: number) => {
    const reason = prompt('Rejection reason (optional):', 'Does not meet guidelines');
    try {
      const res = await fetch(`/api/videos/${videoId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setActionMsg(`Video #${videoId} rejected.`);
        fetchData();
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  const handleApprovePayment = async (paymentId: number) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/approve`, { method: 'POST' });
      if (res.ok) {
        setActionMsg(`Payment #${paymentId} approved! Credits applied.`);
        fetchData();
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Bgern Admin Control Center (የአድሚን መቆጣጠሪያ)
              </h2>
              <p className="text-xs text-neutral-400">
                Approve submitted user videos for caption generation and verify ETB payments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="my-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            {actionMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 my-4">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'videos'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Approval Queue ({videos.filter((v) => v.status === 'PENDING_APPROVAL').length} Pending)
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payment Verifications ({payments.filter((p) => p.status === 'pending').length} Pending)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {activeTab === 'videos' ? (
            videos.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No videos submitted yet.
              </div>
            ) : (
              videos.map((vid) => (
                <div
                  key={vid.id}
                  className="p-4 rounded-2xl bg-neutral-850 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{vid.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          vid.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : vid.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {vid.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-3">
                      <span>User: {vid.userEmail || `User #${vid.userId}`}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(vid.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {vid.status === 'PENDING_APPROVAL' ? (
                      <>
                        <button
                          onClick={() => handleApproveVideo(vid.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve (አጽድቅ)
                        </button>
                        <button
                          onClick={() => handleRejectVideo(vid.id)}
                          className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-red-600/80 text-neutral-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-neutral-400">
                        {vid.status === 'APPROVED' ? '✓ Ready for Captions' : '✗ Disapproved'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">
              No payments submitted yet.
            </div>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-neutral-850 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {p.planName} Plan — {p.amountEtb} ETB
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        p.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 flex items-center gap-3">
                    <span className="font-mono text-neutral-300">Ref: {p.transactionRef}</span>
                    <span>•</span>
                    <span>User: {p.userEmail || `User #${p.userId}`}</span>
                    <span>•</span>
                    <span>+{p.minutesCredited} Min ({p.creditsCredited?.toLocaleString()} Credits)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {p.status === 'pending' ? (
                    <button
                      onClick={() => handleApprovePayment(p.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" /> Credit Minutes (አጽድቅ)
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-400">
                      {p.status === 'approved' ? '✓ Credited' : '✗ Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

