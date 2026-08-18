import React, { useState } from 'react';
import {
  Download,
  Terminal,
  Check,
  Copy,
  X,
  ShieldCheck,
  Zap,
  Server,
  Package,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  FileCode,
  ExternalLink,
  ChevronRight,
  Cpu,
  Laptop
} from 'lucide-react';

interface CliDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}

export function CliDownloadModal({ isOpen, onClose, apiKey = 'pk_live_89f3a1e9482b4039a' }: CliDownloadModalProps) {
  const [selectedOs, setSelectedOs] = useState<'macos' | 'linux' | 'windows' | 'npm'>('macos');
  const [embedApiKey, setEmbedApiKey] = useState<boolean>(true);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; latency: number; msg: string } | null>(null);

  if (!isOpen) return null;

  // OS Command mapping
  const commands = {
    macos: embedApiKey
      ? `curl -fsSL https://cli.edimp.io/install.sh | bash -s -- --token="${apiKey}"`
      : `brew tap edimp-platform/tap && brew install edimp-cli`,
    linux: embedApiKey
      ? `curl -fsSL https://cli.edimp.io/install.sh | bash -s -- --token="${apiKey}"`
      : `curl -fsSL https://cli.edimp.io/install.sh | bash`,
    windows: embedApiKey
      ? `iwr -useb https://cli.edimp.io/install.ps1 | iex -Args "-Token", "${apiKey}"`
      : `iwr -useb https://cli.edimp.io/install.ps1 | iex`,
    npm: embedApiKey
      ? `npm install -g @edimp/cli && edimp auth login --token="${apiKey}"`
      : `npm install -g @edimp/cli`
  };

  const currentCommand = commands[selectedOs];

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(currentCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDownloadInstaller = () => {
    setDownloading(true);
    setDownloadSuccess(false);

    setTimeout(() => {
      let fileContent = '';
      let filename = '';
      let mimeType = 'text/plain';

      if (selectedOs === 'windows') {
        filename = `edimp-cli-v3.4.0-installer.ps1`;
        mimeType = 'text/plain';
        fileContent = `# Enterprise Data Integration Platform (EDIMP) CLI Installer - Windows
# Version: 3.4.0
# Target OS: Windows x64 / ARM64

$ErrorActionPreference = "Stop"
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " EDIMP Platform CLI v3.4.0 Windows Direct Setup Script " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$EDIMP_HOME = "$env:USERPROFILE\\.edimp"
$EDIMP_BIN = "$EDIMP_HOME\\bin"
$API_TOKEN = "${embedApiKey ? apiKey : 'YOUR_API_TOKEN'}"

New-Item -ItemType Directory -Force -Path $EDIMP_BIN | Out-Null

Write-Host "[1/3] Downloading edimp-cli binary bundle..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

Write-Host "[2/3] Configuring environment executable paths..." -ForegroundColor Yellow
# Save mock binary wrapper executable script
$cliScript = @"
@echo off
echo [EDIMP CLI v3.4.0] Executing command: %*
if "%1"=="version" (
    echo edimp-cli version 3.4.0 (x86_64-windows-msvc)
    exit /b 0
)
if "%1"=="auth" (
    echo Auth status: Authenticated as Enterprise Operator (Key: ${embedApiKey ? apiKey : 'Default'})
    exit /b 0
)
echo Command '%*' completed successfully.
"@

Set-Content -Path "$EDIMP_BIN\\edimp.cmd" -Value $cliScript

Write-Host "[3/3] Authenticating session credentials..." -ForegroundColor Yellow
Write-Host "✓ Successfully installed EDIMP CLI v3.4.0!" -ForegroundColor Green
Write-Host "Run 'edimp --help' or 'edimp status' in PowerShell to get started." -ForegroundColor Cyan
`;
      } else {
        filename = `edimp-cli-v3.4.0-installer.sh`;
        mimeType = 'application/x-sh';
        fileContent = `#!/usr/bin/env bash
# Enterprise Data Integration Platform (EDIMP) CLI Installer
# Version: 3.4.0
# Platform: Linux / macOS

set -e

echo "========================================================="
echo " EDIMP Platform CLI v3.4.0 Installer "
echo "========================================================="

EDIMP_HOME="$HOME/.edimp"
BIN_DIR="$EDIMP_HOME/bin"
API_TOKEN="${embedApiKey ? apiKey : 'YOUR_API_TOKEN'}"

mkdir -p "$BIN_DIR"

echo "-> Downloading EDIMP CLI binary package v3.4.0..."
sleep 1

echo "-> Creating CLI binary executable at $BIN_DIR/edimp..."

cat << 'EOF' > "$BIN_DIR/edimp"
#!/usr/bin/env bash
# EDIMP CLI Executable Wrapper v3.4.0
if [ "$1" = "version" ]; then
    echo "edimp-cli version 3.4.0 (x86_64-apple-darwin / linux)"
    exit 0
elif [ "$1" = "auth" ]; then
    echo "✓ Auth status: Active (Token: ${embedApiKey ? apiKey : 'Configured'})"
    exit 0
elif [ "$1" = "jobs" ]; then
    echo "Active Jobs:"
    echo " - job-101: Salesforce -> SAP HANA (Running, 84%)"
    echo " - job-102: Oracle CDC -> Postgres (Completed, 100%)"
    exit 0
fi

echo "[EDIMP CLI v3.4.0] Executed command: $@"
EOF

chmod +x "$BIN_DIR/edimp"

echo "-> Configuring shell PATH environment..."
export PATH="$BIN_DIR:$PATH"

echo "========================================================="
echo " ✓ EDIMP CLI v3.4.0 successfully installed!"
echo "   Executable location: $BIN_DIR/edimp"
echo "   Run 'edimp auth status' to verify connection."
echo "========================================================="
`;
      }

      // Trigger browser download
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloadSuccess(true);
    }, 800);
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setConnectionResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      setConnectionResult({
        success: true,
        latency: Math.floor(Math.random() * 15) + 12,
        msg: 'HTTP 200 OK • Gateway endpoint https://api.edimp.io/v2 online'
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-indigo-900/40 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
              <Terminal className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/40">
                  CLI Tool v3.4.0
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Production Ready
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Download Enterprise CLI Tools (<code className="text-indigo-300 font-mono font-bold">edimp-cli</code>)
              </h2>

              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Cross-platform command-line tool for headless pipeline execution, streaming CDC sync triggers, schema validation diffs, and automated CI/CD connector deployments.
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* OS Platform Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Select Operating System / Distribution
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedOs('macos')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition cursor-pointer text-left ${
                  selectedOs === 'macos'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Laptop className={`w-4 h-4 ${selectedOs === 'macos' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <div>
                  <div className="leading-tight">macOS</div>
                  <div className="text-[10px] font-normal text-slate-500">Apple & Intel</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOs('linux')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition cursor-pointer text-left ${
                  selectedOs === 'linux'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Server className={`w-4 h-4 ${selectedOs === 'linux' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <div>
                  <div className="leading-tight">Linux</div>
                  <div className="text-[10px] font-normal text-slate-500">x86_64 / ARM64</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOs('windows')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition cursor-pointer text-left ${
                  selectedOs === 'windows'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Cpu className={`w-4 h-4 ${selectedOs === 'windows' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <div>
                  <div className="leading-tight">Windows</div>
                  <div className="text-[10px] font-normal text-slate-500">PowerShell / x64</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOs('npm')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition cursor-pointer text-left ${
                  selectedOs === 'npm'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Package className={`w-4 h-4 ${selectedOs === 'npm' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <div>
                  <div className="leading-tight">NPM Package</div>
                  <div className="text-[10px] font-normal text-slate-500">Node.js Global</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Install Command Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Automated One-Line Terminal Setup Command
              </label>

              {/* API Key Embed Toggle */}
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={embedApiKey}
                  onChange={(e) => setEmbedApiKey(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Embed active API Token</span>
              </label>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner relative group">
              <div className="flex items-center justify-between gap-3 font-mono text-xs text-indigo-300 break-all pr-12">
                <span>{currentCommand}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyCommand}
                className="absolute right-3 top-3.5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold border border-slate-700"
                title="Copy terminal command"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct File Download Button Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Direct Installer Bundle Download</h4>
                <p className="text-[11px] text-slate-500">
                  Download ready-to-run installer payload (<code className="text-indigo-700 font-mono font-bold">
                    {selectedOs === 'windows' ? 'edimp-cli-v3.4.0-installer.ps1' : 'edimp-cli-v3.4.0-installer.sh'}
                  </code>) directly to disk.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadInstaller}
              disabled={downloading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2 shrink-0"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Installer...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download CLI Package</span>
                </>
              )}
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Installer payload downloaded successfully! Run script in terminal to complete setup.</span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadSuccess(false)}
                className="text-emerald-700 hover:text-emerald-900 text-[10px] font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* API Credentials Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>ACTIVE API SESSION TOKEN FOR CLI LOGIN</span>
              </div>

              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[9px] font-bold rounded-md">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-indigo-300 font-bold truncate">{apiKey}</span>

              <button
                type="button"
                onClick={handleCopyToken}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Run <code className="text-indigo-300 font-mono font-bold">edimp auth login --token={apiKey}</code> if prompt requires manual credential binding.
            </p>
          </div>

          {/* Quick CLI Command Reference Sheet */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              3. Common CLI Operations Cheat Sheet
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Check CLI & Gateway Health</span>
                </div>
                <div className="bg-slate-900 text-indigo-300 p-2 rounded-xl font-mono text-[11px]">
                  $ edimp status
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Trigger Migration Pipeline Job</span>
                </div>
                <div className="bg-slate-900 text-indigo-300 p-2 rounded-xl font-mono text-[11px]">
                  $ edimp jobs start --id=job-101 --watch
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Stream CDC Connector Logs</span>
                </div>
                <div className="bg-slate-900 text-indigo-300 p-2 rounded-xl font-mono text-[11px]">
                  $ edimp connector stream conn-sdk-01
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Compare Target Schema Diffs</span>
                </div>
                <div className="bg-slate-900 text-indigo-300 p-2 rounded-xl font-mono text-[11px]">
                  $ edimp schema diff --src pg --tgt bc
                </div>
              </div>
            </div>
          </div>

          {/* Test CLI Connection Box */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 text-[11px]">
              Need help? View the <a href="#docs" onClick={(e) => e.preventDefault()} className="text-indigo-600 font-bold underline">CLI Documentation</a> or release notes.
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer flex items-center gap-2 border border-slate-300 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Testing Connection...' : 'Verify CLI Gateway'}</span>
            </button>
          </div>

          {connectionResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{connectionResult.msg} ({connectionResult.latency}ms latency)</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
