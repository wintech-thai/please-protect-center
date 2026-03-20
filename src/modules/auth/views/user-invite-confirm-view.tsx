"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

import { userApi } from "@/src/modules/auth/api/user.api"; 
import { UserInviteConfirmForm } from "../components/user-invite-confirm-form";

export function UserInviteConfirmView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = (params.slug as string[]) || []; 
  const orgId = slug[0]; 
  const token = slug[1];
  
  const rawData = searchParams.get("data");

  const [inviteData, setInviteData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDecode, setErrorDecode] = useState(false);

  const { language } = useLanguage();
  const t = (translations as any).inviteConfirm[language];

  useEffect(() => {
    if (rawData) {
      try {
        const decodedStr = decodeURIComponent(rawData);
        const jsonStr = atob(decodedStr);
        setInviteData(JSON.parse(jsonStr));
      } catch (error) {
        console.error("Failed to decode invite data:", error);
        setErrorDecode(true);
      }
    } else {
      setErrorDecode(true);
    }
  }, [rawData]);

  const handleAcceptInvite = async () => {
    setIsSubmitting(true);
    const loadingId = toast.loading(t.toastLoading);

    try {
      const payload = {
        email: inviteData.Email,
        username: inviteData.UserName,
        orgUserId: inviteData.OrgUserId
      };

      await userApi.confirmExistingUserInvite(orgId, token, inviteData.UserName, payload); 

      toast.success(t.toastSuccess, { id: loadingId });
      
      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (error: any) {
      console.error("Accept invite error:", error);
      toast.error(error?.response?.data?.description || t.toastError, { id: loadingId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
      
      <div className="absolute pointer-events-none">
        <div className="fixed -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/10 blur-[120px]"></div>
        <div className="fixed -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md bg-[#0B1120] border border-blue-900/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 z-10">
        
        <div className="bg-[#162032] p-6 text-center border-b border-blue-900/30">
          <div className="w-16 h-16 mx-auto bg-[#020617] rounded-xl border border-blue-900/50 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
             <img src="/img/please-protect.svg" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">
            PLEASE-PROTECT <span className="text-cyan-400">CENTER</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        <UserInviteConfirmForm 
          orgId={orgId}
          inviteData={inviteData}
          isSubmitting={isSubmitting}
          errorDecode={errorDecode}
          onSubmit={handleAcceptInvite}
        />
      </div>
    </div>
  );
}