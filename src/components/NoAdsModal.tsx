import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface NoAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoAdsModal: React.FC<NoAdsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#12141c] border-2 border-[#00e575] rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(0,229,117,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-[#00e575]/15 text-[#00e575] flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">
          100% Ad-Free Guarantee
        </h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
          Pastelink is designed as a clutter-free SaaS tool. You will never encounter deceptive popups, malware redirects, or fake download arrows.
        </p>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#00e575] hover:bg-[#00cf68] text-zinc-950 font-black text-sm transition-all shadow-md shadow-[#00e575]/30"
        >
          Got It, Continue
        </button>
      </div>
    </div>
  );
};
