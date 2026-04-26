import { useState, useMemo, useRef } from "react";
import { T, severityColor } from "../styles/theme.js";
import { analyzeCDU } from "../engine/analyzeCDU.js";
import { getMarginActions } from "../engine/marginActions.js";
import { SAMPLE_PROCESS, SAMPLE_LAB, BENCHMARKS } from "../data/sampleData.js";
import { parseProcessCSV, parseLabCSV } from "../utils/parseCSV.js";
import { KPICard } from "../components/KPICard.jsx";
import { FindingCard } from "../components/FindingCard.jsx";
import { ActionCard } from "../components/ActionCard.jsx";
import { SeverityBadge } from "../components/SeverityBadge.jsx";
import { useAIDiagnostic } from "../hooks/useAIDiagnostic.js";
import { useBreakpoint } from "../hooks/useBreakpoint.js";
import { getSeverity } from "../data/operatingRanges.js";
import ArchitecturePage from "./ArchitecturePage.jsx";

export default function Dashboard() {
  const [proc, setProc]       = useState(SAMPLE_PROCESS);
  const [lab,  setLab]        = useState(SAMPLE_LAB);
  const [apiKey, setApiKey]   = useState(() => localStorage.getItem("refineopt_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setTab]   = useState("findings");
  const procRef               = useRef(null);
  const labRef                = useRef(null);

  const { isMobile } = useBreakpoint();
  const { aiResult, loading: aiLoading, error: aiError, run: runAI } = useAIDiagnostic();

  const { findings, kpis } = useMemo(() => analyzeCDU(proc, lab), [proc, lab]);
  const actions             = useMemo(() => getMarginActions(proc, lab, findings), [proc, lab, findings]);

  const critCount = findings.filter(f => f.severity === "critical").length;
  const warnCount = findings.filter(f => f.severity === "warning").length;

  async function handleProcessFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text   = await file.text();
      const parsed = await parseProcessCSV(text);
      setProc({ ...parsed, pass3DriftRatePerYear: SAMPLE_PROCESS.pass3DriftRatePerYear });
    } catch (err) {
      alert("Failed to parse process CSV: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleLabFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text   = await file.text();
      const parsed = await parseLabCSV(text);
      setLab(parsed);
    } catch (err) {
      alert("Failed to parse lab CSV: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  function handleApiKey(val) {
    setApiKey(val);
    localStorage.setItem("refineopt_key", val);
  }

  const totalMarginUplift = actions.reduce((s, a) => s + (a.estimatedDailyMargin || 0), 0);

  const kpiCards = [
    { label: "Feed Rate",         value: kpis.feedRate?.toFixed(0),        unit: "m³/hr",        severity: getSeverity("feedRate", kpis.feedRate) },
    { label: "Crude API",         value: kpis.crudeAPI?.toFixed(1),         unit: "°API",          severity: "ok" },
    { label: "COT",               value: kpis.cot?.toFixed(1),              unit: "°C",            severity: getSeverity("cot", kpis.cot) },
    { label: "Furnace Duty",      value: kpis.furnaceDuty?.toFixed(1),      unit: "MW",            severity: getSeverity("furnaceDuty", kpis.furnaceDuty) },
    { label: "Energy Intensity",  value: kpis.energyIntensity ? (kpis.energyIntensity * 1000).toFixed(1) : null, unit: "kW/(m³/hr)", severity: getSeverity("energyIntensity", kpis.energyIntensity) },
    { label: "Column ΔP",         value: kpis.dpCol?.toFixed(0),            unit: "mbar",          severity: getSeverity("dpCol", kpis.dpCol) },
    { label: "DP Saturation",     value: kpis.dpColSatPct?.toFixed(1),      unit: "% runtime",     severity: getSeverity("dpColSatPct", kpis.dpColSatPct) },
    { label: "Reflux/Feed",       value: kpis.refluxRatio?.toFixed(3),      unit: "—",             severity: getSeverity("refluxRatio", kpis.refluxRatio) },
    { label: "Availability",      value: kpis.availability?.toFixed(1),     unit: "%",             severity: getSeverity("availability", kpis.availability) },
    { label: "Kero Yield",        value: kpis.keroYieldPct?.toFixed(2),     unit: "vol%",          severity: getSeverity("keroYieldPct", kpis.keroYieldPct) },
    { label: "Flash Point",       value: kpis.keroFlashPt?.toFixed(1),      unit: "°C",            severity: getSeverity("keroFlashPt", kpis.keroFlashPt), sub: "Min spec: 38°C" },
    { label: "Naph RONC",         value: kpis.naphRONC?.toFixed(1),         unit: "",              severity: getSeverity("naphRONC", kpis.naphRONC) },
    { label: "GO Cloud Pt",       value: kpis.goCloudPt?.toFixed(1),        unit: "°C",            severity: getSeverity("goCloudPt", kpis.goCloudPt) },
    { label: "Pass Imbalance",    value: kpis.passImbalance?.toFixed(2),    unit: "°C σ",          severity: getSeverity("passImbalance", kpis.passImbalance) },
  ];

  const pad = isMobile ? "16px" : "24px 28px";

  const tabs = [
    { key: "findings",     label: `Findings (${findings.length})` },
    { key: "actions",      label: isMobile ? "Actions" : "Top 3 Margin Actions" },
    { key: "kpis",         label: isMobile ? "KPIs" : "KPI Dashboard" },
    { key: "architecture", label: isMobile ? "Arch" : "Architecture" },
  ];

  return (
    <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px", maxWidth: "1200px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: isMobile ? "17px" : "20px", fontWeight: 600, color: T.text, lineHeight: 1.2 }}>CDU Performance Intelligence</h1>
          <p style={{ marginTop: "4px", color: T.textMute, fontSize: "12px" }}>
            {proc === SAMPLE_PROCESS ? "Sample data — Jan 2022 to Dec 2023, Arab Light" : "Custom uploaded data"}
            {loading && <span style={{ color: T.teal, marginLeft: "8px" }}>Parsing…</span>}
          </p>
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flexShrink: 0 }}>
          {critCount > 0 && <StatusPill count={critCount} label="Critical" color={T.critical} />}
          {warnCount > 0 && <StatusPill count={warnCount} label="Warnings" color={T.warning} />}
          <StatusPill count={`$${(totalMarginUplift / 1000).toFixed(0)}k/day`} label="Margin" color={T.teal} />
        </div>
      </div>

      {/* ── Data Controls ── */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "10px",
        padding: isMobile ? "12px" : "14px 16px",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r8,
      }}>
        {/* CSV uploads row */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input ref={procRef} type="file" accept=".csv" onChange={handleProcessFile} style={{ display: "none" }} />
          <input ref={labRef}  type="file" accept=".csv" onChange={handleLabFile}    style={{ display: "none" }} />

          <FileBtn onClick={() => procRef.current.click()} fullWidth={isMobile}>
            ↑ Process CSV
          </FileBtn>
          <FileBtn onClick={() => labRef.current.click()} fullWidth={isMobile}>
            ↑ Lab CSV
          </FileBtn>
          <FileBtn onClick={() => { setProc(SAMPLE_PROCESS); setLab(SAMPLE_LAB); }} fullWidth={isMobile}>
            Reset Sample
          </FileBtn>
        </div>

        {/* API key row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: T.textMute, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            API Key
          </span>
          <input
            type={showKey ? "text" : "password"}
            placeholder="sk-ant-… (optional — AI insights)"
            value={apiKey}
            onChange={e => handleApiKey(e.target.value)}
            style={{
              flex: 1, minWidth: "140px", background: T.surface2,
              border: `1px solid ${T.border2}`, borderRadius: T.r4,
              padding: "6px 10px", color: T.text, fontSize: "12px",
              fontFamily: T.fontMono, outline: "none",
            }}
          />
          <button
            onClick={() => setShowKey(s => !s)}
            style={{ background: "none", border: "none", color: T.textMute, fontSize: "11px", cursor: "pointer", padding: "0 4px" }}>
            {showKey ? "hide" : "show"}
          </button>
          <FileBtn onClick={() => runAI(findings, actions, kpis, apiKey)} disabled={aiLoading} accent>
            {aiLoading ? "…" : "Run AI"}
          </FileBtn>
        </div>
      </div>

      {/* ── AI Insight Banner ── */}
      {(aiResult || aiError) && (
        <div style={{
          padding: isMobile ? "12px" : "16px 18px", borderRadius: T.r8,
          background: aiError ? T.criticalDim : T.tealDim,
          border: `1px solid ${aiError ? T.critical + "44" : T.teal + "44"}`,
        }}>
          {aiError ? (
            <p style={{ color: T.critical, fontSize: "13px" }}>{aiError}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ color: T.teal, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                  AI Diagnostic
                </span>
                {aiResult.riskFlag && (
                  <span style={{ fontSize: "11px", color: T.warning, fontStyle: "italic" }}>
                    ⚠ {aiResult.riskFlag}
                  </span>
                )}
              </div>
              <p style={{ color: T.text, fontSize: "13px", lineHeight: 1.6 }}>{aiResult.headline}</p>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "10px" : "20px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Action</div>
                  <div style={{ color: T.text, fontSize: "13px", marginTop: "2px" }}>{aiResult.topAction}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin Estimate</div>
                  <div style={{ color: T.teal, fontFamily: T.fontMono, fontSize: "13px", marginTop: "2px" }}>{aiResult.marginEstimate}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            style={{
              background:   "none",
              border:       "none",
              borderBottom: activeTab === tab.key ? `2px solid ${T.teal}` : "2px solid transparent",
              padding:      "8px 14px",
              color:        activeTab === tab.key ? T.teal : T.textMute,
              fontSize:     isMobile ? "12px" : "13px",
              fontWeight:   activeTab === tab.key ? 600 : 400,
              cursor:       "pointer",
              marginBottom: "-1px",
              whiteSpace:   "nowrap",
              transition:   "color 0.15s",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Findings tab ── */}
      {activeTab === "findings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {findings.length === 0 && (
            <EmptyState text="No findings — all parameters within normal operating range." />
          )}
          {findings.map(f => <FindingCard key={f.id} finding={f} />)}
        </div>
      )}

      {/* ── Actions tab ── */}
      {activeTab === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Margin summary banner */}
          <div style={{
            display: "flex", flexDirection: isMobile ? "column" : "row",
            gap: "12px", padding: isMobile ? "12px" : "12px 16px",
            background: T.tealDim, borderRadius: T.r8,
            border: `1px solid ${T.teal}33`,
          }}>
            <div>
              <div style={{ fontSize: "11px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>Combined Daily Margin Uplift</div>
              <div style={{ fontFamily: T.fontMono, fontSize: isMobile ? "20px" : "24px", color: T.teal, fontWeight: 600 }}>
                ${(totalMarginUplift / 1000).toFixed(0)}k / day
              </div>
            </div>
            <div style={{ borderLeft: isMobile ? "none" : `1px solid ${T.border2}`, borderTop: isMobile ? `1px solid ${T.border}` : "none", paddingLeft: isMobile ? 0 : "12px", paddingTop: isMobile ? "10px" : 0 }}>
              <div style={{ fontSize: "11px", color: T.textMute, textTransform: "uppercase", letterSpacing: "0.05em" }}>Annualised</div>
              <div style={{ fontFamily: T.fontMono, fontSize: isMobile ? "16px" : "18px", color: T.text }}>
                ${((totalMarginUplift * 365) / 1e6).toFixed(1)}M / year
              </div>
            </div>
          </div>

          {actions.map((a, i) => <ActionCard key={a.id} action={a} rank={i + 1} />)}
        </div>
      )}

      {/* ── Architecture tab ── */}
      {activeTab === "architecture" && <ArchitecturePage />}

      {/* ── KPI tab ── */}
      {activeTab === "kpis" && (
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fill, minmax(170px, 1fr))",
            gap: "8px",
          }}>
            {kpiCards.map(k => (
              <KPICard key={k.label} label={k.label} value={k.value} unit={k.unit} severity={k.severity} sub={k.sub} />
            ))}
          </div>

          {/* Benchmark table */}
          <div style={{ marginTop: "20px" }}>
            <SectionTitle>Benchmark Comparison</SectionTitle>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border2}` }}>
                    {["KPI", "Current", "Benchmark", "Gap", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: T.textMute, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Kero Yield",    current: `${kpis.keroYieldPct?.toFixed(2)} vol%`,  bench: `${BENCHMARKS.keroYieldPct} vol%`,  gap: kpis.keroYieldPct ? ((kpis.keroYieldPct - BENCHMARKS.keroYieldPct).toFixed(2)) : null, unit: "vol%",    better: "higher" },
                    { name: "Energy Int.",   current: `${kpis.energyIntensity ? (kpis.energyIntensity*1000).toFixed(1) : "—"} kW/m³hr`, bench: `${(BENCHMARKS.energyIntensity*1000).toFixed(0)} kW/m³hr`, gap: kpis.energyIntensity ? ((kpis.energyIntensity - BENCHMARKS.energyIntensity)*1000).toFixed(1) : null, unit: "kW", better: "lower" },
                    { name: "Availability", current: `${kpis.availability?.toFixed(1)}%`,      bench: `${BENCHMARKS.availability}%`,       gap: kpis.availability ? ((kpis.availability - BENCHMARKS.availability).toFixed(1)) : null, unit: "%",       better: "higher" },
                    { name: "Column ΔP",    current: `${kpis.dpCol?.toFixed(0)} mbar`,         bench: `${BENCHMARKS.dpCol} mbar`,          gap: kpis.dpCol ? ((kpis.dpCol - BENCHMARKS.dpCol).toFixed(0)) : null, unit: "mbar",    better: "lower" },
                  ].map(row => {
                    const gapNum = parseFloat(row.gap);
                    const good   = row.better === "higher" ? gapNum >= 0 : gapNum <= 0;
                    const color  = gapNum === 0 ? T.teal : good ? T.info : T.warning;
                    return (
                      <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "9px 10px", color: T.textBody, whiteSpace: "nowrap" }}>{row.name}</td>
                        <td style={{ padding: "9px 10px", fontFamily: T.fontMono, color: T.text, whiteSpace: "nowrap" }}>{row.current}</td>
                        <td style={{ padding: "9px 10px", fontFamily: T.fontMono, color: T.textMute, whiteSpace: "nowrap" }}>{row.bench}</td>
                        <td style={{ padding: "9px 10px", fontFamily: T.fontMono, color, whiteSpace: "nowrap" }}>
                          {row.gap != null ? `${gapNum >= 0 ? "+" : ""}${row.gap} ${row.unit}` : "—"}
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <SeverityBadge severity={good ? "info" : "warning"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────
function StatusPill({ count, label, color }) {
  return (
    <div style={{
      display: "flex", gap: "5px", alignItems: "center",
      background: color + "18", border: `1px solid ${color}44`,
      borderRadius: "20px", padding: "4px 10px",
    }}>
      <span style={{ fontFamily: T.fontMono, fontWeight: 700, color, fontSize: "12px" }}>{count}</span>
      <span style={{ fontSize: "11px", color: T.textMute }}>{label}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: T.textDim, marginBottom: "10px" }}>
      {children}
    </div>
  );
}

function FileBtn({ children, onClick, disabled, accent, fullWidth }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:   accent ? T.teal : T.surface2,
        border:       `1px solid ${accent ? T.teal : T.border2}`,
        borderRadius: T.r4,
        padding:      "7px 12px",
        color:        accent ? T.bg : T.textBody,
        fontSize:     "12px",
        cursor:       disabled ? "not-allowed" : "pointer",
        whiteSpace:   "nowrap",
        opacity:      disabled ? 0.6 : 1,
        fontWeight:   accent ? 600 : 400,
        flex:         fullWidth ? 1 : "none",
        minHeight:    "36px",
      }}>
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: "32px 16px", textAlign: "center", color: T.textDim, fontSize: "14px" }}>{text}</div>
  );
}
