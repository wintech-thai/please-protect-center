"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
import { 
  ChevronLeft, 
  X, 
  ChevronRight, 
  ChevronLeft as ChevronLeftIcon,
  ChevronDown,
  Loader2,
  Check,
  Copy,
  Key,
  AlertTriangle
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar";
import { toast } from "sonner"; 
import { roleApi } from "@/src/modules/auth/api/role.api";
import { apiKeyApi } from "@/src/modules/auth/api/api-key.api";

interface RoleItem {
  id: string;
  name: string;
  desc?: string; 
}

export default function CreateApiKeyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [returnToId, setReturnToId] = useState<string | null>(null);
  const [createdKeyId, setCreatedKeyId] = useState<string | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    keyName: "",
    description: "",
    customRole: "",
  });

  // --- Roles State ---
  const [customRolesList, setCustomRolesList] = useState<RoleItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Transfer List State ---
  const [leftRoles, setLeftRoles] = useState<RoleItem[]>([]);
  const [rightRoles, setRightRoles] = useState<RoleItem[]>([]);
  const [checkedLeft, setCheckedLeft] = useState<string[]>([]);
  const [checkedRight, setCheckedRight] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  // --- Success Modal State ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdToken, setCreatedToken] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const prevHighlight = searchParams.get("prevHighlight");
    if (prevHighlight) {
        setReturnToId(prevHighlight); 
        const params = new URLSearchParams(searchParams.toString());
        params.delete("prevHighlight");
        window.history.replaceState(null, '', params.toString() ? `${pathname}?${params.toString()}` : pathname);
    }
  }, [searchParams, pathname]);

  const goBack = () => {
    if (returnToId) {
        router.push(`/admin/api-keys?highlight=${returnToId}`);
    } else {
        router.push("/admin/api-keys");
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      try {
        const orgId = localStorage.getItem("orgId") || "temp";
        
        const [rolesRes, customRolesRes] = await Promise.all([
          roleApi.getRoles(orgId, { limit: 100 }),
          roleApi.getCustomRoles(orgId, { limit: 100 })
        ]);

        const sysRoles = rolesRes?.data || rolesRes || [];
        setLeftRoles(sysRoles.map((r: any) => ({
          id: r.roleId || r.id,
          name: r.roleName || r.name,
          desc: r.roleDescription || r.description
        })));

        const cusRoles = customRolesRes?.data || customRolesRes || [];
        setCustomRolesList(cusRoles.map((cr: any) => ({
          id: cr.customRoleId || cr.roleId || cr.id,
          name: cr.customRoleName || cr.roleName || cr.name
        })));

      } catch (error: any) {
        console.error("Failed to load roles:", error);
        toast.error("Failed to load roles data");
      } finally {
        setIsLoadingData(false);
      }
    };
    
    initData();
  }, []);

  const handleCheck = (id: string, side: "left" | "right") => {
    if (side === "left") {
      setCheckedLeft(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setCheckedRight(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const moveRight = () => {
    const toMove = leftRoles.filter(r => checkedLeft.includes(r.id));
    setRightRoles(prev => [...prev, ...toMove]);
    setLeftRoles(prev => prev.filter(r => !checkedLeft.includes(r.id)));
    setCheckedLeft([]);
  };

  const moveLeft = () => {
    const toMove = rightRoles.filter(r => checkedRight.includes(r.id));
    setLeftRoles(prev => [...prev, ...toMove]);
    setRightRoles(prev => prev.filter(r => !checkedRight.includes(r.id)));
    setCheckedRight([]);
  };

  const handleCancel = () => {
    const isDirty = formData.keyName.trim() !== "" || formData.description.trim() !== "" || formData.customRole !== "" || rightRoles.length > 0;
    if (isDirty) setShowExitDialog(true);
    else goBack(); 
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.keyName.trim()) newErrors.keyName = "Key Name is required"; 
    if (!formData.description.trim()) newErrors.description = "Description is required";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    
    try {
        const orgId = localStorage.getItem("orgId") || "temp";
        const payload = {
            KeyName: formData.keyName,               
            KeyDescription: formData.description,    
            CustomRoleId: formData.customRole ? formData.customRole : null,
            Roles: rightRoles.map(r => r.name.toUpperCase()), 
        };

        const response: any = await apiKeyApi.addApiKey(orgId, payload);
        
        toast.success("API Key created successfully!");
        
        const newId = response?.apiKey?.keyId || response?.data?.apiKey?.keyId;
        const newToken = response?.apiKey?.apiKey || response?.data?.apiKey?.apiKey || "NO_TOKEN_RETURNED";
        
        setCreatedKeyId(newId);
        setCreatedToken(newToken);
        
        setShowSuccessModal(true);

    } catch (error: any) {
        console.error("Create API Key Error:", error);
        
        let errorMsg = "Failed to create API key";
        if (error?.response?.data?.errors) {
            const firstErrorKey = Object.keys(error.response.data.errors)[0];
            errorMsg = error.response.data.errors[firstErrorKey][0];
        } else {
            errorMsg = error?.response?.data?.description || error?.message || errorMsg;
        }

        toast.error(errorMsg);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(createdToken);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    if (createdKeyId) {
        router.push(`/admin/api-keys?highlight=${createdKeyId}`);
    } else {
        goBack();
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col h-screen bg-[#020617]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span>Loading Data...</span> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      {/* Header Section */}
      <div className="flex-none pt-6 px-4 md:px-8 mb-4 relative z-10">
        <div className="flex items-center gap-4">
            <button 
                onClick={handleCancel} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Create API Key</h1>
                <p className="text-slate-400 text-sm mt-0.5">Generate a new authentication key for system integrations</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
        <div className="px-4 md:px-8 space-y-6 w-full"> 
            
            {/* Key Information Box */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    Key Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Key Name <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder="e.g. Sentinel-Integration-01"
                            value={formData.keyName}
                            onChange={e => setFormData({...formData, keyName: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.keyName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                        {errors.keyName && <p className="text-red-400 text-xs">{errors.keyName}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder="What is this key used for?"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className={`w-full bg-slate-950 border ${errors.description ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm`}
                        />
                        {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
                    </div>
                </div>
            </div>

            {/* Roles Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    Roles & Permissions
                </h2>
                
                <div className="mb-6 max-w-xl">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Custom Role Template (Optional)</label>
                    <div className="relative">
                        <select 
                            value={formData.customRole}
                            onChange={e => setFormData({...formData, customRole: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer text-sm"
                        >
                            <option value="">Select a custom role...</option>
                            {customRolesList.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* System Roles Transfer List */}
                <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">System Roles Assignment</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        
                        {/* Available Roles (Left) */}
                        <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>Available Roles</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">{leftRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                                {leftRoles.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-600 text-xs opacity-70">No roles available</div>
                                ) : (
                                    leftRoles.map(role => (
                                        <div 
                                            key={role.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedLeft.includes(role.id) ? 'bg-blue-600/10 border border-blue-600/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                            onClick={() => handleCheck(role.id, "left")}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedLeft.includes(role.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                                {checkedLeft.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${checkedLeft.includes(role.id) ? 'text-blue-400' : 'text-slate-200'}`}>{role.name}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{role.desc}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Middle Transfer Buttons */}
                        <div className="flex flex-row md:flex-col gap-3 relative z-10">
                             <button onClick={moveRight} disabled={checkedLeft.length === 0} className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                                 <ChevronRight className="w-5 h-5" />
                             </button>
                             <button onClick={moveLeft} disabled={checkedRight.length === 0} className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg">
                                 <ChevronLeftIcon className="w-5 h-5" />
                             </button>
                        </div>

                        {/* Selected Roles (Right) */}
                        <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>Selected Roles</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">{rightRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                                {rightRoles.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800"><ChevronRight className="w-5 h-5 text-slate-700" /></div>
                                        <span className="text-[13px] font-medium">No roles selected</span>
                                    </div>
                                ) : (
                                    rightRoles.map(role => (
                                        <div 
                                            key={role.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedRight.includes(role.id) ? 'bg-red-500/10 border border-red-500/30' : 'hover:bg-slate-900 border border-transparent'}`}
                                            onClick={() => handleCheck(role.id, "right")}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedRight.includes(role.id) ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
                                                {checkedRight.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${checkedRight.includes(role.id) ? 'text-red-400' : 'text-slate-200'}`}>{role.name}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{role.desc}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={handleCancel} className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm">
                Cancel
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center justify-center gap-2 min-w-[100px]"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20"><Key className="w-7 h-7 text-green-400" /></div>
                    <h3 className="text-xl font-bold text-white mb-1">API Key Created!</h3>
                    <p className="text-sm text-slate-400 mb-6 px-4 leading-relaxed">Please copy this key now. You will not be able to see it again.</p>
                    
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 mb-6 shadow-inner">
                        <div className="flex-1 bg-transparent px-3 text-sm text-yellow-400 font-mono select-all text-left break-all">{createdToken}</div>
                        <button onClick={handleCopyToken} className={`p-2 rounded-md transition-all duration-200 flex-none ${isCopied ? "bg-green-500 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <button onClick={handleFinish} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all">
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                <h3 className="text-lg font-bold text-white">Discard Changes?</h3>
                <p className="text-sm text-slate-400 mt-2 mb-6">You have unsaved information. Are you sure you want to leave?</p>
                <div className="flex justify-end gap-3 w-full">
                    <button onClick={() => setShowExitDialog(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">Stay</button>
                    <button onClick={() => goBack()} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg transition-all">Discard</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}