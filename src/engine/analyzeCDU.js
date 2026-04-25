import { getSeverity, RANGES } from "../data/operatingRanges.js";

/**
 * Core CDU diagnostic engine.
 * Input: plain objects (process snapshot + lab snapshot).
 * Output: { findings[], kpis{} }
 * Never throws — returns empty arrays for missing data.
 */

function finding(id, severity, category, text, value, threshold, impact) {
  return { id, severity, area: "CDU", category, text, value, threshold, impact };
}

export function analyzeCDU(proc, lab) {
  const findings = [];
  if (!proc && !lab) return { findings, kpis: {} };

  const p = proc || {};
  const l = lab || {};

  // ── CDU-001  Coil Outlet Temperature ────────────────────────────────────
  if (p.cot != null) {
    const sev = getSeverity("cot", p.cot);
    if (sev !== "ok") {
      findings.push(finding(
        "CDU-001", sev, "furnace-cot",
        `Coil outlet temperature (COT) is ${p.cot.toFixed(1)}°C — ${p.cot > RANGES.cot.warn[1] ? "above upper" : "below lower"} operating limit.`,
        p.cot,
        { min: RANGES.cot.warn[0], max: RANGES.cot.warn[1], unit: "°C" },
        p.cot > RANGES.cot.warn[1]
          ? "Risk of thermal cracking and accelerated coke deposition in furnace tubes. Tube life reduced at sustained COT above 358°C."
          : "Insufficient vaporisation — product yield will drop, heavier crude fractions will under-flash."
      ));
    }
  }

  // ── CDU-002  Furnace Pass Imbalance ─────────────────────────────────────
  if (p.passImbalance != null) {
    const sev = getSeverity("passImbalance", p.passImbalance);
    if (sev !== "ok") {
      findings.push(finding(
        "CDU-002", sev, "furnace-pass-imbalance",
        `Furnace pass temperature standard deviation is ${p.passImbalance.toFixed(2)}°C — indicating uneven heat distribution across passes.`,
        p.passImbalance,
        { max: RANGES.passImbalance.warn[1], unit: "°C σ" },
        "Uneven pass loading causes hot spots in overloaded tubes (coking risk) and cold spots in underloaded passes (poor vaporisation). Investigate pass flow control valves."
      ));
    }
  }

  // ── CDU-003  T_PASS3 Sensor Drift ───────────────────────────────────────
  if (p.pass3DriftRatePerYear != null && Math.abs(p.pass3DriftRatePerYear) >= 2) {
    findings.push(finding(
      "CDU-003", "warning", "sensor-drift",
      `T_PASS3 thermocouple showing ${p.pass3DriftRatePerYear.toFixed(1)}°C/year linear drift detected via peer-comparison against T_PASS1, T_PASS2, T_PASS4.`,
      p.pass3DriftRatePerYear,
      { max: 1.5, unit: "°C/year" },
      "Drifting sensor causes erroneous pass balancing — the APC / operator may over-fire PASS3 to compensate, increasing fuel cost and tube wear. Schedule thermocouple calibration or replacement at next opportunity."
    ));
  }

  // ── CDU-004  Column Differential Pressure ───────────────────────────────
  if (p.dpCol != null) {
    const sev = getSeverity("dpCol", p.dpCol);
    if (sev !== "ok") {
      findings.push(finding(
        "CDU-004", sev, "column-dp",
        `Column ΔP mean is ${p.dpCol.toFixed(0)} mbar — approaching flooding limit.`,
        p.dpCol,
        { max: RANGES.dpCol.warn[1], unit: "mbar" },
        "Elevated column ΔP constrains liquid/vapour traffic. Reduces throughput headroom and risks entrainment, degrading product fractionation quality."
      ));
    }
  }

  // ── CDU-005  DP_COL Instrument Saturation ───────────────────────────────
  if (p.dpColSatPct != null && p.dpColSatPct > 0) {
    const sev = getSeverity("dpColSatPct", p.dpColSatPct);
    if (sev !== "ok" || p.dpColSatPct > 2) {
      findings.push(finding(
        "CDU-005",
        p.dpColSatPct >= 10 ? "critical" : "warning",
        "instrument-saturation",
        `DP_COL transmitter is clamped at its 250 mbar upper range for ${p.dpColSatPct.toFixed(1)}% of operating time — real column ΔP is unknown during these periods.`,
        p.dpColSatPct,
        { max: 5, unit: "% of runtime" },
        "Blind spots in column ΔP during peak-load periods mask flooding events. Operating without visibility into flooding severely limits safe throughput maximisation."
      ));
    }
  }

  // ── CDU-006  Energy Intensity ────────────────────────────────────────────
  if (p.energyIntensity != null) {
    const sev = getSeverity("energyIntensity", p.energyIntensity);
    if (sev !== "ok") {
      const benchmarkGap = ((p.energyIntensity - 0.088) / 0.088 * 100).toFixed(1);
      findings.push(finding(
        "CDU-006", sev, "energy-efficiency",
        `Energy intensity is ${(p.energyIntensity * 1000).toFixed(1)} kW per m³/hr feed — ${benchmarkGap}% above best-practice benchmark (88 kW/m³/hr).`,
        p.energyIntensity,
        { max: RANGES.energyIntensity.warn[1], unit: "MW/(m³/hr)" },
        "Excess furnace firing indicates poor preheat train performance (fouling). Each 10°C reduction in heater inlet temperature requires ~1% more furnace duty. Clean the most fouled exchangers to recover preheat and reduce fuel cost."
      ));
    }
  }

  // ── CDU-007  F_REFLUX Slow Drift ────────────────────────────────────────
  if (p.refluxDriftRatePerYear != null && p.refluxDriftRatePerYear > 5) {
    findings.push(finding(
      "CDU-007", "info", "sensor-drift",
      `F_REFLUX flow meter drifting upward at +${p.refluxDriftRatePerYear.toFixed(0)} m³/hr/year. Correction applied in cleaned data; raw historian data is biased.`,
      p.refluxDriftRatePerYear,
      { max: 3, unit: "m³/hr/year" },
      "APC setpoint logic reading from the raw tag will operate at a systematically higher-than-intended reflux, wasting condenser duty and column capacity. Calibrate or replace flow element."
    ));
  }

  // ── CDU-008  Plant Availability ──────────────────────────────────────────
  if (p.availability != null) {
    const sev = getSeverity("availability", p.availability);
    if (sev !== "ok") {
      const lostDays = (((100 - p.availability) / 100) * 365).toFixed(0);
      findings.push(finding(
        "CDU-008", sev, "availability",
        `Plant availability is ${p.availability.toFixed(1)}% — ${lostDays} equivalent days/year lost to shutdowns and low-throughput operations.`,
        p.availability,
        { min: RANGES.availability.warn[0], unit: "%" },
        "Industry top-quartile availability is 92–94%. Closing even half the gap to 90% availability on a 100 KBPD unit recovers ~750 KBPD-days/year of throughput opportunity."
      ));
    }
  }

  // ── CDU-009  Kerosene Yield vs Potential ────────────────────────────────
  if (l.keroYieldPct != null && l.keroYieldMax != null) {
    const gap = l.keroYieldMax - l.keroYieldPct;
    if (gap > 0.5) {
      findings.push(finding(
        "CDU-009", "info", "yield-gap",
        `Kerosene yield averages ${l.keroYieldPct.toFixed(2)} vol% vs observed maximum of ${l.keroYieldMax.toFixed(2)} vol% — a ${gap.toFixed(2)} vol% gap exists between current and demonstrated best.`,
        l.keroYieldPct,
        { min: l.keroYieldMax, unit: "vol%" },
        "Each 1 vol% yield improvement on ~100 KBPD throughput is ~1,000 BPD additional kerosene. At a kerosene premium of $15–20/bbl over crude, this is $15,000–20,000/day in margin uplift."
      ));
    }
  }

  // ── CDU-010  Flash Point Margin ──────────────────────────────────────────
  if (l.keroFlashPt != null) {
    const sev = getSeverity("keroFlashPt", l.keroFlashPt);
    const lowerThreeSigma = l.keroFlashPt - 3 * (l.keroFlashPtStd || 1.2);
    if (sev !== "ok") {
      findings.push(finding(
        "CDU-010", sev, "flash-point-spec",
        `Kerosene flash point is ${l.keroFlashPt.toFixed(1)}°C — below 40°C operating target. Off-spec risk is elevated.`,
        l.keroFlashPt,
        { min: RANGES.keroFlashPt.critical[0], unit: "°C" },
        "Flash point below 38°C constitutes off-spec product (ASTM D56 minimum). Off-spec kerosene must be blended down to naphtha pool at a significant price penalty."
      ));
    } else if (lowerThreeSigma < 39.0) {
      findings.push(finding(
        "CDU-010", "warning", "flash-point-margin",
        `Kerosene flash point mean is ${l.keroFlashPt.toFixed(1)}°C but natural variation (σ = ${(l.keroFlashPtStd || 1.2).toFixed(2)}°C) puts the 3σ lower bound at ${lowerThreeSigma.toFixed(1)}°C — dangerously close to the 38°C minimum specification.`,
        lowerThreeSigma,
        { min: 38, unit: "°C (3σ lower bound)" },
        `${(l.keroFlashPtOffSpecPct || 0.3).toFixed(1)}% of lab samples have already been recorded below spec. IBP control is too loose — tighten the kerosene draw temperature or improve stripping steam flow.`
      ));
    }
  }

  // ── CDU-011  Reflux Ratio ────────────────────────────────────────────────
  if (p.refluxRatio != null) {
    const sev = getSeverity("refluxRatio", p.refluxRatio);
    if (sev !== "ok") {
      findings.push(finding(
        "CDU-011", sev, "reflux",
        `Reflux-to-feed ratio is ${p.refluxRatio.toFixed(3)} — outside the ${RANGES.refluxRatio.warn[0]}–${RANGES.refluxRatio.warn[1]} operating envelope.`,
        p.refluxRatio,
        { min: RANGES.refluxRatio.warn[0], max: RANGES.refluxRatio.warn[1], unit: "—" },
        p.refluxRatio > RANGES.refluxRatio.warn[1]
          ? "Excessive reflux wastes condenser duty and column hydraulic capacity without proportional fractionation benefit. Reduce reflux to reclaim throughput headroom."
          : "Insufficient reflux degrades fractionation efficiency — kerosene IBP will creep up, gas oil cloud point will rise, and kerosene yield will decline."
      ));
    }
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  // ── KPI summary ──────────────────────────────────────────────────────────
  const kpis = {
    feedRate:        p.feedRate,
    crudeAPI:        p.crudeAPI,
    cot:             p.cot,
    furnaceDuty:     p.furnaceDuty,
    energyIntensity: p.energyIntensity,
    dpCol:           p.dpCol,
    dpColSatPct:     p.dpColSatPct,
    refluxRatio:     p.refluxRatio,
    availability:    p.availability,
    keroYieldPct:    l.keroYieldPct,
    keroFlashPt:     l.keroFlashPt,
    naphRONC:        l.naphRONC,
    goCloudPt:       l.goCloudPt,
    passImbalance:   p.passImbalance,
  };

  return { findings, kpis };
}
