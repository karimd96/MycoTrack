import { useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

function Field({ field, value, onChange }) {
  const common =
    "w-full px-3 py-2 rounded-lg bg-[#0d100c] border border-stone-800 focus:border-lime-500 outline-none text-sm";
  if (field.type === "textarea") {
    return (
      <textarea
        data-testid={`field-${field.name}`}
        className={common}
        rows={3}
        placeholder={field.label}
        value={value ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    );
  }
  return (
    <input
      data-testid={`field-${field.name}`}
      className={common}
      placeholder={field.label}
      required={field.required}
      value={value ?? ""}
      onChange={(e) => onChange(field.name, e.target.value)}
    />
  );
}

export default function CrudPanel({
  resource,
  title,
  fields,
  columns,
  canWrite,
  canDelete,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/${resource}`);
      setRows(data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({});
    setShowForm(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    const f = {};
    fields.forEach((fl) => (f[fl.name] = row[fl.name] ?? ""));
    setForm(f);
    setShowForm(true);
  };

  const onChange = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {};
      fields.forEach((fl) => {
        const v = form[fl.name];
        if (v !== "" && v !== undefined) payload[fl.name] = v;
      });
      if (editing) {
        await api.patch(`/${resource}/${editing.id}`, payload);
        toast.success(`${title} updated`);
      } else {
        await api.post(`/${resource}`, payload);
        toast.success(`${title} created`);
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()}?`)) return;
    try {
      await api.delete(`/${resource}/${row.id}`);
      toast.success(`${title} deleted`);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div data-testid={`panel-${resource}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-stone-500">{rows.length} record(s)</p>
        </div>
        {canWrite && (
          <button
            data-testid={`add-${resource}-button`}
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-black text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add {title}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#11150f] text-stone-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-stone-500">
                  <Loader2 className="animate-spin inline" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-stone-600">
                  No records yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} data-testid={`row-${resource}`} className="border-t border-stone-800/70 hover:bg-[#11150f]">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-stone-200">
                      {c.render ? c.render(row) : row[c.key] ?? "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {canWrite && (
                      <button
                        data-testid={`edit-${resource}-button`}
                        onClick={() => openEdit(row)}
                        className="text-stone-400 hover:text-lime-400 p-1.5"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        data-testid={`delete-${resource}-button`}
                        onClick={() => remove(row)}
                        className="text-stone-400 hover:text-red-400 p-1.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={submit}
            data-testid={`form-${resource}`}
            className="w-full max-w-md bg-[#141a12] border border-lime-900/40 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? `Edit ${title}` : `New ${title}`}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((fl) => (
                <div key={fl.name}>
                  <label className="block text-xs text-stone-400 mb-1">{fl.label}</label>
                  <Field field={fl} value={form[fl.name]} onChange={onChange} />
                </div>
              ))}
            </div>
            <button
              data-testid={`submit-${resource}-button`}
              type="submit"
              disabled={busy}
              className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-black font-medium transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 className="animate-spin" size={18} />}
              {editing ? "Save changes" : "Create"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
