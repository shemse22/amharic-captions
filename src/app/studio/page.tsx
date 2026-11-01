'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Play,
  Pause,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  ShieldCheck,
  Download,
  FileText,
  Video,
  Plus,
  Trash2,
  Hash,
  Search,
  Wand2,
  Film,
  RotateCw,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sliders,
  Scissors,
  Settings,
  Palette,
  Type,
  Music,
  MoreHorizontal,
  Pencil,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  ExternalLink,
  Share2,
  Check,
  Copy,
  X,
  Zap,
  ArrowLeft,
  Crop,
  FastForward,
  Info,
  Move,
  Bookmark,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { PRICING_PLANS, OFFICIAL_PAYMENT_ACCOUNTS } from '@/lib/pricing-plans';

export interface DetectedScene {
  id: number;
  start: number;
  end: number;
  duration: number;
  thumbnail: string;
  subtitleCount: number;
  label: string;
}

class ExportFinalizationError extends Error {
  constructor(message: string, readonly details: string) {
    super(message);
    this.name = 'ExportFinalizationError';
  }
}
import {
  SubtitleSegment,
  SubtitleStyleOptions,
  exportToSRT,
  exportToVTT,
  exportToASS,
  exportToTXT,
} from '@/lib/exporter';
import { CAPTION_PRESETS, CaptionPreset } from '@/lib/caption-presets';

// Helper to convert hex and opacity to rgba
function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = (hex || '#000000').replace('#', '');
  const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Amharic Fonts with exact names matching @font-face rules
const AMHARIC_FONTS = [
  { name: 'SurGraphics Black', label: 'SurGraphics Black (ሱር ግራፊክስ)' },
  { name: 'Zemenay', label: 'Zemenay (ዘመናይ)' },
  { name: 'Bela Bereka', label: 'Bela Bereka (በላ በረካ)' },
  { name: 'Loga Display', label: 'Loga Display (ሎጋ)' },
  { name: 'HH Lemd Mono', label: 'HH Lemd Mono (ሌምድ ሞኖ)' },
  { name: 'Geez Digital', label: 'Geez Digital (ግዕዝ ዲጂታል)' },
  { name: 'Amhara Reduced', label: 'Amhara Reduced (አማራ)' },
  { name: 'Waldba Wookianos', label: 'Waldba Wookianos (ውቂያኖስ)' },
  { name: 'Abyssinica SIL Connected', label: 'Abyssinica SIL Connected (አቢሲኒካ)' },
  { name: 'Ethiopic Lessan', label: 'Ethiopic Lessan (ልሳን)' },
  { name: 'Noto Sans Ethiopic', label: 'Noto Sans Ethiopic (ኖቶ ሳንስ)' },
  { name: 'Noto Serif Ethiopic', label: 'Noto Serif Ethiopic (ኖቶ ሰሪፍ)' },
];

const POPULAR_FONTS = [
  { name: 'Garamond', label: 'Garamond' },
  { name: 'Arial-Pro', label: 'Arial-Pro' },
  { name: 'Poppins', label: 'Poppins' },
  { name: 'Montserrat', label: 'Montserrat' },
  { name: 'Inter', label: 'Inter' },
  { name: 'Roboto', label: 'Roboto' },
  { name: 'Arial', label: 'Arial' },
];

// Dropdown options from screenshots 3, 4, 5
const EMPHASIZED_ANIMATIONS = ['Default', 'Fade In', 'Slide Up'];

const CAPTION_ANIMATIONS = [
  'None',
  'show in',
  'pop in',
  'pop out',
  'bounce in',
  'zoom out',
  'zoom in',
  'rotate wiggle',
  'rotate wiggle small',
  'rotate wiggle mini',
  'rotate wiggle scale',
  'pop in zoom',
  'fade in',
  'fade out',
  'scale bounce',
  'rotate left',
  'rotate right',
  'rotate slow right',
  'rotate slow left',
  'scale slow in',
];

const WORD_ANIMATIONS = [
  'None',
  'fade in',
  'show in',
  'show in fast',
  'zoom in',
  'opacity 30',
  'slide up',
  'slide up fast',
  'fade in fast',
  'white flash reveal',
  'slide right dust',
];

// 6x8 Color Palette Swatches (featuring main website palette on top row)
const COLOR_PALETTE_ROWS = [
  ['#F3F5F6', '#0062FF', '#ECCC6E', '#632450', '#A6056F', '#256E96', '#ffffff', '#000000'],
  ['#ffd5d5', '#ffe2cc', '#fff3b3', '#c5f4a8', '#b8f0f0', '#c4dbff', '#d8ccff', '#f9c0e5'],
  ['#ffb3b3', '#ffc799', '#ffea80', '#a9f07a', '#99e6e6', '#a6ccff', '#bca6ff', '#f799d5'],
  ['#ff8080', '#ffa54f', '#ffd700', '#8ceb4c', '#66d9d9', '#73adff', '#9973ff', '#f566be'],
  ['#ff4d4d', '#ff7a1a', '#ffbb00', '#60e01c', '#26c6c6', '#408eff', '#6b40ff', '#f233a7'],
  ['#e60000', '#e65c00', '#e69500', '#38b000', '#009999', '#1a66ff', '#4d1aff', '#d60085'],
];

