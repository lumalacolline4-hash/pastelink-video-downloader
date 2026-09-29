import React, { useState } from 'react';
import { Download, Sun, Moon, Shield, Menu, X } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenNoAds: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, onOpenNoAds }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#090a0f]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Wordmark */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#00e575] flex items-center justify-center text-zinc-950 shadow-md shadow-[#00e575]/25 group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
              Pastelink<span className="text-[#00e575]">.</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
              Video Downloader
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          <a href="#home" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Home
          </a>
          <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Features
          </a>
          <a href="#faq" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:border-[#00e575] transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {/* No Ads Button */}
          <button
            onClick={onOpenNoAds}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[#00e575] text-[#00e575] bg-[#00e575]/10 hover:bg-[#00e575] hover:text-zinc-950 text-xs font-bold transition-all shadow-sm shadow-[#00e575]/20"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>No Ads</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-zinc-700 dark:text-zinc-300"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 py-4 bg-white dark:bg-[#12141c] border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 font-semibold text-sm">
          <a href="#home" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">Home</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">How It Works</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">Features</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#00e575]">FAQ</a>
        </div>
      )}
    </header>
  );
};
