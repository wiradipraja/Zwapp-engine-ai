// components/layout/PublicLanding.tsx
// Industrial futuristic landing page shown before login
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchFeaturedOutputs, type SavedOutput } from '../../services/outputSaving';

interface PublicLandingProps {
  onSignIn: () => void;
  onLaunchEngine: () => void;
}

const PublicLanding: React.FC<PublicLandingProps> = ({ onSignIn, onLaunchEngine }) => {
  const { theme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [terminalText, setTerminalText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [featuredOutputs, setFeaturedOutputs] = useState<SavedOutput[]>([]);
  const [activeFeatured, setActiveFeatured] = useState(0);

  const isDark = theme === 'dark';

  // Terminal typing effect
  useEffect(() => {
    const text = 'AWAITING CURATED CONTENT...';
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setTerminalText(text.slice(0, index));
        index++;
      } else {
        index = 0;
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Cursor blink
  useEffect(() => {
    const blink = setInterval(() => setShowCursor(prev => !prev), 500);
    return () => clearInterval(blink);
  }, []);

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchFeaturedOutputs(8).then((data) => {
      if (mounted) setFeaturedOutputs(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (featuredOutputs.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFeatured((prev) => (prev + 1) % featuredOutputs.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredOutputs]);

  useEffect(() => {
    if (activeFeatured >= featuredOutputs.length) {
      setActiveFeatured(0);
    }
  }, [activeFeatured, featuredOutputs]);

  const heroItem = featuredOutputs[activeFeatured];
  const isHeroVideo =
    heroItem?.outputType === 'video' ||
    (heroItem?.outputUrl || '').toLowerCase().match(/\.(mp4|mov|webm|mkv|avi)$/);
  const isHeroText = heroItem?.outputType === 'text';

  const handleViewPortfolio = () => {
    const target = document.getElementById('featured-gallery');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'} transition-colors duration-500`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-zinc-950/90' : 'bg-white/90'} backdrop-blur-md border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 flex items-center justify-center font-black text-black text-lg">
              Z
            </div>
            <span className={`font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              ZWAPP.ID
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'} transition-colors`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={onSignIn}
              className={`text-sm font-mono tracking-wider ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'} transition-colors`}
            >
              SIGN IN
            </button>
            
            <button
              onClick={onLaunchEngine}
              className="px-5 py-2.5 bg-transparent border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black text-sm font-mono tracking-wider transition-all flex items-center gap-2"
            >
              LAUNCH ENGINE
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background Grid */}
        <div 
          className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-5'}`}
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Gradient Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-l from-orange-950/30 to-transparent' : 'bg-gradient-to-l from-orange-100/50 to-transparent'}`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 border ${isDark ? 'border-orange-500/30 bg-orange-500/5' : 'border-orange-400 bg-orange-50'}`}>
              <div className="w-2 h-2 bg-orange-500 animate-pulse" />
              <span className={`text-xs font-mono tracking-widest ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
                AI DIRECTOR ENGINE V2.1
              </span>
            </div>

            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              THE FUTURE OF
              <br />
              <span className="text-orange-500">GENERATIVE</span>
              <br />
              STORYTELLING.
            </h1>

            <p className={`text-lg max-w-xl font-mono leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Zwapp.id is an advanced AI orchestration workspace. We combine 
              narrative direction, cinematography controls, and anti-AI 
              filtering to generate hyper-realistic assets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLaunchEngine}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold tracking-wider transition-all uppercase text-sm flex items-center justify-center gap-2 group"
              >
                START CREATING
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <button
                onClick={handleViewPortfolio}
                className={`px-8 py-4 border ${isDark ? 'border-zinc-700 hover:border-zinc-500 text-white' : 'border-zinc-300 hover:border-zinc-400 text-zinc-900'} font-bold tracking-wider transition-all uppercase text-sm`}
              >
                VIEW PORTFOLIO
              </button>
            </div>
          </div>

          {/* Right Content - Terminal Display */}
          <div className="relative">
            <div className={`relative border-2 ${isDark ? 'border-orange-500/50 bg-zinc-900/90' : 'border-orange-400 bg-white'} p-1`}>
              {/* Terminal Header */}
              <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    LIVE FEED // ONLINE
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-orange-500">SEQ: 008</span>
                </div>
              </div>

              {/* Terminal Content */}
              <div className={`aspect-video flex items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'} relative overflow-hidden`}>
                {heroItem ? (
                  <>
                    {isHeroText ? (
                      <div className="p-6 text-xs font-mono text-zinc-200 whitespace-pre-wrap">
                        {heroItem.metadata?.text || heroItem.prompt || 'Featured text output'}
                      </div>
                    ) : isHeroVideo ? (
                      <video
                        src={heroItem.outputUrl}
                        className="w-full h-full object-contain bg-black"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={heroItem.outputUrl}
                        alt={heroItem.prompt || 'Featured output'}
                        className="w-full h-full object-contain bg-black"
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
                      <div className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">
                        FEATURED OUTPUT
                      </div>
                      <div className="text-xs font-mono text-zinc-200 line-clamp-2">
                        {heroItem.prompt || heroItem.model}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto border-2 ${isDark ? 'border-zinc-700' : 'border-zinc-300'} flex items-center justify-center`}>
                      <svg className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {terminalText}{showCursor ? '?' : ' '}
                    </p>
                  </div>
                )}
              </div>

              {/* Terminal Footer - Progress Bar */}
              <div className={`h-3 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} relative overflow-hidden`}>
                <div className="absolute inset-y-0 left-0 w-full bg-orange-500/20">
                  <div className="h-full bg-orange-500 animate-pulse" style={{ width: '75%' }} />
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-orange-500" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-orange-500" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-orange-500" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-orange-500" />
            </div>

            {/* Decorative Text */}
            <div className={`absolute -right-4 top-1/2 -translate-y-1/2 text-xs font-mono ${isDark ? 'text-zinc-800' : 'text-zinc-300'} writing-vertical`}>
              NODE: GPU_ACCEL
            </div>
          </div>
        </div>
      </section>

      {/* Featured Outputs Section */}
      <section id="featured-gallery" className={`py-20 ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 border ${isDark ? 'border-orange-500/30 bg-orange-500/5' : 'border-orange-400 bg-orange-50'}`}>
                <span className={`text-xs font-mono tracking-widest ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  FEATURED OUTPUTS
                </span>
              </div>
              <h2 className={`mt-3 text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                CURATED LANDING GALLERY
              </h2>
              <p className={`text-xs font-mono mt-2 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                Selected from your gallery to appear on the landing page.
              </p>
            </div>
            <button
              onClick={onLaunchEngine}
              className={`px-4 py-2 border text-xs font-mono ${isDark ? 'border-zinc-700 text-zinc-300 hover:border-orange-500' : 'border-zinc-300 text-zinc-700 hover:border-orange-500'}`}
            >
              OPEN GALLERY
            </button>
          </div>

          {featuredOutputs.length === 0 ? (
            <div className="text-xs font-mono text-zinc-500">No featured outputs yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredOutputs.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveFeatured(idx)}
                  className={`border overflow-hidden text-left transition-transform hover:scale-[1.01] ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'}`}
                >
                  <div className="relative">
                    {item.outputType === 'video' ? (
                      <video
                        src={item.outputUrl}
                        className="w-full h-44 object-cover bg-black"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={item.outputUrl} alt={item.prompt} className="w-full h-44 object-cover bg-black" />
                    )}
                    <div className="absolute top-3 left-3 text-[10px] font-mono bg-black/60 text-orange-300 px-2 py-1">
                      FEATURED
                    </div>
                  </div>
                  <div className="p-3">
                    <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{item.model}</div>
                    <div className={`text-[10px] font-mono mt-1 line-clamp-2 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      {item.prompt || 'No prompt'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-24 ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 border ${isDark ? 'border-zinc-800' : 'border-zinc-300'} mb-4`}>
              <span className={`text-xs font-mono tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                FEATURED ARCHIVE
              </span>
            </div>
            <h2 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              PRODUCTION <span className="text-orange-500">CAPABILITIES</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'FLUX GENERATION', desc: 'High-quality image synthesis with multiple Flux models' },
              { icon: '🎬', title: 'UGC STUDIO', desc: 'AI-powered user-generated content orchestration' },
              { icon: '🎥', title: 'MOTION CONTROL', desc: 'Transform static images into cinematic video' },
              { icon: '🔮', title: 'NANO BANANA', desc: 'Advanced image editing and generation tools' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group p-6 border ${isDark ? 'border-zinc-800 hover:border-orange-500/50 bg-zinc-900/50' : 'border-zinc-200 hover:border-orange-400 bg-white'} transition-all duration-300`}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className={`font-bold tracking-wider mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {feature.desc}
                </p>
                <div className={`mt-4 w-8 h-0.5 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-orange-950/20 via-zinc-950 to-orange-950/20' : 'bg-gradient-to-r from-orange-100/50 via-white to-orange-100/50'}`} />
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className={`text-4xl md:text-5xl font-bold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            READY TO <span className="text-orange-500">CREATE</span>?
          </h2>
          <p className={`text-lg font-mono mb-10 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Enter the engine and start generating hyper-realistic content.
          </p>
          <button
            onClick={onLaunchEngine}
            className="px-12 py-5 bg-orange-500 hover:bg-orange-600 text-black font-bold tracking-wider text-lg transition-all uppercase"
          >
            LAUNCH ENGINE →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-orange-500 flex items-center justify-center font-bold text-black text-sm">
              Z
            </div>
            <span className={`text-sm font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
              © 2026 ZWAPP.ID — AI DIRECTOR ENGINE
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className={`text-sm font-mono ${isDark ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-600 hover:text-orange-600'} transition-colors`}>
              DOCUMENTATION
            </a>
            <a href="#" className={`text-sm font-mono ${isDark ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-600 hover:text-orange-600'} transition-colors`}>
              API
            </a>
            <a href="#" className={`text-sm font-mono ${isDark ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-600 hover:text-orange-600'} transition-colors`}>
              SUPPORT
            </a>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
};

export default PublicLanding;
