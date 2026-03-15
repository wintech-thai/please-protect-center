"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Trash2,
  Key,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar"; 

// --- Mock Data สำหรับ API Keys ---
const MOCK_API_KEYS = [
  { id: "k1", keyName: "Sentinel-Integrator-01", description: "Production key for main firewall integration.", customRole: "Security Analyst", roles: "Editor", status: "Active" },
  { id: "k2", keyName: "Audit-Log-Exporter", description: "Used by internal auditing script for weekly reports.", customRole: "Auditor", roles: "Viewer", status: "Active" },
  { id: "k3", keyName: "CI-CD-Deployment", description: "Deployment key for automated sensor updates.", customRole: "System Admin", roles: "Super Admin", status: "Disabled" },
  { id: "k4", keyName: "Mobile-Dashboard-App", description: "Access key for commander's mobile view.", customRole: "Viewer", roles: "Viewer", status: "Active" },
  { id: "k5", keyName: "External-Scanner-API", description: "Third-party scanner integration key.", customRole: "Operator", roles: "Editor", status: "Pending" },
];

export default function ApiKeysPage() {
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  // States
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [totalCount, setTotalCount] = useState(MOCK_API_KEYS.length);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightIdParam);
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [targetKey, setTargetKey] = useState<typeof MOCK_API_KEYS[0] | null>(null);

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    if (highlightIdParam) {
      setSelectedRowId(highlightIdParam);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  }, [highlightIdParam, pathname, searchParams]);

  const handleSearchTrigger = () => {
    setPage(1);
    const filtered = MOCK_API_KEYS.filter(k => 
      k.keyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      k.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setKeys(filtered);
    setTotalCount(filtered.length);
  };

  const handleBulkDelete = () => {
    setKeys(keys.filter(k => !selectedIds.includes(k.id)));
    setSelectedIds([]);
    setShowDeleteConfirm(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(keys.map(k => k.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      
      <Navbar />

      <main className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex-none pt-6 px-6 mb-2">
          <div className="flex items-center gap-4">
              <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">API Keys Management</h1>
                  <p className="text-slate-400 text-xs md:text-sm">Manage authentication keys and access tokens for system integrations.</p>
              </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex-none py-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0B1120] p-4 border-y border-blue-900/30 shadow-lg">
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                  <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                      <select className="w-full appearance-none bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer">
                          <option>All Fields</option>
                          <option>Key Name</option>
                          <option>Description</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <div className="relative w-full sm:w-auto sm:flex-1 lg:min-w-[240px]">
                      <input 
                        type="text" 
                        placeholder="Search API keys..." 
                        value={searchTerm}                         
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                        className="w-full bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-cyan-500 placeholder:text-slate-500 transition-colors" 
                      />
                  </div>
                  <button 
                    onClick={handleSearchTrigger} 
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Search className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto justify-end">
                  <Link 
                    href={selectedRowId ? `/admin/api-keys/create?prevHighlight=${selectedRowId}` : "/admin/api-keys/create"} 
                    className="flex-1 lg:flex-none"
                  >
                      <button className="w-full justify-center px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg uppercase transition-all shadow-lg shadow-blue-900/20">Add</button>
                  </Link>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={selectedIds.length === 0}
                    className="flex-1 lg:flex-none justify-center px-8 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                      Delete
                  </button>
              </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[#0B1120] border-t border-blue-900/30 overflow-hidden flex flex-col shadow-2xl">
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                      <thead className="bg-[#020617] sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-blue-900/50">
                          <tr>
                              <th className="p-4 w-[50px] text-center"><input type="checkbox" onChange={handleSelectAll} checked={keys.length > 0 && selectedIds.length === keys.length} className="rounded border-slate-700 bg-slate-800" /></th>
                              <th className="p-4 px-6">Key Name</th>
                              <th className="p-4 px-6">Description</th>
                              <th className="p-4 px-6">Custom Role</th>
                              <th className="p-4 px-6">Roles</th>
                              <th className="p-4 px-6">Status</th>
                              <th className="p-4 px-6 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {keys.map((apiKey) => {
                              const isSelected = selectedRowId === apiKey.id;
                              return (
                                  <tr 
                                      key={apiKey.id} 
                                      ref={(el) => { if (el) rowRefs.current[apiKey.id] = el; }}
                                      onClick={() => setSelectedRowId(apiKey.id)}
                                      className={`transition-all duration-300 group text-sm cursor-pointer hover:bg-blue-900/10
                                        ${isSelected ? "bg-blue-900/20 border-l-4 border-l-cyan-400" : "border-l-4 border-l-transparent"}
                                      `}
                                  >
                                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedIds.includes(apiKey.id)} onChange={() => handleSelectOne(apiKey.id)} className="rounded border-slate-600 bg-slate-800" />
                                      </td>
                                      
                                      <td className="p-4 px-6 font-medium text-slate-200">
                                        <div className="flex items-center gap-2">
                                          <Key className="w-3.5 h-3.5 text-blue-400" />
                                          <Link href={`/admin/api-keys/${apiKey.id}/update`} className={`hover:underline ${isSelected ? 'text-cyan-400' : 'text-blue-400 hover:text-cyan-300'}`} onClick={(e) => e.stopPropagation()}>
                                            {apiKey.keyName}
                                          </Link>
                                        </div>
                                      </td>

                                      <td className="p-4 px-6 text-slate-400 text-sm max-w-[300px] truncate">{apiKey.description}</td>
                                      
                                      <td className="p-4 px-6 text-slate-400 font-medium italic">{apiKey.customRole}</td>
                                      
                                      <td className="p-4 px-6">
                                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded uppercase">{apiKey.roles}</span>
                                      </td>

                                      <td className="p-4 px-6 font-medium">
                                          <div className="flex items-center gap-2">
                                              <div className={`w-2 h-2 rounded-full ${apiKey.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : apiKey.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-600'}`} />
                                              <span className={apiKey.status === 'Disabled' ? 'text-slate-500' : apiKey.status === 'Pending' ? 'text-amber-400' : 'text-emerald-400'}>
                                                {apiKey.status}
                                              </span>
                                          </div>
                                      </td>
                                      
                                      <td className="p-4 px-6 text-center relative" onClick={(e) => e.stopPropagation()}>
                                          <button onClick={() => setTargetKey(targetKey?.id === apiKey.id ? null : apiKey)} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                              <MoreHorizontal className="w-4 h-4" />
                                          </button>

                                          {targetKey?.id === apiKey.id && (
                                              <div className="absolute right-8 top-10 bg-[#0B1120] border border-blue-900/50 shadow-xl rounded-lg w-40 z-50 p-1 flex flex-col text-left">
                                                 <button onClick={() => alert("Key Copied!")} className="px-3 py-2 text-xs text-cyan-400 hover:bg-blue-900/30 rounded flex items-center gap-2 transition-all"><Key className="w-3.5 h-3.5" /> Copy Key String</button>
                                                 <div className="h-px bg-blue-900/30 my-1 mx-1"></div>
                                                 <button onClick={() => { setTargetKey(null); setShowDeleteConfirm(true); setSelectedIds([apiKey.id]); }} className="px-3 py-2 text-xs text-red-400 hover:bg-red-900/30 rounded flex items-center gap-2 transition-all"><Trash2 className="w-3.5 h-3.5" /> Revoke Key</button>
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
              
              <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>Rows per page</span>
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none">
                          <option value={25} className="bg-[#0B1120]">25</option>
                          <option value={50} className="bg-[#0B1120]">50</option>
                          <option value={100} className="bg-[#0B1120]">100</option>
                          <option value={200} className="bg-[#0B1120]">200</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="text-xs">{totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} of {totalCount}</div>
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-blue-900/40 text-slate-400 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setPage(p => Math.min(Math.ceil(totalCount/itemsPerPage), p + 1))} disabled={page >= Math.ceil(totalCount/itemsPerPage) || totalCount === 0} className="p-1.5 rounded hover:bg-blue-900/40 text-slate-400 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>

      {/* Delete/Revoke Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-500"><Trash2 className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold text-white mb-2 uppercase">Revoke API Key</h3>
                <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed px-2">Are you sure you want to revoke {selectedIds.length} key(s)? Integrations using this key will immediately fail.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">Cancel</button>
                    <button onClick={handleBulkDelete} className="flex-1 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-900/20 font-bold uppercase">Revoke Now</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}