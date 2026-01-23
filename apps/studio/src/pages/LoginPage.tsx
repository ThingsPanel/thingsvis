/**
 * Login Page
 * 
 * User login form with email and password authentication.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect URL from query params or default to home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || '登录失败');
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
          登录到 <span className="text-primary">ThingsVis</span>
        </h1>

        {/* Login Form */}
        <div className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground font-medium">
                  密码
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  忘记密码？
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg"
              />
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
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">或</span>
            </div>
          </div>

          {/* Continue without login */}
          <Link to="/editor">
            <Button
              variant="outline"
              className="w-full h-11 border-border text-foreground hover:bg-accent rounded-lg"
            >
              跳过登录继续使用
            </Button>
          </Link>

          {/* Register link */}
          <p className="text-center text-muted-foreground text-sm">
            还没有账户？{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              立即注册
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-muted-foreground text-xs">
          登录即表示同意我们的{' '}
          <Link to="/terms" className="text-primary hover:underline">服务条款</Link>
          {' '}和{' '}
          <Link to="/privacy" className="text-primary hover:underline">隐私政策</Link>
        </p>
      </div>
    </div>
  );
}
