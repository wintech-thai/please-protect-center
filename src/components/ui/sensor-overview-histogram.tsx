"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { format, parseISO } from "date-fns";

interface HistogramProps {
  data: any[];
  interval: string;
}

export function SensorOverviewHistogram({ data, interval }: HistogramProps) {
  const chartData = useMemo(() => {
    return data.map((bucket) => ({
      time: bucket.key_as_string,
      count: bucket.doc_count,
    }));
  }, [data]);

  const formatXAxis = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      if (interval.includes("s") || interval.includes("m")) return format(date, "HH:mm");
      if (interval.includes("h")) return format(date, "HH:mm");
      return format(date, "MMM dd");
    } catch {
      return tickItem;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1120] border border-blue-900/50 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-300 font-mono mb-1">{format(new Date(label), "MMM dd, yyyy HH:mm:ss")}</p>
          <p className="text-green-400 font-bold">
            Connections: <span className="text-white">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No connection data available</div>;
  }

  return (
    <div className="w-full h-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatXAxis} 
            stroke="#475569" 
            fontSize={11} 
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#10b981" /> /* สีเขียว Emerald */
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}