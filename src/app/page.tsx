'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Download,
  CheckCircle2,
  Sliders,
  Star,
  Clock,
  ChevronDown,
  Eye,
  UploadCloud,
  Wand2,
  Smartphone,
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

interface ShowcaseItem {
  id: string;
  src: string;
  title: string;
  amharicTitle: string;
  badge: string;
  badgeColor: string;
}

const SHOWCASE_VIDEOS: ShowcaseItem[] = [
  {
    id: 'laura-2',
    src: '/showcase-4.mp4',
    title: 'Laura 2',
    amharicTitle: 'ሎራ 2 • ፖፕአፕ ቦክስ',
    badge: 'Popular',
    badgeColor: 'bg-[#0062FF] text-white',
  },
  {
    id: 'kendrick',
    src: '/showcase-2.mp4',
    title: 'Kendrick',
    amharicTitle: 'ኬንድሪክ • ባለሁለት ከለር',
    badge: 'Trending',
    badgeColor: 'bg-[#FF5A5F] text-white',
  },
  {
    id: 'hormozi',
    src: '/showcase-1.mp4',
    title: 'Hormozi',
    amharicTitle: 'ሆርሞዚ • ቫይራል ቦክስ',
    badge: 'Viral',
    badgeColor: 'bg-[#F59E0B] text-white',
  },
  {
    id: 'beast',
    src: '/showcase-3.mp4',
    title: 'Beast',
    amharicTitle: 'ቢስት • ቃላት በቃላት',
    badge: 'Classic',
    badgeColor: 'bg-[#4F46E5] text-white',
  },
];

const TRUSTED_BRANDS: TrustedBrand[] = [
  {
    name: 'Bigel 2.0',
    amharicName: 'ቢግል 2.0 ስቱዲዮ',
    role: 'Creative Studio',
    image: '/logos/bigel.jpg',
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
  },
  {
    name: 'Safaricom Ethiopia',
    amharicName: 'ሳፋሪኮም ኢትዮጵያ',
    role: 'Mobile & M-Pesa',
    image: '/logos/safaricom.svg',
    color: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
  },
  {
    name: 'Ethio Telecom',
    amharicName: 'ኢትዮ ቴሌኮም',
    role: 'Telecom Leader',
    image: '/logos/ethio-telecom.jpg',
    color: 'from-blue-500/20 to-sky-500/20',
    borderColor: 'border-blue-500/30',
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
    quote:
      'Adding Amharic captions manually in Premiere used to take me 3 hours per TikTok. With Bgern, it takes under 2 minutes with flawless Ge\'ez spelling and the bouncy word highlights my audience loves.',
    amharicQuote:
      'በፕሪሚየር በእጅ ንዑስ ርዕስ ለመጻፍ 3 ሰዓት ይወስድብኝ ነበር። በብገርን በ2 ደቂቃ ውስጥ ፍጹም የሆነ አማርኛ ንዑስ ርዕስ አገኛለሁ።',
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
    quote:
      'My engagement doubled! Most Ethiopians watch reels on silent during commutes or in public. The bold animated captions keep viewers hooked all the way to the end.',
    amharicQuote:
      'የቪዲዮዎቼ እይታ በእጥፍ ጨምሯል! ብዙ ሰዎች ድምጽ አጥፍተው ስለሚያዩ ንዑስ ርዕሱ ተመልካች እንዲቆይ ያደርጋል።',
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
    quote:
      'Local Telebirr payment without international cards makes this a gamechanger for Ethiopian creators. The 1080p 60fps export and SRT download make my workflow so smooth.',
    amharicQuote:
      'በቴሌብር በቀጥታ መክፈል መቻሉ ለኢትዮጵያውያን ፈጣሪዎች ትልቅ እፎይታ ነው። ጥራቱ 1080p መሆኑ ድንቅ ነው።',
    stats: '35 Full Episodes',
    views: '640K+ Views',
    platform: 'YouTube',
    highlight: 'Telebirr payment',
  },
];

