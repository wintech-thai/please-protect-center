"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

export function NavbarClean() {
  const { language, setLanguage } = useLanguage();
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B1120]/90 backdrop-blur-md border-b border-blue-900/30 shadow-lg shadow-black/40 text-blue-100">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center bg-[#020617] rounded-lg border border-blue-900/50 p-1 group-hover:border-cyan-500/50 transition-colors">
                <img 
                  src="/img/please-protect.svg" 
                  alt="PLEASE-PROTECT Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white block uppercase">
                PLEASE-PROTECT <span className="text-cyan-400">CENTER</span>
              </span>
            </Link>
          </div>

          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-blue-900/30 rounded-full text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-blue-900/20 transition-all duration-200"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language}</span>
              <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${isLangDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-[150px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-2xl rounded-lg text-blue-100 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => { setLanguage("EN"); setIsLangDropdownOpen(false); }} 
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm ${language === "EN" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400"}`}
                >
                  <div className="flex gap-2"><span>🇬🇧</span> English</div>
                  {language === "EN" && <Check className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={() => { setLanguage("TH"); setIsLangDropdownOpen(false); }} 
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm mt-1 ${language === "TH" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400"}`}
                >
                  <div className="flex gap-2"><span>🇹🇭</span> ภาษาไทย</div>
                  {language === "TH" && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16 w-full shrink-0"></div>
    </>
  );
}