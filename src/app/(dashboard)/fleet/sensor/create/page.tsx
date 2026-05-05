"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { 
  ChevronLeft, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Check,
  Copy,
  Cpu,
  Tag as TagIcon
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar";
import { toast } from "sonner";
import { agentApi } from "@/src/modules/fleet/api/agent.api";
import { useLanguage } from "@/src/context/LanguageContext";
import { agentTranslations } from "@/src/locales/agentdict";

export default function CreateSensorPage() {
  const router = useRouter();
  
  const { language } = useLanguage();
  const t = agentTranslations.createSensor[language];
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    agentCode: "",
    description: "",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");
  
  // --- UI States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  // --- Result Modal State ---
  const [showResultModal, setShowResultModal] = useState(false);
  const [regResult, setRegResult] = useState({ url: "", apiKey: "" });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const goBack = () => {
    router.push(`/fleet/sensor`);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleCancel = () => {
    const isDirty = formData.agentCode.trim() !== "" || formData.description.trim() !== "" || formData.tags.length > 0 || tagInput.trim() !== "";
    if (isDirty) setShowExitDialog(true);
    else goBack(); 
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

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const orgId = localStorage.getItem("orgId") || "temp";
        
        let finalTags = [...formData.tags];
        const pendingTag = tagInput.trim();
        if (pendingTag && !finalTags.includes(pendingTag)) finalTags.push(pendingTag);

        const payload = {
          Code: formData.agentCode,
          Description: formData.description,
          Tags: finalTags.join(","),
        };

        const response: any = await agentApi.addAgent(orgId, payload);
        
        if (response && response.status !== "OK") {
           throw new Error(response.description || t.toast.error);
        }
  
        const agentData = response?.agent;
        
        if (agentData) {
          const rawUrl = agentData.registrationUrl || "";
          const apiDomain = window.location.origin.replace("web-dev", "api-dev");
          const fixedUrl = rawUrl ? rawUrl.replace(/https?:\/\/[^/]+/, apiDomain) : "";

          setRegResult({
            url: fixedUrl,
            apiKey: agentData.apiKey || ""
          });
          
          toast.success(t.toast.success); 
          setShowResultModal(true);
        } else {
          throw new Error("No agent data received from server");
        }

      } catch (error: any) {
        console.error("Register sensor error:", error);
        let errorMessage = error?.response?.data?.description || error?.message || t.toast.error;
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(t.toast.copy); 
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFinish = () => {
    setShowResultModal(false);
    router.push(`/fleet/sensor`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      {/* Header Section */}
      <div className="flex-none pt-6 px-4 md:px-8 mb-4 relative z-10">
        <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{t.title}</h1> 
                <p className="text-slate-400 text-sm mt-0.5">{t.subHeader}</p> 
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar flex flex-col">
        <div className="px-4 md:px-8 w-full flex-1 flex flex-col"> 
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 shadow-sm flex-1 flex flex-col">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3 flex-none">
                    <span className="w-1 h-5 bg-cyan-500 rounded-full"></span>
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
                                placeholder={t.placeholders.code}
                                value={formData.agentCode}
                                onChange={e => setFormData({...formData, agentCode: e.target.value})}
                                className={`w-full bg-slate-950 border ${errors.agentCode ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-sm font-mono`}
                            />
                            {errors.agentCode && <p className="text-red-400 text-xs">{errors.agentCode}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{t.labels.description} <span className="text-red-400">*</span></label>
                            <input 
                                type="text" 
                                placeholder={t.placeholders.description}
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
                                    <button onClick={() => removeTag(tag)} className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <input 
                                type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                                placeholder={formData.tags.length === 0 ? t.placeholders.tags : ""} 
                                className="bg-transparent outline-none text-slate-200 flex-1 min-w-[200px] text-sm py-1.5"
                            />
                        </div>
                        <p className="text-xs text-slate-500">{language === "TH" ? "กด Enter เพื่อเพิ่มหลายแท็ก" : "Press Enter to add multiple tags."}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm uppercase">
                {t.buttons.cancel}
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2 min-w-[120px] uppercase"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.buttons.register} 
            </button>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                      <CheckCircle2 className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{t.modal.resultTitle}</h3> 
                    <p className="text-sm text-slate-400 mb-6 px-4 leading-relaxed">{t.modal.resultMessage}</p> 
                    
                    {/* URL Box */}
                    <div className="w-full text-left mb-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">{t.labels.url}</label>
                        <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 shadow-inner">
                            <div className="flex-1 bg-transparent px-3 text-xs text-slate-300 truncate font-mono select-all">{regResult.url}</div>
                            <button onClick={() => copyToClipboard(regResult.url, 'url')} className={`p-2 rounded-md transition-all duration-200 ${copiedField === 'url' ? "bg-green-500 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                                {copiedField === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* API Key Box */}
                    <div className="w-full text-left mb-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">{t.labels.apiKey}</label>
                        <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 shadow-inner">
                            <div className="flex-1 bg-transparent px-3 text-sm text-green-400 font-bold truncate font-mono select-all">{regResult.apiKey}</div>
                            <button onClick={() => copyToClipboard(regResult.apiKey, 'key')} className={`p-2 rounded-md transition-all duration-200 ${copiedField === 'key' ? "bg-green-500 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                                {copiedField === 'key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button onClick={handleFinish} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg transition-all uppercase">{t.buttons.done}</button>
                </div>
            </div>
        </div>
      )}

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white">{t.modal.exitTitle}</h3> 
                <p className="text-sm text-slate-400 mt-2 mb-6">{t.modal.exitMessage}</p> 
                <div className="flex justify-end gap-3 w-full">
                    <button onClick={() => setShowExitDialog(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 uppercase">
                        {language === "TH" ? "อยู่ต่อ" : "Stay"}
                    </button> 
                    <button onClick={() => goBack()} className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg transition-all uppercase">
                        {language === "TH" ? "ออก" : "Leave"}
                    </button> 
                </div>
            </div>
        </div>
      )}
    </div>
  );
}