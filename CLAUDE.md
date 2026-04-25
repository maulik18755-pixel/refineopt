# CLAUDE.md — RefineOpt Project Configuration

## Project Overview

RefineOpt is a vertical SaaS platform for optimizing CDU (Crude Distillation Unit), VDU (Vacuum Distillation Unit), and Preheat Train performance in petroleum refineries. It provides automated diagnostics, debottleneck analysis, and actionable recommendations using Theory of Constraints (TOC) methodology applied to process manufacturing.

**Target users:** Plant managers, process engineers, and operations leads at mid-market refineries (50–200 KBPD) in India and Southeast Asia.

**Core value proposition:** Identify the binding constraint in the crude-vacuum system, quantify the throughput/margin unlock, and provide prioritized action plans — replacing expensive consulting engagements and bridging the gap between Excel-based monitoring and enterprise tools like AspenTech/AVEVA.

---

## Tech Stack

- **Frontend:** React 18+ with Vite as build tool
- **Styling:** CSS-in-JS (inline styles) with CSS custom properties for theming. Dark industrial UI aesthetic. No Tailwind, no CSS modules.
- **State Management:** React useState/useReducer. No Redux. Context API only if prop drilling exceeds 3 levels.
- **Routing:** React Router v6 (lazy-loaded routes)
- **Charts/Visualization:** Recharts for data viz, custom SVG for process flow diagrams
- **AI Integration:** Anthropic API (claude-sonnet-4-20250514) for natural-language diagnostic explanations
- **Testing:** Vitest + React Testing Library
- **Deployment:** Vercel (frontend), potential future backend on Railway or Fly.io
- **Package Manager:** npm (not yarn, not pnpm)

---

## Project Structure

```
refineopt/
├── CLAUDE.md                    # This file
├── README.md                    # Public-facing project documentation
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                 # Entry point, router setup
│   ├── App.jsx                  # Root layout (sidebar + content area)
│   │
│   ├── engine/                  # Core analysis & diagnostic logic
│   │   ├── analyzeCDU.js        # CDU-specific diagnostic rules
│   │   ├── analyzeVDU.js        # VDU-specific diagnostic rules
│   │   ├── analyzePreheat.js    # Preheat train diagnostic rules
│   │   ├── constraintEngine.js  # TOC constraint identification & ranking
│   │   ├── debottleneck.js      # Capacity unlock calculations
│   │   ├── benchmarks.js        # Operating range benchmarks by crude type
│   │   └── index.js             # Unified analysis entry point
│   │
│   ├── components/              # Reusable UI components
│   │   ├── InputField.jsx       # Numeric input with unit badge
│   │   ├── FieldGroup.jsx       # Grouped parameter inputs with section header
│   │   ├── ParameterForm.jsx    # Full form for a unit (CDU/VDU/Preheat)
│   │   ├── KPICard.jsx          # Metric display card
│   │   ├── SeverityBadge.jsx    # Critical/Warning/Info tag
│   │   ├── PriorityBadge.jsx    # Priority tag for recommendations
│   │   ├── FindingCard.jsx      # Diagnostic finding display
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   └── ProcessFlowDiagram.jsx  # SVG-based unit schematic
│   │
│   ├── pages/                   # Route-level page components
│   │   ├── Dashboard.jsx        # KPI overview + active findings summary
│   │   ├── CDUPage.jsx          # CDU parameter input form
│   │   ├── VDUPage.jsx          # VDU parameter input form
│   │   ├── PreheatPage.jsx      # Preheat train parameter input form
│   │   ├── AnalysisPage.jsx     # Full diagnostic report
│   │   └── ConstraintMap.jsx    # Visual constraint hierarchy (future)
│   │
│   ├── data/                    # Static data, field definitions, samples
│   │   ├── cduFields.js         # CDU field definitions (key, label, unit, group, range)
│   │   ├── vduFields.js         # VDU field definitions
│   │   ├── preheatFields.js     # Preheat field definitions
│   │   ├── sampleData.js        # Pre-loaded sample operating data
│   │   ├── operatingRanges.js   # Normal/warning/critical thresholds per parameter
│   │   └── crudeLibrary.js      # Crude assay benchmarks (API, sulfur, TBP ranges)
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAnalysis.js       # Memoized analysis computation
│   │   ├── useLocalStorage.js   # Persist form data across sessions (optional)
│   │   └── useAIDiagnostic.js   # Anthropic API integration hook
│   │
│   ├── utils/                   # Utility functions
│   │   ├── formatting.js        # Number formatting, unit conversion
│   │   ├── validation.js        # Input range validation
│   │   └── export.js            # Export analysis as PDF/JSON
│   │
│   └── styles/                  # Global styles and theme
│       ├── theme.js             # Color palette, spacing, typography tokens
│       └── global.css           # Minimal global resets and font imports
│
└── tests/
    ├── engine/                  # Unit tests for analysis logic
    │   ├── analyzeCDU.test.js
    │   ├── analyzeVDU.test.js
    │   ├── analyzePreheat.test.js
    │   └── constraintEngine.test.js
    └── components/              # Component rendering tests
        └── InputField.test.jsx
```

