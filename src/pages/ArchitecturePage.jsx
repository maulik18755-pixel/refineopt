import { T } from "../styles/theme.js";
import { useBreakpoint } from "../hooks/useBreakpoint.js";

// ── Layer colour palette ────────────────────────────────────────────────────
const LC = {
  source:  "#448aff",
  preproc: "#ff9100",
  intel:   "#ab47bc",
  engine:  "#00bfa5",
  output:  "#69f0ae",
};

// ── Node registry ───────────────────────────────────────────────────────────
// Each entry: { x, y, w, h }
const N = {
  scada:   { x: 18,  y: 78,  w: 202, h: 150 },
  lims:    { x: 18,  y: 292, w: 202, h: 120 },
  dq:      { x: 278, y: 78,  w: 202, h: 150 },
  sc:      { x: 278, y: 292, w: 202, h: 120 },
  ml:      { x: 538, y: 78,  w: 202, h: 150 },
  de:      { x: 538, y: 292, w: 202, h: 120 },
  dash:    { x: 800, y: 58,  w: 218, h: 110 },
  act:     { x: 800, y: 196, w: 218, h: 110 },
  ai:      { x: 800, y: 334, w: 218, h: 110 },
};

// Geometry helpers
const cx = k => N[k].x + N[k].w / 2;
const cy = k => N[k].y + N[k].h / 2;
const ex = k => N[k].x + N[k].w;   // right edge x
const lx = k => N[k].x;            // left edge x
const ty = k => N[k].y;            // top edge y
const by = k => N[k].y + N[k].h;   // bottom edge y

const SVG_W = 1040;
const SVG_H = 496;

// ── Arrow paths ─────────────────────────────────────────────────────────────
const ARROWS = [
  // SCADA → Data Quality (horizontal, row 1)
  `M ${ex('scada')} ${cy('scada') - 10} L ${lx('dq')} ${cy('dq') - 10}`,
  // LIMS → Data Quality (curve up to same col)
  `M ${ex('lims')} ${cy('lims') - 8} C ${ex('lims') + 42} ${cy('lims') - 8} ${lx('dq') - 42} ${cy('dq') + 20} ${lx('dq')} ${cy('dq') + 20}`,
  // Data Quality → Sensor Correction (vertical)
  `M ${cx('dq')} ${by('dq')} L ${cx('sc')} ${ty('sc')}`,
  // Data Quality → ML Models (horizontal)
  `M ${ex('dq')} ${cy('dq') - 10} L ${lx('ml')} ${cy('ml') - 10}`,
  // Sensor Correction → Diagnostic Engine (horizontal)
  `M ${ex('sc')} ${cy('sc')} L ${lx('de')} ${cy('de')}`,
  // ML Models → Diagnostic Engine (vertical)
  `M ${cx('ml')} ${by('ml')} L ${cx('de')} ${ty('de')}`,
  // Diagnostic Engine → Dashboard (fan up)
  `M ${ex('de')} ${cy('de') - 26} C ${ex('de') + 44} ${cy('de') - 26} ${lx('dash') - 44} ${cy('dash')} ${lx('dash')} ${cy('dash')}`,
  // Diagnostic Engine → Margin Actions (centre, slight curve)
  `M ${ex('de')} ${cy('de')} C ${ex('de') + 32} ${cy('de')} ${lx('act') - 32} ${cy('act')} ${lx('act')} ${cy('act')}`,
  // Diagnostic Engine → AI Narrative (fan down)
  `M ${ex('de')} ${cy('de') + 26} C ${ex('de') + 44} ${cy('de') + 26} ${lx('ai') - 44} ${cy('ai')} ${lx('ai')} ${cy('ai')}`,
];

