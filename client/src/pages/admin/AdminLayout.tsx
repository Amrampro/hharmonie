// client/src/pages/admin/AdminLayout.tsx
import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Star,
  FileText,
  MessageSquare,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  ChevronRight,
  Banknote,
  Bus,
  X,
  User,
  ChevronDown,
  Mail,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

function getInitials(first?: string, last?: string, email?: string) {
  const f = String(first ?? "").trim();
  const l = String(last ?? "").trim();
  if (f || l) {
    return `${(f[0] || "").toUpperCase()}${(l[0] || "").toUpperCase()}`.trim() || "AD";
  }
  const e = String(email ?? "").trim();
  return (e[0] || "A").toUpperCase();
}

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const navSections = [
    {
      title: "Vue d'ensemble",
      items: [
        {
          to: "/admin",
          label: "Tableau de bord",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "Gestion Boutique",
      items: [
        { to: "/admin/products", label: "Produits", icon: Package },
        { to: "/admin/product-categories", label: "Catégories", icon: ShoppingBag },
        { to: "/admin/product-reviews", label: "Avis produits", icon: Star },
      ],
    },
    {
      title: "Commandes",
      items: [
        { to: "/admin/orders", label: "Commandes", icon: Bus },
        { to: "/admin/ambassadors", label: "Ambassadeurs", icon: User }
      ],
    },
    {
      title: "Finances",
      items: [{ to: "/admin/finance", label: "Finances", icon: Banknote }],
    },
    {
      title: "Contenu & Marketing",
      items: [
        { to: "/admin/blog-posts", label: "Articles de blog", icon: FileText },
        { to: "/admin/blog-categories", label: "Catégories blog", icon: MessageSquare },
        { to: "/admin/events", label: "Événements", icon: CalendarRange },
        { to: "/admin/appointments", label: "Rendez-vous", icon: CalendarDays },
        { to: "/admin/faqs", label: "FAQ", icon: HelpCircle },
        { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
      ],
    },
    {
      title: "Configuration",
      items: [
        { to: "/admin/banners", label: "Bannières", icon: ImageIcon },
        { to: "/admin/legal-links", label: "Pages légales", icon: LinkIcon },
        { to: "/admin/parameters", label: "Paramètres", icon: Settings },
      ],
    },
  ];

  const getCurrentPageTitle = () => {
    const allItems = navSections.flatMap((section) => section.items);
    const currentItem = allItems.find((item) => item.to === location.pathname);
    return currentItem ? currentItem.label : "Tableau de bord";
  };

  // ✅ Admin identity (from DB via /auth/profile)
  const displayName = useMemo(() => {
    const first = String(user?.first_name ?? "").trim();
    const last = String(user?.last_name ?? "").trim();
    const full = `${first} ${last}`.trim();
    return full || "Administrateur";
  }, [user?.first_name, user?.last_name]);

  const displayEmail = useMemo(() => {
    return String(user?.email ?? "").trim() || "—";
  }, [user?.email]);

  const initials = useMemo(() => {
    return getInitials(user?.first_name, user?.last_name, user?.email);
  }, [user?.first_name, user?.last_name, user?.email]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {/* --- MOBILE OVERLAY (Sidebar) --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-100 shadow-2xl md:shadow-none
          transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:flex md:flex-col
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-50">
          <div className="flex items-center gap-3 text-slate-800 font-bold text-xl tracking-tight">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
              <LayoutDashboard size={22} />
            </div>
            <span>AdminPanel</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`transition-colors duration-200 ${
                              isActive
                                ? "text-indigo-100"
                                : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRight size={14} className="text-indigo-200 opacity-70" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Modern Glass Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between border-b border-slate-100 transition-all">
          {/* Title & Burger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {getCurrentPageTitle()}
              </h2>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search */}
            <div className="relative hidden xl:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="h-10 w-64 rounded-full bg-slate-100 border-transparent pl-10 pr-4 text-sm text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* Notifications */}
            <button className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* --- PROFIL DROPDOWN --- */}
            <div className="relative ml-2">
              {/* Trigger Button */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all focus:outline-none"
              >
                {/* ✅ Initials from DB */}
                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                  {initials}
                </div>

                {/* ✅ Name + Email from DB */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                    {displayEmail}
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setIsProfileOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Mobile User Info */}
                    <div className="md:hidden px-4 py-3 border-b border-slate-50 mb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500">{displayEmail}</p>
                    </div>

                    <NavLink
                      to="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                    >
                      <User size={16} />
                      Mon Profil
                    </NavLink>

                    <NavLink
                      to="/admin/parameters"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={16} />
                      Paramètres
                    </NavLink>

                    <div className="h-px bg-slate-100 my-2 mx-4"></div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
