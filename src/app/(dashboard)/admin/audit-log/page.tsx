"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2, Eye, FileJson, X,
  ChevronDown, RefreshCcw, Copy, Check
} from "lucide-react";
import { format, subMinutes, subHours, subDays } from "date-fns";
import { toast } from "sonner";
import { Navbar } from "@/src/components/layout/navbar"; 
import { AdvancedTimeRangeSelector, type TimeRangeValue } from "@/src/components/ui/advanced-time-selector"; 

// 🚀 1. Import Context และ Dictionary
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

export interface AuditLogDocument {
  id: string;
  "@timestamp": string;
  user_name: string;
  id_type: string;
  role: string;
  action: string;
  path: string;
  resource: string;
  status_code: number;
  client_ip: string;
  [key: string]: any;
}

export default function AuditLogPage() {
  // 🚀 2. เรียกใช้ Language Hook
  const { language } = useLanguage();
  const t = translations.auditLogs[language]; // ดึงคำแปลหมวด auditLogs

  // --- States ---
  const [logs, setLogs] = useState<AuditLogDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [searchField, setSearchField] = useState("Full Text Search");
  
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "24h",
    label: "Last 24 hours"
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogDocument | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const highlightJson = (json: object) => {
    const jsonString = JSON.stringify(json, null, 2);
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-[#ce9178]';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = 'text-[#9cdcfe]';
        } else if (/true|false/.test(match)) {
          cls = 'text-[#569cd6]';
        } else if (/null/.test(match)) {
          cls = 'text-[#569cd6]';
        } else {
          cls = 'text-[#b5cea8]';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const getOrgId = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('orgId') || "";
    }
    return "";
  };

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) {
        setIsLoading(false);
        return;
    }

    try {
      setIsLoading(true);
      const from = (page - 1) * itemsPerPage;
      const queryMust: any[] = [];

      // Search Logic
      if (searchTerm) {
        if (searchField === "Full Text Search") {
             queryMust.push({
                multi_match: {
                    query: searchTerm,
                    fields: ["data.userInfo.UserName", "data.api.ApiName", "data.userInfo.Role", "data.userInfo.IdentityType", "data.CfClientIp", "data.Path"],
                    type: "phrase_prefix"
                }
            });
        } else if (searchField === "Username") {
            queryMust.push({ match: { "data.userInfo.UserName": searchTerm } });
        } else if (searchField === "API") {
            queryMust.push({ match: { "data.api.ApiName": searchTerm } });
        } else if (searchField === "IP Address") {
            queryMust.push({ match: { "data.CfClientIp": searchTerm } });
        }
      }

      let gte: string | undefined;
      let lte: string | undefined;
      const now = new Date();
      
      if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
        gte = new Date(timeRange.start * 1000).toISOString();
        lte = new Date(timeRange.end * 1000).toISOString();
      } else {
        let startTime = subHours(now, 24);
        const rangeValue = timeRange.value;
        const num = parseInt(rangeValue.replace(/\D/g, "")) || 24;
        const unit = rangeValue.replace(/\d/g, "") || "h";

        if (unit === "m") startTime = subMinutes(now, num);
        if (unit === "h") startTime = subHours(now, num);
        if (unit === "d") startTime = subDays(now, num);
        
        gte = startTime.toISOString();
      }

      if (gte) {
        const rangeQuery: any = { gte };
        if (lte) rangeQuery.lte = lte;
        queryMust.push({ range: { "@timestamp": rangeQuery } });
      }

      const payload = {
        from,
        size: itemsPerPage,
        sort: [{ "@timestamp": { order: "desc" } }],
        track_total_hits: true,
        query: {
            bool: {
                must: queryMust.length > 0 ? queryMust : [{ match_all: {} }]
            }
        }
      };

      const response = await fetch('/api/audit-log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-org-id': orgId
        },
        body: JSON.stringify({ esPayload: payload })
      });

      const result = await response.json();

      if (result.status === "OK") {
        const hits = result.data.map((source: any) => {
            const data = source.data || {};
            const userInfo = data.userInfo || data.user || {};
            const api = data.api || {};

            return {
                id: source._id,
                "@timestamp": source["@timestamp"],
                user_name: userInfo.UserName || userInfo.userName || "",
                id_type: userInfo.IdentityType || "-",
                role: userInfo.Role || "-",
                action: api.ApiName || api.apiName || data.Path,
                path: data.Path,
                resource: api.Controller,
                status_code: data.StatusCode || api.statusCode,
                client_ip: data.CfClientIp || data.ClientIp || data.clientIp || "-",
                ...source
            } as AuditLogDocument;
        });

        setLogs(hits);
        setTotalCount(result.total);
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
      setTotalCount(0);
      // toast.error(`Error: ${error.message}`); ซ่อนไว้เพื่อไม่ให้ผู้ใช้ตกใจหาก Error
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, searchTerm, timeRange, searchField]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- UI Handlers ---
  const handleRowClick = (id: string) => setSelectedRowId(id);
  const handleSearchTrigger = () => { setPage(1); setSearchTerm(inputValue); };
  const handleResetFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setSearchField("Full Text Search");
    setTimeRange({ type: "relative", value: "24h", label: "Last 24 hours" });
    setPage(1);
  };
  const openDetailModal = (log: AuditLogDocument) => {
      setSelectedLog(log);
      setIsCopied(false);
      setShowDetailModal(true);
  };
  const handleCopyJson = () => {
    if (selectedLog) {
        navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };
  const formatDate = (isoString: string) => {
      try { return format(new Date(isoString), "M/d/yyyy, h:mm:ss a"); }
      catch (e) { return isoString || "-"; }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex-none pt-6 px-4 md:px-6 mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1> {/* 🚀 ใช้คำแปล */}
            <p className="text-slate-400 text-xs md:text-sm">{t.subtitle}</p> {/* 🚀 ใช้คำแปล */}
        </div>

        {/* Filter Section */}
        <div className="flex-none py-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0B1120] p-4 rounded-xl border border-blue-900/30 shadow-lg">
              
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                  <div className="relative">
                      <select 
                          value={searchField}
                          onChange={(e) => setSearchField(e.target.value)}
                          className="appearance-none bg-[#162032] border border-blue-900/50 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none transition-colors w-full sm:w-auto sm:min-w-[160px]"
                      >
                          <option>Full Text Search</option>
                          <option>Username</option>
                          <option>API</option>
                          <option>IP Address</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 lg:min-w-[240px]">
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder} // 🚀 ใช้คำแปล
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                        className="w-full bg-[#162032] border border-blue-900/50 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors" 
                      />
                  </div>
                  <button onClick={handleSearchTrigger} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto justify-end">
                  <AdvancedTimeRangeSelector 
                    value={timeRange}
                    onChange={(val) => { setTimeRange(val); setPage(1); }}
                    disabled={isLoading}
                  />

                  <button onClick={handleResetFilters} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-700">
                      <RefreshCcw className="w-4 h-4" />
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
                              <th className="p-4">{t.columns.time}</th> 
                              <th className="p-4">{t.columns.username}</th> 
                              <th className="p-4">{t.columns.idType}</th> 
                              <th className="p-4">{t.columns.api}</th> 
                              <th className="p-4">{t.columns.status}</th>
                              <th className="p-4">{t.columns.role}</th> 
                              <th className="p-4">{t.columns.ip}</th> 
                              <th className="p-4 text-center">{t.columns.actions}</th> 
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/20">
                          {isLoading ? (
                              <tr><td colSpan={8} className="p-20 text-center text-slate-500 animate-pulse">{t.table.loading}</td></tr> /* 🚀 ใช้คำแปล */
                          ) : logs.length === 0 ? (
                              <tr><td colSpan={8} className="p-20 text-center text-slate-500">{t.table.noData}</td></tr> /* 🚀 ใช้คำแปล */
                          ) : (
                              logs.map((log, idx) => {
                                  const isSelected = selectedRowId === log.id;
                                  
                                  const isError = log.status_code && log.status_code !== 200;
                                  
                                  return (
                                      <tr 
                                          key={log.id || idx} 
                                          onClick={() => handleRowClick(log.id)}
                                          className={`transition-all duration-300 group text-sm cursor-pointer 
                                            ${isError ? "bg-red-500/10 hover:bg-red-500/20" : "hover:bg-blue-900/10"} 
                                            ${isSelected && !isError ? "bg-blue-900/20 border-l-4 border-l-cyan-400" : ""}
                                            ${isSelected && isError ? "bg-red-500/30 border-l-4 border-l-red-500" : ""}
                                            ${!isSelected && isError ? "border-l-4 border-l-red-500/50" : ""}
                                            ${!isSelected && !isError ? "border-l-4 border-l-transparent" : ""}
                                          `}
                                      >
                                          <td className={`p-4 whitespace-nowrap font-mono text-xs ${isError ? 'text-red-300' : 'text-slate-400'}`}>
                                              {formatDate(log["@timestamp"])}
                                          </td>
                                          <td className={`p-4 font-medium ${isError ? 'text-red-400' : 'text-blue-400'}`}>
                                              {log.user_name || "-"}
                                          </td>
                                          <td className="p-4">
                                              <span className={isError ? 'text-red-200' : 'text-slate-300'}>{log.id_type || "JWT"}</span>
                                          </td>
                                          <td className={`p-4 ${isError ? 'text-red-200' : 'text-slate-300'}`}>
                                              {log.action || "-"}
                                          </td>
                                          <td className={`p-4 font-mono font-bold ${isError ? 'text-red-500' : 'text-slate-200'}`}>
                                              {log.status_code || 200}
                                          </td>
                                          <td className={`p-4 ${isError ? 'text-red-300' : 'text-slate-400'}`}>
                                              {log.role || "-"}
                                          </td>
                                          <td className={`p-4 font-mono text-xs ${isError ? 'text-red-400' : 'text-slate-500'}`}>
                                              {log.client_ip || "-"}
                                          </td>
                                          <td className="p-4 text-center">
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); openDetailModal(log); }} 
                                                className={`p-1.5 rounded-full transition-colors border border-transparent outline-none ${isError ? 'text-red-400 hover:text-red-200 hover:bg-red-500/20 hover:border-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700'}`}
                                              >
                                                  <Eye className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
              
              {/* Paging Footer */}
              <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>{t.table.rowsPerPage}</span> {/* 🚀 ใช้คำแปล */}
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none">
                          <option value={25} className="bg-slate-900">25</option>
                          <option value={50} className="bg-slate-900">50</option>
                          <option value={100} className="bg-slate-900">100</option>
                          <option value={200} className="bg-slate-900">200</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                      <div>{startRow}-{endRow} {t.table.of} {totalCount}</div> {/* 🚀 ใช้คำแปล */}
                      <div className="flex items-center gap-1">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>

      {/* JSON Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-blue-900/50 flex-none">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-cyan-400" /> {t.modal.title} {/* 🚀 ใช้คำแปล */}
                    </h3>
                    <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-blue-900/40 rounded"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-[#020617] custom-scrollbar">
                    <pre
                      className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all select-text"
                      dangerouslySetInnerHTML={{ __html: highlightJson(selectedLog) }}
                    />
                </div>

                <div className="p-4 border-t border-blue-900/50 bg-[#0B1120] flex justify-between items-center flex-none">
                    <button onClick={handleCopyJson} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-blue-900/40 rounded-md transition-colors border border-transparent hover:border-blue-900/50">
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Copied!" : "Copy JSON"}
                    </button>
                    <button onClick={() => setShowDetailModal(false)} className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg">
                      {t.modal.close} {/* 🚀 ใช้คำแปล */}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}