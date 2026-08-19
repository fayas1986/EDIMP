import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error in EDIMP Platform:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[450px] p-8 m-4 bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center text-white space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-lg animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              Runtime Error Handled Safely
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {this.props.fallbackTitle || 'A component error occurred in this view'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The EDIMP Error Boundary intercepted an isolated rendering exception. The rest of the platform remains safe and functional.
            </p>
          </div>

          {this.state.error && (
            <div className="w-full max-w-xl bg-slate-950/80 p-4 rounded-xl border border-rose-900/40 text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-36">
              <div className="font-bold text-rose-400 mb-1">Error Message:</div>
              <div>{this.state.error.toString()}</div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => {
                this.handleReset();
                window.location.hash = '#dashboard';
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
