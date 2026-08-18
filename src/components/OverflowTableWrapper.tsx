import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';

interface OverflowTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  showScrollButtons?: boolean;
  showScrollHint?: boolean;
  hintLabel?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const OverflowTableWrapper: React.FC<OverflowTableWrapperProps> = ({
  children,
  className = '',
  containerClassName = '',
  showScrollButtons = true,
  showScrollHint = true,
  hintLabel = 'Scroll horizontally for more columns',
  theme = 'light',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    if (maxScroll > 10) {
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScroll - 10);
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  const handleScrollBy = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(updateScrollState, 300);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative group/overflow-wrapper ${className}`}>
      {/* Top Banner Scroll Hint Badge (shows if overflow is detected and user hasn't fully scrolled) */}
      {showScrollHint && (canScrollLeft || canScrollRight) && (
        <div className={`flex items-center justify-between px-3.5 py-1.5 backdrop-blur-md border-b text-[10px] font-mono select-none ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : 'bg-slate-50/95 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span className="font-bold text-slate-800">{hintLabel}</span>
            {canScrollRight && (
              <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                isDark 
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-3xs'
              }`}>
                More Columns &rarr;
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Scroll Progress Bar Indicator */}
            <div className={`w-16 h-1.5 rounded-full overflow-hidden border hidden sm:block ${
              isDark ? 'bg-slate-800 border-slate-700/60' : 'bg-slate-200 border-slate-300/60'
            }`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-150 rounded-full"
                style={{ width: `${Math.max(15, scrollProgress)}%` }}
              />
            </div>

            {/* Quick Arrow Scroll Buttons */}
            {showScrollButtons && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScrollBy('left')}
                  disabled={!canScrollLeft}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    canScrollLeft
                      ? isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs font-bold'
                      : isDark
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollBy('right')}
                  disabled={!canScrollRight}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    canScrollRight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 shadow-2xs'
                      : isDark
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  title="Scroll Right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Scrollable Viewport with Soft Light Edge Fades */}
      <div className="relative overflow-hidden rounded-b-xl">
        {/* LEFT SCROLL SHADOW OVERLAY - Clean white/slate edge fade */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-4 z-20 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          } ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent'
              : 'bg-gradient-to-r from-white via-white/80 to-transparent'
          }`}
        />

        {/* RIGHT SCROLL SHADOW OVERLAY - Clean white/slate edge fade */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-4 z-20 transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          } ${
            isDark
              ? 'bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent'
              : 'bg-gradient-to-l from-white via-white/80 to-transparent'
          }`}
        />

        {/* FLOATING ACTION BUTTON ON RIGHT SCROLL EDGE */}
        {showScrollButtons && canScrollRight && (
          <button
            type="button"
            onClick={() => handleScrollBy('right')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full border shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100 group/btn ${
              isDark
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
                : 'bg-white hover:bg-indigo-50 text-indigo-600 border-slate-200 ring-1 ring-slate-200/60'
            }`}
            title="Scroll Right to see more columns"
          >
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* FLOATING ACTION BUTTON ON LEFT SCROLL EDGE */}
        {showScrollButtons && canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScrollBy('left')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full border shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100 group/btn ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4 group-hover/btn:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* The Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className={`overflow-x-auto custom-modal-scrollbar ${containerClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
