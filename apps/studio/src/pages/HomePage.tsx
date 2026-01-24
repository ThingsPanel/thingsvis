/**
 * Home Page
 * 
 * Landing page for ThingsVis.
 * Design Philosophy: Flat, Modern, Bold Typography (Figma/Excalidraw style).
 * No excessive blurs, glows, or floating animations.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  MousePointer2, 
  Box, 
  Move3d,
  Terminal,
  Share2,
  Code2,
  Zap,
  Sparkles,
  Monitor
} from 'lucide-react';

// Flat Logo component
function Logo({ className = "w-8 h-8", color = "#6965db" }: { className?: string, color?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-full h-full"
        style={{ color }}
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    </div>
  );
}

// Minimal Feature Card
function FeatureItem({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900 mb-2">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#6965db] selection:text-white">
      {/* Navbar - Sticky but solid/minimal */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-extrabold tracking-tight">ThingsVis</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {['产品', '企业版', '资源', '价格'].map((label) => (
                <a 
                  key={label} 
                  href="#" 
                  className="text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && <ProjectSwitcher />}
            {!isAuthenticated && (
              <Link to="/login" className="text-[15px] font-medium text-gray-900 hover:opacity-70 transition-opacity">
                登录
              </Link>
            )}
            <Button
              onClick={handleGetStarted}
               className="h-10 px-5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-medium text-[15px] border-none shadow-none transition-colors"
            >
              免费使用
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center mb-16">
            <h1 className="text-6xl md:text-7xl lg:text-[84px] font-[800] tracking-tight leading-[1.05] text-gray-900 mb-8">
              全场景可视化，<br/>
              <span className="text-[#6965db]">由 AI 驱动。</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto mb-10 leading-normal">
             ThingsVis 是新一代的智能可视化构建平台。<br className="hidden md:block"/>
             从工业组态到数据大屏，用自然语言构建无限可能。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
               <Button 
                onClick={handleGetStarted}
                className="h-14 px-8 rounded-xl bg-[#6965db] hover:bg-[#5854c7] text-white text-lg font-semibold shadow-none border-none transition-all hover:-translate-y-0.5"
              >
                免费使用
              </Button>
              <a 
                href="https://github.com/thingsvis/thingsvis" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="h-14 px-8 rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:bg-transparent text-gray-900 text-lg font-semibold transition-colors bg-transparent">
                  <Github className="w-5 h-5 mr-2" />
                  GitHub Repository
                </Button>
              </a>
            </div>
          </div>

          {/* Product Interface Showcase - Flat & Clean */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-0 relative group">
             {/* Decorative Background Shapes (Static, Flat) */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#ffcecb] rounded-full opacity-50 hidden md:block" />
            <div className="absolute top-1/2 -right-8 w-16 h-16 bg-[#d1d0ff] rounded-lg rotate-12 opacity-80 hidden md:block" />
            <div className="absolute -bottom-8 left-1/4 w-0 h-0 border-l-[30px] border-l-transparent border-b-[50px] border-b-[#b8f5d0] border-r-[30px] border-r-transparent hidden md:block" />

            <div className="relative rounded-xl border-[3px] border-gray-900 bg-gray-50 overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_20px_50px_-10px_rgba(0,0,0,0.1)]">
              {/* Browser Chrome */}
              <div className="h-12 bg-white border-b-[3px] border-gray-900 flex items-center px-4 gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-900 bg-white" />
                  <div className="w-3 h-3 rounded-full border-2 border-gray-900 bg-white" />
                  <div className="w-3 h-3 rounded-full border-2 border-gray-900 bg-white" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-6 py-1.5 rounded-md bg-gray-100 border-2 border-gray-200 text-xs font-mono text-gray-500">
                    thingsvis.io/editor/new-project
                  </div>
                </div>
                <div className="w-16" /> {/* Spacer */}
              </div>

               {/* Editor Mockup Content */}
               <div className="aspect-[16/9] bg-[#fdfdfd] relative flex">
                  {/* Left Toolbar */}
                  <div className="w-16 border-r-[3px] border-gray-900 bg-white flex flex-col items-center py-4 gap-6">
                     {[MousePointer2, Box, Move3d, Terminal].map((I, i) => (
                       <div key={i} className={`p-2 rounded-lg ${i === 0 ? 'bg-[#e0e0ff] text-[#6965db]' : 'text-gray-400 hover:text-gray-900'}`}>
                         <I className="w-6 h-6" strokeWidth={2.5} />
                       </div>
                     ))}
                  </div>
                  
                  {/* Center Canvas */}
                  <div className="flex-1 p-8 overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(#e5e7eb 2px, transparent 2px)', backgroundSize: '24px 24px' }}>
                     {/* Widget 1 */}
                     <div className="absolute top-20 left-20 w-64 h-48 bg-white border-[3px] border-gray-900 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="font-bold text-sm">Temperature</div>
                          <div className="w-2 h-2 rounded-full bg-green-500 border border-black" />
                        </div>
                        <div className="flex-1 flex items-end gap-2 px-2 pb-2">
                          {[40, 70, 45, 90, 60].map((h,i) => (
                             <div key={i} className="flex-1 bg-[#6965db]" style={{ height: `${h}%`}} />
                          ))}
                        </div>
                     </div>

                     {/* Widget 2 */}
                      <div className="absolute top-32 right-32 w-48 h-48 bg-[#fff4c5] border-[3px] border-gray-900 rounded-full flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                         <div className="text-center">
                            <div className="text-3xl font-black">ON</div>
                            <div className="text-xs font-bold uppercase mt-1">Status</div>
                         </div>
                      </div>

                      {/* Cursor */}
                       <div className="absolute top-1/2 left-1/2">
                          <MousePointer2 className="w-6 h-6 fill-black text-white" />
                          <div className="ml-4 -mt-1 bg-[#6965db] text-white text-xs px-2 py-0.5 rounded-full font-bold">You</div>
                       </div>
                  </div>

                  {/* Right Panel */}
                  <div className="w-64 border-l-[3px] border-gray-900 bg-white hidden lg:block p-4">
                     <div className="mb-6">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Properties</div>
                        <div className="h-10 border-2 border-gray-200 rounded-md mb-2 bg-gray-50" />
                        <div className="flex gap-2 mb-2">
                          <div className="h-10 w-1/2 border-2 border-gray-200 rounded-md bg-gray-50" />
                          <div className="h-10 w-1/2 border-2 border-gray-200 rounded-md bg-gray-50" />
                        </div>
                     </div>
                     <div className="h-px bg-gray-200 my-4" />
                     <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data Source</div>
                         <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
                           Drop Data Here
                         </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Feature Grid - Clean & Bold */}
        <section className="py-32 px-6 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                 <FeatureItem 
                   icon={Sparkles}
                   title="AI 智能生成"
                   description="不仅是拖拽。描述您的业务场景，AI 将自动生成完整的可视化大屏、绑定数据源并配置交互逻辑。"
                 />
                 <FeatureItem 
                  icon={Monitor}
                  title="工业级大屏"
                  description="专为大屏场景优化。支持任意分辨率适配、多屏拼接。内置大量科技感装饰组件与 3D 场景支持。"
                />
                 <FeatureItem 
                  icon={Code2}
                  title="万物互联"
                  description="深度集成 MQTT、Modbus、HTTP 等工业协议。实时处理海量 IoT 数据，毫秒级响应。"
                />
                 <FeatureItem 
                  icon={Move3d}
                  title="像 Figma 一样设计"
                  description="像素级的设计自由度。提供标尺、辅助线、成组、图层管理等专业设计工具体验。"
                />
                 <FeatureItem 
                  icon={Share2}
                  title="私有化部署"
                  description="支持一键导出源码或 Docker 镜像。完全掌控您的数据与应用，满足企业级安全合规要求。"
                />
                 <FeatureItem 
                  icon={Zap}
                  title="高性能渲染引擎"
                  description="基于 Canvas 与 WebGL 的混合渲染技术，确保在加载十万级图元时依然保持 60FPS 流畅度。"
                />
             </div>
          </div>
        </section>

        {/* Big CTA */}
        <section className="py-32 px-6 bg-[#6965db] text-white">
           <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">
                准备好构建下一代可视化应用了吗？
              </h2>
              <p className="text-xl text-white/80 font-medium mb-12 max-w-2xl mx-auto">
                立即开始体验 AI 驱动的开发效率。无论是复杂的工业组态还是酷炫的数据大屏，ThingsVis 都能轻松胜任。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Button 
                   onClick={handleGetStarted}
                   className="h-14 px-10 bg-white text-[#6965db] hover:bg-gray-100 font-bold text-lg rounded-xl border-none"
                 >
                   立即开始
                 </Button>
              </div>
           </div>
        </section>
      </main>

       {/* Simple Footer */}
       <footer className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
             <Logo className="w-6 h-6 text-gray-900" color="#111" />
             <span className="font-bold text-gray-900">ThingsVis © 2026</span>
           </div>
           
           <div className="flex gap-8 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-gray-900">文档</a>
              <a href="#" className="hover:text-gray-900">GitHub</a>
              <a href="#" className="hover:text-gray-900">Twitter</a>
              <a href="#" className="hover:text-gray-900">Discord</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
