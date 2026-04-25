/**
 * Pre-loaded snapshot derived from the CDU capstone dataset
 * (2022-01-01 to 2023-12-31, Arab Light crude, Normal operating mode).
 * Statistics: means of the cleaned merged dataset unless otherwise noted.
 */
export const SAMPLE_PROCESS = {
  // Feed
  feedRate: 653.1,          // m³/hr  F_CRUDE_FEED mean
  crudeAPI: 34.3,           // °API
  crudeSulphur: 1.8,        // wt%
  crudeGrade: "Arab Light",
  preheatOutTemp: 239.9,    // °C  T_PREHEAT_OUT mean
  desalterOutTemp: 244.9,   // °C  T_DESALTER_OUT mean

  // Furnace
  cot: 355.2,               // °C  T_COT mean
  pass1Temp: 355.8,         // °C
  pass2Temp: 351.5,         // °C
  pass3Temp: 353.9,         // °C  T_PASS3_CORRECTED mean
  pass4Temp: 354.5,         // °C
  passImbalance: 1.77,      // °C  std dev of pass temps
  fuelGas: 4.78,            // t/hr
  furnaceDuty: 62.6,        // MW  Q_FURNACE mean
  energyIntensity: 0.0967,  // MW per m³/hr feed  ENERGY_INTENSITY mean

  // Column
  colTopTemp: 112.0,        // °C  T_COL_TOP mean
  colBotTemp: 340.2,        // °C  T_COL_BOT mean
  dpCol: 177.3,             // mbar  DP_COL mean (instrument saturates at 250)
  dpColSatPct: 9.1,         // % of running time at 250 mbar (clamped / saturated)
  reflux: 369.5,            // m³/hr  F_REFLUX_CORRECTED mean
  stripSteam: 6.0,          // t/hr  F_STRIP_STEAM mean
  sumpLevel: 52.0,          // %  L_SUMP mean
  refluxRatio: 0.571,       // REFLUX_RATIO = reflux / feed

  // Products
  lpg: 35.7,                // m³/hr  F_LPG mean
  naphtha: 239.6,           // m³/hr  F_NAPHTHA mean
  kerosene: 118.3,          // m³/hr  F_KEROSENE_CORRECTED mean
  gasOil: 161.7,            // m³/hr  F_GAS_OIL mean

  // Overhead
  ohdAccLevel: 55.0,        // %
  condDuty: 43.1,           // MW  Q_COND mean
  cwReturn: 29.1,           // °C  T_CW_RETURN mean
  ambient: 19.8,            // °C  T_AMBIENT mean

  // Derived
  energyIntensity: 0.0967,
  lightEndsRatio: 0.550,
  passImbalanceRaw: { p1: 355.8, p2: 351.5, p3: 353.9, p4: 354.5 },

  // Plant-level
  opMode: 2,                // 0=shutdown 1=low 2=normal 3=high
  availability: 89.5,       // % running time (op_mode > 0)

  // Drift flags (from EDA)
  pass3DriftRatePerYear: 3.0,     // °C/year detected drift
  refluxDriftRatePerYear: 8.0,    // m³/hr/year
  keroMeterCorrected: true,       // pre-day-540 meter correction applied
};

export const SAMPLE_LAB = {
  keroYieldPct: 17.29,      // vol%  KERO_YIELD_VOL_PCT mean
  keroYieldStd: 0.56,       // vol%  std
  keroYieldMax: 18.59,      // vol%  observed max
  keroIBP: 146.8,           // °C  KERO_IBP_C mean
  keroFBP: 264.9,           // °C  KERO_FBP_C mean
  keroFlashPt: 41.99,       // °C  KERO_FLASH_PT_C mean
  keroFlashPtStd: 1.21,     // °C  std — 3σ lower = 38.4°C (0.4°C above min spec)
  keroFlashPtOffSpecPct: 0.3, // % of lab samples off-spec
  naphRONC: 72.4,           // NAPH_RONC mean
  goCloudPt: 5.0,           // °C  GO_CLOUD_PT_C mean
  crudeAPI: 34.3,
};

export const SAMPLE_EVENTS = [
  { date: "2022-04-10", type: "TURNAROUND_START", description: "Planned turnaround begins" },
  { date: "2022-04-28", type: "TURNAROUND_END",   description: "Turnaround complete — unit restart" },
  { date: "2022-05-04", type: "CRUDE_SWITCH",     description: "Arab Light → Urals" },
  { date: "2022-08-14", type: "CRUDE_SWITCH",     description: "Urals → Arab Light" },
  { date: "2022-10-16", type: "CRUDE_SWITCH",     description: "Arab Light → Brent" },
  { date: "2023-04-28", type: "CRUDE_SWITCH",     description: "Brent → Urals" },
  { date: "2023-06-09", type: "CRUDE_SWITCH",     description: "Urals → Arab Light" },
  { date: "2023-08-05", type: "TURNAROUND_START", description: "Planned turnaround begins" },
  { date: "2023-08-21", type: "TURNAROUND_END",   description: "Turnaround complete — unit restart" },
];

// Yield by crude grade from dataset analysis
export const YIELD_BY_GRADE = {
  "Arab Light": 17.31,
  "Urals":      16.92,
  "Brent":      17.85,
};

// Benchmark targets for a well-operated similar CDU
export const BENCHMARKS = {
  keroYieldPct:    18.0,    // vol% — top-quartile for Arab Light
  energyIntensity: 0.088,   // MW/(m³/hr) — industry best practice
  availability:    92.5,    // %
  dpCol:           160,     // mbar — comfortable operating point
  refluxRatio:     0.555,   // dimensionless — lean but adequate
};
