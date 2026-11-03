'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  X,
} from 'lucide-react';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  minutes_balance?: number;
  credits?: number;
  total_credits_granted?: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select: boolean;
            context: 'signin' | 'signup';
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: 'outline';
              size: 'large';
              shape: 'pill';
              text: 'continue_with';
              width: number;
            }
          ) => void;
        };
      };
    };
  }
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'signin',
}: AuthModalProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Google Sign-In Initializer
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    const buttonContainer = googleButtonRef.current;

    const initializeGoogleSignIn = (clientId: string) => {
      if (cancelled || !buttonContainer || !window.google?.accounts.id) return;

      buttonContainer.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        context: 'signin',
        callback: async (response) => {
          if (!response.credential) {
            if (!cancelled) setError('Google did not return a sign-in credential. Please try again.');
            return;
          }

          setError(null);
          setIsLoading(true);
          try {
            const result = await fetch('/api/auth/google', {
              method: 'POST',
              credentials: 'same-origin',
              cache: 'no-store',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });
            const data = await result.json();
            if (!result.ok || !data.success) {
              throw new Error(data.error || 'Google sign-in failed. Please try again.');
            }

            try {
              localStorage.setItem('bgern_user', JSON.stringify(data.user));
            } catch {}
            window.dispatchEvent(new Event('bgern_auth_change'));
            onLoginSuccess(data.user);
            onClose();
          } catch (loginError) {
            if (!cancelled) {
              setError(
                loginError instanceof Error
                  ? loginError.message
                  : 'Google sign-in failed. Please try again.'
              );
            }
          } finally {
            if (!cancelled) setIsLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.min(360, buttonContainer.clientWidth || 320),
      });
    };

    const loadGoogleIdentity = async () => {
      try {
        const configResponse = await fetch('/api/auth/google', { cache: 'no-store' });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId) return;
        if (cancelled) return;

        if (window.google?.accounts.id) {
          initializeGoogleSignIn(config.clientId);
          return;
        }

        script = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.dataset.googleIdentity = 'true';
          document.head.appendChild(script);
        }

        script.addEventListener('load', () => initializeGoogleSignIn(config.clientId), { once: true });
        if (window.google?.accounts.id) initializeGoogleSignIn(config.clientId);
      } catch {
        // Soft fail Google initialization if network blocks it
      }
    };

    void loadGoogleIdentity();

    return () => {
      cancelled = true;
      buttonContainer?.replaceChildren();
    };
  }, [isOpen, onClose, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!isValidEmail) {
      setError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter your User Name / Full Name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Registration failed. Please try again.');
        }

        try {
          localStorage.setItem('bgern_user', JSON.stringify(data.user));
        } catch {}
        window.dispatchEvent(new Event('bgern_auth_change'));
        onLoginSuccess(data.user);
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign In mode
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid email or password.');
        }

        try {
          localStorage.setItem('bgern_user', JSON.stringify(data.user));
        } catch {}
        window.dispatchEvent(new Event('bgern_auth_change'));
        onLoginSuccess(data.user);
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="w-full max-w-[460px] my-auto">
        <div className="relative rounded-3xl border border-[#E5E5E5] dark:border-neutral-800 bg-[#FFFFFF] dark:bg-[#131924] p-6 sm:p-8 text-neutral-900 dark:text-neutral-100 shadow-2xl transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:text-[#14213D] dark:hover:text-white hover:bg-[#E5E5E5]/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14213D]/10 text-[#14213D] dark:text-[#FFFFFF] border border-[#14213D]/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FCA311]" />
              <span>Bgern Amharic AI</span>
            </div>
            <h2 id="auth-modal-title" className="text-2xl font-black text-[#14213D] dark:text-white tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-geez">
              {mode === 'signin'
                ? 'የBgern አካውንትዎ ውስጥ ይግቡና ቪዲዮዎችን ያርትዑ'
                : 'ይመዝገቡና የ10 ደቂቃ ነፃ የአማርኛ ንዑስ ርዕስ ያግኙ'}
            </p>
          </div>

          {/* Google Sign-In Container */}
          <div className="space-y-3">
            <div className="flex min-h-11 justify-center items-center">
              <div ref={googleButtonRef} className="min-h-11 w-full flex justify-center" />
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#E5E5E5] dark:border-neutral-800 w-full" />
              <span className="bg-[#FFFFFF] dark:bg-[#131924] px-3 text-[11px] text-neutral-400 font-medium uppercase tracking-wider shrink-0">
                or with email
              </span>
              <div className="border-t border-[#E5E5E5] dark:border-neutral-800 w-full" />
            </div>
          </div>

          {/* Segmented Control / Tabs */}
          <div className="grid grid-cols-2 p-1 mb-5 rounded-xl bg-[#E5E5E5]/60 dark:bg-neutral-800/80 border border-[#E5E5E5] dark:border-neutral-700/50">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#14213D] text-[#FFFFFF] shadow-sm'
                  : 'text-neutral-600 hover:text-[#14213D] dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Sign In (መግቢያ)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#14213D] text-[#FFFFFF] shadow-sm'
                  : 'text-neutral-600 hover:text-[#14213D] dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Sign Up (መመዝገቢያ)
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* User Name (only in signup mode) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>User Name</span>
                  <span className="text-[10px] text-neutral-400 font-geez">የተጠቃሚ ስም</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#14213D]/40 focus:border-[#14213D] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-neutral-400 font-geez">ኢሜይል</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#14213D]/40 focus:border-[#14213D] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-neutral-400 font-geez">የይለፍ ቃል</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#14213D]/40 focus:border-[#14213D] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only in signup mode) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>Confirm Password</span>
                  <span className="text-[10px] text-neutral-400 font-geez">የይለፍ ቃል ያረጋግጡ</span>
                </label>
                <div className="relative">
                  <CheckCircle2
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      confirmPassword && confirmPassword === password
                        ? 'text-[#FCA311]'
                        : 'text-neutral-400'
                    } pointer-events-none`}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl border ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/30'
                        : confirmPassword && confirmPassword === password
                        ? 'border-[#FCA311] focus:border-[#FCA311] focus:ring-[#FCA311]/30'
                        : 'border-[#E5E5E5] dark:border-neutral-700'
                    } bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#14213D]/40 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button (Navy Blue #14213D with text color white #FFFFFF) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#14213D] hover:bg-[#000000] disabled:opacity-60 text-[#FFFFFF] font-black text-xs shadow-md shadow-[#14213D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Please wait...</span>
                  </>
                ) : mode === 'signin' ? (
                  <span>Sign In (ግባ)</span>
                ) : (
                  <span>Create Account & Get 10 Free Mins</span>
                )}
              </button>
            </div>
          </form>

          {/* Switch mode footer */}
          <div className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-[#14213D] dark:text-[#FCA311] hover:underline cursor-pointer"
                >
                  Create Account (ይመዝገቡ)
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-bold text-[#14213D] dark:text-[#FCA311] hover:underline cursor-pointer"
                >
                  Sign In (ይግቡ)
                </button>
              </p>
            )}
          </div>

          {/* Terms notice */}
          <p className="mt-5 text-[11px] leading-relaxed text-center text-neutral-400 dark:text-neutral-500">
            By continuing, you agree to Bgern&apos;s{' '}
            <a href="/terms" target="_blank" rel="noreferrer" className="text-[#14213D] dark:text-[#FCA311] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="text-[#14213D] dark:text-[#FCA311] hover:underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
