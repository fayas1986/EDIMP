import React from 'react';
import { Keyboard, X, Command, ArrowUpDown, CornerDownLeft } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keyCombo: 'Ctrl + K  or  Cmd + K', description: 'Open Global Quick Actions Command Palette', category: 'Commands' },
    { keyCombo: 'Alt + B', description: 'Toggle Sidebar Collapse / Expand', category: 'Navigation' },
    { keyCombo: 'Alt + M', description: 'Skip directly to Main Content area', category: 'Accessibility' },
    { keyCombo: 'Alt + K  or  ?', description: 'Open / Close this Keyboard Shortcuts Dialog', category: 'Help' },
    { keyCombo: 'Arrow Up / Down', description: 'Navigate between sidebar menu items', category: 'Navigation' },
    { keyCombo: 'Home / End', description: 'Jump to first / last item in sidebar group', category: 'Navigation' },
    { keyCombo: 'Esc', description: 'Close open dropdowns, mobile menu, or dialogs', category: 'Controls' },
    { keyCombo: 'Alt + 1', description: 'Navigate to Dashboard', category: 'Quick Views' },
    { keyCombo: 'Alt + 2', description: 'Navigate to Connectors', category: 'Quick Views' },
    { keyCombo: 'Alt + 3', description: 'Navigate to Mapping Studio', category: 'Quick Views' },
    { keyCombo: 'Alt + 4', description: 'Navigate to Validation & Cleansing', category: 'Quick Views' },
    { keyCombo: 'Alt + 5', description: 'Navigate to Migration Wizard', category: 'Quick Views' },
    { keyCombo: 'Alt + 6', description: 'Navigate to Error Center', category: 'Quick Views' },
    { keyCombo: 'Alt + 7', description: 'Navigate to AI Co-Pilot', category: 'Quick Views' },
    { keyCombo: 'Alt + 8', description: 'Navigate to Settings', category: 'Quick Views' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="text-base font-extrabold text-white flex items-center gap-2">
                Keyboard Navigation Shortcuts
              </h2>
              <p className="text-xs text-slate-400">
                Accessible hotkeys for quick platform navigation & screen readers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="grid grid-cols-1 gap-2.5">
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200">{shortcut.description}</div>
                  <div className="text-[10px] font-mono font-medium text-slate-500">{shortcut.category}</div>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-xs font-bold shadow-xs whitespace-nowrap">
                  {shortcut.keyCombo}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Command className="w-3.5 h-3.5 text-indigo-400" /> Screen reader aria-keyshortcuts enabled
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
