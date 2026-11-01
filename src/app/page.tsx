'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Pause,
  ArrowRight,
  Zap,
  ShieldCheck,
  Video,
  Download,
  CheckCircle2,
  Sliders,
  Layers,
  Star,
  Users,
  Clock,
  HelpCircle,
  ChevronDown,
  Quote,
  TrendingUp,
  Eye,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingSection from '@/components/PricingSection';
import AuthModal from '@/components/AuthModal';

interface TrustedBrand {
  name: string;
  amharicName: string;
  role: string;
  image?: string;
  iconText?: string;
  color?: string;
  borderColor?: string;
}

const TRUSTED_BRANDS: TrustedBrand[] = [
  {
    name: 'Bigel 2.0',
    amharicName: 'ቢግል 2.0 ስቱዲዮ',
    role: 'Creative Studio',
    image: '/logos/bigel.jpg',
    color: 'from-yellow-500/30 to-amber-500/30',
    borderColor: 'border-yellow-500/40',
  },
  {
    name: 'Safaricom Ethiopia',
    amharicName: 'ሳፋሪኮም ኢትዮጵያ',
    role: 'Mobile & M-Pesa',
    image: '/logos/safaricom.svg',
    color: 'from-emerald-600/30 to-green-600/30',
    borderColor: 'border-emerald-500/40',
  },
  {
    name: 'Ethio Telecom',
    amharicName: 'ኢትዮ ቴሌኮም',
    role: 'Telecom Leader',
    image: '/logos/ethio-telecom.jpg',
    color: 'from-blue-600/30 to-emerald-600/30',
    borderColor: 'border-blue-500/40',
  },
];

interface CreatorTestimonial {
  name: string;
  handle: string;
  role: string;
  avatar: string;
  rating: number;
  quote: string;
  amharicQuote: string;
  stats: string;
  views: string;
  platform: 'TikTok' | 'YouTube' | 'Reels' | 'Podcast';
  highlight: string;
}

const CREATOR_TESTIMONIALS: CreatorTestimonial[] = [
  {
    name: 'Amanuel Tadesse',
    handle: '@amanuel_tech',
    role: 'Tech & Gadget Reviewer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote: 'Adding Amharic captions manually in Premiere used to take me 3 hours per TikTok. With Bgern, it takes under 2 minutes with flawless Ge\'ez spelling and the bouncy word highlights my audience loves.',
    amharicQuote: 'በፕሪሚየር በእጅ ንዑስ ርዕስ ለመጻፍ 3 ሰዓት ይወስድብኝ ነበር። በብገርን በ2 ደቂቃ ውስጥ ፍጹም የሆነ አማርኛ ንዑስ ርዕስ አገኛለሁ።',
    stats: '+140% Watch Time',
    views: '850K+ Views',
    platform: 'TikTok',
    highlight: 'Saved 3 hrs / video',
  },
  {
    name: 'Selamawit Bekele',
    handle: '@selam_lifestyle',
    role: 'Lifestyle & Wellness Creator',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote: 'My engagement doubled! Most Ethiopians watch reels on silent during commutes or in public. The bold animated captions keep viewers hooked all the way to the end.',
    amharicQuote: 'የቪዲዮዎቼ እይታ በእጥፍ ጨምሯል! ብዙ ሰዎች ድምጽ አጥፍተው ስለሚያዩ ንዑስ ርዕሱ ተመልካች እንዲቆይ ያደርጋል።',
    stats: '2.4x Engagement',
    views: '1.2M+ Views',
    platform: 'Reels',
    highlight: '2.4x Engagement',
  },
  {
    name: 'Yohannes Mulugeta',
    handle: '@yoni_business_et',
    role: 'Business Podcaster & Host',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote: 'Local Telebirr payment without international cards makes this a gamechanger for Ethiopian creators. The 1080p 60fps export and SRT download make my workflow so smooth.',
    amharicQuote: 'በቴሌብር በቀጥታ መክፈል መቻሉ ለኢትዮጵያውያን ፈጣሪዎች ትልቅ እፎይታ ነው። ጥራቱ 1080p መሆኑ ድንቅ ነው።',
    stats: '35 Full Episodes',
    views: '640K+ Views',
    platform: 'YouTube',
    highlight: 'Telebirr payment',
  },
  {
    name: 'Bethelhem Hailu',
    handle: '@betty_shortfilms',
    role: 'Comedy Skit & Story Creator',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    quote: 'The font auto-fit and scene cut detection are genius. No more captions overflowing or covering important parts of the video. The 11 Ethiopic fonts give my skits a unique visual identity.',
    amharicQuote: 'የፊደል መጠኑ በራሱ ከቪዲዮው ጋር መመጠኑና 11 የተለያዩ የአማርኛ ቅርጸ-ቁምፊዎች መኖራቸው ለስራዬ ልዩ ውበት ሰጥቶታል።',
    stats: '60+ Videos',
    views: '490K+ Views',
    platform: 'TikTok',
    highlight: '11 Ethiopic Fonts',
  },
];

