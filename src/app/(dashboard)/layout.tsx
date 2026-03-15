"use client";

import { Suspense } from "react"; 
import AuthGuard from "@/src/modules/auth/components/auth-guard"; 
import { Loader2 } from "lucide-react"; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#020617]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0095ff]" />
        </div>
      }>
        {children}
      </Suspense>
    </AuthGuard>
  );
}