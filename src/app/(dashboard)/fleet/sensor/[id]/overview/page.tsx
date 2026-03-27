"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { Activity, Cpu, HardDrive, Wifi, Clock, Server, Eye, X, FileJson, Check, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMinutes, subHours, subDays } from "date-fns";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue 
} from "@/src/components/ui/advanced-time-selector";
import { Navbar } from "@/src/components/layout/navbar"; 
import { sensorStatsApi } from "@/src/modules/fleet/api/sensor-stats.api";
import { SensorOverviewHistogram } from "@/src/components/ui/sensor-overview-histogram";

export default function SensorOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sensorId = resolvedParams.id; 
  
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

  const [latestStats, setLatestStats] = useState({
    cpu: 0,
    memory: { used: 0, total: 1 }, 
    disk: { used: 0, total: 1 },  
    network: { rx: 0, tx: 0 },    
    lastSeen: new Date().toISOString()
  });

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

      // Helper
      const getField = (source: any, nestedPath: string, flatKey: string) => {
          const parts = nestedPath.split('.');
          let nestedVal = source;
          for (const p of parts) { if (nestedVal) nestedVal = nestedVal[p]; else break; }
          return (nestedVal !== undefined && nestedVal !== source) ? nestedVal : source[flatKey];
      };

      // Set ตาราง Logs
      const mappedLogs = hits.map((h: any) => {
        const source = h._source || {};
        return {
          id: h._id,
          timestamp: getField(source, 'data.timestamp', 'data.timestamp') || source['@timestamp'],
          status: "Online", 
          ip: getField(source, 'data.host', 'data.host') || "-",
          logType: getField(source, 'data.LogType', 'data.LogType') || "AgentStat",
          latency: "-", 
          rawDoc: source 
        };
      });
      setLogs(mappedLogs);

      if (hits.length > 0) {
        const latestSource = hits[0]._source || {};
        
        const cpuPercent = getField(latestSource, 'data.cpu.usage_percent', 'data.cpu.usage_percent') || 0;
        const memUsedMb = getField(latestSource, 'data.memory.used_mb', 'data.memory.used_mb') || 0;
        const memTotalMb = getField(latestSource, 'data.memory.total_mb', 'data.memory.total_mb') || 1;

        const sumArray = (val: any) => Array.isArray(val) ? val.reduce((a, b) => a + (Number(b) || 0), 0) : (Number(val) || 0);

        let diskUsedGb = 0;
        let diskTotalGb = 0;
        
        if (latestSource.data?.disk && Array.isArray(latestSource.data.disk)) {
            latestSource.data.disk.forEach((d: any) => {
                diskUsedGb += Number(d.used_gb) || 0;
                diskTotalGb += Number(d.total_gb) || 0;
            });
        } else {
            diskUsedGb = sumArray(latestSource['data.disk.used_gb'] || latestSource.data?.disk?.used_gb || 0);
            diskTotalGb = sumArray(latestSource['data.disk.total_gb'] || latestSource.data?.disk?.total_gb || 0);
        }
        if (diskTotalGb === 0) diskTotalGb = 1; // ป้องกันหารด้วย 0

        let netRxBytes = 0;
        let netTxBytes = 0;

        if (latestSource.data?.interfaces?.interfaces && Array.isArray(latestSource.data.interfaces.interfaces)) {
            latestSource.data.interfaces.interfaces.forEach((iface: any) => {
                netRxBytes += Number(iface.stats?.rx_bytes) || 0;
                netTxBytes += Number(iface.stats?.tx_bytes) || 0;
            });
        } else {
            netRxBytes = sumArray(latestSource['data.interfaces.interfaces.stats.rx_bytes'] || latestSource.data?.interfaces?.interfaces?.stats?.rx_bytes || 0);
            netTxBytes = sumArray(latestSource['data.interfaces.interfaces.stats.tx_bytes'] || latestSource.data?.interfaces?.interfaces?.stats?.tx_bytes || 0);
        }

        setLatestStats({
          cpu: Number(cpuPercent),
          memory: { 
            used: Number((memUsedMb / 1024).toFixed(1)), 
            total: Number((memTotalMb / 1024).toFixed(1)) 
          },
          disk: { 
            used: Number(diskUsedGb.toFixed(1)), 
            total: Number(diskTotalGb.toFixed(1)) 
          },
          network: { 
            rx: Number((netRxBytes / (1024 * 1024)).toFixed(2)), 
            tx: Number((netTxBytes / (1024 * 1024)).toFixed(2)) 
          },
          lastSeen: getField(latestSource, 'data.timestamp', 'data.timestamp') || latestSource['@timestamp']
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

  const totalLogs = logs.length;
  const totalPages = Math.ceil(totalLogs / itemsPerPage);
  const startRow = totalLogs === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalLogs);
  
  const currentLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, page, itemsPerPage]);

  const highlightJson = (json: object) => {
    const jsonString = JSON.stringify(json, null, 2);
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-[#ce9178]';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = 'text-[#9cdcfe]';
        } else if (/true|false|null/.test(match)) {
          cls = 'text-[#569cd6]';
        } else {
          cls = 'text-[#b5cea8]';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const handleCopyJson = () => {
    if (selectedLog) {
        navigator.clipboard.writeText(JSON.stringify(selectedLog.rawDoc, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-y-auto space-y-6 animate-in fade-in duration-500 custom-scrollbar relative">
        
        {/* Header & Time Control */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0B1120] p-5 rounded-xl border border-blue-900/30 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Server className="w-6 h-6 text-cyan-400" />
              Sensor Overview: <span className="text-cyan-400">{sensorId || "Unknown"}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLoading ? 'bg-amber-400' : 'bg-green-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isLoading ? 'bg-amber-500' : 'bg-green-500'}`}></span>
              </span>
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4" /> 
                Last seen: <span className="text-slate-200 font-mono">{format(new Date(latestStats.lastSeen), "HH:mm:ss")}</span>
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

        {/* (Stats Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Cpu className="w-5 h-5 text-blue-400" /></div>
              <span className="text-2xl font-bold font-mono text-white">{latestStats.cpu.toFixed(2)}%</span>
            </div>
            <h3 className="text-sm text-slate-400 font-medium mb-2">CPU Usage</h3>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1">
              <div className={`h-1.5 rounded-full ${latestStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-1000`} style={{ width: `${Math.min(latestStats.cpu, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Activity className="w-5 h-5 text-purple-400" /></div>
              <span className="text-2xl font-bold font-mono text-white">
                {((latestStats.memory.used / latestStats.memory.total) * 100).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-sm text-slate-400 font-medium mb-2">Memory Usage ({latestStats.memory.used} / {latestStats.memory.total} GB)</h3>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1">
              <div className="h-1.5 rounded-full bg-purple-500 transition-all duration-1000" style={{ width: `${(latestStats.memory.used / latestStats.memory.total) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg"><HardDrive className="w-5 h-5 text-amber-400" /></div>
              <span className="text-2xl font-bold font-mono text-white">
                {((latestStats.disk.used / latestStats.disk.total) * 100).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-sm text-slate-400 font-medium mb-2">Disk Usage ({latestStats.disk.used} / {latestStats.disk.total} GB)</h3>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1">
              <div className="h-1.5 rounded-full bg-amber-500 transition-all duration-1000" style={{ width: `${(latestStats.disk.used / latestStats.disk.total) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Wifi className="w-5 h-5 text-emerald-400" /></div>
              <div className="flex flex-col items-end">
                 <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">↓ {latestStats.network.rx} MB</span>
                 <span className="text-sm font-bold font-mono text-blue-400 flex items-center gap-1">↑ {latestStats.network.tx} MB</span>
              </div>
            </div>
            <h3 className="text-sm text-slate-400 font-medium mb-2">Network (Total Traffic)</h3>
            <div className="text-xs text-slate-500">Cumulative interface usage</div>
          </div>
        </div>

        {/* (Graph + Table) */}
        <div className="bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="p-5 border-b border-blue-900/30">
            <h3 className="text-lg font-bold text-white">Connection History</h3>
          </div>
          
          <div className="p-5 h-[280px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-slate-500">Loading graph data...</div>
              </div>
            ) : (
              <SensorOverviewHistogram data={chartData} interval={chartInterval} />
            )}
          </div>

          <div className="h-[400px] overflow-y-auto border-t border-blue-900/30 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#020617] sticky top-0 z-10 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-blue-900/50 shadow-sm">
                <tr>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617]">Timestamp</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617]">Status</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617]">IP Address</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617]">Log Type</th>
                  <th className="p-4 border-b border-blue-900/50 bg-[#020617] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500 animate-pulse">Fetching connection logs...</td></tr>
                ) : currentLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500">No connection logs found for this time range.</td></tr>
                ) : (
                  currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-900/10 transition-colors text-[13px] group">
                      <td className="p-4 text-slate-300 font-mono">{format(new Date(log.timestamp), "M/d/yyyy, h:mm:ss a")}</td>
                      <td className="p-4 font-bold text-emerald-400">{log.status}</td>
                      <td className="p-4 text-slate-300">{log.ip}</td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">{log.logType}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => { setSelectedLog(log); setShowDetailModal(true); setIsCopied(false); }}
                          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 🚀 4. Footer Pagination */}
          <div className="flex-none flex items-center justify-between sm:justify-end px-6 py-4 border-t border-blue-900/50 bg-[#020617] z-20 gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Rows per page</span> 
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
                  <div>{startRow}-{endRow} of {totalLogs}</div> 
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

      {/* JSON Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-blue-900/30 flex-none bg-[#020617]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-cyan-400" /> RAW JSON DATA
                    </h3>
                    <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-[#0d1117] no-scrollbar">
                    <pre
                      className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all select-text"
                      dangerouslySetInnerHTML={{ __html: highlightJson(selectedLog.rawDoc) }}
                    />
                </div>

                <div className="p-4 border-t border-blue-900/30 bg-[#020617] flex justify-between items-center flex-none">
                    <button onClick={handleCopyJson} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Copied!" : "Copy JSON"}
                    </button>
                    <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700">Close</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}