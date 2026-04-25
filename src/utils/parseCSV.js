/**
 * Parse the capstone CDU CSV files (process + lab) into snapshot objects
 * compatible with the engine.
 *
 * Uses PapaParse in the browser via dynamic import so it tree-shakes out
 * when not needed.
 */

function mean(arr) {
  const valid = arr.filter(v => v != null && !isNaN(v));
  return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
}

function stdDev(arr) {
  const m = mean(arr);
  if (m == null) return null;
  const valid = arr.filter(v => v != null && !isNaN(v));
  return Math.sqrt(valid.reduce((s, v) => s + (v - m) ** 2, 0) / valid.length);
}

function max(arr) {
  const valid = arr.filter(v => v != null && !isNaN(v));
  return valid.length ? Math.max(...valid) : null;
}

function pct(arr, pred) {
  if (!arr.length) return 0;
  return (arr.filter(pred).length / arr.length) * 100;
}

/**
 * Parse a process data CSV text into a process snapshot.
 * Expects columns: timestamp, op_mode, crude_grade, crude_api, F_CRUDE_FEED,
 * T_COT, T_PASS1, T_PASS2, T_PASS3, T_PASS4, F_FUEL_GAS, Q_FURNACE,
 * T_COL_TOP, T_COL_BOT, DP_COL, F_REFLUX, F_STRIP_STEAM, L_SUMP,
 * F_LPG, F_NAPHTHA, F_KEROSENE, F_GAS_OIL, Q_COND, T_CW_RETURN, T_AMBIENT
 */
export async function parseProcessCSV(text) {
  const Papa = (await import("papaparse")).default;
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });

  const running = data.filter(r => r.op_mode > 0);
  const total   = data.length;

  const g = (col) => running.map(r => parseFloat(r[col])).filter(v => !isNaN(v));

  const pass1 = g("T_PASS1");
  const pass2 = g("T_PASS2");
  const pass3 = g("T_PASS3");
  const pass4 = g("T_PASS4");

  // Pass imbalance: mean σ across the four passes per row
  const passImbalanceArr = running.map(r => {
    const vals = ["T_PASS1","T_PASS2","T_PASS3","T_PASS4"]
      .map(c => parseFloat(r[c]))
      .filter(v => !isNaN(v));
    if (vals.length < 2) return null;
    const m = vals.reduce((s, v) => s + v, 0) / vals.length;
    return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length);
  });

  const dpCol = g("DP_COL");
  const reflux = g("F_REFLUX");
  const feed   = g("F_CRUDE_FEED");

  const avgFeed   = mean(feed) || 1;
  const avgReflux = mean(reflux) || 0;

  return {
    feedRate:              mean(feed),
    crudeAPI:              mean(g("crude_api")),
    crudeSulphur:          null,
    crudeGrade:            running[0]?.crude_grade || "Unknown",
    preheatOutTemp:        mean(g("T_PREHEAT_OUT")),
    desalterOutTemp:       mean(g("T_DESALTER_OUT")),
    cot:                   mean(g("T_COT")),
    pass1Temp:             mean(pass1),
    pass2Temp:             mean(pass2),
    pass3Temp:             mean(pass3),
    pass4Temp:             mean(pass4),
    passImbalance:         mean(passImbalanceArr),
    fuelGas:               mean(g("F_FUEL_GAS")),
    furnaceDuty:           mean(g("Q_FURNACE")),
    energyIntensity:       mean(g("Q_FURNACE")) / (mean(feed) || 1),
    colTopTemp:            mean(g("T_COL_TOP")),
    colBotTemp:            mean(g("T_COL_BOT")),
    dpCol:                 mean(dpCol),
    dpColSatPct:           pct(dpCol, v => v >= 249.9),
    reflux:                mean(reflux),
    stripSteam:            mean(g("F_STRIP_STEAM")),
    sumpLevel:             mean(g("L_SUMP")),
    refluxRatio:           avgReflux / avgFeed,
    lpg:                   mean(g("F_LPG")),
    naphtha:               mean(g("F_NAPHTHA")),
    kerosene:              mean(g("F_KEROSENE")),
    gasOil:                mean(g("F_GAS_OIL")),
    condDuty:              mean(g("Q_COND")),
    cwReturn:              mean(g("T_CW_RETURN")),
    ambient:               mean(g("T_AMBIENT")),
    lightEndsRatio:        null,
    opMode:                2,
    availability:          pct(data, r => r.op_mode > 0),
    pass3DriftRatePerYear: null,   // requires time-series regression — not done in browser
    refluxDriftRatePerYear: null,
    keroMeterCorrected:    false,
  };
}

/**
 * Parse a lab data CSV into a lab snapshot.
 * Expects columns: op_mode, KERO_YIELD_VOL_PCT, KERO_IBP_C, KERO_FBP_C,
 * KERO_FLASH_PT_C, NAPH_RONC, GO_CLOUD_PT_C
 */
export async function parseLabCSV(text) {
  const Papa = (await import("papaparse")).default;
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  const running = data.filter(r => r.op_mode > 0);
  const g = (col) => running.map(r => parseFloat(r[col])).filter(v => !isNaN(v));

  const yield_ = g("KERO_YIELD_VOL_PCT");
  const flash  = g("KERO_FLASH_PT_C");

  return {
    keroYieldPct:          mean(yield_),
    keroYieldStd:          stdDev(yield_),
    keroYieldMax:          max(yield_),
    keroIBP:               mean(g("KERO_IBP_C")),
    keroFBP:               mean(g("KERO_FBP_C")),
    keroFlashPt:           mean(flash),
    keroFlashPtStd:        stdDev(flash),
    keroFlashPtOffSpecPct: pct(flash, v => v < 38),
    naphRONC:              mean(g("NAPH_RONC")),
    goCloudPt:             mean(g("GO_CLOUD_PT_C")),
  };
}
