"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UserSignupConfirmForm } from "@/src/modules/auth/components/user-signup-confirm-form";

interface ViewProps {
  slug: string[];
}

function UserSignupConfirmContent({ slug }: ViewProps) {
  const searchParams = useSearchParams();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const orgId = slug?.[0] || "default";
  const token = slug?.[1] || "";

  useEffect(() => {
    setIsMounted(true);
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = atob(dataParam);
        const safeDecoded = decodeURIComponent(escape(decoded)); 
        setUserInfo(JSON.parse(safeDecoded));
      } catch (e) {
        try { setUserInfo(JSON.parse(atob(dataParam))); } 
        catch (err) { console.error("Data parse error", err); }
      }
    }
  }, [searchParams]);

  if (!isMounted) return null;

  const dictionary = {
    userSignup: {
      title: "Complete Your Registration",
      subtitle: "Please fill in your details to complete registration",
      username: "Username",
      email: "Email",
      firstNameLabel: "First Name",
      lastNameLabel: "Last Name",
      password: "Password",
      confirmPassword: "Confirm Password",
      submit: "Complete Registration",
      success: "Registration Completed Successfully",
      terms: "By completing registration, you agree to our Terms of Service and Privacy Policy. This invitation link will expire after use."
    },
    passwordRequirements: {
        title: "Password Requirements:",
        req1: "Password must be between 7-15 characters",
        req2: "Password must contain at least one uppercase letter",
        req3: "Password must contain at least one lowercase letter",
        req4: "Password must contain at least one special character (!, @, #, or #)"
    },
    userInfo: userInfo 
  };

  return (
    <div className="relative z-10 w-full max-w-[480px] px-4">
      <div className="bg-[#0B1120]/95 backdrop-blur-sm border border-blue-900/30 rounded-2xl shadow-2xl p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
          <UserSignupConfirmForm 
              organization={orgId}
              token={token}
              username={userInfo?.UserName || userInfo?.username || ""}
              email={userInfo?.Email || userInfo?.email || ""}
              orgUserId={userInfo?.OrgUserId || userInfo?.orgUserId}
              dictionary={dictionary} 
          />
      </div>
    </div>
  );
}

export default function UserSignupConfirmView({ slug }: ViewProps) {
  return (
    <div className="min-h-screen w-full flex items-start justify-center bg-[#020617] text-white relative overflow-hidden pt-16 md:pt-24 pb-12">
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: "linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
      </div>
      
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none"></div>

      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-blue-500 mt-32" />}>
        <UserSignupConfirmContent slug={slug} />
      </Suspense>
    </div>
  );
}