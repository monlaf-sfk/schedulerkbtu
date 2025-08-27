import React from 'react';
import kbtuLogo from '../../assets/kbtu-logo.svg';

export const Header: React.FC<{ onFilterClick?: () => void }> = ({ onFilterClick }) => {
  return (
    <header className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 p-6 border-b border-slate-600/30 flex items-center justify-between shadow-xl">

      <div className="flex items-center justify-center gap-3">
        <img
          src={kbtuLogo}
          alt="KBTU Logo"
          className="w-12 h-12 object-contain shrink-0"
        />
        <div className="flex flex-col items-start leading-none">
          <span className="text-2xl md:text-1xl font-bold text-white drop-shadow-lg">
            KBTU Schedule Builder
          </span>
        </div>
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all duration-200 flex items-center gap-3 font-semibold border border-emerald-500/30"
        >
          <span className="hidden sm:inline">Фильтры</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-filter" viewBox="0 0 24 24"><line x1="22" y1="3" x2="2" y2="3"></line><line x1="16" y1="7" x2="8" y2="7"></line><line x1="22" y1="11" x2="2" y2="11"></line><line x1="12" y1="15" x2="2" y2="15"></line><line x1="22" y1="19" x2="8" y2="19"></line></svg>
        </button>
      )}
    </header>
  );
};