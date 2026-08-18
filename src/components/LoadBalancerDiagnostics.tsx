import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Server, Zap, Database, ArrowRight, Share2, ShieldCheck, Box, Download, Loader2, BarChart3, AlertTriangle, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { Connector } from '../types';
import html2canvas from 'html2canvas';

interface Packet {
  id: string;
  targetId: string;
  progress: number; // 0 to 1
  size: number;
  category: 'INFO' | 'WARNING' | 'ERROR';
}

interface LoadBalancerDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  connectors: any[];
  incomingRate: number;
}

const CATEGORY_CONFIG = {
  INFO: { color: 'bg-emerald-400', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.8)]', label: 'Info' },
  WARNING: { color: 'bg-amber-400', shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.8)]', label: 'Warning' },
  ERROR: { color: 'bg-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.8)]', label: 'Error' },
};

export const LoadBalancerDiagnostics: React.FC<LoadBalancerDiagnosticsProps> = ({ 
  isOpen, 
  onClose, 
  connectors,
  incomingRate
}) => {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(['INFO', 'WARNING', 'ERROR']));
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const lastPacketTime = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const vizRef = useRef<HTMLDivElement>(null);

  // Update dimensions for relative positioning
  useEffect(() => {
    const updateDimensions = () => {
      if (vizRef.current) {
        setDimensions({
          width: vizRef.current.clientWidth,
          height: vizRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isOpen]);

  const toggleCategory = (cat: string) => {
    const next = new Set(visibleCategories);
    if (next.has(cat)) {
      if (next.size > 1) next.delete(cat);
    } else {
      next.add(cat);
    }
    setVisibleCategories(next);
  };

  const selectedNode = connectors.find(c => c.id === selectedNodeId);

  const handleExportImage = async () => {
    if (!containerRef.current) return;
    
    setIsExporting(true);
    setSelectedNodeId(null); // Close popover for export
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#020617', // Match slate-950
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `load-balancer-diagnostics-${new Date().getTime()}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Animation loop for packets
  useEffect(() => {
    if (!isOpen) {
      setPackets([]);
      return;
    }

    let animationFrame: number;
    const update = (time: number) => {
      // 1. Move existing packets
      setPackets(prev => {
        const moved = prev.map(p => ({ ...p, progress: p.progress + 0.015 }))
                        .filter(p => p.progress < 1);
        
        // 2. Generate new packets based on incomingRate
        const spawnInterval = 1000 / (incomingRate * 3 || 1); // scaling for visual density
        if (time - lastPacketTime.current > spawnInterval) {
          const target = connectors[Math.floor(Math.random() * connectors.length)];
          const rand = Math.random();
          const category: 'INFO' | 'WARNING' | 'ERROR' = 
            rand > 0.9 ? 'ERROR' : 
            rand > 0.7 ? 'WARNING' : 
            'INFO';

          if (target) {
            moved.push({
              id: Math.random().toString(36).substring(7),
              targetId: target.id,
              progress: 0,
              size: category === 'ERROR' ? 6 : category === 'WARNING' ? 4 : 2.5,
              category
            });
            lastPacketTime.current = time;
          }
        }
        return moved;
      });

      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isOpen, incomingRate, connectors]);

  if (!isOpen) return null;

  const filteredPackets = packets.filter(p => visibleCategories.has(p.category));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
        onClick={() => setSelectedNodeId(null)}
      >
        <div 
          ref={containerRef} 
          className="w-full h-full max-w-7xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center gap-8">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
                  Real-Time Load Balancer Diagnostics
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Visualizing active packet distribution across <span className="text-emerald-400 font-bold">{connectors.length} configured nodes</span>.
                </p>
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-slate-950/50 hover:bg-slate-900 text-slate-300 rounded-xl border border-slate-800 transition-all shadow-sm text-xs font-bold"
                >
                  <Filter className="w-4 h-4 text-indigo-400" />
                  <span>Filter Streams</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[70] p-2 overflow-hidden backdrop-blur-xl"
                    >
                      {(['INFO', 'WARNING', 'ERROR'] as const).map(cat => {
                        const active = visibleCategories.has(cat);
                        const config = CATEGORY_CONFIG[cat];
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${active ? config.color : 'bg-slate-700'}`} />
                              {config.label}
                            </div>
                            {active && <div className="w-1 h-1 bg-indigo-500 rounded-full" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportImage}
                disabled={isExporting}
                className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-2xl border border-indigo-400/30 transition-all shadow-xl text-sm font-bold active:scale-95"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {isExporting ? 'Generating PNG...' : 'Export as Image'}
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-colors shadow-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Visualization Area */}
          <div 
            ref={vizRef}
            className="flex-1 bg-slate-900/30 rounded-[2.5rem] border border-slate-800/80 relative overflow-hidden p-8 shadow-2xl backdrop-blur-sm"
          >
            {/* Technical Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            
            {/* The Source Node (Gateway) */}
            <div className="absolute left-16 top-1/2 -translate-y-1/2 z-30">
              <div className="relative group">
                <div className="absolute -inset-8 bg-indigo-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
                <div className="relative w-32 h-32 bg-slate-950 rounded-[2rem] border-2 border-indigo-500/50 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-2">
                    <Box className="w-10 h-10 text-indigo-400" />
                  </div>
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">Gateway</span>
                  
                  {/* Decorative corner elements */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400 rounded-br-lg"></div>
                </div>
              </div>
            </div>

            {/* Performance Heatmap Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {dimensions.width > 0 && connectors.map((node, i) => {
                const startX = 144 + 48; // Right edge of gateway box (relative to vizRef)
                const startY = dimensions.height / 2;
                
                const endX = dimensions.width - 240; // Left edge of connector nodes
                const endY = (i / (connectors.length - 1)) * (dimensions.height - 160) + 80;

                // Heatmap logic based on latency
                const latency = node.currentLatency || 0;
                let strokeColor = 'rgba(16, 185, 129, 0.2)';
                let glowColor = 'rgba(16, 185, 129, 0.05)';
                
                if (latency > 150) {
                  strokeColor = 'rgba(244, 63, 94, 0.4)';
                  glowColor = 'rgba(244, 63, 94, 0.15)';
                } else if (latency > 80) {
                  strokeColor = 'rgba(245, 158, 11, 0.3)';
                  glowColor = 'rgba(245, 158, 11, 0.1)';
                }

                return (
                  <g key={`line-${node.id}`}>
                    <path
                      d={`M ${startX} ${startY} L ${endX} ${endY}`}
                      stroke={glowColor}
                      strokeWidth="12"
                      fill="none"
                      className="transition-all duration-700 blur-xl"
                    />
                    <path
                      d={`M ${startX} ${startY} L ${endX} ${endY}`}
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      fill="none"
                      className="transition-all duration-700"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Moving Packets */}
            {dimensions.width > 0 && filteredPackets.map(packet => {
              const targetIndex = connectors.findIndex(c => c.id === packet.targetId);
              const startX = 144 + 48;
              const startY = dimensions.height / 2;
              
              const endX = dimensions.width - 240;
              const endY = (targetIndex / (connectors.length - 1)) * (dimensions.height - 160) + 80;

              const currentX = startX + (endX - startX) * packet.progress;
              const currentY = startY + (endY - startY) * packet.progress;
              
              const config = CATEGORY_CONFIG[packet.category];

              return (
                <motion.div
                  key={packet.id}
                  className="absolute pointer-events-none z-20"
                  style={{ left: currentX, top: currentY }}
                >
                  <div 
                    className={`${config.color} rounded-full ${config.shadow} animate-pulse-velocity`}
                    style={{ width: packet.size, height: packet.size }}
                  />
                </motion.div>
              );
            })}

            {/* The Destination Nodes */}
            <div className="absolute right-12 top-0 bottom-0 flex flex-col justify-between py-12 z-30">
              {connectors.map(node => {
                const isActive = selectedNodeId === node.id;
                return (
                  <div key={node.id} className="relative">
                    <motion.div
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(isActive ? null : node.id);
                      }}
                    >
                      <div className="absolute inset-0 bg-indigo-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className={`relative w-56 p-3.5 rounded-2xl border transition-all duration-300 ${
                        isActive ? 'border-indigo-500 bg-slate-800 shadow-[0_0_30px_rgba(79,70,229,0.2)]' :
                        node.queue > node.maxThroughput * 3 ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)] bg-slate-900/90' : 
                        'border-slate-800 hover:border-slate-700 shadow-xl bg-slate-900/90 backdrop-blur-md'
                      }`}>
                        <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${node.statusColor}`}>
                          <Server className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{node.name}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="h-1.5 flex-1 bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  node.queue > node.maxThroughput * 6 ? 'bg-rose-500' :
                                  node.queue > node.maxThroughput * 3 ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, (node.queue / (node.maxThroughput * 5)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-black font-mono text-slate-500">{Math.min(100, Math.round((node.queue / (node.maxThroughput * 5)) * 100))}%</span>
                          </div>
                        </div>
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400">
                            <TrendingUp className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Node Stats Popover */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -20, scale: 0.95 }}
                          className="absolute right-full top-1/2 -translate-y-1/2 mr-6 z-[60] w-64"
                        >
                          <div className="bg-slate-900 border border-slate-700 p-5 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border-l-4 border-l-indigo-500">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Real-time Telemetry</h4>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[8px] font-bold text-emerald-500 uppercase">Live</span>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Zap className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold">Throughput</span>
                                </div>
                                <span className="text-xs font-black text-white font-mono">{node.maxThroughput.toLocaleString()} rps</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold">Active Queue</span>
                                </div>
                                <span className={`text-xs font-black font-mono ${node.queue > node.maxThroughput * 3 ? 'text-amber-400' : 'text-white'}`}>
                                  {node.queue.toLocaleString()} rows
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold">Latency</span>
                                </div>
                                <span className={`text-xs font-black font-mono ${node.currentLatency > 150 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {node.currentLatency.toFixed(1)}ms
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold">Error Rate</span>
                                </div>
                                <span className="text-xs font-black text-rose-400 font-mono">0.02%</span>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800">
                              <div className="text-[9px] font-bold text-slate-500 uppercase mb-2">Resource Utilization</div>
                              <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-indigo-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.random() * 40 + 40}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          {/* Triangle indicator */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-slate-700"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Stats Footer */}
          <div className="mt-6 grid grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm p-6 rounded-[2rem] flex items-center gap-5 shadow-xl">
              <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Routing Logic</div>
                <div className="text-base font-bold text-white mt-0.5">Round-Robin</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm p-6 rounded-[2rem] flex items-center gap-5 shadow-xl">
              <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Ingestion</div>
                <div className="text-base font-bold text-white mt-0.5 font-mono">{incomingRate.toFixed(1)}k rps</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm p-6 rounded-[2rem] flex items-center gap-5 shadow-xl">
              <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Connectors</div>
                <div className="text-base font-bold text-white mt-0.5">{connectors.length} Nodes</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm p-6 rounded-[2rem] flex items-center gap-5 shadow-xl">
              <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</div>
                <div className="text-base font-bold text-white mt-0.5">100% OK</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