// ── Pipeline table data ─────────────────────────────────────────────────────
const PIPELINE = [
  { stage: "SCADA Ingest",      color: LC.source,  op: "34 process tags at 1-min frequency over 2 years",                     out: "1,051,200 raw rows",     rt: "Batch / upload" },
  { stage: "LIMS Ingest",       color: LC.source,  op: "Kerosene yield, flash point, IBP/FBP, RONC, gas oil cloud point",     out: "4,176 lab samples",      rt: "Batch / upload" },
  { stage: "Data Quality",      color: LC.preproc, op: "Shutdown filter · DP_COL saturation flags · 8-hr rolling IQR fence", out: "Running-period clean",   rt: "< 100 ms" },
  { stage: "Sensor Correction", color: LC.preproc, op: "T_PASS3 peer drift · F_REFLUX baseline · gap imputation by length",   out: "4,173 merged samples",   rt: "< 200 ms" },
  { stage: "ML Inference",      color: LC.intel,   op: "XGBoost on 35 engineered features → yield + flash point prediction",  out: "Predicted KPIs",         rt: "< 50 ms" },
  { stage: "Diagnostics",       color: LC.engine,  op: "11 CDU rules · TOC constraint ranking · $/day margin action score",   out: "Findings + actions",     rt: "< 5 ms" },
  { stage: "Outputs",           color: LC.output,  op: "KPI dashboard · action cards · Claude API narrative (optional)",      out: "Operator insights",       rt: "< 2 s total" },
];

// ── Legend items ────────────────────────────────────────────────────────────
const LEGEND = [
  { color: LC.source,  label: "Data Sources" },
  { color: LC.preproc, label: "Preprocessing" },
  { color: LC.intel,   label: "ML Models" },
  { color: LC.engine,  label: "Diagnostic Engine / AI" },
  { color: LC.output,  label: "Operator Outputs" },
];

// ── Stats strip ─────────────────────────────────────────────────────────────
const STATS = [
  { v: "34",    l: "Process Tags",     c: LC.source  },
  { v: "1.05M", l: "Historian Rows",   c: LC.preproc },
  { v: "4,173", l: "Training Samples", c: LC.intel   },
  { v: "11",    l: "Diagnostic Rules", c: LC.engine  },
  { v: "3",     l: "Margin Actions",   c: LC.output  },
  { v: "< 1 s", l: "End-to-End",       c: T.teal     },
];

