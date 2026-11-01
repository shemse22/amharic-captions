'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
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
            context: 'signin';
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

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const showError = (message: string) => {
      if (!cancelled) setError(message);
    };

    const initializeGoogleSignIn = (clientId: string) => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts.id) return;

      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: true,
        context: 'signin',
        callback: async (response) => {
          if (!response.credential) {
            showError('Google did not return a sign-in credential. Please try again.');
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

            try { localStorage.setItem('bgern_user', JSON.stringify(data.user)); } catch {}
            window.dispatchEvent(new Event('bgern_auth_change'));
            onLoginSuccess(data.user);
            onClose();
          } catch (loginError) {
            showError(
              loginError instanceof Error
                ? loginError.message
                : 'Google sign-in failed. Please try again.'
            );
          } finally {
            if (!cancelled) setIsLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.min(320, googleButtonRef.current.clientWidth || 320),
      });
      window.google.accounts.id.prompt();
    };

    const loadGoogleIdentity = async () => {
      try {
        const configResponse = await fetch('/api/auth/google', { cache: 'no-store' });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId) {
          throw new Error(config.error || 'Google sign-in is not configured yet.');
        }
        if (cancelled) return;

        if (window.google?.accounts.id) {
          initializeGoogleSignIn(config.clientId);
          return;
        }

        script = document.querySelector<HTMLScriptElement>(
          'script[data-google-identity]'
        );
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.dataset.googleIdentity = 'true';
          document.head.appendChild(script);
        }

        script.addEventListener(
          'load',
          () => initializeGoogleSignIn(config.clientId),
          { once: true }
        );
        script.addEventListener(
          'error',
          () => showError('Could not load Google sign-in. Check your connection and try again.'),
          { once: true }
        );

        if (window.google?.accounts.id) initializeGoogleSignIn(config.clientId);
      } catch (loadError) {
        showError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not start Google sign-in.'
        );
      }
    };

    setError(null);
    setIsLoading(false);
    void loadGoogleIdentity();

    return () => {
      cancelled = true;
      googleButtonRef.current?.replaceChildren();
      if (script) {
        script.removeEventListener('load', () => undefined);
        script.removeEventListener('error', () => undefined);
      }
    };
  }, [isOpen, onClose, onLoginSuccess]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-signin-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#000000]/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="w-full max-w-[480px] my-auto">
        <div className="relative rounded-[28px] border border-[#e0e3e7] bg-white p-7 text-[#1f1f1f] shadow-2xl dark:border-[#383a3d] dark:bg-[#1e1e1e] dark:text-[#e3e3e3] sm:p-10">
          <button
            onClick={onClose}
            aria-label="Close sign in"
            className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-7 flex items-center gap-2.5">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="text-sm font-medium">Sign in with Google</span>
          </div>

          <h1 id="google-signin-title" className="text-3xl font-normal tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[#5f6368] dark:text-[#c4c7c5]">
            We&apos;ll use the Google account already signed in to this browser when available. Otherwise, choose an account to continue.
          </p>

          <div className="mt-8 flex min-h-12 justify-center">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#0b57d0]" />
            ) : (
              <div ref={googleButtonRef} className="min-h-12" />
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-7 text-xs leading-relaxed text-[#5f6368] dark:text-[#c4c7c5]">
            Before using this app, review Bgern&apos;s{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="text-[#0b57d0] hover:underline dark:text-[#a8c7fa]">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" target="_blank" rel="noreferrer" className="text-[#0b57d0] hover:underline dark:text-[#a8c7fa]">
              Terms of Service
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
