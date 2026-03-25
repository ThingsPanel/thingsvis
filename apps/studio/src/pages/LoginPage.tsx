/**
 * Login Page
 *
 * Optimized with Split Layout (Figma/Excalidraw style)
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { t } = useTranslation('pages');
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect URL from query params or default to editor
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/editor';

  // Error message mapping
  const getErrorMessage = (error: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid credentials': t('login.errors.invalidCredentials'),
      'Invalid email or password': t('login.errors.invalidEmailOrPassword'),
      'Invalid credentials format': t('login.errors.invalidFormat'),
      'User not found': t('login.errors.userNotFound'),
      'Invalid email': t('login.errors.invalidEmail'),
      'Network error': t('login.errors.networkError'),
      'Failed to fetch': t('login.errors.fetchFailed'),
      'Internal server error': t('login.errors.serverError'),
    };
    return errorMap[error] || `${t('login.errors.defaultError')}: ${error}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(getErrorMessage(result.error || t('login.errors.defaultError')));
      }
    } catch {
      setError(t('login.errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Brand & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center text-primary-foreground p-12">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Floating Elements Animation */}
        <div className="absolute top-20 left-20 opacity-20 animate-pulse">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-20 opacity-20 animate-bounce delay-1000">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-[800] tracking-tight">ThingsVis Studio</h1>
            <p className="text-lg opacity-90 font-medium leading-relaxed">
              {t('login.brandTagline')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative">
        <div className="absolute top-8 left-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted border border-transparent group-hover:border-border transition-all">
              <ArrowLeft size={18} />
            </div>
            <span>{t('login.backToHome')}</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">{t('login.title')}</h2>
            <p className="text-muted-foreground">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs font-bold">
                !
              </span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-muted/30 border-2 border-input focus:border-primary focus:bg-background transition-colors"
                  required
                />
                <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('login.password')}</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border-2 border-input focus:border-primary focus:bg-background transition-colors"
                  placeholder="••••••••"
                  required
                />
                <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('login.submitting')}
                </span>
              ) : (
                t('login.submitButton')
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Link to="/editor" onClick={loginAsGuest}>
              <Button
                variant="outline"
                className="w-full h-11 border-dashed border-border hover:bg-muted/50"
              >
                {t('login.guestMode')}
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm pt-4">
            <span className="text-muted-foreground">{t('login.noAccount')} </span>
            <Link to="/register" className="font-semibold text-primary hover:underline">
              {t('login.register')}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} ThingsVis. All rights reserved.
        </div>
      </div>
    </div>
  );
}
