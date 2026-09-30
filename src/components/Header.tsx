import React, { useState } from 'react';
import { Download, Shield, Menu, X, ExternalLink, Sun } from 'lucide-react';

interface HeaderProps {
  onOpenNoAds: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNoAds }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenFullTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      // fallback
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Wordmark */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#00e575] flex items-center justify-center text-zinc-950 shadow-md shadow-[#00e575]/25 group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-zinc-950 leading-tight">
              Pastelink<span className="text-[#00e575]">.</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
              Video Downloader
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
          <a href="#home" className="hover:text-zinc-950 transition-colors">
            Home
          </a>
          <a href="#how-it-works" className="hover:text-zinc-950 transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-zinc-950 transition-colors">
            Features
          </a>
          <a href="#faq" className="hover:text-zinc-950 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Full Tab Button */}
          <button
            onClick={handleOpenFullTab}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Open in Full Tab"
          >
            <span>Full Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Light Mode Sun Badge */}
          <div
            className="w-8 h-8 rounded-full border border-amber-200 bg-amber-50/70 flex items-center justify-center text-amber-500"
            title="Light Mode Active"
          >
            <Sun className="w-4 h-4 text-amber-500" />
          </div>

          {/* No Ads Button */}
          <button
            onClick={onOpenNoAds}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#00e575] text-[#00b359] bg-white hover:bg-[#00e575]/10 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#00e575]" />
            <span>No Ads</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-zinc-700 hover:text-zinc-950 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 py-4 bg-white border-b border-zinc-200 flex flex-col gap-3 font-semibold text-sm">
          <a href="#home" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">Home</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">How It Works</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">Features</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">FAQ</a>
        </div>
      )}
    </header>
  );
};
