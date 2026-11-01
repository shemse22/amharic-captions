'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Copy,
  Check,
  Sparkles,
  Users,
  Film,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Minus,
  UserCheck,
  UserX,
  X,
  Layers,
  DollarSign,
  Receipt,
  Info,
  Landmark,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  Play,
  Sun,
  Moon,
  Video,
  BookOpen,
  FileText,
  Globe,
  UploadCloud,
  Image as ImageIcon,
  Code,
  ListOrdered,
  Quote,
  Send,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import NotificationBell from '@/components/NotificationBell';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface PaymentItem {
  id: number;
  userId: number;
  userEmail?: string;
  userName?: string;
  planName: 'LITE' | 'PLUS' | 'PRO' | 'MAX';
  amountEtb: number;
  transactionRef: string;
  screenshotPath?: string;
  status: 'pending' | 'approved' | 'rejected';
  minutesCredited: number;
  creditsCredited: number;
  createdAt: string;
}

interface VideoItem {
  id: number;
  userId: number;
  userEmail?: string;
  title: string;
  videoUrl?: string;
  durationSec: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  minutes_balance: number;
  credits: number;
  isAdmin: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface PaymentMethodItem {
  id: number;
  name: string;
  amharicName?: string;
  account: string;
  holder: string;
  color?: string;
  badge?: string;
  instruction?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminStats {
  totalBalanceEtb: number;
  pendingAmountEtb: number;
  totalRequests: number;
  totalPendings: number;
  pendingPaymentsCount: number;
  pendingVideosCount: number;
  approvedPaymentsCount: number;
  rejectedPaymentsCount: number;
  totalVideos: number;
  approvedVideosCount: number;
  rejectedVideosCount: number;
  totalUsers: number;
  totalCreditsCirculating: number;
  totalMinutesCirculating: number;
  revenueBreakdown: {
    telebirr: number;
    cbeBirr: number;
    other: number;
  };
}

export default function AdminDashboardPage() {
  const { theme, toggleTheme } = useTheme();

  // Authentication & Security State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminGateView, setAdminGateView] = useState<'login' | 'reset-request' | 'reset-confirm'>('login');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetTokenOrCode, setResetTokenOrCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'payments' | 'analytics' | 'payment-methods' | 'blog'>('payments');

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Blog CMS State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any | null>(null);
  const [blogForm, setBlogForm] = useState<{
    id?: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string;
    coverImage: string;
    status: 'published' | 'draft';
  }>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Tips & Tricks',
    tags: 'Amharic, Captions, AI',
    coverImage: '/podcast-preview.jpg',
    status: 'published',
  });
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [deleteBlogConfirmId, setDeleteBlogConfirmId] = useState<number | null>(null);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('All');
  const [blogStatusFilter, setBlogStatusFilter] = useState('all');
  const [blogEditorTab, setBlogEditorTab] = useState<'write' | 'preview'>('write');
  const [isUploadingBlogCover, setIsUploadingBlogCover] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const blogCoverInputRef = React.useRef<HTMLInputElement | null>(null);

  // Payment Methods Modal States
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [methodForm, setMethodForm] = useState<{
    id?: number;
    name: string;
    amharicName: string;
    account: string;
    holder: string;
    badge: string;
    color: string;
    instruction: string;
    isActive: boolean;
    order: number;
  }>({
    name: '',
    amharicName: '',
    account: '',
    holder: '',
    badge: 'Active',
    color: '#0062FF',
    instruction: '',
    isActive: true,
    order: 1,
  });
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [deleteConfirmMethod, setDeleteConfirmMethod] = useState<PaymentMethodItem | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [videoStatusFilter, setVideoStatusFilter] = useState<'all' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('all');

