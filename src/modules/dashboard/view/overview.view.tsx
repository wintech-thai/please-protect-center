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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
            
            <ComingSoon 
              title="Dashboard Coming Soon" 
              description="This feature is currently under development."
            />

        </div>
      </main>
      
    </div>
  );
}