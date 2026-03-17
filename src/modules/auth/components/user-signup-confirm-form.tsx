"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { userApi } from "@/src/modules/auth/api/user.api";
import {
  userSignupFormSchema,
  UserSignupFormData,
} from "@/src/modules/auth/schema/signup-confirm.schema";

const ReqItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <li className={`flex items-start gap-2 text-[11px] sm:text-xs transition-colors duration-200 ${isValid ? "text-cyan-400" : "text-slate-500"}`}>
    <span className="mt-[1px]">•</span>
    <span className={isValid ? "opacity-100 font-medium" : "opacity-70"}>{text}</span>
  </li>
);

export function UserSignupConfirmForm({
  organization, token, username, email, orgUserId, dictionary,
}: any) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const t = dictionary?.userSignup || {};
  const reqsDict = dictionary?.passwordRequirements || {};
  const decodedUserInfo = dictionary?.userInfo || {};

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UserSignupFormData>({
    resolver: zodResolver(userSignupFormSchema),
    mode: "onChange",
  });

  const password = watch("password") || "";
  const reqs = {
    length: password.length >= 7 && password.length <= 15,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit = async (data: UserSignupFormData) => {
    setIsSubmitting(true);
    try {
      const response = await userApi.confirmInvite(organization, token, username, {
        email,
        userName: username,
        password: data.password,
        name: data.firstName,
        lastname: data.lastName,
        invitedBy: decodedUserInfo?.InvitedBy || null,
        orgUserId: orgUserId || decodedUserInfo?.OrgUserId,
        orgType: decodedUserInfo?.OrgType || null
      });

      if (response?.status === "OK" || response === "OK") {
        toast.success(t.success || "Registration Completed Successfully");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        throw new Error(response?.description || "Signup failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.description || err?.message || "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t.title || "Complete Your Registration"}</h1>
        <p className="text-slate-400 text-sm">{t.subtitle || "Please fill in your details to complete registration"}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Read Only Section */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">{t.username || "Username"}</label>
            <input type="text" value={username} disabled className="w-full bg-[#0f172a] border border-blue-900/20 text-slate-500 text-sm rounded-lg px-4 py-2.5 cursor-not-allowed select-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">{t.email || "Email"}</label>
            <input type="text" value={email} disabled className="w-full bg-[#0f172a] border border-blue-900/20 text-slate-500 text-sm rounded-lg px-4 py-2.5 cursor-not-allowed select-none" />
          </div>
        </div>

        <div className="h-px bg-blue-900/20 my-2" />

        {/* First & Last Name Section (Stacked) */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">First Name <span className="text-red-500">*</span></label>
            <input 
              {...register("firstName")} 
              placeholder="John"
              className={`w-full bg-[#162032] border ${errors.firstName ? 'border-red-500/50 focus:border-red-500' : 'border-blue-900/30 focus:border-cyan-500/50'} text-white text-sm rounded-lg px-4 py-2.5 outline-none transition-all`} 
            />
            {errors.firstName && <p className="text-red-500 text-xs ml-1 mt-1">This field is required</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Last Name <span className="text-red-500">*</span></label>
            <input 
              {...register("lastName")} 
              placeholder="Doe"
              className={`w-full bg-[#162032] border ${errors.lastName ? 'border-red-500/50 focus:border-red-500' : 'border-blue-900/30 focus:border-cyan-500/50'} text-white text-sm rounded-lg px-4 py-2.5 outline-none transition-all`} 
            />
            {errors.lastName && <p className="text-red-500 text-xs ml-1 mt-1">This field is required</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                {...register("password")} 
                type={showPassword ? "text" : "password"} 
                placeholder="********"
                className={`w-full bg-[#162032] border ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-blue-900/30 focus:border-cyan-500/50'} text-white text-sm rounded-lg pl-4 pr-10 py-2.5 outline-none transition-all`} 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs ml-1 mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                {...register("confirmPassword")} 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="********"
                className={`w-full bg-[#162032] border ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-blue-900/30 focus:border-cyan-500/50'} text-white text-sm rounded-lg pl-4 pr-10 py-2.5 outline-none transition-all`} 
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs ml-1 mt-1">Passwords do not match</p>}
          </div>
        </div>

        {/* Password Requirements Box (Blue BG) */}
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-5 mt-2">
          <h4 className="text-[13px] font-bold text-blue-300 mb-3 tracking-wide">{reqsDict.title || "Password Requirements:"}</h4>
          <ul className="space-y-1.5 ml-1">
            <ReqItem isValid={reqs.length} text={reqsDict.req1 || "Password must be between 7-15 characters"} />
            <ReqItem isValid={reqs.upper} text={reqsDict.req2 || "Password must contain at least one uppercase letter"} />
            <ReqItem isValid={reqs.lower} text={reqsDict.req3 || "Password must contain at least one lowercase letter"} />
            <ReqItem isValid={reqs.special} text={reqsDict.req4 || "Password must contain at least one special character"} />
          </ul>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : (t.submit || "Complete Registration")}
        </button>

        {/* Footer with Divider */}
        <div className="pt-6 border-t border-blue-900/30 mt-4">
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            {t.terms || "By completing registration, you agree to our Terms of Service and Privacy Policy."}
          </p>
        </div>
      </form>
    </div>
  );
}