  // Modals
  const [inspectorPayment, setInspectorPayment] = useState<PaymentItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  const [rejectModalTarget, setRejectModalTarget] = useState<{ type: 'payment' | 'video'; id: number; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [creditModalUser, setCreditModalUser] = useState<UserItem | null>(null);
  const [minutesDelta, setMinutesDelta] = useState(15);
  const [creditsDelta, setCreditsDelta] = useState(60000);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<VideoItem | null>(null);

  // Admin Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [showChangeNewPassword, setShowChangeNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [isConnectingSupportBot, setIsConnectingSupportBot] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConnectSupportBot = async () => {
    setIsConnectingSupportBot(true);
    try {
      const response = await fetch('/api/admin/telegram/support-setup', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await response.json().catch(() => null);
      if (!data || typeof data !== 'object') {
        throw new Error(
          `The setup endpoint returned an unreadable response (HTTP ${response.status}). Verify this support-bot update is deployed and try again.`
        );
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not connect the Telegram support bot.');
      }
      showToast(data.message || 'Telegram support bot connected.', data.warning ? 'info' : 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not connect the Telegram support bot.',
        'error'
      );
    } finally {
      setIsConnectingSupportBot(false);
    }
  };

  // 1. Verify Admin Session on Load & Check for an OTP recovery request
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'reset') {
        setAdminGateView('reset-request');
      }
    }
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (data.authenticated && data.isAdmin) {
        setIsAdminAuthenticated(true);
        setCurrentUser(data.user);
        loadDashboardData();
      } else {
        setIsAdminAuthenticated(false);
        setLoading(false);
      }
    } catch {
      setIsAdminAuthenticated(false);
      setLoading(false);
    }
  };

  // 1. Admin Login
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pwd = adminPasswordInput;

    if (!pwd) {
      setAuthError('Admin password is required. Please enter your password.');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthSuccessMessage('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'thebigel16@gmail.com',
          password: pwd,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status}). Please restart Node.js app in cPanel.` };
      }

      if (res.ok && data.success) {
        setIsAdminAuthenticated(true);
        setCurrentUser(data.user);
        showToast('Admin clearance verified! Welcome to Bgern Console.', 'success');
        loadDashboardData();
      } else {
        setAuthError(data.error || 'Authentication failed. Please check your password.');
        if (data.needsPasswordSetup) {
          setAdminGateView('reset-request');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Connection error during authentication');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // 2. Request an email verification code
  const handleRequestPasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthSuccessMessage('');

    try {
      const res = await fetch('/api/admin/reset-password/request', {
        method: 'POST',
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status}). Please restart Node.js app in cPanel.` };
      }

      if (res.ok && data.success) {
        setAuthSuccessMessage(data.message || 'Verification code sent to the admin email.');
        showToast('Verification code sent. Check the admin email.', 'success');
        setAdminGateView('reset-confirm');
      } else {
        setAuthError(data.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error sending reset email');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // 3. Confirm Password Reset with the email verification code
  const handleConfirmPasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetTokenOrCode.trim()) {
      setAuthError('Please enter the 6-digit verification code from your email.');
      return;
    }
    if (!newPassword || newPassword.length < 12) {
      setAuthError('Password must be at least 12 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthSuccessMessage('');

    try {
      const res = await fetch('/api/admin/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: resetTokenOrCode.trim(),
          newPassword,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status}). Please restart Node.js app in cPanel.` };
      }

      if (res.ok && data.success) {
        setIsAdminAuthenticated(true);
        setCurrentUser(data.user);
        showToast('Password updated successfully! Welcome to Admin Console.', 'success');
        loadDashboardData();
      } else {
        setAuthError(data.error || 'Failed to update password. Code may have expired.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error confirming password reset');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // 4. Admin Logout Handler
  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsAdminAuthenticated(false);
    setCurrentUser(null);
    setAdminGateView('login');
    setAdminPasswordInput('');
    showToast('Admin session logged out successfully.', 'info');
  };

  // 5. Change Admin Password (While Logged In)
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeNewPassword || changeNewPassword.length < 12) {
      setChangePasswordError('New password must be at least 12 characters long.');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    setChangePasswordError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changeCurrentPassword,
          newPassword: changeNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Admin password updated successfully!', 'success');
        setIsChangePasswordModalOpen(false);
        setChangeCurrentPassword('');
        setChangeNewPassword('');
        setChangeConfirmPassword('');
      } else {
        setChangePasswordError(data.error || 'Failed to update admin password.');
      }
    } catch (err: any) {
      setChangePasswordError(err.message || 'Error updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 2. Load Dashboard Data (Stats, Payments, Videos, Users)
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes, videosRes, usersRes, methodsRes, blogRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/payments?status=all').then((r) => r.json()),
        fetch('/api/admin/videos?status=all').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/payment-methods').then((r) => r.json()),
        fetch('/api/admin/blog').then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (paymentsRes.success) setPayments(paymentsRes.payments);
      if (videosRes.success) setVideos(videosRes.videos);
      if (usersRes.success) setUsers(usersRes.users);
      if (methodsRes?.success && methodsRes.methods) setPaymentMethods(methodsRes.methods);
      if (blogRes?.success && blogRes.posts) setBlogPosts(blogRes.posts);
    } catch (err: any) {
      showToast('Failed to load some dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reload payment methods specifically
  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/admin/payment-methods');
      const data = await res.json();
      if (data?.success && data.methods) {
        setPaymentMethods(data.methods);
      }
    } catch {}
  };

  // Reload blog posts specifically
  const fetchBlogPosts = async () => {
    try {
      const q = new URLSearchParams();
      if (blogStatusFilter !== 'all') q.set('status', blogStatusFilter);
      if (blogCategoryFilter !== 'All') q.set('category', blogCategoryFilter);
      if (blogSearch.trim()) q.set('search', blogSearch.trim());
      const res = await fetch(`/api/admin/blog?${q.toString()}`);
      const data = await res.json();
      if (data.success && data.posts) {
        setBlogPosts(data.posts);
      }
    } catch {}
  };

  // Blog Handlers
  const handleOpenCreateBlog = () => {
    setEditingBlogPost(null);
    setBlogEditorTab('write');
    setShowCustomUrlInput(false);
    setBlogForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Tips & Tricks',
      tags: 'Amharic, Captions, AI',
      coverImage: '/podcast-preview.jpg',
      status: 'published',
    });
    setIsBlogModalOpen(true);
  };

  const handleOpenEditBlog = (post: any) => {
    setEditingBlogPost(post);
    setBlogEditorTab('write');
    setShowCustomUrlInput(false);
    setBlogForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      coverImage: post.coverImage || '/podcast-preview.jpg',
      status: post.status || 'published',
    });
    setIsBlogModalOpen(true);
  };

  const handleBlogCoverUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WebP, etc.)', 'error');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast('Image size exceeds 12MB limit', 'error');
      return;
    }

    setIsUploadingBlogCover(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload/blog-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setBlogForm((prev) => ({ ...prev, coverImage: data.url }));
        showToast('Cover image uploaded successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to upload cover image', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error uploading cover image', 'error');
    } finally {
      setIsUploadingBlogCover(false);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim()) {
      showToast('Article title is required', 'error');
      return;
    }
    if (blogForm.excerpt.trim().length < 50 || blogForm.excerpt.trim().length > 160) {
      showToast('Write an English meta description between 50 and 160 characters.', 'error');
      return;
    }
    if (!blogForm.content.trim()) {
      showToast('Article content is required', 'error');
      return;
    }
    if (/[\u1200-\u137F]/.test([blogForm.title, blogForm.excerpt, blogForm.content, blogForm.category, blogForm.tags].join(' '))) {
      showToast('Public blog content must be written in English.', 'error');
      return;
    }

    setIsSavingBlog(true);
    try {
      const payload = {
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim(),
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content,
        category: blogForm.category,
        tags: blogForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        coverImage: blogForm.coverImage,
        status: blogForm.status,
      };

      const endpoint = editingBlogPost ? `/api/admin/blog/${editingBlogPost.id}` : '/api/admin/blog';
      const method = editingBlogPost ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Article saved successfully!', 'success');
        setIsBlogModalOpen(false);
        fetchBlogPosts();
      } else {
        showToast(data.error || 'Failed to save article', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving article', 'error');
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    setActionLoadingId(`del-blog-${id}`);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Article deleted successfully', 'info');
        setDeleteBlogConfirmId(null);
        fetchBlogPosts();
      } else {
        showToast(data.error || 'Failed to delete article', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting article', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Payment Methods Handlers
  const handleOpenAddMethod = () => {
    setMethodForm({
      name: '',
      amharicName: '',
      account: '',
      holder: '',
      badge: 'Active',
      color: '#0062FF',
      instruction: '',
      isActive: true,
      order: paymentMethods.length + 1,
    });
    setMethodModalOpen(true);
  };

  const handleOpenEditMethod = (m: PaymentMethodItem) => {
    setMethodForm({
      id: m.id,
      name: m.name,
      amharicName: m.amharicName || m.name,
      account: m.account,
      holder: m.holder,
      badge: m.badge || 'Active',
      color: m.color || '#0062FF',
      instruction: m.instruction || '',
      isActive: m.isActive,
      order: m.order || 0,
    });
    setMethodModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name.trim() || !methodForm.account.trim() || !methodForm.holder.trim()) {
      showToast('Name, account number, and holder name are required.', 'error');
      return;
    }
    setIsSavingMethod(true);
    try {
      const isEdit = Boolean(methodForm.id);
      const url = isEdit ? `/api/admin/payment-methods/${methodForm.id}` : '/api/admin/payment-methods';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          isEdit ? 'Payment method updated successfully!' : 'New payment method added successfully!',
          'success'
        );
        setMethodModalOpen(false);
        fetchPaymentMethods();
      } else {
        showToast(data.error || 'Failed to save payment method', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving payment method', 'error');
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleToggleMethodActive = async (m: PaymentMethodItem) => {
    try {
      const res = await fetch(`/api/admin/payment-methods/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Payment method ${!m.isActive ? 'activated' : 'deactivated'}`, 'success');
        fetchPaymentMethods();
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const handleDeleteMethod = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Payment method deleted successfully', 'success');
        setDeleteConfirmMethod(null);
        fetchPaymentMethods();
      } else {
        showToast(data.error || 'Failed to delete payment method', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting payment method', 'error');
    }
  };

  // Copy transaction reference helper
  const copyTransactionRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    showToast(`Copied ref: ${ref}`, 'info');
    setTimeout(() => setCopiedRef(null), 2500);
  };

  // Approve Payment Top-up
  const handleApprovePayment = async (paymentId: number) => {
    setActionLoadingId(`pay-${paymentId}`);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Payment approved! User credited with minutes.', 'success');
        if (inspectorPayment?.id === paymentId) {
          setInspectorPayment(null);
        }
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to approve payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error approving payment', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Batch Approve All Pending Payments
  const handleBatchApprovePendingPayments = async () => {
    const pendingList = payments.filter((p) => p.status === 'pending');
    if (pendingList.length === 0) {
      showToast('No pending payments to approve', 'info');
      return;
    }
    if (!confirm(`Are you sure you want to approve all ${pendingList.length} pending payments?`)) {
      return;
    }
    setActionLoadingId('batch-payments');
    try {
      for (const p of pendingList) {
        await fetch(`/api/admin/payments/${p.id}/approve`, { method: 'POST' });
      }
      showToast(`Batch verified! All ${pendingList.length} payments approved and credited.`, 'success');
      loadDashboardData();
    } catch (err: any) {
      showToast('Error during batch approval', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Item Confirmation
  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return;
    const { type, id } = rejectModalTarget;
    setActionLoadingId(`${type}-${id}`);

    try {
      const endpoint =
        type === 'payment'
          ? `/api/admin/payments/${id}/reject`
          : `/api/admin/videos/${id}/reject`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() || 'Details could not be verified' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Item rejected successfully.', 'info');
        setRejectModalTarget(null);
        setRejectionReason('');
        if (inspectorPayment?.id === id) setInspectorPayment(null);
        if (previewVideo?.id === id) setPreviewVideo(null);
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to reject item', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing rejection', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Approve Video Project
  const handleApproveVideo = async (videoId: number) => {
    setActionLoadingId(`vid-${videoId}`);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Video approved!', 'success');
        if (previewVideo?.id === videoId) {
          setPreviewVideo((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
        }
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to approve video', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error approving video', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Video
  const handleDeleteVideo = async (videoId: number) => {
    setActionLoadingId(`vid-del-${videoId}`);
    try {
      const res = await fetch(`/api/admin/videos?id=${videoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Video project deleted from system', 'success');
        setDeleteConfirmVideo(null);
        if (previewVideo?.id === videoId) setPreviewVideo(null);
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to delete video', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting video', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Adjust User Credits
  const handleSaveUserCredits = async () => {
    if (!creditModalUser) return;
    setActionLoadingId(`user-${creditModalUser.id}`);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: creditModalUser.id,
          minutesDelta: Number(minutesDelta),
          creditsDelta: Number(creditsDelta),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Updated balance for ${creditModalUser.name}!`, 'success');
        setCreditModalUser(null);
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to update user balance', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating user credits', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle User Role (Admin / User)
  const handleToggleUserRole = async (userId: number) => {
    setActionLoadingId(`user-role-${userId}`);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, toggleRole: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('User role updated successfully', 'success');
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to toggle role', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error toggling user role', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: number) => {
    setActionLoadingId(`user-del-${userId}`);
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('User account successfully removed', 'success');
        setDeleteConfirmUser(null);
        loadDashboardData();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting user', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      showToast('No payment records to export', 'info');
      return;
    }

    const headers = ['ID', 'User Name', 'Email', 'Plan', 'Amount (ETB)', 'Transaction Ref', 'Status', 'Date'];
    const rows = payments.map((p) => [
      p.id,
      `"${p.userName || 'Unknown'}"`,
      `"${p.userEmail || ''}"`,
      p.planName,
      p.amountEtb,
      `"${p.transactionRef}"`,
      p.status,
      `"${new Date(p.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bgern_payments_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial CSV report exported successfully!', 'success');
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.transactionRef?.toLowerCase().includes(q) ||
        p.userEmail?.toLowerCase().includes(q) ||
        p.userName?.toLowerCase().includes(q) ||
        p.planName?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [payments, paymentStatusFilter, searchQuery]);

  // Filtered Videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesStatus = videoStatusFilter === 'all' || v.status === videoStatusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        v.title?.toLowerCase().includes(q) ||
        v.userEmail?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [videos, videoStatusFilter, searchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Format Ethiopian Currency
  const formatEtb = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // -------------------------------------------------------------
  // VIEW: HIGH-SECURITY ADMIN GATE (When Not Authenticated)
  // -------------------------------------------------------------
  if (isAdminAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-200">
        {/* Ambient Security Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0062FF]/10 dark:bg-[#0062FF]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#A6056F]/10 dark:bg-[#A6056F]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          <div className="rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 p-8 shadow-2xl backdrop-blur-2xl space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#0062FF]/10 dark:bg-[#0062FF]/20 border border-[#0062FF]/30 text-[#0062FF] dark:text-[#60a5fa] flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8 text-[#A6056F] dark:text-[#ECCC6E]" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#0062FF]/10 border border-[#0062FF]/25 text-[#0062FF] dark:text-[#60a5fa]">
                <span>ENCRYPTED PORTAL</span>
                <span>•</span>
                <span>ADMIN CONSOLE</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#632450] dark:text-[#ECCC6E]">
                Bgern (ብገርን) Admin Gate
              </h1>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-geez">
                ለስርዓት አስተዳዳሪዎች የተጠበቀ መግቢያ:: እባክዎ የአድሚን ማረጋገጫ ቁልፍ ያስገቡ::
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Success Message */}
            {authSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccessMessage}</span>
              </div>
            )}

            {/* VIEW 1: PASSWORD SIGN IN */}
            {adminGateView === 'login' && (
              <div className="space-y-4">
                <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#632450] dark:text-neutral-300">
                        Admin password for thebigel16@gmail.com
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError('');
                          setAuthSuccessMessage('');
                          setAdminGateView('reset-request');
                        }}
                        className="text-[11px] font-semibold text-[#0062FF] dark:text-[#60a5fa] hover:underline cursor-pointer"
                      >
                        Forgot / Set Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <KeyRound className="w-4 h-4 text-[#0062FF]" />
                      </div>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        placeholder="•••••"
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 focus:border-[#0062FF] focus:ring-2 focus:ring-[#0062FF]/20 text-neutral-900 dark:text-white text-xs font-mono placeholder:text-neutral-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-extrabold text-xs shadow-lg shadow-[#0062FF]/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAuth ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Authenticating Admin...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authenticate & Access Console</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* VIEW 2: REQUEST PASSWORD RESET / SETUP EMAIL */}
            {adminGateView === 'reset-request' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0062FF]/5 dark:bg-[#0062FF]/10 border border-[#0062FF]/20 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                    📩 Send a one-time verification code
                  </p>
                  A 6-digit code will be sent to the authorized administrator email. It expires after 10 minutes and can only be used once.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-extrabold text-xs shadow-lg shadow-[#0062FF]/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Code to Admin Email</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthSuccessMessage('');
                      setAdminGateView('reset-confirm');
                    }}
                    className="text-[#0062FF] dark:text-[#60a5fa] hover:underline cursor-pointer"
                  >
                    I already have a code →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthSuccessMessage('');
                      setAdminGateView('login');
                    }}
                    className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: VERIFY CODE & SET NEW PASSWORD */}
            {adminGateView === 'reset-confirm' && (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#632450] dark:text-neutral-300 mb-1.5">
                    6-Digit Email Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the code from your email"
                    value={resetTokenOrCode}
                    onChange={(e) => setResetTokenOrCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 focus:border-[#0062FF] focus:ring-2 focus:ring-[#0062FF]/20 text-neutral-900 dark:text-white text-xs font-mono placeholder:text-neutral-500 transition-all outline-none tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#632450] dark:text-neutral-300 mb-1.5">
                    New Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="At least 12 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={12}
                      className="w-full px-4 pr-10 py-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 focus:border-[#0062FF] focus:ring-2 focus:ring-[#0062FF]/20 text-neutral-900 dark:text-white text-xs font-mono placeholder:text-neutral-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#632450] dark:text-neutral-300 mb-1.5">
                    Confirm New Admin Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full px-4 py-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/25 dark:border-[#256E96]/40 focus:border-[#0062FF] focus:ring-2 focus:ring-[#0062FF]/20 text-neutral-900 dark:text-white text-xs font-mono placeholder:text-neutral-500 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-extrabold text-xs shadow-lg shadow-[#0062FF]/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password & Logging In...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Set New Password</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthSuccessMessage('');
                      setAdminGateView('login');
                    }}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2 border-t border-[#256E96]/15 dark:border-white/10">
              <Link
                href="/studio"
                className="text-xs text-[#256E96] dark:text-neutral-400 hover:text-[#0062FF] dark:hover:text-[#ECCC6E] transition-colors inline-flex items-center gap-1 font-semibold"
              >
                <span>← Return to Creator Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F3F5F6] dark:bg-[#0B0F17] text-neutral-900 dark:text-[#F3F5F6] font-sans selection:bg-[#0062FF] selection:text-white transition-colors duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-emerald-900/10'
                : toastMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 shadow-rose-900/10'
                : 'bg-white dark:bg-[#131924] border-[#256E96]/30 text-[#0062FF] dark:text-[#ECCC6E] shadow-xl'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-[#0062FF] dark:text-[#ECCC6E] shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#F3F5F6]/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl border-b border-[#256E96]/20 dark:border-[#256E96]/30 px-4 sm:px-8 py-3.5 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Bgern Logo"
                width={36}
                height={36}
                fetchPriority="high"
                decoding="async"
                className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-[#131924] border border-[#256E96]/30 p-0.5 shadow-md shadow-[#0062FF]/10 group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base text-[#632450] dark:text-white tracking-wide">
                    Bgern <span className="text-[#A6056F] font-geez font-normal">(ብገርን)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0062FF]/10 border border-[#0062FF]/25 text-[#0062FF] uppercase tracking-wider">
                    Admin Command
                  </span>
                </div>
                <span className="text-[10px] text-[#256E96] font-medium">Security & Operations Control</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live DB Connected</span>
            </div>
          </div>

          {/* Quick Search, Theme Toggle & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search ref, user, video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-[#0062FF] focus:ring-1 focus:ring-[#0062FF] outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Notification Bell */}
            <NotificationBell currentUser={currentUser} isAdminPanel={true} />

            {/* Refresh Button */}
            <button
              onClick={loadDashboardData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-white dark:bg-[#131924] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[#256E96]/20 dark:border-[#256E96]/35 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0062FF]' : ''}`} />
            </button>

            <button
              onClick={handleConnectSupportBot}
              disabled={isConnectingSupportBot}
              title="Connect the Bgern Support Telegram bot"
              className="px-3 py-2 rounded-xl bg-[#229ED9] hover:bg-[#168ac1] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isConnectingSupportBot ? 'Connecting…' : 'Connect Support Bot'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-white dark:bg-[#131924] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[#256E96]/20 dark:border-[#256E96]/35 transition-all cursor-pointer shadow-2xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#ECCC6E]" /> : <Moon className="w-4 h-4 text-[#0062FF]" />}
            </button>

            <Link
              href="/studio"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#131924] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#0062FF] dark:text-[#ECCC6E] text-xs font-bold border border-[#256E96]/20 dark:border-[#256E96]/35 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <span>Creator Studio</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Change Admin Password Button */}
            <button
              onClick={() => {
                setChangePasswordError('');
                setChangeCurrentPassword('');
                setChangeNewPassword('');
                setChangeConfirmPassword('');
                setIsChangePasswordModalOpen(true);
              }}
              title="Change Admin Password"
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#131924] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-[#256E96]/20 dark:border-[#256E96]/35 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#0062FF]" />
              <span className="hidden md:inline">Change Password</span>
            </button>

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#256E96]/20 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-[#0062FF]/15 border border-[#0062FF]/30 text-[#0062FF] flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#632450] dark:text-white truncate max-w-[120px]">
                  {currentUser?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-[#A6056F] dark:text-[#ECCC6E] font-mono font-bold">SUPER ADMIN</span>
              </div>
            </div>

            {/* Admin Logout Button */}
            <button
              onClick={handleAdminLogout}
              title="Sign Out of Admin Console"
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Critical Action Alert Banner (If pending items exist) */}
        {stats && stats.totalPendings > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0062FF]/10 via-[#A6056F]/10 to-transparent border border-[#0062FF]/30 dark:border-[#0062FF]/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0062FF]/20 border border-[#0062FF]/30 text-[#0062FF] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#632450] dark:text-[#ECCC6E] flex items-center gap-2 flex-wrap">
                  <span>Pending Action Queue:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#0062FF] text-white">
                    {stats.pendingPaymentsCount} Payment Top-Up Receipts
                  </span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-geez mt-0.5">
                  ተጠቃሚዎች ያስገቧቸውን የባንክ ደረሰኞች ፈትሸው ሂሳባቸውን ያዘምኑ።
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {stats.pendingPaymentsCount > 0 && (
                <button
                  onClick={handleBatchApprovePendingPayments}
                  disabled={actionLoadingId === 'batch-payments'}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Approve all currently pending receipts"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Batch Approve All ({stats.pendingPaymentsCount})</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('payments');
                  setPaymentStatusFilter('pending');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] hover:from-[#0052d9] hover:to-[#8d045e] text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              >
                <span>Inspect Receipts</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1. KEY PERFORMANCE INDICATORS (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Revenue / Balance Collected */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/50 transition-all shadow-sm space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0062FF]/10 rounded-full blur-2xl group-hover:bg-[#0062FF]/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[#632450] dark:text-neutral-300">
                Total Revenue Collected
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#0062FF]/10 text-[#0062FF] dark:text-[#60a5fa] flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#632450] dark:text-[#ECCC6E] tracking-tight">
                {stats ? formatEtb(stats.totalBalanceEtb) : 'ETB 0.00'}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[#256E96] dark:text-neutral-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Telebirr & CBE</span>
                <span>•</span>
                <span>{stats ? formatEtb(stats.pendingAmountEtb) : '0'} pending queue</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Total Requests */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/50 transition-all shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[#632450] dark:text-neutral-300">
                Payment Transactions
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#256E96]/10 text-[#256E96] dark:text-teal-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#632450] dark:text-white tracking-tight">
                {payments.length}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="text-[#0062FF] font-bold">{payments.length} Top-Up Requests</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats?.approvedPaymentsCount || 0} Confirmed</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Total Pending Verification */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#131924] border border-[#0062FF]/30 dark:border-[#0062FF]/40 hover:border-[#0062FF] transition-all shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0062FF] dark:text-[#60a5fa]">
                Total In Queue
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center">
                <Clock className="w-4 h-4 animate-spin" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#0062FF] dark:text-[#ECCC6E] tracking-tight">
                {stats ? stats.totalPendings : 0}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="px-1.5 py-0.5 rounded bg-[#0062FF]/10 text-[#0062FF] dark:text-[#60a5fa] font-bold">
                  {stats ? stats.pendingPaymentsCount : 0} deposits to confirm
                </span>
              </div>
            </div>
          </div>

          {/* KPI 4: Active Creators & Circulation */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 hover:border-[#0062FF]/50 transition-all shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[#632450] dark:text-neutral-300">
                Registered Creators
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#A6056F]/10 text-[#A6056F] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#632450] dark:text-white tracking-tight">
                {stats ? stats.totalUsers : users.length}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats?.totalMinutesCirculating || 0} mins</span>
                <span>•</span>
                <span>{(stats?.totalCreditsCirculating || 0).toLocaleString()} credits in active balance</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. TABBED MANAGEMENT CONSOLE */}
        <div className="rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35 shadow-xl overflow-hidden transition-colors">
          {/* Tab Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#256E96]/15 dark:border-white/10 bg-[#F3F5F6]/50 dark:bg-[#0B0F17]/50">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab 1: Payments & Receipts */}
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white shadow-md shadow-[#0062FF]/20'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[#256E96]/20 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Requests (የክፍያ ጥያቄዎች)</span>
                {stats && stats.pendingPaymentsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'payments' ? 'bg-white text-[#0062FF]' : 'bg-[#0062FF] text-white animate-pulse'
                  }`}>
                    {stats.pendingPaymentsCount}
                  </span>
                )}
              </button>

              {/* Tab: Analytics / Export */}
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white shadow-md shadow-[#0062FF]/20'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[#256E96]/20 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Financials & Audit</span>
              </button>

              {/* Tab 5: Payment Methods */}
              <button
                type="button"
                onClick={() => setActiveTab('payment-methods')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'payment-methods'
                    ? 'bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white shadow-md shadow-[#0062FF]/20'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[#256E96]/20 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Payment Accounts (የክፍያ ዘዴዎች)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'payment-methods' ? 'bg-white text-[#0062FF]' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {paymentMethods.length}
                </span>
              </button>

              {/* Tab 6: Blog & Content CMS */}
              <button
                type="button"
                onClick={() => setActiveTab('blog')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'blog'
                    ? 'bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white shadow-md shadow-[#0062FF]/20'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-[#256E96]/20 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Blog & Articles</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'blog' ? 'bg-white text-[#0062FF]' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {blogPosts.length}
                </span>
              </button>
            </div>

            {/* Export CSV CTA */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white text-xs font-bold border border-[#256E96]/20 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV (ዳታ አውርድ)</span>
            </button>
          </div>

          {/* TAB 1 CONTENT: PAYMENT TOP-UPS & RECEIPT INSPECTOR */}
          {activeTab === 'payments' && (
            <div className="p-5 space-y-4">
              {/* Sub-Filters: All, Pending, Approved, Rejected */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-[#F3F5F6] dark:bg-[#0B0F17] p-1 rounded-xl border border-[#256E96]/20">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setPaymentStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        paymentStatusFilter === filter
                          ? 'bg-[#0062FF] text-white shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {filter === 'pending'
                        ? `Pending (${payments.filter((p) => p.status === 'pending').length})`
                        : filter}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Showing <span className="text-[#632450] dark:text-white font-bold">{filteredPayments.length}</span> top-up requests
                </div>
              </div>

              {/* Payments Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#256E96]/20 bg-white dark:bg-[#0B0F17]/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#256E96]/20 bg-[#F3F5F6] dark:bg-[#131924] text-[#256E96] dark:text-neutral-300 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Creator / Account</th>
                      <th className="py-3.5 px-4">Plan & Package</th>
                      <th className="py-3.5 px-4">Amount (ETB)</th>
                      <th className="py-3.5 px-4">Transaction Ref</th>
                      <th className="py-3.5 px-4">Deposit Slip</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#256E96]/15 dark:divide-white/5">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-neutral-500 text-xs">
                          No payment requests found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-[#0062FF]/5 dark:hover:bg-white/5 transition-colors group"
                        >
                          {/* User Column */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#0062FF]/15 text-[#0062FF] flex items-center justify-center font-bold text-xs">
                                {payment.userName?.[0] || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-neutral-900 dark:text-white block">
                                  {payment.userName || 'Creator'}
                                </span>
                                <span className="text-[10px] text-[#256E96] dark:text-neutral-400 font-mono">
                                  {payment.userEmail || `User #${payment.userId}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Plan Column */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-[#632450] dark:text-[#ECCC6E] text-xs">
                                {payment.planName}
                              </span>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                +{payment.minutesCredited}m ({payment.creditsCredited.toLocaleString()} cr)
                              </div>
                            </div>
                          </td>

                          {/* Amount Column */}
                          <td className="py-3.5 px-4 font-mono font-black text-neutral-900 dark:text-white text-xs">
                            {formatEtb(payment.amountEtb)}
                          </td>

                          {/* Transaction Ref Column */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                                {payment.transactionRef}
                              </span>
                              <button
                                onClick={() => copyTransactionRef(payment.transactionRef)}
                                title="Copy Reference Code"
                                className="p-1 rounded-md text-neutral-400 hover:text-[#0062FF] transition-colors cursor-pointer"
                              >
                                {copiedRef === payment.transactionRef ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Screenshot Column */}
                          <td className="py-3.5 px-4">
                            {payment.screenshotPath ? (
                              <button
                                onClick={() => {
                                  setInspectorPayment(payment);
                                  setZoomLevel(1);
                                  setRotation(0);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0062FF]/10 hover:bg-[#0062FF]/20 border border-[#0062FF]/30 text-[#0062FF] text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect Slip</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-neutral-400 italic">No image</span>
                            )}
                          </td>

                          {/* Status Column */}
                          <td className="py-3.5 px-4">
                            {payment.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> APPROVED
                              </span>
                            ) : payment.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300">
                                <XCircle className="w-3 h-3" /> REJECTED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300">
                                <Clock className="w-3 h-3 animate-spin" /> PENDING
                              </span>
                            )}
                          </td>

                          {/* Action Column */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {payment.status !== 'approved' && (
                                <button
                                  onClick={() => handleApprovePayment(payment.id)}
                                  disabled={actionLoadingId === `pay-${payment.id}`}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                  title="Approve and credit balance"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {payment.status !== 'rejected' && (
                                <button
                                  onClick={() =>
                                    setRejectModalTarget({
                                      type: 'payment',
                                      id: payment.id,
                                      title: `Payment #${payment.id} (${payment.transactionRef})`,
                                    })
                                  }
                                  disabled={actionLoadingId === `pay-${payment.id}`}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="Reject with note"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: FINANCIAL ANALYTICS & AUDIT */}
          {activeTab === 'analytics' && (
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method 1: Telebirr */}
                <div className="p-5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                    <span>Telebirr Settlements</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      TELEBIRR
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#632450] dark:text-[#ECCC6E] font-mono">
                    {formatEtb(stats?.revenueBreakdown.telebirr || 0)}
                  </div>
                  <span className="text-[11px] text-[#256E96] dark:text-neutral-400 block font-geez">
                    የቴሌብር ፈጣን የሞባይል ክፍያዎች
                  </span>
                </div>

                {/* Method 2: CBE Birr */}
                <div className="p-5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                    <span>Commercial Bank of Ethiopia (CBE)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      CBE BIRR
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#632450] dark:text-[#ECCC6E] font-mono">
                    {formatEtb(stats?.revenueBreakdown.cbeBirr || 0)}
                  </div>
                  <span className="text-[11px] text-[#256E96] dark:text-neutral-400 block font-geez">
                    የኢትዮጵያ ንግድ ባንክ እና ሲቢኢ ብር
                  </span>
                </div>

                {/* Method 3: Pending in Queue */}
                <div className="p-5 rounded-2xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
                    <span>Pending in Verification Queue</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0062FF]/20 text-[#0062FF]">
                      PENDING
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#0062FF] font-mono">
                    {formatEtb(stats?.pendingAmountEtb || 0)}
                  </div>
                  <span className="text-[11px] text-[#256E96] dark:text-neutral-400 block font-geez">
                    ደረሰኝ ከተረጋገጠ በኋላ ወደ ሂሳብ የሚጨመር
                  </span>
                </div>
              </div>

              {/* Action: Export CSV */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#632450] to-[#0062FF] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#ECCC6E]" />
                    <span>Download Full Accounting CSV</span>
                  </h4>
                  <p className="text-xs text-neutral-200">
                    Export all user deposits, approved packages, and transaction reference numbers for tax and ledger bookkeeping.
                  </p>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-5 py-3 rounded-xl bg-[#ECCC6E] hover:bg-[#ffe38a] text-[#632450] font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
                >
                  Download Report (.CSV)
                </button>
              </div>
            </div>
          )}

          {/* TAB 5 CONTENT: PAYMENT ACCOUNTS CONFIGURATION */}
          {activeTab === 'payment-methods' && (
            <div className="p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#632450] dark:text-white">
                    Ethiopian Bank & Mobile Wallet Accounts
                  </h3>
                  <p className="text-xs text-[#256E96] dark:text-neutral-400 font-geez">
                    ለተጠቃሚዎች የሚታዩ የክፍያ አማራጮችን ያዘጋጁ (ቴሌብር፣ ንግድ ባንክ፣ አቢሲኒያ ወዘተ)
                  </p>
                </div>

                <button
                  onClick={handleOpenAddMethod}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Payment Account</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((m) => (
                  <div
                    key={m.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      m.isActive
                        ? 'bg-white dark:bg-[#0B0F17] border-[#256E96]/30 shadow-xs'
                        : 'bg-neutral-50 dark:bg-white/5 border-dashed border-neutral-300 dark:border-white/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#632450] dark:text-white">
                            {m.name}
                          </span>
                          {m.amharicName && (
                            <span className="text-xs text-[#256E96] font-geez">
                              ({m.amharicName})
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0062FF]/10 text-[#0062FF]">
                            {m.badge || 'Active'}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400">Account:</span>
                            <span className="font-mono font-black text-neutral-900 dark:text-white">{m.account}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400">Holder:</span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">{m.holder}</span>
                          </div>
                          {m.instruction && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic mt-1 font-geez">
                              {m.instruction}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggleMethodActive(m)}
                          title={m.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                            m.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-600'
                              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 text-neutral-400'
                          }`}
                        >
                          {m.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditMethod(m)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-600 dark:text-neutral-300 hover:text-[#0062FF] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmMethod(m)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {paymentMethods.length === 0 && (
                <div className="text-center py-12 border border-dashed border-[#256E96]/30 rounded-2xl p-6">
                  <Landmark className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-[#632450] dark:text-white">No payment methods configured</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-geez">
                    የክፍያ መቀበያ አካውንት ለማከል ከላይ ያለውን "+ Add Payment Account" ይጫኑ።
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6 CONTENT: BLOG & ARTICLE CMS */}
          {activeTab === 'blog' && (
            <div className="p-5 space-y-6">
              {/* Blog Top Action & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#F3F5F6] dark:bg-[#0B0F17] p-4 rounded-2xl border border-[#256E96]/15">
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  {/* Search */}
                  <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search articles, tags, titles..."
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchBlogPosts()}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#131924] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={blogCategoryFilter}
                    onChange={(e) => {
                      setBlogCategoryFilter(e.target.value);
                      setTimeout(fetchBlogPosts, 10);
                    }}
                    className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#131924] border border-[#256E96]/20 text-neutral-700 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Tips & Tricks">Tips & Tricks</option>
                    <option value="Amharic AI">Amharic AI</option>
                    <option value="Video Tutorials">Video Tutorials</option>
                    <option value="Product Updates">Product Updates</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={blogStatusFilter}
                    onChange={(e) => {
                      setBlogStatusFilter(e.target.value);
                      setTimeout(fetchBlogPosts, 10);
                    }}
                    className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#131924] border border-[#256E96]/20 text-neutral-700 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/blog"
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#131924] border border-[#256E96]/20 hover:border-[#0062FF]/40 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Globe className="w-4 h-4 text-[#0062FF]" />
                    <span>View Public Blog</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </Link>

                  <button
                    onClick={handleOpenCreateBlog}
                    className="px-4 py-2 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#0062FF]/20 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ New Article</span>
                  </button>
                </div>
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-[#131924] border border-[#256E96]/20 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#0062FF]/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cover Thumbnail: 16:9 YouTube Thumbnail ratio */}
                      <div className="w-full aspect-video bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                        <img
                          src={post.coverImage || '/podcast-preview.jpg'}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              post.status === 'published'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-amber-500 text-white shadow-xs'
                            }`}
                          >
                            {post.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                            {post.category}
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#ECCC6E]" />
                          <span>{post.readTimeMinutes || 3} min read</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-extrabold text-sm text-[#632450] dark:text-[#ECCC6E] line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {post.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 pt-2 border-t border-[#256E96]/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{post.views || 0} views</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          title="View live post"
                          className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditBlog(post)}
                          title="Edit article"
                          className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-700 dark:text-neutral-200 hover:text-[#0062FF] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteBlogConfirmId(post.id)}
                          title="Delete article"
                          className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {blogPosts.length === 0 && (
                <div className="text-center py-16 border border-dashed border-[#256E96]/30 rounded-2xl p-6 bg-white/50 dark:bg-[#131924]/50">
                  <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-60" />
                  <h4 className="text-base font-extrabold text-[#632450] dark:text-white">No Articles Found</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                    Publish tutorials, guides, or announcements by clicking "+ New Article" above.
                  </p>
                  <button
                    onClick={handleOpenCreateBlog}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#0062FF] text-white text-xs font-bold inline-flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Write First Article</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --------------------------------------------------------- */}
      {/* MODAL 6: BLOG POST CMS ARTICLE EDITOR                     */}
      {/* --------------------------------------------------------- */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-[#131924] border border-[#256E96]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#256E96]/15 dark:border-white/10 flex items-center justify-between bg-[#F3F5F6] dark:bg-[#0B0F17]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0062FF]/10 text-[#0062FF] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#632450] dark:text-[#ECCC6E]">
                    {editingBlogPost ? 'Edit Article' : 'Write New Article'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Publish tips, news, and SEO guides directly to the Bgern public blog.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBlogModalOpen(false)}
                className="p-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBlog} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={90}
                  value={blogForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoSlug = title
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setBlogForm({ ...blogForm, title, slug: editingBlogPost ? blogForm.slug : autoSlug });
                  }}
                  placeholder="e.g., A practical guide to clear Amharic captions"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none font-bold"
                />
                <p className="mt-1 text-[10px] text-neutral-500">
                  {blogForm.title.length}/90 characters. Use a clear, specific English title.
                </p>
              </div>

              {/* Slug & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 rounded-l-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-500 text-xs border border-r-0 border-[#256E96]/20 font-mono">
                      /blog/
                    </span>
                    <input
                      type="text"
                      value={blogForm.slug}
                      onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                      placeholder="clear-english-article-slug"
                      className="flex-1 px-3 py-2.5 rounded-r-xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 text-neutral-700 dark:text-neutral-300 focus:outline-none"
                  >
                    <option value="Tips & Tricks">Tips & Tricks</option>
                    <option value="Amharic AI">Amharic AI</option>
                    <option value="Video Tutorials">Video Tutorials</option>
                    <option value="Product Updates">Product Updates</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Meta Description / Article Summary
                </label>
                <textarea
                  rows={2}
                  required
                  minLength={50}
                  maxLength={160}
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Write a clear, accurate summary in English (50–160 characters)."
                  className="w-full px-4 py-2 rounded-xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none leading-relaxed"
                />
                <p className="mt-1 text-[10px] text-neutral-500">
                  {blogForm.excerpt.length}/160 characters. This summary appears on article cards and in search previews.
                </p>
              </div>

              {/* Cover Image & Tags Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cover Image Uploader */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Cover Image
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                      className="text-[10px] text-[#0062FF] hover:underline font-semibold cursor-pointer"
                    >
                      {showCustomUrlInput ? 'Switch to Uploader' : 'Paste Image URL'}
                    </button>
                  </div>

                  {showCustomUrlInput ? (
                    <input
                      type="text"
                      value={blogForm.coverImage}
                      onChange={(e) => setBlogForm({ ...blogForm, coverImage: e.target.value })}
                      placeholder="/podcast-preview.jpg or https://..."
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none"
                    />
                  ) : (
                    <div>
                      {/* Hidden File Input */}
                      <input
                        ref={blogCoverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBlogCoverUpload(file);
                        }}
                        className="hidden"
                      />

                      {/* Dropzone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setCoverDragOver(true);
                        }}
                        onDragLeave={() => setCoverDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setCoverDragOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleBlogCoverUpload(file);
                        }}
                        onClick={() => blogCoverInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                          coverDragOver
                            ? 'border-[#0062FF] bg-[#0062FF]/10'
                            : 'border-[#256E96]/25 dark:border-[#256E96]/35 bg-[#F3F5F6]/70 dark:bg-[#0B0F17]/80 hover:border-[#0062FF]/60 hover:bg-[#0062FF]/5'
                        }`}
                      >
                        {isUploadingBlogCover ? (
                          <div className="py-2 flex flex-col items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#0062FF] border-t-transparent rounded-full animate-spin" />
                            <span className="text-[11px] font-bold text-[#0062FF]">Uploading image...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                            <div className="w-8 h-8 rounded-xl bg-[#0062FF]/10 text-[#0062FF] flex items-center justify-center">
                              <UploadCloud className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              Click or drop cover photo
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              PNG, JPG, WebP up to 12MB (16:9 recommended)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 16:9 Image Preview with replace and remove */}
                  {blogForm.coverImage && (
                    <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden border border-[#256E96]/20 bg-neutral-900 shadow-inner group/img">
                      <img
                        src={blogForm.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => blogCoverInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-white/90 text-neutral-900 text-[11px] font-bold shadow hover:bg-white flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3 h-3 text-[#0062FF]" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlogForm({ ...blogForm, coverImage: '' })}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[11px] font-bold shadow hover:bg-rose-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono pointer-events-none">
                        16:9 Preview
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                    placeholder="TikTok, Captions, Amharic, AI"
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Use a small set of specific English keywords relevant to the article.
                  </p>
                </div>
              </div>

              {/* Content Body with Markdown helpers & Live Preview Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Article Body (Markdown Supported) *
                    </label>
                    {/* Live Word count & Read time */}
                    {(() => {
                      const words = blogForm.content.trim() ? blogForm.content.trim().split(/\s+/).length : 0;
                      const readTime = Math.max(1, Math.ceil(words / 180));
                      return (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                          {words} words • ~{readTime} min read
                        </span>
                      );
                    })()}
                  </div>

                  {/* Write vs Preview Mode Toggle */}
                  <div className="flex items-center p-0.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBlogEditorTab('write')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        blogEditorTab === 'write'
                          ? 'bg-white dark:bg-[#131924] text-[#0062FF] shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogEditorTab('preview')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        blogEditorTab === 'preview'
                          ? 'bg-white dark:bg-[#131924] text-[#0062FF] shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                {blogEditorTab === 'write' ? (
                  <div className="space-y-2">
                    {/* Markdown Formatting Toolbar */}
                    <div className="flex items-center gap-1 flex-wrap p-1.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/15 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + '\n\n## Subheading\n' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                        title="Heading 2"
                      >
                        + H2
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + '\n\n### Subheading\n' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                        title="Heading 3"
                      >
                        + H3
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + ' **Bold text** ' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                        title="Bold Text"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + ' *Italic text* ' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 italic font-serif border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                        title="Italic Text"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + '\n- Bullet item\n' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 cursor-pointer"
                        title="Bullet List"
                      >
                        <span>• List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + '\n1. First step\n2. Second step\n' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 cursor-pointer"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3 h-3" />
                        <span>1. List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + '\n> Important quote or callout\n' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 cursor-pointer"
                        title="Blockquote"
                      >
                        <Quote className="w-3 h-3" />
                        <span>Quote</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + '\n```\n// Code or script snippet\n```\n' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 cursor-pointer"
                        title="Code block"
                      >
                        <Code className="w-3 h-3" />
                        <span>Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, content: blogForm.content + ' [Link title](https://bgern.com) ' })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 cursor-pointer"
                        title="Hyperlink"
                      >
                        <span>[Link]</span>
                      </button>
                    </div>

                    <textarea
                      required
                      rows={10}
                      value={blogForm.content}
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      placeholder="Write the article in English. Use Markdown headings (## Section, ### Subsection), short paragraphs, lists, and links. Lead with the reader's problem and finish with practical next steps."
                      className="w-full px-4 py-3 rounded-2xl text-xs bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 focus:border-[#0062FF] focus:outline-none font-mono leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="min-h-[220px] max-h-[360px] overflow-y-auto p-5 rounded-2xl bg-[#F3F5F6]/70 dark:bg-[#0B0F17] border border-[#256E96]/20 shadow-inner">
                    {blogForm.content.trim() ? (
                      <MarkdownRenderer content={blogForm.content} />
                    ) : (
                      <div className="py-12 text-center text-neutral-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-semibold">No content to preview yet</p>
                        <p className="text-[11px] mt-0.5">Switch back to "Write" tab to add text or headings.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-[#256E96]/15">
                <div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                    Publication Status
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {blogForm.status === 'published'
                      ? 'Live on website immediately for all readers'
                      : 'Saved privately as draft (visible only to admin)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBlogForm({ ...blogForm, status: 'draft' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      blogForm.status === 'draft'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlogForm({ ...blogForm, status: 'published' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      blogForm.status === 'published'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#256E96]/15">
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="px-5 py-2.5 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingBlog ? 'Saving Article...' : editingBlogPost ? 'Update Article' : 'Publish Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Blog Confirmation Dialog */}
      {deleteBlogConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131924] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-neutral-900 dark:text-white">Delete Article?</h4>
              <p className="text-xs text-neutral-500">
                This article will be permanently removed from the website. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteBlogConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBlog(deleteBlogConfirmId)}
                disabled={actionLoadingId === `del-blog-${deleteBlogConfirmId}`}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all"
              >
                {actionLoadingId === `del-blog-${deleteBlogConfirmId}` ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 1: BILL RECEIPT LIGHTBOX INSPECTOR                  */}
      {/* --------------------------------------------------------- */}
      {inspectorPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white dark:bg-[#131924] border border-[#256E96]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#256E96]/15 dark:border-white/10 flex items-center justify-between bg-[#F3F5F6] dark:bg-[#0B0F17]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0062FF]/10 text-[#0062FF] flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#632450] dark:text-white flex items-center gap-2">
                    <span>Receipt Slip Inspector</span>
                    <span className="text-[#0062FF] font-mono">#{inspectorPayment.id}</span>
                  </h3>
                  <p className="text-[11px] text-[#256E96] dark:text-neutral-400 font-mono">
                    Creator: {inspectorPayment.userName} ({inspectorPayment.userEmail})
                  </p>
                </div>
              </div>

              {/* Lightbox Controls: Zoom In, Zoom Out, Rotate, Close */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  title="Zoom In"
                  className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  title="Zoom Out"
                  className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90deg"
                  className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-[#256E96]/20 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorPayment(null)}
                  title="Close Modal"
                  className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-[#256E96]/20 hover:bg-rose-500/20 hover:text-rose-400 text-neutral-700 dark:text-neutral-300 transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Two-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto flex-1">
              {/* Left Column: Interactive Receipt Canvas */}
              <div className="md:col-span-7 p-4 sm:p-6 bg-neutral-950 flex items-center justify-center min-h-[260px] md:min-h-[380px] overflow-hidden relative">
                {inspectorPayment.screenshotPath ? (
                  <div
                    className="transition-transform duration-200 origin-center max-w-full"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={inspectorPayment.screenshotPath}
                      alt="Receipt screenshot"
                      className="max-h-[60vh] max-w-full rounded-xl shadow-2xl object-contain border border-white/10"
                    />
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 space-y-2">
                    <Receipt className="w-12 h-12 mx-auto text-neutral-600" />
                    <p className="text-xs">No screenshot image provided with this submission.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Claimed Details & Cross-Check Panel */}
              <div className="md:col-span-5 p-6 bg-white dark:bg-[#131924] border-t md:border-t-0 md:border-l border-[#256E96]/20 dark:border-white/10 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#0062FF] dark:text-[#60a5fa]">
                    Payment Verification Checklist
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Claimed Transaction Ref */}
                    <div className="p-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 space-y-1">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
                        Claimed Transaction Ref
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-neutral-900 dark:text-white text-sm">
                          {inspectorPayment.transactionRef}
                        </span>
                        <button
                          onClick={() => copyTransactionRef(inspectorPayment.transactionRef)}
                          className="text-neutral-400 hover:text-[#0062FF] p-1 transition-colors cursor-pointer"
                          title="Copy reference"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Amount & Plan */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 space-y-1">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-semibold">Amount</span>
                        <span className="font-mono font-black text-[#0062FF] dark:text-[#ECCC6E] text-sm block">
                          {formatEtb(inspectorPayment.amountEtb)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 space-y-1">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-semibold">Plan</span>
                        <span className="font-black text-[#632450] dark:text-white text-sm block">
                          {inspectorPayment.planName}
                        </span>
                      </div>
                    </div>

                    {/* Reward Package */}
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Credits Granted Upon Approval</span>
                      <div className="text-xs font-black">
                        +{inspectorPayment.minutesCredited} Minutes & +{inspectorPayment.creditsCredited.toLocaleString()} Credits
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-4 border-t border-[#256E96]/15 dark:border-white/10 space-y-2">
                  {inspectorPayment.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprovePayment(inspectorPayment.id)}
                        disabled={actionLoadingId === `pay-${inspectorPayment.id}`}
                        className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm & Credit</span>
                      </button>
                      <button
                        onClick={() =>
                          setRejectModalTarget({
                            type: 'payment',
                            id: inspectorPayment.id,
                            title: `Payment #${inspectorPayment.id} (${inspectorPayment.transactionRef})`,
                          })
                        }
                        disabled={actionLoadingId === `pay-${inspectorPayment.id}`}
                        className="py-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Deposit</span>
                      </button>
                    </div>
                  )}

                  {inspectorPayment.status !== 'pending' && (
                    <div className="p-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] text-center text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      This deposit has already been {inspectorPayment.status.toUpperCase()}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 3: REJECTION REASON DIALOG                          */}
      {/* --------------------------------------------------------- */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#131924] border border-[#256E96]/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Reject {rejectModalTarget.type === 'payment' ? 'Payment Slip' : 'Video Project'}</span>
              </h3>
              <button
                onClick={() => setRejectModalTarget(null)}
                className="text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Provide a clear reason for rejecting <span className="font-bold">{rejectModalTarget.title}</span>. This message will be saved and visible to the creator.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid transaction reference number or illegible deposit receipt..."
              className="w-full p-3 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#F3F5F6] dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT PAYMENT METHOD                          */}
      {/* --------------------------------------------------------- */}
      {methodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMethod}
            className="w-full max-w-lg bg-white dark:bg-[#131924] border border-[#256E96]/30 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#632450] dark:text-[#ECCC6E] flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#0062FF]" />
                <span>{methodForm.id ? 'Edit Payment Account' : 'Add New Payment Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setMethodModalOpen(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Bank / Wallet Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telebirr SuperApp"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-bold outline-none focus:border-[#0062FF]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1 font-geez">
                  የባንክ ስም (አማርኛ)
                </label>
                <input
                  type="text"
                  placeholder="ለምሳሌ፡ ቴሌብር"
                  value={methodForm.amharicName}
                  onChange={(e) => setMethodForm({ ...methodForm, amharicName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-geez outline-none focus:border-[#0062FF]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Account Number / Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0911234567 or 100012345678"
                  value={methodForm.account}
                  onChange={(e) => setMethodForm({ ...methodForm, account: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-mono font-bold outline-none focus:border-[#0062FF]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bgern Technologies LLC"
                  value={methodForm.holder}
                  onChange={(e) => setMethodForm({ ...methodForm, holder: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-bold outline-none focus:border-[#0062FF]"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1 font-geez">
                  Deposit Instructions (የአከፋፈል መመሪያ)
                </label>
                <input
                  type="text"
                  placeholder="ለምሳሌ፡ በቴሌብር ይላኩና የደረሰኙን ስክሪንሾት ያስገቡ"
                  value={methodForm.instruction}
                  onChange={(e) => setMethodForm({ ...methodForm, instruction: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-geez outline-none focus:border-[#0062FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMethodModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F3F5F6] dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingMethod}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingMethod ? 'Saving Account...' : 'Save Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 6: DELETE CONFIRMATION DIALOGS                      */}
      {/* --------------------------------------------------------- */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#131924] border border-rose-300 dark:border-rose-900 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm User Deletion</span>
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Are you sure you want to permanently remove creator <span className="font-bold">{deleteConfirmUser.name}</span> ({deleteConfirmUser.email})? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser.id)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmMethod && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#131924] border border-rose-300 dark:border-rose-900 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Payment Account</span>
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Delete payment method <span className="font-bold">{deleteConfirmMethod.name}</span> ({deleteConfirmMethod.account})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmMethod(null)}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMethod(deleteConfirmMethod.id)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 7: CHANGE ADMIN PASSWORD MODAL                      */}
      {/* --------------------------------------------------------- */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131924] border border-[#256E96]/30 dark:border-[#256E96]/50 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#256E96]/15 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0062FF]/10 text-[#0062FF] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#632450] dark:text-[#ECCC6E]">
                    Change Admin Password
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Update security credentials for administrator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changePasswordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{changePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Current Admin Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={changeCurrentPassword}
                  onChange={(e) => setChangeCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-mono text-xs outline-none focus:border-[#0062FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  New Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showChangeNewPassword ? 'text' : 'password'}
                    placeholder="At least 12 characters"
                    value={changeNewPassword}
                    onChange={(e) => setChangeNewPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-mono text-xs outline-none focus:border-[#0062FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangeNewPassword(!showChangeNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showChangeNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm New Admin Password
                </label>
                <input
                  type={showChangeNewPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={changeConfirmPassword}
                  onChange={(e) => setChangeConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5F6] dark:bg-[#0B0F17] border border-[#256E96]/20 font-mono text-xs outline-none focus:border-[#0062FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#256E96]/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3F5F6] dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#A6056F] text-white text-xs font-extrabold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
