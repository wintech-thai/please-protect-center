"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, X, Loader2, AlertTriangle, Cpu, Tag as TagIcon } from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar";
import { toast } from "sonner"; 
import { agentApi } from "@/src/modules/fleet/api/agent.api";

import { useLanguage } from "@/src/context/LanguageContext";
import { agentTranslations } from "@/src/locales/agentdict";

export default function UpdateSensorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sensorId = params?.id as string;
  
  const { language } = useLanguage();
  const t = agentTranslations.updateSensor[language];
  
  const returnToId = searchParams.get("prevHighlight") || sensorId;

  // --- States ---
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ agentCode: "", description: "", tags: [] as string[] });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const [originalData, setOriginalData] = useState({ agentCode: "", description: "", tags: "" });

  useEffect(() => {
    const fetchSensorData = async () => {
      if (!sensorId) return;
      try {
        setIsLoadingData(true);
        const orgId = localStorage.getItem("orgId") || "temp";
        const response = await agentApi.getAgentById(orgId, sensorId);
        
        const agentData = response?.agent || response?.data || response;

        if (!agentData || response?.status === "NOT_FOUND") {
            toast.error(language === "TH" ? "ไม่พบข้อมูลเซนเซอร์" : "Sensor not found");
            router.push("/fleet/sensor");
            return;
        }

        const sensorTags = agentData.tags ? agentData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
        
        setFormData({ 
            agentCode: agentData.code || "", 
            description: agentData.description || "", 
            tags: sensorTags 
        });
        
        setOriginalData({ 
            agentCode: agentData.code || "",
            description: agentData.description || "", 
            tags: sensorTags.slice().sort().join(',') 
        });
      } catch (error) {
        toast.error(t.toast.loadError);
        router.push("/fleet/sensor");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchSensorData();
  }, [sensorId, router, language, t.toast.loadError]);

  const checkIsDirty = () => {
    if (formData.agentCode !== originalData.agentCode) return true;
    if (formData.description !== originalData.description) return true;
    if (formData.tags.slice().sort().join(',') !== originalData.tags) return true;
    if (tagInput.trim() !== "") return true;
    return false;
  };

  const goBackWithHighlight = () => {
    router.push(`/fleet/sensor?highlight=${returnToId}`);
  };

  const handleCancel = () => {
     if (checkIsDirty()) setShowExitDialog(true);
     else goBackWithHighlight();
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.agentCode.trim()) {
        newErrors.agentCode = language === "TH" ? "กรุณากรอกรหัสเซนเซอร์" : "Sensor Code is required";
    }
    if (!formData.description.trim()) {
        newErrors.description = language === "TH" ? "กรุณากรอกคำอธิบาย" : "Description is required";
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;
    
    if (!checkIsDirty()) { goBackWithHighlight(); return; }

    setIsSubmitting(true);
    try {
      const orgId = localStorage.getItem("orgId") || "temp";
      let finalTags = [...formData.tags];
      if (tagInput.trim() && !finalTags.includes(tagInput.trim())) finalTags.push(tagInput.trim());

      const payload = { 
        Code: formData.agentCode, 
        Description: formData.description, 
        Tags: finalTags.join(",") 
      };

      const response = await agentApi.updateAgentById(orgId, sensorId, payload);
      
      if (response && response.status !== "OK") {
        throw new Error(response.description || t.toast.updateError);
      }

      toast.success(t.toast.updateSuccess); 
      goBackWithHighlight();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.description || error?.message || t.toast.updateError;
      toast.error(errorMsg); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col h-screen bg-[#020617]"><Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium">{language === "TH" ? "กำลังโหลดข้อมูล..." : "Loading sensor data..."}</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      <div className="flex-none pt-6 px-4 md:px-8 mb-4 relative z-10">
        <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    {t.title} 
                    <span className="text-xs font-normal text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 font-mono">
                      {originalData.agentCode}
                    </span>
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">{t.subHeader}</p> 
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar flex flex-col">
        <div className="px-4 md:px-8 w-full flex-1 flex flex-col"> 
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 shadow-sm flex-1 flex flex-col">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3 flex-none">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    {t.infoTitle}
                </h2>

                <div className="space-y-8 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sensor Code */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> {t.labels.code} <span className="text-red-400">*</span>
                            </label>
                            <input 
                                type="text" 
                                value={formData.agentCode}
                                onChange={e => setFormData({...formData, agentCode: e.target.value})}
                                className={`w-full bg-slate-950 border ${errors.agentCode ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-sm font-mono`}
                                placeholder={language === "TH" ? "ระบุรหัสเซนเซอร์" : "e.g. SENSOR-001"}
                            />
                            {errors.agentCode && <p className="text-red-400 text-xs">{errors.agentCode}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                {t.labels.description} <span className="text-red-400">*</span> 
                            </label>
                            <input 
                                type="text" 
                                placeholder={language === "TH" ? "ระบุคำอธิบายวัตถุประสงค์" : "Describe this sensor's purpose"}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className={`w-full bg-slate-950 border ${errors.description ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-sm`}
                            />
                            {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
                        </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <TagIcon className="w-4 h-4" /> {t.labels.tags}
                        </label>
                        <div className={`w-full bg-slate-950 border border-slate-700 focus-within:border-blue-500 rounded-lg px-3 py-2 min-h-[52px] flex flex-wrap gap-2 items-center transition-all`}>
                            {formData.tags.map(tag => (
                                <span key={tag} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                                    {tag}
                                    <button onClick={() => setFormData(p => ({...p, tags: p.tags.filter(t => t !== tag)}))} className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <input 
                                type="text" value={tagInput} 
                                onChange={e => setTagInput(e.target.value)} 
                                onKeyDown={e => {
                                  if(e.key === 'Enter' && tagInput.trim()) {
                                    if (!formData.tags.includes(tagInput.trim())) {
                                        setFormData(p => ({...p, tags: [...p.tags, tagInput.trim()]}));
                                    }
                                    setTagInput("");
                                  }
                                }}
                                placeholder={formData.tags.length === 0 ? (language === "TH" ? "เพิ่มแท็ก..." : "Add tags...") : ""} 
                                className="bg-transparent outline-none text-slate-200 flex-1 min-w-[150px] text-sm py-1.5"
                            />
                        </div>
                        <p className="text-xs text-slate-500">{language === "TH" ? "กด Enter เพื่อเพิ่มแท็ก" : "Press Enter to add tags."}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm uppercase">
                {t.buttons.cancel}
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2 min-w-[140px] uppercase tracking-wide"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.buttons.save}
            </button>
      </div>

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white">{t.modal.exitTitle}</h3> 
                <p className="text-sm text-slate-400 mt-2 mb-6">{t.modal.exitMessage}</p> 
                <div className="flex justify-end gap-3 w-full">
                    <button onClick={() => setShowExitDialog(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 uppercase">
                        {t.buttons.stay}
                    </button>
                    <button onClick={goBackWithHighlight} className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg transition-all uppercase">
                        {t.buttons.leave}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}