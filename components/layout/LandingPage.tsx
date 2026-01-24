// components/layout/LandingPage.tsx
import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const showcaseImages = [
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=400&h=300&fit=crop',
];

const features = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Generate high-quality images in seconds with our optimized AI pipeline',
  },
  {
    icon: '🎨',
    title: 'Multiple Models',
    description: 'Access Flux 2 Pro, Flux 2 Flex, Nano Banana, and more AI models',
  },
  {
    icon: '🎬',
    title: 'UGC Studio',
    description: 'Create authentic user-generated content with AI-powered orchestration',
  },
  {
    icon: '🔄',
    title: 'Motion Control',
    description: 'Transform images into dynamic videos with precision control',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % showcaseImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      setScrollPosition((prev) => (prev + 1) % 200);
    }, 50);
    return () => clearInterval(scrollInterval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-zinc-950 to-fuchsia-900/20"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-violet-600/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px]"></div>
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          ></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-zinc-400 tracking-wide">Powered by Advanced AI Models</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
              Create with
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              Zwapp Engine AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The next-generation AI creative platform. Generate stunning images, 
            create authentic UGC content, and bring your vision to life with cutting-edge AI models.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/25 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <button className="px-8 py-4 rounded-xl text-zinc-300 font-medium text-lg border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all">
              View Documentation
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10+</p>
              <p className="text-sm text-zinc-500">AI Models</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">∞</p>
              <p className="text-sm text-zinc-500">Possibilities</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-sm text-zinc-500">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Showcase Carousel */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-violet-950/10 to-zinc-950"></div>
        
        <div className="relative">
          <h2 className="text-center text-2xl font-bold text-white mb-8">AI-Generated Showcase</h2>
          
          {/* Auto-scrolling images */}
          <div className="relative overflow-hidden">
            <div 
              className="flex gap-6 animate-scroll"
              style={{
                animation: 'scroll 30s linear infinite',
              }}
            >
              {[...showcaseImages, ...showcaseImages].map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 h-48 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/50 transition-transform hover:scale-105"
                >
                  <img src={img} alt={`Showcase ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to create
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Access powerful AI tools designed for creators, marketers, and developers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent"></div>
        
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to create something amazing?
          </h2>
          <p className="text-zinc-400 mb-10">
            Join thousands of creators using Zwapp Engine AI to bring their ideas to life.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-5 bg-white text-zinc-950 rounded-xl font-semibold text-lg hover:bg-zinc-100 transition-all hover:scale-105"
          >
            Start Creating Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="text-sm text-zinc-500">© 2026 Zwapp Engine AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">API Reference</a>
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* CSS Animation for scroll */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          width: max-content;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
