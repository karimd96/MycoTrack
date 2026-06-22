import { useEffect, useState } from "react";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

const STATUSES = ["active", "contaminated", "stored", "discarded"];
const input =
  "w-full px-3 py-2.5 rounded-lg bg-[#0d100c] border border-[#2b3628] focus:border-[#a3e635] outline-none text-sm text-[#f8fafc]";
const label = "block text-[11px] font-semibold tracking-[0.12em] uppercase text-[#64748b] mb-1.5";

export default function CultureFormModal({ open, onClose, onSaved, mode = "create", culture, parentCulture }) {
  const [species, setSpecies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [form, setForm] = useState({ status: "active" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [s, l, r, c] = await Promise.all([
          api.get("/species"),
          api.get("/locations"),
          api.get("/recipes"),
          api.get("/cultures"),
        ]);
        setSpecies(s.data);
        setLocations(l.data);
        setRecipes(r.data);
        setCultures(c.data);
      } catch (e) {
        toast.error(apiError(e));
      }
    })();

    if (mode === "edit" && culture) {
      setForm({
        code: culture.code,
        species_id: culture.species_id,
        location_id: culture.location_id || "",
        recipe_id: culture.recipe_id || "",
        parent_culture_id: culture.parent_culture_id || "",
        culture_type: culture.culture_type || "",
        status: culture.status,
        notes: culture.notes || "",
      });
    } else if (mode === "child" && parentCulture) {
      setForm({
        status: "active",
        species_id: parentCulture.species_id,
        location_id: parentCulture.location_id || "",
        recipe_id: parentCulture.recipe_id || "",
        culture_type: parentCulture.culture_type || "",
        parent_culture_id: parentCulture.id,
      });
    } else {
      setForm({ status: "active" });
    }
  }, [open, mode, culture, parentCulture]);

  if (!open) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      ["location_id", "recipe_id", "parent_culture_id", "culture_type", "notes"].forEach((k) => {
        if (payload[k] === "" || payload[k] === undefined) delete payload[k];
      });
      if (mode === "edit") {
        await api.patch(`/cultures/${culture.id}`, payload);
        toast.success("Culture updated");
      } else {
        await api.post("/cultures", payload);
        toast.success(mode === "child" ? "Child culture created" : "Culture created");
      }
      onSaved && (await onSaved());
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "edit" ? "Edit culture" : mode === "child" ? "Create child culture" : "Add culture";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <form
        onSubmit={submit}
        data-testid="culture-form"
        className="w-full sm:max-w-lg bg-[#161b15] border border-[#2b3628] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#94a3b8] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {mode === "child" && parentCulture && (
          <div className="mb-4 text-xs text-[#94a3b8] bg-[#0d100c] border border-[#2b3628] rounded-lg px-3 py-2">
            Parent: <span className="text-[#a3e635] font-medium">{parentCulture.code}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Culture ID / Code *</label>
            <input data-testid="culture-code-input" required className={input} placeholder="e.g. PO-2026-001" value={form.code || ""} onChange={(e) => set("code", e.target.value)} />
          </div>
          <div>
            <label className={label}>Species *</label>
            <select data-testid="culture-species-select" required className={input} value={form.species_id || ""} onChange={(e) => set("species_id", e.target.value)}>
              <option value="">Select…</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>{s.scientific_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Culture type</label>
            <input data-testid="culture-type-input" className={input} placeholder="agar / liquid / grain" value={form.culture_type || ""} onChange={(e) => set("culture_type", e.target.value)} />
          </div>
          <div>
            <label className={label}>Location</label>
            <select data-testid="culture-location-select" className={input} value={form.location_id || ""} onChange={(e) => set("location_id", e.target.value)}>
              <option value="">None</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Recipe</label>
            <select data-testid="culture-recipe-select" className={input} value={form.recipe_id || ""} onChange={(e) => set("recipe_id", e.target.value)}>
              <option value="">None</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Parent culture</label>
            <select data-testid="culture-parent-select" className={input} value={form.parent_culture_id || ""} onChange={(e) => set("parent_culture_id", e.target.value)}>
              <option value="">None (origin)</option>
              {cultures.filter((c) => !culture || c.id !== culture.id).map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select data-testid="culture-status-select" className={input} value={form.status || "active"} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Notes</label>
            <textarea data-testid="culture-notes-input" rows={2} className={input} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <button
          data-testid="culture-form-submit"
          type="submit"
          disabled={busy}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#a3e635] hover:bg-[#84cc16] text-[#0d100c] font-semibold transition-colors disabled:opacity-60"
        >
          {busy && <Loader2 className="animate-spin" size={18} />}
          {mode === "edit" ? "Save changes" : "Create culture"}
        </button>
      </form>
    </div>
  );
}
