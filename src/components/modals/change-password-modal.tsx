"use client";

import { X, Loader2 } from "lucide-react"; 
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { profileApi } from "@/src/modules/auth/api/profile.api"; 

import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const { language } = useLanguage();
  const t = translations.changePassword[language];

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string) => {
    if (password.length < 7 || password.length > 15) {
      return t.validateLength; 
    }
    if (!/[a-z]/.test(password)) {
      return t.validateLower; 
    }
    if (!/[A-Z]/.test(password)) {
      return t.validateUpper; 
    }
    if (!/[!@#]/.test(password)) {
      return t.validateSpecial; 
    }
    return null;
  };

  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t.errorFields); 
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.errorMismatch); 
      return;
    }

    setIsLoading(true);
    
    try {
      const orgId = localStorage.getItem("orgId") || "temp";
      const userName = localStorage.getItem("user_name") || localStorage.getItem("username") || "";
      
      if (!userName) {
        toast.error(t.errorUserNotFound); 
        return;
      }

      const payload = {
        userName: userName,
        currentPassword: currentPassword,
        newPassword: newPassword
      };

      await profileApi.updatePassword(orgId, payload);

      toast.success(t.success);
      onClose(); 
    } catch (error: any) {
      console.error("Change password error:", error);
      toast.error(error?.response?.data?.message || t.errorFailed);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div
        className={`relative w-full max-w-[500px] bg-[#0B1120] border border-blue-900/20 rounded-[20px] shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="px-8 pt-8 pb-3 relative z-10">
          <div className="flex justify-between items-start">
            <h2 className="text-[22px] font-bold text-white tracking-tight">
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[12px] text-yellow-500/90 font-medium mt-1.5 tracking-wide">
            {t.desc}
          </p>
        </div>

        <div className="px-8 py-6 space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-[14px] font-bold text-white">{t.current}</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder={t.ph_current}
              className="w-full px-4 py-3.5 bg-[#020617] border border-blue-900/40 rounded-xl outline-none text-slate-200 placeholder:text-slate-700 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-bold text-white">{t.new}</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder={t.ph_new}
              className="w-full px-4 py-3.5 bg-[#020617] border border-blue-900/40 rounded-xl outline-none text-slate-200 placeholder:text-slate-700 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-bold text-white">{t.confirm}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t.ph_confirm}
              className="w-full px-4 py-3.5 bg-[#020617] border border-blue-900/40 rounded-xl outline-none text-slate-200 placeholder:text-slate-700 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-[#020617]/50 flex justify-end gap-3 rounded-b-[20px] border-t border-blue-900/20 relative z-10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-7 py-2.5 text-[14px] font-bold text-red-500 bg-red-950/20 border border-red-900/40 rounded-xl hover:bg-red-900/40 transition-all uppercase tracking-wider disabled:opacity-50"
          >
            {t.cancel}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-10 py-2.5 text-[14px] font-black text-white bg-[#0095ff] hover:bg-blue-500 rounded-xl transition-all shadow-[0_4px_20px_rgba(0,149,255,0.3)] disabled:opacity-50 flex items-center justify-center min-w-[130px] uppercase tracking-widest gap-2"
          >
            {isLoading ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" />
                 {t.saving}
               </>
            ) : (
               t.save
            )}
          </button>
        </div>
      </div>
    </div>
  );
}