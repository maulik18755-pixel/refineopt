# RefineOpt — CDU Performance Intelligence

A browser-based diagnostic tool for Crude Distillation Unit operations. Upload your process historian and lab data, and RefineOpt identifies active constraints, flags instrumentation issues, and quantifies the top three actions that will improve plant margin — no spreadsheets, no consultant required.

---

## The Problem It Solves

Mid-market refineries have the data but not the tooling. Historian tags flow into PI or a similar DCS, lab results accumulate in LIMS, and a process engineer spends hours cross-referencing them in Excel to answer a question the plant manager asks every morning: *are we leaving money on the table, and if so, where?*

RefineOpt automates that cross-referencing. It applies a library of process engineering rules against your operating data — the same checks a senior engineer would run — and returns a prioritised finding list with dollar-quantified margin actions within seconds of loading your data.

The tool is built on **Theory of Constraints (TOC)** logic: identify the binding constraint in the crude-vacuum system, exploit it fully before spending capital, subordinate everything else to support it. The output is always actionable, always ranked by estimated daily margin impact.

---

## What the Tool Does

### Data ingestion

The tool accepts two CSV exports from your plant historian and LIMS:

| File | Source | Content |
|------|--------|---------|
| `cdu_process_data.csv` | SCADA / DCS historian | 1-minute tag data — feed rate, furnace temps, column pressures, product flows, utility streams |
| `cdu_lab_data.csv` | LIMS | Periodic lab results — kerosene yield, flash point, IBP/FBP, naphtha RONC, gas oil cloud point |

If you don't have your own files ready, the tool pre-loads a representative two-year operating dataset (Jan 2022 – Dec 2023, Arab Light crude, Normal throughput mode) so you can explore the interface immediately.

### Diagnostic engine

All analysis runs entirely in your browser — no data leaves your machine. The engine computes the following from the uploaded data:

**Process statistics computed from historian data:**
- Average and distribution of key manipulated variables: COT, reflux flow, crude feed rate, strip steam
- Furnace pass temperature standard deviation (pass imbalance indicator)
- Column differential pressure mean and, critically, the percentage of operating time where the DP transmitter is reading at its upper range limit (saturation)
- Energy intensity: furnace duty divided by feed rate, in kW per m³/hr
- Plant availability: percentage of historian records where the unit is in a running operating mode
- Reflux-to-feed ratio as a dimensionless process efficiency indicator

**Statistics computed from lab data:**
- Kerosene yield mean, standard deviation, and observed maximum over the period
- Flash point mean and standard deviation, used to compute a 3σ lower bound and estimate off-spec exceedance risk
- IBP, FBP, naphtha RONC, gas oil cloud point

These statistics are passed to the diagnostic rule library, which evaluates 11 independent rule checks (described below) and returns a structured finding for each rule that triggers.

### Output: three panels

**Findings** — every rule that fires, sorted critical → warning → info. Click any finding card to expand it and read the operational context: what the measured value is, what the threshold is, and exactly why it matters for equipment life, product quality, or throughput.

**Top 3 Margin Actions** — the three highest-value interventions available right now, ranked by estimated daily margin uplift in $/day. Each action card includes step-by-step instructions for the operator or process engineer, a KPI showing current vs target, and an annualised margin estimate.

**KPI Dashboard** — a 14-card grid of all computed process and quality metrics, colour-coded by severity, plus a benchmark comparison table showing how the unit performs against industry best-practice targets.

---

## Diagnostic Rules

The engine implements 11 rules. Each rule has a unique ID, a severity level, and numeric thresholds defined in `src/data/operatingRanges.js` — not hardcoded in the rule logic — so they can be adjusted for your crude slate or equipment design without touching the analysis code.

| ID | Parameter | Warning threshold | Critical threshold | What it catches |
|----|-----------|------------------|--------------------|-----------------|
| CDU-001 | Coil Outlet Temperature | < 350°C or > 358°C | < 345°C or > 362°C | Under-vaporisation or thermal cracking risk |
| CDU-002 | Pass temperature σ | > 3.0°C | > 5.0°C | Furnace pass imbalance / tube hot spots |
| CDU-003 | T_PASS3 drift rate | ≥ 2°C/year | — | Thermocouple drift corrupting pass balancing |
| CDU-004 | Column ΔP mean | > 200 mbar | > 230 mbar | Approaching hydraulic flooding limit |
| CDU-005 | DP_COL instrument saturation | > 2% of runtime | ≥ 10% of runtime | Blind spot masking actual column loading |
| CDU-006 | Energy intensity | > 95 kW/(m³/hr) | > 110 kW/(m³/hr) | Preheat train fouling / excess furnace firing |
| CDU-007 | F_REFLUX meter drift | > 5 m³/hr/year | — | Flow meter bias corrupting APC setpoint logic |
| CDU-008 | Plant availability | < 90% | < 85% | Shutdown frequency eating throughput |
| CDU-009 | Kerosene yield gap | > 0.5 vol% below observed max | — | Unrealised yield potential |
| CDU-010 | Flash point 3σ lower bound | < 39°C | Mean < 40°C | Off-spec kerosene risk |
| CDU-011 | Reflux-to-feed ratio | Outside 0.50–0.70 | Outside 0.45–0.80 | Over/under-refluxing |

