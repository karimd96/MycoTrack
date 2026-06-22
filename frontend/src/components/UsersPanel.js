import { useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, Loader2, UserX } from "lucide-react";

const ROLES = ["admin", "operator", "viewer"];

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role_name: "viewer" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/users", form);
      toast.success("User created");
      setShowForm(false);
      setForm({ role_name: "viewer" });
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (u, role_name) => {
    try {
      await api.patch(`/users/${u.id}`, { role_name });
      toast.success("Role updated");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const deactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.email}?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("User deactivated");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-[#0d100c] border border-stone-800 focus:border-lime-500 outline-none text-sm";

  return (
    <div data-testid="panel-users">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users &amp; Roles</h2>
          <p className="text-sm text-stone-500">Admin-only · {users.length} user(s)</p>
        </div>
        <button data-testid="add-users-button" onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-black text-sm font-medium transition-colors">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="rounded-xl border border-stone-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-[#11150f] text-stone-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-500"><Loader2 className="animate-spin inline" /></td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} data-testid="row-users" className="border-t border-stone-800/70 hover:bg-[#11150f]">
                  <td className="px-4 py-3 text-stone-100">{u.email}</td>
                  <td className="px-4 py-3 text-stone-400">{u.full_name || "—"}</td>
                  <td className="px-4 py-3">
                    <select data-testid="role-select" value={u.role?.name} onChange={(e) => changeRole(u, e.target.value)} className="px-2 py-1 rounded bg-[#0d100c] border border-stone-800 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? <span className="text-lime-400">Active</span> : <span className="text-stone-600">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.is_active && (
                      <button data-testid="deactivate-user-button" onClick={() => deactivate(u)} className="text-stone-400 hover:text-red-400 p-1.5" title="Deactivate">
                        <UserX size={16} />
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
          <form onSubmit={create} data-testid="form-users" className="w-full max-w-md bg-[#141a12] border border-lime-900/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New User</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-stone-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input data-testid="user-email-input" type="email" required placeholder="Email" className={inputCls} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input data-testid="user-fullname-input" placeholder="Full name" className={inputCls} value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input data-testid="user-password-input" type="password" required placeholder="Password (min 6)" className={inputCls} value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select data-testid="user-role-select" className={inputCls} value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button data-testid="submit-users-button" type="submit" disabled={busy} className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-black font-medium transition-colors disabled:opacity-60">
              {busy && <Loader2 className="animate-spin" size={18} />} Create user
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
