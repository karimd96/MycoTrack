import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import CultureCard from "@/components/CultureCard";
import { Dna, Activity, AlertTriangle, FlaskConical, Plus, Loader2, ArrowRight } from "lucide-react";

function StatCard({ icon: Icon, label, value, accent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="bg-[#161b15] border border-[#2b3628] rounded-xl p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#64748b]">{label}</span>
        <Icon size={18} className={accent} />
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, canWrite } = useAuth();
  const navigate = useNavigate();
  const [cultures, setCultures] = useState([]);
  const [species, setSpecies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const speciesName = (id) => species.find((s) => s.id === id)?.scientific_name;
  const locationName = (id) => locations.find((l) => l.id === id)?.name;

  const active = cultures.filter((c) => c.status === "active").length;
  const contaminated = cultures.filter((c) => c.status === "contaminated").length;
  const recent = cultures.slice(0, 8);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-[#a3e635]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome back{user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[#94a3b8] mt-1">Your cultivation lab at a glance.</p>
        </div>
        {canWrite && (
          <button
            data-testid="dashboard-add-culture"
            onClick={() => navigate("/cultures")}
            className="inline-flex items-center justify-center gap-2 bg-[#a3e635] text-[#0d100c] hover:bg-[#84cc16] font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Plus size={18} /> Add Culture
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard index={0} icon={Dna} label="Total cultures" value={cultures.length} accent="text-[#a3e635]" />
        <StatCard index={1} icon={Activity} label="Active" value={active} accent="text-[#a3e635]" />
        <StatCard index={2} icon={AlertTriangle} label="Contaminated" value={contaminated} accent="text-[#ef4444]" />
        <StatCard index={3} icon={FlaskConical} label="Species" value={species.length} accent="text-[#f59e0b]" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent cultures</h2>
        <button onClick={() => navigate("/cultures")} className="inline-flex items-center gap-1 text-sm text-[#a3e635] hover:underline">
          View all <ArrowRight size={15} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="border border-dashed border-[#2b3628] rounded-xl py-14 text-center text-[#94a3b8]">
          No cultures yet. {canWrite && "Head to Cultures to add your first one."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {recent.map((c, i) => (
            <CultureCard
              key={c.id}
              index={i}
              culture={c}
              speciesName={speciesName(c.species_id)}
              locationName={locationName(c.location_id)}
              canWrite={canWrite}
              onChild={(culture) => navigate(`/cultures/${culture.id}`)}
              onEvent={(culture) => navigate(`/cultures/${culture.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
