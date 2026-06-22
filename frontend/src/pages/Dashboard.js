import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CrudPanel from "@/components/CrudPanel";
import CulturesPanel from "@/components/CulturesPanel";
import UsersPanel from "@/components/UsersPanel";
import { Sprout, FlaskConical, MapPin, BookOpen, Dna, Users, LogOut } from "lucide-react";

const SPECIES_FIELDS = [
  { name: "scientific_name", label: "Scientific name", required: true },
  { name: "common_name", label: "Common name" },
  { name: "category", label: "Category" },
  { name: "notes", label: "Notes", type: "textarea" },
];
const LOCATION_FIELDS = [
  { name: "name", label: "Name", required: true },
  { name: "type", label: "Type (lab / incubator / fruiting chamber)" },
  { name: "description", label: "Description", type: "textarea" },
];
const RECIPE_FIELDS = [
  { name: "name", label: "Name", required: true },
  { name: "type", label: "Type (agar / grain / bulk)" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "instructions", label: "Instructions", type: "textarea" },
];

export default function Dashboard() {
  const { user, role, isAdmin, canWrite, logout } = useAuth();
  const [tab, setTab] = useState("cultures");

  const nav = [
    { key: "cultures", label: "Cultures", icon: Dna },
    { key: "species", label: "Species", icon: FlaskConical },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "recipes", label: "Recipes", icon: BookOpen },
  ];
  if (isAdmin) nav.push({ key: "users", label: "Users & Roles", icon: Users });

  return (
    <div className="min-h-screen flex bg-[#0d100c] text-stone-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-stone-800 bg-[#10140e] flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-stone-800">
          <Sprout className="text-lime-400" size={26} />
          <span className="text-xl font-semibold tracking-tight">MycoTrack</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = tab === n.key;
            return (
              <button
                key={n.key}
                data-testid={`nav-${n.key}`}
                onClick={() => setTab(n.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-lime-500/15 text-lime-300 border border-lime-700/40"
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/40 border border-transparent"
                }`}
              >
                <Icon size={18} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <div className="mb-3">
            <p className="text-sm font-medium truncate" data-testid="current-user-email">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-stone-800 text-lime-300 capitalize" data-testid="current-user-role">
              {role}
            </span>
          </div>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-red-400 hover:bg-stone-800/40 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {tab === "cultures" && <CulturesPanel canWrite={canWrite} isAdmin={isAdmin} />}
          {tab === "species" && (
            <CrudPanel
              resource="species"
              title="Species"
              fields={SPECIES_FIELDS}
              columns={[
                { key: "scientific_name", label: "Scientific name" },
                { key: "common_name", label: "Common name" },
                { key: "category", label: "Category" },
              ]}
              canWrite={canWrite}
              canDelete={isAdmin}
            />
          )}
          {tab === "locations" && (
            <CrudPanel
              resource="locations"
              title="Location"
              fields={LOCATION_FIELDS}
              columns={[
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                { key: "description", label: "Description" },
              ]}
              canWrite={canWrite}
              canDelete={isAdmin}
            />
          )}
          {tab === "recipes" && (
            <CrudPanel
              resource="recipes"
              title="Recipe"
              fields={RECIPE_FIELDS}
              columns={[
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                { key: "description", label: "Description" },
              ]}
              canWrite={canWrite}
              canDelete={isAdmin}
            />
          )}
          {tab === "users" && isAdmin && <UsersPanel />}
        </div>
      </main>
    </div>
  );
}