const METRICS_STATS = [
  { label: 'Total Video Views', amharic: 'የተገኙ አጠቃላይ እይታዎች', value: '3.2M+', change: '+125% this month', icon: Eye, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Minutes Transcribed', amharic: 'የተቀየሩ የቪዲዮ ደቂቃዎች', value: '45,000+', change: 'Over 2,500 projects', icon: Clock, color: 'text-indigo-600 dark:text-indigo-400' },
  { label: 'Amharic AI Accuracy', amharic: 'የአማርኛ ንዑስ ርዕስ ትክክለኛነት', value: '99.4%', change: 'Native Ge\'ez Whisper AI', icon: Sparkles, color: 'text-amber-500' },
  { label: 'Creator Satisfaction', amharic: 'የፈጣሪዎች እርካታ', value: '4.9 / 5', change: 'From 1,200+ creators', icon: Star, color: 'text-emerald-500' },
];

const FEATURES_LIST = [
  {
    icon: Wand2,
    badge: 'AI Speech-to-Text',
    title: 'Native Amharic Whisper AI',
    amharicTitle: 'ፍጹም የአማርኛ ንግግር ለይቶ ማወቂያ',
    desc: 'Trained specifically on Ethiopian dialects, idioms, and voice textures for millisecond-accurate Ge\'ez subtitle synchronization.',
    tagColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Zap,
    badge: 'Viral Animation',
    title: 'Dynamic Subtitle Styles',
    amharicTitle: 'ተንቀሳቃሽ የንዑስ ርዕስ ቅጦች',
    desc: 'Keep viewers hooked on TikTok, Reels, and Shorts with bouncy word highlights, Pop Zoom, and customizable color themes.',
    tagColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Download,
    badge: '1080p Video & SRT',
    title: 'Instant Burning & Pro Exports',
    amharicTitle: 'ቀጥታ በቪዲዮ ላይ ማተምና ማውረድ',
    desc: 'Download crisp 1080p MP4 videos with burned-in subtitles directly in your browser, or export standard SRT, VTT, and ASS files.',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Smartphone,
    badge: 'Instant ETB Pay',
    title: 'Telebirr & CBE Birr Integrated',
    amharicTitle: 'በቴሌብር እና በንግድ ባንክ ቀላል ክፍያ',
    desc: 'No international credit card required. Top up minutes starting from just 50 ETB with seamless receipt confirmation.',
    tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];

const STEPS_LIST = [
  {
    step: '01',
    title: 'Upload Footage',
    amharicTitle: 'ቪዲዮዎን ያስገቡ',
    description: 'Drag and drop any MP4, MOV, or audio recording. Works smoothly from mobile or desktop.',
    icon: UploadCloud,
  },
  {
    step: '02',
    title: 'AI Auto-Transcribes',
    amharicTitle: 'በቅጽበት ይቀየራል',
    description: 'Our engine generates accurate Amharic subtitles in seconds. Pick font, color, and animation style.',
    icon: Sliders,
  },
  {
    step: '03',
    title: 'Download & Share',
    amharicTitle: 'አውርደው ያጋሩ',
    description: 'Export broadcast-ready 1080p MP4 or download subtitle files (SRT, VTT) ready for upload.',
    icon: CheckCircle2,
  },
];

interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-neutral-900 dark:text-neutral-100 flex flex-col selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      {/* 1. ORIGINAL NAVIGATION */}
      <Navbar />

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[25%] w-[650px] h-[650px] bg-[#0062FF]/10 dark:bg-[#0062FF]/15 rounded-full blur-[160px] animate-aurora" />
        <div className="absolute top-[45%] right-[-10%] w-[550px] h-[550px] bg-[#A6056F]/10 dark:bg-[#A6056F]/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-[#256E96]/10 dark:bg-[#256E96]/15 rounded-full blur-[180px]" />
      </div>

      <main className="flex-1 relative z-10">
        {/* 2. ORIGINAL HERO SECTION (Preserved as requested) */}
        <section className="max-w-7xl mx-auto px-3 sm:px-4 pt-8 sm:pt-16 pb-12 sm:pb-20 text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/20 dark:border-[#0062FF]/35 text-[#0062FF] dark:text-[#60a5fa] text-xs font-bold uppercase tracking-wider animate-in fade-in">
            <Sparkles className="w-4 h-4 text-[#A6056F] dark:text-[#ECCC6E]" />
            Ethiopia&apos;s Premier Amharic Caption Studio
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-[#632450] dark:text-[#ECCC6E] leading-[1.1]">
              Generate Viral <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0062FF] via-[#A6056F] to-[#632450] dark:to-[#ECCC6E]">Amharic Captions</span> in Seconds.
            </h1>
            <p className="text-base sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-geez leading-relaxed">
              የአማርኛ ንዑስ ርዕሶችን በቅጽበት ይፍጠሩ። በ1080p እና 720p ጥራት አውርደው ለቲክቶክ፣ ዩቲዩብ እና ሪልስ ያዘጋጁ።
            </p>
          </div>

          {/* 4-iPhone Showcase: Immediately below hero header, matching exact screenshot */}
          <div className="max-w-6xl mx-auto pt-4 sm:pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8 items-start">
              {SHOWCASE_VIDEOS.map((item) => (
                <div key={item.id} className="flex flex-col items-center group w-full">
                  {/* iPhone Chassis Frame - Ultra-slim sleek bezel */}
                  <div className="relative w-full max-w-[270px] aspect-[9/18.5] rounded-[34px] sm:rounded-[44px] p-1 sm:p-1.5 bg-neutral-900 border-[2px] sm:border-[2.5px] border-neutral-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/40 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_24px_55px_-10px_rgba(0,98,255,0.35)]">
                    
                    {/* Top Dynamic Island Notch - Compact & sleek */}
                    <div className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-3 sm:h-3.5 bg-black rounded-full z-30 flex items-center justify-end pr-1 shadow-xs ring-1 ring-white/10 pointer-events-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0a1a35] border border-blue-900/60" />
                    </div>

                    {/* Inner Screen - Maximized bezel-less view */}
                    <div className="relative w-full h-full rounded-[28px] sm:rounded-[38px] overflow-hidden bg-black flex items-center justify-center">
                      <video
                        src={item.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        ref={(el) => {
                          if (el) {
                            el.muted = true;
                            el.play().catch(() => {});
                          }
                        }}
                        className="w-full h-full object-cover select-none pointer-events-none scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Glass Glare Highlight */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 z-10" />

                      {/* Bottom Home Indicator Bar */}
                      <div className="pointer-events-none absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-0.5 sm:h-1 bg-white/45 rounded-full z-20 backdrop-blur-xs" />
                    </div>
                  </div>

                  {/* Caption Style Label */}
                  <div className="mt-3 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100">{item.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor} font-sans shadow-xs`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-geez">
                      {item.amharicTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 sm:pt-10">
            <button
              onClick={handleLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#14213D] hover:bg-[#000000] text-[#FFFFFF] font-extrabold text-base shadow-xl shadow-[#14213D]/25 transition-all flex items-center justify-center gap-2 group active:scale-95 cursor-pointer"
            >
              <span>{currentUser ? 'Open Caption Studio' : 'Start Free with Gmail'}</span>
              <ArrowRight className="w-5 h-5 text-[#FCA311] group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-[#E5E5E5]/50 dark:bg-[#131924] dark:hover:bg-[#1a2230] border border-[#E5E5E5] dark:border-neutral-700 text-[#14213D] dark:text-[#FFFFFF] font-bold text-base transition-all shadow-xs cursor-pointer"
            >
              View ETB Plans (ከ50 ብር ጀምሮ)
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
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
        </section>

        {/* 3. SIMPLISTIC, MODERN TRUSTED BY SECTION */}
        <section className="py-10 border-y border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-[#111622]/70 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left space-y-1 shrink-0">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#0062FF]" />
                  <span>Trusted by Ethiopian Creators & Media</span>
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-geez">
                  በታላላቅ ተቋማት እና ይዘት ፈጣሪዎች የሚታመን
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {TRUSTED_BRANDS.map((brand, idx) => (
                  <div
                    key={`brand-${idx}`}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/70 dark:border-neutral-800 hover:border-[#0062FF]/40 transition-all cursor-default"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center p-1 overflow-hidden shrink-0">
                      {brand.image ? (
                        <img
                          src={brand.image}
                          alt={brand.name}
                          width={32}
                          height={32}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain rounded"
                        />
                      ) : (
                        <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                          {brand.name[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 leading-tight">
                        {brand.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-geez">
                        {brand.amharicName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. CORE FEATURES (Simplistic Modern Bento Cards) */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0062FF]">
              Engineered for Ethiopian Video Creators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Everything you need to go viral in Amharic
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-geez leading-relaxed">
              ከእንግዲህ በፕሪሚየር እና በካፕከት በእጅ መጻፍ ቀረ። በሰከንዶች ውስጥ የተሟላ የቪዲዮ ንዑስ ርዕስ ያዘጋጁ።
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES_LIST.map((feat, i) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white dark:bg-[#131924] border border-neutral-200/80 dark:border-neutral-800/80 hover:border-[#0062FF]/40 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feat.iconBg} transition-transform group-hover:scale-105`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${feat.tagColor}`}>
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-[#0062FF] transition-colors">
                        {feat.title}
                      </h3>
                      <h4 className="text-xs font-semibold text-[#0062FF] font-geez mt-0.5">
                        {feat.amharicTitle}
                      </h4>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. 3-STEP WORKFLOW (Modern, intuitive & clean) */}
        <section className="py-20 bg-white dark:bg-[#111622] border-y border-neutral-200/80 dark:border-neutral-800/80">
          <div className="max-w-6xl mx-auto px-4 space-y-14">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0062FF]">
                Effortless 3-Step Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                From Raw Footage to Viral Clip
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                No complex editing timelines or expensive software needed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {STEPS_LIST.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="relative p-6 sm:p-8 rounded-2xl bg-neutral-50 dark:bg-[#151c2a] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col justify-between space-y-4 hover:border-[#0062FF]/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#0062FF]/10 text-[#0062FF] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-2xl font-black text-neutral-300 dark:text-neutral-700 font-mono">
                        {step.step}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {step.title}
                      </h3>
                      <h4 className="text-xs font-semibold text-[#0062FF] font-geez">
                        {step.amharicTitle}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleLaunchStudio}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#14213D] hover:bg-[#000000] text-[#FFFFFF] font-bold text-sm shadow-md shadow-[#14213D]/20 transition-all cursor-pointer active:scale-95"
              >
                <span>Try It with Your Video</span>
                <ArrowRight className="w-4 h-4 text-[#FCA311]" />
              </button>
            </div>
          </div>
        </section>

        {/* 6. STATS & CREATOR TESTIMONIALS */}
        <section className="py-20 max-w-7xl mx-auto px-4 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Proven Results for 1,200+ Creators</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Real Impact for Ethiopian Video Creators
            </h2>
          </div>

          {/* Unified Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS_STATS.map((metric, i) => {
              const IconComponent = metric.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white dark:bg-[#131924] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {metric.label}
                    </span>
                    <IconComponent className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium">
                    {metric.change}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Creator Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREATOR_TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#131924] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs hover:border-[#0062FF]/40 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(t.rating)].map((_, si) => (
                        <Star key={si} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0062FF] border border-blue-500/20">
                      {t.platform}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="text-[11px] text-neutral-400 font-geez italic">
                    &ldquo;{t.amharicQuote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {t.handle}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {t.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. PRICING SECTION */}
        <PricingSection
          currentUser={currentUser}
          onRequireLogin={() => setShowAuthModal(true)}
        />

        {/* 8. FAQ ACCORDION (Clean, Modern, Accessible) */}
        <section className="py-20 bg-white dark:bg-[#111622] border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div className="max-w-3xl mx-auto px-4 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0062FF]">
                Got Questions?
              </span>
              <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-geez">
                ስለ አማርኛ ንዑስ ርዕስ (Captions) እና የክፍያ አማራጮች ማብራሪያ
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden bg-neutral-50/50 dark:bg-[#151c2a]/50 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0062FF]/50 rounded-xl"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-0.5">
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                          {item.question}
                        </h3>
                        <p className="text-xs text-[#0062FF] font-geez font-medium">
                          {item.amharicQuestion}
                        </p>
                      </div>
                      <span
                        className={`p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. SLEEK HIGH-CONVERSION BOTTOM CTA BANNER */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-[#0B0F17] via-[#111827] to-[#1e1b4b] border border-neutral-800 p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#0062FF]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#A6056F]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                10 Free Minutes on First Sign In
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Ready to create viral Amharic videos?
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 font-geez max-w-xl mx-auto">
                በአማርኛ ንዑስ ርዕሶች ቪዲዮዎችዎ በቲክቶክ እና በዩቲዩብ የብዙዎችን ቀልብ እንዲስቡ ያድርጉ።
              </p>
            </div>

            <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleLaunchStudio}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#14213D] hover:bg-[#000000] text-[#FFFFFF] font-bold text-sm shadow-xl shadow-[#14213D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{currentUser ? 'Enter Caption Studio' : 'Start Free with Gmail'}</span>
                <ArrowRight className="w-4 h-4 text-[#FCA311]" />
              </button>
              <a
                href="/pricing"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#FFFFFF] font-bold text-sm transition-all cursor-pointer text-center"
              >
                View Plans (ከ50 ብር ጀምሮ)
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 10. AUTH MODAL & FOOTER */}
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
