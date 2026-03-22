"use client";

import { Navbar } from "@/src/components/layout/navbar";
import { ComingSoon } from "@/src/components/ui/coming-soon";
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

export default function OverviewPage() {
  const { language } = useLanguage();
  const t = translations.overview[language];
  const tAudit = translations.auditLog[language];

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-blue-100 font-sans overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#020617] p-6">
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
            
            <ComingSoon 
              title={t.title} 
              description={tAudit.description} 
            />

        </div>
      </main>
    </div>
  );
}