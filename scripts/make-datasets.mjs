/**
 * Generates the CSV files the lessons read.
 *
 * Everything here is synthetic and produced from a fixed seed, so the files are
 * byte-stable across runs and can be regenerated at any time. That matters for
 * two reasons: the course reproduces none of its source book's data, and a
 * lesson that quotes a coefficient in its prose needs the number to stay put.
 *
 * Each dataset is built with a known ground truth — a true regression slope, a
 * true log-odds model, a deliberate process shift — so lessons can compare what
 * a technique recovers against what is actually there.
 *
 *   npm run datasets
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "datasets");

/* ---------------------------------------------------------------------------
   Deterministic randomness
   --------------------------------------------------------------------------- */

/** mulberry32 — small, fast, and identical on every platform. */
function makeRng(seed) {
  let state = seed >>> 0;
  const uniform = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const normal = (mean = 0, sd = 1) => {
    // Box-Muller, avoiding log(0).
    const u1 = Math.max(uniform(), Number.EPSILON);
    const u2 = uniform();
    return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const choice = (items) => items[Math.floor(uniform() * items.length)];

  const poisson = (lambda) => {
    // Knuth's method; lambdas here are small enough for it.
    const limit = Math.exp(-lambda);
    let k = 0;
    let product = uniform();
    while (product > limit) {
      k += 1;
      product *= uniform();
    }
    return k;
  };

  const binomial = (n, p) => {
    let successes = 0;
    for (let i = 0; i < n; i += 1) if (uniform() < p) successes += 1;
    return successes;
  };

  return { uniform, normal, choice, poisson, binomial };
}

const round = (value, places) => Number(value.toFixed(places));

function toCsv(rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => row[column]).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function isoDate(start, dayOffset) {
  const date = new Date(Date.UTC(start[0], start[1] - 1, start[2]));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------------------
   1. Fuel efficiency — linear regression (chapter 4)
   --------------------------------------------------------------------------- */

/**
 * Ground truth:
 *   city_kpl = 24.5 - 1.85*engine_litres - 0.0042*weight_kg + 0.021*power_kw + noise(sd 1.1)
 *
 * Deliberately includes a handful of high-leverage outliers so the
 * assumption-checking lesson has something real to find.
 */
function fuelEfficiency() {
  const rng = makeRng(4_0001);
  const rows = [];

  for (let i = 0; i < 260; i += 1) {
    const engine = round(1.0 + rng.uniform() * 4.0, 1);
    const weight = Math.round(900 + engine * 260 + rng.normal(0, 140));
    const power = Math.round(40 + engine * 42 + rng.normal(0, 18));

    let kpl =
      24.5 - 1.85 * engine - 0.0042 * weight + 0.021 * power + rng.normal(0, 1.1);

    // Six hybrids: genuine outliers, far more efficient than the model expects.
    if (i % 43 === 0) kpl += 7.5 + rng.uniform() * 2;

    rows.push({
      model_id: `V${String(i + 1).padStart(3, "0")}`,
      engine_litres: engine,
      weight_kg: weight,
      power_kw: power,
      cylinders: engine < 1.8 ? 4 : engine < 3.0 ? 6 : 8,
      city_kpl: round(Math.max(kpl, 2.5), 2),
    });
  }

  return toCsv(rows, [
    "model_id",
    "engine_litres",
    "weight_kg",
    "power_kw",
    "cylinders",
    "city_kpl",
  ]);
}

/* ---------------------------------------------------------------------------
   2. Loan defaults — logistic regression (chapter 5)
   --------------------------------------------------------------------------- */

/**
 * Ground truth log-odds:
 *   -0.9 - 0.011*(credit_score - 650) + 2.2*debt_to_income
 *        - 0.020*min(months_employed, 120) + 0.62*prior_defaults
 *
 * Base rate lands near 21%, which is imbalanced enough that accuracy alone
 * flatters a useless model — the point of lesson 5.3. Keep these numbers in
 * step with logistic-regression/fitting-and-interpreting.mdx, which quotes
 * them as the answer the fit should recover.
 */
function loanDefaults() {
  const rng = makeRng(5_0002);
  const rows = [];
  const purposes = ["debt_consolidation", "home_improvement", "vehicle", "medical", "other"];

  for (let i = 0; i < 1800; i += 1) {
    const creditScore = Math.round(Math.min(840, Math.max(480, rng.normal(690, 68))));
    const income = Math.round(Math.exp(rng.normal(10.85, 0.42)) / 100) * 100;
    const loanAmount = Math.round((income * (0.15 + rng.uniform() * 0.6)) / 100) * 100;
    const debtToIncome = round(Math.min(0.95, Math.max(0.02, rng.normal(0.34, 0.13))), 3);
    const monthsEmployed = Math.max(0, Math.round(rng.normal(52, 38)));
    const priorDefaults = rng.uniform() < 0.14 ? (rng.uniform() < 0.7 ? 1 : 2) : 0;

    const logOdds =
      -0.9 -
      0.011 * (creditScore - 650) +
      0.55 * debtToIncome * 4 -
      0.02 * Math.min(monthsEmployed, 120) +
      0.62 * priorDefaults;

    const probability = 1 / (1 + Math.exp(-logOdds));

    rows.push({
      loan_id: `L${String(i + 1).padStart(5, "0")}`,
      credit_score: creditScore,
      annual_income: income,
      loan_amount: loanAmount,
      debt_to_income: debtToIncome,
      months_employed: monthsEmployed,
      prior_defaults: priorDefaults,
      purpose: purposes[Math.floor(rng.uniform() * purposes.length)],
      defaulted: rng.uniform() < probability ? 1 : 0,
    });
  }

  return toCsv(rows, [
    "loan_id",
    "credit_score",
    "annual_income",
    "loan_amount",
    "debt_to_income",
    "months_employed",
    "prior_defaults",
    "purpose",
    "defaulted",
  ]);
}

/* ---------------------------------------------------------------------------
   3. Seed grains — trees and forests (chapter 6)
   --------------------------------------------------------------------------- */

/**
 * Two visually similar grain varieties separated by morphology. The classes
 * overlap enough that a deep tree will happily memorise the training set — the
 * setup lesson 6.3 needs.
 */
function seedGrains() {
  const rng = makeRng(6_0003);
  const rows = [];

  const varieties = [
    { name: "keswani", area: 62_000, aspect: 1.62, spread: 0.16 },
    { name: "besni", area: 88_000, aspect: 1.94, spread: 0.19 },
  ];

  for (let i = 0; i < 900; i += 1) {
    const variety = varieties[i % 2];
    const area = Math.max(20_000, rng.normal(variety.area, variety.area * variety.spread));
    const aspect = Math.max(1.05, rng.normal(variety.aspect, 0.22));

    // Model the grain as an ellipse, then perturb every derived measurement.
    const minor = Math.sqrt((4 * area) / (Math.PI * aspect));
    const major = minor * aspect;
    const eccentricity = Math.sqrt(1 - (minor / major) ** 2);
    const perimeter = Math.PI * (1.5 * (major / 2 + minor / 2) - Math.sqrt(major * minor) / 2);
    const convexArea = area * (1 + Math.abs(rng.normal(0.012, 0.008)));

    rows.push({
      area: Math.round(area),
      perimeter: round(perimeter * (1 + rng.normal(0, 0.01)), 2),
      major_axis: round(major, 2),
      minor_axis: round(minor, 2),
      eccentricity: round(Math.min(0.999, eccentricity), 4),
      convex_area: Math.round(convexArea),
      extent: round(Math.min(0.95, Math.max(0.45, rng.normal(0.7, 0.05))), 4),
      variety: variety.name,
    });
  }

  return toCsv(rows, [
    "area",
    "perimeter",
    "major_axis",
    "minor_axis",
    "eccentricity",
    "convex_area",
    "extent",
    "variety",
  ]);
}

/* ---------------------------------------------------------------------------
   4. Web traffic — time series (chapter 7)
   --------------------------------------------------------------------------- */

/**
 * Daily sessions over four years: an upward trend, a strong weekly cycle, a
 * milder annual cycle, and noise. Non-stationary by construction, so the
 * differencing lesson has something to fix.
 */
function webTraffic() {
  const rng = makeRng(7_0004);
  const rows = [];
  const days = 1461; // 2021-01-01 through 2024-12-31

  const weekday = [1.18, 1.22, 1.2, 1.15, 1.02, 0.62, 0.58]; // Fri-Sun dip

  for (let day = 0; day < days; day += 1) {
    const date = isoDate([2021, 1, 1], day);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday

    const trend = 8_200 + 4.1 * day;
    const annual = 1 + 0.09 * Math.sin((2 * Math.PI * (day - 40)) / 365.25);
    const weekly = weekday[(dow + 6) % 7];

    const sessions = Math.round(trend * annual * weekly * (1 + rng.normal(0, 0.045)));

    rows.push({ date, sessions: Math.max(500, sessions) });
  }

  return toCsv(rows, ["date", "sessions"]);
}

/* ---------------------------------------------------------------------------
   5. Index prices — Monte Carlo and ARIMA (chapters 7 and 9)
   --------------------------------------------------------------------------- */

/** Geometric Brownian motion: ~5 years of trading days with realistic drift
 *  and volatility, plus a short volatile stretch. */
function indexPrices() {
  const rng = makeRng(9_0005);
  const rows = [];

  let price = 184.5;
  let day = 0;
  let written = 0;

  const dailyDrift = 0.00032;
  const baseVol = 0.0098;

  while (written < 1260) {
    const date = isoDate([2020, 1, 2], day);
    day += 1;
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) continue; // trading days only

    // A turbulent stretch in the middle of the series.
    const vol = written > 520 && written < 610 ? baseVol * 2.6 : baseVol;

    const logReturn = dailyDrift - (vol * vol) / 2 + rng.normal(0, vol);
    price *= Math.exp(logReturn);

    rows.push({ date, close: round(price, 2) });
    written += 1;
  }

  return toCsv(rows, ["date", "close"]);
}

/* ---------------------------------------------------------------------------
   6. Payments — Benford's law (chapter 12)
   --------------------------------------------------------------------------- */

/**
 * Vendor payments spanning four orders of magnitude, so leading digits follow
 * Benford closely — except for one vendor whose amounts cluster just under an
 * approval threshold. Lesson 12.4 exists to find that vendor.
 */
function payments() {
  const rng = makeRng(12_0006);
  const rows = [];

  const vendors = [
    "Alder Supply",
    "Brant Logistics",
    "Corvin Media",
    "Delvin Facilities",
    "Ember IT",
    "Fenwick Legal",
    "Gilder Travel",
    "Harlow Print",
  ];
  const categories = ["services", "materials", "logistics", "software", "facilities"];

  for (let i = 0; i < 2400; i += 1) {
    const vendor = vendors[Math.floor(rng.uniform() * vendors.length)];

    let amount;
    if (vendor === "Ember IT" && rng.uniform() < 0.62) {
      // Amounts crowded just below a 10,000 approval limit.
      amount = 9_100 + rng.uniform() * 880;
    } else {
      // Log-uniform over 10^1.3 .. 10^5.3 — the classic Benford generator.
      amount = 10 ** (1.3 + rng.uniform() * 4.0);
    }

    rows.push({
      payment_id: `P${String(i + 1).padStart(5, "0")}`,
      date: isoDate([2024, 1, 1], Math.floor(rng.uniform() * 365)),
      vendor: `"${vendor}"`,
      category: categories[Math.floor(rng.uniform() * categories.length)],
      amount: round(amount, 2),
    });
  }

  return toCsv(rows, ["payment_id", "date", "vendor", "category", "amount"]);
}

/* ---------------------------------------------------------------------------
   7 & 8. Quality control (chapter 14)
   --------------------------------------------------------------------------- */

/** Subgrouped measurements with a deliberate mean shift at subgroup 31 and a
 *  variance increase at subgroup 46. */
function qcMeasurements() {
  const rng = makeRng(14_0007);
  const rows = [];

  const target = 50.0;
  const subgroups = 60;
  const size = 5;

  for (let subgroup = 1; subgroup <= subgroups; subgroup += 1) {
    const mean = subgroup >= 31 ? target + 0.42 : target;
    const sd = subgroup >= 46 ? 0.55 : 0.3;

    for (let observation = 1; observation <= size; observation += 1) {
      rows.push({
        subgroup,
        observation,
        value: round(rng.normal(mean, sd), 4),
      });
    }
  }

  return toCsv(rows, ["subgroup", "observation", "value"]);
}

/** Attribute data: units inspected, units rejected, and defect counts. */
function qcDefects() {
  const rng = makeRng(14_0008);
  const rows = [];

  for (let batch = 1; batch <= 45; batch += 1) {
    const inspected = 180 + Math.floor(rng.uniform() * 60);

    // Proportion defective drifts upward from batch 33 onward.
    const p = batch >= 33 ? 0.062 : 0.038;
    const defective = rng.binomial(inspected, p);

    // Defects per unit is a separate count process.
    const defects = rng.poisson(batch >= 33 ? 9.4 : 6.1);

    rows.push({
      batch,
      date: isoDate([2025, 1, 6], (batch - 1) * 7),
      inspected,
      defective,
      defects,
    });
  }

  return toCsv(rows, ["batch", "date", "inspected", "defective", "defects"]);
}

/* ---------------------------------------------------------------------------
   Write everything
   --------------------------------------------------------------------------- */

const datasets = {
  "fuel-efficiency.csv": fuelEfficiency,
  "loan-defaults.csv": loanDefaults,
  "seed-grains.csv": seedGrains,
  "web-traffic.csv": webTraffic,
  "index-prices.csv": indexPrices,
  "payments.csv": payments,
  "qc-measurements.csv": qcMeasurements,
  "qc-defects.csv": qcDefects,
};

await mkdir(outDir, { recursive: true });

for (const [name, build] of Object.entries(datasets)) {
  const csv = build();
  await writeFile(path.join(outDir, name), csv, "utf8");
  const rows = csv.trimEnd().split("\n").length - 1;
  const kb = (Buffer.byteLength(csv) / 1024).toFixed(1);
  console.log(`${name.padEnd(24)} ${String(rows).padStart(5)} rows  ${kb.padStart(7)} KB`);
}

console.log(`\nWrote ${Object.keys(datasets).length} datasets to public/datasets/.`);
