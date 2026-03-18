"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner"; 
import { profileApi } from "@/src/modules/auth/api/profile.api"; 

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPhoneToE164 = (phone: string) => {
  if (!phone) return phone;
  
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '+66' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('66') && !cleaned.startsWith('+66')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

export function UpdateProfileModal({ isOpen, onClose }: UpdateProfileModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);     
  const [isFetching, setIsFetching] = useState(false);   
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    secondaryEmail: "",
  });

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        const orgId = localStorage.getItem("orgId") || "temp";
        const userName = localStorage.getItem("userName") || "admin_super"; 

        const res = await profileApi.getUserByUserName(orgId, userName);
        
        const userData = res?.user || {};

        const loadedData = {
          username: userData.userName || userName,
          email: userData.userEmail || "",
          firstName: userData.name || "",
          lastName: userData.lastName || "",
          phone: userData.phoneNumber || "",
          secondaryEmail: userData.secondaryEmail || "",
        };

        setFormData(loadedData);
        setInitialData(loadedData);
      } catch (error: any) {
        console.error("Fetch profile error:", error);
        toast.error("Failed to load profile data.");
      } finally {
        setIsFetching(false);
      }
    };

    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      fetchProfile(); 
    } else {
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const orgId = localStorage.getItem("orgId") || "temp";
      
      const formattedPhone = formatPhoneToE164(formData.phone);
      
      const payload = {
        name: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formattedPhone, 
        secondaryEmail: formData.secondaryEmail,
      };

      await profileApi.updateUserByUserName(orgId, formData.username, payload);
      
      toast.success("Profile updated successfully!");
      
      const updatedData = { ...formData, phone: formattedPhone };
      setFormData(updatedData);
      setInitialData(updatedData); 
      
      onClose();
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile.");
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={handleCloseAttempt}
      ></div>

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-3xl bg-[#0B1120] border border-blue-900/30 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-blue-900/30 bg-[#0F1629]/50 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide uppercase">Update Profile</h2>
            <p className="text-sm text-slate-400 mt-1">Manage your account information and preferences.</p>
          </div>
          <button
            onClick={handleCloseAttempt}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 relative z-10 min-h-[300px]">
          {isFetching ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1120]/80 z-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-400 text-sm">Loading profile data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Username"
                  value={formData.username}
                  disabled
                  readOnly
                />
                <InputField
                  label="Email Address"
                  value={formData.email}
                  disabled
                  readOnly
                />
              </div>

              <div className="h-px w-full bg-blue-900/20"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e: any) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
                <InputField
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e: any) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Phone Number"
                  placeholder="e.g. 0812345678"
                  value={formData.phone}
                  onChange={(e: any) => setFormData({...formData, phone: e.target.value})}
                  required
                />
                <InputField
                  label="Secondary Email"
                  placeholder="Optional secondary email"
                  value={formData.secondaryEmail}
                  onChange={(e: any) => setFormData({...formData, secondaryEmail: e.target.value})}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-blue-900/30 bg-[#0F1629]/30 relative z-10">
          <button
            onClick={handleCloseAttempt}
            className="px-6 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all uppercase"
            disabled={isLoading || isFetching}
          >
            Cancel
          </button>

          <button 
            onClick={handleSave}
            disabled={isLoading || isFetching} 
            className={`px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-lg min-w-[120px] transition-all flex items-center justify-center gap-2 uppercase ${
              (isLoading || isFetching) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? "Saving" : "Save"}
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"></div>
            <div className="relative bg-[#0F1629] border border-blue-900/50 rounded-xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Discard Changes?</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">
                You have unsaved changes. Are you sure you want to leave?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => {
                    setShowConfirmClose(false);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-900/20 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, disabled, readOnly, ...props }: any) {
  const isLocked = disabled || readOnly;

  return (
    <div className="space-y-2">
      <label className="text-[12px] text-slate-400 font-bold uppercase tracking-wider ml-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full bg-[#162032] border border-blue-900/30 text-slate-200 text-sm rounded-lg px-4 py-3 outline-none transition-all ${
          isLocked 
            ? "cursor-default select-none opacity-60 text-slate-500" 
            : "focus:border-cyan-500 hover:border-blue-700"
        }`}
      />
    </div>
  );
}