// ── Main component ──────────────────────────────────────────────────────────
export default function ArchitecturePage() {
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Description */}
      <p style={{ color: T.textMute, fontSize: "13px", lineHeight: 1.7, maxWidth: "780px" }}>
        End-to-end data flow from the process historian and lab system through
        preprocessing and predictive models into the CDU diagnostic engine, which
        drives all operator-facing outputs. Every stage runs client-side in the browser
        — no data leaves the machine.
      </p>

      {/* Stats strip */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
        border:              `1px solid ${T.border}`,
        borderRadius:        T.r8,
        overflow:            "hidden",
      }}>
        {STATS.map((s, i, arr) => (
          <div key={s.l} style={{
            padding:      "14px 10px",
            background:   T.surface,
            borderRight:  i < arr.length - 1 ? `1px solid ${T.border}` : "none",
            display:      "flex",
            flexDirection:"column",
            alignItems:   "center",
            gap:          "4px",
            textAlign:    "center",
          }}>
            <span style={{ fontFamily: T.fontMono, fontSize: "19px", fontWeight: 700, color: s.c, lineHeight: 1 }}>
              {s.v}
            </span>
            <span style={{ fontSize: "10px", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>
              {s.l}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      {isMobile && (
        <p style={{ fontSize: "11px", color: T.textDim, textAlign: "center" }}>
          ← swipe to explore diagram →
        </p>
      )}

      {/* SVG diagram wrapper */}
      <div className="scroll-x" style={{
        background:   "#080c12",
        border:       `1px solid ${T.border}`,
        borderRadius: T.r8,
        padding:      isMobile ? "16px 10px" : "28px",
      }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          style={{ display: "block", minWidth: SVG_W }}
          aria-label="RefineOpt system architecture diagram"
        >
          <defs>
            {/* Arrowhead marker */}
            <marker id="ah" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <path d="M 0 0 L 7 2.5 L 0 5 Z" fill="rgba(120,140,170,0.75)" />
            </marker>

            {/* Per-layer glow filters */}
            {Object.entries(LC).map(([k, hex]) => (
              <filter key={k} id={`glow_${k}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" in="SourceGraphic" result="blur" />
                <feFlood floodColor={hex} floodOpacity="0.18" result="col" />
                <feComposite in="col" in2="blur" operator="in" result="glow" />
                <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>

          {/* ── Column header bands ── */}
          {[
            { x: 8,   w: 222, label: "DATA SOURCES", color: LC.source  },
            { x: 268, w: 222, label: "PREPROCESSING", color: LC.preproc },
            { x: 528, w: 222, label: "INTELLIGENCE",  color: LC.intel   },
            { x: 789, w: 240, label: "OUTPUTS",       color: LC.output  },
          ].map(col => (
            <g key={col.label}>
              <rect x={col.x} y={6} width={col.w} height={28} rx={5}
                fill={col.color + "14"} stroke={col.color + "38"} strokeWidth={1} />
              <text
                x={col.x + col.w / 2} y={24}
                textAnchor="middle"
                fill={col.color}
                fontSize={10} fontWeight={700}
                letterSpacing={1.3}
                fontFamily="'Instrument Sans', system-ui, sans-serif"
              >
                {col.label}
              </text>
            </g>
          ))}

          {/* ── Vertical column separators ── */}
          {[250, 510, 770].map(xPos => (
            <line key={xPos}
              x1={xPos} y1={38} x2={xPos} y2={SVG_H - 14}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1}
              strokeDasharray="3 6"
            />
          ))}

          {/* ── Animated data-flow arrows ── */}
          <g
            className="flow-arrow"
            stroke="rgba(110,130,165,0.55)"
            strokeWidth={1.5}
            fill="none"
            markerEnd="url(#ah)"
          >
            {ARROWS.map((d, i) => <path key={i} d={d} />)}
          </g>

          {/* ── Nodes ── */}
          <SvgNode
            n={N.scada} color={LC.source} filterId="glow_source"
            title="SCADA / Historian" sub="Process data stream"
            items={["34 sensor tags · 1-min", "T_COT, F_CRUDE_FEED, DP_COL", "op_mode · crude grade"]}
            tag="1,051,200 ROWS · 2 YR"
          />
          <SvgNode
            n={N.lims} color={LC.source} filterId="glow_source"
            title="LIMS" sub="Lab information system"
            items={["4-hr grab samples", "Yield · IBP · FBP · Flash Pt"]}
            tag="4,176 LAB SAMPLES"
          />
          <SvgNode
            n={N.dq} color={LC.preproc} filterId="glow_preproc"
            title="Data Quality" sub="Artefact detection"
            items={["Shutdown filter (op_mode > 0)", "Saturation flags (DP_COL ≥ 250)", "Rolling IQR, 4× fence"]}
            tag="88.4% ROWS RETAINED"
          />
          <SvgNode
            n={N.sc} color={LC.preproc} filterId="glow_preproc"
            title="Sensor Correction" sub="Drift & imputation"
            items={["T_PASS3 peer-comparison", "F_REFLUX 90-day baseline", "Gap imputation by length"]}
            tag="4,173 MERGED ROWS"
          />
          <SvgNode
            n={N.ml} color={LC.intel} filterId="glow_intel"
            title="ML Models" sub="XGBoost predictors"
            items={["Yield: KERO_YIELD_VOL_PCT", "Quality: KERO_FLASH_PT_C", "35 engineered features"]}
            tag="TIME-SERIES CV"
          />
          <SvgNode
            n={N.de} color={LC.engine} filterId="glow_engine"
            title="Diagnostic Engine" sub="CDU rule library"
            items={["11 CDU findings rules", "TOC constraint ranking", "$/day margin scoring"]}
            tag="PURE JAVASCRIPT"
          />
          <SvgNode
            n={N.dash} color={LC.output} filterId="glow_output"
            title="Operator Dashboard"
            items={["14 KPI metrics", "Severity-ranked findings"]}
            tag="BROWSER · REAL-TIME"
          />
          <SvgNode
            n={N.act} color={LC.output} filterId="glow_output"
            title="Margin Actions"
            items={["Top 3 ranked actions", "$/day uplift estimates"]}
            tag="STEP-BY-STEP OPS"
          />
          <SvgNode
            n={N.ai} color={LC.engine} filterId="glow_engine"
            title="AI Narrative"
            items={["Executive summary", "Shift-level top action"]}
            tag="CLAUDE SONNET"
          />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: T.textMute }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="24" height="10" style={{ flexShrink: 0 }}>
            <line x1="0" y1="5" x2="18" y2="5" stroke="rgba(110,130,165,0.7)"
              strokeWidth="1.5" strokeDasharray="5 3" />
            <path d="M 16 2 L 22 5 L 16 8 Z" fill="rgba(110,130,165,0.7)" />
          </svg>
          <span style={{ fontSize: "12px", color: T.textMute }}>Data flow</span>
        </div>
      </div>

      {/* Pipeline detail table */}
      <div>
        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: T.textDim, marginBottom: "10px" }}>
          Pipeline Stage Details
        </div>
        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border2}` }}>
                {["Stage", "Operation", "Output", "Runtime"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 12px",
                    color: T.textMute, fontWeight: 500, fontSize: "11px",
                    textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PIPELINE.map(row => (
                <tr key={row.stage} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: "12px", color: row.color }}>
                      {row.stage}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: T.textBody }}>
                    {row.op}
                  </td>
                  <td style={{ padding: "10px 12px", color: T.textMute, whiteSpace: "nowrap", fontFamily: T.fontMono, fontSize: "11px" }}>
                    {row.out}
                  </td>
                  <td style={{ padding: "10px 12px", color: T.textDim, whiteSpace: "nowrap", fontFamily: T.fontMono, fontSize: "11px" }}>
                    {row.rt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ── SVG Node component ──────────────────────────────────────────────────────
function SvgNode({ n, color, filterId, title, sub, items = [], tag }) {
  const { x, y, w, h } = n;
  const CLIP_ID = `clip_${x}_${y}`;
  const PAD     = 13;
  const ITEM_H  = 18;

  // Vertical text layout
  let curY = y + 22;              // title baseline
  const titleY = curY;
  curY += sub ? 16 : 0;
  const subY = sub ? (y + 37) : null;
  if (sub) curY += 3;
  const itemsStartY = curY + 10; // small gap before bullets

  const tagH = 20;
  const tagBarY = y + h - tagH - 5;

  return (
    <g filter={`url(#${filterId})`}>
      <defs>
        <clipPath id={CLIP_ID}>
          <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={6} />
        </clipPath>
      </defs>

      {/* Node body */}
      <rect x={x} y={y} width={w} height={h} rx={7}
        fill="rgba(255,255,255,0.028)"
        stroke="rgba(255,255,255,0.085)"
        strokeWidth={1}
      />

      {/* Top colour accent bar */}
      <rect x={x} y={y} width={w} height={3} rx={2} fill={color} />

      {/* Subtle top glow wash */}
      <rect x={x + 1} y={y + 3} width={w - 2} height={30} rx={0}
        fill={color} opacity={0.04}
      />

      {/* Clipped content */}
      <g clipPath={`url(#${CLIP_ID})`}>

        {/* Title */}
        <text
          x={x + PAD} y={titleY}
          fill="#dde3f4" fontSize={12.5} fontWeight={600}
          fontFamily="'Instrument Sans', system-ui, sans-serif"
        >
          {title}
        </text>

        {/* Subtitle */}
        {sub && (
          <text
            x={x + PAD} y={subY}
            fill="#3d4f6b" fontSize={10}
            fontFamily="'Instrument Sans', system-ui, sans-serif"
          >
            {sub}
          </text>
        )}

        {/* Bullet items */}
        {items.map((item, i) => (
          <g key={i}>
            <circle
              cx={x + PAD + 2}
              cy={itemsStartY + i * ITEM_H + 3}
              r={2.2}
              fill={color}
              opacity={0.7}
            />
            <text
              x={x + PAD + 12}
              y={itemsStartY + i * ITEM_H + 7}
              fill="#5c6e8a" fontSize={10}
              fontFamily="'Instrument Sans', system-ui, sans-serif"
            >
              {item}
            </text>
          </g>
        ))}

        {/* Tag bar */}
        {tag && (
          <g>
            <rect x={x + 8} y={tagBarY} width={w - 16} height={tagH} rx={3}
              fill={color + "1c"} />
            <text
              x={x + w / 2} y={tagBarY + 13.5}
              textAnchor="middle"
              fill={color} fontSize={9} fontWeight={600}
              letterSpacing={0.9}
              fontFamily="'JetBrains Mono', 'Fira Code', monospace"
            >
              {tag}
            </text>
          </g>
        )}
      </g>
    </g>
  );
}
