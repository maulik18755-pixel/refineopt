import { BENCHMARKS } from "../data/sampleData.js";

/**
 * Generate top-N prioritised margin improvement actions from analysis output.
 * Pure function — no React, no side effects.
 *
 * @param {object} proc  - process snapshot
 * @param {object} lab   - lab snapshot
 * @param {Array}  findings - from analyzeCDU()
 * @returns {Array} actions sorted by estimated daily margin impact (desc)
 */
export function getMarginActions(proc, lab, findings = []) {
  const p = proc || {};
  const l = lab || {};
  const actions = [];

  // ── ACTION 1: Kerosene Yield Optimisation ────────────────────────────────
  if (l.keroYieldPct != null && l.keroYieldMax != null) {
    const yieldGap = l.keroYieldMax - l.keroYieldPct;           // vol%
    const feedBPD  = (p.feedRate || 0) * 24 / 0.158987;         // convert m³/hr → BPD
    const extraKeroBPD = feedBPD * (yieldGap / 100);
    const keroNetPremium = 17;                                   // $/bbl kerosene vs crude
    const dailyUplift = extraKeroBPD * keroNetPremium;

    if (yieldGap > 0.3) {
      actions.push({
        id: "ACT-001",
        priority: "critical",
        findingRef: "CDU-009",
        title: "Close the Kerosene Yield Gap",
        what: `Yield is running at ${l.keroYieldPct.toFixed(2)} vol% vs a demonstrated best of ${l.keroYieldMax.toFixed(2)} vol%. A ${yieldGap.toFixed(2)} vol% gap exists.`,
        how: [
          `Increase T_COT by 1–2°C toward 357°C while monitoring flash point (current mean ${(l.keroFlashPt || 42).toFixed(1)}°C — headroom exists).`,
          `Tighten kerosene draw temperature control (T_KEROSENE_DRAW) to pull heavier into the kerosene cut without exceeding FBP spec (current FBP ${(l.keroFBP || 265).toFixed(0)}°C vs limit 270°C).`,
          "Verify stripping steam is at setpoint — low steam reduces partial-pressure stripping and clips light ends from kerosene.",
        ],
        timeframe: "immediate",
        estimatedDailyMargin: Math.round(dailyUplift),
        estimatedDailyMarginNote: `~$${(dailyUplift / 1000).toFixed(0)}k/day at $${keroNetPremium}/bbl kerosene-crude spread on ${Math.round(extraKeroBPD).toLocaleString()} incremental BPD kerosene`,
        confidence: "high",
        kpi: "Kerosene Yield",
        kpiTarget: `${l.keroYieldMax.toFixed(2)} vol%`,
        kpiCurrent: `${l.keroYieldPct.toFixed(2)} vol%`,
      });
    }
  }

  // ── ACTION 2: Restore Preheat Train / Reduce Energy Intensity ───────────
  if (p.energyIntensity != null) {
    const intensityGap = p.energyIntensity - BENCHMARKS.energyIntensity;  // MW/(m³/hr)
    const energySavedMW = intensityGap * (p.feedRate || 653);
    const fuelPricePerGJ = 4.5;                                 // $/GJ typical refinery fuel gas
    const dailyFuelSaving = energySavedMW * 3.6 * 24 * fuelPricePerGJ;  // MW → GJ/hr → GJ/day → $
    // Preheat improvement also unlocks throughput headroom
    const throughputGainPct = Math.min(intensityGap / 0.010 * 1.5, 5); // ~1.5% throughput per 10 kW/m³/hr
    const feedBPD = (p.feedRate || 653) * 24 / 0.158987;
    const throughputValueDaily = feedBPD * (throughputGainPct / 100) * 3;  // $3/bbl crude margin
    const totalDaily = dailyFuelSaving + throughputValueDaily;

    if (intensityGap > 0.003) {
      actions.push({
        id: "ACT-002",
        priority: "high",
        findingRef: "CDU-006",
        title: "Recover Preheat Train Performance",
        what: `Energy intensity is ${(p.energyIntensity * 1000).toFixed(1)} kW/(m³/hr feed) — ${((intensityGap / BENCHMARKS.energyIntensity) * 100).toFixed(0)}% above the ${(BENCHMARKS.energyIntensity * 1000).toFixed(0)} kW benchmark. This implies significant fouling in the crude preheat exchangers.`,
        how: [
          "Run a heat exchanger duty audit: compare current UA (dirty) against design UA (clean) for each exchanger in the train. Any exchanger below 60% clean UA should be prioritised for cleaning.",
          "Target the two or three highest-duty exchangers first — typically the hot-end crude/product exchangers (near-heater) where fouling rate is highest.",
          `Recovering ${(energySavedMW).toFixed(1)} MW of preheat frees equivalent furnace capacity — use it to increase throughput rather than reduce firing (throughput gain is higher margin than fuel saving alone).`,
        ],
        timeframe: "next-opportunity",
        estimatedDailyMargin: Math.round(totalDaily),
        estimatedDailyMarginNote: `~$${(totalDaily / 1000).toFixed(0)}k/day: $${(dailyFuelSaving / 1000).toFixed(0)}k fuel saving + $${(throughputValueDaily / 1000).toFixed(0)}k throughput value`,
        confidence: "medium",
        kpi: "Energy Intensity",
        kpiTarget: `${(BENCHMARKS.energyIntensity * 1000).toFixed(0)} kW/(m³/hr)`,
        kpiCurrent: `${(p.energyIntensity * 1000).toFixed(1)} kW/(m³/hr)`,
      });
    }
  }

  // ── ACTION 3: Fix Column ΔP Blind Spot → Safe Throughput Push ────────────
  if (p.dpColSatPct != null && p.dpColSatPct > 3) {
    const feedBPD = (p.feedRate || 653) * 24 / 0.158987;
    // With proper ΔP visibility, estimate 2% throughput push is achievable
    const throughputGainPct = 2.0;
    const dailyGainBPD = feedBPD * (throughputGainPct / 100);
    const marginPerBbl = 3.5;                                   // $/bbl integrated crude margin
    const dailyGain = dailyGainBPD * marginPerBbl;
    const instrumentCost = 8000;                                // ~$8k for a new DP transmitter

    actions.push({
      id: "ACT-003",
      priority: "high",
      findingRef: "CDU-005",
      title: "Extend DP_COL Instrument Range & Unlock Throughput",
      what: `The column differential pressure transmitter saturates at 250 mbar and is clamped ${p.dpColSatPct.toFixed(1)}% of operating time. The true column ΔP is unknown during these periods — operators cannot safely push throughput without flooding visibility.`,
      how: [
        "Replace or parallel the existing DP_COL transmitter with a 0–400 mbar range instrument (capital cost ~$8,000). This is a short-duration job executable during next planned outage.",
        "Once proper ΔP visibility is restored, trial a controlled throughput increase of +2% increments, monitoring column ΔP and product quality at each step.",
        `If column is not actually flooding (current ΔP mean ${(p.dpCol || 177).toFixed(0)} mbar is well below mechanical limit), a 2% throughput increase is achievable — worth $${(dailyGain / 1000).toFixed(0)}k/day.`,
      ],
      timeframe: "next-turnaround",
      estimatedDailyMargin: Math.round(dailyGain),
      estimatedDailyMarginNote: `~$${(dailyGain / 1000).toFixed(0)}k/day from ${throughputGainPct}% throughput increase once safe operating window is confirmed. Instrument payback < 1 day of margin uplift.`,
      confidence: "medium",
      kpi: "Column ΔP Visibility",
      kpiTarget: "0% instrument saturation",
      kpiCurrent: `${p.dpColSatPct.toFixed(1)}% of runtime at upper range limit`,
    });
  }

  // ── ACTION 4: T_PASS3 Calibration (lower priority unless near critical) ──
  const pass3Finding = findings.find(f => f.id === "CDU-003");
  if (pass3Finding && !actions.find(a => a.findingRef === "CDU-003")) {
    actions.push({
      id: "ACT-004",
      priority: "medium",
      findingRef: "CDU-003",
      title: "Calibrate or Replace T_PASS3 Thermocouple",
      what: `T_PASS3 has a measured drift of ${(p.pass3DriftRatePerYear || 3).toFixed(1)}°C/year relative to the other three furnace pass thermocouples. APC pass-balancing logic is compensating incorrectly.`,
      how: [
        "Schedule thermocouple calibration check at next heater decoking or short outage opportunity.",
        "Until calibration, apply a manual correction offset in the DCS of approximately +1.5°C to T_PASS3 reading (representing half the expected 2-year drift at current rate).",
        "Validate pass flow balance by comparing pass inlet/outlet temperature differences — equal ΔT across passes indicates balanced firing.",
      ],
      timeframe: "next-opportunity",
      estimatedDailyMargin: 2000,
      estimatedDailyMarginNote: "~$2k/day fuel efficiency improvement from correct pass balancing. Primary benefit is reduced tube hot-spot risk and extended run length.",
      confidence: "high",
      kpi: "T_PASS3 vs Peers",
      kpiTarget: "< 1°C/year drift",
      kpiCurrent: `${(p.pass3DriftRatePerYear || 3).toFixed(1)}°C/year drift`,
    });
  }

  // Sort by estimated daily margin descending
  actions.sort((a, b) => b.estimatedDailyMargin - a.estimatedDailyMargin);

  return actions.slice(0, 3);
}
