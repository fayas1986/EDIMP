import React, { useState } from 'react';
import { CDMEntity, CDMAttribute, CDMEntityName } from '../types/dualMapping';
import { INITIAL_CDM_ENTITIES } from '../data/dualMappingData';
import {
  Layers,
  Database,
  Plus,
  Trash2,
  FileCode,
  Download,
  Search,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Building2,
  FileSpreadsheet,
  Settings2,
  Edit2,
  X,
  Code2,
  Sparkles,
} from 'lucide-react';

export const CanonicalDataModelRepository: React.FC = () => {
  const [cdmEntities, setCdmEntities] = useState<CDMEntity[]>(INITIAL_CDM_ENTITIES);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('cdm-cust');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingExtension, setIsAddingExtension] = useState<boolean>(false);

  // New Extension Attribute Form State
  const [newExtName, setNewExtName] = useState<string>('');
  const [newExtDisplayName, setNewExtDisplayName] = useState<string>('');
  const [newExtDataType, setNewExtDataType] = useState<CDMAttribute['dataType']>('String');
  const [newExtRequired, setNewExtRequired] = useState<boolean>(false);
  const [newExtDesc, setNewExtDesc] = useState<string>('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedEntity = cdmEntities.find((e) => e.id === selectedEntityId) || cdmEntities[0];

  const handleAddExtensionAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtName) return;

    const newAttr: CDMAttribute = {
      id: `cx-${Date.now()}`,
      attributeName: newExtName.replace(/\s+/g, '_'),
      displayName: newExtDisplayName || newExtName,
      dataType: newExtDataType,
      isRequired: newExtRequired,
      isExtension: true,
      description: newExtDesc || 'Customer-specific CDM extension attribute.',
    };

    setCdmEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === selectedEntity.id) {
          return {
            ...ent,
            customAttributes: [...ent.customAttributes, newAttr],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return ent;
      })
    );

    setNewExtName('');
    setNewExtDisplayName('');
    setNewExtDesc('');
    setIsAddingExtension(false);
    setToastMsg(`Added schema extension "${newAttr.attributeName}" to ${selectedEntity.entityName}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRemoveCustomAttribute = (attrId: string) => {
    setCdmEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === selectedEntity.id) {
          return {
            ...ent,
            customAttributes: ent.customAttributes.filter((a) => a.id !== attrId),
          };
        }
        return ent;
      })
    );
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedEntity, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CDM_${selectedEntity.entityName}_Schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredEntities = cdmEntities.filter(
    (e) =>
      e.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Canonical Repository Engine
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Canonical Data Model (CDM) Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Standardized business entities acting as an intermediate layer between heterogeneous source ERPs, flat files, and target systems. Features configurable custom schema extensions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CDM Schema (JSON)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Entity Selector & Attribute Schema Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Entity Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search 15 CDM Entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Standard Business Entities ({filteredEntities.length})
          </div>

          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredEntities.map((ent) => {
              const isActive = ent.id === selectedEntityId;
              const totalAttrs = ent.standardAttributes.length + ent.customAttributes.length;
              return (
                <button
                  key={ent.id}
                  onClick={() => setSelectedEntityId(ent.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-purple-50/80 border-purple-300 font-bold text-purple-950 shadow-2xs'
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="block font-bold truncate">{ent.entityName}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{ent.category}</span>
                  </div>

                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-mono">
                    {totalAttrs} fields
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Attribute Schema Details Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5 lg:col-span-3">
          {/* Entity Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{selectedEntity.displayName}</h3>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200">
                  {selectedEntity.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedEntity.description}</p>
            </div>

            <button
              onClick={() => setIsAddingExtension(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Schema Extension</span>
            </button>
          </div>

          {/* Add Extension Attribute Drawer Modal */}
          {isAddingExtension && (
            <form onSubmit={handleAddExtensionAttribute} className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Define Customer-Specific Extension Attribute for {selectedEntity.entityName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingExtension(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Attribute Name (API Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tax_Registration_ID"
                    value={newExtName}
                    onChange={(e) => setNewExtName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Display Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Tax Registration ID"
                    value={newExtDisplayName}
                    onChange={(e) => setNewExtDisplayName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data Type</label>
                  <select
                    value={newExtDataType}
                    onChange={(e) => setNewExtDataType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  >
                    <option value="String">String (Varchar)</option>
                    <option value="Decimal">Decimal (Numeric)</option>
                    <option value="Integer">Integer</option>
                    <option value="Date">Date</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Enum">Enum List</option>
                    <option value="Lookup">Lookup Table</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={newExtRequired}
                    onChange={(e) => setNewExtRequired(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                  <span>Mandatory / Required Attribute</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingExtension(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Extension
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Standard Attributes Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                Standard Business Attributes ({selectedEntity.standardAttributes.length})
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[11px]">
                    <th className="py-2.5 px-3">Attribute Name</th>
                    <th className="py-2.5 px-3">Display Label</th>
                    <th className="py-2.5 px-3">Data Type</th>
                    <th className="py-2.5 px-3">Required</th>
                    <th className="py-2.5 px-3">Key / Lookup</th>
                    <th className="py-2.5 px-3">Default Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedEntity.standardAttributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{attr.attributeName}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">{attr.displayName}</td>
                      <td className="py-2.5 px-3 text-purple-700">{attr.dataType}</td>
                      <td className="py-2.5 px-3">
                        {attr.isRequired ? (
                          <span className="text-rose-600 font-bold">YES</span>
                        ) : (
                          <span className="text-slate-400">NO</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {attr.isPrimaryKey && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-sans font-bold">PK</span>}
                        {attr.isForeignKey && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-sans font-bold ml-1">FK</span>}
                        {attr.lookupEntity && <span className="text-slate-500 text-[10px] block font-sans">Lookup: {attr.lookupEntity}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{attr.defaultValue || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configurable Extension Attributes Table */}
          {selectedEntity.customAttributes.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Customer Schema Extensions ({selectedEntity.customAttributes.length})
              </span>

              <div className="overflow-x-auto border border-purple-200 rounded-xl bg-purple-50/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-purple-100/50 border-b border-purple-200 font-bold text-purple-900 uppercase text-[11px]">
                      <th className="py-2.5 px-3">Extension Field</th>
                      <th className="py-2.5 px-3">Display Label</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Required</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 font-mono">
                    {selectedEntity.customAttributes.map((attr) => (
                      <tr key={attr.id} className="hover:bg-purple-50">
                        <td className="py-2.5 px-3 font-bold text-purple-950">{attr.attributeName}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-800">{attr.displayName}</td>
                        <td className="py-2.5 px-3 text-purple-800">{attr.dataType}</td>
                        <td className="py-2.5 px-3">{attr.isRequired ? 'YES' : 'NO'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleRemoveCustomAttribute(attr.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove Extension"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-purple-500 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="text-xs font-mono">{toastMsg}</div>
        </div>
      )}
    </div>
  );
};
