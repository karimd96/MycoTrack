import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Sprout, Loader2 } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, fullName);
      navigate("/");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0d100c] text-stone-100">
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 bg-gradient-to-br from-[#13180f] to-[#0d100c] border-r border-lime-900/40">
        <div className="flex items-center gap-3">
          <Sprout className="text-lime-400" size={30} />
          <span className="text-2xl font-semibold tracking-tight">MycoTrack</span>
        </div>
        <div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Cultivation <span className="text-lime-400">traceability</span>, from spore
            to harvest.
          </h1>
          <p className="mt-6 text-stone-400 max-w-md">
            Track species, cultures, recipes and lineage across your lab. Now powered by
            PostgreSQL.
          </p>
        </div>
        <p className="text-xs text-stone-600">PostgreSQL · SQLAlchemy async · FastAPI</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={submit}
          data-testid="auth-form"
          className="w-full max-w-sm bg-[#141a12] border border-lime-900/40 rounded-2xl p-8 shadow-2xl"
        >
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <Sprout className="text-lime-400" size={24} />
            <span className="text-xl font-semibold">MycoTrack</span>
          </div>
          <h2 className="text-2xl font-semibold mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {mode === "login"
              ? "Sign in to your lab workspace"
              : "New accounts start as viewer"}
          </p>

          {mode === "register" && (
            <input
              data-testid="register-fullname-input"
              className="w-full mb-3 px-4 py-2.5 rounded-lg bg-[#0d100c] border border-stone-800 focus:border-lime-500 outline-none"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input
            data-testid="auth-email-input"
            type="email"
            required
            className="w-full mb-3 px-4 py-2.5 rounded-lg bg-[#0d100c] border border-stone-800 focus:border-lime-500 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            data-testid="auth-password-input"
            type="password"
            required
            className="w-full mb-4 px-4 py-2.5 rounded-lg bg-[#0d100c] border border-stone-800 focus:border-lime-500 outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p data-testid="auth-error" className="text-sm text-red-400 mb-4">
              {error}
            </p>
          )}

          <button
            data-testid="auth-submit-button"
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-black font-medium transition-colors disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={18} />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            data-testid="auth-toggle-mode"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="w-full mt-4 text-sm text-stone-400 hover:text-lime-400"
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
