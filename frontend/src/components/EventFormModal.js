import { useState } from "react";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

const EVENT_TYPES = ["observation", "transfer", "contamination", "note"];
const input =
  "w-full px-3 py-2.5 rounded-lg bg-[#0d100c] border border-[#2b3628] focus:border-[#a3e635] outline-none text-sm text-[#f8fafc]";
const label = "block text-[11px] font-semibold tracking-[0.12em] uppercase text-[#64748b] mb-1.5";

export default function EventFormModal({ open, onClose, onSaved, culture }) {
  const [form, setForm] = useState({ event_type: "observation", notes: "" });
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/cultures/${culture.id}/events`, form);
      toast.success("Event logged");
      setForm({ event_type: "observation", notes: "" });
      onSaved && (await onSaved());
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <form
        onSubmit={submit}
        data-testid="event-form"
        className="w-full sm:max-w-md bg-[#161b15] border border-[#2b3628] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold">Log event</h3>
            <p className="text-xs text-[#94a3b8]">on {culture.code}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#94a3b8] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={label}>Event type</label>
            <select data-testid="event-type-select" className={input} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Notes</label>
            <textarea data-testid="event-notes-input" rows={3} className={input} placeholder="What happened?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <button
          data-testid="event-form-submit"
          type="submit"
          disabled={busy}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#a3e635] hover:bg-[#84cc16] text-[#0d100c] font-semibold transition-colors disabled:opacity-60"
        >
          {busy && <Loader2 className="animate-spin" size={18} />}
          Log event
        </button>
      </form>
    </div>
  );
}
