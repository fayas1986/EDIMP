import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Move,
  Scan,
  Maximize,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';

interface ZoomablePipelineViewportProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  theme?: 'dark' | 'light';
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  className?: string;
  headerActions?: React.ReactNode;
}

export const ZoomablePipelineViewport: React.FC<ZoomablePipelineViewportProps> = ({
  children,
  title = 'Execution Pipeline Topology Map',
  subtitle,
  statusBadge,
  theme = 'dark',
  minZoom = 0.5,
  maxZoom = 2.0,
  initialZoom = 1.0,
  className = '',
  headerActions,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);
  const [panPos, setPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFitMode, setIsFitMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle Zoom In
  const handleZoomIn = () => {
    setIsFitMode(false);
    setZoomLevel((prev) => Math.min(maxZoom, Math.round((prev + 0.15) * 100) / 100));
  };

  // Handle Zoom Out
  const handleZoomOut = () => {
    setIsFitMode(false);
    setZoomLevel((prev) => Math.max(minZoom, Math.round((prev - 0.15) * 100) / 100));
  };

  // Handle Zoom to Fit: automatically scales to fit viewport container perfectly
  const handleZoomToFit = () => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const contentWidth = contentRef.current.scrollWidth || 1000;
      
      if (contentWidth > 0 && containerWidth > 0) {
        // Calculate dynamic scale ratio with padding
        const calculatedScale = Math.min(1.0, Math.max(minZoom, (containerWidth - 32) / contentWidth));
        setZoomLevel(Math.round(calculatedScale * 100) / 100);
      } else {
        setZoomLevel(0.9);
      }
    } else {
      setZoomLevel(0.95);
    }
    setPanPos({ x: 0, y: 0 });
    setIsFitMode(true);
  };

  // Handle Reset to 1:1 scale
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanPos({ x: 0, y: 0 });
    setIsFitMode(false);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`relative rounded-2xl border transition-all overflow-hidden ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl flex flex-col justify-between'
          : ''
      } ${
        isDark
          ? 'bg-slate-950 text-white border-slate-800 shadow-xl'
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      } ${className}`}
    >
      {/* HEADER CONTROL TOOLBAR */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 select-none ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Left: Title & Status */}
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ${
              isDark
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-bold tracking-wide ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {title}
              </h3>
              {statusBadge}
            </div>
            {subtitle && (
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Zoom & Viewport Controls Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {headerActions}

          {/* Current Zoom Indicator Badge */}
          <span
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 border ${
              isFitMode
                ? isDark
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Current Viewport Zoom Scale"
          >
            {isFitMode && <Check className="w-3 h-3 text-emerald-400" />}
            <span>{isFitMode ? 'Fit Viewport' : `${Math.round(zoomLevel * 100)}%`}</span>
          </span>

          {/* Zoom Control Button Group */}
          <div
            className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= minZoom}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-30 ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  : 'hover:bg-white text-slate-600 hover:text-slate-900'
              }`}
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom In Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= maxZoom}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-30 ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  : 'hover:bg-white text-slate-600 hover:text-slate-900'
              }`}
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className={`w-px h-3 mx-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

            {/* ZOOM TO FIT BUTTON (Primary highlight) */}
            <button
              type="button"
              onClick={handleZoomToFit}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isFitMode
                  ? 'bg-indigo-600 text-white shadow-3xs'
                  : isDark
                  ? 'hover:bg-slate-800 text-indigo-400 hover:text-white'
                  : 'hover:bg-white text-indigo-600 hover:text-indigo-900'
              }`}
              title="Zoom to Fit Viewport (Framed Auto-Scale)"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Zoom to Fit</span>
            </button>

            {/* Reset 100% Button */}
            <button
              type="button"
              onClick={handleResetZoom}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-white text-slate-500 hover:text-slate-900'
              }`}
              title="Reset Zoom to 100% (1:1)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Expand Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-white text-slate-500 hover:text-slate-900'
              }`}
              title={isFullscreen ? 'Exit Full Viewport' : 'Expand Viewport Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* CANVAS VIEWPORT CONTAINER WITH FRAMER MOTION ANIMATION */}
      <div
        ref={containerRef}
        className={`relative overflow-auto p-4 min-h-[160px] flex items-center justify-center ${
          isDark
            ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]'
        }`}
      >
        {/* FRAMER MOTION TRANSFORM CONTAINER */}
        <motion.div
          ref={contentRef}
          className="w-full origin-center"
          animate={{
            scale: zoomLevel,
            x: panPos.x,
            y: panPos.y,
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 26,
            mass: 0.8,
          }}
          drag={zoomLevel > 1.05}
          dragConstraints={containerRef}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            setPanPos((prev) => ({
              x: prev.x + info.offset.x,
              y: prev.y + info.offset.y,
            }));
          }}
        >
          {children}
        </motion.div>
      </div>

      {/* FOOTER HELPER HINT */}
      <div
        className={`px-4 py-1.5 border-t text-[10px] font-mono flex items-center justify-between select-none ${
          isDark
            ? 'bg-slate-950 border-slate-900 text-slate-500'
            : 'bg-slate-50 border-slate-100 text-slate-400'
        }`}
      >
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-slate-500" />
          {zoomLevel > 1.05 ? 'Drag canvas to pan around scaled pipeline' : 'Use Zoom controls to adjust pipeline visualization scale'}
        </span>
        <span>
          Scale: <strong className="text-slate-400">{Math.round(zoomLevel * 100)}%</strong>
        </span>
      </div>
    </div>
  );
};
