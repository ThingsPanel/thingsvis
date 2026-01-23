/**
 * Home Page
 * 
 * Landing page for ThingsVis - data visualization platform.
 * Inspired by Excalidraw's clean, minimal design.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, Star } from 'lucide-react';

// Logo component
function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} rounded-lg flex items-center justify-center`} style={{ backgroundColor: '#6965db' }}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-5 h-5 text-white"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-semibold text-foreground">ThingsVis</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="https://thingspanel.io" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">ThingsPanel</a>
              <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">文档</Link>
              <Link to="/examples" className="text-muted-foreground hover:text-foreground transition-colors">示例</Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full px-5 border-2"
                  style={{ borderColor: '#6965db', color: '#6965db' }}
                >
                  登录
                </Button>
              </Link>
            )}
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="rounded-full px-5 text-white"
              style={{ backgroundColor: '#6965db' }}
            >
              免费使用
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="relative">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            让数据<span style={{ color: '#6965db' }}>可视化</span>变得简单
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            无需代码，让数据自己讲故事
          </p>
          <p className="text-muted-foreground mb-8">
            开源、免费、可自托管
          </p>

          {/* GitHub Button */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              <Star className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>
        </div>

        {/* Product Screenshot */}
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-card">
            {/* Mock browser header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground">
                  thingsvis.app/editor
                </div>
              </div>
            </div>
            
            {/* Editor Preview */}
            <div className="aspect-[16/10] bg-muted/20 flex">
              {/* Left sidebar mockup */}
              <div className="w-48 border-r border-border/50 p-3 hidden md:block">
                <div className="space-y-2">
                  <div className="h-8 bg-muted/50 rounded" />
                  <div className="h-6 bg-muted/30 rounded w-3/4" />
                  <div className="h-6 bg-muted/30 rounded w-2/3" />
                  <div className="mt-4 h-4 bg-muted/20 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-square bg-muted/40 rounded" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Canvas area */}
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="w-full max-w-md space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30" />
                    <div className="h-24 rounded-lg bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30" />
                  </div>
                  <div className="h-32 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30" />
                </div>
              </div>
              
              {/* Right sidebar mockup */}
              <div className="w-56 border-l border-border/50 p-3 hidden lg:block">
                <div className="space-y-3">
                  <div className="h-6 bg-muted/30 rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-8 bg-muted/40 rounded" />
                    <div className="h-8 bg-muted/40 rounded" />
                    <div className="h-8 bg-muted/40 rounded" />
                  </div>
                  <div className="h-4 bg-muted/20 rounded w-2/3 mt-4" />
                  <div className="h-20 bg-muted/30 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
