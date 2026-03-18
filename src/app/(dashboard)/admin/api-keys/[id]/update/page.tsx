"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Navbar } from "@/src/components/layout/navbar";
import { toast } from "sonner";
import { apiKeyApi } from "@/src/modules/auth/api/api-key.api";
import { roleApi } from "@/src/modules/auth/api/role.api";
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

// --- Interfaces ---
interface RoleItem {
  id: string;
  name: string;
  desc?: string;
}

export default function UpdateApiKeyPage() {
  const router = useRouter();
  const params = useParams();
  const keyId = params?.id as string;

  const { language } = useLanguage();
  const t = translations.updateApiKey[language];

  // --- Loading States ---
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    keyName: "",
    description: "",
    customRole: "",
  });

  const [originalData, setOriginalData] = useState<any>(null);
  const [customRolesList, setCustomRolesList] = useState<RoleItem[]>([]);

  // --- Transfer List State ---
  const [leftRoles, setLeftRoles] = useState<RoleItem[]>([]);
  const [rightRoles, setRightRoles] = useState<RoleItem[]>([]);
  const [checkedLeft, setCheckedLeft] = useState<string[]>([]);
  const [checkedRight, setCheckedRight] = useState<string[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!keyId) return;
      try {
        setIsLoadingData(true);
        const orgId = localStorage.getItem("orgId") || "temp";

        const [keyRes, rolesRes, customRes] = await Promise.all([
          apiKeyApi.getApiKeyById(orgId, keyId),
          roleApi.getRoles(orgId, { limit: 100 }),
          roleApi.getCustomRoles(orgId, { limit: 100 }),
        ]);

        const keyInfo = keyRes?.apiKey || keyRes?.data?.apiKey || keyRes || {};
        
        if (!keyInfo || Object.keys(keyInfo).length === 0) {
            toast.error(t.toast.dataNotFound);
            router.push("/admin/api-keys");
            return;
        }

        const sysRolesData = rolesRes?.data || rolesRes || [];
        const customRolesData = customRes?.data || customRes || [];

        setFormData({
          keyName: keyInfo.keyName || "-",
          description: keyInfo.keyDescription || "",
          customRole: keyInfo.customRoleId || "",
        });
        setOriginalData(keyInfo);

        const assignedRoleNames = Array.isArray(keyInfo.roles)
          ? keyInfo.roles
          : [];

        const allMappedRoles: RoleItem[] = sysRolesData.map((r: any) => ({
          id: r.roleId || r.id,
          name: r.roleName || r.name,
          desc: r.roleDescription || r.description,
        }));

        setRightRoles(
          allMappedRoles.filter((r) => assignedRoleNames.includes(r.name)),
        );
        setLeftRoles(
          allMappedRoles.filter((r) => !assignedRoleNames.includes(r.name)),
        );

        setCustomRolesList(
          customRolesData.map((cr: any, index: number) => ({
            id: cr.roleId || cr.customRoleId || cr.id || `fallback-id-${index}`,
            name:
              cr.roleName ||
              cr.customRoleName ||
              cr.name ||
              `Unknown Role ${index}`,
          })),
        );
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast.error(t.toast.loadError); 
      } finally {
        setIsLoadingData(false);
      }
    };

    initData();
  }, [keyId, t.toast.dataNotFound, t.toast.loadError, router]); 

  const checkIsDirty = () => {
    if (!originalData) return false;

    if (formData.description !== (originalData.keyDescription || ""))
      return true;
    if (formData.customRole !== (originalData.customRoleId || "")) return true;

    const originalRolesStr = Array.isArray(originalData.roles)
      ? [...originalData.roles].sort().join(",")
      : "";
    const currentRolesStr = rightRoles
      .map((r) => r.name)
      .sort()
      .join(",");

    return originalRolesStr !== currentRolesStr;
  };

  // --- Handlers สำหรับ Transfer List ---
  const handleCheck = (id: string, side: "left" | "right") => {
    if (side === "left") {
      setCheckedLeft((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    } else {
      setCheckedRight((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    }
  };

  const moveRight = () => {
    const toMove = leftRoles.filter((r) => checkedLeft.includes(r.id));
    setRightRoles((prev) => [...prev, ...toMove]);
    setLeftRoles((prev) => prev.filter((r) => !checkedLeft.includes(r.id)));
    setCheckedLeft([]);
  };

  const moveLeft = () => {
    const toMove = rightRoles.filter((r) => checkedRight.includes(r.id));
    setLeftRoles((prev) => [...prev, ...toMove]);
    setRightRoles((prev) => prev.filter((r) => !checkedRight.includes(r.id)));
    setCheckedRight([]);
  };

  const handleCancel = () => {
    if (checkIsDirty()) setShowExitDialog(true);
    else router.push(`/admin/api-keys?highlight=${keyId}`);
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.description.trim())
      newErrors.description = t.validation.description;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (!checkIsDirty()) {
      router.push(`/admin/api-keys?highlight=${keyId}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const orgId = localStorage.getItem("orgId") || "temp";

      const payload = {
        KeyDescription: formData.description,
        CustomRoleId: formData.customRole || null,
        Roles: rightRoles.map((r) => r.name),
      };

      await apiKeyApi.updateApiKeyById(orgId, keyId, payload);

      toast.success(t.toast.updateSuccess); 
      router.push(`/admin/api-keys?highlight=${keyId}`);
    } catch (error: any) {
      console.error("Update failed:", error);
      const errorMsg =
        error?.response?.data?.description ||
        error?.message ||
        t.toast.updateError; 
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col h-screen bg-[#020617]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span>{t.loading}</span> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      <Navbar />

      {/* Header */}
      <div className="flex-none pt-6 px-4 md:px-8 mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {t.title} 
              <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 font-mono">
                {formData.keyName}
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {t.subHeader} 
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
        <div className="px-4 md:px-8 space-y-6 w-full">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              {t.infoTitle} 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">
                  {t.labels.keyName} 
                </label>
                <input
                  type="text"
                  value={formData.keyName}
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 outline-none cursor-default opacity-75 text-sm font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {t.labels.description} <span className="text-red-500">*</span> 
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t.placeholders.description} 
                  className={`w-full bg-slate-950 border ${errors.description ? "border-red-500/50" : "border-slate-700"} rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 transition-all text-sm`}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
              {t.rolesTitle} 
            </h2>

            <div className="mb-6 max-w-xl">
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                {t.labels.customRole} 
              </label>
              <div className="relative">
                <select
                  value={formData.customRole}
                  onChange={(e) =>
                    setFormData({ ...formData, customRole: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer text-sm"
                >
                  <option value="">{t.labels.selectRole}</option> 
                  {customRolesList.map((role, index) => (
                    <option key={`${role.id}-${index}`} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                {t.labels.systemRoles} 
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Available Roles (Left) */}
                <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                  <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>{t.labels.availableRoles}</span> 
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">
                      {leftRoles.length}
                    </span>
                  </div>
                  <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                    {leftRoles.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-slate-600 text-xs opacity-70">{t.noRolesAvailable}</div>
                    ) : (
                      leftRoles.map((role) => (
                        <div
                          key={role.id}
                          onClick={() => handleCheck(role.id, "left")}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedLeft.includes(role.id) ? "bg-blue-600/10 border border-blue-600/30" : "hover:bg-slate-900 border border-transparent"}`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${checkedLeft.includes(role.id) ? "bg-blue-600 border-blue-600" : "border-slate-600"}`}
                          >
                            {checkedLeft.includes(role.id) && (
                              <div className="w-2 h-2 bg-white rounded-sm" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {role.desc}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-row md:flex-col gap-3">
                  <button
                    onClick={moveRight}
                    disabled={checkedLeft.length === 0}
                    className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 rounded-full border border-slate-700 text-slate-300 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={moveLeft}
                    disabled={checkedRight.length === 0}
                    className="p-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-30 rounded-full border border-slate-700 text-slate-300 transition-all"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Roles (Right) */}
                <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                  <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>{t.labels.selectedRoles}</span> {/* 🚀 ใช้คำแปล */}
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500">
                      {rightRoles.length}
                    </span>
                  </div>
                  <div className="p-2 overflow-y-auto flex-1 custom-scrollbar space-y-1">
                    {rightRoles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-2">
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800"><ChevronRight className="w-5 h-5 text-slate-700" /></div>
                            <span className="text-[13px] font-medium">{t.noRolesSelected}</span>
                        </div>
                    ) : (
                      rightRoles.map((role) => (
                        <div
                          key={role.id}
                          onClick={() => handleCheck(role.id, "right")}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedRight.includes(role.id) ? "bg-red-500/10 border border-red-500/30" : "hover:bg-slate-900 border border-transparent"}`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${checkedRight.includes(role.id) ? "bg-red-500 border-red-500" : "border-slate-600"}`}
                          >
                            {checkedRight.includes(role.id) && (
                              <div className="w-2 h-2 bg-white rounded-sm" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {role.desc}
                            </p>
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
        <button
          onClick={handleCancel}
          className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm uppercase"
        >
          {t.buttons.cancel} 
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all font-medium text-sm flex items-center gap-2 min-w-[100px] justify-center uppercase"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.buttons.save} 
        </button>
      </div>

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {t.modal.title} 
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {t.modal.message} 
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 uppercase"
              >
                {t.buttons.stay} 
              </button>
              <button
                onClick={() =>
                  router.push(`/admin/api-keys?highlight=${keyId}`)
                }
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg uppercase"
              >
                {t.buttons.leave} 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}