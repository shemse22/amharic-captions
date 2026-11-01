'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Check,
  Tag,
  BookOpen,
  Sparkles,
  ArrowRight,
  Send,
  Copy,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { BlogPostRecord } from '@/lib/db';

interface BlogPostClientProps {
  post: BlogPostRecord | null;
  related: BlogPostRecord[];
}

export default function BlogPostClient({ post, related }: BlogPostClientProps) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex items-center justify-center">
          <div className="text-center py-16 px-8 max-w-lg rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-lg space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0062FF]/10 text-[#0062FF] flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#632450] dark:text-white">Article Not Found</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              The article you are looking for may have been removed, renamed, or is currently drafted.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse All Articles</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(currentUrl || `https://bgern.com/blog/${post.slug}`);
  const encodedTitle = encodeURIComponent(post.title);

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Navigation & Share Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-[#0062FF] dark:hover:text-[#ECCC6E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-[#0062FF] hover:border-[#0062FF]/50 shadow-xs transition-colors"
              title="Copy Article Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/25 text-xs font-bold transition-colors"
              title="Share on Telegram"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Telegram</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/25 text-xs font-bold transition-colors"
              title="Share on WhatsApp"
            >
              <span className="text-xs font-black">WA</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/10 dark:bg-white/10 hover:bg-neutral-900/20 text-neutral-800 dark:text-white border border-neutral-300 dark:border-neutral-700 text-xs font-bold transition-colors"
              title="Share on X (Twitter)"
            >
              <span className="font-black text-xs">𝕏</span>
              <span className="hidden sm:inline">Post</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/25 text-xs font-bold transition-colors"
              title="Share on Facebook"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
          </div>
        </div>

        <article lang="en" className="space-y-8">
          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#0062FF] text-white text-xs font-black uppercase tracking-wider">
                {post.category}
              </span>
              <time
                dateTime={post.publishedAt || post.createdAt}
                className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
              <span>•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTimeMinutes || 3} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#632450] dark:text-white tracking-tight leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed italic border-l-4 border-[#0062FF] pl-4 py-1">
                {post.excerpt}
              </p>
            )}

            {/* Author Row */}
            <div className="flex items-center justify-between pt-4 border-t border-[#256E96]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0062FF]/15 text-[#0062FF] font-black text-sm flex items-center justify-center border border-[#0062FF]/30">
                  {(post.authorName || 'B')[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">
                    {post.authorName || 'Bgern AI Lab'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Bgern Content Team
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(post.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#131924] border border-[#256E96]/20 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400"
                  >
                    <Tag className="w-3 h-3 text-[#0062FF]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Image: 16:9 YouTube Thumbnail ratio */}
          {post.coverImage && (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl border border-[#256E96]/20 bg-neutral-900">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Content Body via MarkdownRenderer */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm">
            <MarkdownRenderer content={post.content} />

            {/* Mobile Tags list */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-[#256E96]/15 dark:border-white/10 flex items-center gap-2 flex-wrap sm:hidden">
                <span className="text-xs font-bold text-neutral-500">Tags:</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom CTA to Studio */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase">
                <Sparkles className="w-3 h-3" />
                Try It Yourself
              </div>
              <h3 className="text-xl font-black">Generate captions for your next video in minutes</h3>
              <p className="text-xs text-white/90">
                Join hundreds of Ethiopian creators who use Bgern to automatically caption their videos.
              </p>
            </div>

            <Link
              href="/studio"
              className="shrink-0 px-6 py-3 rounded-2xl bg-white text-[#0062FF] font-black text-xs uppercase tracking-wider hover:bg-neutral-100 shadow-md active:scale-95 transition-all text-center w-full sm:w-auto"
            >
              Open Studio
            </Link>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <div className="space-y-4 pt-6">
              <h3 className="text-xl font-black text-[#632450] dark:text-white">
                Related Articles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/40 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden"
                  >
                    {rel.coverImage && (
                      <div className="w-full aspect-video overflow-hidden bg-neutral-900 relative">
                        <img
                          src={rel.coverImage}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#0062FF]/90 backdrop-blur-xs text-white text-[9px] font-black uppercase">
                            {rel.category}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        {!rel.coverImage && (
                          <span className="text-[10px] font-black uppercase text-[#0062FF]">
                            {rel.category}
                          </span>
                        )}
                        <h4 className="text-xs font-black text-neutral-900 dark:text-white group-hover:text-[#0062FF] dark:group-hover:text-[#ECCC6E] transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 line-clamp-2">
                          {rel.excerpt}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#256E96]/10 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{rel.readTimeMinutes || 3} min read</span>
                        <span className="flex items-center gap-1 text-[#0062FF] font-bold">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
