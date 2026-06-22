import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sprout,
  LayoutDashboard,
  Dna,
  FlaskConical,
  MapPin,
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const ALL_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, roles: ["admin", "operator", "viewer"] },
  { to: "/cultures", label: "Cultures", icon: Dna, roles: ["admin", "operator", "viewer"] },
  { to: "/species", label: "Species", icon: FlaskConical, roles: ["admin", "operator", "viewer"] },
  { to: "/locations", label: "Locations", icon: MapPin, roles: ["admin", "operator", "viewer"] },
  { to: "/recipes", label: "Recipes", icon: BookOpen, roles: ["admin", "operator", "viewer"] },
  { to: "/users", label: "Users & Roles", icon: Users, roles: ["admin"] },
];

function NavItems({ role, onNavigate }) {
  const items = ALL_NAV.filter((n) => n.roles.includes(role));
  return (
    <nav className="flex-1 px-3 space-y-1">
      {items.map((n) => {
        const Icon = n.icon;
        return (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            data-testid={`nav-${n.label.toLowerCase().split(" ")[0]}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/40"
                  : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1f261e] border border-transparent"
              }`
            }
          >
            <Icon size={18} /> {n.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function UserBox({ user, role, onLogout }) {
  return (
    <div className="p-4 border-t border-[#2b3628]">
      <p className="text-sm font-medium text-[#f8fafc] truncate" data-testid="current-user-email">
        {user.email}
      </p>
      <span
        data-testid="current-user-role"
        className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] bg-[#1f261e] text-[#a3e635] capitalize border border-[#2b3628]"
      >
        {role}
      </span>
      <button
        data-testid="logout-button"
        onClick={onLogout}
        className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#1f261e] transition-colors"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0d100c] text-[#f8fafc] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#2b3628] bg-[#10140e] fixed inset-y-0 left-0 z-30">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-[#2b3628]">
          <Sprout className="text-[#a3e635]" size={26} />
          <span className="text-xl font-semibold tracking-tight">MycoTrack</span>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavItems role={role} />
        </div>
        <UserBox user={user} role={role} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="relative w-72 max-w-[80%] h-full flex flex-col bg-[#10140e] border-r border-[#2b3628] animate-[slidein_.2s_ease]">
            <div className="px-5 py-5 flex items-center justify-between border-b border-[#2b3628]">
              <div className="flex items-center gap-2">
                <Sprout className="text-[#a3e635]" size={24} />
                <span className="text-lg font-semibold">MycoTrack</span>
              </div>
              <button data-testid="drawer-close-button" onClick={() => setDrawer(false)} className="text-[#94a3b8] hover:text-white">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <NavItems role={role} onNavigate={() => setDrawer(false)} />
            </div>
            <UserBox user={user} role={role} onLogout={onLogout} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-[#2b3628] bg-[#10140e]/95 backdrop-blur">
          <button data-testid="mobile-menu-button" onClick={() => setDrawer(true)} className="text-[#f8fafc] p-1">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Sprout className="text-[#a3e635]" size={20} />
            <span className="font-semibold">MycoTrack</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1f261e] text-[#a3e635] capitalize border border-[#2b3628]">
            {role}
          </span>
        </header>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
