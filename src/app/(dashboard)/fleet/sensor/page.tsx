"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  BarChart2,
  Trash2,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/src/components/ui/dropdown-menu"; 
import { Navbar } from "@/src/components/layout/navbar"; 
import { toast } from "sonner"; 
import { format, isValid, parseISO } from "date-fns";
import { agentApi } from "@/src/modules/fleet/api/agent.api";

import { useLanguage } from "@/src/context/LanguageContext";
import { agentTranslations } from "@/src/locales/agentdict";

export interface SensorItem {
  id: string;
  code: string;
  description: string;
  tags: string;
  createdDate: string;
  lastSeenDate: string | null;
  [key: string]: any;
}

export default function SensorPage() {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  const highlightIdParam = searchParams.get("highlight");

  const { language } = useLanguage();
  const t = agentTranslations.sensors[language];

  // States
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightIdParam);
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchSensorsData = async (currentPage: number, searchKeyword: string = "") => {
    setIsLoading(true);
    try {
      const orgId = localStorage.getItem("orgId") || "temp";
      const currentOffset = (currentPage - 1) * itemsPerPage;
      const payload = { offset: currentOffset, limit: itemsPerPage, fullTextSearch: searchKeyword };

      const [res, countRes] = await Promise.all([
        agentApi.getAgents(orgId, payload),
        agentApi.getAgentCount(orgId, { fullTextSearch: searchKeyword })
      ]);
      
      const sensorData = res?.data ? res.data : (Array.isArray(res) ? res : []);
      setSensors(sensorData);
      
      let count = 0;
      if (typeof countRes === "number") count = countRes;
      else if (countRes && typeof countRes === "object") {
        count = countRes.count || countRes.totalCount || countRes.data || sensorData.length; 
      }
      setTotalCount(count); 
    } catch (error: any) {
      toast.error(t.toast.fetchError); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorsData(page, searchTerm);
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
    fetchSensorsData(1, searchTerm);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(sensors.map(s => s.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const orgId = localStorage.getItem("orgId") || "temp";
    const toastId = toast.loading(language === "TH" ? "กำลังลบ..." : "Deleting...");
    try {
      for (const id of selectedIds) { await agentApi.deleteAgentById(orgId, id); }
      toast.success(t.toast.deleteSuccess.replace("{count}", selectedIds.length.toString()), { id: toastId });
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      fetchSensorsData(page, searchTerm);
    } catch (error: any) {
      toast.error(t.toast.deleteError, { id: toastId });
    }
  };

  const formatDate = (isoString: string | undefined | null) => {
    if (!isoString || isoString.startsWith("0001-01-01") || isoString === "") return "-";
    try {
      const date = parseISO(isoString);
      return isValid(date) ? format(date, "dd MMM yyyy, HH:mm") : "-";
    } catch (e) { return "-"; }
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
                  <div className="relative flex-1 lg:min-w-[300px]">
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} 
                        value={searchTerm}                        
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                        className="w-full bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors" 
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button onClick={handleSearchTrigger} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto justify-end">
                  <Link href="/fleet/sensor/create">
                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg uppercase shadow-lg transition-all active:scale-95">
                      {t.buttons.add}
                    </button>
                  </Link>
                  <button onClick={() => setShowDeleteConfirm(true)} disabled={selectedIds.length === 0} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg uppercase disabled:opacity-30 transition-all active:scale-95">
                      {t.buttons.delete}
                  </button>
              </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="bg-[#020617] sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-blue-900/50">
                          <tr>
                              <th className="p-4 w-[50px]"><input type="checkbox" onChange={handleSelectAll} checked={sensors.length > 0 && selectedIds.length === sensors.length} className="rounded border-slate-600 bg-slate-800" /></th>
                              <th className="p-4">{t.columns.code}</th> 
                              <th className="p-4">{t.columns.description}</th> 
                              <th className="p-4">{t.columns.tags}</th> 
                              <th className="p-4">{t.columns.createdDate}</th> 
                              <th className="p-4">{t.columns.lastSeen}</th>
                              <th className="p-4 text-center">{t.columns.action}</th> 
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {isLoading ? (
                              <tr><td colSpan={7} className="p-20 text-center text-slate-500 animate-pulse font-medium">{t.loading}</td></tr>
                          ) : sensors.length === 0 ? (
                              <tr><td colSpan={7} className="p-20 text-center text-slate-500 italic">{t.noData}</td></tr>
                          ) : (
                              sensors.map((sensor) => {
                                  const rowId = sensor.id;
                                  const isSelected = selectedRowId === rowId;
                                  const tagsArray = sensor.tags ? sensor.tags.split(',').filter(t => t.trim() !== '') : [];

                                  return (
                                      <tr 
                                          key={rowId} 
                                          onClick={() => setSelectedRowId(rowId)}
                                          className={`transition-all duration-300 group text-sm cursor-pointer hover:bg-blue-900/10 ${isSelected ? "bg-blue-900/20 border-l-4 border-l-cyan-400" : "border-l-4 border-l-transparent"}`}
                                      >
                                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                              <input type="checkbox" checked={selectedIds.includes(rowId)} onChange={() => handleSelectOne(rowId)} className="rounded border-slate-600 bg-slate-800" />
                                          </td>
                                          <td className="p-4 font-medium">
                                            <Link 
                                              href={`/fleet/sensor/${rowId}/update?prevHighlight=${rowId}`}
                                              className="text-blue-400 hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {sensor.code || "-"}
                                            </Link>
                                          </td>
                                          <td className="p-4 text-slate-300 font-medium">{sensor.description || "-"}</td>
                                          <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                              {tagsArray.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                                  {tag.trim()}
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                          <td className="p-4 text-slate-300 font-medium">{formatDate(sensor.createdDate)}</td>
                                          <td className="p-4 text-slate-300 font-medium">{formatDate(sensor.lastSeenDate)}</td>
                                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                              <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                  <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700 outline-none">
                                                      <MoreHorizontal className="w-4 h-4" />
                                                  </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0B1120] border border-blue-900/50 text-slate-200 min-w-[160px] p-1 shadow-2xl z-[100]">
                                                  <DropdownMenuItem 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/fleet/sensor/${rowId}/overview`);
                                                    }} 
                                                    className="cursor-pointer focus:bg-white/5 focus:text-blue-400 text-slate-300 px-3 py-2 text-sm rounded-md outline-none flex items-center gap-2 border-t border-blue-900/20"
                                                  >
                                                    <BarChart2 className="w-4 h-4" /> Overview
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
              
              {/* Pagination */}
              <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>{language === "TH" ? "แสดงแถวต่อหน้า" : "Rows per page"}</span> 
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none">
                          <option value={25} className="bg-slate-900">25</option>
                          <option value={50} className="bg-slate-900">50</option>
                          <option value={100} className="bg-slate-900">100</option>
                          <option value={200} className="bg-slate-900">200</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <div>{startRow}-{endRow} {language === "TH" ? "จาก" : "of"} {totalCount}</div> 
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{t.modal.deleteTitle}</h3>
            <p className="text-sm text-slate-400 mb-6">
              {t.modal.deleteMessage.replace("{count}", selectedIds.length.toString())}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                {language === "TH" ? "ยกเลิก" : "Cancel"}
              </button>
              <button onClick={handleBulkDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-500 transition-all">
                {language === "TH" ? "ลบ" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}