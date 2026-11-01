'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { BlogPostRecord } from '@/lib/db';

export default function BlogFeedPage({ posts }: { posts: BlogPostRecord[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts[0];
  const remainingPosts = searchQuery || selectedCategory !== 'All' 
    ? filteredPosts 
    : filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/30 text-[#0062FF] dark:text-[#ECCC6E] text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bgern Creator Hub & Blog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#632450] dark:text-white">
            Guides, Tutorials & AI Insights for Amharic Creators
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
            Practical guides to Amharic captions, accessible video editing, creator workflows, and publishing for TikTok, YouTube, and Reels.
          </p>
        </div>

        {/* Search and Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm">
          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#0062FF] text-white shadow-md shadow-[#0062FF]/25'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search articles or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#0062FF]"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 p-8 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 space-y-3">
            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto" />
            <h3 className="text-base font-black text-neutral-800 dark:text-neutral-200">No articles found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery
                ? `We couldn't find any articles matching "${searchQuery}". Try another search or browse all categories.`
                : 'There are no published articles yet. Please check back soon.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#0062FF] text-white text-xs font-bold hover:bg-[#0052d9]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Post Card (shown when no search filter is active) */}
            {featuredPost && !searchQuery && selectedCategory === 'All' && (
              <div className="relative rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative w-full aspect-video overflow-hidden bg-neutral-900">
                    <img
                      src={featuredPost.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-[#0062FF] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                        Featured • {featuredPost.category}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {featuredPost.readTimeMinutes || 1} min read
                        </span>
                      </div>

                      <Link href={`/blog/${featuredPost.slug}`}>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#632450] dark:text-white hover:text-[#0062FF] dark:hover:text-[#ECCC6E] transition-colors line-clamp-2">
                          {featuredPost.title}
                        </h2>
                      </Link>

                      <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#256E96]/15 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0062FF]/15 text-[#0062FF] font-bold text-xs flex items-center justify-center">
                          {(featuredPost.authorName || 'B')[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-white">
                            {featuredPost.authorName || 'Bgern Editorial Team'}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Bgern Editorial Team
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-black transition-all shadow-md shadow-[#0062FF]/20 group-hover:gap-2"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchQuery || selectedCategory !== 'All' ? filteredPosts : remainingPosts).map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Card Cover: 16:9 YouTube Thumbnail ratio */}
                  <Link href={`/blog/${post.slug}`} className="block relative w-full aspect-video overflow-hidden bg-neutral-900">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0062FF]/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
                        {post.category}
                      </span>
                    </div>
                  </Link>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTimeMinutes || 1} min
                        </span>
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-base font-black text-[#632450] dark:text-white hover:text-[#0062FF] dark:hover:text-[#ECCC6E] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#256E96]/15 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0062FF]/15 text-[#0062FF] font-bold text-[10px] flex items-center justify-center">
                          {(post.authorName || 'B')[0]}
                        </div>
                        <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[110px]">
                          {post.authorName || 'Bgern Editorial Team'}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-black text-[#0062FF] hover:text-[#0052d9] dark:hover:text-[#ECCC6E]"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA to Studio */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#632450] via-[#0062FF] to-[#A6056F] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Try Bgern Studio
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Ready to create accurate, readable Amharic captions?
            </h2>
            <p className="text-xs sm:text-sm text-white/90">
              Open Bgern Studio to upload a video, generate a transcript, refine your captions, and export your finished video.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link
              href="/studio"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#0062FF] font-black text-xs uppercase tracking-wider hover:bg-neutral-100 shadow-xl transition-all text-center"
            >
              Open Studio
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-black text-xs uppercase tracking-wider transition-all text-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