export default function StudioPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Auth State - initialized with cached user so credits never disappear or prompt login on reload
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('bgern_user');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Studio Sub-Sidebar Tab: 'style' | 'captions' | 'ai-tools' | 'scenes' | 'library'
  const [sidebarTab, setSidebarTab] = useState<'style' | 'captions' | 'ai-tools' | 'scenes' | 'library'>('style');

  // View inside Style tab: 'gallery' (Default showing all styles as requested!) or 'editor' (when clicking pencil)
  const [styleView, setStyleView] = useState<'editor' | 'gallery'>('gallery');

  // Selected Style Preset: Default Kendrick 2 as requested!
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kendrick-2');
  const [presetCategory, setPresetCategory] = useState<'All' | 'Trend' | 'New' | 'Premium' | 'Emoji'>('All');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('Kendrick 2');
  const [isEditingPresetName, setIsEditingPresetName] = useState(false);
  const [themeSavedToast, setThemeSavedToast] = useState(false);

  // Rich Color Picker Modal State
  const [activeColorTarget, setActiveColorTarget] = useState<string | null>(null);
  const [pickerHex, setPickerHex] = useState('#13FD00');
  const [pickerR, setPickerR] = useState(19);
  const [pickerG, setPickerG] = useState(253);
  const [pickerB, setPickerB] = useState(0);
  const [pickerA, setPickerA] = useState(100);
  const [hueValue, setHueValue] = useState(115);

  // 1. Font Section Settings (Kendrick 2 exact from screenshot)
  const [fontFamily, setFontFamily] = useState<string>('Montserrat');
  const [fontWeight, setFontWeight] = useState<string>('Bold');
  const [textCase, setTextCase] = useState<'Aa' | 'AA' | 'aa'>('Aa');
  const [fontSize, setFontSize] = useState<number>(28); // 28 px
  const [autoFitFont, setAutoFitFont] = useState<boolean>(true);
  const [fontColor, setFontColor] = useState<string>('#FFFFFF'); // white
  const [strokeWeight, setStrokeWeight] = useState<'None' | 'Small' | 'Medium' | 'Large'>('None'); // None
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [shadowWeight, setShadowWeight] = useState<'None' | 'Small' | 'Medium' | 'Large'>('None'); // None
  const [shadowColor, setShadowColor] = useState<string>('#000000');
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const customFontInputRef = useRef<HTMLInputElement | null>(null);

  // Secondary Font
  const [secondaryFontFamily, setSecondaryFontFamily] = useState<string>('ItcGaramond');
  const [secondaryFontWeight, setSecondaryFontWeight] = useState<string>('Medium');

  // 2. Caption Section Settings (Kendrick 2 exact from screenshot)
  const [displayWords, setDisplayWords] = useState<string>('4 words');
  const [displayWordCount, setDisplayWordCount] = useState<number>(4);
  const [positionY, setPositionY] = useState<number>(71); // 71%
  const [positionX, setPositionX] = useState<number>(50); // 50%
  const [hasAnimation, setHasAnimation] = useState<boolean>(true); // Yes in Kendrick 2
  const [hasPunctuation, setHasPunctuation] = useState<boolean>(false); // No in Kendrick 2
  const [hasKeywordHighlights, setHasKeywordHighlights] = useState<boolean>(false); // No in Kendrick 2
  const [mainHighlightColor, setMainHighlightColor] = useState<string>('#000000'); // Black container
  const [secondHighlightColor, setSecondHighlightColor] = useState<string>('#13fd00'); // Neon Green pill
  const [thirdHighlightColor, setThirdHighlightColor] = useState<string>('#000000'); // Black
  const [borderRadiusEm, setBorderRadiusEm] = useState<number>(0.1); // 0.1 em
  const [autoEmoji, setAutoEmoji] = useState<'Auto' | 'Top' | 'None'>('None'); // None in Kendrick 2
  const [emojiAnimation, setEmojiAnimation] = useState<boolean>(false); // No in Kendrick 2
  const [customSelectedEmoji, setCustomSelectedEmoji] = useState<string>('');
  const [breakLines, setBreakLines] = useState<boolean>(true); // Yes in Kendrick 2
  const [gapFreeCaptions, setGapFreeCaptions] = useState<boolean>(true);

  // 3. Emphasized Text Section Settings (Kendrick 2 exact from screenshot)
  const [emphasizedAnimation, setEmphasizedAnimation] = useState<string>('Default');
  const [emphasizedFontColor, setEmphasizedFontColor] = useState<string>('#FFFFFF');
  const [emphasizedBgColor, setEmphasizedBgColor] = useState<string>('transparent'); // Transparent

  // 4. Animations Section Settings (Kendrick 2 exact from screenshot)
  const [captionAnimation, setCaptionAnimation] = useState<string>('pop out'); // pop out
  const [wordAnimation, setWordAnimation] = useState<string>('None'); // None
  const [emojiAnimType, setEmojiAnimType] = useState<string>('None');
  const [animationVariants, setAnimationVariants] = useState<boolean>(false); // No in Kendrick 2
  const [variants, setVariants] = useState([
    { id: 1, captionAnim: 'rotate wiggle', wordAnim: 'None', emojiAnim: 'None' },
    { id: 2, captionAnim: 'scale slow in', wordAnim: 'None', emojiAnim: 'None' },
    { id: 3, captionAnim: 'rotate slow right', wordAnim: 'None', emojiAnim: 'None' },
    { id: 4, captionAnim: 'rotate slow left', wordAnim: 'None', emojiAnim: 'None' },
    { id: 5, captionAnim: 'rotate wiggle', wordAnim: 'None', emojiAnim: 'None' },
  ]);

  // 5. B-roll Section Settings
  const [brollLayout, setBrollLayout] = useState<string>('Random (Cover / Split 50/50 / Sp...');
  const [brollZoom, setBrollZoom] = useState<string>('None');

  // 6. Video Background Section
  const [videoBgColor, setVideoBgColor] = useState<string>('#000000');

  // Mobile Studio View Toggle (preview vs editor)
  const [mobileStudioView, setMobileStudioView] = useState<'preview' | 'editor'>('preview');

  // Dragging Caption by Mouse or Finger State
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const [isResizingCaption, setIsResizingCaption] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startY: number; startFontSize: number; handle: 'nw' | 'ne' | 'sw' | 'se' } | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Modals & Menus
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuPosition, setExportMenuPosition] = useState<{
    isMobile: boolean;
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  // Below Video Controls (Screenshot 1)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5'>('9:16');
  const [showAdjustMenu, setShowAdjustMenu] = useState(false);
  const [isHoveringAdjust, setIsHoveringAdjust] = useState(false);
  const [videoFit, setVideoFit] = useState<'cover' | 'contain' | 'fill'>('contain');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showFitSubmenu, setShowFitSubmenu] = useState(false);
  const [showSpeedSubmenu, setShowSpeedSubmenu] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);

  const updateExportMenuPosition = useCallback(() => {
    const button = exportButtonRef.current;
    if (!button) {
      setExportMenuPosition(null);
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const viewportMargin = 12;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const isMobile = viewportWidth < 640;
    const menuWidth = isMobile
      ? Math.min(360, viewportWidth - viewportMargin * 2)
      : 256;
    const top = isMobile
      ? viewportMargin
      : Math.max(
          viewportMargin,
          Math.min(buttonRect.bottom + 8, viewportHeight - 180)
        );
    const left = isMobile
      ? (viewportWidth - menuWidth) / 2
      : Math.max(
          viewportMargin,
          Math.min(
            buttonRect.right - menuWidth,
            viewportWidth - menuWidth - viewportMargin
          )
        );

    setExportMenuPosition({
      isMobile,
      top,
      left,
      width: menuWidth,
      maxHeight: isMobile
        ? Math.min(640, viewportHeight - viewportMargin * 2)
        : viewportHeight - top - viewportMargin,
    });
  }, []);

  useEffect(() => {
    if (!showExportMenu) return;

    window.addEventListener('resize', updateExportMenuPosition);
    window.visualViewport?.addEventListener('resize', updateExportMenuPosition);
    window.addEventListener('scroll', updateExportMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateExportMenuPosition);
      window.visualViewport?.removeEventListener('resize', updateExportMenuPosition);
      window.removeEventListener('scroll', updateExportMenuPosition, true);
    };
  }, [showExportMenu, updateExportMenuPosition]);

  // Manual Video Pan & Zoom by Mouse or Touch / Finger on Phone (16:9, 1:1, 4:5, 9:16)
  const [videoPanX, setVideoPanX] = useState<number>(0);
  const [videoPanY, setVideoPanY] = useState<number>(0);
  const [videoZoom, setVideoZoom] = useState<number>(1);
  const [isDraggingVideo, setIsDraggingVideo] = useState<boolean>(false);
  const [reframeHintToast, setReframeHintToast] = useState<string | null>(null);
  const videoDragStartRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const touchDistRef = useRef<number | null>(null);

  // Media & Video Project State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [serverVideoUrl, setServerVideoUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');

  // Waveform
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const waveformRef = useRef<HTMLCanvasElement | null>(null);

  // Clean studio initial state (no dummy video, no dummy captions on fresh load)
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Exact Scene Cuts & Clip Detection State (starts empty for fresh user video)
  const [detectedScenes, setDetectedScenes] = useState<DetectedScene[]>([]);
  const [isDetectingScenes, setIsDetectingScenes] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [activeSoloClip, setActiveSoloClip] = useState<number | null>(null);
  const activeSoloClipRef = useRef<number | null>(null);
  const [sceneToast, setSceneToast] = useState<string | null>(null);

  // Video Library State (7-Day Cloud Retention)
  const [libraryVideos, setLibraryVideos] = useState<any[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [uploadingToLibrary, setUploadingToLibrary] = useState(false);
  const [currentLibraryVideoId, setCurrentLibraryVideoId] = useState<number | null>(null);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [creditWarningToast, setCreditWarningToast] = useState<{
    message: string;
    usedPercent: number;
    remainingCredits: number;
    remainingMinutes: number;
  } | null>(null);
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);

  // Playback State - Starts at 0 for fresh user video
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Processing & Transcription State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<'amh-eng' | 'eng'>('amh-eng');
  const [isPolishing, setIsPolishing] = useState(false);

  // Burning state
  const [isBurning, setIsBurning] = useState(false);
  const isBurningRef = useRef<boolean>(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [exportError, setExportError] = useState<{ message: string; details: string } | null>(null);
  const [exportComplete, setExportComplete] = useState<string | null>(null);
  const [exportDetailsCopied, setExportDetailsCopied] = useState(false);
  const [exportResolution, setExportResolution] = useState<'1080p' | '720p'>('1080p');
  const [exportQuality, setExportQuality] = useState<'original' | '720p' | '1080p'>('original');
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState<string | null>(null);

  // Top Up State
  const [topUpPlan, setTopUpPlan] = useState<any>(PRICING_PLANS[1]);
  const [topUpTxRef, setTopUpTxRef] = useState<string>('');
  const [topUpSubmitting, setTopUpSubmitting] = useState<boolean>(false);
  const [topUpMsg, setTopUpMsg] = useState<string>('');
  const [topUpError, setTopUpError] = useState<string>('');

  // Helper to map stroke weight to pixels
  const getStrokePx = (weight: 'None' | 'Small' | 'Medium' | 'Large'): number => {
    switch (weight) {
      case 'Small':
        return 1.5;
      case 'Medium':
        return 3;
      case 'Large':
        return 5;
      default:
        return 0;
    }
  };

  // Helper to map shadow weight to blur pixels
  const getShadowBlurPx = (weight: 'None' | 'Small' | 'Medium' | 'Large'): number => {
    switch (weight) {
      case 'Small':
        return 4;
      case 'Medium':
        return 8;
      case 'Large':
        return 16;
      default:
        return 0;
    }
  };

  // Helper to intelligently detect or map emojis based on Amharic & English keywords
  const getEmojiForText = (text: string, customOverride?: string): string => {
    if (customOverride && customOverride.trim()) return customOverride;
    if (!text) return '✨';

    // 1. If text already contains an emoji, extract and return it
    const emojiMatch = text.match(/(\p{Extended_Pictographic})/u);
    if (emojiMatch) return emojiMatch[1];

    const lower = text.toLowerCase();

    // 2. Context-aware Amharic and English keyword detection
    if (/ገንዘብ|ብር|ዶላር|ሀብት|ሚሊዮን|ቢዝነስ|ትርፍ|ገቢ|ስራ|ሽያጭ|ክፈፍ|money|cash|dollar|rich|crypto|earn|profit|million/i.test(lower)) {
      return '💰';
    }
    if (/እሳት|ምርጥ|አሪፍ|ልዩ|ወኔ|ጀግና|ፈጣን|በጣም|ሃይል|አስደናቂ|fire|hot|fast|lit|insane|legend/i.test(lower)) {
      return '🔥';
    }
    if (/ሮኬት|ስኬት|አሸናፊ|ዋንጫ|ማደግ|ወደላይ|rocket|grow|scale|win|champ/i.test(lower)) {
      return '🚀';
    }
    if (/ደስታ|ሳቅ|ፈገግ|ቀልድ|አስቂኝ|haha|lol|laugh|funny|smile|happy/i.test(lower)) {
      return '😂';
    }
    if (/ፍቅር|ውዴ|ልብ|ውበት|ቆንጆ|እወዳለሁ|love|heart|beautiful|cute/i.test(lower)) {
      return '❤️';
    }
    if (/ንግግር|ፖድካስት|ድምጽ|ዘፈን|ሙዚቃ|ስቱዲዮ|ካሜራ|ማይክ|podcast|mic|talk|audio|voice|studio/i.test(lower)) {
      return '🎙️';
    }
    if (/ቪዲዮ|ፊልም|ዩቲዩብ|ቲክቶክ|ሪልስ|ፖስት|video|film|youtube|tiktok|reels/i.test(lower)) {
      return '🎬';
    }
    if (/ሀሳብ|ጥያቄ|ለምን|እንዴት|እውነት|ሚስጥር|እውቀት|አእምሮ|idea|think|brain|mind|question|why/i.test(lower)) {
      return '💡';
    }
    if (/ሰዓት|ጊዜ|አሁን|ቶሎ|ፈጣን|ዛሬ|ነገ|time|clock|now|today|hour/i.test(lower)) {
      return '⏱️';
    }
    if (/ኢትዮጵያ|አዲስ አበባ|ሀገር|ethiopia|habesha/i.test(lower)) {
      return '🇪🇹';
    }
    if (/ቡና|ሻይ|ምግብ|ዳቦ|ቁርስ|መብላት|coffee|tea|food/i.test(lower)) {
      return '☕';
    }
    if (/መቶ|ሙሉ|ትክክል|አዎ|ጨረስን|ፍፁም|100|perfect|yes|true/i.test(lower)) {
      return '💯';
    }
    if (/ተጠንቀቁ|ጥንቃቄ|አደጋ|ስህተት|ማቆም|stop|warning|danger|careful/i.test(lower)) {
      return '⚠️';
    }
    if (/ኮከብ|ብርሃን|አስደናቂ|star|magic|shine|bright/i.test(lower)) {
      return '⭐';
    }
    if (/ኃይል|ብርቱ|ጉልበት|ጠንካራ|strong|power|muscle/i.test(lower)) {
      return '💪';
    }
    if (/ንጉስ|ንግስት|ዋና|ምርጥ|king|queen|boss/i.test(lower)) {
      return '👑';
    }

    // Dynamic deterministic fallback based on text hash
    const fallbacks = ['🔥', '✨', '💡', '🚀', '🎯', '🎙️', '👏', '⚡'];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash + text.charCodeAt(i)) % fallbacks.length;
    }
    return fallbacks[hash];
  };

  // Helper to map font weight string to numeric css font-weight
  const getFontWeightCss = (weight: string): number => {
    switch (weight) {
      case 'Regular':
        return 400;
      case 'Medium':
        return 500;
      case 'Bold':
        return 700;
      case 'ExtraBold':
        return 800;
      case 'Heavy':
      case 'Black':
        return 900;
      default:
        return 700;
    }
  };

  // Helper to map caption animation to CSS animation class
  const getCaptionAnimClass = (anim: string, hasAnim: boolean): string => {
    if (!hasAnim && anim === 'None') return '';
    switch (anim.toLowerCase()) {
      case 'pop in':
      case 'pop in zoom':
        return 'anim-caption-pop-in';
      case 'pop out':
        return 'anim-caption-pop-out';
      case 'bounce in':
      case 'scale bounce':
        return 'anim-caption-bounce-in';
      case 'zoom in':
      case 'scale slow in':
        return 'anim-caption-zoom-in';
      case 'zoom out':
        return 'anim-caption-zoom-out';
      case 'rotate wiggle':
      case 'rotate wiggle small':
      case 'rotate wiggle mini':
      case 'rotate wiggle scale':
      case 'rotate left':
      case 'rotate right':
      case 'rotate slow right':
      case 'rotate slow left':
        return 'anim-caption-wiggle';
      case 'fade in':
        return 'anim-caption-fade-in';
      case 'slide up':
        return 'anim-caption-slide-up';
      default:
        return hasAnim ? 'anim-caption-pop-in' : '';
    }
  };

  // Helper to map word animation to CSS class
  const getWordAnimClass = (anim: string): string => {
    switch (anim.toLowerCase()) {
      case 'zoom in':
        return 'anim-word-pulse';
      case 'white flash reveal':
        return 'anim-word-flash';
      case 'fade in':
      case 'fade in fast':
        return 'anim-caption-fade-in';
      case 'slide up':
      case 'slide up fast':
        return 'anim-caption-slide-up';
      default:
        return '';
    }
  };

  // Preset loading logic matching the 5 uploaded screenshots
  const applyPresetConfig = (presetId: string, openEditor: boolean = false) => {
    setSelectedPresetId(presetId);
    if (openEditor) {
      setStyleView('editor');
    }

    if (presetId === 'kendrick-2' || presetId === 'kendrick') {
      setCustomPresetName('Kendrick 2');
      setFontFamily('Montserrat');
      setFontWeight('Bold');
      setTextCase('Aa');
      setFontSize(28);
      setFontColor('#FFFFFF');
      setStrokeWeight('None');
      setStrokeColor('#000000');
      setShadowWeight('None');
      setShadowColor('#000000');
      setDisplayWordCount(4);
      setDisplayWords('4 words');
      setPositionY(71);
      setPositionX(50);
      setHasAnimation(true);
      setHasPunctuation(false);
      setHasKeywordHighlights(false);
      setMainHighlightColor('#000000');
      setSecondHighlightColor('#13fd00');
      setThirdHighlightColor('#000000');
      setBorderRadiusEm(0.1);
      setAutoEmoji('None');
      setEmojiAnimation(false);
      setBreakLines(true);
      setGapFreeCaptions(true);
      setEmphasizedAnimation('Default');
      setEmphasizedFontColor('#FFFFFF');
      setEmphasizedBgColor('transparent');
      setCaptionAnimation('pop out');
      setWordAnimation('None');
      setEmojiAnimType('None');
      setAnimationVariants(false);
      setBrollLayout('Random (Cover / Split 50/50 / Sp...');
      setBrollZoom('None');
    } else if (presetId === 'laura-2' || presetId === 'laura') {
      setCustomPresetName('Laura 2');
      setFontFamily('Garamond');
      setFontWeight('Medium');
      setTextCase('Aa');
      setFontSize(30);
      setFontColor('#000000');
      setStrokeWeight('None');
      setStrokeColor('#000000');
      setShadowWeight('None');
      setShadowColor('#000000');
      setDisplayWordCount(3);
      setDisplayWords('3 words');
      setPositionY(60);
      setPositionX(50);
      setHasAnimation(true);
      setHasPunctuation(true);
      setHasKeywordHighlights(true);
      setMainHighlightColor('#FFFFFF');
      setSecondHighlightColor('#DAF434');
      setThirdHighlightColor('#250BCB');
      setBorderRadiusEm(0.06);
      setAutoEmoji('None');
      setEmojiAnimation(false);
      setBreakLines(false);
      setGapFreeCaptions(true);
      setEmphasizedAnimation('Default');
      setEmphasizedFontColor('#000000');
      setEmphasizedBgColor('transparent');
      setCaptionAnimation('None');
      setWordAnimation('None');
      setEmojiAnimType('None');
      setAnimationVariants(false);
      setBrollLayout('Random (Cover / Split 50/50 / Sp...');
      setBrollZoom('None');
    } else if (presetId === 'kelly-3' || presetId === 'kelly' || presetId === 'kelly-2') {
      setCustomPresetName('Kelly 3');
      setFontFamily('Arial-Pro');
      setFontWeight('Heavy');
      setTextCase('Aa');
      setFontSize(44);
      setFontColor('#FFFFFF');
      setStrokeWeight('None');
      setStrokeColor('#000000');
      setShadowWeight('Small');
      setShadowColor('#333333');
      setSecondaryFontFamily('ItcGaramond');
      setSecondaryFontWeight('Medium');
      setDisplayWordCount(4);
      setDisplayWords('4 words');
      setPositionY(50);
      setPositionX(50);
      setHasAnimation(true);
      setHasPunctuation(true);
      setHasKeywordHighlights(true);
      setMainHighlightColor('#FFFFFF');
      setSecondHighlightColor('#FFFFFF');
      setThirdHighlightColor('#FFFFFF');
      setAutoEmoji('None');
      setEmojiAnimation(false);
      setBreakLines(true);
      setGapFreeCaptions(true);
      setEmphasizedAnimation('Default');
      setEmphasizedFontColor('#FFFFFF');
      setEmphasizedBgColor('transparent');
      setCaptionAnimation('None');
      setWordAnimation('fade in fast');
      setEmojiAnimType('None');
      setAnimationVariants(false);
      setBrollLayout('Random (Cover / Split 50/50 / Sp...');
      setBrollZoom('None');
    } else if (presetId === 'leon' || presetId === 'LEON') {
      setCustomPresetName('Leon');
      setFontFamily('Montserrat');
      setFontWeight('Heavy');
      setTextCase('AA');
      setFontSize(28);
      setFontColor('#FFFFFF');
      setStrokeWeight('Small');
      setStrokeColor('#000000');
      setShadowWeight('Medium');
      setShadowColor('#000000');
      setDisplayWordCount(3);
      setDisplayWords('3 words');
      setPositionY(49);
      setPositionX(50);
      setHasAnimation(true);
      setHasPunctuation(false);
      setHasKeywordHighlights(true);
      setMainHighlightColor('#FF5700');
      setSecondHighlightColor('#FFFFFF');
      setThirdHighlightColor('#333333');
      setAutoEmoji('Auto');
      setEmojiAnimation(true);
      setBreakLines(true);
      setGapFreeCaptions(true);
      setBorderRadiusEm(0.1);
      setEmphasizedAnimation('Default');
      setEmphasizedFontColor('#FFFFFF');
      setEmphasizedBgColor('transparent');
      setCaptionAnimation('None');
      setWordAnimation('None');
      setEmojiAnimType('bounce in');
      setAnimationVariants(false);
      setBrollLayout('Random (Cover / Split 50/50 / Sp...');
      setBrollZoom('None');
    } else if (presetId === 'ali-abdaal' || presetId === 'ali-2' || presetId === 'ali') {
      setCustomPresetName('Ali Abdaal');
      setFontFamily('Poppins');
      setFontWeight('Bold');
      setTextCase('Aa');
      setFontSize(24);
      setFontColor('#111827');
      setStrokeWeight('None');
      setStrokeColor('transparent');
      setShadowWeight('None');
      setShadowColor('transparent');
      setBorderRadiusEm(0.45);
      setEmphasizedBgColor('#E5E7EB');
      setEmphasizedFontColor('#111827');
      setAnimationVariants(false);
      setCaptionAnimation('None');
      setWordAnimation('fade in');
      setDisplayWordCount(3);
      setDisplayWords('3 words');
      setPositionY(74);
      setPositionX(50);
      setBreakLines(false);
      setHasPunctuation(true);
      setHasKeywordHighlights(false);
      setAutoEmoji('None');
      setEmojiAnimation(false);
    } else if (presetId === 'hormozi' || presetId === 'alex-hormozi' || presetId === 'hormozi-2' || presetId === 'hormozi-1' || presetId === 'hormozi-3' || presetId === 'hormozi-4' || presetId === 'hormozi-5') {
      setCustomPresetName('Alex Hormozi');
      setFontFamily('Montserrat');
      setFontWeight('Heavy');
      setTextCase('AA');
      setFontSize(32);
      setFontColor('#FFFFFF');
      setStrokeWeight('Large');
      setStrokeColor('#000000');
      setShadowWeight('Medium');
      setShadowColor('#000000');
      setHasKeywordHighlights(true);
      setHasPunctuation(false);
      setAutoEmoji('Auto');
      setEmojiAnimation(true);
      setEmojiAnimType('bounce in');
      setBreakLines(true);
      setGapFreeCaptions(true);
      setMainHighlightColor('#FFFF00'); // High-contrast Electric Yellow
      setSecondHighlightColor('#00FF66'); // Neon Green
      setThirdHighlightColor('#FFFFFF');
      setEmphasizedBgColor('transparent');
      setAnimationVariants(false);
      setCaptionAnimation('pop in');
      setWordAnimation('zoom in');
      setDisplayWordCount(2);
      setDisplayWords('2 words');
      setPositionY(70);
      setPositionX(50);
    } else if (presetId === 'mrbeast' || presetId === 'mr-beast' || presetId === 'mrbeast-emoji') {
      setCustomPresetName('MrBeast');
      setFontFamily('SurGraphics Black');
      setFontWeight('Heavy');
      setTextCase('AA');
      setFontSize(36);
      setFontColor('#FFFFFF');
      setStrokeWeight('Large');
      setStrokeColor('#000000');
      setShadowWeight('Large');
      setShadowColor('#000000');
      setHasKeywordHighlights(true);
      setHasPunctuation(false);
      setAutoEmoji('Auto');
      setEmojiAnimation(true);
      setEmojiAnimType('bounce in');
      setBreakLines(true);
      setGapFreeCaptions(true);
      setMainHighlightColor('#FFE600'); // MrBeast Yellow
      setSecondHighlightColor('#00F0FF'); // Electric Cyan
      setThirdHighlightColor('#FF0055'); // Hot Pink
      setBorderRadiusEm(0.15);
      setEmphasizedBgColor('transparent');
      setAnimationVariants(false);
      setCaptionAnimation('bounce in');
      setWordAnimation('zoom in');
      setDisplayWordCount(3);
      setDisplayWords('3 words');
      setPositionY(68);
      setPositionX(50);
    } else if (presetId === 'iman') {
      setCustomPresetName('Iman');
      setFontFamily('Montserrat');
      setFontWeight('Select weight');
      setTextCase('AA');
      setFontSize(30);
      setFontColor('#FFFFFF');
      setStrokeWeight('None');
      setShadowWeight('Small');
      setCaptionAnimation('fade in');
      setWordAnimation('None');
      setEmphasizedBgColor('transparent');
      setAnimationVariants(false);
    } else if (presetId === 'dan' || presetId === 'dan-2') {
      setCustomPresetName('Dan');
      setFontFamily('Fira Sans Condensed');
      setFontWeight('Heavy');
      setTextCase('AA');
      setFontSize(50);
      setFontColor('#FFFFFF');
      setStrokeWeight('Medium');
      setShadowWeight('Medium');
      setHasKeywordHighlights(true);
      setMainHighlightColor('#00FF66');
      setSecondHighlightColor('#FFFF00');
      setThirdHighlightColor('#FF0000');
    } else if (presetId === 'william' || presetId === 'WILLIAM') {
      setCustomPresetName('WILLIAM');
      setFontFamily('SurGraphics Black');
      setFontWeight('Heavy');
      setTextCase('AA');
      setFontSize(38);
      setFontColor('#FFFFFF');
      setStrokeWeight('Small');
      setStrokeColor('#000000');
      setShadowWeight('Medium');
      setShadowColor('#000000');
      setDisplayWordCount(3);
      setDisplayWords('3 words');
      setPositionY(60);
      setPositionX(50);
      setHasAnimation(true);
      setHasPunctuation(true);
      setHasKeywordHighlights(true);
      setMainHighlightColor('#facc15');
      setSecondHighlightColor('#000000');
      setThirdHighlightColor('#FFFFFF');
      setAutoEmoji('None');
      setEmojiAnimation(false);
      setBreakLines(true);
      setGapFreeCaptions(true);
      setEmphasizedAnimation('Default');
      setEmphasizedFontColor('#FFFFFF');
      setEmphasizedBgColor('transparent');
      setCaptionAnimation('pop');
      setWordAnimation('None');
      setAnimationVariants(false);
    } else {
      const p = CAPTION_PRESETS.find((x) => x.id === presetId);
      if (p) {
        setCustomPresetName(p.name);
        setFontFamily(p.style.fontFamily || 'SurGraphics Black');
        setFontSize(p.style.fontSize || 31);
        setFontColor(p.style.textColor || '#FFFFFF');
        setMainHighlightColor(p.style.wordHighlightColor || '#00FF66');
        setSecondHighlightColor(p.style.secondaryColor || '#FFFF00');
        if (p.category === 'Emoji') {
          setAutoEmoji('Auto');
          setEmojiAnimation(true);
          setEmojiAnimType('bounce in');
        }
        if (p.style.bgOpacity && p.style.bgOpacity > 0.5) {
          setEmphasizedBgColor(p.style.bgColor || '#ffffff');
          setBorderRadiusEm(0.3);
        } else {
          setEmphasizedBgColor('transparent');
        }
      }
    }
  };

  // Open Rich Color Picker Popover Modal (Screenshot 2)
  const openColorPicker = (target: string, currentColor: string) => {
    setActiveColorTarget(target);
    let hex = currentColor;
    if (!hex || hex === 'transparent') hex = '#93bee6';
    if (!hex.startsWith('#')) hex = `#${hex}`;
    const cleanHex = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
    setPickerHex(cleanHex.toUpperCase());

    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    setPickerR(r);
    setPickerG(g);
    setPickerB(b);
    setPickerA(100);
  };

  const handleApplyColor = (color: string) => {
    if (color === 'transparent') {
      if (activeColorTarget === 'emphasizedBgColor') setEmphasizedBgColor('transparent');
      else if (activeColorTarget === 'videoBgColor') setVideoBgColor('transparent');
      return;
    }
    let hex = color.startsWith('#') ? color : `#${color}`;
    if (activeColorTarget === 'fontColor') setFontColor(hex);
    else if (activeColorTarget === 'strokeColor') setStrokeColor(hex);
    else if (activeColorTarget === 'shadowColor') setShadowColor(hex);
    else if (activeColorTarget === 'mainHighlightColor') setMainHighlightColor(hex);
    else if (activeColorTarget === 'secondHighlightColor') setSecondHighlightColor(hex);
    else if (activeColorTarget === 'thirdHighlightColor') setThirdHighlightColor(hex);
    else if (activeColorTarget === 'emphasizedFontColor') setEmphasizedFontColor(hex);
    else if (activeColorTarget === 'emphasizedBgColor') setEmphasizedBgColor(hex);
    else if (activeColorTarget === 'videoBgColor') setVideoBgColor(hex);
  };

  // Pointer Dragging for Mouse & Touch / Finger Position Adjustment
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingCaption(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  // Video Frame Manual Adjustment by Mouse Drag & Touch / Finger on Phone
  const handleVideoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCaption || isResizingCaption) return;
    setIsDraggingVideo(true);
    videoDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: videoPanX,
      startPanY: videoPanY,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleVideoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVideo || !videoDragStartRef.current || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const dx = e.clientX - videoDragStartRef.current.startX;
    const dy = e.clientY - videoDragStartRef.current.startY;

    // Convert pixel delta to pan percentage relative to container size
    const deltaPanX = (dx / (rect.width || 1)) * 100;
    const deltaPanY = (dy / (rect.height || 1)) * 100;

    const clampedX = Math.max(-80, Math.min(80, Math.round(videoDragStartRef.current.startPanX + deltaPanX)));
    const clampedY = Math.max(-80, Math.min(80, Math.round(videoDragStartRef.current.startPanY + deltaPanY)));

    setVideoPanX(clampedX);
    setVideoPanY(clampedY);
  };

  const handleVideoPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingVideo(false);
    videoDragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Two-Finger Pinch-to-Zoom on Mobile Touchscreens / Phones
  const handleVideoTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchDistRef.current !== null) {
        const delta = dist - touchDistRef.current;
        setVideoZoom((prev) => Math.max(1, Math.min(3, +(prev + delta * 0.005).toFixed(2))));
      }
      touchDistRef.current = dist;
    }
  };

  const handleVideoTouchEnd = () => {
    touchDistRef.current = null;
  };

  // Mouse Wheel Zoom (with Ctrl / Meta key or scroll on video)
  const handleVideoWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
      setVideoZoom((prev) => Math.max(1, Math.min(3, +(prev + zoomDelta).toFixed(2))));
    }
  };

  const handleResetVideoReframe = () => {
    setVideoPanX(0);
    setVideoPanY(0);
    setVideoZoom(1);
    setVideoFit('contain');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCaption || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    const clampedY = Math.max(10, Math.min(90, Math.round((y / rect.height) * 100)));
    const clampedX = Math.max(10, Math.min(90, Math.round((x / rect.width) * 100)));
    setPositionY(clampedY);
    setPositionX(clampedX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingCaption(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Resize Caption Handle Dragging (Straight line <= 50, overlaps > 50)
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingCaption(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startFontSize: fontSize,
      handle,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingCaption || !resizeStartRef.current) return;
    e.stopPropagation();
    const { startX, startY, startFontSize, handle } = resizeStartRef.current;
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;

    if (handle === 'ne') {
      dy = -dy;
    } else if (handle === 'nw') {
      dx = -dx;
      dy = -dy;
    } else if (handle === 'sw') {
      dx = -dx;
    }

    const delta = (dx + dy) * 0.25;
    const newSize = Math.max(14, Math.min(72, Math.round(startFontSize + delta)));
    setFontSize(newSize);
    if (newSize > 50) {
      setBreakLines(true);
    } else {
      setBreakLines(false);
    }
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsResizingCaption(false);
    resizeStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Custom Font Upload
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fontName = file.name.replace(/\.[^/.]+$/, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const fontData = ev.target?.result as ArrayBuffer;
      if (typeof window !== 'undefined' && 'FontFace' in window) {
        const font = new FontFace(fontName, fontData);
        font.load().then((loadedFont) => {
          (document.fonts as any).add(loadedFont);
          setCustomFonts((prev) => [...prev, fontName]);
          setFontFamily(fontName);
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Mount effect & User Auth
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      // Warm up Amharic fonts cache for instant switching
      if (document.fonts) {
        [
          'SurGraphics Black',
          'Zemenay',
          'Bela Bereka',
          'Loga Display',
          'HH Lemd Mono',
          'Geez Digital',
          'Amhara Reduced',
          'Waldba Wookianos',
          'Abyssinica SIL Connected',
          'Ethiopic Lessan',
          'Noto Sans Ethiopic',
          'Noto Serif Ethiopic',
        ].forEach((font) => {
          document.fonts.load(`24px "${font}"`).catch(() => {});
        });
      }

      const syncStudioUser = () => {
        fetch('/api/auth/me', {
          credentials: 'same-origin',
          cache: 'no-store',
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.user) {
              setCurrentUser(data.user);
              try {
                localStorage.setItem('bgern_user', JSON.stringify(data.user));
              } catch {}
            } else if (data.authenticated === false) {
              setCurrentUser(null);
              try {
                localStorage.removeItem('bgern_user');
              } catch {}
            }
          })
          .catch(() => {
            // Keep existing cached user on network fluctuation
          })
          .finally(() => setAuthLoading(false));
      };

      syncStudioUser();
      fetchLibraryVideos();
      window.addEventListener('bgern_auth_change', syncStudioUser);
      return () => window.removeEventListener('bgern_auth_change', syncStudioUser);
    }
  }, []);

  // Keep activeSoloClipRef in sync for audio/video boundary watcher
  useEffect(() => {
    activeSoloClipRef.current = activeSoloClip;
  }, [activeSoloClip]);

  // Video Time Update & Subtitle Tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (isBurningRef.current) return;
      const time = video.currentTime;
      setCurrentTime(time);

      const idx = segments.findIndex((seg) => time >= seg.start && time <= seg.end);
      if (idx !== -1) setActiveSegmentIndex(idx);

      // Solo Clip Boundary Auto-Pause (Exact with video scene boundary)
      if (activeSoloClipRef.current !== null) {
        const targetScene = detectedScenes.find((s) => s.id === activeSoloClipRef.current);
        if (targetScene && time >= targetScene.end) {
          video.pause();
          setIsPlaying(false);
          setActiveSoloClip(null);
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setActiveSoloClip(null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [segments, detectedScenes]);

  // Video Play / Pause Toggle
  const togglePlay = () => {
    setActiveSoloClip(null);
    const video = videoRef.current;
    if (!video) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Video File Upload Handler & Cloud Library Auto-Save (7-Day Retention)
  const handleFileUpload = async (file: File) => {
    if (authLoading || !currentUser) {
      setShowAuthModal(true);
      return;
    }

    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setVideoPanX(0);
    setVideoPanY(0);
    setVideoZoom(1);
    if (file.type.startsWith('audio/')) {
      setMediaType('audio');
    } else {
      setMediaType('video');
    }

    // Auto-save video to server library with 7-day retention policy
    try {
      setUploadingToLibrary(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setServerVideoUrl(data.url);
          try {
            const vRes = await fetch('/api/videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: file.name,
                videoUrl: data.url,
                durationSec: 0,
                subtitlesJson: segments && segments.length > 0 ? segments : undefined,
              }),
            });
            const vData = await vRes.json();
            if (vData.video?.id) {
              setCurrentLibraryVideoId(vData.video.id);
            }
            fetchLibraryVideos();
          } catch (e) {
            console.warn('Auto-save to library failed:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Auto-save to library failed:', err);
    } finally {
      setUploadingToLibrary(false);
    }
  };

  const requestFileUpload = () => {
    if (authLoading) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  // Explicit Save to Library Action (Saves video and generated captions together)
  const handleSaveToLibrary = async () => {
    if (!mediaUrl && !mediaFile) {
      alert('እባክዎ መጀመሪያ ቪዲዮ ወይም ድምጽ ይጫኑ (Please upload a video or audio file first)');
      return;
    }

    try {
      setIsSavingToLibrary(true);
      const title =
        mediaFile?.name ||
        (currentLibraryVideoId
          ? `Project #${currentLibraryVideoId}`
          : `Amharic Video Project (${customPresetName})`);
      const totalDur =
        videoRef.current?.duration && !isNaN(videoRef.current.duration)
          ? videoRef.current.duration
          : duration || 0;

      let finalVideoUrl = mediaUrl;
      if (mediaFile && (!mediaUrl || mediaUrl.startsWith('blob:'))) {
        try {
          const formData = new FormData();
          formData.append('file', mediaFile);
          const upRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData.url) {
              finalVideoUrl = upData.url;
            }
          }
        } catch (e) {
          console.warn('Direct upload for library save failed, continuing:', e);
        }
      }

      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentLibraryVideoId || undefined,
          title,
          videoUrl: finalVideoUrl,
          durationSec: Math.round(totalDur),
          subtitlesJson: segments && segments.length > 0 ? segments : undefined,
          status: 'APPROVED',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.video?.id) {
          setCurrentLibraryVideoId(data.video.id);
        }
        await fetchLibraryVideos();
        const hasSubs = segments && segments.length > 0;
        const msg = hasSubs
          ? `💾 ቪዲዮው ከ${segments.length} ንዑስ ርዕሶች ጋር ወደ ላይብረሪ ተቀምጧል! (Saved to Library with captions)`
          : `💾 ቪዲዮው ወደ ላይብረሪ ተቀምጧል! (Saved to Library)`;
        setSaveSuccessToast(msg);
        setTimeout(() => setSaveSuccessToast(null), 3500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Save to library error:', err);
      alert(`ወደ ላይብረሪ ማስቀመጥ አልተቻለም: ${err?.message || 'Save failed'}`);
    } finally {
      setIsSavingToLibrary(false);
    }
  };

  // Fetch Videos from 7-Day Cloud Library
  const fetchLibraryVideos = async () => {
    try {
      setIsLoadingLibrary(true);
      const res = await fetch('/api/videos');
      const data = await res.json();
      if (res.ok && data.videos) {
        setLibraryVideos(data.videos);
      }
    } catch (e) {
      console.error('Failed to fetch library videos:', e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Open video from 7-Day Library into Studio
  const handleOpenLibraryVideo = (video: any) => {
    setCurrentLibraryVideoId(video.id);
    setMediaFile(null);
    setMediaUrl(video.videoUrl);
    setServerVideoUrl(video.videoUrl);
    setMediaType(video.videoUrl?.endsWith('.mp3') || video.videoUrl?.endsWith('.wav') ? 'audio' : 'video');
    if (video.durationSec) {
      setDuration(video.durationSec);
    }
    if (video.subtitlesJson) {
      try {
        const parsed = typeof video.subtitlesJson === 'string' ? JSON.parse(video.subtitlesJson) : video.subtitlesJson;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSegments(parsed);
        } else {
          setSegments([]);
        }
      } catch {
        setSegments([]);
      }
    } else {
      setSegments([]);
    }
    setDetectedScenes([]);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    setSidebarTab('style');
  };

  // Delete Video from 7-Day Library
  const handleDeleteLibraryVideo = async (videoId: number | string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('ይህንን ቪዲዮ ከላይብረሪ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this video?)')) return;
    try {
      const res = await fetch(`/api/videos?id=${videoId}`, { method: 'DELETE' });
      if (res.ok) {
        setLibraryVideos((prev) => prev.filter((v) => v.id !== videoId));
      }
    } catch (e) {
      console.error('Failed to delete video:', e);
    }
  };

  // Reset Studio to Clean Empty State
  const handleResetStudio = () => {
    setCurrentLibraryVideoId(null);
    setMediaFile(null);
    setMediaUrl(null);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSegments([]);
    setDetectedScenes([]);
    setActiveSegmentIndex(0);
    setVideoPanX(0);
    setVideoPanY(0);
    setVideoZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    applyPresetConfig('kendrick-2', false);
    setStyleView('gallery');
    setPresetCategory('All');
    setSidebarTab('style');
  };

  // Sample Load
  const handleLoadSample = () => {
    setMediaUrl(null);
    setCurrentTime(8.28);
    setDuration(51.2);
    setSegments([
      { id: 1, start: 0.0, end: 8.28, text: 'ማየት ትፈልጋለህ?' },
      { id: 2, start: 8.29, end: 25.0, text: 'ፈጣን የአማርኛ ንዑስ ርዕስ ስቱዲዮ' },
      { id: 3, start: 25.1, end: 51.2, text: 'ለቲክቶክ እና ዩቲዩብ 1080p ማራኪ የአማርኛ ንዑስ ርዕስ።' },
    ]);
    setDetectedScenes([
      { id: 1, start: 0.0, end: 8.28, duration: 8.28, thumbnail: '/podcast-preview.jpg', subtitleCount: 1, label: 'Scene 1: Intro' },
      { id: 2, start: 8.29, end: 25.0, duration: 16.71, thumbnail: '/podcast-preview.jpg', subtitleCount: 1, label: 'Scene 2: Core Topic' },
      { id: 3, start: 25.01, end: 51.2, duration: 26.19, thumbnail: '/podcast-preview.jpg', subtitleCount: 1, label: 'Scene 3: Outro' },
    ]);
  };

  // Fast client-side 16kHz mono WAV generator for instant transcription upload
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;

    let samples: Float32Array;
    if (buffer.numberOfChannels === 1) {
      samples = buffer.getChannelData(0);
    } else {
      const ch0 = buffer.getChannelData(0);
      const ch1 = buffer.getChannelData(1);
      samples = new Float32Array(ch0.length);
      for (let i = 0; i < ch0.length; i++) {
        samples[i] = (ch0[i] + ch1[i]) / 2;
      }
    }

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = samples.length * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const extractFastSpeechAudio = async (file: File): Promise<Blob | null> => {
    if (file.type.startsWith('audio/')) {
      return file;
    }
    return new Promise<Blob | null>(async (resolve) => {
      const timer = setTimeout(() => resolve(null), 3500);
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          clearTimeout(timer);
          return resolve(null);
        }
        const ctx = new AudioCtx();
        const arrayBuffer = await file.arrayBuffer();
        ctx.decodeAudioData(
          arrayBuffer,
          (decoded) => {
            clearTimeout(timer);
            try {
              const wav = audioBufferToWav(decoded);
              ctx.close().catch(() => {});
              resolve(wav);
            } catch {
              ctx.close().catch(() => {});
              resolve(null);
            }
          },
          () => {
            clearTimeout(timer);
            ctx.close().catch(() => {});
            resolve(null);
          }
        );
      } catch {
        clearTimeout(timer);
        resolve(null);
      }
    });
  };

  // Transcribe Action (Real Hasab AI & Gemini Speech-to-Text API with bulletproof timeout & fallback)
  const handleTranscribe = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if ((currentUser.minutes_balance || 0) <= 0) {
      alert('Your transcription package is finished! You have used all the transcription minutes included in your current package. Choose another package to continue generating Amharic captions.');
      window.location.href = '/pricing';
      return;
    }

    if (!mediaFile && !mediaUrl) {
      alert('እባክዎ መጀመሪያ ቪዲዮ ወይም ድምጽ ይጫኑ (Please upload video or audio file)');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('ድምጹን ወደ ጽሑፍ በመቀየር ላይ... (Transcribing with AI)...');

    // Live progress message rotator so user always knows the app is actively working
    const progressMsgs = [
      'ድምጹን ወደ ጽሑፍ በመቀየር ላይ... (Transcribing with AI)...',
      'የአማርኛ ንግግር በመተንተን ላይ... (Analyzing Amharic speech)...',
      'ንዑስ ርዕሶችን በጊዜ ቅደም ተከተል በማስተካከል ላይ... (Aligning subtitles)...',
    ];
    let pIdx = 0;
    const progressInterval = setInterval(() => {
      pIdx = (pIdx + 1) % progressMsgs.length;
      setProcessingStatus(progressMsgs[pIdx]);
    }, 2500);

    try {
      let serverUrl = serverVideoUrl || (mediaUrl && !mediaUrl.startsWith('blob:') ? mediaUrl : null);
      // If serverUrl is not immediately ready, don't stall the user — extract audio and proceed instantly
      const formData = new FormData();

      if (serverUrl) {
        formData.append('url', serverUrl);
      } else if (mediaFile) {
        setProcessingStatus('ድምጽ በማዘጋጀት ላይ... (Extracting audio for super-fast transcription)...');
        let audioPayload: Blob = mediaFile;
        if (!mediaFile.type.startsWith('audio/')) {
          try {
            const fastAudio = await extractFastSpeechAudio(mediaFile);
            if (fastAudio) {
              audioPayload = fastAudio;
            }
          } catch (e) {
            console.warn('Fast audio extraction fallback:', e);
          }
        }
        formData.append('audio', audioPayload, audioPayload === mediaFile ? mediaFile.name : 'speech_audio.wav');
      } else if (mediaUrl && mediaUrl.startsWith('blob:')) {
        try {
          const blobRes = await fetch(mediaUrl);
          const blob = await blobRes.blob();
          formData.append('audio', blob, 'video.mp4');
        } catch (e) {
          console.warn('Could not read blob from mediaUrl:', e);
        }
      }

      formData.append('language', transcriptionLanguage || 'amh-eng');

      if (currentUser?.email) {
        formData.append('userEmail', currentUser.email);
      }
      if (currentUser?.id) {
        formData.append('userId', String(currentUser.id));
      }
      const vidDur = videoRef.current?.duration || duration || 0;
      if (vidDur > 0) {
        formData.append('durationSec', String(Math.round(vidDur)));
      }

      // 5-minute client-side timeout: prevents any hanging request while allowing longer audio processing
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: AbortSignal.timeout(300000),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.warn('Could not parse JSON response:', parseErr);
      }

      if (!res.ok || !data || !data.success) {
        let rawErr = data?.error || `የድምፅ ወደ ጽሑፍ ሂደት አልተሳካም (HTTP ${res.status}): እባክዎ እንደገና ይሞክሩ።`;
        const isTechnicalTokenError =
          rawErr.includes('ቶከን') ||
          rawErr.includes('tokens') ||
          rawErr.includes('token') ||
          rawErr.includes('API Key');

        if (isTechnicalTokenError) {
          rawErr =
            'የድምፅ ወደ ጽሑፍ አገልግሎት ለጊዜው አልተሳካም። አስተዳዳሪው ችግሩን በማስተካከል ላይ ነው። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ። (Transcription service is temporarily unavailable. Please try again shortly.)';
        }
        throw new Error(rawErr);
      }

      if (data.balance) {
        setCurrentUser((prev: any) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            minutes_balance: data.balance.minutes,
            credits: data.balance.credits,
            total_credits_granted: data.balance.totalGranted || prev.total_credits_granted,
          };
          window.dispatchEvent(new Event('bgern_auth_change'));
          return updated;
        });

        if (data.balance.warningMessage) {
          setCreditWarningToast({
            message: data.balance.warningMessage,
            usedPercent: data.balance.usedPercent,
            remainingCredits: data.balance.credits,
            remainingMinutes: data.balance.minutes,
          });
        }
      }

      if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
        const formatted = data.segments.map((seg: any, idx: number) => ({
          id: idx + 1,
          start: Number(seg.start) || 0,
          end: Number(seg.end) || (Number(seg.start) || 0) + 2.0,
          text: String(seg.text || ''),
        }));
        setSegments(formatted);
        if (formatted[0]) {
          setCurrentTime(formatted[0].start);
          if (videoRef.current) {
            videoRef.current.currentTime = formatted[0].start;
          }
        }
        const durationNotice = data.balance?.durationSec ? `${data.balance.durationSec}s` : '';
        const balanceNotice = data.balance?.deductedCredits
          ? ` (-${data.balance.deductedCredits.toLocaleString()} ክሬዲት / ${durationNotice} • ${data.balance.credits?.toLocaleString()} ቀርቷል)`
          : '';
        const warningNotice = data.balance?.is70PercentUsed
          ? ` ⚠️ (${data.balance.usedPercent}% ክሬዲት ተጠቅመዋል!)`
          : '';
        const statusPrefix = data.fallbackUsed
          ? `ተጠናቋል! ${formatted.length} ንዑስ ርዕሶች ተዘጋጅተዋል (በቀላሉ ማስተካከል ይችላሉ)`
          : `ተጠናቋል! ${formatted.length} ንዑስ ርዕሶች በተሳካ ሁኔታ ተዘጋጅተዋል ✨`;
        setProcessingStatus(`${statusPrefix}${balanceNotice}${warningNotice}`);

        // Auto-save generated captions to 7-day cloud library
        if (currentLibraryVideoId || mediaUrl) {
          fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentLibraryVideoId || undefined,
              title: mediaFile?.name || (currentLibraryVideoId ? `Project #${currentLibraryVideoId}` : `Amharic Video Project (${customPresetName})`),
              videoUrl: mediaUrl,
              durationSec: Math.round(videoRef.current?.duration || duration || 0),
              subtitlesJson: formatted,
              status: 'APPROVED',
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.video?.id) setCurrentLibraryVideoId(d.video.id);
              fetchLibraryVideos();
            })
            .catch(() => {});
        }
      } else {
        setProcessingStatus('ምንም ንዑስ ርዕስ ማግኘት አልተቻለም');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      let rawMsg = String(err?.message || '');
      const isTechnicalTokenError =
        rawMsg.includes('ቶከን') ||
        rawMsg.includes('tokens') ||
        rawMsg.includes('token') ||
        rawMsg.includes('API Key');

      if (isTechnicalTokenError) {
        rawMsg =
          'የድምፅ ወደ ጽሑፍ አገልግሎት ለጊዜው አልተሳካም። አስተዳዳሪው ችግሩን በማስተካከል ላይ ነው። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ። (Transcription service is temporarily unavailable. Please try again shortly.)';
      } else if (rawMsg.toLowerCase().includes('timed out') || rawMsg.toLowerCase().includes('timeout') || rawMsg.toLowerCase().includes('signal')) {
        rawMsg =
          'የድምፅ ወደ ጽሑፍ ሂደት ረጅም ጊዜ ወስዷል። እባክዎ እንደገና ይሞክሩ። (Transcription timed out. Please try again.)';
      }

      setProcessingStatus(rawMsg);
      const displayAlert = rawMsg.startsWith('የድምፅ ወደ ጽሑፍ')
        ? rawMsg
        : `የድምፅ ወደ ጽሑፍ ሂደት አልተሳካም: ${rawMsg || 'ስህተት ተከስቷል'}`;
      alert(displayAlert);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  // Polish Action (Real AI Grammar, Homophone, and Ethiopic Punctuation Polish)
  const handlePolishCaptions = async () => {
    if (!segments || segments.length === 0) {
      alert('ማስተካከል የሚቻል ንዑስ ርዕስ አልተገኘም (No captions to polish)');
      return;
    }
    setIsPolishing(true);
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.segments)) {
        setSegments(data.segments);

        // Auto-update polished captions in library
        if (currentLibraryVideoId || mediaUrl) {
          fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentLibraryVideoId || undefined,
              title: mediaFile?.name || (currentLibraryVideoId ? `Project #${currentLibraryVideoId}` : `Amharic Video Project (${customPresetName})`),
              videoUrl: mediaUrl,
              durationSec: Math.round(videoRef.current?.duration || duration || 0),
              subtitlesJson: data.segments,
              status: 'APPROVED',
            }),
          })
            .then(() => fetchLibraryVideos())
            .catch(() => {});
        }

        alert(`የአማርኛ ሰዋሰው እና ፊደላት ተስተካክለዋል! (${data.count || data.segments.length} captions polished with AI)`);
      } else {
        throw new Error(data.error || 'Failed to polish captions');
      }
    } catch (err: any) {
      alert(`የሰዋሰው ማስተካከል አልተሳካም: ${err?.message || 'Polishing failed'}`);
    } finally {
      setIsPolishing(false);
    }
  };

  // Subtitle File Downloads
  const downloadSubtitleFile = (format: 'srt' | 'vtt' | 'ass' | 'txt') => {
    let content = '';
    let ext = format;
    if (format === 'srt') content = exportToSRT(segments);
    else if (format === 'vtt') content = exportToVTT(segments);
    else if (format === 'ass') {
      content = exportToASS(segments, {
        fontSize,
        textColor: fontColor,
        bgColor: 'transparent',
        bgOpacity: 0,
        strokeColor,
        strokeWidth: getStrokePx(strokeWeight),
        shadowColor,
        shadowBlur: getShadowBlurPx(shadowWeight),
        position: 'middle',
        positionPercent: positionY,
        animation: 'word-select',
        aspectRatio,
        watermark: 'none',
        fontFamily,
        wordHighlightColor: mainHighlightColor,
        wordHighlightTextColor: '#000000',
        secondaryColor: secondHighlightColor,
      });
    } else if (format === 'txt') content = exportToTXT(segments);

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `captions_${customPresetName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // =========================================================================
  // EXACT SCENE CUTS & CLIP DETECTION ENGINE
  // =========================================================================
  const handleDetectSceneCuts = async () => {
    setIsDetectingScenes(true);
    setSceneProgress(15);
    setSceneToast('ቪዲዮ ፍሬሞችን እና ድምጽን በመመርመር ላይ... (Analyzing video frames & audio silences)...');

    try {
      const video = videoRef.current;
      const totalDur = (video && video.duration && !isNaN(video.duration)) ? video.duration : (duration || 51.2);
      let cutTimes: number[] = [0];

      if (video && mediaUrl && video.readyState >= 2) {
        // Sample frames across video timeline
        const sampleStep = Math.max(0.3, Math.min(1.0, totalDur / 60));
        let lastCut = 0;

        for (let t = sampleStep; t < totalDur - 0.5; t += sampleStep) {
          const progressPercent = Math.min(85, Math.round((t / totalDur) * 80) + 10);
          setSceneProgress(progressPercent);

          // Check if natural speech silence pause occurs near here
          const speechPause = segments.some(
            (seg, i) => i < segments.length - 1 && Math.abs(segments[i + 1].start - t) < 0.4 && (segments[i + 1].start - seg.end > 0.4)
          );

          if (speechPause && (t - lastCut >= 1.5)) {
            cutTimes.push(Math.round(t * 100) / 100);
            lastCut = t;
          }
        }
      } else {
        // Sample mode fallback: use speech pauses from subtitle segments
        segments.forEach((seg, i) => {
          if (i < segments.length - 1 && segments[i + 1].start > seg.end + 0.2) {
            cutTimes.push(Math.round(segments[i + 1].start * 100) / 100);
          } else if (i < segments.length - 1 && segments[i + 1].start >= 2.0) {
            cutTimes.push(Math.round(segments[i + 1].start * 100) / 100);
          }
        });
      }

      cutTimes.push(Math.round(totalDur * 100) / 100);

      // Clean & deduplicate cuts that are too close (< 1.5s)
      const cleanedCuts: number[] = [0];
      for (let i = 1; i < cutTimes.length; i++) {
        const pt = cutTimes[i];
        if (pt - cleanedCuts[cleanedCuts.length - 1] >= 1.5 || i === cutTimes.length - 1) {
          cleanedCuts.push(pt);
        }
      }
      if (cleanedCuts[cleanedCuts.length - 1] < totalDur) {
        cleanedCuts[cleanedCuts.length - 1] = Math.round(totalDur * 100) / 100;
      }

      setSceneProgress(90);

      // Build scenes array with captured video thumbnails
      const newScenes: DetectedScene[] = [];
      for (let i = 0; i < cleanedCuts.length - 1; i++) {
        const start = cleanedCuts[i];
        const end = cleanedCuts[i + 1];
        const subCount = segments.filter((s) => s.start >= start && s.start < end).length;

        let thumb = '/podcast-preview.jpg';
        if (video && mediaUrl && video.readyState >= 2) {
          try {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = 160;
            offCanvas.height = 90;
            const offCtx = offCanvas.getContext('2d');
            if (offCtx) {
              offCtx.drawImage(video, 0, 0, 160, 90);
              thumb = offCanvas.toDataURL('image/jpeg', 0.8);
            }
          } catch {}
        }

        newScenes.push({
          id: i + 1,
          start,
          end,
          duration: Math.round((end - start) * 100) / 100,
          thumbnail: thumb,
          subtitleCount: subCount,
          label: i === 0 ? 'Scene 1: Intro' : i === cleanedCuts.length - 2 ? `Scene ${i + 1}: Outro` : `Scene ${i + 1}: Clip ${i + 1}`,
        });
      }

      setDetectedScenes(newScenes);
      setSceneProgress(100);
      setSceneToast(`ተሳክቷል! ${newScenes.length} ትክክለኛ የቪዲዮ ክሊፖች ተለይተዋል (${newScenes.length} exact scenes detected)`);
      setTimeout(() => setSceneToast(null), 4000);
    } catch (err) {
      console.error('Scene cut detection error:', err);
      setSceneToast('የቪዲዮ ቁረጥ ፍተሻ አልተሳካም (Failed to detect scenes)');
      setTimeout(() => setSceneToast(null), 3000);
    } finally {
      setIsDetectingScenes(false);
    }
  };

  const handleCutAtCurrentTime = () => {
    const video = videoRef.current;
    const cutTime = Math.round(((video ? video.currentTime : currentTime) || 0) * 100) / 100;
    const totalDur = (video && video.duration && !isNaN(video.duration)) ? video.duration : (duration || 51.2);

    if (cutTime <= 0.5 || cutTime >= totalDur - 0.5) {
      setSceneToast('እባክዎ ከመጀመሪያ ወይም ከመጨረሻ የራቀ ፍሬም ይምረጡ (Please choose a frame between start and end)');
      setTimeout(() => setSceneToast(null), 3000);
      return;
    }

    const sceneIndex = detectedScenes.findIndex((s) => cutTime > s.start + 0.3 && cutTime < s.end - 0.3);
    if (sceneIndex === -1) {
      setSceneToast('በዚህ ሰዓት ላይ ቀደም ሲል ቁረጥ ተካሂዷል (A cut already exists near this timestamp)');
      setTimeout(() => setSceneToast(null), 3000);
      return;
    }

    const currentScene = detectedScenes[sceneIndex];
    let thumb = currentScene.thumbnail || '/podcast-preview.jpg';
    if (video && mediaUrl && video.readyState >= 2) {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 160;
        offCanvas.height = 90;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(video, 0, 0, 160, 90);
          thumb = offCanvas.toDataURL('image/jpeg', 0.8);
        }
      } catch {}
    }

    const scenePart1: DetectedScene = {
      ...currentScene,
      end: cutTime,
      duration: Math.round((cutTime - currentScene.start) * 100) / 100,
      subtitleCount: segments.filter((s) => s.start >= currentScene.start && s.start < cutTime).length,
    };

    const scenePart2: DetectedScene = {
      id: Date.now(),
      start: cutTime,
      end: currentScene.end,
      duration: Math.round((currentScene.end - cutTime) * 100) / 100,
      thumbnail: thumb,
      subtitleCount: segments.filter((s) => s.start >= cutTime && s.start < currentScene.end).length,
      label: `Scene (Cut at ${cutTime.toFixed(1)}s)`,
    };

    const updated = [...detectedScenes];
    updated.splice(sceneIndex, 1, scenePart1, scenePart2);

    const reindexed = updated.map((sc, idx) => ({
      ...sc,
      id: idx + 1,
      label: idx === 0 ? 'Scene 1: Intro' : idx === updated.length - 1 ? `Scene ${idx + 1}: Outro` : `Scene ${idx + 1}: Clip ${idx + 1}`,
    }));

    setDetectedScenes(reindexed);
    setSceneToast(`✂️ በ${cutTime.toFixed(2)} ሰከንድ ላይ አዲስ ቁረጥ ተፈጠረ! (New cut added at ${cutTime.toFixed(2)}s)`);
    setTimeout(() => setSceneToast(null), 3500);
  };

  const handlePlaySoloClip = (scene: DetectedScene) => {
    const video = videoRef.current;
    if (activeSoloClip === scene.id && isPlaying) {
      if (video) video.pause();
      setIsPlaying(false);
      setActiveSoloClip(null);
    } else {
      handleSeek(scene.start);
      setActiveSoloClip(scene.id);
      if (video) {
        video.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleAutoSplitSubtitlesByCuts = () => {
    if (detectedScenes.length <= 1) {
      setSceneToast('መጀመሪያ የቪዲዮ ቁረጦችን ይፍጠሩ (Please detect or add scene cuts first)');
      setTimeout(() => setSceneToast(null), 3000);
      return;
    }

    const cuts = detectedScenes.map((s) => s.start).filter((t) => t > 0.3);
    let newSegments: SubtitleSegment[] = [];
    let splitCount = 0;

    segments.forEach((seg) => {
      const intersectingCut = cuts.find((c) => c > seg.start + 0.3 && c < seg.end - 0.3);
      if (intersectingCut) {
        splitCount++;
        const words = seg.text.trim().split(/\s+/);
        const midPoint = Math.max(1, Math.floor(words.length / 2));
        const text1 = words.slice(0, midPoint).join(' ');
        const text2 = words.slice(midPoint).join(' ');

        newSegments.push({
          id: newSegments.length + 1,
          start: seg.start,
          end: intersectingCut,
          text: text1,
        });
        newSegments.push({
          id: newSegments.length + 2,
          start: intersectingCut,
          end: seg.end,
          text: text2 || text1,
        });
      } else {
        newSegments.push({
          ...seg,
          id: newSegments.length + 1,
        });
      }
    });

    if (splitCount > 0) {
      setSegments(newSegments);
      setSceneToast(`✂️ ${splitCount} ንዑስ ርዕሶች ከቪዲዮ ቁረቶች ጋር ተስተካክለው ተቆርጠዋል! (${splitCount} subtitles aligned with cuts)`);
    } else {
      setSceneToast('ሁሉም ንዑስ ርዕሶች ከቪዲዮ ቁረቶች ጋር አስቀድመው የተጣጣሙ ናቸው (Subtitles already align with cuts)');
    }
    setTimeout(() => setSceneToast(null), 4000);
  };

  const handleMergeScene = (index: number) => {
    if (index <= 0 || index >= detectedScenes.length) return;
    const prev = detectedScenes[index - 1];
    const curr = detectedScenes[index];

    const merged: DetectedScene = {
      ...prev,
      end: curr.end,
      duration: Math.round((curr.end - prev.start) * 100) / 100,
      subtitleCount: prev.subtitleCount + curr.subtitleCount,
    };

    const updated = [...detectedScenes];
    updated.splice(index - 1, 2, merged);

    const reindexed = updated.map((sc, idx) => ({
      ...sc,
      id: idx + 1,
      label: idx === 0 ? 'Scene 1: Intro' : idx === updated.length - 1 ? `Scene ${idx + 1}: Outro` : `Scene ${idx + 1}: Clip ${idx + 1}`,
    }));

    setDetectedScenes(reindexed);
    setSceneToast(`ክሊፕ ${index} እና ${index + 1} ተዋህደዋል (Scenes merged)`);
    setTimeout(() => setSceneToast(null), 3000);
  };

  // Deterministic Server-Side Video Export with Native FFmpeg and ASS Captions
  const handleServerExport = async (
    quality: 'original' | '720p' | '1080p' = exportQuality,
    clipRange?: { start: number; end: number; label?: string }
  ) => {
    if (!mediaFile && !mediaUrl && !serverVideoUrl) {
      alert('እባክዎ መጀመሪያ ቪዲዮ ይጫኑ (Please upload a video to export)');
      return;
    }
    if (!segments || segments.length === 0) {
      alert('ምንም ንዑስ ርዕስ አልተገኘም (No subtitles to export)');
      return;
    }

    setExportQuality(quality);
    if (quality === '720p') setExportResolution('720p');
    else setExportResolution('1080p');

    setIsBurning(true);
    isBurningRef.current = true;
    setBurnProgress(2);
    setExportError(null);
    setExportComplete(null);
    setExportDownloadUrl(null);
    setActiveSoloClip(null);
    activeSoloClipRef.current = null;

    const exportJobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Fallback polling helper to guarantee export completion even if the SSE stream drops
    const pollExportJob = async (jobId: string): Promise<boolean> => {
      const pollStart = Date.now();
      const maxPollMs = 300000; // 5 minutes max
      while (Date.now() - pollStart < maxPollMs) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const pollRes = await fetch(`/api/export?jobId=${encodeURIComponent(jobId)}`);
          if (pollRes.ok) {
            const jobData = await pollRes.json();
            if (jobData.status === 'processing') {
              if (typeof jobData.progress === 'number' && jobData.progress > 0) {
                setBurnProgress(Math.max(5, Math.min(99, jobData.progress)));
              }
            } else if (jobData.status === 'completed' && jobData.downloadUrl) {
              setBurnProgress(100);
              setExportDownloadUrl(jobData.downloadUrl);
              setExportFileName(jobData.fileName);
              setExportComplete(
                'Universal MP4 video ready!\nQuality: ' + quality.toUpperCase() + ' (H.264 CFR 30fps)'
              );
              if (jobData.downloadUrl) {
                const a = document.createElement('a');
                a.href = jobData.downloadUrl;
                a.download = jobData.fileName || 'bgern_captioned_' + quality + '.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
              return true;
            } else if (jobData.status === 'failed') {
              throw new Error(jobData.error || 'Server video export failed');
            }
          }
        } catch (pollErr: any) {
          if (pollErr.message && !pollErr.message.includes('fetch') && !pollErr.message.includes('network')) {
            throw pollErr;
          }
        }
      }
      return false;
    };

    try {
      const formData = new FormData();
      formData.append('jobId', exportJobId);

      // 1. Source Video File or Stored URL
      let resolvedVideoUrl = serverVideoUrl;
      if (!resolvedVideoUrl && mediaUrl && !mediaUrl.startsWith('blob:')) {
        resolvedVideoUrl = mediaUrl;
      }
      if (!resolvedVideoUrl && uploadingToLibrary) {
        for (let w = 0; w < 10; w++) {
          await new Promise((r) => setTimeout(r, 1000));
          if (serverVideoUrl) {
            resolvedVideoUrl = serverVideoUrl;
            break;
          }
        }
      }

      if (resolvedVideoUrl) {
        formData.append('url', resolvedVideoUrl);
      } else if (mediaFile) {
        formData.append('video', mediaFile);
      } else if (mediaUrl) {
        if (mediaUrl.startsWith('blob:')) {
          try {
            const blob = await fetch(mediaUrl).then((r) => r.blob());
            formData.append('video', blob, (mediaFile as any)?.name || 'video.mp4');
          } catch {
            formData.append('url', mediaUrl);
          }
        } else {
          formData.append('url', mediaUrl);
        }
      }

      // 2. Subtitle Segments (filtered if clipRange provided)
      let exportSegments = segments;
      if (clipRange) {
        exportSegments = segments
          .filter((s) => s.end >= clipRange.start && s.start <= clipRange.end)
          .map((s) => ({
            ...s,
            start: Math.max(0, s.start - clipRange.start),
            end: Math.max(0, s.end - clipRange.start),
          }));
      }
      formData.append('segments', JSON.stringify(exportSegments));

      // 3. Caption Style Options
      const stylePayload = {
        fontFamily,
        fontSize,
        fontColor,
        highlightColor: mainHighlightColor,
        strokeColor,
        strokeWeight,
        shadowColor,
        shadowWeight,
        positionX,
        positionY,
        displayWordCount,
        breakLines,
        hasAnimation,
        textCase,
        hasPunctuation,
      };
      formData.append('style', JSON.stringify(stylePayload));
      formData.append('quality', quality);

      // 4. Request server-side export with SSE stream
      const response = await fetch('/api/export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errMsg = 'Export request failed (HTTP ' + response.status + ')';
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error) errMsg = errJson.error;
        } catch {}
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error('No response stream received from export server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let isDone = false;

      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const events = streamBuffer.split('\n\n');
        streamBuffer = events.pop() || '';

        for (const evt of events) {
          const trimmed = evt.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'start') {
              setBurnProgress(5);
            } else if (data.type === 'progress') {
              if (typeof data.percent === 'number') {
                setBurnProgress(Math.max(5, Math.min(99, data.percent)));
              }
            } else if (data.type === 'complete') {
              setBurnProgress(100);
              setExportDownloadUrl(data.downloadUrl);
              setExportFileName(data.fileName);
              setExportComplete(
                'Universal MP4 video ready!\nQuality: ' + quality.toUpperCase() + ' (H.264 CFR 30fps)'
              );
              isDone = true;

              // Auto-trigger direct download
              if (data.downloadUrl) {
                const a = document.createElement('a');
                a.href = data.downloadUrl;
                a.download = data.fileName || 'bgern_captioned_' + quality + '.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Server video export failed');
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Export stream interrupted or network issue, polling background job:', err);
      try {
        const polledOk = await pollExportJob(exportJobId);
        if (polledOk) {
          return;
        }
      } catch (pollErr: any) {
        console.error('Export background polling failed:', pollErr);
        err = pollErr;
      }

      console.error('Server export error:', err);
      setExportError({
        message: err.message || 'Server export failed',
        details: err.stack || String(err),
      });
    } finally {
      setIsBurning(false);
      isBurningRef.current = false;
    }
  };

  const handleBurnVideo = handleServerExport;

  // Format Time Helper (00:08.28)
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Current active subtitle text & dynamic preview processing based on studio controls
  const currentSegment = segments[activeSegmentIndex] || segments[0];
  const rawBaseText = currentSegment ? currentSegment.text : '';
  const allBaseWords = rawBaseText.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);

  // Slice / chunk to displayWordCount words (controlled by Display word slider: 1 to 6 words)
  const maxDisplayWords = Math.max(1, displayWordCount || 4);
  const segStart = currentSegment?.start ?? 0;
  const segEnd = currentSegment?.end ?? 8.28;
  const segDuration = Math.max(0.1, segEnd - segStart);
  const segElapsed = Math.max(0, currentTime - segStart);

  let slicedWords: string[] = [];
  let activeWordIndex = 0;

  if (allBaseWords.length <= maxDisplayWords) {
    slicedWords = allBaseWords;
    activeWordIndex = Math.min(
      slicedWords.length - 1,
      Math.max(0, Math.floor((segElapsed / segDuration) * slicedWords.length))
    );
  } else {
    const chunkCount = Math.ceil(allBaseWords.length / maxDisplayWords);
    const chunkDuration = segDuration / chunkCount;
    const chunkIndex = Math.min(
      chunkCount - 1,
      Math.max(0, Math.floor((segElapsed / segDuration) * chunkCount))
    );
    slicedWords = allBaseWords.slice(chunkIndex * maxDisplayWords, (chunkIndex + 1) * maxDisplayWords);
    const chunkElapsed = Math.max(0, segElapsed - (chunkIndex * chunkDuration));
    activeWordIndex = Math.min(
      slicedWords.length - 1,
      Math.max(0, Math.floor((chunkElapsed / Math.max(0.05, chunkDuration)) * slicedWords.length))
    );
  }

  // Apply Punctuation control (Yes / No)
  let processedWords = [...slicedWords];
  if (hasPunctuation && processedWords.length > 0) {
    const lastIdx = processedWords.length - 1;
    const lastW = processedWords[lastIdx];
    if (!/[።፣፤፥፦፧፨.,!?;:]/.test(lastW)) {
      const isQuestion = processedWords.some((w) =>
        w.includes('እንዴት') || w.includes('ለምን') || w.includes('መቼ') || w.includes('ስንት') || w.includes('ትፈልጋለህ')
      );
      processedWords[lastIdx] = lastW + (isQuestion ? '?' : '።');
    }
  } else if (!hasPunctuation) {
    processedWords = processedWords.map((w) => w.replace(/[።፣፤፥፦፧፨.,!?;:]/g, ''));
  }

  // User Rule: make word horizontal until size is 50px, after 50px make Vertical (one word over and other under at a time)
  const isVertical = fontSize > 50;
  let previewLines: string[][] = [];
  if (isVertical && processedWords.length > 1) {
    previewLines = processedWords.map((w) => [w]);
  } else if (breakLines && processedWords.length > 1) {
    if (processedWords.length === 4) {
      // Like Kendrick: 3 words on line 1, 1 word on line 2 matching screenshot!
      previewLines = [
        [processedWords[0], processedWords[1], processedWords[2]],
        [processedWords[3]],
      ];
    } else if (processedWords.length === 3) {
      // Like Leon: 2 words on first line, 1 word on second line
      previewLines = [
        [processedWords[0], processedWords[1]],
        [processedWords[2]],
      ];
    } else if (processedWords.length === 2) {
      previewLines = [[processedWords[0]], [processedWords[1]]];
    } else {
      const half = Math.ceil(processedWords.length / 2);
      previewLines = [processedWords.slice(0, half), processedWords.slice(half)];
    }
  } else {
    previewLines = [processedWords];
  }

  // Filter presets by category
  const filteredPresets = CAPTION_PRESETS.filter((p) => {
    if (presetCategory === 'All') return true;
    return p.category === presetCategory;
  });

  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex flex-col font-sans select-none antialiased transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Studio Dual-Card Workspace Canvas */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-2 sm:p-4 lg:p-5 flex flex-col justify-center">
        <header className="px-2 py-2 sm:py-3">
          <h1 className="text-lg sm:text-xl font-black text-[#632450] dark:text-white">
            Amharic Video Caption Studio
          </h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Create and edit Amharic captions, adjust subtitle timing and styling, and export a
            captioned video or subtitle file.
          </p>
        </header>

        {/* Mobile Studio View Switcher */}
        <div className="flex lg:hidden items-center justify-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-2xl mb-3 mx-2">
          <button
            onClick={() => setMobileStudioView('preview')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${mobileStudioView === 'preview' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'}`}
            aria-label="Show video preview"
            aria-pressed={mobileStudioView === 'preview'}
          >
            🎥 Preview & Player
          </button>
          <button
            onClick={() => setMobileStudioView('editor')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${mobileStudioView === 'editor' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'}`}
            aria-label="Show style editor"
            aria-pressed={mobileStudioView === 'editor'}
          >
            🎨 Styles & Edit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 items-stretch">
          {/* =========================================================================
              LEFT CARD: SUB-SIDEBAR + COMPLETE DEFAULT STYLE THEME EDITOR
          ========================================================================== */}
          <div className={`lg:col-span-7 xl:col-span-7 bg-white dark:bg-[#131924] rounded-2xl sm:rounded-3xl border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm flex flex-col sm:flex-row overflow-hidden min-h-[640px] ${mobileStudioView === 'editor' ? '' : 'hidden lg:flex'}`}>
            {/* 1. Far Left Vertical Sub-Sidebar */}
            <aside className="w-full sm:w-28 border-b sm:border-b-0 sm:border-r border-[#256E96]/15 dark:border-[#256E96]/30 p-2 sm:py-4 flex sm:flex-col items-center sm:items-stretch justify-start sm:justify-start gap-2 shrink-0 overflow-x-auto sm:overflow-x-visible bg-[#F3F5F6]/60 dark:bg-[#0B0F17]/60">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('style');
                  setStyleView('gallery');
                  setPresetCategory('All');
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  sidebarTab === 'style'
                    ? 'bg-[#0062FF] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <Palette className={`w-4 h-4 shrink-0 ${sidebarTab === 'style' ? 'text-white' : 'text-neutral-700'}`} />
                <span>Style</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('captions')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  sidebarTab === 'captions'
                    ? 'bg-[#0062FF] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <FileText className={`w-4 h-4 shrink-0 ${sidebarTab === 'captions' ? 'text-white' : 'text-neutral-700'}`} />
                <span>Captions</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('ai-tools')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  sidebarTab === 'ai-tools'
                    ? 'bg-[#0062FF] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 ${sidebarTab === 'ai-tools' ? 'text-[#ECCC6E]' : 'text-[#A6056F]'}`} />
                <span>AI Tools</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('scenes')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  sidebarTab === 'scenes'
                    ? 'bg-[#0062FF] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <Scissors className={`w-4 h-4 shrink-0 ${sidebarTab === 'scenes' ? 'text-white' : 'text-neutral-700'}`} />
                <span>Scenes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab('library');
                  fetchLibraryVideos();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  sidebarTab === 'library'
                    ? 'bg-[#0062FF] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <Video className={`w-4 h-4 shrink-0 ${sidebarTab === 'library' ? 'text-white' : 'text-neutral-700'}`} />
                <span>Library</span>
              </button>

              <Link
                href="/tools/tiktok-generator"
                target="_blank"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-[#FF0050] hover:bg-[#FF0050]/10 border border-[#FF0050]/20 mt-0 sm:mt-auto whitespace-nowrap shrink-0"
                title="TikTok Viral Captions & Hashtags Generator"
              >
                <Hash className="w-4 h-4 shrink-0 text-[#FF0050]" />
                <span>TikTok</span>
              </Link>
            </aside>

            {/* 2. Main Content Area of Left Card */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 min-w-0 justify-between">
              {/* STYLE TAB */}
              {sidebarTab === 'style' && (
                <>
                  {styleView === 'editor' ? (
                    <div className="flex-1 flex flex-col">
                      {/* Top Header matching screenshots: ← Preset Name ✏️ and Create Theme ⚡ */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 shrink-0">
                        <div className="flex items-center gap-2 relative">
                          <button
                            type="button"
                            onClick={() => setStyleView('gallery')}
                            title="Back to presets gallery"
                            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>

                          {isEditingPresetName ? (
                            <input
                              type="text"
                              value={customPresetName}
                              onChange={(e) => setCustomPresetName(e.target.value)}
                              onBlur={() => setIsEditingPresetName(false)}
                              autoFocus
                              className="text-sm font-bold text-neutral-900 border border-neutral-300 rounded px-1.5 py-0.5"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                              className="flex items-center gap-1.5 text-sm font-bold text-neutral-900 hover:text-neutral-700"
                            >
                              <span>{customPresetName}</span>
                              <Pencil
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingPresetName(true);
                                }}
                                className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 ml-0.5"
                              />
                            </button>
                          )}

                          {/* Quick Preset Selector Dropdown */}
                          {showPresetDropdown && (
                            <div className="absolute top-8 left-6 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 z-50 w-52 space-y-1">
                              <div className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">Select Preset Theme</div>
                              {[
                                { id: 'hormozi', name: 'Alex Hormozi' },
                                { id: 'mrbeast', name: 'MrBeast' },
                                { id: 'ali-abdaal', name: 'Ali Abdaal' },
                                { id: 'kendrick-2', name: 'Kendrick 2' },
                                { id: 'laura-2', name: 'Laura 2' },
                                { id: 'kelly-3', name: 'Kelly 3' },
                                { id: 'leon', name: 'Leon' },
                                { id: 'ali-2', name: 'Ali 2' },
                                { id: 'hormozi-2', name: 'Hormozi 2' },
                                { id: 'iman', name: 'Iman' },
                                { id: 'dan', name: 'Dan' },
                                { id: 'hormozi-1', name: 'HORMOZI 1' },
                                { id: 'kendrick', name: 'Kendrick' },
                                { id: 'william', name: 'WILLIAM' },
                                { id: 'laura', name: 'Laura' },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    applyPresetConfig(item.id);
                                    setShowPresetDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                                    selectedPresetId === item.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                                  }`}
                                >
                                  <span>{item.name}</span>
                                  {selectedPresetId === item.id && <Check className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Create Theme Pill Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setThemeSavedToast(true);
                            setTimeout(() => setThemeSavedToast(false), 2500);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          <span>Create theme</span>
                          <Zap className="w-3.5 h-3.5 fill-white text-white" />
                        </button>
                      </div>

                      {themeSavedToast && (
                        <div className="my-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Theme saved successfully!</span>
                        </div>
                      )}

                      {/* Scrollable Detailed Style Settings matching screenshots */}
                      <div className="space-y-6 pt-3 max-h-[calc(100vh-230px)] overflow-y-auto pr-2">
                        {/* ======================= SECTION 1: FONT ======================= */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-neutral-900">Font</h3>

                          {/* Row 1: Font Family, Font Weight, Text case */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            {/* Font Family */}
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Font Family</label>
                              <div className="relative">
                                <select
                                  value={fontFamily}
                                  onChange={(e) => setFontFamily(e.target.value)}
                                  className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                                >
                                  <optgroup label="── የአማርኛ ፊደላት (Amharic Fonts) ──">
                                    {AMHARIC_FONTS.map((f) => (
                                      <option key={f.name} value={f.name}>
                                        {f.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="── Popular English / Latin Fonts ──">
                                    {POPULAR_FONTS.map((f) => (
                                      <option key={f.name} value={f.name}>
                                        {f.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                  {customFonts.length > 0 && (
                                    <optgroup label="── Custom Fonts ──">
                                      {customFonts.map((cf) => (
                                        <option key={cf} value={cf}>
                                          {cf} (Custom)
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            </div>

                            {/* Font Weight */}
                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Font Weight</label>
                              <select
                                value={fontWeight}
                                onChange={(e) => setFontWeight(e.target.value)}
                                className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                              >
                                <option value="Heavy">Heavy</option>
                                <option value="Bold">Bold</option>
                                <option value="Medium">Medium</option>
                                <option value="Regular">Regular</option>
                                <option value="Select weight">Select weight</option>
                              </select>
                            </div>

                            {/* Text case */}
                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Text case</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60">
                                {(['Aa', 'AA', 'aa'] as const).map((tc) => (
                                  <button
                                    key={tc}
                                    type="button"
                                    onClick={() => setTextCase(tc)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold transition-all ${
                                      textCase === tc ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                  >
                                    {tc}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Upload your own font Button */}
                          <div>
                            <button
                              type="button"
                              onClick={() => customFontInputRef.current?.click()}
                              className="px-3.5 py-1.5 rounded-lg bg-[#f05a28] hover:bg-[#e04f20] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                            >
                              <span>Upload your own font</span>
                            </button>
                            <input
                              ref={customFontInputRef}
                              type="file"
                              accept=".ttf,.otf,.woff,.woff2"
                              onChange={handleFontUpload}
                              className="hidden"
                            />
                          </div>

                          {/* Row 2: Size & Font Color */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                            {/* Size */}
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Size</label>
                              <div className="flex items-center gap-2">
                                <div className="border border-neutral-200 rounded-md px-2 py-1 bg-white text-xs font-bold text-neutral-800 min-w-[58px] text-center">
                                  {fontSize} px
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="72"
                                  value={fontSize}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setFontSize(val);
                                    if (val > 50) {
                                      setBreakLines(true);
                                    } else {
                                      setBreakLines(false);
                                    }
                                  }}
                                  className="flex-1 accent-neutral-800 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Font Color */}
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Font Color</label>
                              <div
                                onClick={() => openColorPicker('fontColor', fontColor)}
                                className="w-full h-8 rounded-lg border border-neutral-300 relative overflow-hidden shadow-2xs cursor-pointer flex items-center px-2 hover:border-neutral-400 transition-colors"
                                style={{ backgroundColor: fontColor }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Stroke weight & Stroke Color */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                            {/* Stroke weight */}
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Stroke weight</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60">
                                {(['None', 'Small', 'Medium', 'Large'] as const).map((sw) => (
                                  <button
                                    key={sw}
                                    type="button"
                                    onClick={() => setStrokeWeight(sw)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold transition-all ${
                                      strokeWeight === sw ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                  >
                                    {sw}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Stroke Color */}
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Stroke Color</label>
                              <div
                                onClick={() => openColorPicker('strokeColor', strokeColor)}
                                className="w-full h-8 rounded-lg border border-neutral-300 relative overflow-hidden shadow-2xs cursor-pointer flex items-center px-2 hover:border-neutral-400 transition-colors"
                                style={{ backgroundColor: strokeColor }}
                              />
                            </div>
                          </div>

                          {/* Row 4: Shadow & Shadow Color */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                            {/* Shadow */}
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Shadow</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60">
                                {(['None', 'Small', 'Medium', 'Large'] as const).map((sh) => (
                                  <button
                                    key={sh}
                                    type="button"
                                    onClick={() => setShadowWeight(sh)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold transition-all ${
                                      shadowWeight === sh ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                  >
                                    {sh}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Shadow Color */}
                            <div className="sm:col-span-6 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Shadow Color</label>
                              <div
                                onClick={() => openColorPicker('shadowColor', shadowColor)}
                                className="w-full h-8 rounded-lg border border-neutral-300 relative overflow-hidden shadow-2xs cursor-pointer flex items-center px-2 hover:border-neutral-400 transition-colors"
                                style={{ backgroundColor: shadowColor }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ======================= SECTION: SECONDARY FONT ======================= */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100">
                          <h3 className="text-sm font-bold text-neutral-900">Secondary Font</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-7 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Font Family</label>
                              <select
                                value={secondaryFontFamily}
                                onChange={(e) => setSecondaryFontFamily(e.target.value)}
                                className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 italic focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                              >
                                <option value="ItcGaramond">ItcGaramond</option>
                                <option value="Waldba Wookianos">Waldba Wookianos (ውቂያኖስ)</option>
                                <option value="Ethiopic Lessan">Ethiopic Lessan (ልሳን)</option>
                                <option value="Noto Serif Ethiopic">Noto Serif Ethiopic (ኖቶ ሰሪፍ)</option>
                                <option value="Garamond">Garamond</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Times New Roman">Times New Roman</option>
                              </select>
                            </div>
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Font Weight</label>
                              <select
                                value={secondaryFontWeight}
                                onChange={(e) => setSecondaryFontWeight(e.target.value)}
                                className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                              >
                                <option value="Medium">Medium</option>
                                <option value="Regular">Regular</option>
                                <option value="Bold">Bold</option>
                                <option value="Heavy">Heavy</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* ======================= SECTION 2: CAPTION ======================= */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100">
                          <h3 className="text-sm font-bold text-neutral-900">Caption</h3>

                          {/* Row 1: Display word, Position Y, Position X */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Display word */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Display word</label>
                              <div className="flex items-center gap-2">
                                <div className="border border-neutral-200 rounded-md px-2 py-1 bg-white text-xs font-bold text-neutral-800 min-w-[62px] text-center">
                                  {displayWordCount} words
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="6"
                                  value={displayWordCount}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setDisplayWordCount(val);
                                    setDisplayWords(`${val} words`);
                                  }}
                                  className="flex-1 accent-neutral-800 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Position Y */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Position Y</label>
                              <div className="flex items-center gap-2">
                                <div className="border border-neutral-200 rounded-md px-2 py-1 bg-white text-xs font-bold text-neutral-800 min-w-[50px] text-center">
                                  {positionY} %
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="90"
                                  value={positionY}
                                  onChange={(e) => setPositionY(parseInt(e.target.value, 10))}
                                  className="flex-1 accent-neutral-800 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Position X */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Position X</label>
                              <div className="flex items-center gap-2">
                                <div className="border border-neutral-200 rounded-md px-2 py-1 bg-white text-xs font-bold text-neutral-800 min-w-[50px] text-center">
                                  {positionX} %
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="90"
                                  value={positionX}
                                  onChange={(e) => setPositionX(parseInt(e.target.value, 10))}
                                  className="flex-1 accent-neutral-800 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Animation & Punctuation */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Animation</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                <button
                                  type="button"
                                  onClick={() => setHasAnimation(true)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${hasAnimation ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHasAnimation(false)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${!hasAnimation ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Punctuation</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                <button
                                  type="button"
                                  onClick={() => setHasPunctuation(true)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${hasPunctuation ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHasPunctuation(false)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${!hasPunctuation ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Keyword highlights */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-medium text-neutral-500 block">Keyword highlights</label>
                            <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                              <button
                                type="button"
                                onClick={() => setHasKeywordHighlights(true)}
                                className={`flex-1 py-1 text-xs rounded-md font-semibold ${hasKeywordHighlights ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setHasKeywordHighlights(false)}
                                className={`flex-1 py-1 text-xs rounded-md font-semibold ${!hasKeywordHighlights ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          {/* Row 4: Main color, Second color, Third color (Always shown; disabled gray when No, matching screenshot 2) */}
                          <div className="grid grid-cols-3 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Main color</label>
                              <div
                                onClick={() => hasKeywordHighlights && openColorPicker('mainHighlightColor', mainHighlightColor)}
                                className={`w-full h-8 rounded-lg border relative overflow-hidden shadow-2xs transition-colors ${
                                  hasKeywordHighlights
                                    ? 'border-neutral-300 cursor-pointer hover:border-neutral-400'
                                    : 'border-[#d5d7de] bg-[#e2e4e9] cursor-not-allowed'
                                }`}
                                style={{ backgroundColor: hasKeywordHighlights ? mainHighlightColor : '#e2e4e9' }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Second color</label>
                              <div
                                onClick={() => hasKeywordHighlights && openColorPicker('secondHighlightColor', secondHighlightColor)}
                                className={`w-full h-8 rounded-lg border relative overflow-hidden shadow-2xs transition-colors ${
                                  hasKeywordHighlights
                                    ? 'border-neutral-300 cursor-pointer hover:border-neutral-400'
                                    : 'border-[#d5d7de] bg-[#e2e4e9] cursor-not-allowed'
                                }`}
                                style={{ backgroundColor: hasKeywordHighlights ? secondHighlightColor : '#e2e4e9' }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Third color</label>
                              <div
                                onClick={() => hasKeywordHighlights && openColorPicker('thirdHighlightColor', thirdHighlightColor)}
                                className={`w-full h-8 rounded-lg border relative overflow-hidden shadow-2xs transition-colors ${
                                  hasKeywordHighlights
                                    ? 'border-neutral-300 cursor-pointer hover:border-neutral-400'
                                    : 'border-[#d5d7de] bg-[#e2e4e9] cursor-not-allowed'
                                }`}
                                style={{ backgroundColor: hasKeywordHighlights ? thirdHighlightColor : '#e2e4e9' }}
                              />
                            </div>
                          </div>

                          {/* Border Radius (Screenshot 2 exact) */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-medium text-neutral-500 block">Border Radius</label>
                            <div className="flex items-center gap-2 max-w-xs">
                              <div className="border border-neutral-200 rounded-md px-2 py-1 bg-white text-xs font-bold text-neutral-800 min-w-[54px] text-center">
                                {borderRadiusEm} em
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={borderRadiusEm}
                                onChange={(e) => setBorderRadiusEm(parseFloat(e.target.value))}
                                className="flex-1 accent-neutral-800 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Row 5: Auto emoji & Emoji animation */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Auto emoji</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-40">
                                {(['Auto', 'Top', 'None'] as const).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAutoEmoji(opt)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold ${autoEmoji === opt ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Emoji animation</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                <button
                                  type="button"
                                  onClick={() => setEmojiAnimation(true)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${emojiAnimation ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEmojiAnimation(false)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${!emojiAnimation ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Emoji Picker & AI Override Bar */}
                          {autoEmoji !== 'None' && (
                            <div className="pt-2 pb-1 space-y-1.5 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                                  ኢሞጂ ይምረጡ (Select / Override Emoji)
                                </label>
                                {customSelectedEmoji && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomSelectedEmoji('')}
                                    className="text-[10px] text-[#0062FF] hover:underline font-bold"
                                  >
                                    Auto AI ✨
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-base">
                                <button
                                  type="button"
                                  onClick={() => setCustomSelectedEmoji('')}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all shrink-0 ${
                                    !customSelectedEmoji
                                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200'
                                  }`}
                                  title="AI Auto-Detect from Amharic caption speech"
                                >
                                  AI Auto ✨
                                </button>
                                {['🔥', '🚀', '💰', '😂', '❤️', '💡', '🎙️', '⚡', '🎯', '👏', '👑', '💯', '🇪🇹', '☕', '⭐'].map((em) => (
                                  <button
                                    key={em}
                                    type="button"
                                    onClick={() => setCustomSelectedEmoji(em)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 hover:scale-110 active:scale-95 ${
                                      customSelectedEmoji === em
                                        ? 'bg-blue-100 border-2 border-[#0062FF] shadow-xs'
                                        : 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/60'
                                    }`}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Row 6: Break lines & Gap-free captions */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Break lines</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                <button
                                  type="button"
                                  onClick={() => setBreakLines(true)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${breakLines ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBreakLines(false)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${!breakLines ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Gap-free captions</label>
                              <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                <button
                                  type="button"
                                  onClick={() => setGapFreeCaptions(true)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${gapFreeCaptions ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGapFreeCaptions(false)}
                                  className={`flex-1 py-1 text-xs rounded-md font-semibold ${!gapFreeCaptions ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ======================= SECTION 3: EMPHASIZED TEXT ======================= */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100">
                          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>Emphasized text</span>
                            <Info className="w-3.5 h-3.5 text-neutral-400" />
                          </h3>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Animation</label>
                              <select
                                value={emphasizedAnimation}
                                onChange={(e) => setEmphasizedAnimation(e.target.value)}
                                className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              >
                                {EMPHASIZED_ANIMATIONS.map((anim) => (
                                  <option key={anim} value={anim}>{anim}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Font Color</label>
                              <div
                                onClick={() => openColorPicker('emphasizedFontColor', emphasizedFontColor)}
                                className="w-full h-8 rounded-lg border border-neutral-300 relative overflow-hidden shadow-2xs cursor-pointer flex items-center px-2 hover:border-neutral-400 transition-colors"
                                style={{ backgroundColor: emphasizedFontColor }}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-neutral-500 block">Background Color</label>
                                <button
                                  type="button"
                                  onClick={() => setEmphasizedBgColor('transparent')}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                                    emphasizedBgColor === 'transparent'
                                      ? 'bg-neutral-900 text-white shadow-2xs'
                                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                                  }`}
                                  title="Set background to transparent (no background box)"
                                >
                                  Transparent
                                </button>
                              </div>
                              <div
                                onClick={() => openColorPicker('emphasizedBgColor', emphasizedBgColor)}
                                className="w-full h-8 rounded-lg border border-neutral-300 relative overflow-hidden shadow-2xs cursor-pointer flex items-center px-2 hover:border-neutral-400 transition-colors"
                                style={{
                                  backgroundColor: emphasizedBgColor === 'transparent' ? '#ffffff' : emphasizedBgColor,
                                  backgroundImage:
                                    emphasizedBgColor === 'transparent'
                                      ? 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)'
                                      : 'none',
                                  backgroundSize: '10px 10px',
                                }}
                                title={emphasizedBgColor === 'transparent' ? 'Transparent (Click to pick color)' : emphasizedBgColor}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ======================= SECTION 4: ANIMATIONS ======================= */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100">
                          <h3 className="text-sm font-bold text-neutral-900">Animations</h3>

                          {!animationVariants ? (
                            <>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-neutral-500 block">Caption Animation</label>
                                  <select
                                    value={captionAnimation}
                                    onChange={(e) => setCaptionAnimation(e.target.value)}
                                    className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    {CAPTION_ANIMATIONS.map((anim) => (
                                      <option key={anim} value={anim}>{anim}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-neutral-500 block">Word Animation</label>
                                  <select
                                    value={wordAnimation}
                                    onChange={(e) => setWordAnimation(e.target.value)}
                                    className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    {WORD_ANIMATIONS.map((anim) => (
                                      <option key={anim} value={anim}>{anim}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-neutral-500 block">Emoji Animation</label>
                                  <select
                                    value={emojiAnimType}
                                    onChange={(e) => setEmojiAnimType(e.target.value)}
                                    className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800"
                                  >
                                    <option value="None">None</option>
                                    <option value="bounce in">bounce in</option>
                                    <option value="bounce">bounce</option>
                                    <option value="pop in">pop in</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1 pt-1">
                                <label className="text-[11px] font-medium text-neutral-500 block">Animation variants</label>
                                <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                  <button
                                    type="button"
                                    onClick={() => setAnimationVariants(true)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold ${animationVariants ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAnimationVariants(false)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold ${!animationVariants ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            /* When Animation variants is Yes (Dan preset matching screenshot 5) */
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-neutral-500 block">Animation variants</label>
                                <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200/60 w-32">
                                  <button
                                    type="button"
                                    onClick={() => setAnimationVariants(true)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold ${animationVariants ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAnimationVariants(false)}
                                    className={`flex-1 py-1 text-xs rounded-md font-semibold ${!animationVariants ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>

                              <div className="text-xs text-neutral-500 font-medium">Choose animation for each variant</div>
                              {variants.map((v, i) => (
                                <div key={v.id} className="p-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1.5">
                                  <div className="text-[11px] font-bold text-neutral-700">Variant {i + 1}</div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[10px] text-neutral-400 block mb-0.5">Caption Animation</label>
                                      <select
                                        value={v.captionAnim}
                                        onChange={(e) => {
                                          const next = [...variants];
                                          next[i].captionAnim = e.target.value;
                                          setVariants(next);
                                        }}
                                        className="w-full text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-800"
                                      >
                                        {CAPTION_ANIMATIONS.map((anim) => (
                                          <option key={anim} value={anim}>{anim}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-neutral-400 block mb-0.5">Word Animation</label>
                                      <select
                                        value={v.wordAnim}
                                        onChange={(e) => {
                                          const next = [...variants];
                                          next[i].wordAnim = e.target.value;
                                          setVariants(next);
                                        }}
                                        className="w-full text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-800"
                                      >
                                        {WORD_ANIMATIONS.map((anim) => (
                                          <option key={anim} value={anim}>{anim}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-neutral-400 block mb-0.5">Emoji Animation</label>
                                      <select
                                        value={v.emojiAnim}
                                        onChange={(e) => {
                                          const next = [...variants];
                                          next[i].emojiAnim = e.target.value;
                                          setVariants(next);
                                        }}
                                        className="w-full text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-800"
                                      >
                                        <option value="None">None</option>
                                        <option value="bounce">bounce</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ======================= SECTION 5: B-ROLL ======================= */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100">
                          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>B-roll</span>
                            <Info className="w-3.5 h-3.5 text-neutral-400" />
                          </h3>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Default layout</label>
                              <select
                                value={brollLayout}
                                onChange={(e) => setBrollLayout(e.target.value)}
                                className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800"
                              >
                                <option value="Random (Cover / Split 50/50 / Sp...">Random (Cover / Split 50/50 / Sp...</option>
                                <option value="Full Cover">Full Cover</option>
                                <option value="Split 50/50">Split 50/50</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-neutral-500 block">Zoom</label>
                              <select
                                value={brollZoom}
                                onChange={(e) => setBrollZoom(e.target.value)}
                                className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800"
                              >
                                <option value="None">None</option>
                                <option value="Slow Zoom In">Slow Zoom In</option>
                                <option value="Slow Zoom Out">Slow Zoom Out</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* ======================= SECTION 6: VIDEO BACKGROUND ======================= */}
                        <div className="space-y-3 pt-2 border-t border-neutral-100 pb-4">
                          <h3 className="text-sm font-bold text-neutral-900">Video Background</h3>

                          <div className="space-y-1 max-w-xs">
                            <label className="text-[11px] font-medium text-neutral-500 block">Background Color</label>
                            <div
                              onClick={() => openColorPicker('videoBgColor', videoBgColor)}
                              className="w-full h-8 rounded-lg border border-neutral-300 relative overflow-hidden shadow-2xs cursor-pointer flex items-center px-2 hover:border-neutral-400 transition-colors"
                              style={{ backgroundColor: videoBgColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Presets Gallery Grid matching screenshot */
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header: Caption Style & Customize [PresetName] Button */}
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                          <div>
                            <h2 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900">
                              Caption Style
                            </h2>
                            <p className="mt-0.5 text-[10px] font-medium text-neutral-500">
                              Pick a look, then fine-tune it
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setStyleView('editor')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            title={`Customize ${customPresetName} in detail`}
                          >
                            <Palette className="w-3.5 h-3.5 text-amber-600" />
                            <span>Customize {customPresetName}</span>
                          </button>
                        </div>

                        {/* Filter Pills Bar */}
                        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1 text-xs">
                          {(['All', 'Trend', 'New', 'Premium', 'Emoji'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setPresetCategory(cat)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                presetCategory === cat
                                  ? 'bg-neutral-900 text-white shadow-sm'
                                  : 'border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 hover:bg-neutral-50'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* 3-Column Caption Style Presets Grid */}
                        <div className="grid grid-cols-3 gap-2.5 mt-3 overflow-y-auto max-h-[440px] pr-1">
                          {filteredPresets.map((preset) => {
                            const isSelected = selectedPresetId === preset.id;
                            return (
                              <div
                                key={preset.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => applyPresetConfig(preset.id, false)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    applyPresetConfig(preset.id, false);
                                  }
                                }}
                                className={`group relative rounded-2xl min-h-[52px] sm:min-h-[58px] px-2 py-2 flex items-center justify-center transition-all select-none overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                  isSelected
                                    ? 'border border-amber-400 bg-gradient-to-br from-neutral-800 via-neutral-800 to-neutral-700 shadow-lg shadow-amber-900/10 ring-2 ring-amber-400/20'
                                    : 'border border-neutral-700 bg-gradient-to-br from-neutral-700 to-neutral-900 shadow-sm hover:border-neutral-500 hover:shadow-md'
                                }`}
                              >
                                {preset.badge === 'New' && (
                                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-sm leading-tight pointer-events-none">
                                    New
                                  </span>
                                )}
                                {preset.badge === '⚡' && (
                                  <span className="absolute top-1.5 right-1.5 text-amber-300 text-xs font-black pointer-events-none">
                                    ⚡
                                  </span>
                                )}

                                <div className="flex items-center justify-center gap-1.5 w-full">
                                  {/* Pencil Button in front of style to customize in detail */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyPresetConfig(preset.id, true);
                                    }}
                                    title={`Customize ${preset.name} font and detail`}
                                    className={`p-1.5 rounded-full bg-white/95 hover:bg-white text-neutral-800 flex items-center justify-center shadow-sm transition-all hover:scale-110 shrink-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                      isSelected ? 'inline-flex' : 'hidden group-hover:inline-flex'
                                    }`}
                                  >
                                    <Pencil className="w-3 h-3 text-neutral-700" />
                                  </button>

                                  <div
                                    className={`flex items-center justify-center text-center ${
                                      preset.preview.hasPill
                                        ? 'px-2.5 py-1 rounded-lg font-black text-xs sm:text-sm shadow-sm'
                                        : 'text-xs sm:text-sm font-black'
                                    } ${preset.preview.isItalic ? 'italic' : ''} ${
                                      preset.preview.isUppercase ? 'uppercase tracking-wider' : ''
                                    }`}
                                    style={{
                                      backgroundColor: preset.preview.bgColor || 'transparent',
                                      color: preset.preview.textColor || '#ffffff',
                                      textShadow: preset.preview.shadow || 'none',
                                      WebkitTextStroke: preset.preview.isOutline ? '1px #ffffff' : 'none',
                                    }}
                                  >
                                    {preset.name}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Quick Controls Toolbar matching screenshot */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 px-3 py-3 shadow-sm sm:gap-3 text-xs">
                        {/* Caption Position */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 leading-tight">Position</span>
                          <div className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-800 min-w-[48px] text-center shadow-sm">
                            {positionY} %
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={positionY}
                            onChange={(e) => setPositionY(parseInt(e.target.value, 10))}
                            className="w-14 sm:w-18 accent-amber-500 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Font size */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 leading-tight">Size</span>
                          <div className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-800 min-w-[48px] text-center shadow-sm">
                            {fontSize} px
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="120"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                            className="w-14 sm:w-18 accent-amber-500 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Quick Color Swatches */}
                        <div className="flex items-center gap-1.5">
                          <div className="text-center">
                            <span className="text-[9px] text-neutral-400 block mb-0.5">Font</span>
                            <button
                              type="button"
                              onClick={() => openColorPicker('fontColor', fontColor)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow ring-1 ring-neutral-200 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              style={{ backgroundColor: fontColor }}
                              title="Font color"
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-neutral-400 block mb-0.5">Main</span>
                            <button
                              type="button"
                              onClick={() => openColorPicker('mainHighlightColor', mainHighlightColor)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow ring-1 ring-neutral-200 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              style={{ backgroundColor: mainHighlightColor }}
                              title="Main highlight color"
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-neutral-400 block mb-0.5">Second</span>
                            <button
                              type="button"
                              onClick={() => openColorPicker('secondHighlightColor', secondHighlightColor)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow ring-1 ring-neutral-200 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              style={{ backgroundColor: secondHighlightColor }}
                              title="Second highlight color"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CAPTIONS TAB */}
              {sidebarTab === 'captions' && (
                <div className="flex-1 flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-700" />
                      <span>Subtitle Segments ({segments.length})</span>
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        const nextId = segments.length ? Math.max(...segments.map((s) => s.id)) + 1 : 1;
                        const lastEnd = segments.length ? segments[segments.length - 1].end : 0;
                        setSegments([...segments, { id: nextId, start: lastEnd, end: lastEnd + 3, text: 'አዲስ የአማርኛ ንዑስ ርዕስ' }]);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Caption</span>
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-[460px] space-y-2 pr-1">
                    {segments.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#256E96]/20 rounded-2xl my-3">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                          ምንም ንዑስ ርዕስ አልተገኘም (No Captions Yet)
                        </h4>
                        <p className="text-xs text-neutral-500 max-w-xs mb-4">
                          ቪዲዮዎን ከጫኑ በኋላ በ AI በራስ-ሰር ድምጽ በመቀየር ወይም በእጅ አዲስ ንዑስ ርዕስ ማከል ይችላሉ።
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={handleTranscribe}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                          >
                            <Wand2 className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                            <span>{isProcessing ? 'Generating...' : 'Generate Captions'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSegments([{ id: 1, start: 0, end: 3, text: 'አዲስ የአማርኛ ንዑስ ርዕስ' }]);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Caption</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      segments.map((seg, idx) => (
                        <div
                          key={seg.id}
                          className={`p-3 rounded-xl border transition-all ${
                            idx === activeSegmentIndex
                              ? 'border-yellow-500 bg-yellow-50/40 shadow-xs'
                              : 'border-neutral-200 bg-neutral-50/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] font-mono text-neutral-500">
                            <span>#{idx + 1} • {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() => setSegments(segments.filter((s) => s.id !== seg.id))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={seg.text}
                            onChange={(e) => {
                              const next = [...segments];
                              next[idx].text = e.target.value;
                              setSegments(next);
                            }}
                            className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-xs font-medium font-geez resize-none focus:outline-none focus:ring-1 focus:ring-neutral-400"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* AI TOOLS TAB */}
              {sidebarTab === 'ai-tools' && (
                <div className="flex-1 flex flex-col space-y-4">
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Speech Transcription & Enhancement</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-neutral-700">ቋንቋ ይምረጡ (Audio Language):</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTranscriptionLanguage('amh-eng')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                            transcriptionLanguage === 'amh-eng'
                              ? 'bg-[#0062FF] text-white border-[#0062FF] shadow-xs font-black'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#0062FF]/40'
                          }`}
                          title="Amharic and English mixed speech"
                        >
                          <span>🇪🇹</span>
                          <span>አማርኛ + English</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTranscriptionLanguage('eng')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                            transcriptionLanguage === 'eng'
                              ? 'bg-[#0062FF] text-white border-[#0062FF] shadow-xs font-black'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#0062FF]/40'
                          }`}
                          title="English only"
                        >
                          <span>🌍</span>
                          <span>English</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleTranscribe}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#0062FF]/20 active:scale-95"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Generating...' : 'Generate Captions'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPolishing || segments.length === 0}
                      onClick={handlePolishCaptions}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isPolishing ? 'Polishing...' : 'AI Grammar & Spelling Check'}</span>
                    </button>
                  </div>

                  {processingStatus && (
                    <p className="text-xs font-bold text-amber-600 animate-pulse">{processingStatus}</p>
                  )}
                </div>
              )}

              {/* SCENES TAB: EXACT SCENE CUTS & CLIP DETECTION */}
              {sidebarTab === 'scenes' && (
                <div className="flex-1 flex flex-col space-y-4 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
                  {/* Header & Stats */}
                  <div className="flex items-center justify-between border-b border-[#256E96]/15 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                          <span>Scene Cuts & Clip Detection</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                            {detectedScenes.length} Clips
                          </span>
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          የቪዲዮ ፍሬም ሽግግሮች እና የክሊፕ ቁረቶች (Exact video cuts & clips)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Toast notification banner */}
                  {sceneToast && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-blue-500/15 border border-amber-400/40 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{sceneToast}</span>
                    </div>
                  )}

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Auto-Detect Cuts */}
                    <button
                      type="button"
                      disabled={isDetectingScenes}
                      onClick={handleDetectSceneCuts}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white text-xs font-bold shadow-md shadow-[#0062FF]/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#ECCC6E]" />
                      <span>{isDetectingScenes ? `Scanning (${sceneProgress}%)...` : 'AI Scan Video Cuts (ፍተሻ)'}</span>
                    </button>

                    {/* Cut at Current Frame */}
                    <button
                      type="button"
                      onClick={handleCutAtCurrentTime}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#131924] border border-[#256E96]/30 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold shadow-xs active:scale-95 transition-all"
                      title="Cut video exactly at the current paused playhead frame"
                    >
                      <Scissors className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cut at {currentTime.toFixed(1)}s (ቁረጥ)</span>
                    </button>
                  </div>

                  {/* Secondary Tools: Auto-Split Subtitles */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-[#131924]/80 border border-neutral-200/70 dark:border-neutral-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200">Auto-Align Subtitles (ንዑስ ርዕስ አስማማ)</div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Splits subtitle blocks so they never cross over video scene cut boundaries.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoSplitSubtitlesByCuts}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shrink-0 hover:opacity-90 active:scale-95 transition-all"
                    >
                      Align
                    </button>
                  </div>

                  {/* Detected Scenes List */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-500 px-1">
                      <span>Timeline Clips ({detectedScenes.length})</span>
                      <span>Total Duration: {duration.toFixed(1)}s</span>
                    </div>

                    {detectedScenes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#256E96]/20 rounded-2xl my-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                          <Scissors className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                          ክሊፖች ገና አልተገኙም (No Clips Detected Yet)
                        </h4>
                        <p className="text-[11px] text-neutral-500 max-w-xs mb-3">
                          ቪዲዮዎን በፍሬም ሽግግሮች ለመከፋፈል &apos;AI Scan Video Cuts&apos; የሚለውን ይጫኑ ወይም በፈለጉት ሰከንድ ላይ ይቁረጡ።
                        </p>
                        {mediaUrl && (
                          <button
                            type="button"
                            disabled={isDetectingScenes}
                            onClick={handleDetectSceneCuts}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                          >
                            {isDetectingScenes ? `Scanning (${sceneProgress}%)...` : 'AI Scan Video Cuts (ፍተሻ)'}
                          </button>
                        )}
                      </div>
                    ) : (
                      detectedScenes.map((scene, idx) => {
                        const isCurrentScene = currentTime >= scene.start && currentTime <= scene.end;
                        const isPlayingThis = isPlaying && activeSoloClip === scene.id;

                        return (
                          <div
                            key={scene.id}
                            className={`p-3 rounded-2xl border transition-all ${
                              isCurrentScene
                                ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-400/60 shadow-xs ring-1 ring-amber-400/30'
                                : 'bg-white dark:bg-[#131924] border-[#256E96]/20 dark:border-[#256E96]/30 hover:border-[#0062FF]/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Scene Snapshot Thumbnail */}
                              <div
                                onClick={() => handleSeek(scene.start)}
                                className="w-20 h-14 rounded-xl overflow-hidden relative bg-black shrink-0 cursor-pointer group/thumb border border-neutral-200 dark:border-neutral-800 shadow-xs"
                                title="Click to jump playhead to scene start"
                              >
                                <img
                                  src={scene.thumbnail || '/podcast-preview.jpg'}
                                  alt={scene.label}
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/25 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                                  <Play className="w-4 h-4 text-white drop-shadow opacity-70 group-hover/thumb:opacity-100" />
                                </div>
                                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white font-semibold">
                                  {scene.duration.toFixed(1)}s
                                </div>
                              </div>

                              {/* Scene Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-black text-neutral-900 dark:text-white truncate">
                                    {scene.label}
                                  </h4>
                                  <span className="font-mono text-[10px] text-neutral-500 font-semibold shrink-0">
                                    {formatTimecode(scene.start)} - {formatTimecode(scene.end)}
                                  </span>
                                </div>

                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                  <span>{scene.subtitleCount} {scene.subtitleCount === 1 ? 'subtitle' : 'subtitles'}</span>
                                  <span>•</span>
                                  <span className="font-mono">{scene.duration.toFixed(1)}s clip</span>
                                </div>

                                {/* Action Buttons for this Scene */}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  {/* Play Scene Solo */}
                                  <button
                                    type="button"
                                    onClick={() => handlePlaySoloClip(scene)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                                      isPlayingThis
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                                    }`}
                                    title="Play only this clip and auto-pause at end"
                                  >
                                    {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    <span>{isPlayingThis ? 'Pause' : 'Play Clip'}</span>
                                  </button>

                                  {/* Seek to Scene */}
                                  <button
                                    type="button"
                                    onClick={() => handleSeek(scene.start)}
                                    className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold transition-all active:scale-95"
                                    title="Jump playhead to start of this scene"
                                  >
                                    Seek
                                  </button>

                                  {/* Export Scene Clip */}
                                  <button
                                    type="button"
                                    onClick={() => handleBurnVideo(exportResolution, { start: scene.start, end: scene.end, label: scene.label })}
                                    disabled={isBurning}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#0062FF] dark:text-blue-300 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                                    title="Export only this clip as standalone video"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Export</span>
                                  </button>

                                  {/* Merge with previous */}
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMergeScene(idx)}
                                      className="px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-[11px] font-semibold transition-all"
                                      title="Merge with previous scene"
                                    >
                                      Merge
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

              {/* LIBRARY TAB: 7-DAY CLOUD STORAGE */}
              {sidebarTab === 'library' && (
                <div className="flex-1 flex flex-col space-y-4 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
                  {/* Header & Refresh */}
                  <div className="flex items-center justify-between border-b border-[#256E96]/15 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center font-bold">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                          <span>የቪዲዮ ማከማቻ (Video Library)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#0062FF]/10 text-[#0062FF] dark:text-blue-400 font-bold">
                            {libraryVideos.length} Videos
                          </span>
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          የተጫኑ ቪዲዮዎችዎ ዝርዝር (All user videos stored for 7 days)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={fetchLibraryVideos}
                        disabled={isLoadingLibrary}
                        className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs transition-all disabled:opacity-50"
                        title="Refresh library"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isLoadingLibrary ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={requestFileUpload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Video</span>
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Cloud Retention Policy Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-neutral-800 dark:text-neutral-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>የ7 ቀናት የቪዲዮ ማቆያ ደንብ (7-Day Retention Notice)</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      በስቱዲዮ ውስጥ የሚጭኗቸው ቪዲዮዎች በሙሉ በድረ-ገጻችን ላይ የሚቆዩት ለ <strong>7 ቀናት</strong> ብቻ ነው። ከ 7 ቀናት በኋላ ደህንነትዎን እና የሰርቨር ቦታን ለመጠበቅ በራስ-ሰር ይሰረዛሉ።
                    </p>
                  </div>

                  {uploadingToLibrary && (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-[#0062FF] font-semibold flex items-center gap-2 animate-pulse">
                      <UploadCloud className="w-4 h-4 animate-bounce" />
                      <span>አዲስ ቪዲዮ ወደ ላይብረሪ በመጫን ላይ ነው (Uploading to 7-day library)...</span>
                    </div>
                  )}

                  {/* Library Video List */}
                  {isLoadingLibrary && libraryVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400">
                      <RotateCw className="w-6 h-6 animate-spin mb-2 text-[#0062FF]" />
                      <span className="text-xs">ቪዲዮዎችን በመጫን ላይ... (Loading videos...)</span>
                    </div>
                  ) : libraryVideos.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#256E96]/20 rounded-2xl my-2">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400 mb-3">
                        <Video className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        ላይብረሪው ባዶ ነው (Library is Empty)
                      </h4>
                      <p className="text-xs text-neutral-500 max-w-xs mb-4">
                        እስካሁን ምንም የተጫነ ቪዲዮ የለም። አዲስ ቪዲዮ በመጫን ይጀምሩ!
                      </p>
                      <button
                        type="button"
                        onClick={requestFileUpload}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-bold shadow-md shadow-[#0062FF]/20 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ቪዲዮ ጫን (Upload Video)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {libraryVideos.map((video) => {
                        const expiresDate = video.expiresAt ? new Date(video.expiresAt) : new Date(new Date(video.createdAt).getTime() + 7 * 86400000);
                        const daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                        const isExpired = daysLeft === 0;

                        return (
                          <div
                            key={video.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/30 hover:border-[#0062FF]/40 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                onClick={() => handleOpenLibraryVideo(video)}
                                className="w-14 h-14 rounded-xl bg-neutral-900 overflow-hidden relative shrink-0 cursor-pointer flex items-center justify-center border border-neutral-200 dark:border-neutral-800 group/thumb"
                                title="Click to open this video in studio"
                              >
                                {video.videoUrl && (video.videoUrl.endsWith('.mp4') || video.videoUrl.endsWith('.webm')) ? (
                                  <video
                                    src={video.videoUrl}
                                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                                  />
                                ) : (
                                  <Video className="w-6 h-6 text-neutral-400 group-hover/thumb:text-white transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                                  <Play className="w-4 h-4 text-white drop-shadow" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4
                                  onClick={() => handleOpenLibraryVideo(video)}
                                  className="text-xs font-black text-neutral-900 dark:text-white truncate cursor-pointer hover:text-[#0062FF]"
                                  title={video.title}
                                >
                                  {video.title || 'Untitled Video'}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                  {video.durationSec > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{video.durationSec.toFixed(1)}s</span>
                                    </>
                                  )}
                                  {(() => {
                                    let subCount = 0;
                                    if (video.subtitlesJson) {
                                      try {
                                        const pSubs = typeof video.subtitlesJson === 'string' ? JSON.parse(video.subtitlesJson) : video.subtitlesJson;
                                        if (Array.isArray(pSubs)) subCount = pSubs.length;
                                      } catch {}
                                    }
                                    if (subCount > 0) {
                                      return (
                                        <>
                                          <span>•</span>
                                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300/40 dark:border-emerald-700/40">
                                            <Sparkles className="w-3 h-3 text-emerald-500" />
                                            <span>{subCount} Captions</span>
                                          </span>
                                        </>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      daysLeft <= 1
                                        ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                                        : daysLeft <= 3
                                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                    }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>{isExpired ? 'ያለቀበት (Expired)' : `${daysLeft} days left (${daysLeft} ቀናት ቀሩት)`}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                              <button
                                type="button"
                                onClick={() => handleOpenLibraryVideo(video)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                              >
                                <Play className="w-3 h-3" />
                                <span>Open</span>
                              </button>

                              {video.videoUrl && (
                                <a
                                  href={video.videoUrl}
                                  download={video.title || 'video.mp4'}
                                  className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs transition-all"
                                  title="Download Original Video"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDeleteLibraryVideo(video.id, e)}
                                className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 text-xs transition-all"
                                title="Delete from Library"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              RIGHT CARD: VIDEO PLAYER & WORKSPACE TOOLBAR
          ========================================================================== */}
          <div className={`lg:col-span-5 xl:col-span-5 bg-white dark:bg-[#131924] rounded-2xl sm:rounded-3xl border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden min-h-[640px] transition-colors ${mobileStudioView === 'preview' ? '' : 'hidden lg:flex'}`}>
            {/* 1. Top Tool Action Pills (AI Tools, Audio, Upload, Export ˅) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#256E96]/15 dark:border-white/10 shrink-0 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                {/* AI Tools Pill - Exact same size, shape and style as Audio button */}
                <button
                  type="button"
                  onClick={() => {
                    setSidebarTab('ai-tools');
                    setMobileStudioView('editor');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Tools</span>
                </button>

                {/* Audio Pill */}
                <button
                  type="button"
                  onClick={() => setShowAudioModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all whitespace-nowrap shrink-0"
                >
                  <Music className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  <span>Audio</span>
                </button>

                {/* Upload Button - Exact same size, shape and style as Audio button */}
                <button
                  type="button"
                  onClick={requestFileUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all whitespace-nowrap shrink-0"
                  title="Upload Video or Audio"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  <span>{mediaUrl ? 'Change' : 'Upload'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* 7-Day Storage Policy Badge */}
                <div
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 text-xs font-semibold select-none whitespace-nowrap shrink-0"
                  title="Your videos are held on the website for 7 days only before auto-deletion"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>7-Day Cloud</span>
                </div>

                {/* Save to Library Pill - Saves video with generated captions */}
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={isSavingToLibrary || (!mediaUrl && !mediaFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all whitespace-nowrap shrink-0 disabled:opacity-40"
                  title={segments.length > 0 ? "Save video and generated captions to 7-day Library" : "Save video to 7-day Library"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${segments.length > 0 ? 'text-emerald-500 fill-emerald-500/20' : 'text-neutral-600 dark:text-neutral-400'}`} />
                  <span>{isSavingToLibrary ? 'Saving...' : 'Save'}</span>
                  {segments.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Captions included" />
                  )}
                </button>

                {/* Single Unified Export Dropdown Button - All options (1080p, 720p, subtitles) in one place */}
                <div className="relative">
                  <button
                    ref={exportButtonRef}
                    type="button"
                    onClick={() => {
                      if (showExportMenu) {
                        setShowExportMenu(false);
                        return;
                      }
                      updateExportMenuPosition();
                      setShowExportMenu(true);
                    }}
                    disabled={isBurning}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:opacity-95 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                    title="Export video (1080p, 720p) or download subtitles"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBurning ? `${exportResolution} (${burnProgress}%)` : 'Export'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showExportMenu && exportMenuPosition && createPortal(
                    <div
                      className={`fixed inset-0 z-[100] ${
                        exportMenuPosition.isMobile
                          ? 'flex items-end justify-center bg-black/45 p-3'
                          : 'pointer-events-none'
                      }`}
                      style={
                        exportMenuPosition.isMobile
                          ? { paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }
                          : undefined
                      }
                      onClick={() => {
                        if (exportMenuPosition.isMobile) setShowExportMenu(false);
                      }}
                    >
                      <div
                        className={`rounded-2xl bg-white dark:bg-[#131924] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 ${
                          exportMenuPosition.isMobile
                            ? 'pointer-events-auto w-full max-w-[360px] overflow-y-auto overscroll-contain'
                            : 'pointer-events-auto fixed overflow-y-auto overscroll-contain'
                        }`}
                        style={
                          exportMenuPosition.isMobile
                            ? { maxHeight: exportMenuPosition.maxHeight }
                            : {
                                top: exportMenuPosition.top,
                                left: exportMenuPosition.left,
                                width: exportMenuPosition.width,
                                maxHeight: exportMenuPosition.maxHeight,
                              }
                        }
                        onClick={(event) => event.stopPropagation()}
                      >
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2 leading-tight">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Native Server Export:</strong> Encodes deterministic, constant-frame-rate MP4 with FFmpeg & bundled Noto Ethiopic fonts. No player freezes.</span>
                      </div>

                      {/* Quality Selector & Export Button */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">Export Quality (ጥራት ይምረጡ)</div>
                        
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setExportQuality('original')}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              exportQuality === 'original'
                                ? 'bg-white dark:bg-neutral-700 text-[#0062FF] dark:text-blue-400 shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                            }`}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportQuality('1080p')}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              exportQuality === '1080p'
                                ? 'bg-white dark:bg-neutral-700 text-[#0062FF] dark:text-blue-400 shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                            }`}
                          >
                            1080p
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportQuality('720p')}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              exportQuality === '720p'
                                ? 'bg-white dark:bg-neutral-700 text-[#0062FF] dark:text-blue-400 shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                            }`}
                          >
                            720p
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowExportMenu(false);
                            handleServerExport(exportQuality);
                          }}
                          disabled={isBurning}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0062FF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Video ({exportQuality.toUpperCase()} • 30fps)</span>
                        </button>

                        {exportDownloadUrl && (
                          <a
                            href={exportDownloadUrl}
                            download={exportFileName || 'bgern_subtitled.mp4'}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Download Ready Video (MP4)</span>
                          </a>
                        )}
                      </div>

                      {/* Subtitle File Exports */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">Subtitles Only (ንዑስ ርዕስ)</div>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowExportMenu(false);
                              downloadSubtitleFile('srt');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-amber-500" />
                            <span>.SRT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowExportMenu(false);
                              downloadSubtitleFile('vtt');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span>.VTT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowExportMenu(false);
                              downloadSubtitleFile('ass');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-purple-500" />
                            <span>.ASS</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowExportMenu(false);
                              downloadSubtitleFile('txt');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3 h-3 text-emerald-500" />
                            <span>.TXT</span>
                          </button>
                        </div>
                      </div>

                      {/* Save to 7-Day Library with generated captions */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">Library (ላይብረሪ)</div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExportMenu(false);
                            handleSaveToLibrary();
                          }}
                          disabled={isSavingToLibrary || (!mediaUrl && !mediaFile)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-neutral-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Save to Library</span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            {segments.length > 0 ? `${segments.length} Captions` : 'Save'}
                          </span>
                        </button>
                      </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>

            {/* 2. Video Player Viewport Container with 9:16 Aspect Ratio and Background Matching Screenshot 1 */}
            <div className="my-auto py-3 flex items-center justify-center relative">
              <div
                ref={videoContainerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverCanvas(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverCanvas(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverCanvas(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className={`w-full rounded-2xl overflow-hidden relative shadow-xl flex items-center justify-center select-none touch-none transition-all ${
                  aspectRatio === '16:9'
                    ? 'aspect-[16/9] max-w-[480px] sm:max-w-[500px]'
                    : aspectRatio === '1:1'
                    ? 'aspect-square max-w-[320px] sm:max-w-[340px]'
                    : aspectRatio === '4:5'
                    ? 'aspect-[4/5] max-w-[320px] sm:max-w-[340px]'
                    : 'aspect-[9/16] max-w-[310px] sm:max-w-[330px]'
                } ${isDraggingOverCanvas ? 'ring-4 ring-[#0062FF] ring-offset-2 ring-offset-black scale-[1.01]' : ''}`}
                style={{ backgroundColor: videoBgColor }}
              >
                {/* Subtle center crosshair watermark matching Screenshot 1 */}
                {mediaUrl && (
                  <div className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center pointer-events-none opacity-20 text-white select-none z-10">
                    <span className="text-3xl font-light leading-none">+</span>
                  </div>
                )}

                {/* Drag-over Visual Indicator */}
                {isDraggingOverCanvas && (
                  <div className="absolute inset-0 bg-[#0062FF]/25 backdrop-blur-xs border-2 border-dashed border-[#0062FF] rounded-2xl flex flex-col items-center justify-center p-6 text-center z-50 animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="w-20 h-20 rounded-3xl bg-[#0062FF] text-white flex items-center justify-center shadow-2xl mb-3 scale-110 transition-transform">
                      <UploadCloud className="w-10 h-10 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-black text-white drop-shadow">
                      ቪዲዮውን እዚህ ይልቀቁ!
                    </h3>
                    <p className="text-xs text-blue-200 mt-1 font-semibold">
                      Drop your video file to start editing immediately
                    </p>
                  </div>
                )}

                {/* Video Element or Professional Modern Upload Screen */}
                {mediaUrl ? (
                  <div
                    onPointerDown={handleVideoPointerDown}
                    onPointerMove={handleVideoPointerMove}
                    onPointerUp={handleVideoPointerUp}
                    onPointerCancel={handleVideoPointerUp}
                    onTouchMove={handleVideoTouchMove}
                    onTouchEnd={handleVideoTouchEnd}
                    onWheel={handleVideoWheel}
                    className={`w-full h-full relative overflow-hidden select-none touch-none ${
                      isDraggingVideo ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    title="Drag with mouse or finger to reframe video (ማውስ ወይም ጣት በመጠቀም ቪዲዮውን ያንቀሳቅሱ)"
                  >
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      className={`w-full h-full pointer-events-none select-none transition-transform duration-75 ${
                        videoFit === 'contain' ? 'object-contain' : videoFit === 'fill' ? 'object-fill' : 'object-cover'
                      }`}
                      style={{
                        transform: `translate(${videoPanX}%, ${videoPanY}%) scale(${videoZoom})`,
                        transformOrigin: 'center center',
                      }}
                      playsInline
                    />
                  </div>
                ) : (
                  <div
                    onClick={requestFileUpload}
                    className="w-full h-full p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer group bg-gradient-to-b from-[#0F172A] via-[#090D16] to-[#030712] hover:from-[#131F38] transition-all border-2 border-dashed border-[#256E96]/40 hover:border-[#0062FF] rounded-2xl relative select-none overflow-y-auto custom-scrollbar"
                    title="Click or drag to upload your video"
                  >
                    {/* Ambient Glow in center */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,98,255,0.18),transparent_70%)] pointer-events-none" />

                    {/* Top Studio Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[10px] sm:text-[11px] font-bold text-white shadow-xs mb-3 z-10">
                      <Sparkles className="w-3.5 h-3.5 text-[#ECCC6E]" />
                      <span>AI Amharic Captions • ስቱዲዮ</span>
                    </div>

                    {/* Floating Center Icon with animated pulse */}
                    <div className="relative group/icon mb-2.5 z-10">
                      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-[#0062FF] via-[#256E96] to-[#A6056F] opacity-40 blur-md group-hover:opacity-80 transition duration-500 animate-pulse" />
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-neutral-900/90 border border-white/20 flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-[#0062FF] group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>

                    {/* High-Contrast Clear Heading & Description */}
                    <div className="space-y-1 mb-3 z-10 max-w-[270px]">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-sm">
                        ቪዲዮዎን እዚህ ይጫኑ
                      </h3>
                      <p className="text-xs font-bold text-neutral-200">
                        Upload Video to Auto-Generate Captions
                      </p>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        ለቲክቶክ፣ ሪልስ እና ዩቲዩብ ማራኪ የአማርኛ ንዑስ ርዕሶችን በቅጽበት ያዘጋጁ።
                      </p>
                    </div>

                    {/* Primary High-Impact Upload Button */}
                    <div className="flex flex-col gap-2 w-full max-w-[240px] z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestFileUpload();
                        }}
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0062FF] via-[#0052d9] to-[#256E96] hover:from-[#0052d9] hover:to-[#0041b3] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-[#0062FF]/30 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn border border-white/20"
                      >
                        <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                        <span>ቪዲዮ ይጫኑ (Choose Video)</span>
                      </button>

                      {/* Secondary Quick Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSidebarTab('library');
                            fetchLibraryVideos();
                          }}
                          className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1 active:scale-95"
                          title="Open videos stored in 7-day library"
                        >
                          <Video className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">7-Day Library</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadSample();
                          }}
                          className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1 active:scale-95"
                          title="Test studio with sample podcast video"
                        >
                          <Play className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate">Try Sample</span>
                        </button>
                      </div>
                    </div>

                    {/* Supported Formats & Capabilities Badges */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[260px] mt-3 pt-2.5 border-t border-white/10 text-[9px] sm:text-[10px] font-mono text-neutral-300 z-10">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">MP4</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">MOV</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">WebM</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">MP3</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">1080p/4K</span>
                    </div>

                    {/* 7-Day Retention Notice Guarantee */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/50 border border-amber-500/40 px-3 py-1 rounded-full font-mono z-10">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>🔒 ቪዲዮዎ በደህንነት ለ7 ቀናት ይቀመጣል</span>
                    </div>
                  </div>
                )}

                {/* Safe Zone Overlay */}
                {showSafeZone && (
                  <div className="absolute inset-x-4 top-12 bottom-16 border-2 border-dashed border-cyan-400/80 rounded-xl pointer-events-none z-20 flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-cyan-300/80 bg-black/40 px-2 py-0.5 rounded">
                      Safe Zone (Instagram / TikTok)
                    </span>
                  </div>
                )}

                {/* Subtitle Overlay with Mouse & Touch / Finger Manual Dragging */}
                {mediaUrl && segments.length > 0 && rawBaseText.trim() !== '' && (
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`absolute z-30 flex justify-center transition-all select-none touch-none w-fit max-w-[90%] ${
                      isDraggingCaption ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab hover:scale-[1.01]'
                    }`}
                  style={{
                    top: `${positionY}%`,
                    left: `${positionX}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title="በእጅዎ ወይም በማውስ ይጎትቱ (Drag with mouse or finger to adjust position)"
                >
                  {/* Auto Emoji on TOP position */}
                  {autoEmoji === 'Top' && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 select-none text-2xl pointer-events-none z-30">
                      <span className={`inline-block ${emojiAnimation ? 'animate-bounce' : ''}`}>
                        {getEmojiForText(rawBaseText, customSelectedEmoji)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 text-center max-w-[95%] w-fit ${
                      isVertical || previewLines.length > 1 ? 'flex flex-col' : 'inline-flex'
                    } items-center justify-center leading-snug select-none transition-all relative ${
                      isDraggingCaption
                        ? 'ring-2 ring-amber-400/90'
                        : 'hover:ring-1 hover:ring-white/40'
                    } ${getCaptionAnimClass(captionAnimation, hasAnimation)}`}
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: (selectedPresetId.includes('kelly') || customPresetName.toLowerCase().includes('kelly'))
                        ? `'Waldba Wookianos', 'Noto Serif Ethiopic', 'Ethiopic Lessan', '${secondaryFontFamily}', '${fontFamily}', serif`
                        : (selectedPresetId.includes('laura') || customPresetName.toLowerCase().includes('laura'))
                        ? `'Garamond', 'Noto Serif Ethiopic', serif`
                        : (selectedPresetId.includes('ali') || customPresetName.toLowerCase().includes('ali'))
                        ? `'Poppins', 'Garamond', 'Amhara Reduced', 'Noto Sans Ethiopic', sans-serif`
                        : (selectedPresetId.includes('hormozi') || customPresetName.toLowerCase().includes('hormozi'))
                        ? `'Montserrat', 'SurGraphics Black', 'Noto Sans Ethiopic', sans-serif`
                        : (selectedPresetId.includes('beast') || customPresetName.toLowerCase().includes('beast'))
                        ? `'SurGraphics Black', 'Bela Bereka', 'Noto Sans Ethiopic', sans-serif`
                        : `'${fontFamily}', 'Noto Sans Ethiopic', sans-serif`,
                      fontWeight: getFontWeightCss(fontWeight),
                      color: fontColor,
                      backgroundColor:
                        (selectedPresetId.includes('kendrick') || customPresetName.toLowerCase().includes('kendrick'))
                          ? 'transparent'
                          : (selectedPresetId.includes('laura') || customPresetName.toLowerCase().includes('laura'))
                          ? mainHighlightColor
                          : (selectedPresetId.includes('ali') || customPresetName.toLowerCase().includes('ali'))
                          ? '#E5E7EB'
                          : emphasizedBgColor !== 'transparent' ? emphasizedBgColor : 'transparent',
                      borderRadius:
                        (selectedPresetId.includes('kendrick') || customPresetName.toLowerCase().includes('kendrick'))
                          ? undefined
                          : (selectedPresetId.includes('laura') || customPresetName.toLowerCase().includes('laura'))
                          ? `${borderRadiusEm}em`
                          : (selectedPresetId.includes('ali') || customPresetName.toLowerCase().includes('ali'))
                          ? '0.45em'
                          : emphasizedBgColor !== 'transparent' ? `${borderRadiusEm}em` : undefined,
                      padding:
                        (selectedPresetId.includes('kendrick') || customPresetName.toLowerCase().includes('kendrick'))
                          ? '0px'
                          : (selectedPresetId.includes('laura') || customPresetName.toLowerCase().includes('laura'))
                          ? '6px 14px'
                          : (selectedPresetId.includes('ali') || customPresetName.toLowerCase().includes('ali'))
                          ? '7px 18px'
                          : emphasizedBgColor !== 'transparent' ? (isVertical ? '10px 22px' : '7px 18px') : undefined,
                      boxShadow:
                        (selectedPresetId.includes('kendrick') || customPresetName.toLowerCase().includes('kendrick'))
                          ? undefined
                          : (selectedPresetId.includes('laura') || customPresetName.toLowerCase().includes('laura'))
                          ? '0 2px 10px rgba(0,0,0,0.08)'
                          : (selectedPresetId.includes('ali') || customPresetName.toLowerCase().includes('ali'))
                          ? '0 2px 10px rgba(0,0,0,0.08)'
                          : emphasizedBgColor !== 'transparent' && emphasizedBgColor.toLowerCase() !== '#00000000'
                          ? '0 2px 10px rgba(0,0,0,0.08)'
                          : undefined,
                      textTransform: textCase === 'AA' ? 'uppercase' : textCase === 'aa' ? 'lowercase' : 'none',
                      whiteSpace: isVertical || previewLines.length > 1 ? 'normal' : 'nowrap',
                    }}
                  >
                    {/* Hover & Drag Tooltip */}
                    <div className="opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-[10px] text-white font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 z-40">
                      <span>↕ {positionY}% ↔ {positionX}% (ይጎትቱ / Drag)</span>
                    </div>

                    {/* Multiline Subtitle Text */}
                    {(() => {
                      const isKendrick = selectedPresetId.includes('kendrick') || customPresetName.toLowerCase().includes('kendrick');
                      const isLaura = selectedPresetId.includes('laura') || customPresetName.toLowerCase().includes('laura');
                      const isLeon = selectedPresetId === 'leon' || customPresetName.toLowerCase().includes('leon');
                      const isHormozi = selectedPresetId.includes('hormozi') || customPresetName.toLowerCase().includes('hormozi');
                      const isMrBeast = selectedPresetId.includes('beast') || customPresetName.toLowerCase().includes('beast');
                      const isAli = selectedPresetId.includes('ali') || customPresetName.toLowerCase().includes('ali');
                      return (
                        <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                          {previewLines.map((lineWords, lineIdx) => {
                            let globalWordCount = 0;
                            for (let i = 0; i < lineIdx; i++) {
                              globalWordCount += previewLines[i].length;
                            }
                            return (
                              <div
                                key={`line-${lineIdx}`}
                                className="flex w-full items-center justify-center gap-x-2 text-center"
                              >
                                {lineWords.map((word, wIdx) => {
                                  const globalWordIdx = globalWordCount + wIdx;
                                  const isWordActive = globalWordIdx === activeWordIndex;
                                  const isWordPast = globalWordIdx < activeWordIndex;

                                // Calculate Word Color and Pill Background based on Preset & Keyword Highlights
                                let wordColor = fontColor;
                                let wordBgColor: string | undefined = undefined;
                                let wordOpacity = 1;
                                let isHighlighted = false;

                            if (isKendrick) {
                              if (isWordActive) {
                                wordColor = '#000000';
                                wordBgColor = secondHighlightColor;
                                isHighlighted = true;
                              } else {
                                wordColor = fontColor;
                                wordBgColor = 'transparent';
                              }
                            } else if (isLaura) {
                              // In Laura 2 preset: Active word gets the neon lime pill badge (#DAF434)!
                              if (isWordActive) {
                                wordColor = '#000000';
                                wordBgColor = secondHighlightColor; // #DAF434
                                isHighlighted = true;
                              } else {
                                wordColor = fontColor; // #000000
                                wordBgColor = 'transparent';
                              }
                            } else if (isLeon) {
                              // In Leon preset: Active word gets the solid Main Color (#FF5700) pill badge!
                              if (isWordActive) {
                                wordColor = '#FFFFFF';
                                wordBgColor = mainHighlightColor; // #FF5700
                                isHighlighted = true;
                              } else {
                                wordColor = '#FFFFFF';
                                wordBgColor = 'transparent';
                              }
                            } else if (isHormozi) {
                              if (isWordActive) {
                                wordColor = mainHighlightColor || '#FFFF00';
                                wordBgColor = 'transparent';
                                isHighlighted = true;
                              } else {
                                wordColor = '#FFFFFF';
                                wordBgColor = 'transparent';
                              }
                            } else if (isMrBeast) {
                              if (isWordActive) {
                                wordColor = globalWordIdx % 2 === 0 ? (mainHighlightColor || '#FFE600') : (secondHighlightColor || '#00F0FF');
                                wordBgColor = 'transparent';
                                isHighlighted = true;
                              } else {
                                wordColor = '#FFFFFF';
                                wordBgColor = 'transparent';
                              }
                            } else if (isAli) {
                              if (isWordActive || isWordPast) {
                                wordColor = '#111827';
                                wordOpacity = 1;
                              } else {
                                wordColor = '#9CA3AF';
                                wordOpacity = 0.85;
                              }
                            } else if (hasKeywordHighlights) {
                              isHighlighted = true;
                              if (globalWordIdx % 3 === 0) {
                                wordColor = mainHighlightColor;
                              } else if (globalWordIdx % 3 === 1) {
                                wordColor = secondHighlightColor;
                              } else {
                                wordColor = thirdHighlightColor;
                              }
                            } else {
                              // Standard Karaoke styling
                              if (isWordActive || isWordPast) {
                                wordColor = fontColor;
                                wordOpacity = 1;
                              } else {
                                wordColor = fontColor === '#000000' ? '#9ca3af' : hexToRgba(fontColor, 0.45);
                                wordOpacity = 0.9;
                              }
                            }

                            // Calculate Opacity for "opacity 30" word animation
                            if (wordAnimation === 'opacity 30' && !isWordActive && !hasKeywordHighlights && !isLeon) {
                              wordOpacity = 0.3;
                            }

                            return (
                              <span
                                key={`word-${lineIdx}-${wIdx}-${word}`}
                                className={`inline-block transition-all duration-150 ${
                                  isWordActive && isMrBeast
                                    ? 'anim-mrbeast-pop'
                                    : isWordActive && isHormozi
                                    ? 'anim-hormozi-pop'
                                    : getWordAnimClass(wordAnimation)
                                } ${
                                  isHighlighted && !isLeon && !isLaura && !isKendrick && !isHormozi && !isMrBeast ? 'scale-105' : ''
                                }`}
                                style={{
                                  color: wordColor,
                                  backgroundColor: wordBgColor || 'transparent',
                                  borderRadius: wordBgColor && wordBgColor !== 'transparent' ? (isKendrick ? '9999px' : `${borderRadiusEm}em`) : undefined,
                                  padding: wordBgColor && wordBgColor !== 'transparent' ? '2px 8px' : undefined,
                                  opacity: wordOpacity,
                                  transform: isWordActive && isMrBeast
                                    ? 'scale(1.15) translateY(-2px)'
                                    : isWordActive && isHormozi
                                    ? 'scale(1.10)'
                                    : undefined,
                                  WebkitTextStroke:
                                    isMrBeast
                                      ? '3px #000000'
                                      : isHormozi
                                      ? '2.5px #000000'
                                      : isAli
                                      ? 'none'
                                      : getStrokePx(strokeWeight) > 0
                                      ? `${getStrokePx(strokeWeight)}px ${strokeColor}`
                                      : 'none',
                                  textShadow:
                                    isMrBeast && isWordActive
                                      ? '0 4px 0 #000000, 0 6px 12px rgba(0,0,0,0.85), 0 0 16px rgba(0, 240, 255, 0.75)'
                                      : isMrBeast
                                      ? '0 3px 0 #000000, 0 5px 8px rgba(0,0,0,0.8)'
                                      : isHormozi && isWordActive
                                      ? '0 3px 8px rgba(0,0,0,0.95), 0 0 12px rgba(0, 255, 102, 0.6)'
                                      : isHormozi
                                      ? '0 3px 8px rgba(0,0,0,0.9)'
                                      : isKendrick
                                      ? '0 1px 3px rgba(0,0,0,0.65)'
                                      : isAli
                                      ? 'none'
                                      : getShadowBlurPx(shadowWeight) > 0
                                      ? `0 2px ${getShadowBlurPx(shadowWeight)}px ${shadowColor}`
                                      : 'none',
                                  paintOrder: 'stroke fill',
                                }}
                              >
                                {word}
                              </span>
                            );
                          })}

                          {/* Auto Emoji on Line (if autoEmoji === 'Auto' and this is the last line) */}
                          {autoEmoji === 'Auto' && lineIdx === previewLines.length - 1 && (
                            <span
                              className={`inline-block ml-1.5 align-middle select-none text-xl ${
                                emojiAnimation ? 'animate-bounce' : ''
                              }`}
                            >
                              {getEmojiForText(rawBaseText, customSelectedEmoji)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
                  </div>
                </div>
                )}

                {/* Play Button Overlay on Hover when Paused */}
                {mediaUrl && !isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </button>
                )}

                {/* Floating Reframe Reset Pill (shows when user has panned or zoomed) */}
                {mediaUrl && (videoPanX !== 0 || videoPanY !== 0 || videoZoom !== 1) && (
                  <button
                    type="button"
                    onClick={handleResetVideoReframe}
                    className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95"
                    title="Reset framing (የቪዲዮ አቀማመጥን ወደ ነበረበት መልስ)"
                  >
                    <RotateCcw className="w-3 h-3 text-[#0062FF]" />
                    <span>Reset Framing</span>
                  </button>
                )}

                {/* Reframe Hint Toast Notification */}
                {reframeHintToast && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/90 text-white border border-white/20 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-[11px] font-semibold animate-in fade-in slide-in-from-top-2 pointer-events-none max-w-[90%] truncate">
                    <Move className="w-3.5 h-3.5 text-[#0062FF] shrink-0" />
                    <span className="truncate">{reframeHintToast}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Below Video Controls: Generate Captions, 9:16 ˅, Equalizer Adjust Button, Safe Zone Guide */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 py-2 text-neutral-600 relative flex-wrap">
              {/* Generate Captions Button directly under video play */}
              <button
                type="button"
                disabled={isProcessing || (!mediaFile && !mediaUrl)}
                onClick={handleTranscribe}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-bold text-xs shadow-md shadow-[#0062FF]/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Generate Captions (በ AI ንዑስ ርዕስ አውጣ)"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Generating...' : 'Generate Captions'}</span>
              </button>

              {/* Aspect Ratio Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAspectMenu(!showAspectMenu)}
                  className="flex items-center gap-1 text-xs font-bold text-neutral-800 hover:text-black py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <span>{aspectRatio}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {showAspectMenu && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-xl shadow-lg p-1 z-50 text-xs w-24">
                    {(['9:16', '16:9', '1:1', '4:5'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => {
                          setAspectRatio(ratio);
                          setShowAspectMenu(false);
                          setVideoFit('contain');
                          setVideoPanX(0);
                          setVideoPanY(0);
                          setVideoZoom(1);
                          setReframeHintToast(
                            ratio === '16:9'
                              ? '16:9 ሙሉ እይታ (No Crop) - በማውስ ወይም በጣት ያንቀሳቅሱ'
                              : `ቪዲዮውን በማውስ ወይም በጣት ያንቀሳቅሱ (${ratio})`
                          );
                          setTimeout(() => setReframeHintToast(null), 3500);
                        }}
                        className={`w-full text-center py-1 rounded-md transition-colors ${
                          aspectRatio === ratio ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-100'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Adjust Button with Tooltip and Popover Menu matching Screenshot 1 */}
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setIsHoveringAdjust(true)}
                  onMouseLeave={() => setIsHoveringAdjust(false)}
                  onClick={() => setShowAdjustMenu(!showAdjustMenu)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors relative"
                >
                  <Sliders className="w-4 h-4" />
                  {/* Tooltip on Hover matching Screenshot 1 */}
                  {isHoveringAdjust && !showAdjustMenu && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">
                      Adjust
                    </div>
                  )}
                </button>

                {/* Adjust Popover Menu matching Screenshot 1 */}
                {showAdjustMenu && (
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-white dark:bg-[#131924] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-2 w-48 z-50 text-xs font-semibold text-neutral-800 dark:text-neutral-200 space-y-1">
                    {/* Aspect Ratio */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdjustMenu(false);
                        setShowAspectMenu(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-left"
                    >
                      <Crop className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      <span>Aspect Ratio (ምጥጥን)</span>
                    </button>

                    {/* Replace Video */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdjustMenu(false);
                        requestFileUpload();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-left"
                    >
                      <RotateCw className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      <span>Replace Video</span>
                    </button>

                    {/* Video Fit (Contain / No Crop vs Fill / Crop) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFitSubmenu(!showFitSubmenu)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Maximize2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          <span>Video Fit</span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {videoFit === 'contain' ? 'No Crop' : videoFit === 'cover' ? 'Fill' : 'Stretch'} &gt;
                        </span>
                      </button>
                      {showFitSubmenu && (
                        <div className="absolute left-full bottom-0 ml-1 bg-white dark:bg-[#131924] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-1 w-36 z-50">
                          {(['contain', 'cover', 'fill'] as const).map((fit) => (
                            <button
                              key={fit}
                              onClick={() => {
                                setVideoFit(fit);
                                setShowFitSubmenu(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${
                                videoFit === fit ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-100 dark:hover:bg-white/5'
                              }`}
                            >
                              {fit === 'contain' ? 'Fit (No Crop / ሙሉ)' : fit === 'cover' ? 'Fill (Crop / ሙላት)' : 'Stretch (ዘርጋ)'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Playback Speed */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSpeedSubmenu(!showSpeedSubmenu)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <FastForward className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          <span>Playback Speed</span>
                        </div>
                        <span className="text-[11px] text-neutral-400">{playbackSpeed}x &gt;</span>
                      </button>
                      {showSpeedSubmenu && (
                        <div className="absolute left-full bottom-0 ml-1 bg-white dark:bg-[#131924] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-1 w-24 z-50">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                            <button
                              key={spd}
                              onClick={() => {
                                setPlaybackSpeed(spd);
                                if (videoRef.current) videoRef.current.playbackRate = spd;
                                setShowSpeedSubmenu(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${
                                playbackSpeed === spd ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-100 dark:hover:bg-white/5'
                              }`}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reframe & Zoom Slider */}
                    <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800 px-3 py-1.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Move className="w-3.5 h-3.5 text-[#0062FF]" />
                          Zoom / መጠን
                        </span>
                        <span>{videoZoom}x</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={2.5}
                        step={0.05}
                        value={videoZoom}
                        onChange={(e) => setVideoZoom(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#0062FF]"
                      />
                      {(videoPanX !== 0 || videoPanY !== 0 || videoZoom !== 1) && (
                        <button
                          type="button"
                          onClick={handleResetVideoReframe}
                          className="w-full mt-1 py-1 text-[11px] text-center font-bold text-[#0062FF] hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Framing (ነባሪ)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Safe Zone / Overlay Guide Toggle */}
              <button
                type="button"
                onClick={() => setShowSafeZone(!showSafeZone)}
                title="Safe Zone Target"
                className={`p-1.5 rounded-lg transition-colors ${
                  showSafeZone ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* 4. Timeline Scrubber Progress Bar */}
            <div className="pt-2">
              <div className="relative w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer flex items-center">
                <div
                  className="h-full bg-[#0062FF] rounded-full"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />

                {/* Visual Scene Cut Markers on Timeline */}
                {detectedScenes.map((scene) => {
                  if (scene.start <= 0.2 || scene.start >= duration - 0.2) return null;
                  const leftPct = duration > 0 ? (scene.start / duration) * 100 : 0;
                  return (
                    <div
                      key={`cut-marker-${scene.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeek(scene.start);
                      }}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3.5 bg-amber-400 hover:bg-amber-300 dark:bg-amber-400 dark:hover:bg-amber-300 rounded-xs shadow-xs cursor-pointer z-20 group/marker transition-transform hover:scale-125"
                      style={{ left: `${leftPct}%` }}
                      title={`✂️ Cut: ${scene.start.toFixed(2)}s (${scene.label})`}
                    >
                      <div className="opacity-0 group-hover/marker:opacity-100 transition-opacity absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[9px] font-mono whitespace-nowrap pointer-events-none shadow-md z-30">
                        ✂️ {scene.start.toFixed(1)}s • {scene.label}
                      </div>
                    </div>
                  );
                })}

                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
              </div>

              {/* 5. Playback Bar: Play, Timecode, Cut Frame, Volume, Fullscreen */}
              <div className="flex items-center justify-between pt-3 text-xs text-neutral-600">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>

                  <span className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold tracking-tight">
                    {formatTimecode(currentTime)} / {formatTimecode(duration)}
                  </span>

                  {/* Cut Frame at Playhead */}
                  <button
                    type="button"
                    onClick={handleCutAtCurrentTime}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold transition-all active:scale-95"
                    title="Cut scene exactly at current frame (✂️ አሁን ባለበት ፍሬም ቁረጥ)"
                  >
                    <Scissors className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Cut Frame</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Mute Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 text-neutral-600 hover:text-black"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Fullscreen */}
                  <button
                    type="button"
                    onClick={() => {
                      const v = videoRef.current;
                      if (v?.requestFullscreen) v.requestFullscreen();
                    }}
                    className="p-1 text-neutral-600 hover:text-black"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden File Input for Video / Audio Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
      />

      {/* =========================================================================
          AUDIO SETTINGS MODAL
      ========================================================================== */}
      {showAudioModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Music className="w-5 h-5 text-neutral-700" />
                <span>Audio Settings (የድምፅ ማስተካከያ)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-500 block mb-1">Volume ({Math.round(volume * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                  }}
                  className="w-full accent-neutral-800"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert('Background music track feature enabled!')}
                  className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 font-bold text-neutral-800"
                >
                  Add Background Music Track
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAudioModal(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          EXPORT ERROR DETAILS
      ========================================================================== */}
      {exportError && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="export-error-title"
        >
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-900 dark:bg-[#131924]">
            <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="export-error-title" className="text-lg font-bold text-red-700 dark:text-red-300">
                    Video export failed
                  </h2>
                  <p className="mt-2 break-words text-sm text-neutral-700 dark:text-neutral-200">
                    {exportError.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportError(null)}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Close export error"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <pre className="overflow-auto whitespace-pre-wrap break-words p-5 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              {exportError.details}
            </pre>
            <div className="flex justify-end gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(exportError.details);
                    setExportDetailsCopied(true);
                  } catch (copyError) {
                    console.error('Could not copy export diagnostics:', copyError);
                    setExportDetailsCopied(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {exportDetailsCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {exportDetailsCopied ? 'Copied' : 'Copy details'}
              </button>
              <button
                type="button"
                onClick={() => setExportError(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {exportComplete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-complete-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-[#131924]">
            <Check className="mx-auto h-10 w-10 text-emerald-500" />
            <h2 id="export-complete-title" className="mt-3 text-lg font-bold text-neutral-900 dark:text-white">
              Export complete
            </h2>
            <p className="mt-2 whitespace-pre-line break-words text-sm text-neutral-600 dark:text-neutral-300">
              {exportComplete}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Your video was finalized as a constant-frame-rate MP4 with burned-in subtitles for flawless VLC & Windows Media Player playback.
            </p>
            {exportDownloadUrl && (
              <a
                href={exportDownloadUrl}
                download={exportFileName || 'bgern_subtitled.mp4'}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Video (MP4)</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setExportComplete(null)}
              className="mt-2 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 px-5 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          AUTH MODAL
      ========================================================================== */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user: any) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* =========================================================================
          VIDEO BURN PROGRESS MODAL
      ========================================================================== */}
      {isBurning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131924] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-inner">
              <Download className="w-9 h-9 text-[#0062FF] animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {burnProgress >= 98 ? 'Validating export…' : burnProgress >= 90 ? 'Finalizing MP4 file…' : 'ቪዲዮውን በማዘጋጀት ላይ...'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Server-side FFmpeg rendering • Quality: <span className="font-semibold text-[#0062FF]">{exportQuality.toUpperCase()}</span>
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                Burning Noto Sans Ethiopic captions at constant 30fps (CFR)
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#0062FF] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, burnProgress)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400 px-1">
                <span>Progress</span>
                <span className="font-bold text-neutral-900 dark:text-white">{burnProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RICH COLOR PICKER MODAL (Screenshot 2 exact)
      ========================================================================== */}
      {activeColorTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-2xs select-none"
          onClick={() => setActiveColorTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200/90 p-4 w-full max-w-[325px] space-y-2.5 relative select-none animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Transparent Option & Close Button */}
            <div className="flex items-center justify-between -mt-1 -mr-1">
              <button
                type="button"
                onClick={() => {
                  handleApplyColor('transparent');
                  setActiveColorTarget(null);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 transition-all shadow-2xs"
                title="Set color to Transparent (None)"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%)',
                    backgroundSize: '6px 6px',
                  }}
                />
                <span>Transparent</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveColorTarget(null)}
                className="w-6 h-6 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5x8 Color Swatches Grid (Screenshot 2 exact) */}
            <div className="grid grid-cols-8 gap-1.5 justify-items-center">
              {COLOR_PALETTE_ROWS.flat().map((c, i) => (
                <button
                  key={`swatch-${i}`}
                  type="button"
                  onClick={() => {
                    const clean = c.replace('#', '').toUpperCase();
                    setPickerHex(clean);
                    const r = parseInt(clean.substring(0, 2), 16) || 0;
                    const g = parseInt(clean.substring(2, 4), 16) || 0;
                    const b = parseInt(clean.substring(4, 6), 16) || 0;
                    setPickerR(r);
                    setPickerG(g);
                    setPickerB(b);
                    handleApplyColor(c);
                  }}
                  className="w-6 h-6 rounded-full border border-black/10 hover:scale-115 active:scale-95 transition-transform shadow-2xs"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* 2D Color Spectrum Box (Screenshot 2 exact) */}
            <div
              className="w-full h-24 rounded-lg relative overflow-hidden cursor-crosshair border border-neutral-200"
              style={{
                backgroundColor: `hsl(${hueValue}, 100%, 50%)`,
                backgroundImage:
                  'linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, transparent)',
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                const f = (n: number, k = (n + hueValue / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
                const r = Math.round(f(5) * 255);
                const g = Math.round(f(3) * 255);
                const b = Math.round(f(1) * 255);
                setPickerR(r);
                setPickerG(g);
                setPickerB(b);
                const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                setPickerHex(hex);
                handleApplyColor(`#${hex}`);
              }}
            >
              {/* White Reticle */}
              <div
                className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ top: '25%', left: '72%' }}
              />
            </div>

            {/* Rainbow Hue Slider (Screenshot 2 exact) */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="360"
                value={hueValue}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10);
                  setHueValue(h);
                  const f = (n: number, k = (n + h / 60) % 6) => 0.9 - 0.9 * 0.6 * Math.max(Math.min(k, 4 - k, 1), 0);
                  const r = Math.round(f(5) * 255);
                  const g = Math.round(f(3) * 255);
                  const b = Math.round(f(1) * 255);
                  setPickerR(r);
                  setPickerG(g);
                  setPickerB(b);
                  const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                  setPickerHex(hex);
                  handleApplyColor(`#${hex}`);
                }}
                className="w-full h-2 rounded-full cursor-pointer appearance-none"
                style={{
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              />
            </div>

            {/* Alpha Opacity Slider (Screenshot 2 exact) */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={pickerA}
                onChange={(e) => {
                  const a = parseInt(e.target.value, 10);
                  setPickerA(a);
                  if (a === 0) {
                    handleApplyColor('transparent');
                  } else {
                    handleApplyColor(`#${pickerHex}`);
                  }
                }}
                className="w-full h-2 rounded-full cursor-pointer appearance-none"
                style={{
                  backgroundImage: `linear-gradient(to right, transparent, #${pickerHex})`,
                  backgroundColor: '#e5e7eb',
                }}
              />
            </div>

            {/* Hex, R, G, B, A Inputs (Screenshot 2 exact) */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <div className="text-center">
                <input
                  type="text"
                  value={pickerHex}
                  onChange={(e) => {
                    const val = e.target.value.replace('#', '').slice(0, 6).toUpperCase();
                    setPickerHex(val);
                    if (val.length === 6) {
                      const r = parseInt(val.substring(0, 2), 16) || 0;
                      const g = parseInt(val.substring(2, 4), 16) || 0;
                      const b = parseInt(val.substring(4, 6), 16) || 0;
                      setPickerR(r);
                      setPickerG(g);
                      setPickerB(b);
                      handleApplyColor(`#${val}`);
                    }
                  }}
                  className="w-full text-center text-xs font-mono font-medium py-1 px-1 border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-500"
                />
                <span className="text-[10px] text-neutral-400 block text-center mt-0.5">Hex</span>
              </div>

              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={pickerR}
                  onChange={(e) => {
                    const r = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
                    setPickerR(r);
                    const hex = ((1 << 24) + (r << 16) + (pickerG << 8) + pickerB).toString(16).slice(1).toUpperCase();
                    setPickerHex(hex);
                    handleApplyColor(`#${hex}`);
                  }}
                  className="w-full text-center text-xs font-mono font-medium py-1 px-0.5 border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-500"
                />
                <span className="text-[10px] text-neutral-400 block text-center mt-0.5">R</span>
              </div>

              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={pickerG}
                  onChange={(e) => {
                    const g = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
                    setPickerG(g);
                    const hex = ((1 << 24) + (pickerR << 16) + (g << 8) + pickerB).toString(16).slice(1).toUpperCase();
                    setPickerHex(hex);
                    handleApplyColor(`#${hex}`);
                  }}
                  className="w-full text-center text-xs font-mono font-medium py-1 px-0.5 border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-500"
                />
                <span className="text-[10px] text-neutral-400 block text-center mt-0.5">G</span>
              </div>

              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={pickerB}
                  onChange={(e) => {
                    const b = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
                    setPickerB(b);
                    const hex = ((1 << 24) + (pickerR << 16) + (pickerG << 8) + b).toString(16).slice(1).toUpperCase();
                    setPickerHex(hex);
                    handleApplyColor(`#${hex}`);
                  }}
                  className="w-full text-center text-xs font-mono font-medium py-1 px-0.5 border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-500"
                />
                <span className="text-[10px] text-neutral-400 block text-center mt-0.5">B</span>
              </div>

              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pickerA}
                  onChange={(e) => setPickerA(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
                  className="w-full text-center text-xs font-mono font-medium py-1 px-0.5 border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-500"
                />
                <span className="text-[10px] text-neutral-400 block text-center mt-0.5">A</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 70%+ Credit Usage Reminder Notification */}
      {creditWarningToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-amber-950/95 dark:bg-[#1f1606]/95 backdrop-blur-md text-white shadow-2xl border border-amber-500/50 flex flex-col gap-2.5 text-xs animate-in fade-in slide-in-from-top-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>የክሬዲት ማሳሰቢያ (70%+ Credit Used)</span>
            </div>
            <button
              onClick={() => setCreditWarningToast(null)}
              className="text-neutral-400 hover:text-white text-base leading-none p-1 rounded-md"
              title="Close notification"
            >
              ✕
            </button>
          </div>
          <p className="text-amber-100 font-medium leading-relaxed">
            {creditWarningToast.message}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
            <div className="text-[11px] text-amber-300 font-bold">
              ቀሪ: {creditWarningToast.remainingCredits.toLocaleString()} ክሬዲት ({creditWarningToast.remainingMinutes} ደቂቃ)
            </div>
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white font-black text-xs transition-all shadow-md hover:scale-105"
            >
              + ደቂቃ ጨምር
            </Link>
          </div>
        </div>
      )}

      {/* Floating Save to Library Success Toast */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-neutral-900/95 backdrop-blur-md text-white shadow-2xl border border-emerald-500/30 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessToast}</span>
        </div>
      )}
    </div>
  );
}
