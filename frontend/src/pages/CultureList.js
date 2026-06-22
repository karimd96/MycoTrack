import { useCallback, useEffect, useMemo, useState } from "react";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, Dna, Search } from "lucide-react";
import CultureCard from "@/components/CultureCard";
import CultureFormModal from "@/components/CultureFormModal";
import EventFormModal from "@/components/EventFormModal";

export default function CultureList() {
  const { canWrite } = useAuth();
  const [cultures, setCultures] = useState([]);
  const [species, setSpecies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formState, setFormState] = useState({ open: false, mode: "create", parentCulture: null });
  const [eventState, setEventState] = useState({ open: false, culture: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, l] = await Promise.all([
        api.get("/cultures"),
        api.get("/species"),
        api.get("/locations"),
      ]);
      setCultures(c.data);
      setSpecies(s.data);
      setLocations(l.data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const speciesName = (id) => species.find((s) => s.id === id)?.scientific_name;
  const locationName = (id) => locations.find((l) => l.id === id)?.name;

  const filtered = useMemo(() => {
    return cultures.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!query) return true;
      const hay = `${c.code} ${speciesName(c.species_id) || ""} ${c.culture_type || ""}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cultures, species, query, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Cultures</h1>
          <p className="text-[#94a3b8] mt-1">{cultures.length} culture(s) tracked</p>
        </div>
        {canWrite && (
          <button
            data-testid="add-culture-btn"
            onClick={() => setFormState({ open: true, mode: "create", parentCulture: null })}
            className="inline-flex items-center justify-center gap-2 bg-[#a3e635] text-[#0d100c] hover:bg-[#84cc16] font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Plus size={18} /> Add Culture
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            data-testid="culture-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code, species or type…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#161b15] border border-[#2b3628] focus:border-[#a3e635] outline-none text-sm"
          />
        </div>
        <select
          data-testid="culture-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-[#161b15] border border-[#2b3628] focus:border-[#a3e635] outline-none text-sm"
        >
          <option value="all">All statuses</option>
          {["active", "contaminated", "stored", "discarded"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[#a3e635]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-[#2b3628] rounded-xl py-16 flex flex-col items-center text-center">
          <Dna size={36} className="text-[#2b3628] mb-3" />
          <p className="text-[#94a3b8]">{cultures.length === 0 ? "No cultures yet." : "No cultures match your filters."}</p>
          {canWrite && cultures.length === 0 && (
            <button
              data-testid="empty-add-culture-btn"
              onClick={() => setFormState({ open: true, mode: "create", parentCulture: null })}
              className="mt-4 inline-flex items-center gap-2 text-[#a3e635] hover:underline"
            >
              <Plus size={16} /> Add your first culture
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((c, i) => (
            <CultureCard
              key={c.id}
              index={i}
              culture={c}
              speciesName={speciesName(c.species_id)}
              locationName={locationName(c.location_id)}
              canWrite={canWrite}
              onChild={(culture) => setFormState({ open: true, mode: "child", parentCulture: culture })}
              onEvent={(culture) => setEventState({ open: true, culture })}
            />
          ))}
        </div>
      )}

      <CultureFormModal
        open={formState.open}
        mode={formState.mode}
        parentCulture={formState.parentCulture}
        onClose={() => setFormState({ open: false, mode: "create", parentCulture: null })}
        onSaved={load}
      />
      <EventFormModal
        open={eventState.open}
        culture={eventState.culture || {}}
        onClose={() => setEventState({ open: false, culture: null })}
        onSaved={load}
      />
    </div>
  );
}
