"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  X,
  MoreHorizontal,
  Trash2,
  Copy,
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar"; 

// --- Mock Data สำหรับตาราง User ---
const MOCK_USERS = [
  { orgUserId: "u1", userName: "admin_super", userEmail: "admin@rtarf.mi.th", rolesList: "Super Admin", userStatus: "Active", isOrgInitialUser: "YES", tags: "IT,HQ", customRoleName: "System Administrator" },
  { orgUserId: "u2", userName: "john.doe", userEmail: "john@rtarf.mi.th", rolesList: "Viewer", userStatus: "Active", isOrgInitialUser: "NO", tags: "Operator", customRoleName: "Monitor Staff" },
  { orgUserId: "u3", userName: "sarah.connor", userEmail: "sarah@cyber.mil", rolesList: "Editor", userStatus: "Pending", isOrgInitialUser: "NO", tags: "Cyber", customRoleName: "Threat Analyst" },
  { orgUserId: "u4", userName: "mike.w", userEmail: "mike@gmail.com", rolesList: "Viewer", userStatus: "Disabled", isOrgInitialUser: "NO", tags: "Guest", customRoleName: null },
  { orgUserId: "u5", userName: "root_system", userEmail: "root@localhost", rolesList: "Super Admin", userStatus: "Active", isOrgInitialUser: "YES", tags: "System", customRoleName: "Root" },
];

