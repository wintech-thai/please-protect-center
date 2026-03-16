"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  X,
  MoreHorizontal,
  Trash2,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar"; 
import { toast } from "sonner";
import { roleApi } from "@/src/modules/auth/api/role.api"; 

export default function CustomRolesPage() {
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  // States
  const [roles, setRoles] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightIdParam);
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    if (highlightIdParam) {
      setSelectedRowId(highlightIdParam);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  }, [highlightIdParam, pathname, searchParams]);

  const fetchRolesData = async (currentPage: number, searchKeyword: string = "") => {
    setIsLoading(true);
    try {
      const orgId = localStorage.getItem("orgId") || "temp";
      const currentOffset = (currentPage - 1) * itemsPerPage;
      const payload = { offset: currentOffset, limit: itemsPerPage, fullTextSearch: searchKeyword };

      const [res, countRes] = await Promise.all([
        roleApi.getCustomRoles(orgId, payload),
        roleApi.getCustomRoleCount(orgId, { fullTextSearch: searchKeyword })
      ]);
      
      const rolesData = res?.data ? res.data : (Array.isArray(res) ? res : []);
      setRoles(rolesData);
      
      let count = 0;
      if (typeof countRes === "number") count = countRes;
      else if (countRes && typeof countRes === "object") {
        count = countRes.count || countRes.totalCount || countRes.data || rolesData.length; 
      }
      setTotalCount(count); 
    } catch (error: any) {
      console.error("Fetch Roles Error:", error);
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData(page, searchTerm);
  }, [page, itemsPerPage]);

  const handleSearchTrigger = () => {
    setPage(1);
    fetchRolesData(1, searchTerm); 
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const orgId = localStorage.getItem("orgId") || "temp";
    
    try {
      for (const id of selectedIds) { 
        await roleApi.deleteCustomRoleById(orgId, id); 
      }
      
      toast.success("Successfully deleted role(s).");
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      
      fetchRolesData(page, searchTerm);
    } catch (error: any) {
      console.error("Delete custom role error:", error);
      const errorMsg = error?.response?.data?.description || error?.message || "Failed to delete role(s)";
      toast.error(errorMsg);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(roles.map(r => r.id || r.customRoleId || r.roleId));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const parseTags = (tags: string | null | undefined) => {
    if (!tags) return [];
    return tags.split(',').filter(t => t.trim() !== '');
  };

  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      
      <Navbar />

      <main className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex-none pt-6 px-4 md:px-6 mb-2">
          <div className="flex items-center gap-4">
              <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Custom Roles</h1>
                  <p className="text-slate-400 text-xs md:text-sm">Manage roles and access permissions for the center.</p>
              </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex-none py-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0B1120] p-4 border-y border-blue-900/30 shadow-lg">
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                  <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                      <select className="w-full appearance-none bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors">
                          <option>All Fields</option>
                          <option>Role Name</option>
                          <option>Tags</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <div className="relative w-full sm:w-auto sm:flex-1 lg:min-w-[240px]">
                      <input 
                        type="text" 
                        placeholder="Search roles..." 
                        value={searchTerm}                         
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                        className="w-full bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-cyan-500 placeholder:text-slate-500 transition-colors" 
                      />
                  </div>
                  <button 
                    onClick={handleSearchTrigger} 
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto justify-end">
                  <Link 
                    href={selectedRowId ? `/admin/custom-roles/create?prevHighlight=${selectedRowId}` : "/admin/custom-roles/create"} 
                    className="flex-1 lg:flex-none"
                  >
                      <button className="w-full justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg uppercase transition-all shadow-lg shadow-cyan-900/20">Add</button>
                  </Link>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={selectedIds.length === 0}
                    className="flex-1 lg:flex-none justify-center px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                      Delete
                  </button>
              </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[#0B1120] border-t border-blue-900/30 overflow-hidden flex flex-col shadow-2xl">
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-[#020617] sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-blue-900/50">
                          <tr>
                              <th className="p-4 w-[50px] text-center"><input type="checkbox" onChange={handleSelectAll} checked={roles.length > 0 && selectedIds.length === roles.length} className="rounded border-slate-600 bg-slate-800" /></th>
                              <th className="p-4">Role Name</th>
                              <th className="p-4">Description</th>
                              <th className="p-4">Tags</th>
                              <th className="p-4 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {isLoading ? (
                              <tr><td colSpan={5} className="p-20 text-center text-slate-500 animate-pulse">Loading roles...</td></tr>
                          ) : roles.length === 0 ? (
                              <tr><td colSpan={5} className="p-20 text-center text-slate-500 font-medium italic">No custom roles found.</td></tr>
                          ) : (
                              roles.map((role, idx) => {
                                  const roleId = role.id || role.customRoleId || role.roleId;
                                  const isSelected = selectedRowId === roleId;
                                  
                                  return (
                                      <tr 
                                          key={roleId || idx} 
                                          ref={(el) => { if (el) rowRefs.current[roleId] = el; }}
                                          onClick={() => setSelectedRowId(roleId)}
                                          className={`transition-all duration-300 group text-sm cursor-pointer hover:bg-blue-900/10
                                            ${isSelected ? "bg-blue-900/20 border-l-4 border-l-cyan-400 pl-[12px]" : "border-l-4 border-l-transparent pl-[16px]"}
                                          `}
                                      >
                                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.includes(roleId)} onChange={() => handleSelectOne(roleId)} className="rounded border-slate-600 bg-slate-800" />
                                          </td>
                                          
                                          <td className="p-4 font-medium text-slate-200">
                                            <Link href={`/admin/custom-roles/${roleId}/update`} className={`hover:underline ${isSelected ? 'text-cyan-400' : 'text-blue-400 hover:text-cyan-300'}`} onClick={(e) => e.stopPropagation()}>
                                              {role.customRoleName || role.roleName || role.name || "-"}
                                            </Link>
                                          </td>

                                          <td className="p-4 text-slate-400 text-sm max-w-[400px] truncate">{role.roleDescription || role.description || "-"}</td>
                                          
                                          <td className="p-4">
                                              <div className="flex flex-wrap gap-1">
                                                  {parseTags(role.tags).length > 0 ? parseTags(role.tags).map((tag, i) => (
                                                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{tag}</span>
                                                  )) : "-"}
                                              </div>
                                          </td>
                                          
                                          <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                              <button onClick={() => setSelectedRowId(roleId)} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                                  <MoreHorizontal className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
              
              {/* Pagination Footer */}
              <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-blue-900/50 bg-[#020617] z-20 gap-4 sm:gap-6">
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
                      <div className="text-xs text-slate-400">{totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} of {totalCount}</div>
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-1.5 rounded hover:bg-blue-900/40 text-slate-400 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setPage(p => Math.min(Math.ceil(totalCount/itemsPerPage), p + 1))} disabled={page >= Math.ceil(totalCount/itemsPerPage) || totalCount === 0 || isLoading} className="p-1.5 rounded hover:bg-blue-900/40 text-slate-400 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
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
                <h3 className="text-lg font-bold text-white mb-2 uppercase">Delete Role</h3>
                <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed px-2">Are you sure you want to delete {selectedIds.length} role(s)? This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">Cancel</button>
                    <button onClick={handleBulkDelete} className="flex-1 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-900/20 font-bold uppercase">Delete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}