---

## Architecture Principles

### Separation of Concerns

The **engine/** directory is the brain. It must be **pure JavaScript with zero React dependencies**. Every function takes plain objects as input and returns plain objects as output. This ensures:
- Engine logic is independently testable without DOM or React
- Engine can be reused in a future Node.js backend or API service
- Engine can be called from the Anthropic API integration to enrich AI responses

The **components/** directory is presentation only. Components receive data via props and call callbacks. No business logic in components.

The **pages/** directory wires components to engine outputs and manages form state.

### Data Flow

```
User Input (forms) → State (useState in pages) → Engine (pure functions) → Analysis Output → UI (components)
```

### Engine Output Schema

All analysis functions return objects conforming to this shape:

```javascript
{
  findings: [
    {
      id: "CDU-001",           // Unique finding identifier
      severity: "critical",     // "critical" | "warning" | "info"
      area: "CDU",             // "CDU" | "VDU" | "Preheat" | "System"
      category: "overflash",   // Machine-readable category for filtering
      text: "Human-readable finding description",
      value: 6.5,              // The actual measured value
      threshold: { min: 2, max: 4, unit: "vol%" },  // Expected range
      impact: "Excess heater duty consumption, reduced throughput capacity"
    }
  ],
  recommendations: [
    {
      id: "REC-001",
      priority: "high",        // "critical" | "high" | "medium" | "low"
      area: "CDU",
      findingRef: "CDU-001",   // Links to the finding it addresses
      text: "Actionable recommendation text",
      estimatedImpact: "Saving ~0.5 MMBtu/hr per 1% overflash reduction",
      timeframe: "immediate"   // "immediate" | "next-turnaround" | "capital-project"
    }
  ],
  bottlenecks: [
    {
      area: "CDU Heater",
      equipment: "Fired Heater H-101",
      constraint: "thermal",   // "thermal" | "hydraulic" | "mechanical" | "vacuum"
      text: "Description of the bottleneck",
      capacityLimited: true,   // Is this currently limiting throughput?
      unlockEstimate: { value: 3, unit: "KBPD" }  // Estimated capacity gain if resolved
    }
  ],
  kpis: {
    cduFeedRate: 120,
    vduFeedRate: 60,
    specificEnergy: 1.54,
    preheatEfficiency: 56.5,
    totalPADuty: 107,
    constraintUtilization: 94.2  // % utilization of binding constraint
  }
}
```

---

## Domain Knowledge Reference

This section provides essential refinery domain context. Use this when writing diagnostic rules, generating recommendations, or building UI labels.

### CDU (Crude Distillation Unit)

The CDU separates crude oil into fractions by boiling point at near-atmospheric pressure.

**Critical parameters and their significance:**

| Parameter | Typical Range | Why It Matters |
|-----------|--------------|----------------|
| Crude Feed Rate | 50–200 KBPD | Primary throughput metric |
| Crude API Gravity | 20–45 °API | Lighter crude = higher naphtha yield, lower heater duty |
| Desalter Temperature | 250–290 °F | Too low = poor salt removal; too high = vaporization in desalter |
| Flash Zone Temperature | 640–680 °F | Determines vaporization of crude and product yields |
| Flash Zone Pressure | 15–22 psig | Lower pressure improves separation but needs adequate overhead system |
| Overflash | 2–4 vol% | Below 2% = entrainment risk; above 5% = wasted energy |
| Heater COT | 680–720 °F | Above 720°F = thermal cracking risk, coke formation |
| Heater Duty | varies | Direct function of feed rate and preheat; the constraint lever |
| Reflux Ratio | 1.2–1.8 | Too low = poor fractionation; too high = wasted energy |
| Column Top Pressure | 15–22 psig | Higher pressure reduces relative volatility |
| Product Cut Points (D86 95%) | varies by spec | Giveaway vs. off-spec trade-off |
| Stripping Steam | varies | Reduces partial pressure, improves stripping |

**Common CDU constraints:**
1. Fired heater duty (most common) — limited by COT, tube metallurgy, or fuel system
2. Column diameter / tray flooding — limits vapor traffic at high throughput
3. Overhead condenser capacity — limits reflux and column pressure control
4. Crude charge pump / preheat train pressure drop — hydraulic limit

### VDU (Vacuum Distillation Unit)

The VDU processes atmospheric residue under vacuum (10–50 mmHg) to recover valuable gas oils without thermal cracking.

**Critical parameters:**

| Parameter | Typical Range | Why It Matters |
|-----------|--------------|----------------|
| Flash Zone Pressure | 20–35 mmHg abs | THE critical parameter — directly determines VGO cut point and yield |
| Column Top Pressure | 8–15 mmHg abs | Must be lower than flash zone; differential is column ΔP |
| Ejector Suction Pressure | 8–12 mmHg abs | Indicates vacuum system health |
| Packing ΔP | 1–4 mmHg | Above 5 mmHg = flooding risk, coking, capacity limit |
| Overflash | 2–4 vol% | Prevents asphaltene/metals carryover into HVGO |
| Wash Oil Rate | 3–8 GPM | Must wet wash zone packing to prevent coking |
| HVGO End Point | 900–1050 °F (TBP) | Higher = more VGO yield but metals/CCR risk |
| Heater Skin Temp | <800 °F | Above 800°F = tube failure risk, coke laydown |

**Common VDU constraints:**
1. Vacuum system performance (ejectors, condensers, air leaks)
2. Wash zone packing flooding or coking
3. Heater skin temperature (metallurgical limit)
4. HVGO quality limits (metals, CCR contamination)

### Preheat Train

The preheat train is a network of shell-and-tube heat exchangers that recover heat from hot product streams to preheat incoming crude, reducing fired heater duty.

**Critical parameters:**

| Parameter | Typical Range | Why It Matters |
|-----------|--------------|----------------|
| CIT (Crude Inlet Temp) | 60–100 °F | Starting temperature of crude |
| Heater Inlet Temp | 470–550 °F | Higher = less heater duty needed |
| Preheat ΔT | 380–470 °F | Total heat recovery; directly offsets heater firing |
| Clean UA | design value | Heat transfer coefficient × area at clean conditions |
| Dirty UA | measured | Current heat transfer performance; ratio to clean = efficiency |
| Fouling Factor | 0.001–0.005 hr·ft²·°F/Btu | Higher = more fouled |
| HX Pressure Drop | 40–80 psi total | Affects crude pump capacity; fouled exchangers have higher ΔP |
| Pump-Around Duties | varies | Heat recovery from column side-draws; distribution matters |

**Key relationships:**
- Every 20°F increase in preheat saves ~2–3% heater fuel and can enable 3–5% throughput increase
- Dirty/Clean UA ratio below 60% = severe fouling, prioritize cleaning
- PA distribution: top-heavy PA loading wastes driving force; redistribute to mid/bottom PAs
- High HX pressure drop can bottleneck crude charge pumps before heater capacity is reached

### Theory of Constraints (TOC) — Applied to Refining

The five focusing steps applied to CDU/VDU operations:

1. **IDENTIFY** the constraint — Which equipment is currently limiting throughput? (heater, column, vacuum system, preheat, pumps)
2. **EXPLOIT** the constraint — Maximize output from the bottleneck without capital spend (optimize operating parameters, clean exchangers, fix air leaks)
3. **SUBORDINATE** everything else — Adjust non-constraint equipment to support the constraint (shift PA duties, adjust cut points, modify reflux)
4. **ELEVATE** the constraint — Capital investment if exploit/subordinate insufficient (add exchanger area, upgrade ejectors, retube heater)
5. **REPEAT** — After debottlenecking, a new constraint emerges; go back to step 1

### Units and Terminology

- **KBPD** — Thousand Barrels Per Day (throughput)
- **BPD** — Barrels Per Day
- **COT** — Coil Outlet Temperature (fired heater outlet)
- **CIT** — Crude Inlet Temperature (preheat train entry)
- **UA** — Overall heat transfer coefficient × area (Btu/hr·°F)
- **TBP** — True Boiling Point (lab distillation method)
- **D86** — ASTM D86 distillation (atmospheric distillation test)
- **mmHg abs** — Millimeters of mercury, absolute (vacuum measurement)
- **psig** — Pounds per square inch, gauge (pressure measurement)
- **MMBtu/hr** — Million BTU per hour (heat duty)
- **PA** — Pump-Around (heat recovery circuit from column)
- **VGO** — Vacuum Gas Oil (LVGO + HVGO)
- **VR** — Vacuum Residue (bottom product from VDU)
- **CCR** — Conradson Carbon Residue (quality metric for VGO)
- **FCC** — Fluid Catalytic Cracker (downstream unit that processes VGO)
- **AGO** — Atmospheric Gas Oil

---

## Coding Conventions

### General

- Use **functional components** with hooks. No class components.
- Use **named exports** for components and utilities. Use **default export** only for page-level components.
- **No TypeScript** for now — plain JavaScript with JSDoc comments for complex function signatures.
- Prefer **const** over let. Never use var.
- Use **async/await** over .then() chains.
- Destructure props in function signatures: `function KPICard({ label, value, unit })`.
- Use semicolons consistently.

### Naming

- Components: **PascalCase** — `KPICard.jsx`, `SeverityBadge.jsx`
- Engine functions: **camelCase** — `analyzeCDU()`, `identifyConstraint()`
- Data files: **camelCase** — `cduFields.js`, `sampleData.js`
- Constants: **UPPER_SNAKE_CASE** — `INITIAL_CDU`, `CDU_FIELDS`
- Finding IDs: **AREA-NNN** format — `CDU-001`, `VDU-003`, `PHT-002`
- CSS custom properties: **--refopt-{category}-{name}** — `--refopt-color-critical`

### UI/Styling

- **Dark industrial theme** — background `#0d1117`, text `#c9d1d9`, accent `#00bfa5`
- **Typography:** `'Instrument Sans'` for body, `'JetBrains Mono'` for data/labels/numbers
- **Color palette:**
  - Background: `#0d1117` (base), `rgba(255,255,255,0.02–0.06)` (cards/surfaces)
  - Text: `#e8eaf6` (primary), `#c9d1d9` (body), `#8892a4` (labels), `#5c6b88` (muted)
  - Accent: `#00bfa5` (teal — primary actions, highlights)
  - Critical: `#ff1744`
  - Warning: `#ff9100`
  - Info/Success: `#69f0ae`
  - Data: `#448aff` (blue), `#ab47bc` (purple), `#ffd600` (amber)
- **Borders:** `1px solid rgba(255,255,255,0.06–0.12)`
- **Border radius:** 4px for inputs, 6px for cards, 8px for panels
- All styles are inline React style objects. No CSS files per component.
- **No Tailwind. No CSS modules. No styled-components.**

### Engine Rules

- Every diagnostic rule must have:
  - A unique ID (e.g., `CDU-OVF-001`)
  - A severity level (`critical`, `warning`, `info`)
  - A clear threshold (numeric boundary that triggers the finding)
  - A human-readable explanation of WHY this matters operationally
  - An estimated impact (quantified where possible — KBPD, MMBtu, $/day)
- Rules should be **data-driven** — define thresholds in `operatingRanges.js`, not hardcoded in analysis functions
- Cross-unit interactions must be captured (e.g., preheat fouling → higher heater duty → COT constraint → CDU throughput limit)

### Error Handling

- All `parseFloat()` calls on user input must check for `NaN` before using the value
- Engine functions must never throw — return empty findings arrays for missing data
- API calls (Anthropic) must have try/catch with user-friendly error messages
- Form inputs should show visual feedback for out-of-range values (yellow border for warning, red for critical)

---

## Testing Strategy

### Engine Tests (Priority: HIGH)

Every diagnostic rule must have corresponding test cases:

```javascript
// Example test structure
describe('analyzeCDU', () => {
  it('flags overflash above 5% as warning', () => {
    const result = analyzeCDU({ ...baselineData, overflashPercent: 6.5 });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ severity: 'warning', category: 'overflash' })
    );
  });

  it('flags overflash below 2% as critical', () => {
    const result = analyzeCDU({ ...baselineData, overflashPercent: 1.2 });
    expect(result.findings).toContainEqual(
      expect.objectContaining({ severity: 'critical', category: 'overflash' })
    );
  });

  it('returns no findings for normal operating data', () => {
    const result = analyzeCDU(normalOperatingData);
    expect(result.findings.filter(f => f.severity === 'critical')).toHaveLength(0);
  });
});
```

### Component Tests (Priority: MEDIUM)

- Test that forms render all fields
- Test that sample data loads correctly
- Test that KPI cards display formatted values

### Integration Tests (Priority: LOW, future)

- End-to-end flow: enter data → run analysis → verify findings displayed
- API integration: mock Anthropic API responses

---

## API Integration Notes

### Anthropic API Usage

When integrating AI-powered diagnostics:

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are a senior refinery process engineer specializing in CDU/VDU optimization.
Given operating data and diagnostic findings, provide:
1. A plain-language executive summary (2-3 sentences)
2. The single most impactful action the operator should take TODAY
3. Estimated margin improvement in $/day if the top recommendation is implemented
Respond in JSON format only.`,
    messages: [{ role: "user", content: JSON.stringify(analysisOutput) }]
  })
});
```

- Always use `claude-sonnet-4-20250514` model
- System prompt must establish refinery process engineering context
- Send the structured engine output as input — let the AI interpret and narrate
- Parse response as JSON; strip markdown fences before parsing
- Cache AI responses for identical input data to reduce API calls

---

## Git Conventions

- **Branch naming:** `feature/cdu-analysis-rules`, `fix/vdu-pressure-threshold`, `docs/readme-update`
- **Commit messages:** Conventional commits — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- **PR descriptions:** Must include what changed, why, and how to test
- **No commits directly to main** — always branch and PR (even for solo dev)

---

## Development Workflow

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

---

## Environment Variables

```bash
# .env.local (not committed to git)
VITE_ANTHROPIC_API_KEY=sk-ant-...   # Only for local dev; production uses proxy
```

**Never commit API keys.** The production deployment should proxy API calls through a serverless function to keep the key server-side.

---

## Roadmap Context

When making architectural decisions, keep these future capabilities in mind:

1. **Multi-unit constraint chaining** — CDU constraint affects VDU feed, which affects FCC feed. The engine should eventually model cross-unit dependencies.
2. **Historical trending** — Storing snapshots of operating data over time to show fouling trends, seasonal patterns, and post-turnaround recovery.
3. **Crude slate optimization** — Given a library of crude assays, recommend optimal blend for current equipment constraints.
4. **MES/DCS integration** — Future ability to pull live data from PI Historian, OsiSoft, or Honeywell PHD instead of manual entry.
5. **Multi-plant dashboard** — Aggregate view across multiple refinery sites for corporate operations teams.
6. **Export/reporting** — Generate PDF reports for management review and turnaround planning.

Architecture decisions today should not block any of these. In particular, keep the engine pure and stateless so it can run server-side when we add a backend.

---

## Common Pitfalls

- **Don't mix units.** The UI shows imperial units (°F, psig, KBPD). If adding metric support later, do conversion at the display layer, not in the engine.
- **Don't hardcode thresholds in JSX.** All operating range thresholds belong in `data/operatingRanges.js` so they can be adjusted per crude type or unit configuration.
- **Don't assume all fields are filled.** Users will enter partial data. The engine must gracefully handle incomplete inputs and only generate findings for parameters that have data.
- **Don't use relative severity.** "Critical" means operational risk or equipment damage potential. "Warning" means suboptimal performance. "Info" means observation. Don't inflate severity.
- **Don't forget cross-unit effects.** High preheat fouling → high heater duty → high COT → CDU throughput limit. The constraint engine must trace these dependency chains.
