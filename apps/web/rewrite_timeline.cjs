const fs = require('fs');

let content = fs.readFileSync('src/components/MigrationAuditTrailView.tsx', 'utf-8');

// 1. Add state for expanded logs
if (!content.includes('expandedLogIds')) {
  content = content.replace(
    'const [copiedHashId, setCopiedHashId] = useState<string | null>(null);',
    'const [copiedHashId, setCopiedHashId] = useState<string | null>(null);\n  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());\n\n  const toggleLogExpand = (id: string, e?: React.MouseEvent) => {\n    if (e) e.stopPropagation();\n    setExpandedLogIds(prev => {\n      const next = new Set(prev);\n      if (next.has(id)) next.delete(id);\n      else next.add(id);\n      return next;\n    });\n  };'
  );
}

// 2. We'll find the entire AUDIT LOG TABLE div and replace it with the timeline structure
const startTag = '{/* AUDIT LOG TABLE */}';
const startIndex = content.indexOf(startTag);

if (startIndex === -1) {
  console.log("Could not find start tag");
  process.exit(1);
}

// Find the end of the table div. It ends before the Modal.
const endTag = '{/* DETAILED AUDIT INSPECTION MODAL */}';
const endIndex = content.indexOf(endTag);

if (endIndex === -1) {
  console.log("Could not find end tag");
  process.exit(1);
}

const replacement = `{/* AUDIT TIMELINE VIEW */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 sm:p-6 mt-4">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 px-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Data Validation & Integrity Timeline
        </h3>
        
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Shield className="w-8 h-8 text-slate-300" />
            <span className="font-bold">No migration audit records match your filters.</span>
            <button
              onClick={() => {
                setSelectedCustomerFilter('ALL');
                setStatusFilter('ALL');
                setOperationTypeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 sm:ml-6 space-y-8 pb-4">
            {filteredLogs.map((log, index) => {
              const isExpanded = expandedLogIds.has(log.id);
              const isVerified = verifiedHashes[log.id];

              return (
                <div key={log.id} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Dot */}
                  <div className={\`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 shadow-sm transition-colors \${isExpanded ? 'bg-indigo-600 border-indigo-200 shadow-indigo-500/30' : 'bg-white border-indigo-300 group-hover:border-indigo-500'}\`} />
                  
                  {/* Timeline Card */}
                  <div className={\`bg-white rounded-2xl border transition-all \${isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-md'}\`}>
                    
                    {/* Compact Header (Always Visible) */}
                    <div 
                      className="p-4 sm:p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      onClick={() => toggleLogExpand(log.id)}
                    >
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                            {log.operationType}
                          </span>
                          {renderStatusBadge(log.outcomeStatus)}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {log.customerName} <span className="text-slate-400 font-mono text-[10px]">({log.customerCode})</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex flex-col items-end mr-4">
                          <span className="text-[11px] font-bold text-slate-700">{log.recordsProcessed.toLocaleString()} records</span>
                          <span className="text-[9px] text-slate-400 font-mono">{(log.dataSizeMb / 1024).toFixed(2)} GB • {log.executionTimeSec}s</span>
                        </div>
                        
                        {/* Quick Action: Verify Hash */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleVerifyLedgerHash(log)}
                            className={\`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border \${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                            }\`}
                          >
                            <ShieldCheck className={\`w-3.5 h-3.5 \${isVerified ? 'text-emerald-600' : 'text-slate-400'}\`} />
                            <span>{isVerified ? 'VERIFIED' : 'Verify'}</span>
                          </button>
                        </div>
                        
                        <button className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                          <ChevronRight className={\`w-5 h-5 transition-transform duration-200 \${isExpanded ? 'rotate-90' : ''}\`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          
                          {/* Col 1: System Info */}
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Systems & Routing</h5>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Source System</span>
                                <strong className="text-xs text-slate-800">{log.sourceSystem}</strong>
                              </div>
                              <div className="border-t border-slate-100 pt-2">
                                <span className="text-[10px] text-indigo-500 font-bold block">Target Environment</span>
                                <strong className="text-xs text-indigo-900">{log.targetSystem}</strong>
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{log.tenantId}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Operator & Auth */}
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Operator Identity</h5>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div>
                                  <strong className="text-xs text-slate-800 block">{log.operatorName}</strong>
                                  <span className="text-[9px] text-indigo-500 font-mono">{log.operatorRole}</span>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-slate-400 block">Operator ID</span>
                                  <span className="font-mono text-slate-700">{log.operatorId}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Source IP</span>
                                  <span className="font-mono text-slate-700">{log.operatorIp}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Ledger & Cryptography */}
                          <div className="space-y-3 md:col-span-2 lg:col-span-1">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Cryptographic Ledger</h5>
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-inner">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-mono">SHA-256 Checksum</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleCopyHash(log); }}
                                  className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {copiedHashId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedHashId === log.id ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <div className="p-2 bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-400 break-all border border-slate-800/50">
                                {log.verificationHash}
                              </div>
                              
                              {log.complianceBadges.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                                  {log.complianceBadges.map((badge, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Error & Notes section */}
                        {(log.errorDetails || log.auditNotes) && (
                          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.errorDetails && (
                              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/60">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Exception Trace
                                </span>
                                <p className="text-xs text-rose-900 font-mono leading-relaxed">{log.errorDetails}</p>
                              </div>
                            )}
                            
                            {log.auditNotes && (
                              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                                  <FileCode className="w-3.5 h-3.5" /> Execution Notes
                                </span>
                                <p className="text-xs text-slate-700 leading-relaxed">{log.auditNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* DETAILED AUDIT INSPECTION MODAL - Removing since we moved it inline, but leaving anchor */}
      {/* DETAILED AUDIT INSPECTION MODAL */}`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex + '{/* DETAILED AUDIT INSPECTION MODAL */}'.length);

fs.writeFileSync('src/components/MigrationAuditTrailView.tsx', content);
console.log("Successfully replaced table with timeline.");
