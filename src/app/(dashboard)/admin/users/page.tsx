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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/src/components/ui/dropdown-menu"; 
import { Navbar } from "@/src/components/layout/navbar"; 
import { toast } from "sonner"; 
import { userApi } from "@/src/modules/auth/api/user.api";
import { UserItem } from "@/src/modules/auth/api/types";
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

export default function UsersPage() {
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  const { language } = useLanguage();
  const t = translations.users[language];

  // States
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
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
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const fetchUsersData = async (currentPage: number, searchKeyword: string = "") => {
    setIsLoading(true);
    try {
      const orgId = localStorage.getItem("orgId") || "temp";
      const currentOffset = (currentPage - 1) * itemsPerPage;
      const payload = { offset: currentOffset, limit: itemsPerPage, fullTextSearch: searchKeyword };

      const [res, countRes] = await Promise.all([
        userApi.getUsers(orgId, payload),
        userApi.getUserCount(orgId, { fullTextSearch: searchKeyword })
      ]);
      
      const userData = res?.data ? res.data : (Array.isArray(res) ? res : []);
      setUsers(userData);
      
      let count = 0;
      if (typeof countRes === "number") count = countRes;
      else if (countRes && typeof countRes === "object") {
        count = countRes.count || countRes.totalCount || countRes.data || userData.length; 
      }
      setTotalCount(count); 
    } catch (error: any) {
      console.error("Fetch Users Error:", error);
      toast.error(t.toast.fetchError); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData(page, searchTerm);
  }, [page, itemsPerPage]);

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
    fetchUsersData(1, searchTerm);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const orgId = localStorage.getItem("orgId") || "temp";
    
    try {
      for (const id of selectedIds) { 
        await userApi.deleteUser(orgId, id); 
      }
      
      toast.success(t.toast.deleteSuccess.replace("{count}", selectedIds.length.toString()));
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      fetchUsersData(page, searchTerm);

    } catch (error: any) {
      console.error("Delete users error:", error);
      const errorMsg = error?.response?.data?.description || error?.message || t.toast.deleteError;
      toast.error(errorMsg);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    
    const orgId = localStorage.getItem("orgId") || "temp";
    const userId = targetUser.orgUserId;
    const isCurrentlyDisabled = targetUser.userStatus === "Disabled";

    const toastId = toast.loading(t.loading);

    try {
      if (isCurrentlyDisabled) {
        await userApi.enableUserById(orgId, userId);
      } else {
        await userApi.disableUserById(orgId, userId);
      }
      
      toast.success(t.toast.statusSuccess, { id: toastId });
      
      setShowStatusConfirm(false);
      setTargetUser(null);
      fetchUsersData(page, searchTerm); 
    } catch (error: any) {
      console.error("Toggle status error:", error);
      const errorMsg = error?.response?.data?.description || t.toast.statusError;
      toast.error(errorMsg, { id: toastId });
    }
  };

  // 🚀 เปลี่ยนมาใช้ userApi แทนครับ
  const handleResetPasswordLink = async (user: UserItem) => {
    if (user.userStatus !== "Active") return;
    
    const orgId = localStorage.getItem("orgId") || "temp";

    try {
      // แสดง Toast Loading
      toast.loading(t.toast?.generatingLink || "Generating reset link...", { id: "gen-link" });
      
      // ดึงลิงก์จาก API
      const response: any = await userApi.getForgotPasswordLink(orgId, user.orgUserId);
      
      // ปิด Toast Loading
      toast.dismiss("gen-link");

      if (response && response.forgotPasswordUrl) {
        // จัดการเรื่อง Domain เหมือนที่คุณเขียนไว้
        const appUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.host;
        const domain = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const finalLink = response.forgotPasswordUrl.replace('<REGISTER_SERVICE_DOMAIN>', domain);
        
        setGeneratedLink(finalLink);
        setTargetUser(user);
        
        // 🚀 เปิด Modal เมื่อได้ลิงก์เรียบร้อยแล้ว
        setShowResetLinkModal(true);
      } else {
        toast.error(t.toast?.invalidResponse || "Invalid response from server.");
      }

    } catch (error: any) {
      toast.dismiss("gen-link");
      console.error("Reset link error:", error);
      const errorMsg = error?.response?.data?.description || error?.message || t.toast?.resetLinkError || "Failed to generate reset link";
      toast.error(errorMsg);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLink);
    toast.success(t.toast.copySuccess); 
  };

  const handleActionClick = (user: UserItem) => {
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex-none pt-6 px-4 md:px-6 mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1> 
            <p className="text-slate-400 text-xs md:text-sm">{t.subHeader}</p> 
        </div>

        <div className="flex-none py-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0B1120] p-4 rounded-xl border border-blue-900/30 shadow-lg">
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                  <div className="relative">
                      <select className="appearance-none bg-[#162032] border border-blue-900/50 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none transition-colors">
                          <option>{t.filters.all}</option> 
                          <option>{t.filters.username}</option>
                          <option>{t.filters.email}</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 lg:min-w-[240px]">
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={searchTerm}                         
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && fetchUsersData(1, searchTerm)}
                        className="w-full bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors" 
                      />
                  </div>
                  <button onClick={() => fetchUsersData(1, searchTerm)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto justify-end">
                  <Link href="/admin/users/create">
                      <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg uppercase shadow-lg">
                        {t.buttons.add} 
                      </button>
                  </Link>
                  <button onClick={() => setShowDeleteConfirm(true)} disabled={selectedIds.length === 0} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg uppercase disabled:opacity-30">
                      {t.buttons.delete} 
                  </button>
              </div>
          </div>
        </div>

        {/* table */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-[#020617] sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-blue-900/50">
                          <tr>
                              <th className="p-4 w-[50px]"><input type="checkbox" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} className="rounded border-slate-600 bg-slate-800" /></th>
                              <th className="p-4">{t.columns.username}</th>
                              <th className="p-4">{t.columns.email}</th>
                              <th className="p-4">{t.columns.tags}</th>
                              <th className="p-4">{t.columns.customRole}</th>
                              <th className="p-4">{t.columns.role}</th>
                              <th className="p-4 text-center">{t.columns.initialUser}</th>
                              <th className="p-4">{t.columns.status}</th>
                              <th className="p-4 text-center">{t.columns.action}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {isLoading ? (
                              <tr><td colSpan={9} className="p-20 text-center text-slate-500 animate-pulse">{t.loading}</td></tr>
                          ) : users.length === 0 ? (
                              <tr><td colSpan={9} className="p-20 text-center text-slate-500 italic">{t.noData}</td></tr>
                          ) : (
                              users.map((user, idx) => {
                                  const userId = user.orgUserId; 
                                  const isSelected = selectedRowId === userId;
                                  const isPending = user.userStatus === "Pending"; 
                                  const tagsArray = user.tags ? user.tags.split(',').filter(t => t.trim() !== '') : [];

                                  return (
                                      <tr 
                                          key={userId || idx} 
                                          onClick={() => setSelectedRowId(userId)}
                                          className={`transition-all duration-300 group text-sm cursor-pointer hover:bg-blue-900/10 ${isSelected ? "bg-blue-900/20 border-l-4 border-l-cyan-400" : "border-l-4 border-l-transparent"}`}
                                      >
                                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.includes(userId)} onChange={() => handleSelectOne(userId)} className="rounded border-slate-600 bg-slate-800" />
                                          </td>
                                          <td className="p-4 font-medium"><Link href={`/admin/users/${userId}/update`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>{user.userName}</Link></td>
                                          <td className="p-4 text-slate-300">{user.userEmail || user.tmpUserEmail || "-"}</td>
                                          <td className="p-4"><div className="flex flex-wrap gap-1">{tagsArray.map((tag, i) => (
                                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{tag}</span>
                                          ))}</div></td>
                                          <td className="p-4 text-slate-400">{user.customRoleName || "-"}</td>
                                          <td className="p-4"><span className="bg-blue-600 px-2 py-1 rounded-md text-[10px] font-semibold text-white">{user.rolesList || "-"}</span></td>
                                          <td className="p-4 text-center">{user.isOrgInitialUser === "YES" ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}</td>
                                          <td className="p-4 font-medium"><span className={user.userStatus === 'Disabled' ? 'text-slate-500' : 'text-emerald-400'}>{user.userStatus || "Active"}</span></td>
                                          
                                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                              <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                  <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700 outline-none">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                  </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0B1120] border border-blue-900/50 text-slate-200 min-w-[180px] p-1 shadow-2xl z-[100]">
                                                  
                                                  <DropdownMenuItem 
                                                    disabled={user.userStatus === "Disabled" || isPending}
                                                    onClick={() => handleActionClick(user)}
                                                    className="cursor-pointer focus:bg-white/5 focus:text-[#f87171] text-[#f87171] px-3 py-2 text-sm rounded-md outline-none"
                                                  >
                                                    {t.buttons.disable} 
                                                  </DropdownMenuItem>

                                                  <DropdownMenuItem 
                                                    disabled={user.userStatus !== "Disabled" || isPending}
                                                    onClick={() => handleActionClick(user)}
                                                    className="cursor-pointer focus:bg-white/5 focus:text-slate-300 text-slate-300 px-3 py-2 text-sm rounded-md outline-none"
                                                  >
                                                    {t.buttons.enable}
                                                  </DropdownMenuItem>
                                                  
                                                  <DropdownMenuItem 
                                                    disabled={user.userStatus !== "Active"}
                                                    onClick={() => handleResetPasswordLink(user)}
                                                    className="cursor-pointer focus:bg-white/5 focus:text-[#2dd4bf] text-[#2dd4bf] px-3 py-2 text-sm rounded-md outline-none"
                                                  >
                                                    {t.buttons.resetPassword}
                                                  </DropdownMenuItem>

                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                          </td>
                                      </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
              
              <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>{t.rowsPerPage}</span> 
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none">
                          <option value={25} className="bg-slate-900">25</option>
                          <option value={50} className="bg-slate-900">50</option>
                          <option value={100} className="bg-slate-900">100</option>
                          <option value={200} className="bg-slate-900">200</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                      <div>{startRow}-{endRow} {t.of} {totalCount}</div> 
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modals */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-2">
                    {targetUser?.userStatus === "Disabled" ? t.modal.enableTitle : t.modal.disableTitle} {/* 🚀 ใช้คำแปล */}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                    {t.modal.statusMessage.replace("{action}", targetUser?.userStatus === "Disabled" ? "enable" : "disable")}
                </p>
                <div className="flex gap-3">
                    <button onClick={() => { setShowStatusConfirm(false); setTargetUser(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg border border-slate-700 transition-colors">
                      {t.buttons.cancel}
                    </button>
                    <button onClick={handleToggleStatus} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-500 transition-all">
                      {t.buttons.ok}
                    </button>
                </div>
            </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 mx-auto"><Trash2 className="w-6 h-6 text-red-500" /></div>
                <h3 className="text-lg font-bold text-white mb-2">{t.modal.deleteTitle}</h3>
                <p className="text-sm text-slate-400 mb-6">
                  {t.modal.deleteMessage.replace("{count}", selectedIds.length.toString())}
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg border border-slate-700">
                      {t.buttons.cancel}
                    </button>
                    <button onClick={handleBulkDelete} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-500 transition-all">
                      {t.buttons.delete}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Reset Password Link Modal */}
      {showResetLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">
                          {t.modal?.resetPasswordTitle || "Reset Password Link"}
                        </h3>
                        <button onClick={() => setShowResetLinkModal(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-400">
                        {(t.modal?.resetPasswordMessage || "Copy the link below and send it to {name} to reset their password.")
                          .replace("{name}", targetUser?.userName || "")}
                    </p>

                    <div className="relative">
                        <input 
                            type="text" 
                            readOnly 
                            value={generatedLink} 
                            className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-12 py-3 focus:outline-none focus:border-blue-500"
                        />
                        <button 
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                            title={t.buttons?.copy || "Copy to clipboard"}
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={() => setShowResetLinkModal(false)} 
                            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            {t.buttons?.done || "Done"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}