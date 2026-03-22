"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  ChevronDown,
  Layers,
  Globe,
  Check,
  User,
  Lock,
  Users,
  Key,
  FileText,
  ShieldAlert,
  PanelLeft,
  Building2,
  Search,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/src/components/ui/tooltip";

import { UpdateProfileModal } from "@/src/components/modals/update-profile-modal";
import { ChangePasswordModal } from "@/src/components/modals/change-password-modal";
import { authApi } from "@/src/modules/auth/api/auth.api";
import { toast } from "sonner";

import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

import { AppVersionDisplay } from "./app-version-display";

// --- Interfaces ---
interface OrgItem {
  id: string;
  name: string;
}

interface NavItem {
  label: string;
  href: string;
  children?: {
    label?: string;
    href?: string;
    icon?: React.ReactNode;
    isDivider?: boolean;
  }[];
}

interface NavbarProps {
  hasSidebar?: boolean;
  onToggleSidebar?: () => void;
}

export function Navbar({ hasSidebar, onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = translations.navbar[language];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [username, setUsername] = useState<string | null>("Admin");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isMobileOrgOpen, setIsMobileOrgOpen] = useState(false);

  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("username");
      if (storedUsername) setUsername(storedUsername);
    }

    const fetchOrganizations = async () => {
      try {
        const orgData = await authApi.getUserAllowedOrg();
        const mappedOrgs = orgData.map((o: any) => {
          if (typeof o === "string") return { id: o, name: o.toUpperCase() };
          return {
            id: o.orgCustomId || o.orgId || o.id,
            name: o.orgName || o.orgCustomId || o.name || "Unknown Org",
          };
        });
        setOrganizations(mappedOrgs);

        const storedOrgId = localStorage.getItem("orgId");
        if (storedOrgId && mappedOrgs.length > 0) {
          const foundOrg = mappedOrgs.find((o: OrgItem) => o.id === storedOrgId);
          if (foundOrg) setSelectedOrg(foundOrg);
          else {
            setSelectedOrg(mappedOrgs[0]);
            localStorage.setItem("orgId", mappedOrgs[0].id);
          }
        } else if (mappedOrgs.length > 0) {
          setSelectedOrg(mappedOrgs[0]);
          localStorage.setItem("orgId", mappedOrgs[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      }
    };
    fetchOrganizations();

    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsideMenu = false;
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) clickedInsideMenu = true;
      });
      if (!clickedInsideMenu) setActiveDropdown(null);
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) setIsLangDropdownOpen(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) setIsProfileDropdownOpen(false);
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) setIsOrgOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrgChange = async (org: OrgItem) => {
    if (!org.id || org.id === "undefined") return;
    setSelectedOrg(org);
    setIsOrgOpen(false);
    setIsMobileOrgOpen(false);
    setSearchQuery("");
    
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);

    const loadingMsg = language === "TH" ? `กำลังสลับไปยัง ${org.name}...` : `Switching to ${org.name}...`;
    const loadingId = toast.loading(loadingMsg);
    
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      const userName = localStorage.getItem("username") || "Admin";
      if (refreshToken) {
        const res = await authApi.refreshToken(org.id, { userName, refreshToken });
        const tokenData = res?.token || res?.data || res;
        if (tokenData?.access_token) {
          localStorage.setItem("accessToken", tokenData.access_token);
          document.cookie = `accessToken=${tokenData.access_token}; path=/; max-age=86400; SameSite=Lax`;
        }
        if (tokenData?.refresh_token) {
          localStorage.setItem("refreshToken", tokenData.refresh_token);
          document.cookie = `refreshToken=${tokenData.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
        }
      }
      localStorage.setItem("orgId", org.id);
      document.cookie = `orgId=${org.id}; path=/; max-age=86400; SameSite=Lax`;
      
      const successMsg = language === "TH" ? `เปลี่ยนหน่วยงานเป็น ${org.name} สำเร็จ` : `Switched to ${org.name}`;
      toast.success(successMsg, { id: loadingId, duration: 2000 }); 
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      const errorMsg = language === "TH" ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" : "Session expired.";
      toast.error(errorMsg, { id: loadingId });
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try { await authApi.signOut(); } catch (e) {} finally {
      localStorage.clear();
      document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "orgId=; path=/; max-age=0; SameSite=Lax";
      toast.success(t.logoutSuccess);
      setTimeout(() => (window.location.href = "/login"), 800);
    }
  };

  const navItems: NavItem[] = useMemo(() => [
    { label: t.overview, href: "/overview", children: [{ label: t.systemOverview, href: "/overview", icon: <Layers className="w-4 h-4 mr-2" /> }] },
    { label: t.administrator, href: "/admin/users", children: [
        { label: t.roles, href: "/admin/custom-roles", icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
        { label: t.users, href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
        { label: t.apiKeys, href: "/admin/api-keys", icon: <Key className="w-4 h-4 mr-2" /> },
        { label: t.audit, href: "/admin/audit-log", icon: <FileText className="w-4 h-4 mr-2" /> },
      ]
    }
  ], [t]);

  const isParentActive = (item: NavItem) => pathname.startsWith(item.href) || item.children?.some((c) => pathname.startsWith(c.href!));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B1120]/90 backdrop-blur-md border-b border-blue-900/30 shadow-lg shadow-black/40 text-blue-100">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasSidebar && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <Link href="/overview" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center bg-[#020617] rounded-lg border border-blue-900/50 p-1 group-hover:border-cyan-500/50 transition-colors">
                <img src="/img/please-protect.svg" alt="PLEASE-PROTECT Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white hidden sm:block uppercase">PLEASE-PROTECT <span className="text-cyan-400">CENTER</span></span>
            </Link>
          </div>

          {/* Desktop Menu Center */}
          <div className="hidden md:flex items-center gap-1 ml-6 flex-1">
            {navItems.map((item) => (
              <div key={item.label} className="relative" ref={(el) => { if (el) dropdownRefs.current[item.label] = el; }}>
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                  className={`flex items-center gap-1 px-4 py-2 text-base font-medium transition-all duration-200 rounded-md ${isParentActive(item) ? "text-cyan-400 bg-blue-500/10" : "text-slate-400 hover:bg-blue-900/20"}`}
                >
                  {item.label} <ChevronDown className={`w-4 h-4 mt-0.5 opacity-70 transition-transform ${activeDropdown === item.label ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === item.label && (
                  <div className="absolute left-0 top-full mt-2 min-w-[220px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-xl rounded-lg animate-in fade-in slide-in-from-top-2">
                    {item.children?.map((subItem, idx) => (
                      <Link
                        key={subItem.label || idx}
                        href={subItem.href!}
                        onClick={() => setActiveDropdown(null)}
                        className={`flex items-center px-3 py-3 text-base rounded-md transition-colors w-full ${pathname === subItem.href ? "bg-blue-500/20 text-cyan-400 font-medium" : "text-slate-400 hover:bg-blue-900/30"}`}
                      >
                        {subItem.icon} {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop Organization Selector */}
            <div className="relative hidden lg:block" ref={orgDropdownRef}>
              <button
                onClick={() => setIsOrgOpen(!isOrgOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#162032]/80 border border-blue-900/50 rounded-lg hover:border-cyan-500/50 transition-colors group"
              >
                <Building2 className="w-4 h-4 text-cyan-500" />
                <span className="font-semibold text-white text-sm max-w-[120px] truncate">{selectedOrg ? selectedOrg.name : "Loading..."}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOrgOpen ? "rotate-180" : ""}`} />
              </button>
              {isOrgOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0B1120] border border-blue-900/50 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-blue-900/30">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#162032] border border-blue-900/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredOrgs.map((org, index) => (
                      <button
                        key={`${org.id}-${index}`}
                        onClick={() => handleOrgChange(org)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex justify-between items-center transition-colors ${selectedOrg?.id === org.id ? "bg-blue-600/20 text-cyan-400 font-semibold" : "text-slate-300 hover:bg-[#162032]"}`}
                      >
                        {org.name}
                        {selectedOrg?.id === org.id && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block mr-2 border-r border-blue-900/30 pr-4 h-8 flex items-center">
                <AppVersionDisplay className="items-end" />
            </div>

            {/* Desktop Language Switcher */}
            <div className="relative hidden sm:block" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-blue-900/30 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-blue-900/20 transition-all duration-200"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{language}</span>
                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isLangDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-[150px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-xl rounded-lg text-blue-100 animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => { setLanguage("EN"); setIsLangDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm ${language === "EN" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400"}`}>
                    <div className="flex gap-2"><span>🇬🇧</span> English</div>{language === "EN" && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => { setLanguage("TH"); setIsLangDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm mt-1 ${language === "TH" ? "bg-blue-500/20 text-cyan-400" : "hover:bg-blue-900/30 text-slate-400"}`}>
                    <div className="flex gap-2"><span>🇹🇭</span> ภาษาไทย</div>{language === "TH" && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="relative block" ref={profileDropdownRef}>
              <TooltipProvider delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center justify-center group outline-none"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-900 to-slate-800 border border-blue-700/50 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.15)] group-hover:border-cyan-500/50 transition-all duration-300">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200 group-hover:text-cyan-400" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={10} className="bg-slate-800 border-blue-900/50 text-white shadow-xl px-3 py-1.5 hidden sm:block">
                    <p className="font-semibold text-xs tracking-wide">{username}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-[200px] p-1 bg-[#0B1120] border border-blue-900/30 shadow-2xl rounded-lg text-blue-100 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-blue-900/30 mb-1 sm:hidden">
                     <p className="text-xs text-slate-400">Signed in as</p>
                     <p className="font-semibold text-sm truncate">{username}</p>
                  </div>
                  <button onClick={() => { setShowProfileModal(true); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md text-slate-300 hover:bg-blue-900/40 hover:text-cyan-400">
                    <User className="w-4 h-4" /> <span>{t.profile}</span>
                  </button>
                  <button onClick={() => { setShowPasswordModal(true); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md text-slate-300 hover:bg-blue-900/40 hover:text-cyan-400">
                    <Lock className="w-4 h-4" /> <span>{t.changePassword}</span>
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md text-red-400 hover:bg-red-900/20 border-t border-blue-900/30 mt-1">
                    <LogOut className="w-4 h-4" /> <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden text-slate-300 hover:text-white p-1 ml-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-[#0B1120] border-b border-blue-900/30 shadow-lg max-h-[85vh] overflow-y-auto z-40 animate-in slide-in-from-top-2 text-blue-100">
            
            {/* Mobile Organization Selector */}
            <div className="p-4 bg-[#162032]/50 border-b border-blue-900/30">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Organization</p>
              <button
                onClick={() => setIsMobileOrgOpen(!isMobileOrgOpen)}
                className="w-full flex justify-between items-center px-4 py-3 bg-[#0B1120] border border-blue-900/50 rounded-lg text-sm text-white"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                  <span className="truncate font-medium">{selectedOrg ? selectedOrg.name : "Loading..."}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMobileOrgOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isMobileOrgOpen && (
                <div className="mt-2 bg-[#020617] border border-blue-900/30 rounded-lg overflow-hidden">
                  <div className="p-2 border-b border-blue-900/30">
                     <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-[#162032] rounded text-sm text-white focus:outline-none"
                      />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredOrgs.map((org, index) => (
                      <button
                        key={`mob-org-${org.id}-${index}`}
                        onClick={() => handleOrgChange(org)}
                        className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center border-b border-blue-900/10 last:border-0 ${selectedOrg?.id === org.id ? "text-cyan-400 bg-blue-900/20" : "text-slate-300"}`}
                      >
                        {org.name}
                        {selectedOrg?.id === org.id && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Nav Items */}
            {navItems.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className="block px-4 py-4 text-base font-medium text-slate-300 border-b border-blue-900/30 hover:bg-blue-900/20 hover:text-cyan-400"
                  onClick={() => !item.children && setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="bg-[#020617]/50 pl-4 border-b border-blue-900/30">
                    {item.children.map((subItem, idx) => (
                      <Link
                        key={subItem.label || idx}
                        href={subItem.href!}
                        className="flex items-center gap-2 px-4 py-3 text-base text-slate-400 hover:text-cyan-400"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {subItem.icon} {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Mobile Language Switcher */}
            <div className="p-4 bg-[#020617]/50 border-b border-blue-900/30">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{t.language}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setLanguage("EN"); setIsMobileMenuOpen(false); }}
                  className={`flex justify-center items-center gap-2 py-3 text-sm font-medium rounded-md border ${language === "EN" ? "bg-[#0B1120] border-cyan-500 text-cyan-400" : "bg-[#0B1120] border-blue-900/30 text-slate-400"}`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => { setLanguage("TH"); setIsMobileMenuOpen(false); }}
                  className={`flex justify-center items-center gap-2 py-3 text-sm font-medium rounded-md border ${language === "TH" ? "bg-[#0B1120] border-cyan-500 text-cyan-400" : "bg-[#0B1120] border-blue-900/30 text-slate-400"}`}
                >
                  🇹🇭 ไทย
                </button>
              </div>
            </div>

            {/* Mobile App Version Display */}
            <div className="p-6 bg-[#0B1120] flex justify-center border-b border-blue-900/30">
              <AppVersionDisplay className="items-center text-center w-full" />
            </div>

          </div>
        )}
      </nav>

      <UpdateProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <div className="h-16 w-full shrink-0"></div>
    </>
  );
}