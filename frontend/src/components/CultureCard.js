import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { printCultureLabel } from "@/lib/print";
import { Dna, MapPin, Calendar, Layers, Printer, GitBranch, Plus } from "lucide-react";

export default function CultureCard({ culture, speciesName, locationName, canWrite, onChild, onEvent, index = 0 }) {
  const navigate = useNavigate();
  const created = culture.created_at ? new Date(culture.created_at).toLocaleDateString() : "—";

  const ActionBtn = ({ onClick, icon: Icon, label, testid }) => (
    <button
      data-testid={testid}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#a3e635] px-2 py-1.5 rounded-md hover:bg-[#1f261e] transition-colors"
      title={label}
    >
      <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => navigate(`/cultures/${culture.id}`)}
      data-testid={`culture-card-${culture.id}`}
      className="cursor-pointer bg-[#161b15] border border-[#2b3628] rounded-xl p-5 flex flex-col gap-4 hover:border-[#a3e635]/40 hover:-translate-y-1 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-[#f8fafc] truncate flex items-center gap-2">
            <Dna size={16} className="text-[#a3e635] shrink-0" />
            {speciesName || "Unknown species"}
          </h4>
          <p className="mt-1 font-mono text-xs text-[#64748b] truncate">#{culture.code}</p>
        </div>
        <StatusBadge status={culture.status} testid="culture-card-status" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-[#94a3b8] min-w-0">
          <Layers size={14} className="text-[#64748b] shrink-0" />
          <span className="truncate">{culture.culture_type || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-[#94a3b8] min-w-0">
          <MapPin size={14} className="text-[#64748b] shrink-0" />
          <span className="truncate">{locationName || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-[#94a3b8] col-span-2">
          <Calendar size={14} className="text-[#64748b] shrink-0" />
          <span>{created}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-3 border-t border-[#2b3628] -mx-1">
        <ActionBtn testid="card-print-label" onClick={() => printCultureLabel(culture, speciesName, locationName)} icon={Printer} label="Print" />
        {canWrite && <ActionBtn testid="card-add-event" onClick={() => onEvent(culture)} icon={Plus} label="Event" />}
        {canWrite && <ActionBtn testid="card-child-culture" onClick={() => onChild(culture)} icon={GitBranch} label="Child" />}
      </div>
    </motion.div>
  );
}
