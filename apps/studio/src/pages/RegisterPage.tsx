/**
 * Register Page
 * 
 * Optimized with Split Layout (Figma/Excalidraw style)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('请先同意服务条款和隐私政策');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      setError('密码至少需要8个字符');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ email, password, name: name || undefined });
      
      if (result.success) {
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
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Brand & Visuals */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center text-primary-foreground p-12">
         {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern-reg" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern-reg)" />
          </svg>
        </div>

        {/* Decorative Elements - Different from Login for variety */}
        <div className="absolute top-1/4 right-1/4 opacity-20 animate-pulse delay-75">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg>
        </div>

        <div className="relative z-10 max-w-lg text-center space-y-8">
           <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
             </svg>
           </div>
           
           <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">加入 ThingsVis</h1>
            <p className="text-lg opacity-90 font-light leading-relaxed">
              与数万名开发者和设计师一起，<br/>构建未来的数据体验。
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">创建账号</h2>
            <p className="text-muted-foreground">免费开始您的可视化之旅</p>
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
              <Label htmlFor="name">昵称</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="您的称呼"
                  className="pl-10 h-11 bg-muted/30 border-input/60 focus:bg-background transition-colors"
                />
                 <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-muted/30 border-input/60 focus:bg-background transition-colors"
                  required
                />
                <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border-input/60 focus:bg-background transition-colors"
                  placeholder="至少8位字符"
                  required
                />
                 <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border-input/60 focus:bg-background transition-colors"
                  placeholder="再次输入密码"
                  required
                />
                 <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
                 className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                 checked={agreedToTerms}
                 onChange={(e) => setAgreedToTerms(e.target.checked)}
               />
               <label htmlFor="terms" className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                 我已阅读并同意
                 <Link to="/terms" className="text-primary hover:underline mx-1">服务条款</Link>
                 和
                 <Link to="/privacy" className="text-primary hover:underline mx-1">隐私政策</Link>
               </label>
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4" disabled={isLoading}>
              {isLoading ? '注册中...' : '立即注册'}
            </Button>
          </form>

          <div className="text-center text-sm pt-4">
             <span className="text-muted-foreground">已有账号? </span>
             <Link to="/login" className="font-semibold text-primary hover:underline">
               直接登录
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
