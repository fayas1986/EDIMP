import React, { useState } from 'react';
import { ImportProfile } from '../types/dualMapping';
import { INITIAL_IMPORT_PROFILES } from '../data/dualMappingData';
import {
  FileSpreadsheet,
  Settings,
  Sliders,
  CheckCircle2,
  Plus,
  Play,
  Database,
  FileCode,
  Calendar,
  Hash,
  Layers,
  Search,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

export const ImportProfilesConfigurator: React.FC = () => {
  const [profiles, setProfiles] = useState<ImportProfile[]>(INITIAL_IMPORT_PROFILES);
  const [editingProfile, setEditingProfile] = useState<ImportProfile | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveProfile = (prof: ImportProfile) => {
    setProfiles((prev) =>
      prev.some((p) => p.id === prof.id)
        ? prev.map((p) => (p.id === prof.id ? prof : p))
        : [prof, ...prev]
    );
    setEditingProfile(null);
    setIsCreating(false);
    setToastMsg(`Saved import profile "${prof.profileName}"`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRunProfile = (profileName: string) => {
    setToastMsg(`Initiated test batch execution for profile "${profileName}"`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Reusable Data Import Configurations
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Import Profiles Configurator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Configure reusable source import parameters including sheet names, header rows, file encodings, delimiters, date/number formats, and destination connectors.
          </p>
        </div>

        <button
          onClick={() => {
            const newProf: ImportProfile = {
              id: `prof-${Date.now()}`,
              profileName: 'New Import Profile',
              sourceType: 'Excel',
              sourceLocation: 's3://imports/new_data.xlsx',
              sourceEntity: 'Sheet1',
              sheetName: 'Sheet1',
              headerRow: 1,
              fileEncoding: 'UTF-8',
              delimiter: 'Comma',
              dateFormat: 'YYYY-MM-DD',
              numberFormat: '1,234.56',
              mappingTemplateId: 'tpl-excel-cdm-cust',
              validationRulesetId: 'ruleset-v1',
              destinationConnectorId: 'conn-bc-prod',
              batchSize: 1000,
            };
            setEditingProfile(newProf);
            setIsCreating(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Import Profile</span>
        </button>
      </div>

      {/* Profiles Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((prof) => (
          <div key={prof.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                  {prof.sourceType} Import Profile
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{prof.profileName}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingProfile(prof)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Configure
                </button>
                <button
                  onClick={() => handleRunProfile(prof.profileName)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Test</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-700">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-sans block">File Encoding / Delimiter</span>
                <p className="font-bold">{prof.fileEncoding} / {prof.delimiter}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-sans block">Sheet Name / Header Row</span>
                <p className="font-bold">{prof.sheetName || 'N/A'} (Row {prof.headerRow})</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-sans block">Date &amp; Number Format</span>
                <p className="font-bold">{prof.dateFormat} | {prof.numberFormat}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-sans block">Batch Upload Size</span>
                <p className="font-bold text-indigo-600">{prof.batchSize} records/batch</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile Drawer Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Configure Import Profile Parameters
              </h3>
              <button onClick={() => setEditingProfile(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Profile Display Name</label>
                <input
                  type="text"
                  value={editingProfile.profileName}
                  onChange={(e) => setEditingProfile({ ...editingProfile, profileName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Source Data Type</label>
                <select
                  value={editingProfile.sourceType}
                  onChange={(e) => setEditingProfile({ ...editingProfile, sourceType: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value="Excel">Excel (.xlsx / .xls)</option>
                  <option value="CSV">CSV / Delimited Text</option>
                  <option value="JSON">JSON File Payload</option>
                  <option value="XML">XML Payload</option>
                  <option value="Database Table">Database Table</option>
                  <option value="REST API">REST API Endpoint</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sheet Name (for Excel)</label>
                <input
                  type="text"
                  value={editingProfile.sheetName || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, sheetName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Header Row Index</label>
                <input
                  type="number"
                  min={1}
                  value={editingProfile.headerRow}
                  onChange={(e) => setEditingProfile({ ...editingProfile, headerRow: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">File Encoding</label>
                <select
                  value={editingProfile.fileEncoding}
                  onChange={(e) => setEditingProfile({ ...editingProfile, fileEncoding: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value="UTF-8">UTF-8</option>
                  <option value="ASCII">ASCII</option>
                  <option value="UTF-16">UTF-16</option>
                  <option value="ISO-8859-1">ISO-8859-1</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Batch Upload Size</label>
                <select
                  value={editingProfile.batchSize}
                  onChange={(e) => setEditingProfile({ ...editingProfile, batchSize: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value={100}>100 records / batch</option>
                  <option value={500}>500 records / batch</option>
                  <option value={1000}>1,000 records / batch</option>
                  <option value={5000}>5,000 records / batch</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingProfile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveProfile(editingProfile)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Save Import Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-emerald-500 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-mono">{toastMsg}</div>
        </div>
      )}
    </div>
  );
};
