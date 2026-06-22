import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Network } from "lucide-react";

const STATUS_STYLE = {
  active: { bg: "#16320f", border: "#a3e635", text: "#a3e635" },
  contaminated: { bg: "#3a1212", border: "#ef4444", text: "#fca5a5" },
  stored: { bg: "#3a2a0f", border: "#f59e0b", text: "#fbbf24" },
  discarded: { bg: "#1f261e", border: "#64748b", text: "#94a3b8" },
};

// Mock lineage used when the DB has no cultures yet (preview-friendly).
const MOCK = [
  { id: "m1", code: "Pink Oyster Mycelium Syringe", culture_type: "liquid", status: "active", parent_culture_id: null },
  { id: "m2", code: "Pink Oyster Agar Plate", culture_type: "agar", status: "active", parent_culture_id: "m1" },
  { id: "m3", code: "Pink Oyster Liquid Culture", culture_type: "liquid", status: "active", parent_culture_id: "m2" },
  { id: "m4", code: "Pink Oyster Grain Spawn", culture_type: "grain", status: "stored", parent_culture_id: "m3" },
  { id: "m5", code: "Pink Oyster Fruiting Block", culture_type: "bulk", status: "active", parent_culture_id: "m4" },
];

function buildGraph(cultures, speciesName) {
  const byId = new Map(cultures.map((c) => [c.id, c]));
  const levelCache = new Map();
  const levelOf = (c, guard = new Set()) => {
    if (levelCache.has(c.id)) return levelCache.get(c.id);
    if (!c.parent_culture_id || !byId.has(c.parent_culture_id) || guard.has(c.id)) {
      levelCache.set(c.id, 0);
      return 0;
    }
    guard.add(c.id);
    const lvl = levelOf(byId.get(c.parent_culture_id), guard) + 1;
    levelCache.set(c.id, lvl);
    return lvl;
  };

  const perLevel = {};
  const nodes = cultures.map((c) => {
    const lvl = levelOf(c);
    perLevel[lvl] = (perLevel[lvl] || 0) + 1;
    const col = perLevel[lvl] - 1;
    const s = STATUS_STYLE[c.status] || STATUS_STYLE.discarded;
    return {
      id: c.id,
      position: { x: col * 280, y: lvl * 150 },
      data: {
        label: (
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.text }}>{c.code}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
              {speciesName ? speciesName(c.species_id) || "" : ""}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
              {(c.culture_type || "—")} · {c.status}
            </div>
          </div>
        ),
      },
      style: {
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 10,
        padding: 10,
        width: 220,
        color: "#f8fafc",
      },
    };
  });

  const edges = cultures
    .filter((c) => c.parent_culture_id && byId.has(c.parent_culture_id))
    .map((c) => ({
      id: `${c.parent_culture_id}-${c.id}`,
      source: c.parent_culture_id,
      target: c.id,
      animated: true,
      style: { stroke: "#a3e635" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#a3e635" },
    }));

  return { nodes, edges };
}

export default function Genealogy() {
  const navigate = useNavigate();
  const [cultures, setCultures] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([api.get("/cultures"), api.get("/species")]);
        if (c.data.length === 0) {
          setIsMock(true);
          setCultures(MOCK);
        } else {
          setCultures(c.data);
        }
        setSpecies(s.data);
      } catch (e) {
        toast.error(apiError(e));
        setIsMock(true);
        setCultures(MOCK);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const speciesName = useCallback(
    (id) => species.find((x) => x.id === id)?.scientific_name,
    [species]
  );

  const { nodes, edges } = useMemo(
    () => buildGraph(cultures, isMock ? null : speciesName),
    [cultures, isMock, speciesName]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      if (!isMock) navigate(`/cultures/${node.id}`);
    },
    [isMock, navigate]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-[#a3e635]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div data-testid="genealogy-page">
      <div className="mb-5">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2">
          <Network className="text-[#a3e635]" /> Genealogy
        </h1>
        <p className="text-[#94a3b8] mt-1">
          Culture lineage — parent → child. Click a node to open its detail.
          {isMock && <span className="ml-1 text-[#f59e0b]">(showing sample data)</span>}
        </p>
      </div>

      <div
        data-testid="genealogy-canvas"
        style={{ height: "70vh" }}
        className="rounded-xl border border-[#2b3628] bg-[#10140e] overflow-hidden"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2b3628" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(n) => n.style?.border || "#a3e635"}
            maskColor="rgba(13,16,12,0.7)"
            style={{ background: "#161b15" }}
          />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#94a3b8]">
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: v.bg, border: `1px solid ${v.border}` }} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