**Severity definitions:**
- **Critical** — immediate operational risk: equipment damage potential, imminent spec violation, or significant safety concern. Requires same-shift response.
- **Warning** — suboptimal performance: margin is being lost or risk is building. Address within the current operating week.
- **Info** — observation worth tracking: no immediate action required but should inform planning decisions.

---

## How to Run It

### Prerequisites

- Node.js 18 or later. Check with `node --version`. If you don't have it, download from [nodejs.org](https://nodejs.org).
- npm (comes bundled with Node.js).
- A modern browser (Chrome, Firefox, Edge, or Safari).

### Start the tool

```bash
# Clone or copy the refineopt/ directory to your machine, then:
cd refineopt
npm install        # downloads dependencies — takes ~30 seconds, only needed once
npm run dev        # starts the local web server
```

Open `http://localhost:5173` in your browser. The tool loads immediately with the pre-loaded sample dataset.

### Load your own data

1. Click **Upload cdu_process_data.csv** and select your process historian export.
2. Click **Upload cdu_lab_data.csv** and select your LIMS export.
3. The diagnostic engine reruns automatically. There is no submit button — results update as soon as the files are parsed.

**Required columns in the process CSV:**

| Column | Description |
|--------|-------------|
| `timestamp` | ISO 8601 datetime, 1-minute intervals |
| `op_mode` | Integer: 0 = shutdown, 1 = low throughput, 2 = normal, 3 = high |
| `crude_grade` | String label (e.g. "Arab Light") |
| `crude_api` | Crude API gravity |
| `F_CRUDE_FEED` | Crude feed rate, m³/hr |
| `T_COT` | Furnace coil outlet temperature, °C |
| `T_PASS1` – `T_PASS4` | Furnace pass outlet temperatures, °C |
| `Q_FURNACE` | Furnace duty, MW |
| `DP_COL` | Column differential pressure, mbar |
| `F_REFLUX` | Reflux flow, m³/hr |
| `F_STRIP_STEAM` | Stripping steam flow, t/hr |
| `F_LPG`, `F_NAPHTHA`, `F_KEROSENE`, `F_GAS_OIL` | Product draw flows, m³/hr |

Additional columns (`T_PREHEAT_OUT`, `T_DESALTER_OUT`, `T_COL_TOP`, `T_COL_BOT`, `L_SUMP`, `Q_COND`, `T_CW_RETURN`, `T_AMBIENT`) are used when present but are not required — the engine skips any rule whose input is not available.

**Required columns in the lab CSV:**

| Column | Description |
|--------|-------------|
| `timestamp` | Datetime of sample collection |
| `op_mode` | Same encoding as process CSV |
| `KERO_YIELD_VOL_PCT` | Kerosene yield, vol% of crude feed |
| `KERO_FLASH_PT_C` | Kerosene flash point, °C |
| `KERO_IBP_C`, `KERO_FBP_C` | Kerosene distillation range, °C |
| `NAPH_RONC` | Naphtha research octane number |
| `GO_CLOUD_PT_C` | Gas oil cloud point, °C |

### Enable AI narrative (optional)

The tool can send the diagnostic output to the Claude API and return a plain-English executive summary, a single top action for the current shift, and a combined margin estimate. This is optional and requires an Anthropic API key.

