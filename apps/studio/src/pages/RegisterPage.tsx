/**
 * Register Page
 * 
 * Optimized with Split Layout (Figma/Excalidraw style)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  // 错误消息映射
  const getErrorMessage = (error: string): string => {
    const errorKeyMap: Record<string, string> = {
      'Invalid credentials': 'register.errors.invalidCredentials',
      'Email already registered': 'register.errors.emailAlreadyRegistered',
      'Email already exists': 'register.errors.emailAlreadyRegistered',
      'Validation failed': 'register.errors.validationFailed',
      'Invalid email': 'register.errors.invalidEmail',
      'Password too short': 'register.errors.passwordTooShort',
      'Network error': 'register.errors.networkError',
      'Failed to fetch': 'register.errors.fetchFailed',
      'Internal server error': 'register.errors.serverError',
    };
    const key = errorKeyMap[error];
    return key ? t(key) : `${t('register.errors.defaultError')}: ${error}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError(t('register.errors.agreeToTerms'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.errors.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('register.errors.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ email, password, name: name || undefined });

      if (result.success) {
        navigate('/login', {
          state: { message: t('register.successMessage') }
        });
      } else {
        setError(getErrorMessage(result.error || t('register.errors.defaultError')));
      }
    } catch (err) {
      setError(t('register.errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Brand & Visuals */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center text-primary-foreground p-12">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern-reg" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern-reg)" />
          </svg>
        </div>

        {/* Decorative Elements - Different from Login for variety */}
        <div className="absolute top-1/4 right-1/4 opacity-20 animate-pulse delay-75">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" /></svg>
        </div>

        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-[800] tracking-tight">{t('register.brandTitle')}</h1>
            <p className="text-lg opacity-90 font-medium leading-relaxed">
              {t('register.brandTagline')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-y-auto">
        <div className="absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
            <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted border border-transparent group-hover:border-border transition-all">
              <ArrowLeft size={18} />
            </div>
            <span>{t('register.backToHome')}</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">{t('register.title')}</h2>
            <p className="text-muted-foreground">{t('register.subtitle')}</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs font-bold">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('register.name')}</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('register.namePlaceholder')}
                  className="pl-10 h-11 bg-muted/30 border-2 border-input focus:border-primary focus:bg-background transition-colors"
                />
                <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('register.email')}</Label>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('register.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border-2 border-input focus:border-primary focus:bg-background transition-colors"
                  placeholder={t('register.passwordPlaceholder')}
                  required
                />
                <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border-2 border-input focus:border-primary focus:bg-background transition-colors"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  required
                />
                <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-2 pt-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 flex-shrink-0"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                {t('register.agreeTerms')}
                <Link to="/terms" className="text-primary hover:underline mx-1">{t('register.termsOfService')}</Link>
                {t('register.and')}
                <Link to="/privacy" className="text-primary hover:underline mx-1">{t('register.privacyPolicy')}</Link>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4" disabled={isLoading}>
              {isLoading ? t('register.submitting') : t('register.submitButton')}
            </Button>
          </form>

          <div className="text-center text-sm pt-4">
            <span className="text-muted-foreground">{t('register.hasAccount')}</span>
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t('register.login')}
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
