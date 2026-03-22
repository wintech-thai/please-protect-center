"use client";

import { CheckCircle2, Building2, User, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

interface InviteData {
  Email: string;
  UserName: string;
  InvitedBy: string;
  [key: string]: any;
}

interface UserInviteConfirmFormProps {
  orgId: string;
  inviteData: InviteData | null;
  isSubmitting: boolean;
  errorDecode: boolean;
  onSubmit: () => void;
}

export function UserInviteConfirmForm({ 
  orgId, 
  inviteData, 
  isSubmitting, 
  errorDecode, 
  onSubmit 
}: UserInviteConfirmFormProps) {
  
  const { language } = useLanguage();
  const t = (translations as any).inviteConfirm[language];

  // กรณีถอดรหัส URL ไม่ผ่าน
  if (errorDecode) {
    return (
      <div className="p-6 text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3 opacity-80" />
        <p className="text-red-400 font-medium">{t.error}</p>
      </div>
    );
  }

  // ระหว่างโหลดข้อมูล
  if (!inviteData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-10 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-500" />
        <p>{t.loadingVerify}</p>
      </div>
    );
  }

  // UI หลัก
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <p className="text-slate-300">{t.inviteMessage}</p>
        <div className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-lg text-cyan-400 font-bold text-lg uppercase tracking-widest shadow-inner">
          <Building2 className="w-5 h-5" />
          {orgId}
        </div>
      </div>

      <div className="bg-[#020617] p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">{t.username}</p>
            <p className="text-sm font-medium text-slate-200">{inviteData.UserName || "-"}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">{t.email}</p>
            <p className="text-sm font-medium text-slate-200">{inviteData.Email || "-"}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-slate-500">
        {t.invitedBy} <span className="font-medium text-slate-400">{inviteData.InvitedBy || t.systemAdmin}</span>
      </p>

      <button 
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        {isSubmitting ? t.confirmingButton : t.acceptButton}
      </button>
    </div>
  );
}