1. Enter your key in the **Anthropic Key** field (it is saved only in your browser's local storage — never transmitted anywhere except directly to the Anthropic API).
2. Click **Run AI**.
3. The AI panel appears above the tab bar with a two-sentence executive summary, top-priority action, and margin estimate.

If you don't have an API key, all diagnostic rules and margin calculations run fully offline. The AI narrative is additive, not required.

### Stop the server

Press `Ctrl+C` in the terminal where `npm run dev` is running.

---

## Understanding the Output

### Findings panel

Each finding card shows:
- **Severity badge** (Critical / Warning / Info) at top left
- **Finding ID** (e.g. `CDU-005`) and category label
- **Description** — a single sentence stating the measured condition and how it compares to the operating limit
- **Measured / Min / Max chips** — the actual value alongside the threshold that triggered the finding
- **Impact & Context** (click to expand) — the operational consequence: what goes wrong, why, and what equipment or process is affected

Findings are always sorted most-severe first so the shift supervisor sees the highest-priority issue without scrolling.

### Top 3 Margin Actions panel

The three actions with the highest estimated daily dollar impact are displayed, each showing:
- **Rank and priority colour** — #1 is always the highest-value action
- **Timeframe tag** — *Act Now* (executable this shift), *Next Opportunity* (next planned outage or offline period), or *Next Turnaround*
- **Margin uplift estimate** — shown in $/day in the header; the body explains the calculation assumptions (commodity spread, throughput rate, efficiency gain assumed)
- **Action steps** (click to expand) — a numbered list of specific process adjustments or instrument actions, written for a process engineer or console operator
- **KPI current vs target** — the measurable outcome to track

The combined uplift across all three actions is shown at the top of the panel in $/day and annualised to $/year.

**Important note on margin estimates:** The calculations use conservative commodity spread assumptions ($17/bbl kerosene-over-crude premium, $4.50/GJ fuel gas, $3.50/bbl integrated crude margin). If your actual spreads differ, treat the numbers as relative rankings rather than absolute forecasts. The relative order of actions — which intervention unlocks more value than another — is robust to reasonable spread variations.

### KPI Dashboard panel

The 14-card grid shows every computed process and quality metric. Card border and value colour reflect the severity of any finding triggered by that parameter:
- **Teal** — within normal operating range
- **Amber** — warning threshold exceeded
- **Red** — critical threshold exceeded
- **No colour** — parameter not available in uploaded data

The benchmark table below the grid compares four key performance indicators against industry best-practice targets for a well-maintained atmospheric distillation unit of similar throughput and crude type.

---

## Project Structure

```
refineopt/
├── src/
│   ├── engine/
│   │   ├── analyzeCDU.js      # 11 diagnostic rules — pure JavaScript, no UI dependency
│   │   ├── marginActions.js   # Margin action generation and ranking
│   │   └── index.js           # Public engine API
│   ├── data/
│   │   ├── operatingRanges.js # All numeric thresholds — edit here to tune for your unit
│   │   └── sampleData.js      # Pre-loaded two-year CDU dataset snapshot
│   ├── utils/
│   │   └── parseCSV.js        # Browser-side CSV parser — computes stats from raw historian data
│   ├── hooks/
│   │   └── useAIDiagnostic.js # Claude API integration
│   ├── components/            # UI building blocks (KPI cards, finding cards, action cards)
│   ├── pages/
│   │   └── Dashboard.jsx      # Main application page
│   └── styles/
│       └── theme.js           # Colour palette and design tokens
└── CLAUDE.md                  # Full technical specification and domain knowledge reference
```

The engine directory is intentionally kept free of any React or browser dependencies. Every function in `engine/` takes plain JavaScript objects and returns plain JavaScript objects. This means the same diagnostic logic can be called from a Node.js server, a CLI script, or a future REST API without modification.

---

## Adapting the Tool to Your Unit

**Change operating thresholds:** Open `src/data/operatingRanges.js`. Every threshold is defined in one place, labelled with the parameter name and unit. Change the `warn` and `critical` arrays for any parameter and the changes propagate automatically to all findings, KPI card colours, and benchmark comparisons.

**Add a new diagnostic rule:** Add a rule block to `src/engine/analyzeCDU.js` following the existing pattern. Each rule needs a unique ID (`CDU-NNN`), a severity assignment, a human-readable description, a measured value, a threshold, and an impact statement. Add the corresponding threshold entry to `operatingRanges.js`. No other files need to change.

**Change the commodity spread assumptions:** The margin calculations in `src/engine/marginActions.js` use constants at the top of each action block (kerosene premium, fuel gas price, crude margin). Update these to reflect current market prices for your region.

---

## Limitations

- **Averages, not real-time.** When you upload a CSV, the engine computes means and statistics across the full date range of the file. It does not show trends within the period or alert on individual bad readings. For real-time monitoring, the tool would need to be connected to a live historian API.
- **No VDU or preheat train rules yet.** The current release covers CDU diagnostics only. VDU vacuum system analysis and preheat train fouling rules are on the roadmap.
- **Drift rates require external calculation.** The T_PASS3 and F_REFLUX drift rates are not computed from the uploaded CSV in the browser (this requires time-series regression across the full historian). They are pre-populated from the capstone dataset analysis. When using your own data, enter known drift rates manually in `src/data/sampleData.js` or leave them null (the corresponding findings will be suppressed).
- **Margin estimates are indicative.** The $/day figures are calculated from first-principles process relationships and representative commodity spreads. They are directionally correct but should not be used as the sole basis for capital decisions without validation against your unit's specific economics.
