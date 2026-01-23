/**
 * Register Page
 * 
 * User registration form with email, password, and name.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('请先同意服务条款和隐私政策');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('密码至少需要8个字符');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ email, password, name: name || undefined });
      
      if (result.success) {
        // Redirect to login with success message
        navigate('/login', { 
          state: { message: '注册成功！请登录。' }
        });
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err) {
      setError('发生意外错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md px-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-foreground mb-8">
          注册 <span className="text-primary">ThingsVis</span>
        </h1>

        {/* Register Form */}
        <div className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                姓名
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="张三"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                密码
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                确认密码
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                我同意{' '}
                <Link to="/terms" className="text-primary hover:underline">服务条款</Link>
                {' '}和{' '}
                <Link to="/privacy" className="text-primary hover:underline">隐私政策</Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  创建中...
                </span>
              ) : (
                '创建账户'
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-muted-foreground text-sm">
            已有账户？{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
