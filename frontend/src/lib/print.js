export function printCultureLabel(culture, speciesName, locationName) {
  const w = window.open("", "PRINT", "height=420,width=560");
  if (!w) return;
  const date = culture.created_at
    ? new Date(culture.created_at).toLocaleDateString()
    : "—";
  w.document.write(`<!doctype html><html><head><title>Label ${culture.code}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;background:#fff;color:#111;}
    .label{border:2px solid #111;border-radius:10px;padding:18px 20px;width:340px;}
    .top{display:flex;justify-content:space-between;align-items:flex-start;}
    .code{font-size:30px;font-weight:800;letter-spacing:1px;}
    .pill{border:1px solid #111;border-radius:999px;padding:2px 10px;font-size:11px;text-transform:uppercase;font-weight:700;}
    .row{margin-top:8px;font-size:13px;}
    .row b{display:inline-block;width:74px;color:#333;}
    .muted{color:#666;}
    .id{font-family:monospace;font-size:10px;color:#888;margin-top:14px;word-break:break-all;border-top:1px dashed #bbb;padding-top:8px;}
    .brand{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:6px;}
  </style></head><body>
  <div class="label">
    <div class="brand">MycoTrack</div>
    <div class="top"><div class="code">${culture.code}</div><div class="pill">${culture.status}</div></div>
    <div class="row"><b>Species</b> ${speciesName || "—"}</div>
    <div class="row"><b>Type</b> ${culture.culture_type || "—"}</div>
    <div class="row"><b>Location</b> ${locationName || "—"}</div>
    <div class="row muted"><b>Started</b> ${date}</div>
    <div class="id">${culture.id}</div>
  </div>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  w.document.close();
  w.focus();
}
