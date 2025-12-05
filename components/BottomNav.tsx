
import React from 'react';
import { Page } from '../types';
import { NAV_ITEMS, PROTECTED_PAGES } from '../constants';
import { useBuvette } from '../hooks/useBuvette';
import { LockClosedIcon } from './Icons';

interface BottomNavProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPage }) => {
  const { cartCount, isAdmin, settings } = useBuvette();

  // Use brand color for active items if set, otherwise default to blue-500 logic (via inline style for custom)
  const activeColor = settings.brandColor || '#3b82f6'; // Default blue-500

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 z-50">
      <nav className="flex justify-around items-center h-20 safe-area-pb">
        {NAV_ITEMS.map(({ page, label, icon: Icon }) => {
          const isSaleItem = page === Page.Sale;

          // The "Sale" button dynamically becomes the "Cart" button when items are present.
          const effectivePage = isSaleItem && cartCount > 0 ? Page.Cart : page;
          const effectiveLabel = isSaleItem && cartCount > 0 ? 'Panier' : label;
          
          const isActive = currentPage === effectivePage;
          const isProtected = PROTECTED_PAGES.includes(page); 
          const isLocked = isProtected && !isAdmin;

          const colorClass = isActive ? '' : 'text-slate-400';
          const style = isActive ? { color: activeColor } : {};
          
          return (
            <button
              key={page} 
              onClick={() => setPage(effectivePage)}
              className="flex flex-col items-center justify-center w-full transition-transform duration-200 ease-in-out transform hover:scale-110 relative p-2"
              aria-label={effectiveLabel}
            >
              <div className="relative">
                 {isLocked ? (
                  <LockClosedIcon className={`w-7 h-7 ${colorClass}`} style={style} />
                ) : (
                  <Icon className={`w-7 h-7 ${colorClass} transition-all duration-300`} style={{ ...style, filter: isActive ? `drop-shadow(0 0 8px ${activeColor}80)` : 'none' }} />
                )}
                {/* The badge now appears on the Sale/Cart button */}
                {isSaleItem && cartCount > 0 && (
                   <span className="absolute -top-2 -right-3 flex items-center justify-center w-5 h-5 text-xs font-bold text-black bg-orange-500 rounded-full shadow-sm">
                     {cartCount}
                   </span>
                )}
                 {isActive && <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full" style={{ backgroundColor: activeColor, boxShadow: `0 0 10px ${activeColor}` }} />}
              </div>
              <span className={`text-[10px] mt-1 font-semibold tracking-wide uppercase ${colorClass}`} style={style}>
                {effectiveLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default React.memo(BottomNav);