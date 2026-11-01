'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Hash,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  MessageSquare,
  Share2,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface CaptionPackage {
  id: number;
  hook: string;
  caption: string;
  hashtags: string[];
  fullCaption: string;
  charCount: number;
  seoScore: number;
  tip: string;
}

const VIBES = [
  { value: 'any', label: 'Any tone', labelAm: 'ማንኛውም ቃና' },
  { value: 'playful', label: 'Playful', labelAm: 'አዝናኝ' },
  { value: 'trendy', label: 'Trendy', labelAm: 'ትሬንዲ' },
  { value: 'educational', label: 'Educational', labelAm: 'ትምህርታዊ' },
  { value: 'funny', label: 'Funny', labelAm: 'አስቂኝ' },
  { value: 'motivational', label: 'Motivational', labelAm: 'አነቃቂ' },
  { value: 'dramatic', label: 'Dramatic', labelAm: 'ስሜታዊ' },
];

const LANGUAGES = [
  { value: 'amharic', label: 'አማርኛ', shortLabel: 'አማርኛ', flag: '🇪🇹' },
  { value: 'english', label: 'English', shortLabel: 'English', flag: '🌍' },
];

export default function TikTokGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [vibe, setVibe] = useState('any');
  const [keywords, setKeywords] = useState('');
  const [language, setLanguage] = useState('amharic');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<CaptionPackage[]>([]);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [vibeOpen, setVibeOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setPackages([]);

    try {
      const res = await fetch('/api/tools/tiktok-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, vibe, keywords, language, count }),
      });
      const data = await res.json();
      if (data.success && data.packages) {
        setPackages(data.packages);
        setSource(data.source || '');
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError(data.error || 'Generation failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTopic('');
    setVibe('any');
    setKeywords('');
    setLanguage('amharic');
    setCount(3);
    setPackages([]);
    setError('');
    setSource('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const selectedVibe = VIBES.find((v) => v.value === vibe) || VIBES[0];

  const seoScoreColor = (score: number) =>
    score >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
    score >= 70 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  const seoBarColor = (score: number) =>
    score >= 85 ? 'from-emerald-500 to-green-400' :
    score >= 70 ? 'from-amber-500 to-yellow-400' :
    'from-rose-500 to-red-400';

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col justify-between selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className={`flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col justify-center ${packages.length > 0 ? 'py-8 space-y-8' : 'py-3 sm:py-5 space-y-3 sm:space-y-4'}`}>

        {/* ── Compact Hero Header ─────────────────────────────────────────── */}
        <div className="text-center space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF0050]/10 dark:bg-[#FF0050]/20 border border-[#FF0050]/30 text-[#FF0050] text-[11px] font-black uppercase tracking-wider">
            <Hash className="w-3 h-3" />
            <span>Free TikTok Creator Tool</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#632450] dark:text-white">
            TikTok Viral Hashtags &amp; Title Generator
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto line-clamp-1 sm:line-clamp-none">
            ቪዲዮዎ ትሬንድ ላይ እንዲወጣ — viral captions, 3-second hooks, and hashtags for Ethiopian creators.
          </p>
        </div>

        {/* ── Compact Generator Form Card ────────────────────────────────── */}
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-[#256E96]/10 dark:border-white/5 pb-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF0050]" />
                Generate TikTok Captions
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                Describe your video in a sentence to craft viral hooks &amp; tags.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Ready
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3">
            {/* Topic Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                  What&apos;s your TikTok about? <span className="text-[#FF0050]">*</span>
                </label>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                  Hook lives in first 3s
                </span>
              </div>
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., ስለ አዲስ አበባ ምርጥ ሬስቶራንቶች — or top 5 budget productivity tips for students"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#0062FF] focus:ring-2 focus:ring-[#0062FF]/20 transition resize-none leading-relaxed"
              />
            </div>

            {/* 3-Column Compact Grid: Language, Vibe, Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Language Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-neutral-800 dark:text-neutral-200">
                  Language (ቋንቋ)
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#F3F5F6] dark:bg-[#0B0F17] p-1 rounded-xl border border-[#256E96]/20 dark:border-[#256E96]/35 h-[38px] items-center">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setLanguage(lang.value)}
                      className={`h-full rounded-lg text-[10px] sm:text-[11px] font-bold text-center transition-all truncate flex items-center justify-center gap-1 ${
                        language === lang.value
                          ? 'bg-[#0062FF] text-white shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title={lang.label}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibe Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-neutral-800 dark:text-neutral-200">
                  Vibe (ቃና)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setVibeOpen(!vibeOpen)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs font-semibold text-neutral-800 dark:text-white focus:outline-none focus:border-[#0062FF] transition h-[38px]"
                  >
                    <span className="truncate">
                      {selectedVibe.label} <span className="text-neutral-400 font-normal">({selectedVibe.labelAm})</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 shrink-0 transition-transform ${vibeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {vibeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {VIBES.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => { setVibe(v.value); setVibeOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between ${
                            vibe === v.value
                              ? 'bg-[#0062FF] text-white'
                              : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span>{v.label}</span>
                          <span className={`text-[11px] ${vibe === v.value ? 'text-white/80' : 'text-neutral-400'}`}>
                            {v.labelAm}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Keywords Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-neutral-800 dark:text-neutral-200">
                  Keywords (ቃላት)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="ምግብ, Ethiopian food..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#0062FF] transition h-[38px]"
                />
              </div>
            </div>

            {/* Bottom Actions Row: Variations Count + Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#256E96]/10 dark:border-white/5">
              {/* Variations selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Variations:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                        count === n
                          ? 'bg-[#0062FF] text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF0050] to-[#FF4500] hover:from-[#e0004a] hover:to-[#e03d00] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF0050]/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>Generate TikTok Captions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        </div>

        {/* ── Generated Results ────────────────────────────────────── */}
        {packages.length > 0 && (
          <div ref={resultsRef} className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#632450] dark:text-white">
                  Your Caption Packages 🎯
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {packages.length} variation{packages.length > 1 ? 's' : ''} generated
                  {source === 'hasab' ? ' via Hasab AI' : source === 'gemini' ? ' via Gemini AI' : ' (offline templates)'}
                </p>
              </div>

              <Link
                href="/studio"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white font-black text-xs shadow-lg shadow-[#0062FF]/20 hover:from-[#0052d9] hover:to-[#8d045e] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Open Studio</span>
              </Link>
            </div>

            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#256E96]/10 dark:border-white/5 bg-neutral-50/60 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF0050] to-[#FF4500] text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#FF0050]/25">
                      {pkg.id}
                    </div>
                    <span className="text-sm font-black text-neutral-900 dark:text-white">
                      Caption Package #{pkg.id}
                    </span>
                  </div>

                  {/* SEO Score */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block w-24 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${seoBarColor(pkg.seoScore)} rounded-full transition-all duration-700`}
                        style={{ width: `${pkg.seoScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-black ${seoScoreColor(pkg.seoScore)}`}>
                      {pkg.seoScore}% SEO
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Hook */}
                  <div className="p-4 rounded-2xl bg-[#FF0050]/5 dark:bg-[#FF0050]/10 border border-[#FF0050]/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#FF0050] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        3-Second Hook (ሁክ)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(pkg.hook, `hook-${pkg.id}`)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#FF0050] hover:opacity-80 transition-opacity"
                      >
                        {copiedId === `hook-${pkg.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `hook-${pkg.id}` ? 'Copied!' : 'Copy Hook'}
                      </button>
                    </div>
                    <p className="text-base font-extrabold text-neutral-900 dark:text-white leading-snug">
                      {pkg.hook}
                    </p>
                  </div>

                  {/* Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#0062FF] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Caption Text (ሌጀንድ)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(pkg.caption, `caption-${pkg.id}`)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#0062FF] hover:opacity-80 transition-opacity"
                      >
                        {copiedId === `caption-${pkg.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `caption-${pkg.id}` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-[#256E96]/10">
                      {pkg.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#632450] dark:text-[#ECCC6E] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Viral Hashtags ({pkg.hashtags.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(pkg.hashtags.join(' '), `hashtags-${pkg.id}`)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#632450] dark:text-[#ECCC6E] hover:opacity-80 transition-opacity"
                      >
                        {copiedId === `hashtags-${pkg.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `hashtags-${pkg.id}` ? 'Copied!' : 'Copy Hashtags'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.hashtags.map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCopy(tag, `tag-${pkg.id}-${idx}`)}
                          title="Click to copy"
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            copiedId === `tag-${pkg.id}-${idx}`
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-[#0062FF]/10 dark:bg-[#0062FF]/20 text-[#0062FF] border border-[#0062FF]/20 hover:bg-[#0062FF]/20 dark:hover:bg-[#0062FF]/30'
                          }`}
                        >
                          {copiedId === `tag-${pkg.id}-${idx}` ? '✓ ' : ''}{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tip */}
                  {pkg.tip && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                      <span className="text-amber-500 text-base shrink-0">💡</span>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
                        {pkg.tip}
                      </p>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="pt-4 border-t border-[#256E96]/10 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="font-mono">{pkg.charCount} chars</span>
                      <span>•</span>
                      <span>{pkg.charCount <= 2200 ? '✅ Within TikTok limit' : '⚠️ May be too long'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(pkg.fullCaption, `full-${pkg.id}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        {copiedId === `full-${pkg.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                        {copiedId === `full-${pkg.id}` ? 'Copied All!' : 'Copy All'}
                      </button>

                      <Link
                        href={`/studio?hook=${encodeURIComponent(pkg.hook)}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white text-xs font-black shadow-md shadow-[#0062FF]/20 transition-all hover:from-[#0052d9] hover:to-[#8d045e]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Use in Studio</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Generate More CTA */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-black text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Generate More Variations
              </button>
            </div>

            {/* Bottom Promo Banner (only after generation) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#632450] via-[#0062FF] to-[#A6056F] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bgern Studio
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Now burn your subtitles into the video itself — in seconds
                </h3>
                <p className="text-xs text-white/90">
                  Upload your video, use your AI-generated hook as the on-screen caption, and export a fully captioned 1080p video ready for TikTok.
                </p>
              </div>
              <Link
                href="/studio"
                className="shrink-0 px-6 py-3 rounded-2xl bg-white text-[#0062FF] font-black text-xs uppercase tracking-wider hover:bg-neutral-100 shadow-xl transition-all text-center w-full md:w-auto flex items-center justify-center gap-2"
              >
                <span>Open Bgern Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {packages.length > 0 ? (
        <Footer />
      ) : (
        <footer className="w-full py-2.5 px-4 border-t border-[#256E96]/10 dark:border-white/5 text-center text-xs text-neutral-500 dark:text-neutral-400">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Bgern Studio • Free TikTok Viral Generator</span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link href="/studio" className="hover:text-[#0062FF] transition-colors">Studio</Link>
              <Link href="/blog" className="hover:text-[#0062FF] transition-colors">Blog</Link>
              <Link href="/pricing" className="hover:text-[#0062FF] transition-colors">Pricing</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
