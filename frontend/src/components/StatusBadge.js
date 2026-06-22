const STYLES = {
  active: "text-[#a3e635] border-[#a3e635]/40 bg-[#a3e635]/10",
  contaminated: "text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10",
  stored: "text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10",
  discarded: "text-[#64748b] border-[#64748b]/40 bg-[#64748b]/10",
};

export default function StatusBadge({ status, testid }) {
  return (
    <span
      data-testid={testid}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
        STYLES[status] || STYLES.discarded
      }`}
    >
      {status}
    </span>
  );
}
