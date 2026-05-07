"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { Activity, Cpu, HardDrive, Wifi, Clock, Server, Eye, ChevronLeft, ChevronRight, RefreshCw, ArrowLeft } from "lucide-react";
import { format, subMinutes, subHours, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue 
} from "@/src/components/ui/advanced-time-selector";
import { Navbar } from "@/src/components/layout/navbar"; 
import { sensorStatsApi } from "@/src/modules/fleet/api/sensor-stats.api";
import { agentApi } from "@/src/modules/fleet/api/agent.api";
import { SensorOverviewHistogram } from "@/src/components/ui/sensor-overview-histogram";
import { SensorDetailFlyout } from "@/src/components/ui/sensor-detail-flyout";

import { useLanguage } from "@/src/context/LanguageContext";
import { agentTranslations } from "@/src/locales/agentdict";

interface DiskStat {
  name: string;
  used: number;
  total: number;
  percent: number;
}

interface NetworkStat {
  name: string;
  rx: number;
  tx: number;
}

interface SystemStats {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disks: DiskStat[];
  networks: NetworkStat[];
  lastSeen: string;
}

export default function SensorOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sensorId = resolvedParams.id; 
  const router = useRouter(); 

  const { language } = useLanguage();
  const t = agentTranslations.sensorOverview[language as keyof typeof agentTranslations.sensorOverview] || agentTranslations.sensorOverview.EN;
  
  // --- States ---
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "1h",
    label: "Last 1 hour"
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartInterval, setChartInterval] = useState("30m");
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [latestStats, setLatestStats] = useState<SystemStats>({
    cpu: 0,
    memory: { used: 0, total: 1, percent: 0 }, 
    disks: [],  
    networks: [],    
    lastSeen: new Date().toISOString()
  });

  const [sensorCode, setSensorCode] = useState<string>("");

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showFlyout, setShowFlyout] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    if (!sensorId) return;
    
    try {
      setIsLoading(true);
      
      let gte: string | undefined;
      let lte: string | undefined;
      let interval = "30m";

      if (timeRange.type === "relative") {
        const now = new Date();
        let startTime = subHours(now, 1);
        switch (timeRange.value) {
            case "5m": startTime = subMinutes(now, 5); interval = "30s"; break;
            case "15m": startTime = subMinutes(now, 15); interval = "1m"; break;
            case "30m": startTime = subMinutes(now, 30); interval = "1m"; break;
            case "1h": startTime = subHours(now, 1); interval = "1m"; break;
            case "3h": startTime = subHours(now, 3); interval = "5m"; break;
            case "6h": startTime = subHours(now, 6); interval = "10m"; break;
            case "12h": startTime = subHours(now, 12); interval = "30m"; break;
            case "24h": startTime = subHours(now, 24); interval = "30m"; break;
            case "2d": startTime = subDays(now, 2); interval = "1h"; break;
            case "7d": startTime = subDays(now, 7); interval = "3h"; break;
            case "30d": startTime = subDays(now, 30); interval = "12h"; break;
        }
        gte = startTime.toISOString();
      } else if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
        gte = new Date(timeRange.start * 1000).toISOString();
        lte = new Date(timeRange.end * 1000).toISOString();
        const diffHours = (timeRange.end - timeRange.start) / 3600;
        interval = diffHours <= 1 ? "1m" : diffHours <= 24 ? "30m" : "1d";
      }

      const payload = { gte, lte, interval, size: 1000 };
      const response = await sensorStatsApi.getOverview(sensorId, payload);
      
      const hits = response.hits?.hits || [];
      const buckets = response.aggregations?.timeline?.buckets || [];

      setChartData(buckets);
      setChartInterval(interval);
      setPage(1);

      const mappedLogs = hits.map((h: any) => {
        const source = h._source || {};
        const req = source.data?.request || {};
        return {
          id: h._id,
          timestamp: req.timestamp || source['@timestamp'],
          status: "Online",
          ip: source.data?.host || req.interfaces?.interfaces?.[0]?.ip || "-",
          logType: source.data?.AuditType || "Heartbeat",
          latency: "-",
          rawDoc: source
        };
      });
      setLogs(mappedLogs);

      if (hits.length > 0) {
        const latestSource = hits[0]._source || {};
        const req = latestSource.data?.request || {};

        const cpuPercent = req.cpu?.usage_percent || 0;
        const memUsedMb = req.memory?.used_mb || 0;
        const memTotalMb = req.memory?.total_mb || 1;

        const memUsedGb = Number((memUsedMb / 1024).toFixed(1));
        const memTotalGb = Number((memTotalMb / 1024).toFixed(1));
        const memPercent = memTotalGb > 0 ? (memUsedGb / memTotalGb) * 100 : 0;

        const disks: DiskStat[] = [];
        if (Array.isArray(req.disk)) {
          req.disk.forEach((d: any, idx: number) => {
            const used = Number(d.used_gb) || 0;
            const total = Number(d.total_gb) || 1;
            disks.push({
              name: d.mount || d.filesystem || `Disk ${idx + 1}`,
              used: Number(used.toFixed(1)),
              total: Number(total.toFixed(1)),
              percent: (used / total) * 100
            });
          });
        }

        const networks: NetworkStat[] = [];
        const ifaces = req.interfaces?.interfaces;
        if (Array.isArray(ifaces)) {
          ifaces.forEach((iface: any, idx: number) => {
            networks.push({
              name: iface.name || `Interface ${idx + 1}`,
              rx: Number(((Number(iface.stats?.rx_bytes) || 0) / (1024 * 1024)).toFixed(2)),
              tx: Number(((Number(iface.stats?.tx_bytes) || 0) / (1024 * 1024)).toFixed(2))
            });
          });
        }

        setLatestStats({
          cpu: Number(cpuPercent),
          memory: { used: memUsedGb, total: memTotalGb, percent: memPercent },
          disks,
          networks,
          lastSeen: req.timestamp || latestSource['@timestamp']
        });
      }

    } catch (error) {
      console.error("Failed to fetch sensor overview:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sensorId, timeRange]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  useEffect(() => {
    const fetchSensorCode = async () => {
      try {
        const orgId = localStorage.getItem("orgId") || "";
        const res = await agentApi.getAgentById(orgId, sensorId);
        const code = res?.agent?.code || "";
        setSensorCode(code);
      } catch {}
    };
    fetchSensorCode();
  }, [sensorId]);

  const totalLogs = logs.length;
  const totalPages = Math.ceil(totalLogs / itemsPerPage);
  const startRow = totalLogs === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalLogs);
  
  const currentLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, page, itemsPerPage]);

  const handleRowClick = (id: string) => {
    setSelectedRowId(id);
  };

  const handleOpenFlyout = (log: any, index: number) => {
    const globalIndex = (page - 1) * itemsPerPage + index;
    setSelectedRowId(log.id);
    setSelectedLog({ ...log.rawDoc, __index: globalIndex });
    setShowFlyout(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-y-auto space-y-6 animate-in fade-in duration-500 custom-scrollbar relative">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0B1120] p-5 rounded-xl border border-blue-900/30 shadow-lg">
          <div>
            <button 
              onClick={() => router.push("/fleet/sensor")}
              className="group flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-3 outline-none"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-bold uppercase tracking-wider">{t.back}</span>
            </button>

            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Server className="w-6 h-6 text-cyan-400" />
              {t.title}: <span className="text-cyan-400">{sensorCode || t.unknown}</span>
              {sensorCode && <span className="text-slate-500 text-base font-normal">({sensorId})</span>}
              <button 
                onClick={fetchOverviewData} 
                disabled={isLoading}
                className="p-1.5 ml-2 rounded-lg bg-blue-900/30 hover:bg-blue-600/50 text-cyan-400 transition-colors border border-blue-900/50 group"
                title={t.refreshTooltip}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin opacity-50' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLoading ? 'bg-amber-400' : 'bg-green-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isLoading ? 'bg-amber-500' : 'bg-green-500'}`}></span>
              </span>
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4" /> 
                {t.lastSeen} <span className="text-slate-200 font-mono">{format(new Date(latestStats.lastSeen), "HH:mm:ss")}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AdvancedTimeRangeSelector 
              value={timeRange} 
              onChange={(val) => setTimeRange(val)} 
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg flex flex-col justify-between h-[150px]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Cpu className="w-5 h-5 text-blue-400" /></div>
                <h3 className="text-sm font-bold text-white">{t.cards.cpuUsage}</h3>
              </div>
              <span className="text-2xl font-bold font-mono text-white">{latestStats.cpu.toFixed(1)}%</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1">
                <div className={`h-1.5 rounded-full ${latestStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-1000`} style={{ width: `${Math.min(latestStats.cpu, 100)}%` }}></div>
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-1">{t.cards.overallCpu}</div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg flex flex-col justify-between h-[150px]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Activity className="w-5 h-5 text-purple-400" /></div>
                <h3 className="text-sm font-bold text-white">{t.cards.memory}</h3>
              </div>
              <span className="text-2xl font-bold font-mono text-white">{latestStats.memory.percent.toFixed(1)}%</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-end mb-1">
                 <span className="text-[10px] text-slate-400">{t.cards.usedSpace}</span>
                 <span className="text-[10px] text-slate-400 font-mono">{latestStats.memory.used} / {latestStats.memory.total} GB</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1">
                <div className="h-1.5 rounded-full bg-purple-500 transition-all duration-1000" style={{ width: `${Math.min(latestStats.memory.percent, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg flex flex-col h-[150px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><HardDrive className="w-5 h-5 text-amber-400" /></div>
              <h3 className="text-sm font-bold text-white">{t.cards.diskUsage}</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {latestStats.disks.length > 0 ? (
                latestStats.disks.map((disk, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-medium text-slate-300 truncate max-w-[80px]" title={disk.name}>{disk.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {disk.used} / {disk.total} GB <span className="text-amber-400 font-bold ml-1">{disk.percent.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${disk.percent > 80 ? 'bg-red-500' : 'bg-amber-500'} transition-all duration-1000`} style={{ width: `${Math.min(disk.percent, 100)}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 flex h-full items-center justify-center">{t.cards.noDiskData}</div>
              )}
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg flex flex-col h-[150px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Wifi className="w-5 h-5 text-emerald-400" /></div>
              <h3 className="text-sm font-bold text-white">{t.cards.networkTraffic}</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              {latestStats.networks.length > 0 ? (
                latestStats.networks.map((net, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-800/30 rounded p-1.5 border border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300 truncate max-w-[80px]" title={net.name}>{net.name}</span>
                    <div className="flex flex-col items-end text-[10px] font-mono leading-tight">
                      <span className="text-emerald-400">↓ {net.rx} MB</span>
                      <span className="text-blue-400">↑ {net.tx} MB</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 flex h-full items-center justify-center">{t.cards.noInterfaceData}</div>
              )}
            </div>
          </div>

        </div>

        <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="p-5 border-b border-blue-900/30">
            <h3 className="text-lg font-bold text-white">{t.history.title}</h3>
          </div>
          
          <div className="p-5 h-[280px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-slate-500">{t.history.loadingGraph}</div>
              </div>
            ) : (
              <SensorOverviewHistogram data={chartData} interval={chartInterval} />
            )}
          </div>

          <div className="h-[400px] overflow-y-auto border-t border-blue-900/30 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#020617] sticky top-0 z-10 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-blue-900/50 shadow-sm">
                <tr>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617] font-bold text-[13px]">{t.table.timestamp}</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617] font-bold text-[13px]">{t.table.status}</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617] font-bold text-[13px]">{t.table.ipAddress}</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617] font-bold text-[13px]">{t.table.logType}</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617] font-bold text-[13px] text-center">{t.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500 animate-pulse">{t.history.fetchingLogs}</td></tr>
                ) : currentLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500">{t.history.noLogs}</td></tr>
                ) : (
                  currentLogs.map((log, index) => {
                    const isSelected = selectedRowId === log.id;

                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => handleRowClick(log.id)}
                        className={`transition-all duration-300 group text-[13px] cursor-pointer 
                          ${isSelected ? "bg-blue-900/20 border-l-4 border-l-cyan-400" : "hover:bg-blue-900/10 border-l-4 border-l-transparent"}
                        `}
                      >
                        <td className={`p-4 font-bold text-[13px] ${isSelected ? 'text-slate-200' : 'text-slate-300'}`}>
                          {format(new Date(log.timestamp), "M/d/yyyy, h:mm:ss a")}
                        </td>
                        <td className="p-4 font-bold text-[13px] text-emerald-400">{log.status}</td>
                        <td className={`p-4 font-bold text-[13px] ${isSelected ? 'text-slate-200' : 'text-slate-300'}`}>{log.ip}</td>
                        <td className={`p-4 font-bold text-[13px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{log.logType}</td>
                        <td className="p-4 text-center ">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFlyout(log, index);
                            }}
                            className={`p-1.5 rounded-full transition-colors border border-transparent outline-none
                              ${isSelected ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                            `}
                          >
                              <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer paging */}
          <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{t.table.rowsPerPage}</span> 
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }} 
                    className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium outline-none"
                  >
                      <option value={25} className="bg-slate-900">25</option>
                      <option value={50} className="bg-slate-900">50</option>
                      <option value={100} className="bg-slate-900">100</option>
                      <option value={200} className="bg-slate-900">200</option>
                  </select>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <div>{startRow}-{endRow} {t.table.of} {totalLogs}</div> 
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        disabled={page === 1} 
                        className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                        disabled={page === totalPages || totalPages === 0} 
                        className="p-1.5 rounded hover:bg-blue-900/40 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
          
        </div>

      </main>

      {showFlyout && selectedLog && (
        <SensorDetailFlyout
          log={selectedLog}
          logs={logs.map(l => l.rawDoc)}
          currentIndex={selectedLog.__index}
          onNavigate={(idx) => {
             const newLog = logs[idx];
             if (newLog) {
               setSelectedLog({ ...newLog.rawDoc, __index: idx });
               setSelectedRowId(newLog.id);
             }
          }}
          onClose={() => {
            setShowFlyout(false);
            setSelectedLog(null);
            setSelectedRowId(null);
          }}
        />
      )}

    </div>
  );
}