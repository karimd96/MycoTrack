import { useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Loader2, GitBranch, ListTree, Pencil } from "lucide-react";

const STATUSES = ["active", "contaminated", "stored", "discarded"];
const STATUS_STYLES = {
  active: "bg-lime-500/15 text-lime-300 border-lime-600/40",
  contaminated: "bg-red-500/15 text-red-300 border-red-600/40",
  stored: "bg-sky-500/15 text-sky-300 border-sky-600/40",
  discarded: "bg-stone-500/15 text-stone-400 border-stone-600/40",
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLES[status] || ""}`}>
      {status}
    </span>
  );
}

export default function CulturesPanel({ canWrite, isAdmin }) {
  const [cultures, setCultures] = useState([]);
  const [species, setSpecies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState(null); // culture for events
  const [events, setEvents] = useState([]);
  const [lineage, setLineage] = useState(null);
  const [newEvent, setNewEvent] = useState({ event_type: "observation", notes: "" });

  const nameOf = (list, id) => list.find((x) => x.id === id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, l, r] = await Promise.all([
        api.get("/cultures"),
        api.get("/species"),
        api.get("/locations"),
        api.get("/recipes"),
      ]);
      setCultures(c.data);
      setSpecies(s.data);
      setLocations(l.data);
      setRecipes(r.data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ status: "active" });
    setShowForm(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      code: row.code,
      species_id: row.species_id,
      location_id: row.location_id || "",
      recipe_id: row.recipe_id || "",
      parent_culture_id: row.parent_culture_id || "",
      culture_type: row.culture_type || "",
      status: row.status,
      notes: row.notes || "",
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      ["location_id", "recipe_id", "parent_culture_id", "culture_type", "notes"].forEach(
        (k) => {
          if (payload[k] === "" || payload[k] === undefined) delete payload[k];
        }
      );
      if (editing) {
        await api.patch(`/cultures/${editing.id}`, payload);
        toast.success("Culture updated");
      } else {
        await api.post("/cultures", payload);
        toast.success("Culture created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openEvents = async (culture) => {
    setDrawer(culture);
    setLineage(null);
    try {
      const { data } = await api.get(`/cultures/${culture.id}/events`);
      setEvents(data);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const addEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/cultures/${drawer.id}/events`, newEvent);
      setNewEvent({ event_type: "observation", notes: "" });
      const { data } = await api.get(`/cultures/${drawer.id}/events`);
      setEvents(data);
      toast.success("Event logged");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const delEvent = async (id) => {
    if (!window.confirm("Delete this event? (admin-only, traceability)")) return;
    try {
      await api.delete(`/culture-events/${id}`);
      const { data } = await api.get(`/cultures/${drawer.id}/events`);
      setEvents(data);
      toast.success("Event deleted");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const showLineage = async (culture) => {
    try {
      const { data } = await api.get(`/cultures/${culture.id}/lineage`);
      setLineage({ culture, chain: data });
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-[#0d100c] border border-stone-800 focus:border-lime-500 outline-none text-sm";

  return (
    <div data-testid="panel-cultures">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Cultures</h2>
          <p className="text-sm text-stone-500">{cultures.length} culture(s) · status changes only, no hard delete</p>
        </div>
        {canWrite && (
          <button
            data-testid="add-cultures-button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-black text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Culture
          </button>
        )}
      </div>

      <div className="rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#11150f] text-stone-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Species</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500"><Loader2 className="animate-spin inline" /></td></tr>
            ) : cultures.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-600">No cultures yet.</td></tr>
            ) : (
              cultures.map((row) => (
                <tr key={row.id} data-testid="row-cultures" className="border-t border-stone-800/70 hover:bg-[#11150f]">
                  <td className="px-4 py-3 font-medium text-stone-100">{row.code}</td>
                  <td className="px-4 py-3 text-stone-300">{nameOf(species, row.species_id)?.scientific_name || "—"}</td>
                  <td className="px-4 py-3 text-stone-400">{row.culture_type || "—"}</td>
                  <td className="px-4 py-3 text-stone-400">{nameOf(locations, row.location_id)?.name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button data-testid="lineage-cultures-button" onClick={() => showLineage(row)} className="text-stone-400 hover:text-lime-400 p-1.5" title="Lineage">
                      <GitBranch size={16} />
                    </button>
                    <button data-testid="events-cultures-button" onClick={() => openEvents(row)} className="text-stone-400 hover:text-sky-400 p-1.5" title="Events">
                      <ListTree size={16} />
                    </button>
                    {canWrite && (
                      <button data-testid="edit-cultures-button" onClick={() => openEdit(row)} className="text-stone-400 hover:text-lime-400 p-1.5" title="Edit">
                        <Pencil size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={submit} data-testid="form-cultures" className="w-full max-w-lg bg-[#141a12] border border-lime-900/40 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? "Edit Culture" : "New Culture"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Code *</label>
                <input data-testid="field-code" required className={inputCls} value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Species *</label>
                <select data-testid="field-species_id" required className={inputCls} value={form.species_id || ""} onChange={(e) => setForm({ ...form, species_id: e.target.value })}>
                  <option value="">Select…</option>
                  {species.map((s) => <option key={s.id} value={s.id}>{s.scientific_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Type</label>
                <input data-testid="field-culture_type" className={inputCls} placeholder="agar / liquid / grain" value={form.culture_type || ""} onChange={(e) => setForm({ ...form, culture_type: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Location</label>
                <select data-testid="field-location_id" className={inputCls} value={form.location_id || ""} onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
                  <option value="">None</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Recipe</label>
                <select data-testid="field-recipe_id" className={inputCls} value={form.recipe_id || ""} onChange={(e) => setForm({ ...form, recipe_id: e.target.value })}>
                  <option value="">None</option>
                  {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Parent culture (lineage)</label>
                <select data-testid="field-parent_culture_id" className={inputCls} value={form.parent_culture_id || ""} onChange={(e) => setForm({ ...form, parent_culture_id: e.target.value })}>
                  <option value="">None (origin)</option>
                  {cultures.filter((c) => !editing || c.id !== editing.id).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Status</label>
                <select data-testid="field-status" className={inputCls} value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Notes</label>
                <textarea data-testid="field-notes" rows={2} className={inputCls} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button data-testid="submit-cultures-button" type="submit" disabled={busy} className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-black font-medium transition-colors disabled:opacity-60">
              {busy && <Loader2 className="animate-spin" size={18} />}
              {editing ? "Save changes" : "Create culture"}
            </button>
          </form>
        </div>
      )}

      {/* Events drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setDrawer(null)}>
          <div className="w-full max-w-md h-full bg-[#141a12] border-l border-lime-900/40 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="events-drawer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Events · {drawer.code}</h3>
              <button onClick={() => setDrawer(null)} className="text-stone-400 hover:text-white"><X size={20} /></button>
            </div>
            {canWrite && (
              <form onSubmit={addEvent} className="mb-5 space-y-2 bg-[#0d100c] p-3 rounded-lg border border-stone-800">
                <select data-testid="event-type-select" className={inputCls} value={newEvent.event_type} onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}>
                  {["observation", "transfer", "contamination", "note"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <textarea data-testid="event-notes-input" rows={2} className={inputCls} placeholder="Notes" value={newEvent.notes} onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })} />
                <button data-testid="add-event-button" type="submit" className="w-full py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-black text-sm font-medium">Log event</button>
              </form>
            )}
            <div className="space-y-3">
              {events.length === 0 && <p className="text-stone-600 text-sm">No events logged.</p>}
              {events.map((ev) => (
                <div key={ev.id} data-testid="event-item" className="border border-stone-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-lime-300">{ev.event_type}</span>
                    <span className="text-xs text-stone-500">{new Date(ev.event_date).toLocaleString()}</span>
                  </div>
                  {ev.notes && <p className="text-sm text-stone-300 mt-1">{ev.notes}</p>}
                  {isAdmin && (
                    <button data-testid="delete-event-button" onClick={() => delEvent(ev.id)} className="text-xs text-red-400 hover:underline mt-2">Delete</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lineage modal */}
      {lineage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setLineage(null)}>
          <div className="w-full max-w-sm bg-[#141a12] border border-lime-900/40 rounded-2xl p-6" onClick={(e) => e.stopPropagation()} data-testid="lineage-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lineage · {lineage.culture.code}</h3>
              <button onClick={() => setLineage(null)} className="text-stone-400 hover:text-white"><X size={20} /></button>
            </div>
            <ol className="relative border-l border-lime-700/50 ml-2">
              {lineage.chain.map((c, i) => (
                <li key={c.id} className="ml-4 mb-4">
                  <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-lime-500" />
                  <p className="text-sm font-medium text-stone-100">{c.code} {i === 0 && <span className="text-xs text-lime-400">(this)</span>}</p>
                  <p className="text-xs text-stone-500">{c.status}</p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-stone-600 mt-2">Root → current. Advanced visualization deferred.</p>
          </div>
        </div>
      )}
    </div>
  );
}
