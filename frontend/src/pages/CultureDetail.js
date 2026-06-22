import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import CultureFormModal from "@/components/CultureFormModal";
import EventFormModal from "@/components/EventFormModal";
import { printCultureLabel } from "@/lib/print";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Printer,
  GitBranch,
  Pencil,
  Dna,
  MapPin,
  Layers,
  Calendar,
  BookOpen,
  Activity,
  Trash2,
} from "lucide-react";

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#0d100c] border border-[#2b3628] rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#64748b] mb-1">
        <Icon size={13} /> {label}
      </div>
      <div className="text-sm text-[#f8fafc] truncate">{value || "—"}</div>
    </div>
  );
}

export default function CultureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite, isAdmin } = useAuth();

  const [culture, setCulture] = useState(null);
  const [species, setSpecies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [events, setEvents] = useState([]);
  const [lineage, setLineage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, l, r, ev, ln] = await Promise.all([
        api.get(`/cultures/${id}`),
        api.get("/species"),
        api.get("/locations"),
        api.get("/recipes"),
        api.get(`/cultures/${id}/events`),
        api.get(`/cultures/${id}/lineage`),
      ]);
      setCulture(c.data);
      setSpecies(s.data);
      setLocations(l.data);
      setRecipes(r.data);
      setEvents(ev.data);
      setLineage(ln.data);
    } catch (e) {
      toast.error(apiError(e));
      if (e?.response?.status === 404) navigate("/cultures");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const nameOf = (list, key, fid) => list.find((x) => x.id === fid)?.[key];

  const deleteEvent = async (evId) => {
    if (!window.confirm("Delete this event? (admin-only, traceability)")) return;
    try {
      await api.delete(`/culture-events/${evId}`);
      toast.success("Event deleted");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (loading || !culture) {
    return (
      <div className="flex justify-center py-20 text-[#a3e635]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  const speciesName = nameOf(species, "scientific_name", culture.species_id);
  const locationName = nameOf(locations, "name", culture.location_id);
  const recipeName = nameOf(recipes, "name", culture.recipe_id);

  const Action = ({ onClick, icon: Icon, label, testid, primary }) => (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
        primary
          ? "bg-[#a3e635] text-[#0d100c] hover:bg-[#84cc16] font-semibold"
          : "border border-[#2b3628] text-[#f8fafc] hover:bg-[#1f261e]"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto" data-testid="culture-detail">
      <button onClick={() => navigate("/cultures")} className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#a3e635] mb-5">
        <ArrowLeft size={16} /> Back to cultures
      </button>

      <div className="bg-[#161b15] border border-[#2b3628] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Dna size={22} className="text-[#a3e635]" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{speciesName || "Unknown species"}</h1>
            </div>
            <p className="mt-1 font-mono text-sm text-[#64748b]">#{culture.code}</p>
          </div>
          <StatusBadge status={culture.status} testid="detail-status" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Meta icon={Layers} label="Type" value={culture.culture_type} />
          <Meta icon={MapPin} label="Location" value={locationName} />
          <Meta icon={BookOpen} label="Recipe" value={recipeName} />
          <Meta icon={Calendar} label="Started" value={new Date(culture.created_at).toLocaleDateString()} />
        </div>

        {culture.notes && (
          <div className="mt-4 text-sm text-[#94a3b8] bg-[#0d100c] border border-[#2b3628] rounded-lg p-3">
            {culture.notes}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-6">
          {canWrite && <Action testid="detail-add-event" primary onClick={() => setEventOpen(true)} icon={Plus} label="Add Event" />}
          <Action testid="detail-print-label" onClick={() => printCultureLabel(culture, speciesName, locationName)} icon={Printer} label="Print Label" />
          {canWrite && <Action testid="detail-child-culture" onClick={() => setChildOpen(true)} icon={GitBranch} label="Create Child Culture" />}
          {canWrite && <Action testid="detail-edit" onClick={() => setEditOpen(true)} icon={Pencil} label="Edit" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Events timeline */}
        <div className="lg:col-span-2 bg-[#161b15] border border-[#2b3628] rounded-xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Activity size={18} className="text-[#a3e635]" /> Event timeline
          </h3>
          {events.length === 0 ? (
            <p className="text-sm text-[#64748b]">No events logged yet.</p>
          ) : (
            <ol className="relative border-l border-[#2b3628] ml-2 space-y-5">
              {events.map((ev) => (
                <li key={ev.id} data-testid="event-timeline-item" className="ml-5">
                  <span className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-[#a3e635] border-2 border-[#161b15]" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#a3e635] capitalize">{ev.event_type}</span>
                    <span className="text-xs text-[#64748b]">{new Date(ev.event_date).toLocaleString()}</span>
                  </div>
                  {ev.notes && <p className="text-sm text-[#94a3b8] mt-1">{ev.notes}</p>}
                  {isAdmin && (
                    <button data-testid="delete-event-button" onClick={() => deleteEvent(ev.id)} className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#ef4444] hover:underline">
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Lineage */}
        <div className="bg-[#161b15] border border-[#2b3628] rounded-xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <GitBranch size={18} className="text-[#a3e635]" /> Lineage
          </h3>
          <ol className="relative border-l border-[#2b3628] ml-2 space-y-4">
            {lineage.map((c, i) => (
              <li key={c.id} className="ml-5">
                <span className="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-[#a3e635] border-2 border-[#161b15]" />
                {c.id === culture.id ? (
                  <span className="text-sm font-medium text-[#f8fafc]">{c.code} <span className="text-xs text-[#a3e635]">(this)</span></span>
                ) : (
                  <Link to={`/cultures/${c.id}`} className="text-sm font-medium text-[#94a3b8] hover:text-[#a3e635]">{c.code}</Link>
                )}
                <p className="text-xs text-[#64748b] capitalize">{c.status}</p>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-[#64748b] mt-3">Current → root. Graph view coming in Phase 2.</p>
        </div>
      </div>

      <CultureFormModal open={editOpen} mode="edit" culture={culture} onClose={() => setEditOpen(false)} onSaved={load} />
      <CultureFormModal open={childOpen} mode="child" parentCulture={culture} onClose={() => setChildOpen(false)} onSaved={load} />
      <EventFormModal open={eventOpen} culture={culture} onClose={() => setEventOpen(false)} onSaved={load} />
    </div>
  );
}
