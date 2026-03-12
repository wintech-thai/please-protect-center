"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/src/components/layout/navbar";
import { ComingSoon } from "@/src/components/ui/coming-soon";

// --- Mock Data ---
const mockOrganizations = [
  { id: "napbiotec", name: "NAP BIOTEC", shortName: "napbiotec" },
  { id: "chalam", name: "Chalam Farm V1", shortName: "chalam-farm-v1" },
  { id: "rtarf", name: "RTARF HQ", shortName: "rtarf-hq" },
];

export default function OverviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedOrg, setSelectedOrg] = useState(mockOrganizations[0]);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-blue-100 font-sans overflow-hidden">
      
      <Navbar />
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#020617] p-6">
        
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-blue-700/20 rounded-full blur-[100px] animate-pulse"></div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
            
            <ComingSoon 
              title="Dashboard Coming Soon" 
              description="This feature is currently under development."
            />

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}