const METRICS_STATS = [
  { label: 'Total Video Views', amharic: 'የተገኙ አጠቃላይ እይታዎች', value: '3.2M+', change: '+125% this month', icon: Eye, color: 'text-[#0062FF]' },
  { label: 'Minutes Transcribed', amharic: 'የተቀየሩ የቪዲዮ ደቂቃዎች', value: '45,000+', change: 'Over 2,500 projects', icon: Clock, color: 'text-[#A6056F]' },
  { label: 'Amharic AI Accuracy', amharic: 'የአማርኛ ንዑስ ርዕስ ትክክለኛነት', value: '99.4%', change: 'Native Ge\'ez Whisper AI', icon: Sparkles, color: 'text-amber-500' },
  { label: 'Creator Satisfaction', amharic: 'የፈጣሪዎች እርካታ', value: '4.9 / 5', change: 'From 1,200+ creators', icon: Star, color: 'text-emerald-500' },
];

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const FAQ_ITEMS = [
    {
      question: 'How to add Amharic subtitles to a video automatically?',
      amharicQuestion: 'የአማርኛ ንዑስ ርዕስ (Subtitles) በቪዲዮ ላይ በራስ-ሰር እንዴት ማከል ይቻላል?',
      answer:
        'Using Bgern, the premier Amharic subtitle generator in Ethiopia, you can generate Amharic subtitles automatically in under 60 seconds. Simply sign up for free with your Gmail account, upload your video (MP4, MOV, or WebM), and click "Generate Captions". Our Ethiopian AI transcription engine converts Amharic speech to text with precise millisecond timestamps and renders authentic Ge\'ez typography.',
    },
    {
      question: 'How to create Amharic captions for TikTok, YouTube, and Facebook videos?',
      amharicQuestion: 'ለቲክቶክ፣ ዩቲዩብ እና ፌስቡክ የአማርኛ ቪዲዮ ጽሑፍ እንዴት ማዘጋጀት ይቻላል?',
      answer:
        'Bgern provides native aspect ratio presets for all social platforms: 9:16 vertical for TikTok, Instagram Reels, and YouTube Shorts (with safe zone overlays), and 16:9 widescreen for YouTube and Facebook videos. Choose from viral animated caption styles such as Pop Zoom, Up-Down bounce, and karaoke word highlights to skyrocket viewer retention.',
    },
    {
      question: 'How does Amharic speech to text and audio to text work online?',
      amharicQuestion: 'የአማርኛ ድምፅ ወደ ጽሑፍ (Speech to Text) መቀየሪያ እንዴት ይሰራል?',
      answer:
        'Bgern uses state-of-the-art AI speech-to-text models trained specifically on Ethiopian Amharic voices, idioms, and accents. Whether you upload audio or video, the system accurately transcribes spoken words into clean Ge\'ez script, making it the most reliable Amharic transcription tool online.',
    },
    {
      question: 'Can I download Amharic SRT, VTT, and ASS subtitles?',
      amharicQuestion: 'የአማርኛ SRT እና VTT ንዑስ ርዕሶችን ማውረድ ይቻላል?',
      answer:
        'Yes! Bgern is a full Amharic SRT generator and VTT maker. After generating or editing your subtitles online, you can export them as .SRT, .VTT, or .ASS files for YouTube Studio, Facebook Video Manager, or video editing software like Adobe Premiere Pro and DaVinci Resolve.',
    },
    {
      question: 'Why is Bgern the best Amharic video editor and subtitle app for Ethiopian creators?',
      amharicQuestion: 'ለኢትዮጵያውያን ይዘት ፈጣሪዎች የተሻለ ምርጫ የሚያደርገው ምንድን ነው?',
      answer:
        'Bgern is purpose-built as an Ethiopian video caption generator and creator tool. Unlike generic English tools, Bgern natively supports over 10 authentic Ge\'ez fonts (Noto Sans Ethiopic, Abyssinica, Jiret, Zemenay), offers high-speed rendering on local 3G/4G networks, and burns 1080p subtitles directly in your browser without requiring expensive GPUs.',
    },
    {
      question: 'What payment methods are supported for creators in Ethiopia?',
      amharicQuestion: 'ምን ዓይነት የክፍያ አማራጮች ተደራሽ ናቸው?',
      answer:
        'Bgern natively supports Telebirr and Commercial Bank of Ethiopia (CBE) Birr. Flexible minute packages start from just 50 ETB, making professional AI subtitle generation accessible for every YouTuber, TikToker, media house, and corporate creator in Ethiopia.',
    },
  ];

  useEffect(() => {
    fetch('/api/auth/me', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  const handleLaunchStudio = () => {
    if (currentUser) {
      router.push('/studio');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      <Navbar />

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[25%] w-[650px] h-[650px] bg-[#0062FF]/10 dark:bg-[#0062FF]/15 rounded-full blur-[160px] animate-aurora" />
        <div className="absolute top-[45%] right-[-10%] w-[550px] h-[550px] bg-[#A6056F]/10 dark:bg-[#A6056F]/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-[#256E96]/10 dark:bg-[#256E96]/15 rounded-full blur-[180px]" />
      </div>

      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 pt-8 sm:pt-16 pb-12 sm:pb-20 text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/20 dark:border-[#0062FF]/35 text-[#0062FF] dark:text-[#60a5fa] text-xs font-bold uppercase tracking-wider animate-in fade-in">
            <Sparkles className="w-4 h-4 text-[#A6056F] dark:text-[#ECCC6E]" />
            Ethiopia's Premier Amharic Caption Studio
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-[#632450] dark:text-[#ECCC6E] leading-[1.1]">
              Generate Viral <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0062FF] via-[#A6056F] to-[#632450] dark:to-[#ECCC6E]">Amharic Captions</span> in Seconds.
            </h1>
            <p className="text-base sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-geez leading-relaxed">
              የአማርኛ ንዑስ ርዕሶችን በቅጽበት ይፍጠሩ። በ1080p እና 720p ጥራት አውርደው ለቲክቶክ፣ ዩቲዩብ እና ሪልስ ያዘጋጁ።
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-extrabold text-base shadow-xl shadow-[#0062FF]/25 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <span>{currentUser ? 'Open Caption Studio' : 'Start Free with Gmail'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-neutral-50 dark:bg-[#131924] dark:hover:bg-[#1a2230] border border-[#256E96]/30 text-[#0062FF] dark:text-[#ECCC6E] font-bold text-base transition-all shadow-xs"
            >
              View ETB Plans (ከ50 ብር ጀምሮ)
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0062FF]" /> 10 Free Minutes on Signup
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0062FF]" /> 1080p & 720p Video Burning
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0062FF]" /> Telebirr & CBE Supported
            </div>
          </div>

          {/* Sample Subtitle Preview */}
          <div className="max-w-4xl mx-auto pt-10">
            <div className="rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 p-4 sm:p-6 shadow-xl">
              <h2 className="mb-4 text-center text-sm sm:text-base font-black text-[#632450] dark:text-[#ECCC6E]">
                Live Animated Subtitle Preview
              </h2>
              <video
                src="/sample-video.mp4"
                poster="/preview_card_left.jpg"
                controls
                playsInline
                preload="metadata"
                className="mx-auto w-full max-w-3xl aspect-video rounded-2xl bg-black object-contain"
              />
            </div>
          </div>
        </section>

        {/* ANIMATED TRUSTED COMPANIES & CREATORS MARQUEE */}
        <section className="py-16 border-b border-[#256E96]/15 dark:border-[#256E96]/30 bg-[#F3F5F6] dark:bg-[#0B0F17] overflow-hidden relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/30 text-[#0062FF] dark:text-[#60a5fa] text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0062FF] dark:text-[#60a5fa]" />
              <span>የኢንዱስትሪ ደረጃ (Industry Standard)</span>
            </div>

            <div className="space-y-1.5 max-w-5xl mx-auto">
              <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-black uppercase tracking-wider text-[#632450] dark:text-[#ECCC6E] whitespace-nowrap overflow-hidden text-ellipsis">
                TRUSTED BY LEADING ETHIOPIAN BRANDS, CREATORS & MEDIA
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#256E96] font-geez">
                በታላላቅ ተቋማት፣ የቴሌቪዥን ጣቢያዎች እና ይዘት ፈጣሪዎች የታመነ
              </p>
            </div>
          </div>

          {/* Single Static Row (No Animation, Single Line) */}
          <div className="relative w-full max-w-7xl mx-auto px-4 py-2 overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap items-center justify-start lg:justify-center gap-3.5 sm:gap-4 pb-2">
              {TRUSTED_BRANDS.map((brand, idx) => (
                <div
                  key={`brand-${idx}`}
                  className="group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#131924] hover:bg-neutral-50 dark:hover:bg-[#1a2230] border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/50 shadow-xs transition-all duration-200 hover:-translate-y-0.5 shrink-0 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/5 border border-[#256E96]/20 flex items-center justify-center p-1.5 overflow-hidden shrink-0 group-hover:border-[#0062FF]/40 transition-colors">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={brand.name}
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div
                        className={`w-full h-full rounded-lg bg-gradient-to-br ${brand.color} flex items-center justify-center font-black text-xs text-white tracking-wider font-mono`}
                      >
                        {brand.iconText}
                      </div>
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white group-hover:text-[#0062FF] dark:group-hover:text-[#60a5fa] transition-colors">
                        {brand.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 text-[#256E96] font-mono font-bold">
                        {brand.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-geez mt-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                      {brand.amharicName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 SIMPLE STEPS) */}
        <section className="py-20 bg-white dark:bg-[#131924] border-y border-[#256E96]/15 dark:border-[#256E96]/30 transition-colors">
          <div className="max-w-7xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0062FF]">
                Simple Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#632450] dark:text-[#ECCC6E]">
                How Bgern Works in 3 Steps
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Designed for high efficiency so you can go from raw footage to published video in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 relative space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#0062FF]/15 text-[#0062FF] dark:text-[#60a5fa] flex items-center justify-center font-black text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-[#632450] dark:text-[#ECCC6E]">Sign In & Upload</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Sign in with your Gmail account and upload your video. Your file is submitted for quick administrative verification.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 relative space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#A6056F]/15 text-[#A6056F] dark:text-pink-400 flex items-center justify-center font-black text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-[#632450] dark:text-[#ECCC6E]">Generate & Animate</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Generate accurate Amharic Ge'ez captions with one click. Select from Up-Down bounce, Pop zoom, or custom colors.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 dark:border-[#256E96]/35 relative space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#256E96]/15 text-[#256E96] dark:text-teal-400 flex items-center justify-center font-black text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-[#632450] dark:text-[#ECCC6E]">Export 1080p & SRT</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Download the final video with burned-in subtitles at full 1080p, or download standard SRT, VTT, and ASS files.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CREATOR TESTIMONIALS & STATS SECTION
        ========================================================================== */}
        <section className="py-24 bg-[#F3F5F6]/60 dark:bg-[#0B0F17] relative overflow-hidden transition-colors border-b border-[#256E96]/15 dark:border-[#256E96]/30">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#0062FF]/10 via-[#A6056F]/10 to-amber-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 space-y-16 relative">
            {/* Section Header */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/25 text-[#0062FF] dark:text-[#60a5fa] text-xs font-black uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-[#0062FF] dark:fill-[#60a5fa]" />
                <span>Loved by 1,200+ Ethiopian Creators</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight leading-tight">
                Trusted by Top Ethiopian Video Creators
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
                Discover how TikTokers, YouTubers, and podcasters save hours of tedious subtitle editing and generate millions of views with Bgern AI.
              </p>
            </div>

            {/* Metrics Stats Banner (View Counts & Performance) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {METRICS_STATS.map((metric, i) => {
                const IconComponent = metric.icon;
                return (
                  <div
                    key={i}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm space-y-2 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{metric.label}</span>
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className={`w-4 h-4 ${metric.color}`} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                      {metric.value}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {metric.change}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Creator Quotes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {CREATOR_TESTIMONIALS.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-[#0062FF]/40 transition-all group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Top Row: Stars, Platform badge, Stat pill */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {[...Array(t.rating)].map((_, si) => (
                          <Star key={si} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                          {t.views}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0062FF]/10 text-[#0062FF] dark:text-[#60a5fa] border border-[#0062FF]/20 uppercase">
                          {t.platform}
                        </span>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                        "{t.quote}"
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-geez italic">
                        "{t.amharicQuote}"
                      </p>
                    </div>
                  </div>

                  {/* Creator Info Footer */}
                  <div className="pt-4 border-t border-[#256E96]/10 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-11 h-11 rounded-2xl object-cover border-2 border-[#0062FF]/30 shadow-xs"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white">{t.name}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span>{t.handle}</span>
                          <span>•</span>
                          <span>{t.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] text-[10px] font-bold text-[#632450] dark:text-[#ECCC6E] border border-[#256E96]/15">
                      <TrendingUp className="w-3 h-3 text-[#0062FF]" />
                      <span>{t.highlight}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <PricingSection
          currentUser={currentUser}
          onRequireLogin={() => setShowAuthModal(true)}
        />

        {/* FREQUENTLY ASKED QUESTIONS (SEO & CREATOR GUIDES) */}
        <section className="py-20 bg-[#F3F5F6] dark:bg-[#0B0F17] border-t border-[#256E96]/15 dark:border-[#256E96]/30 transition-colors">
          <div className="max-w-4xl mx-auto px-4 space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/30 text-[#0062FF] dark:text-[#60a5fa] text-xs font-black uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions & Creator Guide</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
                Amharic Subtitle & Caption Generator FAQ
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 font-geez max-w-xl mx-auto">
                ስለ አማርኛ ንዑስ ርዕስ (Captions)፣ የድምፅ ወደ ጽሑፍ መቀየሪያ እና የቪዲዮ ኤዲቲንግ በተደጋጋሚ የሚነሱ ጥያቄዎች
              </p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 group"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-[#632450] dark:text-white group-hover:text-[#0062FF] dark:group-hover:text-[#60a5fa] transition-colors flex items-center gap-2">
                          <span>{item.question}</span>
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-[#256E96] font-geez">
                          {item.amharicQuestion}
                        </p>
                      </div>
                      <span
                        className={`p-2 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 text-[#0062FF] dark:text-[#ECCC6E] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#256E96]/10 dark:border-white/5 animate-in fade-in duration-200">
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="rounded-3xl bg-gradient-to-r from-[#632450] via-[#A6056F] to-[#0062FF] border border-white/20 p-6 sm:p-8 md:p-14 text-center space-y-4 sm:space-y-6 shadow-2xl backdrop-blur-md text-white">
            <h2 className="text-3xl sm:text-5xl font-black text-white max-w-2xl mx-auto leading-tight">
              Ready to create viral Amharic videos?
            </h2>
            <p className="text-sm sm:text-base text-neutral-200 max-w-xl mx-auto">
              Sign up with Gmail today and get 10 free minutes to generate broadcast-quality captions.
            </p>
            <div className="pt-2">
              <button
                onClick={handleLaunchStudio}
                className="px-10 py-4 rounded-2xl bg-[#ECCC6E] hover:bg-[#ffe38a] text-[#632450] font-black text-base shadow-2xl shadow-black/20 transition-all inline-flex items-center gap-2 active:scale-95"
              >
                <span>{currentUser ? 'Enter Studio Now' : 'Sign Up Free with Gmail'}</span>
                <ArrowRight className="w-5 h-5 text-[#632450]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          router.push('/studio');
        }}
      />

      <Footer />
    </div>
  );
}
