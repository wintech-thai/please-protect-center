"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
import { 
  ChevronLeft, 
  X, 
  ChevronRight, 
  ChevronLeft as ChevronLeftIcon,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Check,
  Copy,
  UserPlus
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar";

interface RoleItem {
  id: string;
  name: string;
  desc?: string; 
}

export default function CreateUserPage() {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  
  const [returnToId, setReturnToId] = useState<string | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    tags: [] as string[],
    customRole: "",
  });

  const [tagInput, setTagInput] = useState("");
  
  // --- Roles State (Mock Data) ---
  const [customRolesList, setCustomRolesList] = useState<RoleItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leftRoles, setLeftRoles] = useState<RoleItem[]>([]);
  const [rightRoles, setRightRoles] = useState<RoleItem[]>([]);
  const [checkedLeft, setCheckedLeft] = useState<string[]>([]);
  const [checkedRight, setCheckedRight] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  // --- Invite Modal State ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  useEffect(() => {
    const prevHighlight = searchParams.get("prevHighlight");
    if (prevHighlight) {
        setReturnToId(prevHighlight);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("prevHighlight");
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname]);

  const goBack = () => {
    if (returnToId) {
        router.push(`/admin/users?highlight=${returnToId}`);
    } else {
        router.back();
    }
  };

  useEffect(() => {
    setIsLoadingData(true);
    setTimeout(() => {
      setLeftRoles([
        { id: "sr1", name: "Super Admin", desc: "Full system access, manage all modules and users." },
        { id: "sr2", name: "Security Analyst", desc: "Monitor security events and manage threat detection." },
        { id: "sr3", name: "Threat Hunter", desc: "Search for cyber threats and investigate incidents." },
        { id: "sr4", name: "Viewer", desc: "Read-only access to dashboards and reports." },
      ]);
      setCustomRolesList([
        { id: "cr1", name: "System Administrator" },
        { id: "cr2", name: "SOC Analyst Level 1" },
        { id: "cr3", name: "Guest Viewer" },
      ]);
      setIsLoadingData(false);
    }, 500);
  }, []);

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
    const isDirty = formData.username.trim() !== "" || formData.email.trim() !== "" || formData.tags.length > 0 || formData.customRole !== "" || rightRoles.length > 0 || tagInput.trim() !== "";
    if (isDirty) setShowExitDialog(true);
    else goBack(); 
  };

  const handleSubmit = async () => {
    let finalTags = [...formData.tags];
    const pendingTag = tagInput.trim();
    if (pendingTag && !finalTags.includes(pendingTag)) finalTags.push(pendingTag);

    const newErrors: { [key: string]: string } = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (finalTags.length === 0) newErrors.tags = "At least one tag is required";
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setCreatedUserId(`mock-user-${Math.floor(Math.random() * 1000)}`);
        setInviteLink(`https://protect.center/register?token=${Math.random().toString(36).substring(2, 15)}`);
        setShowInviteModal(true);
      }, 1000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinish = () => {
    setShowInviteModal(false);
    if (createdUserId) router.push(`/admin/users?highlight=${createdUserId}`);
    else goBack();
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0F1C]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0095ff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0F1C] text-slate-200 font-sans">
      <Navbar />

      {/* Header Section */}
      <div className="flex-none pt-8 px-6 md:px-10 mb-6">
        <div className="flex items-center gap-4">
            <button 
                onClick={handleCancel} 
                className="w-10 h-10 flex items-center justify-center bg-[#141C2E] hover:bg-[#1e293b] rounded-full transition-colors text-slate-300"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-[24px] font-bold text-white tracking-tight">Create User</h1>
                <p className="text-slate-400 text-[14px] mt-0.5">Add a new user to the organization</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
        <div className="px-6 md:px-10 space-y-6 w-full"> 
            
            {/* User Info Box */}
            <div className="bg-[#141C2E] rounded-xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-[5px] h-6 bg-[#0095ff] rounded-full"></div>
                    <h2 className="text-[18px] font-bold text-white">User Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-white">Username <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            placeholder="e.g. johndoe"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className={`w-full bg-[#0A0F1C] border ${errors.username ? 'border-red-500/50' : 'border-[#1E293B]'} rounded-lg px-4 py-3.5 text-slate-200 outline-none focus:border-[#0095ff]/50 transition-all placeholder:text-slate-600 text-[14px]`}
                        />
                        {errors.username && <p className="text-red-400 text-xs font-medium">{errors.username}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-white">Email <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className={`w-full bg-[#0A0F1C] border ${errors.email ? 'border-red-500/50' : 'border-[#1E293B]'} rounded-lg px-4 py-3.5 text-slate-200 outline-none focus:border-[#0095ff]/50 transition-all placeholder:text-slate-600 text-[14px]`}
                        />
                          {errors.email && <p className="text-red-400 text-xs font-medium">{errors.email}</p>}
                    </div>
                </div>
                
                <div className="space-y-2 mt-6">
                    <label className="text-[14px] font-bold text-white">Tags <span className="text-red-500">*</span></label>
                    <div className={`w-full bg-[#0A0F1C] border ${errors.tags ? 'border-red-500/50' : 'border-[#1E293B] focus-within:border-[#0095ff]/50'} rounded-lg px-4 py-2 min-h-[52px] flex flex-wrap gap-2 items-center transition-all`}>
                        {formData.tags.map(tag => (
                            <span key={tag} className="bg-[#0095ff]/10 border border-[#0095ff]/20 text-[#0095ff] text-[13px] font-semibold px-3 py-1 rounded-md flex items-center gap-1.5">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                            </span>
                        ))}
                        <input 
                            type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                            placeholder={formData.tags.length === 0 ? "Type and press Enter to add tags..." : ""}
                            className="bg-transparent outline-none text-slate-200 flex-1 min-w-[200px] text-[14px] placeholder:text-slate-600 h-full py-1.5"
                        />
                    </div>
                    {errors.tags && <p className="text-red-400 text-xs font-medium">{errors.tags}</p>}
                </div>
            </div>

            {/* Roles Setup Box */}
            <div className="bg-[#141C2E] rounded-xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-[5px] h-6 bg-[#A855F7] rounded-full"></div>
                    <h2 className="text-[18px] font-bold text-white">Roles & Permissions</h2>
                </div>
                
                <div className="mb-8 max-w-md">
                    <label className="text-[14px] font-bold text-white mb-2 block">Custom Role (Optional)</label>
                    <div className="relative">
                        <select 
                            value={formData.customRole}
                            onChange={e => setFormData({...formData, customRole: e.target.value})}
                            className="w-full bg-[#0A0F1C] border border-[#1E293B] rounded-lg px-4 py-3.5 text-slate-200 appearance-none outline-none focus:border-[#0095ff]/50 transition-all cursor-pointer text-[14px]"
                        >
                            <option value="">Select a custom role...</option>
                            {customRolesList.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-[14px] font-bold text-white mb-4">System Roles</h3>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Left List */}
                        <div className="flex-1 w-full bg-[#0A0F1C] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-[#141C2E] border-b border-[#1E293B] text-[13px] font-bold text-slate-300 flex justify-between items-center">
                                <span>Available Roles</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">{leftRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                                {leftRoles.map(role => (
                                    <div 
                                        key={role.id} 
                                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedLeft.includes(role.id) ? 'bg-[#0095ff]/10 border border-[#0095ff]/30' : 'hover:bg-[#141C2E] border border-transparent'}`}
                                        onClick={() => handleCheck(role.id, "left")}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${checkedLeft.includes(role.id) ? 'bg-[#0095ff] border-[#0095ff]' : 'border-slate-600'}`}>
                                            {checkedLeft.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                        </div>
                                        <div>
                                            <p className={`text-[14px] font-bold ${checkedLeft.includes(role.id) ? 'text-[#0095ff]' : 'text-slate-200'}`}>{role.name}</p>
                                            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{role.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transfer Buttons */}
                        <div className="flex flex-row md:flex-col gap-3">
                             <button onClick={moveRight} disabled={checkedLeft.length === 0} className="p-2.5 bg-[#141C2E] hover:bg-[#0095ff] disabled:opacity-30 disabled:hover:bg-[#141C2E] rounded-lg border border-[#1E293B] text-slate-300 hover:text-white transition-all">
                                 <ChevronRight className="w-5 h-5" />
                             </button>
                             <button onClick={moveLeft} disabled={checkedRight.length === 0} className="p-2.5 bg-[#141C2E] hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-[#141C2E] rounded-lg border border-[#1E293B] text-slate-300 hover:text-white transition-all">
                                 <ChevronLeftIcon className="w-5 h-5" />
                             </button>
                        </div>

                        {/* Right List */}
                        <div className="flex-1 w-full bg-[#0A0F1C] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col h-[320px]">
                            <div className="px-4 py-3 bg-[#141C2E] border-b border-[#1E293B] text-[13px] font-bold text-slate-300 flex justify-between items-center">
                                <span>Selected Roles</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">{rightRoles.length}</span>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                                {rightRoles.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                        <div className="w-10 h-10 rounded-full bg-[#141C2E] flex items-center justify-center mb-2"><ChevronRight className="w-5 h-5 text-slate-500" /></div>
                                        <span className="text-[13px] font-medium">No roles selected</span>
                                    </div>
                                ) : (
                                    rightRoles.map(role => (
                                        <div 
                                            key={role.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedRight.includes(role.id) ? 'bg-red-500/10 border border-red-500/30' : 'bg-[#141C2E] border border-[#1E293B] hover:bg-[#1e293b]'}`}
                                            onClick={() => handleCheck(role.id, "right")}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${checkedRight.includes(role.id) ? 'bg-red-500 border-red-500' : 'border-slate-500 bg-[#0A0F1C]'}`}>
                                                {checkedRight.includes(role.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div>
                                                <p className={`text-[14px] font-bold ${checkedRight.includes(role.id) ? 'text-red-400' : 'text-slate-200'}`}>{role.name}</p>
                                                <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{role.desc}</p>
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
      <div className="flex-none px-6 py-4 border-t border-[#1E293B] bg-[#0A0F1C] flex justify-end gap-4 z-10">
            <button 
                onClick={handleCancel} 
                className="px-8 py-2.5 rounded-lg bg-[#3A161E] text-red-500 hover:bg-[#4C1D26] transition-all font-bold text-[14px]"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-10 py-2.5 rounded-lg bg-[#0095ff] hover:bg-blue-500 disabled:opacity-50 text-white shadow-[0_0_15px_rgba(0,149,255,0.2)] transition-all font-bold text-[14px] flex items-center justify-center min-w-[120px]"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-[2px] animate-in fade-in duration-300 px-4">
            <div className="bg-[#141C2E] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md p-8 transform scale-100 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-5 border border-green-500/20">
                        <UserPlus className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">User Created!</h3>
                    <p className="text-[14px] text-slate-400 mb-8">Copy the registration link below and send it to the user to complete their setup.</p>
                    <div className="w-full bg-[#0A0F1C] border border-[#1E293B] rounded-xl p-2 flex items-center gap-2 mb-8">
                        <div className="flex-1 bg-transparent px-3 text-[13px] text-[#0095ff] truncate font-mono select-all text-left">{inviteLink}</div>
                        <button onClick={handleCopyLink} className={`p-2.5 rounded-lg transition-all ${isCopied ? "bg-green-500 text-white" : "bg-[#141C2E] text-[#0095ff] hover:bg-[#1e293b]"}`}>
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <button onClick={handleFinish} className="w-full py-3 rounded-xl bg-[#0095ff] hover:bg-blue-500 text-white font-bold transition-all">
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-[2px] animate-in fade-in duration-200 px-4">
            <div className="bg-[#141C2E] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Discard User?</h3>
                <p className="text-[14px] text-slate-400 mt-2 mb-8">You have unsaved information. Are you sure you want to leave?</p>
                <div className="flex justify-end gap-3 w-full">
                    <button onClick={() => setShowExitDialog(false)} className="flex-1 px-4 py-3 text-[14px] font-bold text-slate-300 bg-[#0A0F1C] hover:bg-[#1E293B] rounded-xl transition-colors border border-[#1E293B]">
                        Stay
                    </button>
                    <button onClick={() => goBack()} className="flex-1 px-4 py-3 text-[14px] font-bold bg-[#e11d48] hover:bg-red-500 text-white rounded-xl transition-all">
                        Discard
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}