export default function UsersPage() {
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  // States
  const [users, setUsers] = useState(MOCK_USERS);
  const [totalCount, setTotalCount] = useState(MOCK_USERS.length);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightIdParam);
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals States
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [targetUser, setTargetUser] = useState<typeof MOCK_USERS[0] | null>(null);

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    if (highlightIdParam) {
      setSelectedRowId(highlightIdParam);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  }, [highlightIdParam, pathname, searchParams]);

  // --- Mock Functions ---
  const handleSearchTrigger = () => {
    setPage(1);
    const filtered = MOCK_USERS.filter(u => 
      u.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.userEmail && u.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setUsers(filtered);
    setTotalCount(filtered.length);
  };

  const handleBulkDelete = () => {
    const remainingUsers = users.filter(u => !selectedIds.includes(u.orgUserId));
    setUsers(remainingUsers);
    setTotalCount(remainingUsers.length);
    setSelectedIds([]);
    setShowDeleteConfirm(false);
    alert(`Successfully deleted ${selectedIds.length} user(s). (Mock)`);
  };

  const handleToggleStatus = () => {
    if (!targetUser) return;
    const newStatus = targetUser.userStatus === "Disabled" ? "Active" : "Disabled";
    setUsers(users.map(u => u.orgUserId === targetUser.orgUserId ? { ...u, userStatus: newStatus } : u));
    setShowStatusConfirm(false);
    setTargetUser(null);
  };

  const handleResetPasswordLink = (user: typeof MOCK_USERS[0]) => {
    if (user.userStatus !== "Active") return;
    setTargetUser(user);
    setGeneratedLink(`https://please-protect.center/reset?token=mock_${Math.random().toString(36).substr(2, 9)}`);
    setShowResetLinkModal(true);
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      alert("Link copied to clipboard!");
    } catch (err) {
      alert("Failed to copy link.");
    }
  };

  const handleActionClick = (user: typeof MOCK_USERS[0]) => {
    setTargetUser(user);
    setShowStatusConfirm(true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(users.map(u => u.orgUserId));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const parseTags = (tags: string | null | undefined) => {
    if (!tags) return [];
    return tags.split(',').filter(t => t.trim() !== '');
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex-none pt-6 px-4 md:px-6 mb-2">
          <div className="flex items-center gap-4">
              <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">User Management</h1>
                  <p className="text-slate-400 text-xs md:text-sm">Manage users, roles, and access permissions for the center.</p>
              </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex-none py-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0B1120] p-4 rounded-xl border border-blue-900/30 shadow-lg">
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                  <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                      <select className="w-full appearance-none bg-[#162032] border border-blue-900/50 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors">
                          <option>All Fields</option>
                          <option>Username</option>
                          <option>Email</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <div className="relative w-full sm:w-auto sm:flex-1 lg:min-w-[240px]">
                      <input 
                        type="text" 
                        placeholder="Search users..." 
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
                    href={selectedRowId ? `/admin/users/create?prevHighlight=${selectedRowId}` : "/admin/users/create"} 
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

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-[#020617] sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-blue-900/50">
                          <tr>
                              <th className="p-4 w-[50px]"><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} className="rounded border-slate-600 bg-slate-800" /></th>
                              <th className="p-4">Username</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Tags</th>
                              <th className="p-4">Custom Role</th>
                              <th className="p-4">Role</th>
                              <th className="p-4 text-center">Initial User</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {users.length === 0 ? (
                              <tr><td colSpan={9} className="p-20 text-center text-slate-500">No users found.</td></tr>
                          ) : (
                              users.map((user, idx) => {
                                  const isSelected = selectedRowId === user.orgUserId;
                                  const isPending = user.userStatus === "Pending"; 

                                  return (
                                      <tr 
                                          key={user.orgUserId || idx} 
                                          ref={(el) => { if (el) rowRefs.current[user.orgUserId] = el; }}
                                          onClick={() => setSelectedRowId(user.orgUserId)}
                                          className={`transition-all duration-300 group text-sm cursor-pointer hover:bg-blue-900/10
                                            ${isSelected ? "bg-blue-900/20 border-l-4 border-l-cyan-400 pl-[12px]" : "border-l-4 border-l-transparent pl-[16px]"}
                                          `}
                                      >
                                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.includes(user.orgUserId)} onChange={() => handleSelectOne(user.orgUserId)} className="rounded border-slate-600 bg-slate-800" />
                                          </td>
                                          
                                          <td className="p-4 font-medium">
                                            <Link href={`/admin/users/${user.orgUserId}/update`} className={`hover:underline ${isSelected ? 'text-cyan-400' : 'text-blue-400 hover:text-cyan-300'}`} onClick={(e) => e.stopPropagation()}>
                                              {user.userName}
                                            </Link>
                                          </td>

                                          <td className="p-4 text-slate-300">{user.userEmail || "-"}</td>
                                          
                                          <td className="p-4">
                                              <div className="flex flex-wrap gap-1">
                                                  {parseTags(user.tags).map((tag, i) => (
                                                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{tag}</span>
                                                  ))}
                                              </div>
                                          </td>
                                          
                                          <td className="p-4 text-slate-400">{user.customRoleName || "-"}</td>
                                          
                                          <td className="p-4">
                                              <span className="bg-blue-600 px-2 py-1 rounded-md text-[10px] font-semibold text-white">{user.rolesList}</span>
                                          </td>
                                          
                                          <td className="p-4 text-center">{user.isOrgInitialUser === "YES" ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>
                                          
                                          <td className="p-4 font-medium">
                                              <span className={user.userStatus === 'Disabled' ? 'text-slate-500' : user.userStatus === 'Pending' ? 'text-amber-400' : 'text-emerald-400'}>
                                                {user.userStatus}
                                              </span>
                                          </td>
                                          
                                          <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                              <button 
                                                onClick={() => setTargetUser(user)} 
                                                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                                              >
                                                  <MoreHorizontal className="w-4 h-4" />
                                              </button>

                                              {/* Mock Dropdown */}
                                              {targetUser?.orgUserId === user.orgUserId && !showStatusConfirm && !showResetLinkModal && (
                                                  <div className="absolute right-8 top-10 bg-[#0B1120] border border-blue-900/50 shadow-xl rounded-lg w-40 z-50 p-1 flex flex-col text-left">
                                                     <button disabled={user.userStatus === "Disabled" || isPending} onClick={() => handleActionClick(user)} className="px-3 py-2 text-sm text-red-400 hover:bg-blue-900/30 rounded disabled:opacity-30">Disable User</button>
                                                     <button disabled={user.userStatus !== "Disabled" || isPending} onClick={() => handleActionClick(user)} className="px-3 py-2 text-sm text-emerald-400 hover:bg-blue-900/30 rounded disabled:opacity-30">Enable User</button>
                                                     <button disabled={user.userStatus !== "Active"} onClick={() => handleResetPasswordLink(user)} className="px-3 py-2 text-sm text-cyan-400 hover:bg-blue-900/30 rounded disabled:opacity-30">Reset Password</button>
                                                     <div className="h-px bg-blue-900/30 my-1"></div>
                                                     <button onClick={() => setTargetUser(null)} className="px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded">Cancel</button>
                                                  </div>
                                              )}
                                          </td>
                                      </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
              
              <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>Rows per page</span>
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none">
                          <option value={25} className="bg-slate-900">25</option>
                          <option value={50} className="bg-slate-900">50</option>
                          <option value={100} className="bg-slate-900">100</option>
                          <option value={200} className="bg-slate-900">200</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="text-xs text-slate-400">{totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} of {totalCount}</div>
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-blue-900/40 text-slate-400 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-blue-900/40 text-slate-400 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>

      {/* Enable/Disable Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-white mb-2">
                        {targetUser?.userStatus === "Disabled" ? "Enable User" : "Disable User"}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Are you sure you want to {targetUser?.userStatus === "Disabled" ? "enable" : "disable"} this user?
                    </p>
                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => { setShowStatusConfirm(false); setTargetUser(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">Cancel</button>
                        <button onClick={handleToggleStatus} className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${targetUser?.userStatus === "Disabled" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Delete Users</h3>
                    <p className="text-sm text-slate-400 mb-6">Are you sure you want to delete {selectedIds.length} selected user(s)? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 w-full">
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">Cancel</button>
                        <button onClick={handleBulkDelete} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all">Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Reset Link Modal */}
      {showResetLinkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Password Reset Link</h3>
                        <button onClick={() => setShowResetLinkModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <p className="text-sm text-slate-400">Copy the link below and send it to <strong>{targetUser?.userName}</strong></p>
                    <div className="relative">
                        <input type="text" readOnly value={generatedLink} className="w-full bg-[#162032] border border-blue-900/50 text-cyan-400 text-sm rounded-lg pl-3 pr-12 py-3 focus:outline-none" />
                        <button onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-blue-900/30 rounded-md text-slate-400 hover:text-cyan-400 transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={() => setShowResetLinkModal(false)} className="px-6 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">Done</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}