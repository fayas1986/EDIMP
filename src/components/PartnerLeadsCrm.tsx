import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus,
  Briefcase, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  BarChart3,
  MoreHorizontal,
  ChevronRight,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface PartnerLead {
  id: string;
  name: string;
  partnerName: string;
  contactName: string;
  contactEmail: string;
  stage: 'Discovery' | 'Architecture Review' | 'Proof of Concept' | 'Proposal' | 'Closed Won';
  estimatedValue: number;
  expectedCloseDate: string;
  accountManager: string;
  targetEcosystem: string;
}

const MOCK_LEADS: PartnerLead[] = [
  {
    id: 'LEAD-001',
    name: 'Global Finance Ledger Consolidation',
    partnerName: 'Avanade',
    contactName: 'Sarah Jenkins',
    contactEmail: 'sarah.j@avanade.example.com',
    stage: 'Proof of Concept',
    estimatedValue: 125000,
    expectedCloseDate: '2026-10-15',
    accountManager: 'Alex Mercer',
    targetEcosystem: 'Dynamics 365 F&O'
  },
  {
    id: 'LEAD-002',
    name: 'European Logistics SAP Migration',
    partnerName: 'Capgemini',
    contactName: 'Marcus Thorne',
    contactEmail: 'm.thorne@capgemini.example.com',
    stage: 'Discovery',
    estimatedValue: 350000,
    expectedCloseDate: '2026-12-01',
    accountManager: 'Unassigned',
    targetEcosystem: 'SAP S/4HANA'
  },
  {
    id: 'LEAD-003',
    name: 'Healthcare Patient Records Sync',
    partnerName: 'Avanade',
    contactName: 'Dr. Emily Chen',
    contactEmail: 'echen@healthcare.example.com',
    stage: 'Proposal',
    estimatedValue: 85000,
    expectedCloseDate: '2026-09-20',
    accountManager: 'David Rossi',
    targetEcosystem: 'Salesforce Health Cloud'
  },
  {
    id: 'LEAD-004',
    name: 'Retail POS Data Lake Integration',
    partnerName: 'Cognizant',
    contactName: 'James Wilson',
    contactEmail: 'j.wilson@cognizant.example.com',
    stage: 'Architecture Review',
    estimatedValue: 175000,
    expectedCloseDate: '2026-11-10',
    accountManager: 'Alex Mercer',
    targetEcosystem: 'Snowflake'
  },
  {
    id: 'LEAD-005',
    name: 'Manufacturing Supply Chain Overhaul',
    partnerName: 'Avanade',
    contactName: 'Robert King',
    contactEmail: 'r.king@avanade.example.com',
    stage: 'Closed Won',
    estimatedValue: 420000,
    expectedCloseDate: '2026-08-01',
    accountManager: 'Elena Rostova',
    targetEcosystem: 'Oracle Cloud ERP'
  }
];

const STAGES = ['Discovery', 'Architecture Review', 'Proof of Concept', 'Proposal', 'Closed Won'] as const;

export const PartnerLeadsCrm: React.FC = () => {
  const [leads, setLeads] = useState<PartnerLead[]>(MOCK_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('All');
  const [filterManager, setFilterManager] = useState<string>('All');
  const [filterRevenue, setFilterRevenue] = useState<string>('All');
  
  const uniqueManagers = Array.from(new Set(leads.map(l => l.accountManager))).sort();

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.accountManager.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStage = filterStage === 'All' || lead.stage === filterStage;
    const matchesManager = filterManager === 'All' || lead.accountManager === filterManager;
    
    let matchesRevenue = true;
    if (filterRevenue === '<100k') matchesRevenue = lead.estimatedValue < 100000;
    else if (filterRevenue === '100k-250k') matchesRevenue = lead.estimatedValue >= 100000 && lead.estimatedValue <= 250000;
    else if (filterRevenue === '>250k') matchesRevenue = lead.estimatedValue > 250000;

    return matchesSearch && matchesStage && matchesManager && matchesRevenue;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const handleStageChange = (leadId: string, newStage: PartnerLead['stage']) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, stage: newStage } : lead));
  };

  const handleAssignManager = (leadId: string, manager: string) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, accountManager: manager } : lead));
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Partner Opportunity CRM</h2>
          <p className="text-sm text-slate-500 mt-1">Manage shared pipeline, track deal velocity, and assign account leads.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search opportunities..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filter By:
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
          >
            <option value="All">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select 
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
            value={filterManager}
            onChange={e => setFilterManager(e.target.value)}
          >
            <option value="All">All Managers</option>
            {uniqueManagers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
            value={filterRevenue}
            onChange={e => setFilterRevenue(e.target.value)}
          >
            <option value="All">Any Revenue</option>
            <option value="<100k">&lt; $100k</option>
            <option value="100k-250k">$100k - $250k</option>
            <option value=">250k">&gt; $250k</option>
          </select>
        </div>

        {(filterStage !== 'All' || filterManager !== 'All' || filterRevenue !== 'All') && (
          <button 
            onClick={() => {
              setFilterStage('All');
              setFilterManager('All');
              setFilterRevenue('All');
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 ml-auto flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(l => l.stage === stage);
          const stageTotal = stageLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
          
          return (
            <div key={stage} className="min-w-[320px] max-w-[320px] bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col snap-start shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">{stage}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">{stageLeads.length}</span>
                </div>
                <span className="text-xs font-bold text-indigo-600">{formatCurrency(stageTotal)}</span>
              </div>
              
              <div className="flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent flex-1">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider">
                        {lead.partnerName}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-3 line-clamp-2" title={lead.name}>
                      {lead.name}
                    </h4>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold text-slate-700">{formatCurrency(lead.estimatedValue)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Close: <strong className="text-slate-700">{lead.expectedCloseDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="truncate" title={lead.targetEcosystem}>{lead.targetEcosystem}</span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${lead.accountManager === 'Unassigned' ? 'bg-amber-400' : 'bg-indigo-600'}`}>
                          {lead.accountManager === 'Unassigned' ? '?' : lead.accountManager.charAt(0)}
                        </div>
                        <select 
                          className={`text-[10px] font-bold bg-transparent focus:outline-none cursor-pointer truncate w-24 ${lead.accountManager === 'Unassigned' ? 'text-amber-600' : 'text-slate-700'}`}
                          value={lead.accountManager}
                          onChange={(e) => handleAssignManager(lead.id, e.target.value)}
                        >
                          <option value="Unassigned">Assign...</option>
                          <option value="Alex Mercer">Alex Mercer</option>
                          <option value="David Rossi">David Rossi</option>
                          <option value="Elena Rostova">Elena Rostova</option>
                        </select>
                      </div>
                      
                      <select
                        className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:outline-none cursor-pointer hover:bg-slate-100 max-w-[80px]"
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as PartnerLead['stage'])}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                
                {stageLeads.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400">No opportunities</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
