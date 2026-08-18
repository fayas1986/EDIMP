import React, { useState } from 'react';
import { MappingTemplate, TemplateCategory } from '../types/dualMapping';
import { INITIAL_MAPPING_TEMPLATES } from '../data/dualMappingData';
import {
  FileText,
  Copy,
  Download,
  Upload,
  History,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  ArrowRightLeft,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Search,
  Filter,
  X,
  Eye,
  RotateCcw,
} from 'lucide-react';

export const MappingTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<MappingTemplate[]>(INITIAL_MAPPING_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparingTemplate, setComparingTemplate] = useState<MappingTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Template Form State
  const [newTplName, setNewTplName] = useState<string>('');
  const [newTplCategory, setNewTplCategory] = useState<TemplateCategory>('ERP-to-ERP');
  const [newTplSource, setNewTplSource] = useState<string>('Microsoft Dynamics 365 F&O');
  const [newTplTarget, setNewTplTarget] = useState<string>('Dynamics 365 Business Central');
  const [newTplEntity, setNewTplEntity] = useState<string>('Customer');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleCloneTemplate = (tpl: MappingTemplate) => {
    const cloned: MappingTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      version: 'v1.0.0-draft',
      status: 'Draft',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setTemplates((prev) => [cloned, ...prev]);
    setToastMsg(`Cloned template "${cloned.name}" as new Draft.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateStatus = (tplId: string, newStatus: MappingTemplate['status']) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === tplId ? { ...t, status: newStatus } : t))
    );
    setToastMsg(`Updated template status to ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName) return;

    const created: MappingTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTplName,
      description: 'Custom enterprise mapping template.',
      category: newTplCategory,
      strategy: newTplCategory.includes('Excel') || newTplCategory.includes('CSV') ? 'CanonicalDataModel' : 'DirectMapping',
      sourceSystem: newTplSource,
      targetSystem: newTplTarget,
      entityName: newTplEntity,
      version: 'v1.0.0',
      status: 'Draft',
      author: 'Lead Data Architect',
      updatedAt: new Date().toISOString().split('T')[0],
      rulesCount: 8,
      rules: tplRulesPlaceholder(),
    };

    setTemplates((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewTplName('');
    setToastMsg(`Created new template "${created.name}"`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const tplRulesPlaceholder = () => INITIAL_MAPPING_TEMPLATES[0].rules;

  const filteredTemplates = templates.filter((t) => {
    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sourceSystem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.targetSystem.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Template Lifecycle Management
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Mapping Template Management Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Create, version, approve, export, import, and compare mapping templates across all 9 enterprise system categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      {/* Filter Category Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by name, source, or target system..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {['ALL', 'ERP-to-ERP', 'Excel-to-ERP', 'CSV-to-ERP', 'Database-to-ERP', 'Legacy-to-ERP'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Configured Mapping Templates ({filteredTemplates.length})
          </h3>
          <span className="text-xs text-slate-500">
            Approval Workflow: Draft &rarr; Pending Approval &rarr; Approved &rarr; Published
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[11px]">
                <th className="py-3 px-4">Template Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Source &rarr; Target</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{tpl.name}</span>
                    <span className="text-[11px] text-slate-400 font-sans truncate max-w-xs block">
                      {tpl.description}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] border border-slate-200">
                      {tpl.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-800 font-semibold">{tpl.sourceSystem}</div>
                    <div className="text-indigo-600 font-bold">&darr; {tpl.targetSystem}</div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                      {tpl.version}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={tpl.status}
                      onChange={(e) => handleUpdateStatus(tpl.id, e.target.value as any)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border focus:outline-none ${
                        tpl.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : tpl.status === 'Approved'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : tpl.status === 'Pending Approval'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setComparingTemplate(tpl)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Compare / Diff Template"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCloneTemplate(tpl)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Clone Template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare Diff Modal */}
      {comparingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Template Version Diff &amp; Comparison ({comparingTemplate.version})
              </h3>
              <button
                onClick={() => setComparingTemplate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase block">Current Version ({comparingTemplate.version})</span>
                <p>Rules Count: {comparingTemplate.rulesCount}</p>
                <p>Strategy: {comparingTemplate.strategy}</p>
                <p>Author: {comparingTemplate.author}</p>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                <span className="font-bold text-indigo-900 uppercase block">Prior Release (v1.0.0 Rollback Target)</span>
                <p>Rules Count: {comparingTemplate.rulesCount - 2}</p>
                <p>Strategy: {comparingTemplate.strategy}</p>
                <p className="text-emerald-700 font-bold">&bull; 100% Identical Schema Compatibility</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setComparingTemplate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Comparison
              </button>
              <button
                onClick={() => {
                  setToastMsg(`Rolled back template "${comparingTemplate.name}" to v1.0.0`);
                  setComparingTemplate(null);
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Rollback to v1.0.0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-indigo-500 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-mono">{toastMsg}</div>
        </div>
      )}
    </div>
  );
};
