import React from 'react';
import { Download } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#090a0f] py-8 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00e575] flex items-center justify-center text-zinc-950 font-bold">
            <Download className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <strong className="text-sm font-extrabold text-zinc-900 dark:text-white block">
              Pastelink.
            </strong>
            <small className="text-[10px] text-zinc-500 font-semibold">
              Video Downloader
            </small>
          </div>
        </div>

        <p className="text-xs text-zinc-500 font-medium">
          © {new Date().getFullYear()} Pastelink. Professional SaaS Video Downloader.
        </p>
      </div>
    </footer>
  );
};
