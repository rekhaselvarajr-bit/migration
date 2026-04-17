"use strict";

window.onerror = function (message, source, lineno, colno, error) {
  const existing = document.getElementById("app-runtime-error");
  const text = `${message} @ ${source}:${lineno}:${colno}`;
  if (existing) {
    existing.textContent = text;
    existing.style.display = "block";
    return false;
  }

  const banner = document.createElement("div");
  banner.id = "app-runtime-error";
  banner.textContent = text;
  banner.style.position = "fixed";
  banner.style.bottom = "0";
  banner.style.left = "0";
  banner.style.right = "0";
  banner.style.padding = "12px";
  banner.style.background = "#d64545";
  banner.style.color = "#fff";
  banner.style.fontSize = "14px";
  banner.style.zIndex = "9999";
  banner.style.fontFamily = "system-ui, sans-serif";
  banner.style.textAlign = "center";
  document.body.appendChild(banner);
  return false;
};

let activeModalLocks = 0;
const setBodyModalState = (isOpen) => {
  activeModalLocks = Math.max(0, activeModalLocks + (isOpen ? 1 : -1));
  document.body.classList.toggle("modal-open", activeModalLocks > 0);
};

const healthyDaysByAge = {
  30: { min: 3650, max: 4380 },
  35: { min: 3285, max: 4015 },
  40: { min: 2920, max: 3650 },
  45: { min: 2555, max: 3285 },
  50: { min: 2190, max: 2920 },
  55: { min: 1825, max: 2555 },
  60: { min: 1460, max: 2190 },
  65: { min: 1095, max: 1825 },
  70: { min: 730, max: 1460 },
  75: { min: 365, max: 1095 },
};

const lifeExpectancyByAge = {
  25: { male: 52.6, female: 57.9 },
  26: { male: 51.64, female: 56.92 },
  27: { male: 50.68, female: 55.94 },
  28: { male: 49.72, female: 54.96 },
  29: { male: 48.76, female: 53.98 },
  30: { male: 47.8, female: 53.0 },
  31: { male: 46.86, female: 52.02 },
  32: { male: 45.92, female: 51.04 },
  33: { male: 44.98, female: 50.06 },
  34: { male: 44.04, female: 49.08 },
  35: { male: 43.1, female: 48.1 },
  36: { male: 42.14, female: 47.32 },
  37: { male: 41.18, female: 46.54 },
  38: { male: 40.22, female: 45.76 },
  39: { male: 39.26, female: 44.98 },
  40: { male: 38.3, female: 43.3 },
  41: { male: 37.38, female: 42.34 },
  42: { male: 36.46, female: 41.38 },
  43: { male: 35.54, female: 40.42 },
  44: { male: 34.62, female: 39.46 },
  45: { male: 33.7, female: 38.5 },
  46: { male: 32.88, female: 37.72 },
  47: { male: 32.06, female: 36.94 },
  48: { male: 31.24, female: 36.16 },
  49: { male: 30.32, female: 35.08 },
  50: { male: 29.1, female: 33.9 },
  51: { male: 28.22, female: 32.98 },
  52: { male: 27.34, female: 32.06 },
  53: { male: 26.46, female: 31.14 },
  54: { male: 25.58, female: 30.22 },
  55: { male: 24.7, female: 29.3 },
  56: { male: 23.86, female: 28.42 },
  57: { male: 23.02, female: 27.54 },
  58: { male: 22.18, female: 26.66 },
  59: { male: 21.34, female: 25.78 },
  60: { male: 20.5, female: 24.9 },
  61: { male: 19.74, female: 24.26 },
  62: { male: 18.98, female: 23.62 },
  63: { male: 18.22, female: 22.98 },
  64: { male: 17.46, female: 22.34 },
  65: { male: 16.7, female: 20.8 },
  66: { male: 16.0, female: 20.02 },
  67: { male: 15.3, female: 19.24 },
  68: { male: 14.6, female: 18.46 },
  69: { male: 13.9, female: 17.68 },
  70: { male: 13.2, female: 16.9 },
  71: { male: 12.6, female: 16.16 },
  72: { male: 12.0, female: 15.42 },
  73: { male: 11.4, female: 14.68 },
  74: { male: 10.8, female: 13.94 },
  75: { male: 10.2, female: 13.2 },
  76: { male: 9.82, female: 12.58 },
  77: { male: 9.44, female: 11.96 },
  78: { male: 9.06, female: 11.34 },
  79: { male: 8.38, female: 10.72 },
  80: { male: 7.7, female: 10.1 },
  81: { male: 7.3, female: 9.56 },
  82: { male: 6.9, female: 9.02 },
  83: { male: 6.5, female: 8.48 },
  84: { male: 6.1, female: 7.94 },
  85: { male: 5.7, female: 7.4 },
  86: { male: 5.42, female: 7.02 },
  87: { male: 5.14, female: 6.64 },
  88: { male: 4.86, female: 6.26 },
  89: { male: 4.58, female: 5.88 },
  90: { male: 4.3, female: 5.5 },
};

const lifeExpectancyAges = Object.keys(lifeExpectancyByAge)
  .map(Number)
  .sort((a, b) => a - b);

const peerReferenceDataset =
  typeof populationReferenceData !== "undefined" ? populationReferenceData : null;
const peerReferenceAgeCache = {};

const survivalDataMale = [
  1, 0.9995, 0.9993, 0.9991, 0.9989, 0.9986, 0.9984, 0.9982, 0.998, 0.9977,
  0.9975, 0.9972, 0.997, 0.9967, 0.9964, 0.996, 0.9956, 0.9951, 0.9945, 0.9938,
  0.9931, 0.9923, 0.9914, 0.9905, 0.9894, 0.9882, 0.9869, 0.9855, 0.984,
  0.9824, 0.9807, 0.9789, 0.977, 0.9749, 0.9727, 0.9703, 0.9678, 0.9652,
  0.9624, 0.9594, 0.9563, 0.9529, 0.9493, 0.9455, 0.9415, 0.9372, 0.9327,
  0.928, 0.923, 0.9177, 0.9121, 0.9063, 0.9002, 0.8938, 0.8871, 0.8801, 0.8728,
  0.8651, 0.8572, 0.8489, 0.8403, 0.8314, 0.8222, 0.8126, 0.8027, 0.7925,
  0.782, 0.7712, 0.7601, 0.7487, 0.737, 0.7251, 0.7129, 0.7004, 0.6877, 0.6747,
  0.6615, 0.648, 0.6343, 0.6203, 0.6061, 0.5917, 0.5771, 0.5622, 0.5471,
  0.5318, 0.5163, 0.5006, 0.4846, 0.4685, 0.4521, 0.4355, 0.4187, 0.4017,
  0.3844, 0.367, 0.3494, 0.3316
];

const survivalDataFemale = [
  1, 0.9996, 0.9994, 0.9993, 0.999, 0.9988, 0.9986, 0.9983, 0.9981, 0.9978,
  0.9976, 0.9973, 0.9971, 0.9968, 0.9965, 0.9962, 0.9958, 0.9954, 0.995,
  0.9945, 0.994, 0.9934, 0.9928, 0.9921, 0.9913, 0.9904, 0.9895, 0.9884,
  0.9873, 0.9861, 0.9848, 0.9834, 0.9819, 0.9803, 0.9786, 0.9768, 0.9748,
  0.9727, 0.9705, 0.9681, 0.9656, 0.9629, 0.96, 0.957, 0.9538, 0.9504, 0.9468,
  0.943, 0.939, 0.9347, 0.9302, 0.9255, 0.9205, 0.9153, 0.9098, 0.9041, 0.8981,
  0.8919, 0.8854, 0.8786, 0.8716, 0.8643, 0.8568, 0.849, 0.841, 0.8327,
  0.8242, 0.8155, 0.8065, 0.7973, 0.7879, 0.7782, 0.7684, 0.7583, 0.748,
  0.7375, 0.7267, 0.7158, 0.7046, 0.6932, 0.6816, 0.6698, 0.6578, 0.6456,
  0.6332, 0.6206, 0.6078, 0.5948, 0.5816, 0.5682, 0.5546, 0.5408, 0.5268,
  0.5126, 0.4983, 0.4837, 0.469, 0.4541, 0.4391
];

let survivalChartInstance = null;

const destroySurvivalChart = () => {
  if (survivalChartInstance) {
    survivalChartInstance.destroy();
    survivalChartInstance = null;
  }
};

const renderSurvivalChart = (startAge, adjustedRisk, gender) => {
  const canvas = document.getElementById("survivalChart");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const dataset = gender === "male" ? survivalDataMale : survivalDataFemale;
  const ctx = canvas.getContext("2d");
  const ages = [];
  const baseline = [];
  const adjusted = [];

  const safeAge = Number.isFinite(startAge) ? Math.max(0, Math.floor(startAge)) : 40;
  const adjustmentFactor = 1 - (Math.max(0, adjustedRisk) / 10 / 100);

  for (let age = safeAge; age <= 99; age += 1) {
    const survival = dataset[age] ?? dataset[dataset.length - 1];
    const adjSurvival = Math.max(0, Math.min(1, survival * adjustmentFactor));
    ages.push(age);
    baseline.push(Number((survival * 100).toFixed(2)));
    adjusted.push(Number((adjSurvival * 100).toFixed(2)));
  }

  destroySurvivalChart();

  const markerY = baseline.length > 0 ? baseline[0] : 0;

  survivalChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: ages,
      datasets: [
        {
          label: "Population survival (optimal health)",
          data: baseline,
          borderColor: "#2f68ff",
          backgroundColor: "rgba(47, 104, 255, 0.15)",
          fill: false,
          tension: 0.25,
          pointRadius: 0,
        },
        {
          label: "Your projected survival",
          data: adjusted,
          borderColor: "#ee8e00",
          backgroundColor: "rgba(238, 142, 0, 0.15)",
          fill: false,
          tension: 0.25,
          pointRadius: 0,
        },
        {
          type: "scatter",
          label: `Current age (${Math.round(startAge)})`,
          data: [
            {
              x: Math.round(startAge),
              y: markerY,
            },
          ],
          borderColor: "#7f56d9",
          backgroundColor: "#7f56d9",
          pointRadius: 5,
          pointHoverRadius: 6,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        x: {
          duration: 900,
          easing: "easeOutQuart",
          from: NaN,
          delay(ctx) {
            if (ctx.type !== "data" || ctx.mode !== "default") {
              return 0;
            }
            return ctx.dataIndex * 18;
          },
        },
        y: {
          duration: 900,
          easing: "easeOutQuart",
          delay(ctx) {
            if (ctx.type !== "data" || ctx.mode !== "default") {
              return 0;
            }
            return ctx.dataIndex * 18;
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Age (years)",
          },
          ticks: {
            maxTicksLimit: 8,
          },
        },
        y: {
          title: {
            display: true,
            text: "Probability of survival (%)",
          },
          min: 80,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });

  canvas.style.backgroundColor = "#ffffff";
};

function getBracket(age) {
  return (
    Object.keys(healthyDaysByAge)
      .map(Number)
      .sort((a, b) => b - a)
      .find((br) => age >= br) || 30
  );
}

function getLifeExpectancyValue(age, gender = "male") {
  if (!Number.isFinite(age) || !lifeExpectancyAges.length) {
    return null;
  }
  const minAge = lifeExpectancyAges[0];
  const maxAge = lifeExpectancyAges[lifeExpectancyAges.length - 1];
  const clampedAge = Math.min(Math.max(age, minAge), maxAge);
  let lowerAge = minAge;
  let upperAge = maxAge;
  for (let i = 0; i < lifeExpectancyAges.length; i += 1) {
    const currentAge = lifeExpectancyAges[i];
    if (currentAge <= clampedAge) {
      lowerAge = currentAge;
    }
    if (currentAge >= clampedAge) {
      upperAge = currentAge;
      break;
    }
  }
  const genderKey = gender === "female" ? "female" : "male";
  const lowerEntry = lifeExpectancyByAge[lowerAge];
  const upperEntry = lifeExpectancyByAge[upperAge];
  if (!lowerEntry && !upperEntry) {
    return null;
  }
  if (!upperEntry || lowerAge === upperAge || !lowerEntry) {
    const singleEntry = lowerEntry || upperEntry;
    const value = singleEntry ? singleEntry[genderKey] : null;
    return Number.isFinite(value) ? value : null;
  }
  const lowerValue = lowerEntry[genderKey];
  const upperValue = upperEntry[genderKey];
  if (!Number.isFinite(lowerValue) && !Number.isFinite(upperValue)) {
    return null;
  }
  if (!Number.isFinite(lowerValue)) {
    return upperValue;
  }
  if (!Number.isFinite(upperValue)) {
    return lowerValue;
  }
  const ratio = (clampedAge - lowerAge) / (upperAge - lowerAge || 1);
  return lowerValue + (upperValue - lowerValue) * ratio;
}

function calculateDays(age, pct, gender = "male", baselineRiskPct = null) {
  const safePct = Math.max(10, Math.min(100, Number(pct) || 100));
  const expectancyYears = getLifeExpectancyValue(age, gender);
  const baselineRiskValue = Number(baselineRiskPct);
  if (
    Number.isFinite(expectancyYears) &&
    Number.isFinite(baselineRiskValue) &&
    baselineRiskValue >= 0 &&
    baselineRiskValue < 100
  ) {
    const riskDecimal = Math.max(0, Math.min(baselineRiskValue / 100, 0.95));
    const baseGainYears = expectancyYears * (riskDecimal / Math.max(0.0001, 1 - riskDecimal));
    const scaledGainYears = baseGainYears * (safePct / 100);
    const scaledDays = Math.round(scaledGainYears * 365);
    return {
      min: scaledDays,
      max: scaledDays,
      minYears: scaledGainYears,
      maxYears: scaledGainYears,
    };
  }
  const bracket = getBracket(age);
  const fallback = healthyDaysByAge[bracket] || { min: 0, max: 0 };
  const minDays = Math.round((fallback.min * safePct) / 100);
  const maxDays = Math.round((fallback.max * safePct) / 100);
  return {
    min: minDays,
    max: maxDays,
    minYears: minDays / 365,
    maxYears: maxDays / 365,
  };
}

function calculateFraminghamWithCholesterol(
  age,
  gender,
  smoker,
  systolic_bp,
  bp_medication,
  total_cholesterol,
  hdl_cholesterol,
  diabetes
) {
  let ln_age,
    ln_total_cholesterol,
    ln_hdl,
    ln_systolic_bp,
    smoker_coef,
    diabetes_coef,
    sum_of_coefficients,
    risk_score;

  if (gender === "male") {
    ln_age = Math.log(age) * 3.06117;
    ln_total_cholesterol = Math.log(total_cholesterol) * 1.1237;
    ln_hdl = Math.log(hdl_cholesterol) * -0.93263;
    ln_systolic_bp =
      Math.log(systolic_bp) * (bp_medication ? 1.93303 : 1.99881);
    smoker_coef = smoker ? 0.65451 : 0;
    diabetes_coef = diabetes ? 0.57367 : 0;
    sum_of_coefficients =
      ln_age +
      ln_total_cholesterol +
      ln_hdl +
      ln_systolic_bp +
      smoker_coef +
      diabetes_coef;
    risk_score =
      1 - Math.pow(0.88936, Math.exp(sum_of_coefficients - 23.9802));
  } else {
    ln_age = Math.log(age) * 2.32888;
    ln_total_cholesterol = Math.log(total_cholesterol) * 1.20904;
    ln_hdl = Math.log(hdl_cholesterol) * -0.70833;
    ln_systolic_bp =
      Math.log(systolic_bp) * (bp_medication ? 2.76157 : 2.82263);
    smoker_coef = smoker ? 0.52873 : 0;
    diabetes_coef = diabetes ? 0.69154 : 0;
    sum_of_coefficients =
      ln_age +
      ln_total_cholesterol +
      ln_hdl +
      ln_systolic_bp +
      smoker_coef +
      diabetes_coef;
    risk_score =
      1 - Math.pow(0.95012, Math.exp(sum_of_coefficients - 26.1931));
  }

  return Math.max(0, Math.min(100, risk_score * 100));
}

function calculateFraminghamWithoutCholesterol(
  age,
  gender,
  smoker,
  systolic_bp,
  bp_medication,
  bmi,
  diabetes
) {
  let ln_age,
    ln_bmi,
    ln_systolic_bp,
    smoker_coef,
    diabetes_coef,
    sum_of_coefficients,
    risk_score;

  if (gender === "male") {
    ln_age = Math.log(age) * 3.11296;
    ln_bmi = Math.log(bmi) * 0.79277;
    ln_systolic_bp =
      Math.log(systolic_bp) * (bp_medication ? 1.85508 : 1.92672);
    smoker_coef = smoker ? 0.70953 : 0;
    diabetes_coef = diabetes ? 0.5316 : 0;
    sum_of_coefficients =
      ln_age +
      ln_bmi +
      ln_systolic_bp +
      smoker_coef +
      diabetes_coef;
    risk_score =
      1 - Math.pow(0.88936, Math.exp(sum_of_coefficients - 23.9388));
  } else {
    ln_age = Math.log(age) * 2.72107;
    ln_bmi = Math.log(bmi) * 0.51125;
    ln_systolic_bp =
      Math.log(systolic_bp) * (bp_medication ? 2.81291 : 2.88267);
    smoker_coef = smoker ? 0.61868 : 0;
    diabetes_coef = diabetes ? 0.77763 : 0;
    sum_of_coefficients =
      ln_age +
      ln_bmi +
      ln_systolic_bp +
      smoker_coef +
      diabetes_coef;
    risk_score =
      1 - Math.pow(0.94833, Math.exp(sum_of_coefficients - 26.0145));
  }

  return Math.max(0, Math.min(100, risk_score * 100));
}

function computeAdjustedRisk(baseline, metMinutes) {
  if (!Number.isFinite(baseline)) return 0;
  const metTarget = 1000;
  const maxReduction = 0.3;
  const reduction = Math.min((metMinutes / metTarget) * maxReduction, maxReduction);
  const adjusted = baseline * (1 - reduction);
  return Math.max(0, adjusted);
}

const clampProbability = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return 0;
  }
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
};

const getPeerReferenceAges = (genderKey) => {
  if (!peerReferenceDataset || !peerReferenceDataset[genderKey]) {
    return [];
  }
  if (!peerReferenceAgeCache[genderKey]) {
    peerReferenceAgeCache[genderKey] = Object.keys(
      peerReferenceDataset[genderKey]
    )
      .map((age) => Number(age))
      .filter((age) => Number.isFinite(age))
      .sort((a, b) => a - b);
  }
  return peerReferenceAgeCache[genderKey];
};

function getPeerReferenceProfile(age, gender) {
  if (!peerReferenceDataset) {
    return null;
  }
  const genderKey = gender === "male" ? "male" : "female";
  const referenceSet = peerReferenceDataset[genderKey];
  if (!referenceSet) {
    return null;
  }
  const ages = getPeerReferenceAges(genderKey);
  if (!ages.length) {
    return null;
  }
  const numericAge = Number(age);
  const minAge = ages[0];
  const maxAge = ages[ages.length - 1];
  const clampedAge = Number.isFinite(numericAge)
    ? Math.min(Math.max(numericAge, minAge), maxAge)
    : minAge;

  let lowerAge = minAge;
  let upperAge = maxAge;
  for (let i = 0; i < ages.length; i += 1) {
    const current = ages[i];
    if (current <= clampedAge) {
      lowerAge = current;
    }
    if (current >= clampedAge) {
      upperAge = current;
      break;
    }
  }

  const lowerProfile = referenceSet[lowerAge];
  const upperProfile = referenceSet[upperAge];
  if (!lowerProfile && !upperProfile) {
    return null;
  }
  if (!upperProfile || lowerAge === upperAge || !lowerProfile) {
    return { ...(lowerProfile || upperProfile) };
  }
  const ratio = (clampedAge - lowerAge) / (upperAge - lowerAge || 1);
  const blended = {};
  Object.keys(lowerProfile).forEach((key) => {
    const lowerValue = Number(lowerProfile[key]);
    const upperValue = Number(upperProfile[key]);
    if (Number.isFinite(lowerValue) && Number.isFinite(upperValue)) {
      blended[key] = lowerValue + (upperValue - lowerValue) * ratio;
    } else {
      blended[key] = lowerProfile[key];
    }
  });
  return blended;
}

function computeExpectedFraminghamWithoutCholesterol(age, gender, profile) {
  if (!profile) return null;
  const systolic = Number(profile.systolic_bp);
  const bmi = Number(profile.bmi);
  if (!Number.isFinite(systolic) || !Number.isFinite(bmi)) {
    return null;
  }

  const smoker = clampProbability(profile.smoker) > 0.5;
  const diabetes = clampProbability(profile.diabetes) > 0.5;
  const bpMedication = clampProbability(profile.bp_medication) > 0.5;

  return calculateFraminghamWithoutCholesterol(
    age,
    gender,
    smoker,
    systolic,
    bpMedication,
    bmi,
    diabetes
  );
}

function computePopulationPeerRisk(age, gender) {
  const profile = getPeerReferenceProfile(age, gender);
  if (!profile) return null;
  const framinghamRisk = computeExpectedFraminghamWithoutCholesterol(
    age,
    gender,
    profile
  );
  if (!Number.isFinite(framinghamRisk)) {
    return null;
  }
  const baselineRisk = framinghamRisk;
  const referenceMet = Number(profile.exercise_met_mins);
  const adjustedRisk =
    Number.isFinite(referenceMet) && referenceMet >= 0
      ? computeAdjustedRisk(baselineRisk, referenceMet)
      : baselineRisk;
  return {
    risk: adjustedRisk,
    profile,
  };
}

function buildRelativeRiskStatement(age, gender, userRisk) {
  if (!Number.isFinite(userRisk) || userRisk <= 0) {
    return null;
  }
  const peerRisk = computePopulationPeerRisk(age, gender);
  if (!peerRisk || !Number.isFinite(peerRisk.risk) || peerRisk.risk <= 0) {
    return null;
  }
  const ratio = peerRisk.risk > 0 ? userRisk / peerRisk.risk : Infinity;
  if (!Number.isFinite(ratio)) {
    return null;
  }
  const differencePercent = Math.abs(ratio - 1) * 100;
  if (differencePercent < 0.5) {
    return {
      message:
        "Your risk of having a cardiovascular event such as a heart attack or stroke is about the same as the average individual of your age.",
      referenceRisk: peerRisk.risk,
      differencePercent,
      direction: "similar",
    };
  }

  const isHigher = ratio >= 1;
  const multiple = isHigher ? ratio : 1 / ratio;
  const roundedMultiple =
    multiple >= 10
      ? multiple.toFixed(0)
      : multiple >= 3
      ? multiple.toFixed(1)
      : multiple.toFixed(2).replace(/\.?0+$/, "");
  const direction = isHigher ? "greater" : "lower";

  return {
    message: `Your risk of having a cardiovascular event such as a heart attack or stroke is ${roundedMultiple}× ${direction} than the average individual of your age.`,
    referenceRisk: peerRisk.risk,
    differencePercent,
    direction,
    multiple: roundedMultiple,
  };
}

function initActivityModule({
  onMetUpdated,
  onResetExtraYears,
  onUpdateExtraYears,
  onUpdateNarrative,
} = {}) {
  const readout = document.getElementById("met-readout");
  const footerYear = document.getElementById("year");
  const activityInput = document.getElementById("activity-type");
  const activityResultsContainer = document.getElementById("activity-results");
  const activityPicker = document.querySelector(
    "[data-component='activity-picker']"
  );
  const durationInput = document.getElementById("session-duration");
  const frequencyInput = document.getElementById("weekly-frequency");
  const computedMetValue = document.getElementById("computed-met");
  const computedBreakdown = document.getElementById("computed-breakdown");
  const metricCards = document.querySelectorAll(".metric-card .value");
  const cancerIncidenceValue = document.querySelector(
    '[data-metric="cancer-incidence"] .value'
  );
  const cancerIncidenceCaption = document.querySelector(
    '[data-metric="cancer-incidence"] .caption'
  );
  const totalCvdValue = document.querySelector(
    '[data-metric="total-cvd"] .value'
  );
  const totalCvdCaption = document.querySelector(
    '[data-metric="total-cvd"] .caption'
  );
  const coronaryHeartDiseaseValue = document.querySelector(
    '[data-metric="coronary-heart-disease"] .value'
  );
  const coronaryHeartDiseaseCaption = document.querySelector(
    '[data-metric="coronary-heart-disease"] .caption'
  );
  const strokeIncidenceValue = document.querySelector(
    '[data-metric="stroke-incidence"] .value'
  );
  const strokeIncidenceCaption = document.querySelector(
    '[data-metric="stroke-incidence"] .caption'
  );
  const heartFailureValue = document.querySelector(
    '[data-metric="heart-failure-incidence"] .value'
  );
  const heartFailureCaption = document.querySelector(
    '[data-metric="heart-failure-incidence"] .caption'
  );
  const cvdMortalityValue = document.querySelector(
    '[data-metric="cvd-mortality"] .value'
  );
  const cvdMortalityCaption = document.querySelector(
    '[data-metric="cvd-mortality"] .caption'
  );
  const cancerMortalityValue = document.querySelector(
    '[data-metric="cancer-mortality"] .value'
  );
  const cancerMortalityCaption = document.querySelector(
    '[data-metric="cancer-mortality"] .caption'
  );
  const allCauseMortalityValue = document.querySelector(
    '[data-metric="all-cause-mortality"] .value'
  );
  const allCauseMortalityCaption = document.querySelector(
    '[data-metric="all-cause-mortality"] .caption'
  );
  const depressionIncidenceValue = document.querySelector(
    '[data-metric="depression-incidence"] .value'
  );
  const depressionIncidenceCaption = document.querySelector(
    '[data-metric="depression-incidence"] .caption'
  );
  const majorDepressiveDisorderValue = document.querySelector(
    '[data-metric="major-depressive-disorder"] .value'
  );
  const majorDepressiveDisorderCaption = document.querySelector(
    '[data-metric="major-depressive-disorder"] .caption'
  );
  const productivityValue = document.querySelector(
    '[data-metric="productivity"] .value'
  );
  const productivityCaption = document.querySelector(
    '[data-metric="productivity"] .caption'
  );
  const healthcareSavingsValue = document.querySelector(
    '[data-metric="healthcare-savings"] .value'
  );
  const healthcareSavingsCaption = document.querySelector(
    '[data-metric="healthcare-savings"] .caption'
  );

  if (!activityInput || !durationInput || !frequencyInput) {
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear().toString();
    }
    return {
      getCurrentMet() {
        return 0;
      },
      setMinutes() {},
      recalc() {},
    };
  }

  const notifyMetUpdated = (totalMet, meta) => {
    if (typeof onMetUpdated === "function") {
      onMetUpdated(totalMet, meta);
    }
  };

  const resetExtraYears =
    typeof onResetExtraYears === "function" ? onResetExtraYears : () => {};
  const renderExtraYears =
    typeof onUpdateExtraYears === "function" ? onUpdateExtraYears : () => {};
  const applyActivityNarrative =
    typeof onUpdateNarrative === "function" ? onUpdateNarrative : () => {};

  let currentMet = 0;

  const fallbackCatalog = [
    { code: "FW001", heading: "Sample activity", description: "Brisk walking", met: 4.3 },
    { code: "FW002", heading: "Sample activity", description: "Light jogging", met: 7.0 },
    { code: "FW003", heading: "Sample activity", description: "Running (tempo)", met: 10.0 },
    { code: "FW004", heading: "Sample activity", description: "Cycling (leisure pace)", met: 6.8 },
    { code: "FW005", heading: "Sample activity", description: "Cycling (fast pace)", met: 10.0 },
    { code: "FW006", heading: "Sample activity", description: "Strength training / circuit", met: 6.0 },
    { code: "FW007", heading: "Sample activity", description: "High-intensity interval training", met: 9.5 },
    { code: "FW008", heading: "Sample activity", description: "Lap swimming (steady)", met: 8.3 },
    { code: "FW009", heading: "Sample activity", description: "Yoga or Pilates", met: 3.0 },
    { code: "FW010", heading: "Sample activity", description: "Dance / aerobics class", met: 7.3 },
  ];

  const embeddedCompendiumDataB64 = `W3siaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTAwMyIsICJtZXQiOiAxNC4wLCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBtb3VudGFpbiwgdXBoaWxsLCB2aWdvcm91cyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwMDQiLCAibWV0IjogMTYuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgbW91bnRhaW4sIGNvbXBldGl0aXZlIHJhY2luZyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwMDgiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBCTVgifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDA5IiwgIm1ldCI6IDguNSwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgbW91bnRhaW4sIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDEwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgPDEwIG1waCwgbGVpc3VyZSwgdG8gd29yayBvciBmb3IgcGxlYXN1cmUifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDExIiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgdG8vZnJvbSB3b3JrLCBzZWxmIHNlbGVjdGVkIHBhY2UifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDEzIiwgIm1ldCI6IDUuOCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgb24gZGlydCBvciBmYXJtIHJvYWQsIG1vZGVyYXRlIHBhY2UifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDE0IiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwMTUiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBzZWxmLXNlbGVjdGVkIGVhc3kgcGFjZSJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwMTYiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBzZWxmLXNlbGVjdGVkIG1vZGVyYXRlIHBhY2UifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDE3IiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgc2VsZi1zZWxlY3RlZCB2aWdvcm91cyBwYWNlIn0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTAxOCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIGxlaXN1cmUgNS41IG1waCJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwMTkiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBsZWlzdXJlLCA5LjQgbXBoIn0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTAyMCIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIDEwLTExLjkgbXBoLCBsZWlzdXJlLCBzbG93LCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDMwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgMTItMTMuOSBtcGgsIGxlaXN1cmUsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwNDAiLCAibWV0IjogMTAuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgMTQtMTUuOSBtcGgsIHJhY2luZyBvciBsZWlzdXJlLCBmYXN0LCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDUwIiwgIm1ldCI6IDEyLjAsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIDE2LTE5IG1waCwgcmFjaW5nL25vdCBkcmFmdGluZyBvciA+MTkgbXBoIGRyYWZ0aW5nLCB2ZXJ5IGZhc3QsIHJhY2luZyBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTA2MCIsICJtZXQiOiAxNi44LCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCA+MjAgbXBoLCByYWNpbmcsIG5vdCBkcmFmdGluZyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwNjUiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCAxMiBtcGgsIHNlYXRlZCwgaGFuZHMgb24gYnJha2UgaG9vZHMgb3IgYmFyIGRyb3BzLCA4MCBycG0ifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDY2IiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgMTIgbXBoLCBzdGFuZGluZywgaGFuZHMgb24gYnJha2UgaG9vZHMsIDYwIHJwbSJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwNzAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiVW5pY3ljbGluZyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEwODAiLCAibWV0IjogNi44LCAiZGVzY3JpcHRpb24iOiAiRS1iaWtlIChlbGVjdHJpY2FsbHkgYXNzaXN0ZWQpIHdpdGhvdXQgZWxlY3Ryb25pYyBzdXBwb3J0In0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTA4NCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJFLWJpa2UgKGVsZWN0cmljYWxseSBhc3Npc3RlZCkgd2l0aCBsaWdodCBlbGVjdHJvbmljIHN1cHBvcnQifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMDg4IiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkUtYmlrZSAoZWxlY3RyaWNhbGx5IGFzc2lzdGVkKSB3aXRoIGhpZ2ggZWxlY3Ryb25pYyBzdXBwb3J0In0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTIwMCIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIHN0YXRpb25hcnksIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjEwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgc3RhdGlvbmFyeSwgMjUtMzAgd2F0dHMsIHZlcnkgbGlnaHQgdG8gbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTIxNCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIHN0YXRpb25hcnksIDUwIHdhdHRzLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjE2IiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgc3RhdGlvbmFyeSwgNjAgd2F0dHMsIGxpZ2h0IHRvIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyMTgiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBzdGF0aW9uYXJ5LCA3MC04MCB3YXR0cyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyMjAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBzdGF0aW9uYXJ5LCA5MC0xMDAgd2F0dHMsIG1vZGVyYXRlIHRvIHZpZ29yb3VzIn0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTIyNCIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIHN0YXRpb25hcnksIDEwMS0xMjUgd2F0dHMifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjI4IiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgc3RhdGlvbmFyeSwgMTI2LTE1MCB3YXR0cyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyMzIiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgc3RhdGlvbmFyeSwgMTUxLTE5OSB3YXR0cyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyMzYiLCAibWV0IjogMTAuOCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgc3RhdGlvbmFyeSwgMjAwLTIyOSB3YXR0cywgdmlnb3JvdXMifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjQwIiwgIm1ldCI6IDEyLjUsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIHN0YXRpb25hcnksIDIzMC0yNTAgd2F0dHMsIHZlcnkgdmlnb3JvdXMifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjQ0IiwgIm1ldCI6IDEzLjgsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIHN0YXRpb25hcnksIDI3MC0zMDUgd2F0dHMsIHZlcnkgdmlnb3JvdXMifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjQ4IiwgIm1ldCI6IDE2LjMsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIHN0YXRpb25hcnksID4zMjUgd2F0dHMsIHZlcnkgdmlnb3JvdXMifSwgeyJoZWFkaW5nIjogIkJpY3ljbGluZyIsICJjb2RlIjogIjAxMjUyIiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgY29uY2VudHJpYyBvbmx5LCAxMDAgVyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyNTQiLCAibWV0IjogMTEuMCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZywgY29uY2VudHJpYyBvbmx5LCAyMDAgVyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyNjIiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBlY2NlbnRyaWMgb25seSwgMTAwIHRvIDE0OSBXIn0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTI2NCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIGVjY2VudHJpYyBvbmx5LCAyMDAgVyJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEyNzAiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBzdGF0aW9uYXJ5LCBSUE0vU3BpbiBiaWtlIGNsYXNzIn0sIHsiaGVhZGluZyI6ICJCaWN5Y2xpbmciLCAiY29kZSI6ICIwMTI5MCIsICJtZXQiOiA4LjgsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcsIGludGVyYWN0aXZlIHZpcnR1YWwgY3ljbGluZywgaW5kb29yIGN5Y2xlIGVyZ29tZXRlciJ9LCB7ImhlYWRpbmciOiAiQmljeWNsaW5nIiwgImNvZGUiOiAiMDEzMDUiLCAibWV0IjogOC44LCAiZGVzY3JpcHRpb24iOiAiQmljeWNsaW5nLCBoaWdoIGludGVuc2l0eSBpbnRlcnZhbCB0cmFpbmluZyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMDAiLCAibWV0IjogNy4zLCAiZGVzY3JpcHRpb24iOiAiQWVyb2JpYywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMDEiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiQWVyb2JpYywgc3RlcCwgd2l0aCA0LWluY2ggc3RlcCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMDIiLCAibWV0IjogNy4zLCAiZGVzY3JpcHRpb24iOiAiQWVyb2JpYywgc3RlcCwgd2l0aCA2IC0gOCBpbmNoIHN0ZXAifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDAzIiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIkFlcm9iaWMsIHN0ZXAsIHdpdGggMTAgLSAxMiBpbmNoIHN0ZXAifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDA0IiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIkJlbmNoIHN0ZXAgY2xhc3MsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDA1IiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIkFlcm9iaWMgZGFuY2UsIGxvdyBpbXBhY3QsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMDYiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiQWVyb2JpYyBkYW5jZSwgaGlnaCBpbXBhY3QsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMDciLCAibWV0IjogMTAuMCwgImRlc2NyaXB0aW9uIjogIkFlcm9iaWMgZGFuY2Ugd2VhcmluZyAxMC0xNSBsYiB3ZWlnaHRzIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjAwOCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJBcm15IHR5cGUgb2JzdGFjbGUgY291cnNlIGV4ZXJjaXNlLCBib290IGNhbXAgdHJhaW5pbmcgcHJvZ3JhbSJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMjAiLCAibWV0IjogNy41LCAiZGVzY3JpcHRpb24iOiAiQ2FsaXN0aGVuaWNzIChlLmcuLCBwdXNodXBzLCBzaXQgdXBzLCBwdWxsLXVwcywganVtcGluZyBqYWNrcywgYnVycGVlcywgYmF0dGxpbmcgcm9wZXMpLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDIyIiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkNhbGlzdGhlbmljcyAoZS5nLiwgcHVzaHVwcywgc2l0IHVwcywgcHVsbC11cHMsIGx1bmdlcyksIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMjQiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiQ2FsaXN0aGVuaWNzIChlLmcuLCBjdXJsIHVwcywgYWJkb21pbmFsIGNydW5jaGVzLCBwbGFuayksIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMzAiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiQ2FsaXN0aGVuaWNzLCBsaWdodCBvciBtb2RlcmF0ZSBlZmZvcnQsIGdlbmVyYWwgKGUuZy4sIGJhY2sgZXhlcmNpc2VzKSwgZ29pbmcgdXAgJiBkb3duIGZyb20gZmxvb3IifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDMyIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIkNpcmN1aXQgdHJhaW5pbmcsIGJvZHkgd2VpZ2h0IGV4ZXJjaXNlcyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwMzQiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiQ2lyY3VpdCB0cmFpbmluZywgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjAzNSIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJDaXJjdWl0IHRyYWluaW5nLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDQwIiwgIm1ldCI6IDcuNSwgImRlc2NyaXB0aW9uIjogIkNpcmN1aXQgdHJhaW5pbmcsIGluY2x1ZGluZyBrZXR0bGViZWxscywgc29tZSBhZXJvYmljIG1vdmVtZW50IHdpdGggbWluaW1hbCByZXN0LCBnZW5lcmFsLCB2aWdvcm91cyBpbnRlbnNpdHkifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDQ1IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkN1cnZlc+KEoiBleGVyY2lzZSByb3V0aW5lcyBpbiB3b21lbiJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNDgiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiRWxsaXB0aWNhbCB0cmFpbmVyLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDQ5IiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIkVsbGlwdGljYWwgdHJhaW5lciwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjA1MCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJSZXNpc3RhbmNlICh3ZWlnaHQgbGlmdGluZyAtIGZyZWUgd2VpZ2h0LCBuYXV0aWx1cyBvciB1bml2ZXJzYWwtdHlwZSksIHBvd2VyIGxpZnRpbmcgb3IgYm9keSBidWlsZGluZywgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjA1MiIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJSZXNpc3RhbmNlICh3ZWlnaHQpIHRyYWluaW5nLCBzcXVhdHMsIGRlYWRsaWZ0LCBzbG93IG9yIGV4cGxvc2l2ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDU0IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIlJlc2lzdGFuY2UgKHdlaWdodCkgdHJhaW5pbmcsIG11bHRpcGxlIGV4ZXJjaXNlcywgOC0xNSByZXBzIGF0IHZhcmllZCByZXNpc3RhbmNlIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjA1NSIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJSZXNpc3RhbmNlIFRyYWluaW5nLCBjaXJjdWl0LCByZWNpcHJvY29sIHN1cGVyc2V0cywgcGVyaXBoZXJhbCBoZWFyIGFjdGlvbiB0cmFpbmluZyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNTYiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiQm9keSB3ZWlnaHQgcmVzaXN0YW5jZSBleGVyY2lzZXMgKGUuZy4sIHNxdWF0LCBsdW5nZSwgcHVzaC11cCwgY3J1bmNoKSwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNTciLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiQm9keSB3ZWlnaHQgcmVzaXN0YW5jZSBleGVyY2lzZXMgKGUuZy4sIHNxdWF0LCBsdW5nZSwgcHVzaC11cCwgY3J1bmNoKSwgaGlnaCBpbnRlbnNpdHkifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDU4IiwgIm1ldCI6IDkuOCwgImRlc2NyaXB0aW9uIjogIktldHRsZSBiZWxsIHN3aW5ncyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNjAiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiSGVhbHRoIGNsdWIgZXhlcmNpc2UsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDYxIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkhlYWx0aCBjbHViIGV4ZXJjaXNlIGNsYXNzZXMgZ2VuZXJhbCwgZ3ltL3dlaWdodCB0cmFpbmluZyBjb21iaW5lZCBpbiBvbmUgdmlzaXQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDYyIiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIkhlYWx0aCBjbHViIGV4ZXJjaXNlLCBjb25kaXRpb25pbmcgY2xhc3NlcyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNjQiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiSG9tZSBleGVyY2lzZSwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNjUiLCAibWV0IjogOS4zLCAiZGVzY3JpcHRpb24iOiAiU3RhaXIgdHJlYWRtaWxsIGVyZ29tZXRlciwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNjgiLCAibWV0IjogMTEuMCwgImRlc2NyaXB0aW9uIjogIlJvcGUgc2tpcHBpbmcgZXhlcmNpc2UsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDY5IiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIkp1bXBpbmcgcm9wZSwgRGlnaS1KdW1wIE1hY2hpbmcsIDEyMCBqdW1wcy9taW51dGUifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDcwIiwgIm1ldCI6IDcuMywgImRlc2NyaXB0aW9uIjogIlJvd2luZywgc3RhdGlvbmFyeSBlcmdvbWV0ZXIsIGdlbmVyYWwsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNzEiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiUm93aW5nLCBzdGF0aW9uYXJ5IGVyZ29tZXRlciwgZ2VuZXJhbCwgPDEwMCB3YXR0cywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjA3MiIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJSb3dpbmcsIHN0YXRpb25hcnksIDEwMCB0byAxNDkgd2F0dHMsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNzMiLCAibWV0IjogMTEuMCwgImRlc2NyaXB0aW9uIjogIlJvd2luZywgc3RhdGlvbmFyeSwgMTUwIHRvIDE5OSB3YXR0cywgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjA3NCIsICJtZXQiOiAxNC4wLCAiZGVzY3JpcHRpb24iOiAiUm93aW5nLCBzdGF0aW9uYXJ5LCDiiaUgMjAwIHdhdHRzLCB2ZXJ5IHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwNzgiLCAibWV0IjogMTEuMCwgImRlc2NyaXB0aW9uIjogIlNodXR0bGUgcnVubmluZywgZm9yd2FyZC9iYWNrd2FyZC9sYXRlcmFsIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjA4MCIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJTa2kgbWFjaGluZSwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwODIiLCAibWV0IjogMTAuNSwgImRlc2NyaXB0aW9uIjogIlNraSBlcmdvbWV0ZXIsIGNyb3NzIGNvdW50cnksIGRvdWJsZSBwb2xpbmcsIHNsb3cgdG8gbW9kZXJhdGUgc3BlZWQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDg0IiwgIm1ldCI6IDE4LjAsICJkZXNjcmlwdGlvbiI6ICJTa2kgZXJnb21ldGVyLCBjcm9zcyBjb3VudHJ5LCBkb3VibGUgcG9saW5nLCBmYXN0IHRvIG1heGltdW0gc3BlZWQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMDg1IiwgIm1ldCI6IDEwLjUsICJkZXNjcmlwdGlvbiI6ICJTbGlkZSBib2FyZCBleGVyY2lzZSwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIwOTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiU2xpbW5hc3RpY3MsIGphenplcmNpc2UifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTAxIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIlN0cmV0Y2hpbmcsIG1pbGQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTAzIiwgIm1ldCI6IDEuOCwgImRlc2NyaXB0aW9uIjogIlBpbGF0ZXMsIHRyYWRpdGlvbmFsLCBtYXQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTA1IiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIlBpbGF0ZXMsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTA3IiwgIm1ldCI6IDguNSwgImRlc2NyaXB0aW9uIjogIlBvdW5kLCBjb21iaW5hdGlvbiBvZiBQaWxhdGVzIGFuZCBib2R5IG1vdmVtZW50cyB3aXRoIGRydW1taW5nIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjEwOCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJQb2xlIGRhbmNpbmcsIGV4ZXJjaXNlIGNsYXNzIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjExMCIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJUZWFjaGluZyBleGVyY2lzZSBjbGFzc2VzIChlLmcuLCBhZXJvYmljLCB3YXRlcikifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTEyIiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIlRoZXJhcGV1dGljIGV4ZXJjaXNlIGJhbGwsIEZpdGJhbGwgZXhlcmNpc2UifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTE0IiwgIm1ldCI6IDkuNSwgImRlc2NyaXB0aW9uIjogIlRoZXJhcGV1dGljIGV4ZXJjaXNlIGJhbGwsIEZpdGJhbGwgZXhlcmNpc2UsIGhpZ2ggaW50ZW5zaXR5In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjExNSIsICJtZXQiOiAyLjgsICJkZXNjcmlwdGlvbiI6ICJVcHBlciBib2R5IGV4ZXJjaXNlLCBhcm0gZXJnb21ldGVyLCBnZW5lcmFsLCBsaWdodCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxMTYiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiQXJtIEVyZ29tZXRlciwgaGFuZCBiaWtlLCAxNVcifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTE3IiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIkFybSBFcmdvbWV0ZXIsIGhhbmQgYmlrZSwgMjUtMzBXIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjExOCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJBcm0gRXJnb21ldGVyLCBoYW5kIGJpa2UsIDQ1VyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxMTkiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiVXBwZXIgYm9keSBleGVyY2lzZSwgc3RhdGlvbmFyeSBiaWN5Y2xlIC0gQWlyZHluZSAoYXJtcyBvbmx5KSA0MCBycG0sIG1vZGVyYXRlIGludGVuc2l0eSJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxMjAiLCAibWV0IjogNS4zLCAiZGVzY3JpcHRpb24iOiAiV2F0ZXIgYWVyb2JpY3MsIHdhdGVyIGNhbGlzdGhlbmljcywgd2F0ZXIgZXhlcmNpc2UifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTM1IiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIldoaXJscG9vbCwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxNDAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiVmlkZW8sIGV4ZXJjaXNlIHdvcmtvdXRzLCBUViBjb25kaXRpb25pbmcgcHJvZ3JhbXMgKGUuZy4sIHlvZ2EsIHN0cmV0Y2hpbmcsIHNlYXRlZCksIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxNDMiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiVmlkZW8sIGV4ZXJjaXNlIHdvcmtvdXRzLCBUViBjb25kaXRpb25pbmcgcHJvZ3JhbXMgKGUuZy4sIGNhcmRpby1yZXNpc3RhbmNlIHRyYWluaW5nKSwgbW9kZXJhdGUifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTQ1IiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIlZpZGVvLCBleGVyY2lzZSB3b3Jrb3V0cywgVFYgY29uZGl0aW9uaW5nIHByb2dyYW1zIChlLmcuLCBjYXJkaW8tcmVzaXN0YW5jZSB0cmFpbmluZyksIHZpZ29yb3VzIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjE1MCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJZb2dhLCBIYXRoYSJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxNTMiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiWW9nYSwgSGF0aGEsIGhpZ2ggaW50ZW5zaXR5In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjE1NSIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJZb2dhLCBIb3QifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTYwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIllvZ2EsIFBvd2VyIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjE3MCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJZb2dhLCBOYWRpc29kaGFuYSJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxNzUiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiWW9nYSwgR2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIxODAiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiWW9nYSwgU3VyeWEgTmFtYXNrYXIifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMTg1IiwgIm1ldCI6IDIuNywgImRlc2NyaXB0aW9uIjogIllvZ2EsIFZpbnlhc2EifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMjAwIiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIk5hdGl2ZSBOZXcgWmVhbGFuZGVyIFBBLCAoZS5nLiwgSGFrYSBQb3doaXJpLCBQb2ksIE1vdGVhdGVhLCBldGMuKSwgZ2VuZXJhbCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMjA1IiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIk5hdGl2ZSBOZXcgWmVhbGFuZGVyIFBBLCBnZW5lcmFsLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMjEwIiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIkhpZ2ggaW50ZW5zaXR5IGludGVydmFsIGV4ZXJjaXNlLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMjE0IiwgIm1ldCI6IDExLjAsICJkZXNjcmlwdGlvbiI6ICJIaWdoIGludGVuc2l0eSBpbnRlcnZhbCBleGVyY2lzZSwgYnVycGVlcywgbW91bnRhaW4gY2xpbWJlcnMsIHNxdWF0IGp1bXBzLCBUYWJhdGEsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIyMjUiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQmFsYW5jZSBFeGVyY2lzZSBBc3Npc3QgUm9ib3QgKEJFQVIpLCBzaW11bGF0ZWQgc2tpaW5nLCB0ZW5uaXMsIHJvZGVvIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjIzMCIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJIb29waW5nIChmb3JtZXJseSBrbm93biBhcyBodWxhwq4gaG9vcGluZykifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMjQwIiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIkltcHVsc2UgVHJhaW5pbmcgU3lzdGVtLCBJbmVydGlhbCBFeGVyY2lzZSBUcmFpbmVyIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjI4MCIsICJtZXQiOiA3LjksICJkZXNjcmlwdGlvbiI6ICJWaXJ0dWFsIFJlYWxpdHkgRml0bmVzcywgU3VwZXJuYXR1cmFs4oSiIFwiRmxvd1wiLCBcIkJveGluZ1wiIHZpZ29yb3VzIGludGVuc2l0eSJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIyODQiLCAibWV0IjogOS4zLCAiZGVzY3JpcHRpb24iOiAiRXhlckN1YmUsIHdvcmtvdXQgc2VyaWVzIn0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjI4OCIsICJtZXQiOiAxMy4wLCAiZGVzY3JpcHRpb24iOiAiQmxhY2tib3ggSW1tZXJzaXZlIHZpcnR1YWwgcmVhbGl0eSBleGVyZ2FtaW5nIHN5c3RlbSwgdmlnb3JvdXMgaW50ZW5zaXR5In0sIHsiaGVhZGluZyI6ICJDb25kaXRpb25pbmcgRXhlcmNpc2UiLCAiY29kZSI6ICIwMjMwMCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJXYW5kIGV4ZXJjaXNlLCBMaWZlLUJ1aWxkLUxpbmUifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMzEwIiwgIm1ldCI6IDYuNSwgImRlc2NyaXB0aW9uIjogIlp1bWJhLCBncm91cCBjbGFzcyJ9LCB7ImhlYWRpbmciOiAiQ29uZGl0aW9uaW5nIEV4ZXJjaXNlIiwgImNvZGUiOiAiMDIzMTUiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiWnVtYmEsIGhvbWUgdmlkZW8ifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMzQwIiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIlNpdCB0byBzdGFuZCBleGVyY2lzZSwgNi0xMiB0aW1lcy9taW4ifSwgeyJoZWFkaW5nIjogIkNvbmRpdGlvbmluZyBFeGVyY2lzZSIsICJjb2RlIjogIjAyMzQ0IiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIlNpdCB0byBzdGFuZCBleGVyY2lzZSwgMTgtMjQgdGltZXMvbWluIn0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwMDUiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiQWZyby1DdWJhbiBzYWxzYSAoQ3ViYW4gY2hhLWNoYS1jaGEsIG1hbWJvLCBBZnJvIHJ1bWJhLCBjb250cmF0aWVtcG8gc29uIHN0ZXBzLCBvcmlzaGEvc2FudG8gbW92ZW1lbnRzKSJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDEwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkJhbGxldCwgbW9kZXJuLCBvciBqYXp6IGdlbmVyYWwsIHJlaGVhcnNhbCBvciBjbGFzcyJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDExIiwgIm1ldCI6IDYuMywgImRlc2NyaXB0aW9uIjogIkJhbGxldCBleGVyY2lzZXMgKHBsaWUsIHRlbmR1cywgamV0ZXMsIHJvbmQgZGUgSmFtYmVzLCBmb25kdXMsIGdyYW5kIGJhdHRlbWVudCwgZ3JhbmQgYWRhZ2UsIHNhdXRlcywgdGVtcCBMZXZlJ3MpIn0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwMTIiLCAibWV0IjogNi44LCAiZGVzY3JpcHRpb24iOiAiQmFsbGV0LCBtb2Rlcm4sIG9yIGphenosIHBlcmZvcm1hbmNlLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzAxNCIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJUYXAifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzAyNSIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJFdGhuaWMgb3IgY3VsdHVyYWwgZGFuY2luZyAoZS5nLiBHcmVlaywgTWlkZGxlIEVhc3Rlcm4sIGh1bGEsIHNhbHNhLCBtZXJlbmd1ZSwgYmFtYmEgeSBwbGVuYSwgZmxhbWVuY28sIGJlbGx5LCBhbmQgc3dpbmcpIn0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwMjgiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiQ2hpbmVzZSBzcXVhcmUgZGFuY2UsIEJhbGxldCAmIFRpYmV0YW4gZGFuY2UifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzAyOSIsICJtZXQiOiA3LjMsICJkZXNjcmlwdGlvbiI6ICJDaGluZXNlIHNxdWFyZSBkYW5jZSwgYWVyb2JpYyBkYW5jZSJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDMwIiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIkJhbGxyb29tIGRhbmNpbmcsIGZhc3QifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzAzMSIsICJtZXQiOiA5LjgsICJkZXNjcmlwdGlvbiI6ICJOaWdodGNsdWIgb3IgZm9sayBkYW5jaW5nLCB2aWdvcm91cyBlZmZvcnQgKGUuZy4sIG5pZ2h0Y2x1YiwgZGlzY28sIGZvbGssIGxpbmUgZGFuY2luZywgSXJpc2ggc3RlcCBkYW5jaW5nLCBwb2xrYSwgY29udHJhKSJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDMzIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkZvbGsgZGFuY2luZywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwMzgiLCAibWV0IjogMTEuMywgImRlc2NyaXB0aW9uIjogIkJhbGxyb29tIGRhbmNpbmcsIGNvbXBldGl0aXZlLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwMzkiLCAibWV0IjogMTMuMCwgImRlc2NyaXB0aW9uIjogImJhbGxyb29tIGRhbmNlLCBEYW5jZVNwb3J0IGNvbXBldGl0aW9uIChtb2Rlcm4gd2FsdHosIHRhbmdvLCBWaWVubmVzZSB3YWx0eiwgc2xvdyBmb3gsIHF1aWNrIHN0ZXAsIHNhbWJhLCBjaGFjaGEsIHJ1bWJhLCBwYXNvIGRvYmxlLCBqaXZlKSJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDQwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkJhbGxyb29tLCBzbG93LCBleGFtcGxlczogd2FsdHosIGZveHRyb3QsIHNsb3cgZGFuY2luZywgc2FtYmEgdGFuZ28sIHJ1bWJhLCAxOXRoIGNlbnR1cnkgZGFuY2UsIG1hbWJvLCBjaGEgY2hhIn0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwNDIiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiQmFsbHJvb20gRGFuY2UsIFJlY3JlYXRpb25hbCAoV2FsdHosIEZveHRyb3QsIENoYS1jaGEsIFN3aW5nKSJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDUwIiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIkFuaXNoaW5hYWJlIEppbmdsZSBkYW5jaW5nLCBicmlzayBwYWNlLCBvdGhlciB0cmFkaXRpb25hbCBBbWVyaWNhbiBJbmRpYW4gZGFuY2luZyBwZXJmb3JtZWQgYnkgd29tZW4sIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDYwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkNhcmliYmVhbiBkYW5jZSAoQWJha3VhLCBCZWd1aW5lLCBCZWxsYWlyLCBCb25nbywgQnJ1a2luJ3MsIENhcmliYmVhbiBRdWFkcmlsbHMsIERpbmtpIE1pbmksIEdlcmUsIEd1bWJheSwgSWJvLCBKb25rb25udSwgS3VtaW5hLCBPcmVpc2hhLCBKYW1idSkifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzA3MCIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJDb250ZW1wb3JhcnkgZGFuY2luZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDcyIiwgIm1ldCI6IDQuMywgImRlc2NyaXB0aW9uIjogIkNvbnRlbXBvcmFyeSBkYW5jaW5nLCBuaWdodGNsdWIifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzA3NSIsICJtZXQiOiA4LjUsICJkZXNjcmlwdGlvbiI6ICJGbGFtZW5jbyBkYW5jZSJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDc4IiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIkphenogZGFuY2luZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDgwIiwgIm1ldCI6IDEwLjMsICJkZXNjcmlwdGlvbiI6ICJNdXNpY2FsIFRoZWF0ZXIsIFNpbmdpbmcvZGFuY2luZyJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDg1IiwgIm1ldCI6IDUuOCwgImRlc2NyaXB0aW9uIjogIlBvbHluZXNpYW4gZGFuY2UsIEhhd2FpaWFuIGh1bGEgc2xvdywgTWFvcmkgaGFrYSwgVG9uZ2FuIn0sIHsiaGVhZGluZyI6ICJEYW5jaW5nIiwgImNvZGUiOiAiMDMwODYiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiUG9seW5lc2lhbiBkYW5jZSwgSGF3YWlpYW4gaHVsYSBmYXN0LCBTYW1vYW4gc2FzYSwgRmlqaWFuIHN0eWxlIGZhc3QsIEZpbGlwaW5vIFRpbmlrbGluZyJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDg3IiwgIm1ldCI6IDguOCwgImRlc2NyaXB0aW9uIjogIlBvbHluZXNpYW4gZGFuY2UsIFNhbW9hbiBzbGFwLCBUYWhpdGlhbiJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDkwIiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIlNhbHNhIERhbmNpbmcsIHdpdGggcGFydG5lciJ9LCB7ImhlYWRpbmciOiAiRGFuY2luZyIsICJjb2RlIjogIjAzMDkxIiwgIm1ldCI6IDYuMywgImRlc2NyaXB0aW9uIjogIlNhbHNhIGRhbmNpbmcsIHRvIGEgdmlkZW8ifSwgeyJoZWFkaW5nIjogIkRhbmNpbmciLCAiY29kZSI6ICIwMzA5MyIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJTcXVhcmUgRGFuY2luZywgQW1lcmljYW4gV2VzdGVybiwgY291bnRyeSJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDAwMSIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MDA1IiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIkZpc2hpbmcsIGNyYWIgZmlzaGluZyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDAwNyIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nLCBjYXRjaGluZyBmaXNoIHdpdGggaGFuZHMifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQwMTAiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiRmlzaGluZyByZWxhdGVkLCBkaWdnaW5nIHdvcm1zLCB3aXRoIHNob3ZlbCJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDAyMCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nIGZyb20gcml2ZXIgYmFuayBhbmQgd2Fsa2luZyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDAzMCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nIGZyb20gYm9hdCBvciBjYW5vZSwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA0MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nIGZyb20gcml2ZXIgYmFuaywgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQwNTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiRmlzaGluZyBpbiBzdHJlYW0sIGluIHdhZGVycyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA2MCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nLCBpY2UsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQwNjEiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiRmlzaGluZywgamlnIG9yIGxpbmUsIHN0YW5kaW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MDYyIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkZpc2hpbmcsIGRpcCBuZXQsIHNldHRpbmcgbmV0IGFuZCByZXRyaWV2aW5nIGZpc2gsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQwNjMiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiRmlzaGluZywgc2V0IG5ldCwgc2V0dGluZyBuZXQgYW5kIHJldHJpZXZpbmcgZmlzaCwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA2NCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJGaXNoaW5nLCBmaXNoaW5nIHdoZWVsLCBzZXR0aW5nIG5ldCBhbmQgcmV0cmlldmluZyBmaXNoLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MDY1IiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkZpc2hpbmcgd2l0aCBhIHNwZWFyLCBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA3MCIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJIdW50aW5nLCBib3cgYW5kIGFycm93IG9yIGNyb3NzYm93In0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MDgwIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIkh1bnRpbmcsIGRlZXIsIGVsaywgbGFyZ2UgZ2FtZSJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA4MSIsICJtZXQiOiA5LjgsICJkZXNjcmlwdGlvbiI6ICJIdW50aW5nIGxhcmdlIGdhbWUsIGRyYWdnaW5nIGNhcmNhc3MifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQwODMiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiSHVudGluZyBsYXJnZSBtYXJpbmUgYW5pbWFscyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA4NSIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJIdW50aW5nLCBsYXJnZSBnYW1lIGZyb20gYSBodW50aW5nIHN0YW5kLCBsaW1pdGVkIHdhbGtpbmcifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQwODYiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiSHVudGluZyBsYXJnZSBnYW1lIGZyb20gYSBjYXIsIHBsYW5lLCBvciBib2F0In0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MDkwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIkh1bnRpbmcsIGR1Y2ssIHdhZGluZyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDA5NSIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJIdW50aW5nIGZseWluZyBmb3gsIHNxdWlycmVsIn0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MTAwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkh1bnRpbmcsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQxMTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiSHVudGluZywgcGhlYXNhbnRzIG9yIGdyb3VzZSJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDExNSIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJIdW50aW5nIGJpcmRzIn0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MTIwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkh1bnRpbmcsIHJhYmJpdCwgc3F1aXJyZWwsIHByYWlyaWUgY2hpY2ssIHJhY2Nvb24sIHNtYWxsIGdhbWUifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQxMjMiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiSHVudGluZyBwaWdzLCB3aWxkIn0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MTI0IiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIlRyYXBwaW5nIGdhbWUsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQxMjUiLCAibWV0IjogOS41LCAiZGVzY3JpcHRpb24iOiAiSHVudGluZyAtIGhpa2luZyB3aXRoIGh1bnRpbmcgZ2VhciJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDEzMCIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJQaXN0b2wgc2hvb3Rpbmcgb3IgdHJhcCBzaG9vdGluZywgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIkZpc2hpbmcgJiBIdW50aW5nIiwgImNvZGUiOiAiMDQxNDAiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiUmlmbGUgZXhlcmNpc2VzLCBzaG9vdGluZywgbHlpbmcgZG93biJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDE0NSIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJSaWZsZSBleGVyY2lzZXMsIHNob290aW5nLCBrbmVlbGluZyBvciBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDE1MCIsICJtZXQiOiAyLjgsICJkZXNjcmlwdGlvbiI6ICJGb3JhZ2luZywgMC05LjlrZyBiYWNrcGFjayJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDE1MiIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJGb3JhZ2luZywgMTAtMTVrZyBiYWNrcGFjayJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDE2MCIsICJtZXQiOiAxLjAsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIGluIGJvYXQsIHBhc3NlbmdlciJ9LCB7ImhlYWRpbmciOiAiRmlzaGluZyAmIEh1bnRpbmciLCAiY29kZSI6ICIwNDE2NCIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZyBpbiBib2F0In0sIHsiaGVhZGluZyI6ICJGaXNoaW5nICYgSHVudGluZyIsICJjb2RlIjogIjA0MTY4IiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIkFjdGl2aXRpZXMgaW4gYSBib2F0LCBsaWZ0aW5nLCBsb3dlcmluZyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwMTAiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiQ2xlYW5pbmcsIHN3ZWVwaW5nIGNhcnBldCBvciBmbG9vcnMsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDExIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkNsZWFuaW5nLCBzd2VlcGluZywgc2xvdywgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTAxMiIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJDbGVhbmluZywgc3dlZXBpbmcsIGZhc3QsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwMjAiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiQ2xlYW5pbmcgaGVhdnkgb3IgbWFqb3IgKGUuZy4sIHdhc2ggY2FyLCBjbGVhbiBnYXJhZ2UpLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDIxIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkNsZWFuaW5nLCBtb3BwaW5nLCBzdGFuZGluZywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTAyMiIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJDbGVhbmluZyB3aW5kb3dzLCB3YXNoaW5nIHdpbmRvd3MsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDIzIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIk1vcHBpbmcsIHN0YW5kaW5nLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDI0IiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIlBvbGlzaGluZyBmbG9vcnMsIHN0YW5kaW5nLCB3YWxraW5nIHNsb3dseSwgdXNpbmcgZWxlY3RyaWMgcG9saXNoaW5nIG1hY2hpbmUifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDI1IiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIk11bHRpcGxlIGhvdXNlaG9sZCB0YXNrcyBhbGwgYXQgb25jZSwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTAyNiIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJNdWx0aXBsZSBob3VzZWhvbGQgdGFza3MgYWxsIGF0IG9uY2UsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwMjciLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiTXVsdGlwbGUgaG91c2Vob2xkIHRhc2tzIGFsbCBhdCBvbmNlLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDMwIiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIkNsZWFuaW5nLCBob3VzZSBvciBjYWJpbiwgZ2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTAzMiIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJEdXN0aW5nIG9yIHBvbGlzaGluZyBmdXJuaXR1cmUsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDM1IiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIktpdGNoZW4gYWN0aXZpdHksIGdlbmVyYWwsIChlLmcuLCBjb29raW5nLCB3YXNoaW5nIGRpc2hlcywgY2xlYW5pbmcgdXApIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwNDAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiQ2xlYW5pbmcsIGdlbmVyYWwgKHN0cmFpZ2h0ZW5pbmcgdXAsIGNoYW5naW5nIGxpbmVuLCBjYXJyeWluZyBvdXQgdHJhc2gpLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDQxIiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIldhc2ggZGlzaGVzLCBzdGFuZGluZyBvciBpbiBnZW5lcmFsIChub3QgYnJva2VuIGludG8gc3RhbmQvd2FsayBjb21wb25lbnRzKSJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwNDIiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiV2FzaCBkaXNoZXMsIGNsZWFyaW5nIGRpc2hlcyBmcm9tIHRhYmxlLCB3YWxraW5nLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDQzIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIlZhY3V1bWluZywgZ2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTA0NCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJCdXRjaGVyaW5nIGFuaW1hbHMsIHNtYWxsIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTA0NSIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJCdXRjaGVyaW5nIGFuaW1hbHMsIGxhcmdlLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDQ2IiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkN1dHRpbmcgYW5kIHNtb2tpbmcgZmlzaCwgZHJ5aW5nIGZpc2ggb3IgbWVhdCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwNDgiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiVGFubmluZyBoaWRlcywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwNDkiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiQ29va2luZyBvciBmb29kIHByZXBhcmF0aW9uLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDUwIiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIkNvb2tpbmcgb3IgZm9vZCBwcmVwYXJhdGlvbiAtIHN0YW5kaW5nIG9yIHNpdHRpbmcgb3IgaW4gZ2VuZXJhbCAobm90IGJyb2tlbiBpbnRvIHN0YW5kL3dhbGsgY29tcG9uZW50cyksIG1hbnVhbCBhcHBsaWFuY2VzLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDUxIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkNvb2tpbmcgb3IgZm9vZCBwcmVwYXJhdGlvbiwgd2Fsa2luZyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwNTIiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiU2VydmluZyBmb29kLCBzZXR0aW5nL2NsZWFuaW5nIHRhYmxlLCBpbXBsaWVkIHdhbGtpbmcgb3Igc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDUzIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIkZlZWRpbmcgaG91c2Vob2xkIGFuaW1hbHMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDU0IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogImNhcnJ5aW5nIGdyb2Nlcmllcywgb24gbGV2ZWwgZ3JvdW5kLCB3YWxraW5nIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTA1NSIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJQdXR0aW5nIGF3YXkgZ3JvY2VyaWVzIChlLmcuIGNhcnJ5aW5nIGdyb2NlcmllcywgY2FycnlpbmcgcGFja2FnZXMpIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTA1NiIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJDYXJyeWluZyBncm9jZXJpZXMgdXBzdGFpcnMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDU3IiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkNvb2tpbmcgSW5kaWFuIGJyZWFkIG9yIG90aGVyIGZvb2Qgb24gYW4gb3V0c2lkZSBzdG92ZSJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwNjAiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiRm9vZCBzaG9wcGluZyB3aXRoIG9yIHdpdGhvdXQgYSBncm9jZXJ5IGNhcnQ7IGNhcnJ5aW5nIGEgMTAgbGIgYmFnOyBzdGFuZGluZyBvciB3YWxraW5nIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTA2NSIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJOb24tZm9vZCBzaG9wcGluZywgd2l0aCBvciB3aXRob3V0IGNhcnQsIHN0YW5kaW5nIG9yIHdhbGtpbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDcwIiwgIm1ldCI6IDEuOCwgImRlc2NyaXB0aW9uIjogIklyb25pbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDgwIiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIktuaXR0aW5nLCBzZXdpbmcsIGxpZ2h0IGVmZm9ydCwgd3JhcHBpbmcgcHJlc2VudHMsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDgyIiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIlNld2luZyB3aXRoIGEgbWFjaGluZSJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwOTAiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiTGF1bmRyeSwgZm9sZCBvciBoYW5nIGNsb3RoZXMsIHB1dCBjbG90aGVzIGluIHdhc2hlciBvciBkcnllciwgcGFja2luZyBzdWl0Y2FzZSwgd2FzaGluZyBjbG90aGVzIGJ5IGhhbmQsIGltcGxpZWQgc3RhbmRpbmcsIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwOTEiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiTGF1bmRyeSwgZm9sZCBvciBoYW5nIGNsb3RoZXMsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MDkyIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkxhdW5kcnksIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUwOTUiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiTGF1bmRyeSwgcHV0dGluZyBhd2F5IGNsb3RoZXMsIGdhdGhlcmluZyBjbG90aGVzIHRvIHBhY2ssIHB1dHRpbmcgYXdheSBsYXVuZHJ5LCBpbXBsaWVkIHdhbGtpbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTAwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIk1ha2luZyBiZWQsIGNoYW5naW5nIGxpbmVucyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxMTAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiTWFwbGUgc3lydXBpbmcvc3VnYXIgYnVzaGluZyAoaW5jbHVkaW5nIGNhcnJ5aW5nIGJ1Y2tldHMsIGNhcnJ5aW5nIHdvb2QpIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTEyMCIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJNb3ZpbmcgZnVybml0dXJlLCBob3VzZWhvbGQgaXRlbXMsIGNhcnJ5aW5nIGJveGVzIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTEyMSIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJNb3ZpbmcsIGxpZnRpbmcgbGlnaHQgbG9hZHMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTI1IiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIk9yZ2FuaXppbmcgYSByb29tIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTEzMCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJTY3J1YmJpbmcgZmxvb3JzLCBvbiBoYW5kcyBhbmQga25lZXMsIHNjcnViYmluZyBiYXRocm9vbSwgYmF0aHR1YiwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTEzMSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJTY3J1YmJpbmcgZmxvb3JzLCBvbiBoYW5kcyBhbmQga25lZXMsIHNjcnViYmluZyBiYXRocm9vbSwgYmF0aHR1YiwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTEzMiIsICJtZXQiOiA2LjUsICJkZXNjcmlwdGlvbiI6ICJTY3J1YmJpbmcgZmxvb3JzLCBvbiBoYW5kcyBhbmQga25lZXMsIHNjcnViYmluZyBiYXRocm9vbSwgYmF0aHR1Yiwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE0MCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJTd2VlcGluZyBnYXJhZ2UsIHNpZGV3YWxrLCBvciBvdXRzaWRlIGhvdXNlIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE0NiIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgcGFja2luZy91bnBhY2tpbmcgYm94ZXMsIG9jY2FzaW9uYWwgbGlmdGluZyBsaWdodHdlaWdodCBob3VzZWhvbGQgaXRlbXMsIGxvYWRpbmcgb3IgdW5sb2FkaW5nIGl0ZW1zIGludG8gYSBjYXIsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxNDciLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiSW1wbGllZCB3YWxraW5nLCBwdXR0aW5nIGF3YXkgaG91c2Vob2xkIGl0ZW1zLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTQ4IiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIldhdGVyaW5nIHBsYW50cyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxNDkiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiQnVpbGRpbmcgYSBmaXJlIGluc2lkZSJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxNTAiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiTW92aW5nIGhvdXNlaG9sZCBpdGVtcyB1cHN0YWlycywgY2FycnlpbmcgYm94ZXMgb3IgZnVybml0dXJlIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE2MCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgbGlnaHQgZWZmb3J0IHRhc2tzIChwdW1wIGdhcywgY2hhbmdlIGxpZ2h0IGJ1bGIsIGV0Yy4pIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE2NSIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBtb2RlcmF0ZSBlZmZvcnQgdGFza3MsIG5vbi1jbGVhbmluZyAocmVhZHlpbmcgdG8gbGVhdmUsIHNodXQvbG9jayBkb29ycywgY2xvc2Ugd2luZG93cywgZXRjLiJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxNzAiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZywgcGxheWluZyB3aXRoIGNoaWxkKHJlbiksIGxpZ2h0IGVmZm9ydCwgb25seSBhY3RpdmUgcGVyaW9kcyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxNzEiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcsIHBsYXlpbmcgd2l0aCBjaGlsZChyZW4pLCBsaWdodCBlZmZvcnQsIG9ubHkgYWN0aXZlIHBlcmlvZHMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTc1IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcvcnVubmluZywgcGxheWluZyB3aXRoIGNoaWxkKHJlbiksIG1vZGVyYXRlIGVmZm9ydCwgb25seSBhY3RpdmUgcGVyaW9kcyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxODAiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZy9ydW5uaW5nLCBwbGF5aW5nIHdpdGggY2hpbGQocmVuKSwgdmlnb3JvdXMgZWZmb3J0LCBvbmx5IGFjdGl2ZSBwZXJpb2RzIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE4MSIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIGFuZCBjYXJyeWluZyBzbWFsbCBjaGlsZCwgY2hpbGQgd2VpZ2hpbmcgMTUgbGJzIG9yIG1vcmUifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTgyIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcgYW5kIGNhcnJ5aW5nIHNtYWxsIGNoaWxkLCBjaGlsZCB3ZWlnaGluZyBsZXNzIHRoYW4gMTUgbGJzIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE4MyIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgaG9sZGluZyBjaGlsZCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxODQiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiQ2hpbGQgY2FyZSwgaW5mYW50LCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE4NSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJDaGlsZCBjYXJlOiBzaXR0aW5nIG9yIGtuZWVsaW5nLCBkcmVzc2luZywgYmF0aGluZywgZ3Jvb21pbmcsIGZlZWRpbmcsIG9jY2FzaW9uYWwgbGlmdGluZyBvZiBjaGlsZC1saWdodCBlZmZvcnQsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTg2IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkNoaWxkIGNhcmU6IHN0YW5kaW5nLCBkcmVzc2luZywgYmF0aGluZywgZ3Jvb21pbmcsIGZlZWRpbmcsIG9jY2FzaW9uYWwgbGlmdGluZyBvZiBjaGlsZC0gbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE4OCIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJSZWNsaW5pbmcgd2l0aCBiYWJ5In0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE4OSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJCcmVhc3RmZWVkaW5nLCBzaXR0aW5nIG9yIHJlY2xpbmluZyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxOTAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiU2l0LCBwbGF5aW5nIHdpdGggYW5pbWFscywgbGlnaHQsIG9ubHkgYWN0aXZlIHBlcmlvZCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxOTEiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiU3RhbmQsIHBsYXlpbmcgd2l0aCBhbmltYWxzLCBsaWdodCBlZmZvcnQsIG9ubHkgYWN0aXZlIHBlcmlvZHMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTkyIiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIldhbGsgb3IgcnVuLCBwbGF5aW5nIHdpdGggYW5pbWFscywgZ2VuZXJhbCwgbGlnaHQgZWZmb3J0LCBvbmx5IGFjdGl2ZSBwZXJpb2RzIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTE5MyIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJXYWxrL3J1biwgcGxheWluZyB3aXRoIGFuaW1hbHMsIG1vZGVyYXRlIGVmZm9ydCwgb25seSBhY3RpdmUgcGVyaW9kcyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxOTQiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiV2Fsay9ydW4sIHBsYXlpbmcgd2l0aCBhbmltYWxzLCB2aWdvcm91cyBlZmZvcnQsIG9ubHkgYWN0aXZlIHBlcmlvZHMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MTk1IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nLCBiYXRoaW5nIGRvZyJ9LCB7ImhlYWRpbmciOiAiSG9tZSBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMDUxOTciLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQW5pbWFsIGNhcmUsIGhvdXNlaG9sZCBhbmltYWxzLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTIwMCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJFbGRlciBjYXJlLCBkaXNhYmxlZCBhZHVsdCwgYmF0aGluZywgZHJlc3NpbmcsIG1vdmluZyBpbnRvIGFuZCBvdXQgb2YgYmVkLCBvbmx5IGFjdGl2ZSBwZXJpb2RzIn0sIHsiaGVhZGluZyI6ICJIb21lIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIwNTIwNSIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJFbGRlciBjYXJlLCBkaXNhYmxlZCBhZHVsdCwgZmVlZGluZywgY29tYmluZyBoYWlyLCBsaWdodCBlZmZvcnQsIG9ubHkgYWN0aXZlIHBlcmlvZHMifSwgeyJoZWFkaW5nIjogIkhvbWUgQWN0aXZpdGllcyIsICJjb2RlIjogIjA1MzAwIiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIkhhbmR3YXNoaW5nIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MDEwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkFpcnBsYW5lIHJlcGFpciJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjAyMCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJBdXRvbW9iaWxlIGJvZHkgd29yayJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjAzMCIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJBdXRvbW9iaWxlIHJlcGFpciwgbGlnaHQgb3IgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MDQwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkNhcnBlbnRyeSwgZ2VuZXJhbCwgd29ya3Nob3AifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYwNTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiQ2FycGVudHJ5LCBvdXRzaWRlIGhvdXNlLCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjA1MiIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJDYXJwZW50cnksIG91dHNpZGUgaG91c2UsIGJ1aWxkaW5nIGEgZmVuY2UifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYwNjAiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiQ2FycGVudHJ5LCBmaW5pc2hpbmcsIHZhcm5pc2hpbmcsIG9yIHJlZmluaXNoaW5nIGNhYmluZXRzIG9yIGZ1cm5pdHVyZSJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjA3MCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJDYXJwZW50cnksIHNhd2luZyBoYXJkd29vZCwgcGxhbmluZyBhbmQgZHJpbGxpbmcgd29vZCwgbW9kZXJhdGUtdG8tdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MDcyIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkNhcnBlbnRyeSwgaG9tZSByZW1vZGVsaW5nIHRhc2tzLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYwNzQiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQ2FycGVudHJ5LCBob21lIHJlbW9kZWxpbmcgdGFza3MsIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjA4MCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJDYXVsa2luZywgY2hpbmtpbmcgbG9nIGNhYmluIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MDkwIiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIkNhdWxraW5nLCBleGNlcHQgbG9nIGNhYmluIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MTAwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkNsZWFuaW5nIGd1dHRlcnMifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxMTAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiRXhjYXZhdGluZyBnYXJhZ2UifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxMjAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiSGFuZ2luZyBzdG9ybSB3aW5kb3dzIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MTIyIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkhhbmdpbmcgc2hlZXQgcm9jayBpbnNpZGUgaG91c2UifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxMjQiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiSGFtbWVyaW5nIG5haWxzIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MTI2IiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIkhvbWUgcmVwYWlyLCBnZW5lcmFsLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxMjciLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiSG9tZSByZXBhaXIsIGdlbmVyYWwsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjEyOCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJIb21lIHJlcGFpciwgZ2VuZXJhbCwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MTMwIiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIkxheWluZyBvciByZW1vdmluZyBjYXJwZXQifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxNDAiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiTGF5aW5nIHRpbGUgb3IgbGlub2xldW0ifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxNDQiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiUmVwYWlyaW5nIGFwcGxpYW5jZXMifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxNTAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiUGFpbnRpbmcsIG91dHNpZGUgaG9tZSJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjE2MCIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJQYWludGluZyBpbnNpZGUgaG91c2UsIHdhbGxwYXBlcmluZywgc2NyYXBpbmcgcGFpbnQifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxNjUiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiUGFpbnRpbmcifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxNjciLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiUGx1bWJpbmcsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYxNzAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiUHV0IG9uIGFuZCByZW1vdmFsIG9mIHRhcnAgLSBzYWlsYm9hdCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjE4MCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJSb29maW5nIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MTkwIiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIlNhbmRpbmcgZmxvb3JzIHdpdGggYSBwb3dlciBzYW5kZXIifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYyMDAiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiU2NyYXBpbmcgYW5kIHBhaW50aW5nIHNhaWxib2F0IG9yIHBvd2VyYm9hdCJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjIwNSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJTaGFycGVuaW5nIHRvb2xzIn0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MjEwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIlNwcmVhZGluZyBkaXJ0IHdpdGggYSBzaG92ZWwifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYyMjAiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiV2FzaGluZyBhbmQgd2F4aW5nIGh1bGwgb2Ygc2FpbGJvYXQgb3IgYWlycGxhbmUifSwgeyJoZWFkaW5nIjogIkhvbWUgUmVwYWlyIiwgImNvZGUiOiAiMDYyMjUiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiV2FzaGluZyBhbmQgd2F4aW5nIGNhciJ9LCB7ImhlYWRpbmciOiAiSG9tZSBSZXBhaXIiLCAiY29kZSI6ICIwNjIzMCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJXYXNoaW5nIGZlbmNlLCBwYWludGluZyBmZW5jZSwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJIb21lIFJlcGFpciIsICJjb2RlIjogIjA2MjQwIiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIldpcmluZywgdGFwcGluZy1zcGxpY2luZyJ9LCB7ImhlYWRpbmciOiAiSW5hY3Rpdml0eSIsICJjb2RlIjogIjA3MDA5IiwgIm1ldCI6IDEuMCwgImRlc2NyaXB0aW9uIjogIkx5aW5nIHF1aWV0bHkgYW5kIHdhdGNoaW5nIHRlbGV2aXNpb24ifSwgeyJoZWFkaW5nIjogIkluYWN0aXZpdHkiLCAiY29kZSI6ICIwNzAxMSIsICJtZXQiOiAxLjAsICJkZXNjcmlwdGlvbiI6ICJMeWluZyBxdWlldGx5LCBkb2luZyBub3RoaW5nLCBseWluZyBpbiBiZWQgYXdha2UsIGxpc3RlbmluZyB0byBtdXNpYyAobm90IHRhbGtpbmcgb3IgcmVhZGluZykifSwgeyJoZWFkaW5nIjogIkluYWN0aXZpdHkiLCAiY29kZSI6ICIwNzAyMCIsICJtZXQiOiAxLjAsICJkZXNjcmlwdGlvbiI6ICJTaXQsIHdhdGNoIHRlbGV2aXNpb24ifSwgeyJoZWFkaW5nIjogIkluYWN0aXZpdHkiLCAiY29kZSI6ICIwNzAyMSIsICJtZXQiOiAxLjAsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIHF1aWV0bHksIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkluYWN0aXZpdHkiLCAiY29kZSI6ICIwNzAyMiIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIHF1aWV0bHksIGZpZGdldGluZywgZ2VuZXJhbCwgZmlkZ2V0aW5nIGhhbmRzIn0sIHsiaGVhZGluZyI6ICJJbmFjdGl2aXR5IiwgImNvZGUiOiAiMDcwMjMiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZywgZmlkZ2V0IGZlZXQifSwgeyJoZWFkaW5nIjogIkluYWN0aXZpdHkiLCAiY29kZSI6ICIwNzAyNCIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIHNtb2tpbmcifSwgeyJoZWFkaW5nIjogIkluYWN0aXZpdHkiLCAiY29kZSI6ICIwNzAyNSIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nLCBsaXN0ZW5pbmcgdG8gbXVzaWMgKG5vdCB0YWxraW5nIG9yIHJlYWRpbmcpIG9yIHdhdGNoaW5nIGEgbW92aWUgaW4gYSB0aGVhdGVyIn0sIHsiaGVhZGluZyI6ICJJbmFjdGl2aXR5IiwgImNvZGUiOiAiMDcwMjYiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZyBhdCBhIGRlc2ssIHJlc3RpbmcgaGVhZCBpbiBoYW5kcyJ9LCB7ImhlYWRpbmciOiAiSW5hY3Rpdml0eSIsICJjb2RlIjogIjA3MDMwIiwgIm1ldCI6IDEuMCwgImRlc2NyaXB0aW9uIjogIlNsZWVwaW5nIn0sIHsiaGVhZGluZyI6ICJJbmFjdGl2aXR5IiwgImNvZGUiOiAiMDcwNDAiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcgcXVpZXRseSAoc3RhbmRpbmcgaW4gYSBsaW5lKSJ9LCB7ImhlYWRpbmciOiAiSW5hY3Rpdml0eSIsICJjb2RlIjogIjA3MDQxIiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nIChmaWRnZXRpbmcpIn0sIHsiaGVhZGluZyI6ICJJbmFjdGl2aXR5IiwgImNvZGUiOiAiMDcwNDUiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcgd2F0Y2hpbmcgdGVsZXZpc2lvbiJ9LCB7ImhlYWRpbmciOiAiSW5hY3Rpdml0eSIsICJjb2RlIjogIjA3MDUwIiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIlJlY2xpbmluZywgd3JpdGluZyJ9LCB7ImhlYWRpbmciOiAiSW5hY3Rpdml0eSIsICJjb2RlIjogIjA3MDYwIiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIlJlY2xpbmluZywgdGFsa2luZyBvciB0YWxraW5nIG9uIHBob25lIn0sIHsiaGVhZGluZyI6ICJJbmFjdGl2aXR5IiwgImNvZGUiOiAiMDcwNzAiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiUmVjbGluaW5nLCByZWFkaW5nIn0sIHsiaGVhZGluZyI6ICJJbmFjdGl2aXR5IiwgImNvZGUiOiAiMDcwNzUiLCAibWV0IjogMS4wLCAiZGVzY3JpcHRpb24iOiAiTWVkaXRhdGluZyJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDA5IiwgIm1ldCI6IDQuMSwgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nLCBsb2FkaW5nIG9yIHN0YWNraW5nIHdvb2QsIGxvYWRpbmcvdW5sb2FkaW5nIG9yIGNhcnJ5aW5nIGx1bWJlciwgbGlnaHQtdG8tIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDEwIiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nLCBsb2FkaW5nIG9yIHN0YWNraW5nIHdvb2QsIGxvYWRpbmcvdW5sb2FkaW5nIG9yIGNhcnJ5aW5nIGx1bWJlciwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgwMTkiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiQ2hvcHBpbmcgd29vZCwgc3BsaXR0aW5nIGxvZ3MsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDIwIiwgIm1ldCI6IDYuNSwgImRlc2NyaXB0aW9uIjogIkNob3BwaW5nIHdvb2QsIHNwbGl0dGluZyBsb2dzLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODAyNSIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJDbGVhcmluZyBsaWdodCBicnVzaCwgdGhpbm5pbmcgZ2FyZGVuLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODAzMCIsICJtZXQiOiA2LjMsICJkZXNjcmlwdGlvbiI6ICJDbGVhcmluZyBsYW5kLCBoYXVsIGJydXNoLCB1bmRlcmdyb3d0aCwgb3IgZ3JvdW5kLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODA0MCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJEaWdnaW5nIHNhbmRib3gsIHNob3ZlbGluZyBzYW5kIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgwNDUiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiRGlnZ2luZywgc3BhZGluZywgZmlsbGluZyBnYXJkZW4sIGNvbXBvc3RpbmcsIGxpZ2h0LXRvLW1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDUwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkRpZ2dpbmcsIHNwYWRpbmcsIGZpbGxpbmcgZ2FyZGVuLCBjb21wb3N0aW5nIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgwNTIiLCAibWV0IjogNy4zLCAiZGVzY3JpcHRpb24iOiAiRGlnZ2luZywgc3BhZGluZywgZmlsbGluZyBnYXJkZW4sIGNvbXBvc3RpbmcsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDU1IiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIkRyaXZpbmcgdHJhY3RvciJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDU3IiwgIm1ldCI6IDguMywgImRlc2NyaXB0aW9uIjogIkZlbGxpbmcgdHJlZXMsIGxhcmdlIHNpemUifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODA1OCIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJGZWxsaW5nIHRyZWVzLCBzbWFsbC1tZWRpdW0gc2l6ZSJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MDYwIiwgIm1ldCI6IDUuOCwgImRlc2NyaXB0aW9uIjogIkdhcmRlbmluZyB3aXRoIGhlYXZ5IHBvd2VyIHRvb2xzLCB1c2luZyBjaGFpbiBzYXcsIHRpbGxpbmcgYSBnYXJkZW4ifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODA2NiIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJnYXJkZW5pbmcsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODA3MCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJJcnJpZ2F0aW9uIGNoYW5uZWxzLCBvcGVuaW5nIGFuZCBjbG9zaW5nIHBvcnRzIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgwODAiLCAibWV0IjogNi4zLCAiZGVzY3JpcHRpb24iOiAiTGF5aW5nIGNydXNoZWQgcm9jayBvciBncmF2ZWwifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODA5MCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJMYXlpbmcgc29kIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgwOTUiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiTW93aW5nIGxhd24sIGdlbmVyYWwsIHdhbGtpbmcsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MTAwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIk1vd2luZyBsYXduLCByaWRpbmcgbW93ZXIifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODExMCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJNb3dpbmcgbGF3biwgaGFuZCBtb3dlciwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgxMjAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiTW93aW5nIGxhd24sIHdhbGssIHBvd2VyIG1vd2VyLCBtb2RlcmF0ZSBvciB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODEyNSIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJNb3dpbmcgbGF3biwgcG93ZXIgbW93ZXIsIGxpZ2h0IG9yIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MTMwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIk9wZXJhdGluZyBzbm93IGJsb3dlciwgd2Fsa2luZyJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MTM1IiwgIm1ldCI6IDIuNiwgImRlc2NyaXB0aW9uIjogIlBsYW50aW5nLCBwb3R0aW5nLCB0cmFuc3BsYW50aW5nIHNlZWRsaW5ncyBvciBwbGFudHMsIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MTQwIiwgIm1ldCI6IDQuMywgImRlc2NyaXB0aW9uIjogIlBsYW50aW5nIHNlZWRsaW5ncywgc2hydWJzLCBzdG9vcGluZywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgxNDUiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiUGxhbnRpbmcgY3JvcHMgb3IgZ2FyZGVuLCBzdG9vcGluZywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgxNTAiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiUGxhbnRpbmcgdHJlZXMifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODE2MCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJSYWtpbmcgbGF3biBvciBsZWF2ZXMsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MTY1IiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIlJha2luZyBsYXduIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgxNzAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiUmFraW5nIHJvb2Ygd2l0aCBzbm93IHJha2UifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODE4MCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJSaWRpbmcgc25vdyBibG93ZXIifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODE5MCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJTYWNraW5nIGdyYXNzLCBsZWF2ZXMifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODE5MiIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJTaG92ZWxpbmcgZGlydCBvciBtdWQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODE5NSIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJTaG92ZWxpbmcgc25vdywgYnkgaGFuZCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyMDAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiU2hvdmVsaW5nIHNub3csIGJ5IGhhbmQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODIwMiIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJTaG92ZWxpbmcgc25vdywgYnkgaGFuZCwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyMTAiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiVHJpbW1pbmcgc2hydWJzIG9yIHRyZWVzLCBtYW51YWwgY3V0dGVyIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyMTUiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiVHJpbW1pbmcgc2hydWJzIG9yIHRyZWVzLCBwb3dlciBjdXR0ZXIsIHVzaW5nIGxlYWYgYmxvd2VyLCBlZGdlciwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyMjAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgYXBwbHlpbmcgZmVydGlsaXplciBvciBzZWVkaW5nIGEgbGF3biwgcHVzaCBhcHBsaWNhdG9yIn0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyMzAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiV2F0ZXJpbmcgbGF3biBvciBnYXJkZW4sIHN0YW5kaW5nIG9yIHdhbGtpbmcifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODIzOSIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJXZWVkaW5nLCBjdWx0aXZhdGluZyBnYXJkZW4sIGxpZ2h0LXRvLW1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MjQwIiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIldlZWRpbmcsIGN1bHRpdmF0aW5nIGdhcmRlbiwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyNDEiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiV2VlZGluZywgY3VsdGl2YXRpbmcgZ2FyZGVuLCB1c2luZyBob2UgbW9kZXJhdGUtdG8tdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyNDUiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiR2FyZGVuaW5nLCBnZW5lcmFsLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODI0NiIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJQaWNraW5nIGZydWl0IG9yIGNvZmZlZSBmcm9tIHRyZWVzLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODI0OCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJIYXJ2ZXN0aW5nIFByb2R1Y2UsIFBpY2tpbmcgZnJ1aXQgb2ZmIHRyZWVzLCBnbGVhbmluZyBmcnVpdHMsIHBpY2tpbmcgZnJ1aXRzL3ZlZ2V0YWJsZXMsIGNsaW1iaW5nIGxhZGRlciB0byBwaWNrIGZydWl0LCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODI1MCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJJbXBsaWVkIHdhbGtpbmcvc3RhbmRpbmcgLSBwaWNraW5nIHVwIHlhcmQsIGxpZ2h0LCBwaWNraW5nIGZsb3dlcnMgb3IgdmVnZXRhYmxlcyJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MjUxIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIGdhdGhlcmluZyBnYXJkZW5pbmcgdG9vbHMifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODI1NSIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJXaGVlbCBiYXJyb3csIHB1c2hpbmcgZ2FyZGVuIGNhcnQgb3Igd2hlZWxiYXJyb3csIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODI1NiIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJXaGVlbCBiYXJyb3csIHB1c2hpbmcgbGFyZ2UgZ2FyZGVuIGNhcnQgb3IgaGVhdnkgd2hlZWxiYXJyb3cgdXAgdG8gMTUwa2cifSwgeyJoZWFkaW5nIjogIkxhd24gJiBHYXJkZW4iLCAiY29kZSI6ICIwODI2MCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJZYXJkd29yaywgZ2VuZXJhbCwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJMYXduICYgR2FyZGVuIiwgImNvZGUiOiAiMDgyNjEiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiWWFyZHdvcmssIGdlbmVyYWwsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTGF3biAmIEdhcmRlbiIsICJjb2RlIjogIjA4MjYyIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIllhcmR3b3JrLCBnZW5lcmFsLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTAwMCIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJCb2FyZCBnYW1lIHBsYXlpbmcsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTAwNSIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJDYXNpbm8gZ2FtYmxpbmcsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwMTAiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiQ2FyZCBwbGF5aW5nLCBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwMTMiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiQ2hlc3MgZ2FtZSwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiTWlzY2VsbGFuZW91cyIsICJjb2RlIjogIjA5MDE1IiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIkNvcHlpbmcgb3IgZmlsaW5nIGRvY3VtZW50cywgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTAyMCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJEcmF3aW5nLCB3cml0aW5nLCBwYWludGluZywgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTAyNSIsICJtZXQiOiAxLjAsICJkZXNjcmlwdGlvbiI6ICJMYXVnaHRlciwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiTWlzY2VsbGFuZW91cyIsICJjb2RlIjogIjA5MDMwIiwgIm1ldCI6IDEuMCwgImRlc2NyaXB0aW9uIjogIlNpdHRpbmc6IHJlYWRpbmcsIGJvb2ssIG5ld3NwYXBlciwgbWFnYXppbmUifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTAzNCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJzaXR0aW5nLCB0eXBpbmcgb3IgcmVhZGluZyBvbiBhIGJhbGFuY2UgY2hhaXIvc3RhYmlsaXR5IGJhbGwifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTAzNiIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJ3YXRjaGluZyB0diwgc3RlcHBpbmcgZHVyaW5nIGNvbW1lcmNpYWwgYnJlYWtzIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwNDAiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZzogd3JpdGluZywgZGVzayB3b3JrLCB0eXBpbmcifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTA1MCIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZzogdGFsa2luZyBpbiBwZXJzb24sIG9uIHRoZSBwaG9uZSwgY29tcHV0ZXIsIHRleHQgbWVzc2FnaW5nLCB3cml0aW5nIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwNTUiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZzogdGFsa2luZyBpbiBwZXJzb24sIG9uIHRoZSBwaG9uZSwgY29tcHV0ZXIsIG9yIHRleHQgbWVzc2FnaW5nLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTA2MCIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIC0gc3R1ZHlpbmcsIGdlbmVyYWwsIGluY2x1ZGluZyByZWFkaW5nIGFuZC9vciB3cml0aW5nLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTA2NSIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIC0gaW4gY2xhc3MsIGdlbmVyYWwsIGluY2x1ZGluZyBub3RlLXRha2luZyBvciBjbGFzcyBkaXNjdXNzaW9uIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwNzAiLCAibWV0IjogMS4wLCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcgLSByZWFkaW5nIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwNzEiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmc6IG1pc2NlbGxhbmVvdXMifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTA3NSIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nOiBhcnRzIGFuZCBjcmFmdHMsIGNhcnZpbmcgd29vZCwgd2VhdmluZywgc3Bpbm5pbmcgd29vbCwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkwODAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZzogYXJ0cyBhbmQgY3JhZnRzLCBjYXJ2aW5nIHdvb2QsIHdlYXZpbmcsIHNwaW5uaW5nIHdvb2wsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTWlzY2VsbGFuZW91cyIsICJjb2RlIjogIjA5MDg1IiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nOiBhcnRzIGFuZCBjcmFmdHMsIHNhbmQgcGFpbnRpbmcsIGNhcnZpbmcsIHdlYXZpbmcsIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiTWlzY2VsbGFuZW91cyIsICJjb2RlIjogIjA5MDkwIiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nIC0gYXJ0cyBhbmQgY3JhZnRzLCBzYW5kIHBhaW50aW5nLCBjYXJ2aW5nLCB3ZWF2aW5nLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTA5NSIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZyAtIGFydHMgYW5kIGNyYWZ0cywgc2FuZCBwYWludGluZywgY2FydmluZywgd2VhdmluZywgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkxMDAiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiUmV0cmVhdC9mYW1pbHkgcmV1bmlvbiBhY3Rpdml0aWVzIGludm9sdmluZyBzaXR0aW5nLCByZWxheGluZywgdGFsa2luZywgZWF0aW5nIn0sIHsiaGVhZGluZyI6ICJNaXNjZWxsYW5lb3VzIiwgImNvZGUiOiAiMDkxMDEiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiUmV0cmVhdC9mYW1pbHkgcmV1bmlvbiBhY3Rpdml0aWVzIGludm9sdmluZyBwbGF5aW5nIGdhbWVzIHdpdGggY2hpbGRyZW4ifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTEwNSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJUb3VyaW5nL3RyYXZlbGluZy92YWNhdGlvbiBpbnZvbHZpbmcgcmlkaW5nIGluIHZlaGljbGUifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTEwNiIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJUb3VyaW5nL3RyYXZlbGluZy92YWNhdGlvbiBpbnZvbHZpbmcgd2Fsa2luZyJ9LCB7ImhlYWRpbmciOiAiTWlzY2VsbGFuZW91cyIsICJjb2RlIjogIjA5MTEwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIkNhbXBpbmcgaW52b2x2aW5nIHN0YW5kaW5nLCB3YWxraW5nLCBzaXR0aW5nLCBsaWdodC10by1tb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk1pc2NlbGxhbmVvdXMiLCAiY29kZSI6ICIwOTExNSIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIGF0IGEgc3BvcnRpbmcgZXZlbnQsIHNwZWN0YXRvciJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMDEwIiwgIm1ldCI6IDEuOCwgImRlc2NyaXB0aW9uIjogIkFjY29yZGlvbiwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMDIwIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkNlbGxvLCBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwMzAiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQ29uZHVjdGluZyBvcmNoZXN0cmEsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwMzUiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiRG91YmxlIGJhc3MsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwNDAiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiRHJ1bXMsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIk11c2ljIFBsYXlpbmciLCAiY29kZSI6ICIxMDA0NSIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJEcnVtbWluZyAoZS5nLiwgYm9uZ28sIGNvbmdhLCBiZW5iZSksIG1vZGVyYXRlLCBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwNDgiLCAibWV0IjogOC4zLCAiZGVzY3JpcHRpb24iOiAiRHJ1bW1pbmcsIGNvbmNlcnQvbGl2ZSBzaG93In0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwNTAiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiRmx1dGUsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIk11c2ljIFBsYXlpbmciLCAiY29kZSI6ICIxMDA2MCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJIb3JuLCBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMDcwIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIlBpYW5vLCBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwNzQiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiUGxheWluZyBtdXNpY2FsIGluc3RydW1lbnRzLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAwNzciLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiT3JnYW4sIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIk11c2ljIFBsYXlpbmciLCAiY29kZSI6ICIxMDA4MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJUcm9tYm9uZSwgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIk11c2ljIFBsYXlpbmciLCAiY29kZSI6ICIxMDA5MCIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJUcnVtcGV0LCBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMTAwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIlZpb2xpbiwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMTEwIiwgIm1ldCI6IDEuOCwgImRlc2NyaXB0aW9uIjogIldvb2R3aW5kIGluc3RydW1lbnRzLCBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAxMTUiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiQnJhc3MgaW5zdHJ1bWVudHMsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIk11c2ljIFBsYXlpbmciLCAiY29kZSI6ICIxMDEyMCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJHdWl0YXIsIGNsYXNzaWNhbCwgZm9saywgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMTI1IiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkd1aXRhciwgcm9jayBhbmQgcm9sbCBiYW5kLCBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiTXVzaWMgUGxheWluZyIsICJjb2RlIjogIjEwMTMwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIk1hcmNoaW5nIGJhbmQsIGJhdG9uIHR3aXJsaW5nLCB3YWxraW5nLCBtb2RlcmF0ZSBwYWNlLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAxMzEiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiTWFyY2hpbmcgYmFuZCwgcGxheWluZyBhbiBpbnN0cnVtZW50LCB3YWxraW5nLCBicmlzayBwYWNlLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJNdXNpYyBQbGF5aW5nIiwgImNvZGUiOiAiMTAxMzUiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiTWFyY2hpbmcgYmFuZCwgZHJ1bSBtYWpvciwgd2Fsa2luZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDAwIiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIkFjdGl2ZSB3b3Jrc3RhdGlvbiwgUGVkYWwgZGVzaywgYmFsYW5jZSBjaGFpci9iYWxsLCBHZW5lcmFsLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTAwMSIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJBY3RpdmUgd29ya3N0YXRpb24sIFBlZGFsIGRlc2sgKDQwIHdhdHRzKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDAyIiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIkFjdGl2ZSB3b3Jrc3RhdGlvbiwgUGVkYWwgZGVzayAoODAgd2F0dHMpIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMDMiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiQWN0aXZlIHdvcmtzdGF0aW9uLCB0cmVhZG1pbGwgZGVzaywgd2Fsa2luZyBzbG93bHkgMS4wIG1waCBvciBsZXNzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMDQiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiQWN0aXZlIHdvcmtzdGF0aW9uLCB0cmVhZG1pbGwgZGVzaywgd2Fsa2luZyAxLjAgLSAyLjAgbXBoIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMDYiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiQWlybGluZSBmbGlnaHQgYXR0ZW5kYW50In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMDgiLCAibWV0IjogNC44LCAiZGVzY3JpcHRpb24iOiAiQXBwbGUgSGFydmVzdGluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDEwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkJha2VyeSwgZ2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMTUiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiQmFrZXJ5LCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTAyMCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJCb29rYmluZGluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDMwIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIkJ1aWxkaW5nIHJvYWQsIGRyaXZpbmcgaGVhdnkgbWFjaGluZXJ5In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMzUiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiQnVpbGRpbmcgcm9hZCwgZGlyZWN0aW5nIHRyYWZmaWMsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwMzgiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiQ2FycGVudHJ5LCBnZW5lcmFsLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTA0MCIsICJtZXQiOiA0LjMsICJkZXNjcmlwdGlvbiI6ICJDYXJwZW50cnksIGdlbmVyYWwsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDQyIiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIkNhcnBlbnRyeSwgZ2VuZXJhbCwgaGVhdnkgb3Igdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwNTAiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiQ2FycnlpbmcgaGVhdnkgbG9hZHMgKGUuZy4sIGJyaWNrcywgdG9vbHMpIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwNjAiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiQ2FycnlpbmcgbW9kZXJhdGUgbG9hZHMgdXAgc3RhaXJzLCBtb3ZpbmcgYm94ZXMsIDI1LTQ5IGxicyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDcwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkNoYW1iZXJtYWlkLCBob3RlbCBob3VzZWtlZXBlciwgbWFraW5nIGJlZCwgY2xlYW5pbmcgYmF0aHJvb20sIHB1c2hpbmcgY2FydCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDcyIiwgIm1ldCI6IDQuMywgImRlc2NyaXB0aW9uIjogIkNsZWFuaW5nLCB2YWN1dW1pbmcgY29tbWVyY2lhbCBzcGFjZSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMDgwIiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIkNvYWwgbWluaW5nLCBkcmlsbGluZyBjb2FsLCByb2NrIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEwOTAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiQ29hbCBtaW5pbmcsIGVyZWN0aW5nIHN1cHBvcnRzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExMDAiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiQ29hbCBtaW5pbmcsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTExMCIsICJtZXQiOiA2LjMsICJkZXNjcmlwdGlvbiI6ICJDb2FsIG1pbmluZywgc2hvdmVsaW5nIGNvYWwsIGJ5IGhhbmQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTExNSIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJDb29rLCBjaGVmIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExMjAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiQ29uc3RydWN0aW9uLCBvdXRzaWRlLCByZW1vZGVsaW5nLCBuZXcgc3RydWN0dXJlcyAoZS5nLiwgcm9vZiByZXBhaXIsIG1pc2NlbGxhbmVvdXMpIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExMjQiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQ29uc3RydWN0aW9uLCByZWJhciwgYmFyIGJlbmRpbmcvZml4aW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExMjUiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiQ3VzdG9kaWFsIHdvcmssIGxpZ2h0IGVmZm9ydCAoZS5nLiwgY2xlYW5pbmcgc2luayBhbmQgdG9pbGV0LCBkdXN0aW5nLCB2YWN1dW1pbmcsIGxpZ2h0IGNsZWFuaW5nKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMTI2IiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkN1c3RvZGlhbCB3b3JrLCBtb2RlcmF0ZSBlZmZvcnQgKGUuZy4sIGJ1ZmZpbmcgZmxvb3JzIHdpdGggZWxlY3RyaWMgYnVmZmVyLCBmZWF0aGVyaW5nIG9yIHN3ZWVwaW5nIGFyZW5hIGZsb29ycywgbW9wcGluZywgdGFraW5nIG91dCB0aGUgdHJhc2gsIHZhY2N1bWluZykifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTEzMCIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJFbGVjdHJpY2FsIHdvcmsgKGUuZy4sIGhvb2sgdXAgd2lyZSwgdGFwcGluZyBzcGxpY2luZyk7IHBsdW1iaW5nIG1vdmVkIHRvMTE1MTYifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTEzNSIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJFbmdpbmVlciAoZS5nLiwgbWVjaGFuaWNhbCBvciBlbGVjdHJpY2FsKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMTQ1IiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIkZhcm1pbmcsIHZpZ29yb3VzIGVmZm9ydCAoZS5nLiwgYmFsaW5nIGhheSwgY2xlYW5pbmcgYmFybiksIGluY2x1ZGVzIGZvcm1lciBjb2RlIDExMjAwIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExNDYiLCAibWV0IjogNC44LCAiZGVzY3JpcHRpb24iOiAiRmFybWluZywgbW9kZXJhdGUgZWZmb3J0IChlLmcuLCBmZWVkaW5nIGFuaW1hbHMsIGNoYXNpbmcgY2F0dGxlIGJ5IHdhbGtpbmcgYW5kL29yIGhvcnNlYmFjaywgc3ByZWFkaW5nIG1hbnVyZSwgaGFydmVzdGluZyBjcm9wcykifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTE0NyIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJGYXJtaW5nLCBsaWdodCBlZmZvcnQsIChlLmcuLCBjbGVhbmluZyBhbmltYWwgc2hlZHMsIHByZXBhcmluZyBhbmltYWwgZmVlZCkifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTE3MCIsICJtZXQiOiAyLjgsICJkZXNjcmlwdGlvbiI6ICJGYXJtaW5nLCBkcml2aW5nIHRhc2tzIChlLmcuLCBkcml2aW5nIHRyYWN0b3Igb3IgaGFydmVzdGVyKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMTgwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkZhcm1pbmcsIGZlZWRpbmcgc21hbGwgYW5pbWFscyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMTkwIiwgIm1ldCI6IDQuMywgImRlc2NyaXB0aW9uIjogIkZhcm1pbmcsIGZlZWRpbmcgY2F0dGxlLCBob3JzZXMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTE5MSIsICJtZXQiOiA0LjMsICJkZXNjcmlwdGlvbiI6ICJGYXJtaW5nLCBoYXVsaW5nIHdhdGVyIGZvciBhbmltYWxzLCBmZXRjaGluZyB3YXRlciBmcm9tIHdlbGwgb3Igc3RyZWFtIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExOTIiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiRmFybWluZywgdGFraW5nIGNhcmUgb2YgYW5pbWFscyAoZS5nLiwgZ3Jvb21pbmcsIGJydXNoaW5nLCBzaGVhcmluZyBzaGVlcCwgYXNzaXN0aW5nIHdpdGggYmlydGhpbmcsIG1lZGljYWwgY2FyZSwgYnJhbmRpbmcpLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTExOTUiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiRmFybWluZywgcmljZSwgcGxhbnRpbmcsIGdyYWluIG1pbGxpbmcgYWN0aXZpdGllcyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMjEwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkZhcm1pbmcsIG1pbGtpbmcgYnkgaGFuZCwgY2xlYW5pbmcgcGFpbHMsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMjIwIiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIkZhcm1pbmcsIG1pbGtpbmcgYnkgbWFjaGluZSwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyMjIiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiRmFybWluZywgbWlsa2luZyBDb3dzLCBmdWxsIG1pbGtpbmcgcHJvY2VzcywgbW9kZXJuIG1pbGtpbmcgcGFybG9yIHdpdGggbWlsa2luZyBtYWNoaW5lcyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMjQwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkZpcmUgZmlnaHRlciwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMjQ0IiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIkZpcmUgZmlnaHRlciwgcmVzY3VlIHZpY3RpbSwgYXV0b21vYmlsZSBhY2NpZGVudCwgdXNpbmcgcGlrZSBwb2xlIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNDUiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiRmlyZSBmaWdodGVyLCByYWlzaW5nIGFuZCBjbGltYmluZyBsYWRkZXIgd2l0aCBmdWxsIGdlYXIsIHNpbXVsYXRlZCBmaXJlIHN1cHByZXNzaW9uIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNDYiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiRmlyZSBmaWdodGVyLCBoYXVsaW5nIGhvc2VzIG9uIGdyb3VuZCwgY2FycnlpbmcvaG9pc3RpbmcgZXF1aXBtZW50LCBicmVha2luZyBkb3duIHdhbGxzIGV0Yy4sIHdlYXJpbmcgZnVsbCBnZWFyIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNDciLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiRmlzaGluZywgY29tbWVyY2lhbCwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNDgiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiRmlzaGluZywgY29tbWVyY2lhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNTAiLCAibWV0IjogMTcuNSwgImRlc2NyaXB0aW9uIjogIkZvcmVzdHJ5LCBheCBjaG9wcGluZywgdmVyeSBmYXN0LCAxLjI1IGtnIGF4ZSwgNTEgYmxvd3MvbWluLCBleHRyZW1lbHkgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNjAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiRm9yZXN0cnksIGF4IGNob3BwaW5nLCBzbG93LCAxLjI1IGtnIGF4ZSwgMTkgYmxvd3MvbWluLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTI2MiIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJGb3Jlc3RyeSwgYXggY2hvcHBpbmcsIGZhc3QsIDEuMjUga2cgYXhlLCAzNSBibG93cy9taW4sIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMjY0IiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkZvcmVzdHJ5LCBtb2RlcmF0ZSBlZmZvcnQgKGUuZy4sIHNhd2luZyB3b29kIHdpdGggcG93ZXIgc2F3LCB3ZWVkaW5nLCBob2VpbmcpIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEyNjYiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiRm9yZXN0cnksIHZpZ29yb3VzIGVmZm9ydCAoZS5nLiwgYmFya2luZywgZmVsbGluZywgb3IgdHJpbW1pbmcgdHJlZXMsIGNhcnJ5aW5nIG9yIHN0YWNraW5nIGxvZ3MsIHBsYW50aW5nIHNlZWRzLCBzYXdpbmcgbHVtYmVyIGJ5IGhhbmQgKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMzcwIiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIkZ1cnJpZXJ5In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEzNzUiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiR2FyYmFnZSBjb2xsZWN0b3IsIHdhbGtpbmcsIGR1bXBpbmcgYmlucyBpbnRvIHRydWNrLCBzdHJlZXQgY2xlYW5pbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTM3OCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJIYWlyc3R5bGlzdCAoZS5nLiwgcGxhaXRpbmcgaGFpciwgbWFuaWN1cmUsIG1ha2UgdXAgYXJ0aXN0KSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExMzgwIiwgIm1ldCI6IDcuMywgImRlc2NyaXB0aW9uIjogIkhvcnNlIGdyb29taW5nLCBpbmNsdWRpbmcgZmVlZGluZywgY2xlYW5pbmcgc3RhbGxzLCBiYXRoaW5nLCBicnVzaGluZywgY2xpcHBpbmcsIGxvbmdlaW5nIGFuZCBleGVyY2lzaW5nIGhvcnNlcy4ifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTM4MSIsICJtZXQiOiA0LjMsICJkZXNjcmlwdGlvbiI6ICJIb3JzZSwgZmVlZGluZywgd2F0ZXJpbmcsIGNsZWFuaW5nIHN0YWxscywgaW1wbGllZCB3YWxraW5nIGFuZCBsaWZ0aW5nIGxvYWRzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEzODMiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiSG9yc2ViYWNrIHJpZGluZywgd29ya2luZywgY3V0dGluZyBjb3dzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTEzOTAiLCAibWV0IjogNy44LCAiZGVzY3JpcHRpb24iOiAiSG9yc2UgcmFjaW5nLCBnYWxsb3BpbmcsIGNhbnRvciJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNDAwIiwgIm1ldCI6IDYuMywgImRlc2NyaXB0aW9uIjogIkhvcnNlIHJhY2luZywgSm9ja2V5LCB0cm90dGluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNDEwIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkhvcnNlIHJhY2luZywgSm9ja2V5LCB3YWxraW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0MTMiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiS2l0Y2hlbiBtYWlkIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0MTUiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiTGF3biBrZWVwZXIsIHlhcmR3b3JrLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0MTYiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiTGF3biBrZWVwZXIsIHdlZWRpbmcsIGdhcyBwb3dlcmVkIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0MTgiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiTGF1bmRyeSB3b3JrZXIifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTQyMCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJMb2Nrc21pdGgifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTQzMCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJNYWNoaW5lIHRvb2xpbmcgKGUuZy4sIG1hY2hpbmluZywgd29ya2luZyBzaGVldCBtZXRhbCwgbWFjaGluZSBmaXR0ZXIsIG9wZXJhdGluZyBsYXRoZSwgd2VsZGluZykgbGlnaHQtdG8tbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0NTAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiTWFjaGluZSB0b29saW5nLCBvcGVyYXRpbmcgcHVuY2ggcHJlc3MsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNDcyIiwgIm1ldCI6IDEuOCwgImRlc2NyaXB0aW9uIjogIk1hbmFnZXIsIHByb3BlcnR5In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0NzUiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiTWFudWFsIG9yIHVuc2tpbGxlZCBsYWJvciwgZ2VuZXJhbCwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0NzYiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiTWFudWFsIG9yIHVuc2tpbGxlZCBsYWJvciwgZ2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0NzciLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiTWFudWFsIG9yIHVuc2tpbGxlZCBsYWJvciwgZ2VuZXJhbCwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0ODAiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiTWFzb25hcnksIGNvbmNyZXRlLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTQ4MiIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJNYXNvbnJ5LCBjb25jcmV0ZSwgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0ODUiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiTWFzc2FnZSB0aGVyYXBpc3QsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0ODYiLCAibWV0IjogMi4zLCAiZGVzY3JpcHRpb24iOiAiTWFpbCBjYXJyaWVyLCB3YWxraW5nIHRvIGRlbGl2ZXIgbWFpbCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNDg3IiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIk1haWwgZGVsaXZlcnksIG1vdG9yYmlrZSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNDg4IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIk1haWwgZGVsaXZlcnksIEVsZWN0cm9uaWNhbGx5IEFzc2lzdGVkIEJpY3ljbGUifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTQ5MCIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJNb3ZpbmcsIGNhcnJ5aW5nIG9yIHB1c2hpbmcgaGVhdnkgb2JqZWN0cywgNzUgbGJzIG9yIG1vcmUsIG9ubHkgYWN0aXZlIHRpbWUgKGUuZy4sIGRlc2tzLCBtb3ZpbmcgdmFuIHdvcmspIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE0OTMiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiTWluaW5nLCBnZW5lcmFsIHNlcnZpY2VzLCBkcmlsbGluZywgbWluaW5nIHN1cHBvcnQgam9icyAobWVjaGFuaWNhbCwgd2VsZGluZywgcGlwZSBpbnN0YWxsYXRpb24sIGdlbmVyYWwgY29uc3RydWN0aW9uKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNDk1IiwgIm1ldCI6IDEyLjAsICJkZXNjcmlwdGlvbiI6ICJTa2luZGl2aW5nIG9yIFNDVUJBIGRpdmluZyBhcyBhIGZyb2dtYW4sIE5hdnkgU2VhbCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTAwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIk9wZXJhdGluZyBoZWF2eSBkdXR5IGVxdWlwbWVudCwgYXV0b21hdGVkLCBub3QgZHJpdmluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTEwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIk9yYW5nZSBncm92ZSB3b3JrLCBwaWNraW5nIGZydWl0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1MTQiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiUGFpbnRpbmcsIGhvdXNlLCBmdXJuaXR1cmUsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTE2IiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIlBsdW1iaW5nIGFjdGl2aXRpZXMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTUyMCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJQcmludGluZywgcGFwZXIgaW5kdXN0cnkgd29ya2VyLCBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTI0IiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIlBvbGljZSBPZmZpY2VyLCBXYWxraW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1MjUiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiUG9saWNlLCBkaXJlY3RpbmcgdHJhZmZpYywgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTUyNiIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJQb2xpY2UsIGRyaXZpbmcgYSBzcXVhZCBjYXIsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTUyNyIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJQb2xpY2UsIHJpZGluZyBpbiBhIHNxdWFkIGNhciwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTI4IiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIlBvbGljZSwgbWFraW5nIGFuIGFycmVzdCwgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTUyOSIsICJtZXQiOiA5LjAsICJkZXNjcmlwdGlvbiI6ICJDb3VudGVyIHRlcnJvcmlzbSBtYW5ldXZlcnMsIGNsZWFyaW5nIGJ1aWxkaW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1MzAiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiU2hvZSByZXBhaXIsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTU0MCIsICJtZXQiOiA3LjMsICJkZXNjcmlwdGlvbiI6ICJTaG92ZWxpbmcsIGRpZ2dpbmcgZGl0Y2hlcyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTUwIiwgIm1ldCI6IDguOCwgImRlc2NyaXB0aW9uIjogIlNob3ZlbGluZywgbW9yZSB0aGFuIDE2IGxicy9taW51dGUsIGRlZXAgZGlnZ2luZywgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1NjAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiU2hvdmVsaW5nLCBsZXNzIHRoYW4gMTAgbGJzL21pbnV0ZSwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1NzAiLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiU2hvdmVsaW5nLCAxMCB0byAxNSBsYnMvbWludXRlLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTU4MCIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIHRhc2tzLCBsaWdodCBlZmZvcnQgKGUuZy4sIG9mZmljZSB3b3JrLCBjaGVtaXN0cnkgbGFiIHdvcmssIGxpZ2h0IGFzc2VtYmx5IHJlcGFpciwgd2F0Y2ggcmVwYWlyLCByZWFkaW5nLCBkZXNrIHdvcmspIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1ODIiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZywgY29tcHV0ZXIgd29yayJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNTgzIiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nIHdvcmtzdGF0aW9uLCB0eXBpbmcsIGNvbXB1dGVyIHdvcmsifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTU4NSIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nIG1lZXRpbmdzLCBsaWdodCBlZmZvcnQsIGdlbmVyYWwsIGFuZC9vciB3aXRoIHRhbGtpbmcgaW52b2x2ZWQgKGUuZy4sIGVhdGluZyBhdCBhIGJ1c2luZXNzIG1lZXRpbmcpIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE1OTAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZyB0YXNrcywgbW9kZXJhdGUgZWZmb3J0IChlLmcuIHB1c2hpbmcgaGVhdnkgbGV2ZXJzLCByaWRpbmcgbW93ZXIvZm9ya2xpZnQsIGNyYW5lIG9wZXJhdGlvbikifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTU5MyIsICJtZXQiOiAyLjgsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nLCB0ZWFjaGluZyBzdHJldGNoaW5nIG9yIHlvZ2EsIG9yIGxpZ2h0IGVmZm9ydCBleGVyY2lzZSBjbGFzc2VzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE2MDAiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcgdGFza3MsIGxpZ2h0IGVmZm9ydCAoZS5nLiwgYmFydGVuZGluZywgc3RvcmUgY2xlcmssIGFzc2VtYmxpbmcsIGZpbGluZywgZHVwbGljYXRpbmcsIGxpYnJhcmlhbiwgcHV0dGluZyB1cCBhIENocmlzdG1hcyB0cmVlLCBzdGFuZGluZyBhbmQgdGFsa2luZyBhdCB3b3JrLCBjaGFuZ2luZyBjbG90aGVzIHdoZW4gdGVhY2hpbmcgcGh5c2ljYWwgZWR1Y2F0aW9uKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNjEwIiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nLCBsaWdodC9tb2RlcmF0ZSBlZmZvcnQgKGUuZy4sIGFzc2VtYmxlL3JlcGFpciBoZWF2eSBwYXJ0cywgd2VsZGluZywgc3RvY2tpbmcgcGFydHMsIGF1dG8gcmVwYWlyLCBwYWNraW5nIGJveGVzLCBudXJzaW5nIHBhdGllbnQgY2FyZSwgbGF1bmRyeSkifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTYxNSIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgbW9kZXJhdGUgZWZmb3J0LCBsaWZ0aW5nIGl0ZW1zIGNvbnRpbnVvdXNseSwgMTAgLSAyMCBsYnMsIHdpdGggbGltaXRlZCB3YWxraW5nIG9yIHJlc3RpbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTYyMCIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgbW9kZXJhdGUgZWZmb3J0LCBpbnRlcm1pdHRlbnQgbGlmdGluZyA1MCBsYnMsIGhpdGNoIG9yIHR3aXN0aW5nIHJvcGVzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE2MzAiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcsIG1vZGVyYXRlL2hlYXZ5IHRhc2tzIChlLmcuLCBsaWZ0aW5nIG1vcmUgdGhhbiA1MCBsYnMsIG1hc29ucnksIHBhaW50aW5nLCBwYXBlciBoYW5naW5nKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNjUwIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIlBhdGllbnQgY2FyZSwgaGVhbHRoY2FyZSBhY3Rpdml0ZXMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTY2MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJQYXRpZW50IGNhcmUsIHJvb20gY2xlYW5pbmcvcHJlcGVyYXRpb24ifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTcwOCIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJTdGVlbCBtaWxsLCBtb2RlcmF0ZSBlZmZvcnQgKGUuZy4sIGZldHRsaW5nLCBmb3JnaW5nLCB0aXBwaW5nIG1vbGRzKSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNzEwIiwgIm1ldCI6IDguMywgImRlc2NyaXB0aW9uIjogIlN0ZWVsIG1pbGwsIHZpZ29yb3VzIGVmZm9ydCAoZS5nLiwgaGFuZCByb2xsaW5nLCBtZXJjaGFudCBtaWxsIHJvbGxpbmcsIHJlbW92aW5nIHNsYWcsIHRlbmRpbmcgZnVybmFjZSkifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTcyMCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJUYWlsb3JpbmcsIGN1dHRpbmcgZmFicmljIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3MzAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiVGFpbG9yaW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3NDAiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiVGFpbG9yaW5nLCBoYW5kIHNld2luZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNzUwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIlRhaWxvcmluZywgbWFjaGluZSBzZXdpbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc2MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJUYWlsb3JpbmcsIHByZXNzaW5nIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3NjMiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiVGFpbG9yaW5nLCB3ZWF2aW5nLCBsaWdodCBlZmZvcnQgKGUuZy4sIGZpbmlzaGluZyBvcGVyYXRpb25zLCB3YXNoaW5nLCBkeWVpbmcsIGluc3BlY3RpbmcgY2xvdGgsIGNvdW50aW5nIHlhcmRzLCBwYXBlcndvcmspIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3NjUiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiVGFpbG9yaW5nLCB3ZWF2aW5nLCBtb2RlcmF0ZSBlZmZvcnQgKGUuZy4sIHNwaW5uaW5nIGFuZCB3ZWF2aW5nIG9wZXJhdGlvbnMsIGRlbGl2ZXJpbmcgYm94ZXMgb2YgeWFybiB0byBzcGlubmVycywgbG9hZGluZyBvZiB3YXJwIGJlYW4sIHBpbndpbmRpbmcsIGNvbmV3aW5kaW5nLCB3YXJwaW5nLCBjbG90aCBjbHV0dGluZykifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc2NiIsICJtZXQiOiA2LjUsICJkZXNjcmlwdGlvbiI6ICJUcnVjayBkcml2aW5nLCBsb2FkaW5nIGFuZCB1bmxvYWRpbmcgdHJ1Y2ssIHR5aW5nIGRvd24gbG9hZCwgc3RhbmRpbmcsIHdhbGtpbmcgYW5kIGNhcnJ5aW5nIGhlYXZ5IGxvYWRzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3NjciLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiVHJ1Y2sgZHJpdmluZywgZGVsaXZlcnkgdHJ1Y2ssIHRheGksIHNodXR0bGVidXMsIHNjaG9vbCBidXMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc3MCIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJUeXBpbmcsIGVsZWN0cmljLCBtYW51YWwgb3IgY29tcHV0ZXIifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc4MCIsICJtZXQiOiA2LjMsICJkZXNjcmlwdGlvbiI6ICJVc2luZyBoZWF2eSBwb3dlciB0b29scyBzdWNoIGFzIHBuZXVtYXRpYyB0b29scyAoZS5nLiwgamFja2hhbW1lcnMsIGRyaWxscywgZXRjLikifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc5MCIsICJtZXQiOiA3LjgsICJkZXNjcmlwdGlvbiI6ICJVc2luZyBoZWF2eSB0b29scyAobm90IHBvd2VyKSBzdWNoIGFzIHNob3ZlbCwgcGljaywgdHVubmVsIGJhciwgc3BhZGUifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc5MSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIG9uIGpvYiwgbGVzcyB0aGFuIDIuMCBtcGgsIHZlcnkgc2xvdyBzcGVlZCwgaW4gb2ZmaWNlIG9yIGxhYiBhcmVhIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3OTIiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZyBvbiBqb2IsIDIuOCB0byAzLjQgbXBoLCBpbiBvZmZpY2UsIG1vZGVyYXRlIHNwZWVkLCBub3QgY2FycnlpbmcgYW55dGhpbmcifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc5MyIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIG9uIGpvYiwgMy41IHRvIDMuOSBtcGgsIGluIG9mZmljZSwgYnJpc2sgc3BlZWQsIG5vdCBjYXJyeWluZyBhbnl0aGluZyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExNzk1IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcgb24gam9iLCAyLjUgbXBoLCBzbG93IHNwZWVkLCBjYXJyeWluZyBsaWdodCBvYmplY3RzIGxlc3MgdGhhbiAyNSBsYnMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTc5NiIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBnYXRoZXJpbmcgdGhpbmdzIGF0IHdvcmssIHJlYWR5IHRvIGxlYXZlIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE3OTciLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi41IG1waCwgc2xvdyBzcGVlZCwgY2FycnlpbmcgaGVhdnkgb2JqZWN0cyBtb3JlIHRoYW4gMjUgbGJzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE4MDAiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMy4wIG1waCwgbW9kZXJhdGVseSBhbmQgY2FycnlpbmcgbGlnaHQgb2JqZWN0cyBsZXNzIHRoYW4gMjUgbGJzIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE4MDUiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgcHVzaGluZyBhIHdoZWVsY2hhaXIifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTgxMCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCAzLjUgbXBoLCBicmlza2x5IGFuZCBjYXJyeWluZyBvYmplY3RzIGxlc3MgdGhhbiAyNSBsYnMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTgyMCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIG9yIHdhbGsgZG93bnN0YWlycyBvciBzdGFuZGluZywgY2Fycnlpbmcgb2JqZWN0cyBhYm91dCAyNSB0byA0OSBsYnMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTgzMCIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIG9yIHdhbGsgZG93bnN0YWlycyBvciBzdGFuZGluZywgY2Fycnlpbmcgb2JqZWN0cyBhYm91dCA1MCB0byA3NCBsYnMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg0MCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIG9yIHdhbGsgZG93bnN0YWlycyBvciBzdGFuZGluZywgY2Fycnlpbmcgb2JqZWN0cyBhYm91dCA3NSB0byA5OSBsYnMifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg1MCIsICJtZXQiOiA3LjMsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIG9yIHdhbGsgZG93bnN0YWlycyBvciBzdGFuZGluZywgY2Fycnlpbmcgb2JqZWN0cyBhYm91dCAxMDAgbGJzIG9yIG1vcmUifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg2MCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJXYXJlaG91c2UvU2hpcHBpbmcgQ2VudGVyLCBMb2FkaW5nL1VubG9hZGluZyBib3hlcyJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExODYyIiwgIm1ldCI6IDQuMywgImRlc2NyaXB0aW9uIjogIldhcmVob3VzZS9TaGlwcGluZyBDZW50ZXIsIE1vdmluZyBib3hlcyAofjVrZykifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg3MCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJXb3JraW5nIGluIHNjZW5lIHNob3AsIHRoZWF0ZXIgYWN0b3IsIGJhY2tzdGFnZSBlbXBsb3llZSJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExODgwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIlNvbGRpZXJzLCBtaWxpdGFyeSBtYXJjaGluZywgdW5sb2FkZWQgMS41LTIuNSBtcGgifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg4MiIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJTb2xkaWVycywgbWlsaXRhcnkgbWFyY2hpbmcsIDEuNS0yLjUgbXBoLCAxMCB0byAzMCBrZyBsb2FkIn0sIHsiaGVhZGluZyI6ICJPY2N1cGF0aW9uIiwgImNvZGUiOiAiMTE4ODQiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiQWlyYm9ybmUgU2h1ZmZsZSwgMi41IHRvIDMuNSBtcGgsIDIwLTMwIGtnIGxvYWQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg4NiIsICJtZXQiOiA2LjMsICJkZXNjcmlwdGlvbiI6ICJTb2xkaWVycywgbWlsaXRhcnkgbG9hZGVkIG1hcmNoaW5nLCB2YXJ5aW5nIHRlcnJhaW4sIDI1LTQwIGtnIGxvYWQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg4NyIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJTb2xkaWVycywgd2Fsa2luZywgMi44IG1waCwgNSUgZ3JhZGUsIHVwIHRvIDIxLjUga2cgbG9hZCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExODg4IiwgIm1ldCI6IDguNSwgImRlc2NyaXB0aW9uIjogIlNvbGRpZXJzLCB3YWxraW5nLCAyLjggbXBoLCAxMCUgZ3JhZGUsIHVwIHRvIDIxLjUga2cgbG9hZCJ9LCB7ImhlYWRpbmciOiAiT2NjdXBhdGlvbiIsICJjb2RlIjogIjExODg5IiwgIm1ldCI6IDExLjAsICJkZXNjcmlwdGlvbiI6ICJTb2xkaWVycywgd2Fsa2luZywgMi44IG1waCwgMTUlIGdyYWRlLCB1cCB0byAyMS41IGtnIGxvYWQifSwgeyJoZWFkaW5nIjogIk9jY3VwYXRpb24iLCAiY29kZSI6ICIxMTg5MiIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJNaWxpdGFyeSBhY3Rpdml0aWVzLCBhcnRlcmlhbCBmaWVsZCBwcmVwYXJhdGlvbiwgZGlnZ2luZyBkZWZlbnNpdmUgcG9zaXRpb25zIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwMTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiSm9nL3dhbGsgY29tYmluYXRpb24gKGpvZ2dpbmcgY29tcG9uZW50IG9mIGxlc3MgdGhhbiAxMCBtaW51dGVzKSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMDIwIiwgIm1ldCI6IDcuNSwgImRlc2NyaXB0aW9uIjogIkpvZ2dpbmcsIGdlbmVyYWwsIHNlbGYtc2VsZWN0ZWQgcGFjZSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMDI1IiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIkpvZ2dpbmcsIGluIHBsYWNlIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwMjYiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiSm9nZ2luZyAyLjYgdG8gMy43IG1waCJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMDI3IiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIkpvZ2dpbmcgb24gYSBtaW5pLXRyYW1wIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwMjgiLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgNCB0byA0LjIgbXBoICgxMyBtaW4vbWlsZSkifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjAyOSIsICJtZXQiOiA3LjgsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nIDQuMyB0byA0LjggbXBoIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwMzAiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgNS4wIHRvIDUuMiBtcGggKDEyIG1pbi9taWxlKSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMDQ1IiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDUuNSAtNS44IG1waCJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMDUwIiwgIm1ldCI6IDkuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDYtNi4zIG1waCAoMTAgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwNjAiLCAibWV0IjogMTAuNSwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDYuNyBtcGggKDkgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwNzAiLCAibWV0IjogMTEuMCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDcgbXBoICg4LjUgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwODAiLCAibWV0IjogMTEuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDcuNSBtcGggKDggbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIwOTAiLCAibWV0IjogMTIuMCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDggbXBoICg3LjUgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxMDAiLCAibWV0IjogMTIuNSwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDguNiBtcGggKDcgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxMTAiLCAibWV0IjogMTMuMCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDkgbXBoICg2LjUgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxMTUiLCAibWV0IjogMTQuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDkuMyB0byA5LjYgbXBoIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxMjAiLCAibWV0IjogMTQuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDEwIG1waCAoNiBtaW4vbWlsZSkifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjEzMCIsICJtZXQiOiAxNi44LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgMTEgbXBoICg1LjUgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxMzIiLCAibWV0IjogMTguNSwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDEyIG1waCAoNS4wIG1pbi9taWxlKSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMTM0IiwgIm1ldCI6IDE5LjgsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCAxMyBtcGggKDQuNiBtaW4vbWlsZSkifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjEzNSIsICJtZXQiOiAyMy4wLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgMTQgbXBoICg0LjMgbWluL21pbGUpIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxNDAiLCAibWV0IjogOS4zLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgY3Jvc3MgY291bnRyeSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMTQ1IiwgIm1ldCI6IDEwLjUsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBzZWxmLXNlbGVjdGVkIHBhY2UifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjE1MCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIxNzAiLCAibWV0IjogMTUuMCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIHN0YWlycywgdXAifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjE4MCIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgb24gYSB0cmFjaywgdGVhbSBwcmFjdGljZSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMTg0IiwgIm1ldCI6IDE4LjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBvbiB0cmFjaywgNTAwLTE1MDBtLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMTg2IiwgIm1ldCI6IDE5LjMsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBvbiB0cmFjaywgMjAwMC0zMDAwbSwgY29tcGV0aXRpdmUifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjE5MCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCB0cmFpbmluZywgcHVzaGluZyBhIHdoZWVsY2hhaXIgb3IgYmFieSBjYXJyaWVyIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIyMDAiLCAibWV0IjogMTMuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIG1hcmF0aG9uIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIyNTUiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCA0LjVtcGgsIDUlIGluY2xpbmUifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjI2MCIsICJtZXQiOiAxMy4zLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZyB1cGhpbGwsIDYuMCBtcGgsIDUlIGluY2xpbmUifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjI2NSIsICJtZXQiOiAxNS41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZyB1cGhpbGwsIDcuMCBtcGgsIDUlIGluY2xpbmUifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjMyNSIsICJtZXQiOiAxNy41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZyB1cGhpbGwsIDUuMCB0byA1LjkgbXBoLCAxNSUgaW5jbGluZSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMzM1IiwgIm1ldCI6IDguOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCAwLjYgdG8gMC43OSBtcGgsIDMwJSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzMzciLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCAwLjggdG8gMC45OSBtcGgsIDMwJSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzMzkiLCAibWV0IjogMTEuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCAxLjAgdG8gMS4xOSBtcGgsIDMwJSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzNDEiLCAibWV0IjogMTMuNSwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCAxLjIgdG8gMS4zOSBtcGgsIDMwLTQwJSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzNDMiLCAibWV0IjogMTQuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCAxLjQgdG8gMS41OSBtcGgsIDMwJSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzNDUiLCAibWV0IjogMTYuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgdXBoaWxsLCA+MS42bXBoLCAxMC0zMCUgaW5jbGluZSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMzUwIiwgIm1ldCI6IDE2LjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBoaWxseSB0ZXJyYWluLCDCsTEwMG0gY2hhbmdlIGluIGVsZXZhdGlvbiJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMzUyIiwgIm1ldCI6IDUuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgZG93bmhpbGwsIDUuMCB0byA1LjkgbXBoLCAtMTAlIHRvIC0xNSUifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjM1MyIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nIGRvd25oaWxsLCA2LjAgdG8gNi45IG1waCwgLTEwJSB0byAtMTUlIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzNTUiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZyBkb3duaGlsbCwgNy4wIHRvIDguOSBtcGgsIC0xMCUgdG8gLTE1JSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyMzU4IiwgIm1ldCI6IDkuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgZG93bmhpbGwsIDYuMCB0byA3LjkgbXBoLCAtMyUgdG8gLTklIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTIzNjEiLCAibWV0IjogMTMuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgZG93bmhpbGwsIDguMCB0byAxMC41IG1waCwgLTMlIHRvIC05JSJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNDA1IiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcvam9nZ2luZywgY3VydmVkIHRyZWFkbWlsbCwgMy4wIHRvIDMuOSBtcGgifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjQwOCIsICJtZXQiOiA2LjUsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nL2pvZ2dpbmcsIGN1cnZlZCB0cmVhZG1pbGwsIDQuMCB0byA0LjkgbXBoIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTI0MTAiLCAibWV0IjogMTEuMCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgY3VydmVkIHRyZWFkbWlsbCwgNS4wIHRvIDUuOSBtcGgifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjQxMiIsICJtZXQiOiAxMi4wLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZyBjdXJ2ZWQgdHJlYWRtaWxsLCA3LjAgdG8gNy45IG1waCJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNDE0IiwgIm1ldCI6IDE0LjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nIGN1cnZlZCB0cmVhZG1pbGwsIDguMCB0byA4LjkgbXBoIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTI0MTYiLCAibWV0IjogMTYuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcgY3VydmVkIHRyZWFkbWlsbCwgOS4wIHRvIDkuOSBtcGgifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjUwOCIsICJtZXQiOiA4LjUsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCA1LjAgLSA1LjkgbXBoLCAxLjAgdG8gMy4wIGtnIGJhY2twYWNrIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTI1MTAiLCAibWV0IjogOS41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgNi4wIC0gNi45IG1waCwgMS4wIHRvIDMuMCBrZyBiYWNrcGFjayJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNTEyIiwgIm1ldCI6IDkuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIDcuMCAtIDcuOSBtcGgsIDEuMCB0byAzLjAga2cgYmFja3BhY2sifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjUxNCIsICJtZXQiOiAxMi4wLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgOC4wIC0gOC45IG1waCwgMS4wIHRvIDMuMCBrZyBiYWNrcGFjayJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNTU1IiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIlJ1bm5pbmcsIGJhcmVmb290LCAzLjUtNS45IG1waCJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNTYwIiwgIm1ldCI6IDEyLjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBiYXJlZm9vdCwgNi4wLTcuOSBtcGgifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjU2NSIsICJtZXQiOiAxMy41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgYmFyZWZvb3QsIDguMC04LjkgbXBoIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTI1ODUiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgam9nZ2luZyBzdHJvbGxlciwgaW5kb29ycywgNSBtcGgifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjU4OCIsICJtZXQiOiA5LjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBqb2dnaW5nIHN0cm9sbGVyLCBpbmRvb3JzLCA2IG1waCJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNTkzIiwgIm1ldCI6IDEwLjAsICJkZXNjcmlwdGlvbiI6ICJSdW5uaW5nLCBqb2dnaW5nIHN0cm9sbGVyLCBvdXRkb29ycywgNSBtcGgifSwgeyJoZWFkaW5nIjogIlJ1bm5pbmciLCAiY29kZSI6ICIxMjU5NSIsICJtZXQiOiAxMS41LCAiZGVzY3JpcHRpb24iOiAiUnVubmluZywgam9nZ2luZyBzdHJvbGxlciwgb3V0ZG9vcnMsIDYgbXBoIn0sIHsiaGVhZGluZyI6ICJSdW5uaW5nIiwgImNvZGUiOiAiMTI2MDAiLCAibWV0IjogMTEuNSwgImRlc2NyaXB0aW9uIjogIlNraXBwaW5nLCA1LjUtNi4wIG1waCJ9LCB7ImhlYWRpbmciOiAiUnVubmluZyIsICJjb2RlIjogIjEyNjIwIiwgIm1ldCI6IDEzLjAsICJkZXNjcmlwdGlvbiI6ICJUcmlhdGhsb24sIFJ1bm5pbmcifSwgeyJoZWFkaW5nIjogIlNlbGYgQ2FyZSIsICJjb2RlIjogIjEzMDAwIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkdldHRpbmcgcmVhZHkgZm9yIGJlZCwgZ2VuZXJhbCwgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIlNlbGYgQ2FyZSIsICJjb2RlIjogIjEzMDA5IiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIlNpdHRpbmcgb24gdG9pbGV0LCBlbGltaW5hdGluZyB3aGlsZSBzdGFuZGluZyBvciBzcXVhdHRpbmcifSwgeyJoZWFkaW5nIjogIlNlbGYgQ2FyZSIsICJjb2RlIjogIjEzMDEwIiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIkJhdGhpbmcsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIlNlbGYgQ2FyZSIsICJjb2RlIjogIjEzMDIwIiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIkRyZXNzaW5nLCB1bmRyZXNzaW5nLCBzdGFuZGluZyBvciBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJTZWxmIENhcmUiLCAiY29kZSI6ICIxMzAzMCIsICJtZXQiOiAxLjUsICJkZXNjcmlwdGlvbiI6ICJFYXRpbmcsIHNpdHRpbmcifSwgeyJoZWFkaW5nIjogIlNlbGYgQ2FyZSIsICJjb2RlIjogIjEzMDM1IiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIlRhbGtpbmcgYW5kIGVhdGluZyBvciBlYXRpbmcgb25seSwgc3RhbmRpbmcifSwgeyJoZWFkaW5nIjogIlNlbGYgQ2FyZSIsICJjb2RlIjogIjEzMDM2IiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIlRha2luZyBtZWRpY2F0aW9uLCBzaXR0aW5nIG9yIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJTZWxmIENhcmUiLCAiY29kZSI6ICIxMzA0MCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJHcm9vbWluZywgd2FzaGluZyBoYW5kcywgc2hhdmluZywgYnJ1c2hpbmcgdGVldGgsIHB1dHRpbmcgb24gbWFrZS11cCwgc2l0dGluZyBvciBzdGFuZGluZyJ9LCB7ImhlYWRpbmciOiAiU2VsZiBDYXJlIiwgImNvZGUiOiAiMTMwNDUiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiSGFpcnN0eWxpbmcsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJTZWxmIENhcmUiLCAiY29kZSI6ICIxMzA0NiIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJIYXZpbmcgaGFpciBvciBuYWlscyBkb25lIGJ5IHNvbWVvbmUgZWxzZSwgc2l0dGluZyJ9LCB7ImhlYWRpbmciOiAiU2VsZiBDYXJlIiwgImNvZGUiOiAiMTMwNTAiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiU2hvd2VyaW5nLCB0b3dlbGluZyBvZmYsIHN0YW5kaW5nIn0sIHsiaGVhZGluZyI6ICJTZXh1YWwgQWN0aXZpdHkiLCAiY29kZSI6ICIxNDAxMCIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJBY3RpdmUsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiU2V4dWFsIEFjdGl2aXR5IiwgImNvZGUiOiAiMTQwMjAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiR2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJTZXh1YWwgQWN0aXZpdHkiLCAiY29kZSI6ICIxNDAzMCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJQYXNzaXZlLCBsaWdodCBlZmZvcnQsIGtpc3NpbmcsIGh1Z2dpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MDAwIiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIkFsYXNrYSBOYXRpdmUgR2FtZXMsIEVza2ltbyBPbHltcGljcywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUwMTAiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiQXJjaGVyeSAobm9uLWh1bnRpbmcpIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTAyMCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJCYWRtaW50b24sIGNvbXBldGl0aXZlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTAyNSIsICJtZXQiOiA5LjAsICJkZXNjcmlwdGlvbiI6ICJCYWRtaW50b24sIGNvbXBldGl0aXZlLCBtYXRjaCBwbGF5In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTAzMCIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJCYWRtaW50b24sIHNvY2lhbCBzaW5nbGVzIGFuZCBkb3VibGVzLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTA0MCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJCYXNrZXRiYWxsLCBnYW1lIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTA1MCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJCYXNrZXRiYWxsLCBub24tZ2FtZSwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUwNTUiLCAibWV0IjogNy41LCAiZGVzY3JpcHRpb24iOiAiQmFza2V0YmFsbCwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUwNjAiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiQmFza2V0YmFsbCwgb2ZmaWNpYXRpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MDYyIiwgIm1ldCI6IDUuOCwgImRlc2NyaXB0aW9uIjogIkJhc2tldGJhbGwsIG9mZmljaWF0aW5nIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTA3MCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJCYXNrZXRiYWxsLCBzaG9vdGluZyBiYXNrZXRzIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTA3MiIsICJtZXQiOiA5LjMsICJkZXNjcmlwdGlvbiI6ICJCYXNrZXRiYWxsLCBkcmlsbHMsIHByYWN0aWNlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTA4MCIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJCaWxsaWFyZHMifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MDkwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkJvd2xpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MDkyIiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkJvd2xpbmcsIGluZG9vciwgYm93bGluZyBhbGxleSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxMDAiLCAibWV0IjogMTIuMywgImRlc2NyaXB0aW9uIjogIkJveGluZywgaW4gcmluZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxMTAiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiQm94aW5nLCBwdW5jaGluZyBiYWcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MTEzIiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIkJveGluZywgcHVuY2hpbmcgYmFnLCA2MCBiL21pbiJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxMTUiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiQm94aW5nLCBwdW5jaGluZyBiYWcsIDEyMCBiL21pbiJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxMTgiLCAibWV0IjogMTAuOCwgImRlc2NyaXB0aW9uIjogIkJveGluZywgcHVuY2hpbmcgYmFnLCAxODAgYi9taW4ifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MTIwIiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIkJveGluZywgc3BhcnJpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MTI1IiwgIm1ldCI6IDkuMywgImRlc2NyaXB0aW9uIjogIkJveGluZywgc2ltdWxhdGVkIGJveGluZyByb3VuZCwgZXhlcmNpc2UifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MTMwIiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIkJyb29tYmFsbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxMzUiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiQ2hpbGRyZW4ncyBnYW1lcywgYWR1bHRzIHBsYXlpbmcgKGUuZy4sIGhvcHNjb3RjaCwgNC1zcXVhcmUsIGRvZGdlIGJhbGwsIHBsYXlncm91bmQgYXBwYXJhdHVzLCB0LWJhbGwsIHRldGhlcmJhbGwsIG1hcmJsZXMsIGphY2tzLCBhcmNhZGUgZ2FtZXMpLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MTM4IiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIkNoZWVybGVhZGluZywgZ3ltbmFzdGljIG1vdmVzLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxNDAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiQ29hY2hpbmcsIGZvb3RiYWxsLCBzb2NjZXIsIGJhc2tldGJhbGwsIGJhc2ViYWxsLCBzd2ltbWluZywgZXRjLiJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxNDIiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiQ29hY2hpbmcsIGFjdGl2ZWx5IHBsYXlpbmcgc3BvcnQgd2l0aCBwbGF5ZXJzIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTE1MCIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJDcmlja2V0LCBiYXR0aW5nLCBib3dsaW5nLCBmaWVsZGluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxNjAiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiQ3JvcXVldCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxNzAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiQ3VybGluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxODAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiRGFydHMsIHdhbGwgb3IgbGF3biJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxOTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiRHJhZyByYWNpbmcsIHB1c2hpbmcgb3IgZHJpdmluZyBhIGNhciJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUxOTIiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiQXV0byByYWNpbmcsIG9wZW4gd2hlZWwifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MTk1IiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIkZ1dHNhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyMDAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiRmVuY2luZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyMDMiLCAibWV0IjogOS44LCAiZGVzY3JpcHRpb24iOiAiRmVuY2luZywgZXBlZSwgY29tcGV0aXRpdmUifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MjA1IiwgIm1ldCI6IDEwLjUsICJkZXNjcmlwdGlvbiI6ICJGbG9vcmJhbGwifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MjEwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkZvb3RiYWxsLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyMzAiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiRm9vdGJhbGwsIHRvdWNoLCBmbGFnLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTIzMiIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJGb290YmFsbCwgdG91Y2gsIGZsYWcsIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyMzUiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiRm9vdGJhbGwgb3IgYmFzZWJhbGwsIHBsYXlpbmcgY2F0Y2gifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MjQwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkZyaXNiZWUgcGxheWluZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyNTAiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiRnJpc2JlZSwgdWx0aW1hdGUifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MjUyIiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkZyaXNiZWUgZ29sZiJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyNTUiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiR29sZiwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyNjUiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiR29sZiwgd2Fsa2luZywgY2FycnlpbmcgY2x1YnMifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MjcwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkdvbGYsIG1pbmlhdHVyZSwgZHJpdmluZyByYW5nZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyODUiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiR29sZiwgd2Fsa2luZywgcHVsbGluZyBjbHVicyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUyOTAiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiR29sZiwgdXNpbmcgcG93ZXIgY2FydCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUzMDAiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiR3ltbmFzdGljcywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUzMTAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiSGFja3kgc2FjayJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUzMjAiLCAibWV0IjogMTIuMCwgImRlc2NyaXB0aW9uIjogIkhhbmRiYWxsLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTMzMCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJIYW5kYmFsbCwgdGVhbSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUzMzUiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiSGlnaCByb3BlcyBjb3Vyc2UsIG11bHRpcGxlIGVsZW1lbnRzIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTM0MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJIYW5nIGdsaWRpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MzUwIiwgIm1ldCI6IDcuOCwgImRlc2NyaXB0aW9uIjogIkhvY2tleSwgZmllbGQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1MzYwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkhvY2tleSwgaWNlLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTM2MiIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiSG9ja2V5LCBpY2UsIGNvbXBldGl0aXZlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTM3MCIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJIb3JzZWJhY2sgcmlkaW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTM4MCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJIb3JzZSBncm9vbWluZywgbWFpbnRlbmFuY2UsIHNhZGRsaW5nIHRhc2tzIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTM5MCIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJIb3JzZWJhY2sgcmlkaW5nLCB0cm90dGluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTUzOTUiLCAibWV0IjogNy4zLCAiZGVzY3JpcHRpb24iOiAiSG9yc2ViYWNrIHJpZGluZywgY2FudGVyIG9yIGdhbGxvcCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MDAiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiSG9yc2ViYWNrIHJpZGluZywgd2Fsa2luZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MDIiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiSG9yc2ViYWNrIHJpZGluZywganVtcGluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MDMiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiSG9yc2ViYWNrIHJpZGluZywgcmVpbmluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MDYiLCAibWV0IjogMi4xLCAiZGVzY3JpcHRpb24iOiAiSG9yc2ViYWNrIHJpZGluZywgc2ltdWxhdG9yIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQwOCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJIb3JzZSBjYXJ0LCBkcml2aW5nLCBzdGFuZGluZyBvciBzaXR0aW5nIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQxMCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJIb3JzZXNob2UgcGl0Y2hpbmcsIHF1b2l0cyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MjAiLCAibWV0IjogMTIuMCwgImRlc2NyaXB0aW9uIjogIkphaSBhbGFpIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQyNSIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJNYXJ0aWFsIEFydHMsIGRpZmZlcmVudCB0eXBlcywgc2xvd2VyIHBhY2UsIG5vdmljZSBwZXJmb3JtZXJzLCBwcmFjdGljZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MzAiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIk1hcnRpYWwgQXJ0cywgZGlmZmVyZW50IHR5cGVzLCBtb2RlcmF0ZSBwYWNlIChlLmcuLCBqdWRvLCBqdWppdHN1LCBrYXJhdGUsIGtpY2sgYm94aW5nLCB0YWUga3dvbiBkbywgdGFpLWJvLCBNdWF5IFRoYWkgYm94aW5nKSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0MzIiLCAibWV0IjogMTQuMywgImRlc2NyaXB0aW9uIjogIlRhZWt3b25kbywgY29tYmF0IHNpbXVsYXRpb24ifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NDMzIiwgIm1ldCI6IDExLjMsICJkZXNjcmlwdGlvbiI6ICJKdWRvIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQ0MCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJKdWdnbGluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0NDQiLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiS2VuZG8sIGtpaG9uLWtlaWtvIHN0eWxlLCBtb2RlcmF0ZSBpbnRlbnNpdHkifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NDQ1IiwgIm1ldCI6IDkuNiwgImRlc2NyaXB0aW9uIjogIktlbmRvLCBraXJpa2Flc2hpIHN0eWxlLCBoaWdoIGludGVuc2l0eSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0NDYiLCAibWV0IjogMTEuMywgImRlc2NyaXB0aW9uIjogIktlbmRvLCBrYWthcmkga2Vpa28gc3R5bGUsIHZlcnkgaGlnaCBpbnRlbnNpdHkifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NDUwIiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIktpY2tiYWxsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQ1NSIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJLdW5nIEZ1IEd5bW5hc3RpY3MifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NDU3IiwgIm1ldCI6IDcuMywgImRlc2NyaXB0aW9uIjogIktpY2tib3hpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NDYwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkxhY3Jvc3NlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQ2NSIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJMYXduIGJvd2xpbmcsIGJvY2NlIGJhbGwsIG91dGRvb3IifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NDcwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIk1vdG9jcm9zcywgb2ZmLXJvYWQgbW90b3Igc3BvcnRzLCBhbGwtdGVycmFpbiB2ZWhpY2xlLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQ3NSIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJNb3RvcmN5Y2xlIHJhY2luZywgU3Vwb3Jtb3RvIHJhY2luZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0NzciLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiTmV0YmFsbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU0ODAiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiT3JpZW50ZWVyaW5nIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTQ5MCIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiUGFkZGxlYmFsbCwgY29tcGV0aXRpdmUifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTAwIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIlBhZGRsZWJhbGwsIGNhc3VhbCwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1MDMiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiUGFyYWdsaWRpbmcsIG1vZGVyYXRlIGFsdGl0dWRlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTUwNiIsICJtZXQiOiA2LjUsICJkZXNjcmlwdGlvbiI6ICJQcnVzaWsgY2xpbWJpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTEwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIlBvbG8sIG9uIGhvcnNlYmFjayJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1MjAiLCAibWV0IjogMTAuMCwgImRlc2NyaXB0aW9uIjogIlJhY3F1ZXRiYWxsLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1MjUiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIlJhY2UgV2Fsa2luZywgMy4xIG0vcyAoNi45IG1waCkifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTI3IiwgIm1ldCI6IDEzLjgsICJkZXNjcmlwdGlvbiI6ICJSYWNlIFdhbGtpbmcsIDMuNyBtL3MgKDguMyBtcGgpIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTUyOCIsICJtZXQiOiAxNS41LCAiZGVzY3JpcHRpb24iOiAiUmFjZSBXYWxraW5nLCByYWNpbmcgc3BlZWQsIDQuMCBtL3MgKDguOTUgbXBoKSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1MzAiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiUmFjcXVldGJhbGwsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTMzIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIlJvY2sgb3IgbW91bnRhaW4gY2xpbWJpbmcsIChmb3JtZXJseSBjb2RlIDE3MTIwKSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1MzQiLCAibWV0IjogOC44LCAiZGVzY3JpcHRpb24iOiAiUm9jayBjbGltYmluZywgZnJlZSBib3VsZGVyIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTUzNSIsICJtZXQiOiA3LjMsICJkZXNjcmlwdGlvbiI6ICJSb2NrIGNsaW1iaW5nLCBhc2NlbmRpbmcgcm9jaywgaGlnaCBkaWZmaWN1bHR5In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTUzNiIsICJtZXQiOiAxMC41LCAiZGVzY3JpcHRpb24iOiAiUm9jayBjbGltYmluZywgc3BlZWQgY2xpbWJpbmcsIHZlcnkgZGlmZmljdWx0In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTUzNyIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJSb2NrIGNsaW1iaW5nLCBhc2NlbmRpbmcgb3IgdHJhdmVyc2luZyByb2NrLCBsb3ctdG8tbW9kZXJhdGUgZGlmZmljdWx0eSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1MzgiLCAibWV0IjogMTAuNSwgImRlc2NyaXB0aW9uIjogIlJvY2sgY2xpbWJpbmcsIHRyZWFkd2FsbCwgNC02IG0vbWluIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTUzOSIsICJtZXQiOiAxMC41LCAiZGVzY3JpcHRpb24iOiAiUm9jayBjbGltYmluZywgdHJlYWR3YWxsLCA3LTEwIG0vbWluIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU0MCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJSb2NrIGNsaW1iaW5nLCByYXBwZWxsaW5nLCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1NDIiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiUm9kZW8gc3BvcnRzLCBnZW5lcmFsLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTQ0IiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIlJvZGVvIHNwb3J0cywgZ2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU0NiIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJSb2RlbyBzcG9ydHMsIGdlbmVyYWwsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1NTAiLCAibWV0IjogMTIuMywgImRlc2NyaXB0aW9uIjogIlJvcGUganVtcGluZywgZmFzdCBwYWNlLCAxMjAtMTYwIHNraXBzL21pbiJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1NTEiLCAibWV0IjogMTEuOCwgImRlc2NyaXB0aW9uIjogIlJvcGUganVtcGluZywgbW9kZXJhdGUgcGFjZSwgZ2VuZXJhbCwgMTAwIHRvIDEyMCBza2lwcy9taW4sIDIgZm9vdCBza2lwLCBwbGFpbiBib3VuY2UifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTUyIiwgIm1ldCI6IDguMywgImRlc2NyaXB0aW9uIjogIlJvcGUganVtcGluZywgc2xvdyBwYWNlLCA8IDEwMCBza2lwcy9taW4sIDIgZm9vdCBza2lwLCByaHl0aG0gYm91bmNlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU1NCIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiUm9wZSBqdW1waW5nLCBkb3VibGUgdW5kZXIgb3IgbW9yZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1NjAiLCAibWV0IjogOC4zLCAiZGVzY3JpcHRpb24iOiAiUnVnYnksIHVuaW9uLCB0ZWFtLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1NjIiLCAibWV0IjogNi4zLCAiZGVzY3JpcHRpb24iOiAiUnVnYnksIHRvdWNoLCBub24tY29tcGV0aXRpdmUifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTcwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIlNodWZmbGVib2FyZCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1ODAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiU2thdGVib2FyZGluZywgZ2VuZXJhbCwgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU4MiIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJTa2F0ZWJvYXJkaW5nLCBjb21wZXRpdGl2ZSwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU5MCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nLCByb2xsZXIifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTkxIiwgIm1ldCI6IDcuNSwgImRlc2NyaXB0aW9uIjogIlJvbGxlciBibGFkaW5nLCBpbi1saW5lIHNrYXRpbmcsIDE0LjQga20vaCAoOS4wIG1waCksIHJlY3JlYXRpb25hbCBwYWNlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU5MiIsICJtZXQiOiA5LjgsICJkZXNjcmlwdGlvbiI6ICJSb2xsZXIgYmxhZGluZywgaW4tbGluZSBza2F0aW5nLCAxNy43IGttL2ggKDExLjAgbXBoKSwgbW9kZXJhdGUgcGFjZSwgZXhlcmNpc2UgdHJhaW5pbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTkzIiwgIm1ldCI6IDEyLjMsICJkZXNjcmlwdGlvbiI6ICJSb2xsZXIgYmxhZGluZywgaW4tbGluZSBza2F0aW5nLCAyMS4wIHRvIDIxLjcga20vaCAoMTMuMCB0byAxMy42IG1waCksIGZhc3QgcGFjZSwgZXhlcmNpc2UgdHJhaW5pbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTk0IiwgIm1ldCI6IDE1LjUsICJkZXNjcmlwdGlvbiI6ICJSb2xsZXJibGFkaW5nLCBpbi1saW5lIHNrYXRpbmcsIDI0LjAga20vaCAoMTUuMCBtcGgpLCBtYXhpbWFsIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU1OTUiLCAibWV0IjogNi44LCAiZGVzY3JpcHRpb24iOiAiU2thdGVib2FyZCwgbG9uZ2JvYXJkLCAxMy4zIGttL2gsIHNsb3cgc3BlZWQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NTk2IiwgIm1ldCI6IDguMywgImRlc2NyaXB0aW9uIjogIlNrYXRlYm9hcmQsIGxvbmdib2FyZCwgMTYuMiBrbS9oLCB0eXBpY2FsIHNwZWVkIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTU5NyIsICJtZXQiOiAxMC41LCAiZGVzY3JpcHRpb24iOiAiU2thdGVib2FyZCwgbG9uZ2JvYXJkLCAxOC40IGttL2gsIGZhc3Qgc3BlZWQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NjAwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIlNreWRpdmluZywgYmFzZS1qdW1waW5nLCBidW5nZWUganVtcGluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2MDUiLCAibWV0IjogOS41LCAiZGVzY3JpcHRpb24iOiAiU29jY2VyLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2MTAiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiU29jY2VyLCBjYXN1YWwsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NjE1IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcgZm9vdGJhbGwvc29jY2VyIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTYyMCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJTb2Z0YmFsbCBvciBiYXNlYmFsbCwgZmFzdCBvciBzbG93IHBpdGNoLCBnZW5lcmFsLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NjI1IiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIlNvZnRiYWxsLCBwcmFjdGljZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2MzAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiU29mdGJhbGwsIG9mZmljaWF0aW5nIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTY0MCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJTb2Z0YmFsbCwgcGl0Y2hpbmcifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NjQ1IiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIlNwb3J0cyBzcGVjdGF0b3IsIHZlcnkgZXhjaXRlZCwgZW1vdGlvbmFsLCBwaHlzaWNhbGx5IG1vdmluZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2NTAiLCAibWV0IjogMTIuMCwgImRlc2NyaXB0aW9uIjogIlNxdWFzaCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2NTIiLCAibWV0IjogNy4zLCAiZGVzY3JpcHRpb24iOiAiU3F1YXNoLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTY2MCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJUYWJsZSB0ZW5uaXMsIHBpbmcgcG9uZyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2NzAiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiVGFpIGNoaSwgcWkgZ29uZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2NzIiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiVGFpIGNoaSwgcWkgZ29uZywgc2l0dGluZywgbGlnaHQgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTY3NCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJUYWkgY2hpIGNodWFuLCBZYW5nIHN0eWxlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTY3NSIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJUZW5uaXMsIGdlbmVyYWwsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2NzYiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiVGVubmlzLCBnZW5lcmFsLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2ODAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiVGVubmlzLCBkb3VibGVzIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTY4NSIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJUZW5uaXMsIGRvdWJsZXMifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NjkwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIlRlbm5pcywgc2luZ2xlcyJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU2OTUiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiVGVubmlzLCBoaXR0aW5nIGJhbGxzLCBub24tZ2FtZSBwbGF5LCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIlNwb3J0cyIsICJjb2RlIjogIjE1NzAwIiwgIm1ldCI6IDYuMywgImRlc2NyaXB0aW9uIjogIlRyYW1wb2xpbmUsIHJlY3JlYXRpb25hbCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU3MDIiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIlRyYW1wb2xpbmUsIGNvbXBldGl0aXZlIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTcxMCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJWb2xsZXliYWxsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTcxMSIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJWb2xsZXliYWxsLCBjb21wZXRpdGl2ZSwgaW4gZ3ltbmFzaXVtIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTcyMCIsICJtZXQiOiAzLjAsICJkZXNjcmlwdGlvbiI6ICJWb2xsZXliYWxsLCBub24tY29tcGV0aXRpdmUsIDYgLSA5IG1lbWJlciB0ZWFtLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTcyNSIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJWb2xsZXliYWxsLCBiZWFjaCwgaW4gc2FuZCJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU3MzAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiV3Jlc3RsaW5nLCBjb21wZXRpdGl2ZSAob25lIG1hdGNoID0gNSBtaW51dGVzKSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU3MzEiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiV2FsbHliYWxsLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTczMiIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJUcmFjayBhbmQgZmllbGQgKGUuZy4sIHNob3QsIGRpc2N1cywgaGFtbWVyIHRocm93KSJ9LCB7ImhlYWRpbmciOiAiU3BvcnRzIiwgImNvZGUiOiAiMTU3MzMiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiVHJhY2sgYW5kIGZpZWxkIChlLmcuLCBoaWdoIGp1bXAsIGxvbmcganVtcCwgdHJpcGxlIGp1bXAsIGphdmVsaW4sIHBvbGUgdmF1bHQpIn0sIHsiaGVhZGluZyI6ICJTcG9ydHMiLCAiY29kZSI6ICIxNTczNCIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiVHJhY2sgYW5kIGZpZWxkIChlLmcuLCBzdGVlcGxlY2hhc2UsIGh1cmRsZXMpIn0sIHsiaGVhZGluZyI6ICJUcmFuc3BvcnRhdGlvbiIsICJjb2RlIjogIjE2MDAyIiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIkJpY3ljbGluZyBmb3IgdHJhbnNwb3J0YXRpb24sIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiVHJhbnNwb3J0YXRpb24iLCAiY29kZSI6ICIxNjAwNCIsICJtZXQiOiA5LjMsICJkZXNjcmlwdGlvbiI6ICJCaWN5Y2xpbmcgZm9yIHRyYW5zcG9ydGF0aW9uLCBoaWdoIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiVHJhbnNwb3J0YXRpb24iLCAiY29kZSI6ICIxNjAwNSIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJFLWJpa2UgKGVsZWN0cmljYWxseSBhc3Npc3RlZCkgZm9yIHRyYW5zcG9ydGF0aW9uIn0sIHsiaGVhZGluZyI6ICJUcmFuc3BvcnRhdGlvbiIsICJjb2RlIjogIjE2MDEwIiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIkF1dG9tb2JpbGUgb3IgbGlnaHQgdHJ1Y2sgKG5vdCBhIHNlbWkpIGRyaXZpbmcifSwgeyJoZWFkaW5nIjogIlRyYW5zcG9ydGF0aW9uIiwgImNvZGUiOiAiMTYwMTUiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiUmlkaW5nIGluIGEgY2FyIG9yIHRydWNrIn0sIHsiaGVhZGluZyI6ICJUcmFuc3BvcnRhdGlvbiIsICJjb2RlIjogIjE2MDE2IiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIlJpZGluZyBpbiBhIGJ1cyBvciB0cmFpbiJ9LCB7ImhlYWRpbmciOiAiVHJhbnNwb3J0YXRpb24iLCAiY29kZSI6ICIxNjAyMCIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJGbHlpbmcgYWlycGxhbmUgb3IgaGVsaWNvcHRvciJ9LCB7ImhlYWRpbmciOiAiVHJhbnNwb3J0YXRpb24iLCAiY29kZSI6ICIxNjAzMCIsICJtZXQiOiAyLjgsICJkZXNjcmlwdGlvbiI6ICJNb3RvciBzY29vdGVyLCBtb3RvcmN5Y2xlIn0sIHsiaGVhZGluZyI6ICJUcmFuc3BvcnRhdGlvbiIsICJjb2RlIjogIjE2MDM1IiwgIm1ldCI6IDYuMywgImRlc2NyaXB0aW9uIjogIlB1bGxpbmcgcmlja3NoYXcifSwgeyJoZWFkaW5nIjogIlRyYW5zcG9ydGF0aW9uIiwgImNvZGUiOiAiMTYwNDAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiUHVzaGluZyBwbGFuZSBpbiBhbmQgb3V0IG9mIGhhbmdhciJ9LCB7ImhlYWRpbmciOiAiVHJhbnNwb3J0YXRpb24iLCAiY29kZSI6ICIxNjA1MCIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJUcnVjaywgc2VtaSwgdHJhY3Rvciwg4omlMSB0b24sIG9yIGJ1cywgZHJpdmluZyJ9LCB7ImhlYWRpbmciOiAiVHJhbnNwb3J0YXRpb24iLCAiY29kZSI6ICIxNjA2MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIGZvciB0cmFuc3BvcnRhdGlvbiwgMi44LTMuMiBtcGgsIGxldmVsLCBtb2RlcmF0ZSBwYWNlLCBmaXJtIHN1cmZhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzAxMCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJCYWNrcGFja2luZyJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDExIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcgd2l0aCBhIGRheSBwYWNrLCBsZXZlbCBncm91bmQsIGFzc3VtZWQgaW4gdGhlIGNpdHkifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzAxMiIsICJtZXQiOiA3LjgsICJkZXNjcmlwdGlvbiI6ICJCYWNrcGFja2luZywgaGlraW5nIHdpdGggYSBkYXlwYWNrLCBvcmdhbml6ZWQgd2Fsa2luZyB3aXRoIGRheXBhY2sifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzAxNiIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJDYXJyeWluZyA1IHRvIDE0IGxiICgyLjMgdG8gNi40IGtnKSBsb2FkIChlLmcuIHN1aXRjYXNlLCBib3hlcywgZ3JvY2VyaWVzKSwgbGV2ZWwgZ3JvdW5kLCBtb2RlcmF0ZSBwYWNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMTgiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiQ2FycnlpbmcgMTUgLSAxNTUgbGIgKDYuOCAtIDcwLjQga2cpIGxvYWQgKGUuZy4gc3VpdGNhc2UsIGJveGVzLCBmdXJuaXR1cmUpLCBsZXZlbCBncm91bmQgb3IgZG93bnN0YWlycywgc2xvdyBwYWNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMTkiLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiQ2FycnlpbmcgNTAgdG8gMTUwIHBvdW5kIGxvYWQgKGUuZy4sIGVxdWluZSBvciBib3ZpbmUgZmVlZCwgZmVuY2UgcGlwZXMsIGZ1cm5pdHVyZSksIGxldmVsIGdyb3VuZCwgbW9kZXJhdGUgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDIxIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nIH4xMCBsYiBjaGlsZCwgc2xvdyB3YWxraW5nIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMjUiLCAibWV0IjogOC4zLCAiZGVzY3JpcHRpb24iOiAiQ2FycnlpbmcgbG9hZCB1cHN0YWlycywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDI2IiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nIGxvYWQsIDEgdG8gMTUgbGIgbG9hZCwgdXBzdGFpcnMifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzAyNyIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJDYXJyeWluZyBsb2FkLCAxNiB0byAyNCBsYiBsb2FkLCB1cHN0YWlycyJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDI4IiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nIGxvYWQsIDI1IHRvIDQ5IGxiIGxvYWQsIHVwc3RhaXJzIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMjkiLCAibWV0IjogMTAuMCwgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nIGxvYWQsIDUwIHRvIDc0IGxiIGxvYWQsIHVwc3RhaXJzIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMzAiLCAibWV0IjogMTIuMCwgImRlc2NyaXB0aW9uIjogIkNhcnJ5aW5nIGxvYWQsID43NCBsYiBsb2FkLCB1cHN0YWlycyJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDMxIiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkxvYWRpbmcgYW5kL29yIHVubG9hZGluZyBhIGNhciwgaW1wbGllZCB3YWxraW5nIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMzIiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiQ2xpbWJpbmcgaGlsbHMsIG5vIGxvYWQsIDUgdG8gMjAlIGdyYWRlLCB2ZXJ5IHNsb3cgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDMzIiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkNsaW1iaW5nIGhpbGxzLCAxNS01MCBsYiBsb2FkLCAxIHRvIDIlIGdyYWRlLCBzbG93IHBhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzAzNCIsICJtZXQiOiA1LjMsICJkZXNjcmlwdGlvbiI6ICJDbGltYmluZyBoaWxscywgbm8gbG9hZCwgMSB0byA1JSBncmFkZSwgbW9kZXJhdGUtdG8tYnJpc2sgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDM1IiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIkNsaW1iaW5nIGhpbGxzLCBubyBsb2FkLCA2IHRvIDEwJSBncmFkZSwgbW9kZXJhdGUtdG8tYnJpc2sgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDM2IiwgIm1ldCI6IDguOCwgImRlc2NyaXB0aW9uIjogIkNsaW1iaW5nIGhpbGxzLCBubyBsb2FkLCAxMSB0byAyMCUgZ3JhZGUsIHNsb3ctdG8tbW9kZXJhdGUgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDM3IiwgIm1ldCI6IDEwLjAsICJkZXNjcmlwdGlvbiI6ICJDbGltYmluZyBoaWxscywgbm8gbG9hZCwgNC4wIHRvIDUuMCBtcGgsIDMgdG8gNSUgZ3JhZGUsIHZlcnkgZmFzdCBwYWNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwMzgiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiQ2xpbWJpbmcgaGlsbHMsIG5vIGxvYWQsIHN0ZWVwIGdyYWRlICgzMCUpLCBzbG93IHBhY2UgKGxlc3MgdGhhbiAxLjIgbXBoKSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDM5IiwgIm1ldCI6IDE1LjUsICJkZXNjcmlwdGlvbiI6ICJDbGltYmluZyBoaWxscywgbm8gbG9hZCwgdmVyeSBzdGVlcCBncmFkZSAoMzAtNDAlKSwgMS4yIHRvIDEuOCBtcGgifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzA0MCIsICJtZXQiOiAxNi4zLCAiZGVzY3JpcHRpb24iOiAiQ2xpbWJpbmcgaGlsbHMsIG5vIGxvYWQsIHN0ZWVwIGdyYWRlICgxMC00MCUpLCAxLjggdG8gNS4wIG1waCJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDQ1IiwgIm1ldCI6IDYuNSwgImRlc2NyaXB0aW9uIjogIkNsaW1iaW5nIGhpbGxzLCAxMCB0byAyMCBsYiBsb2FkLCA1IHRvIDEwJSBncmFkZSwgbW9kZXJhdGUifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzA1MCIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJDbGltYmluZyBoaWxscywgMjEgdG8gNDAgbGIgbG9hZCwgMyB0byAxMCUgZ3JhZGUsIG1vZGVyYXRlLXRvLWJyaXNrIHBhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzA2MCIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiQ2xpbWJpbmcgaGlsbHMsIDIwKyBwb3VuZCBsb2FkLCA1IHRvIDIwJSBncmFkZSwgbW9kZXJhdGUgdG8gYnJpc2sgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDcwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIkRlc2NlbmRpbmcgc3RhaXJzIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwNzYiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiSGF1bGluZyB3YXRlciwgaGVhZCBoYXVsaW5nLCB3YWxraW5nIG9uIGZsYXQgc3VyZmFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDgwIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIkhpa2luZywgY3Jvc3MgY291bnRyeSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MDgxIiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIkhpa2luZyBzbG93bHkgb3IgYW1ibGluZyB0aHJvdWdoIGZpZWxkcyBhbmQgaGlsbHNpZGVzLCBubyBsb2FkIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwODIiLCAibWV0IjogNS4zLCAiZGVzY3JpcHRpb24iOiAiSGlraW5nIG9yIHdhbGtpbmcgYXQgYSBub3JtYWwgcGFjZSB0aHJvdWdoIGZpZWxkcyBhbmQgaGlsbHNpZGVzLCBubyBsb2FkIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwODUiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiQmlyZCB3YXRjaGluZywgd2Fsa2luZyBhbmQgc3RvcHBpbmcifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzA4OCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJNYXJjaGluZywgbW9kZXJhdGUgc3BlZWQsIG1pbGl0YXJ5LCBubyBwYWNrIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcwOTAiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiTWFyY2hpbmcgcmFwaWRseSwgbWlsaXRhcnksIG5vIHBhY2sifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzEwMCIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJQdXNoaW5nIG9yIHB1bGxpbmcgc3Ryb2xsZXIgd2l0aCBjaGlsZCBvciB3YWxraW5nIHdpdGggY2hpbGRyZW4sIDIuNSB0byAzLjEgbXBoIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxMDUiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiUHVzaGluZyBhIHdoZWVsY2hhaXIsIG5vbi1vY2N1cGF0aW9uYWwifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzExMCIsICJtZXQiOiA2LjUsICJkZXNjcmlwdGlvbiI6ICJSYWNlIHdhbGtpbmcifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzEzMCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJTdGFpciBjbGltYmluZywgdXNpbmcgb3IgY2xpbWJpbmcgdXAgbGFkZGVyIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxMzEiLCAibWV0IjogNi44LCAiZGVzY3JpcHRpb24iOiAiU3RhaXIgY2xpbWJpbmcsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzEzMyIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJTdGFpciBjbGltYmluZywgc2xvdyBwYWNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxMzQiLCAibWV0IjogOS4zLCAiZGVzY3JpcHRpb24iOiAiU3RhaXIgY2xpbWJpbmcsIGZhc3QgcGFjZSwgb25lIHN0ZXAgYXQgYSB0aW1lIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxMzYiLCAibWV0IjogNy41LCAiZGVzY3JpcHRpb24iOiAiU3RhaXIgY2xpbWJpbmcsIHR3byBzdGVwcyBhdCBhIHRpbWUifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzEzOCIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJTdGFpciBjbGltYmluZywgYXNjZW5kaW5nIGFuZCBkZXNjZW5kaW5nIHN0YWlycyJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MTQwIiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIlVzaW5nIGNydXRjaGVzLCBsZXZlbCBncm91bmQsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzE0MiIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJVc2luZyBjcnV0Y2hlcywgZmFzdCBwYWNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxNDUiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiVXNpbmcgbWVkaWNhbCBrbmVlIHNjb290ZXIifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzE1MCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBob3VzZWhvbGQifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzE1MSIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBsZXNzIHRoYW4gMi4wIG1waCwgbGV2ZWwsIHN0cm9sbGluZywgdmVyeSBzbG93In0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxNTIiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi4wIHRvIDIuNCBtcGgsIGxldmVsLCBzbG93IHBhY2UsIGZpcm0gc3VyZmFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MTYwIiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcgZm9yIHBsZWFzdXJlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxNjEiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZyBmcm9tIGhvdXNlIHRvIGNhciBvciBidXMsIGZyb20gY2FyIG9yIGJ1cyB0byBnbyBwbGFjZXMsIGZyb20gY2FyIG9yIGJ1cyB0byBhbmQgZnJvbSB0aGUgd29ya3NpdGUifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzE2MiIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIHRvIG5laWdoYm9yJ3MgaG91c2Ugb3IgZmFtaWx5J3MgaG91c2UgZm9yIHNvY2lhbCByZWFzb25zIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxNjUiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZyB0aGUgZG9nIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxNzAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi41IG1waCwgZmlybSwgbGV2ZWwgc3VyZmFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MTgwIiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIDIuNSBtcGgsIGRvd25oaWxsIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcxOTAiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi44IHRvIDMuNCBtcGgsIGxldmVsLCBtb2RlcmF0ZSBwYWNlLCBmaXJtIHN1cmZhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzIwMCIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCAzLjUgdG8gMy45IG1waCwgbGV2ZWwsIGJyaXNrLCBmaXJtIHN1cmZhY2UsIHdhbGtpbmcgZm9yIGV4ZXJjaXNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcyMjAiLCAibWV0IjogNS41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgNC4wIHRvIDQuNCBtcGggKDYuNCB0byA3LjAga20vaCksIGxldmVsLCBmaXJtIHN1cmZhY2UsIHZlcnkgYnJpc2sgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MjMwIiwgIm1ldCI6IDcuMCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIDQuNSB0byA0LjkgbXBoLCBsZXZlbCwgZmlybSBzdXJmYWNlLCB2ZXJ5LCB2ZXJ5IGJyaXNrIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcyMzEiLCAibWV0IjogOC41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgNS4wIHRvIDUuNSBtcGggKDguOCB0byA4Ljkga20vaCksIGxldmVsLCBmaXJtIHN1cmZhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzI1MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBmb3IgcGxlYXN1cmUsIHdvcmsgYnJlYWsifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzI1NSIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBzZWxmLXNlbGVjdGVkIHNwZWVkLCBpbmRvb3IgdHJhY2sgb3Igb3V0ZG9vcnMsIGZpcm0gc3VyZmFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MjYwIiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIGdyYXNzIHRyYWNrIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcyNjIiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgbm9ybWFsIHBhY2UsIHBsb3dlZCBmaWVsZCBvciBzYW5kIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTcyNzAiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgdG8gd29yayBvciBjbGFzcyJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MjgwIiwgIm1ldCI6IDIuNSwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIHRvIGFuZCBmcm9tIGFuIG91dGhvdXNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTczMDIiLCAibWV0IjogNC4zLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgZm9yIGV4ZXJjaXNlLCAyLjUgdG8gMy41IG1waCAoNC4wIHRvIDUuNiBrbS9oKSwgd2l0aCBza2kgcG9sZXMsIE5vcmRpYyB3YWxraW5nLCBsZXZlbCwgbW9kZXJhdGUgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzA0IiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIGZvciBleGVyY2lzZSwgMy42IHRvIDQuNCBtcGggKDUuOCB0byA3LjEga20vaCksIHdpdGggc2tpIHBvbGVzLCBOb3JkaWMgd2Fsa2luZywgbGV2ZWwsIG1vZGVyYXRlIHBhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzMwNSIsICJtZXQiOiA4LjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBmb3IgZXhlcmNpc2UsIDQuNSB0byA1LjAgbXBoLCB3aXRoIHNraSBwb2xlcywgTm9yZGljIHdhbGtpbmcsIGxldmVsLCBmYXN0IHBhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzMxMCIsICJtZXQiOiA4LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBmb3IgZXhlcmNpc2UsIHdpdGggc2tpIHBvbGVzLCBOb3JkaWMgd2Fsa2luZywgdXBoaWxsLCBtb2RlcmF0ZSBwYWNlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTczMTMiLCAibWV0IjogMTAuOCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIGZvciBleGVyY2lzZSwgd2l0aCBza2kgcG9sZXMsIE5vcmRpYyB3YWxraW5nLCBsZXZlbCBncm91bmQsIGNhcnJ5aW5nIDIwIHRvIDMwIGxiIGxvYWQgKDkuMCB0byAxNS4wIGtnKSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzE1IiwgIm1ldCI6IDEyLjMsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBmb3IgZXhlcmNpc2UsIHdpdGggc2tpIHBvbGVzLCBOb3JkaWMgd2Fsa2luZywgdXBoaWxsLCBjYXJyeWluZyAyMCB0byAzMCBsYiBsb2FkICg5LjAgdG8gMTUuMCBrZykifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzMyMCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBiYWNrd2FyZCwgMy41IG1waCwgbGV2ZWwifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzMyNSIsICJtZXQiOiA3LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBiYWNrd2FyZCwgMy41IG1waCwgdXBoaWxsLCA1JSBncmFkZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzMwIiwgIm1ldCI6IDguMCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIFRlYWJhZyB3YWxrLCBNb250eSBQeXRob24gTWluaXN0cnkgb2YgU2lsbHkgV2Fsa3MifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzMzMiIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCBQdXRleSB3YWxrLCBNb250eSBQeXRob24gTWluaXN0cnkgb2YgU2lsbHkgV2Fsa3MifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzM0MCIsICJtZXQiOiAyLjEsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCB0cmVhZG1pbGwsIGxlc3MgdGhhbiAxLjAgbXBoLCAwJSBncmFkZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzQzIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIHRyZWFkbWlsbCwgMS4wIG1waCwgMCUgZ3JhZGUifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzM0NiIsICJtZXQiOiAyLjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCB0cmVhZG1pbGwsIDEuMiB0byAxLjkgbXBoLCAwJSBncmFkZSAoMS45IHRvIDMuMCBrbS9oKSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzQ5IiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIHRyZWFkbWlsbCwgMi4wIHRvIDIuNCBtcGggKDMuMiB0byAzLjkga20vaCksIDAlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTczNTIiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgdHJlYWRtaWxsLCAyLjUgdG8gMi45IG1waCAoNC4wIHRvIDQuNyBrbS9oKSwgMCUgZ3JhZGUifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzM1NSIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCB0cmVhZG1pbGwsIDMuMCB0byAzLjQgbXBoICg0LjggdG8gNS41IGttL2gpLCAwJSBncmFkZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzU4IiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIHRyZWFkbWlsbCwgMy41IHRvIDMuOSBtcGggKDUuNiB0byA2LjMga20vaCksIDAlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTczNjEiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgdHJlYWRtaWxsLCA0LjAgdG8gNC40IG1waCAoNi40IHRvIDcuMSBrbS9oKSwgMCUgZ3JhZGUifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzM2NCIsICJtZXQiOiA2LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCB0cmVhZG1pbGwsIDQuNSB0byA0LjkgbXBoICg3LjIgdG8gNy45IGttL2gpLCAwJSBncmFkZSJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3MzY3IiwgIm1ldCI6IDguMywgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIHRyZWFkbWlsbCwgNS4wIHRvIDUuNSBtcGggKDguMCB0byA4Ljkga20vaCksIDAlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTczODIiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgdHJlYWRtaWxsLCBkb3duaGlsbCAoLTMlIHRvIC0xMiUgZ3JhZGUpLCAyLjggdG8gMy4xIG1waCJ9LCB7ImhlYWRpbmciOiAiV2Fsa2luZyIsICJjb2RlIjogIjE3NDEyIiwgIm1ldCI6IDMuMywgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIHRyZWFkbWlsbCwgZG93bmhpbGwgKC01JSB0byAtMjUlIGdyYWRlKSwgMi44IG1waCwgd2l0aCBOb3JkaWMgUG9sZXMifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzQzNCIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCB0cmVhZG1pbGwsIDIuNSBtcGgsIDAlIGdyYWRlLCA1IHRvIDIwIGRlZ3JlZXMgQywgNDAgbGIgKDE4LjIga2cpIGxvYWQifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzQzOCIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCB0cmVhZG1pbGwsIDIuNSBtcGgsIDAlIGdyYWRlLCAtMTAgdG8gMCBkZWdyZWVzIEMsIDQwIGxiICgxOC4yIGtnKSBsb2FkIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTc0NTUiLCAibWV0IjogOC4zLCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgQ3VydmVkIHRyZWFkbWlsbCwgMy4wIHRvIDUuMCBtcGgsIGJyaXNrIHBhY2UifSwgeyJoZWFkaW5nIjogIldhbGtpbmciLCAiY29kZSI6ICIxNzQ3NSIsICJtZXQiOiA3LjgsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nIHRyZWFkbWlsbCwgYmFja3dhcmRzLCAyLjUgbXBoLCArMTAlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXYWxraW5nIiwgImNvZGUiOiAiMTc0OTIiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgd2l0aCBhIHdhbGtlciBvciBzdGVwLXRvIGdhaXQgb24gdHJlYWRtaWxsLCAwLjcgbXBoICgxLjEga20vaCksIDAlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgwMTAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiQm9hdGluZywgcG93ZXIsIGRyaXZpbmcifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODAxMiIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJCb2F0aW5nLCBwb3dlciwgcGFzc2VuZ2VyLCBsaWdodCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MDIwIiwgIm1ldCI6IDQuMCwgImRlc2NyaXB0aW9uIjogIkNhbm9laW5nLCBvbiBjYW1waW5nIHRyaXAifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODAyNSIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJDYW5vZWluZywgaGFydmVzdGluZyB3aWxkIHJpY2UsIGtub2NraW5nIHJpY2Ugb2ZmIHRoZSBzdGFsa3MifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODAzMCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJDYW5vZWluZywgcG9ydGFnaW5nIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgwNDAiLCAibWV0IjogMi44LCAiZGVzY3JpcHRpb24iOiAiQ2Fub2VpbmcsIHJvd2luZywgMi4wLTMuOSBtcGgsIGxpZ2h0IGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MDUwIiwgIm1ldCI6IDUuOCwgImRlc2NyaXB0aW9uIjogIkNhbm9laW5nLCByb3dpbmcsIDQuMC01LjkgbXBoLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODA2MCIsICJtZXQiOiAxMi41LCAiZGVzY3JpcHRpb24iOiAiQ2Fub2VpbmcsIHJvd2luZywga2F5YWtpbmcsIGNvbXBldGl0aW9uLCA+IDYgbXBoLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODA3MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJDYW5vZWluZywgcm93aW5nLCBmb3IgcGxlYXN1cmUsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODA4MCIsICJtZXQiOiAxMi4wLCAiZGVzY3JpcHRpb24iOiAiQ2Fub2Vpbmcgb3Igcm93aW5nLCBpbiBjb21wZXRpdGlvbiwgY3JldyBvciBzY3VsbGluZyJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MDkwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIkRpdmluZywgc3ByaW5nYm9hcmQgb3IgcGxhdGZvcm0ifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODEwMCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJLYXlha2luZywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgxMDQiLCAibWV0IjogMTMuNSwgImRlc2NyaXB0aW9uIjogIktheWFraW5nLCBjb21wZXRpdGlvbiJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MTA2IiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIktheWFraW5nLCBzbGFsb20sIGZsYXQgd2F0ZXIifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODExMCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJQYWRkbGUgYm9hdCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MTEyIiwgIm1ldCI6IDE1LjUsICJkZXNjcmlwdGlvbiI6ICJSb3dpbmcsIHNpbXVsYXRlZCBjcmV3IGluIGEgd2F0ZXIgdGFuaywgc2luZ2xlIG9hciwgMzMgc3Ryb2tlcy9taW4sIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgxMTQiLCAibWV0IjogMTUuNSwgImRlc2NyaXB0aW9uIjogIlJvd2luZywgc2luZ2xlIHNjdWxsLCBlcmdvbWV0ZXIsIGVyZ29tZXRlciBvbiBzbGlkZXMsIHJhY2luZyBzcGVlZCAoMzIrIHN0cm9rZXMvbWluLCA+MTAgbXBoKSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MTIwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIlNhaWxpbmcsIGJvYXQgYW5kIGJvYXJkIHNhaWxpbmcsIHdpbmRzdXJmaW5nLCBpY2Ugc2FpbGluZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MTMwIiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIlNhaWxpbmcsIGluIGNvbXBldGl0aW9uLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgxMzIiLCAibWV0IjogOS4zLCAiZGVzY3JpcHRpb24iOiAiU2FpbGluZywgaW4gY29tcGV0aXRpb24sIGhpZ2ggZWZmb3J0In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgxNDAiLCAibWV0IjogMy4zLCAiZGVzY3JpcHRpb24iOiAiU2FpbGluZywgU3VuZmlzaC9MYXNlci9Ib2JieSBDYXQsIEtlZWwgYm9hdHMsIG9jZWFuIHNhaWxpbmcsIHlhY2h0aW5nLCBsZWlzdXJlIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgxNDIiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiU2FpbGluZywgZGluZ3kifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODE1MCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJTa2lpbmcsIHdhdGVyIG9yIHdha2UgYm9hcmRpbmcifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODE2MCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJKZXQgc2tpaW5nLCBkcml2aW5nLCBpbiB3YXRlciJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MTgwIiwgIm1ldCI6IDE1LjgsICJkZXNjcmlwdGlvbiI6ICJTa2luZGl2aW5nLCBmYXN0In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgxOTAiLCAibWV0IjogMTEuOCwgImRlc2NyaXB0aW9uIjogIlNraW5kaXZpbmcsIG1vZGVyYXRlIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyMDAiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiU2tpbmRpdmluZywgc2N1YmEgZGl2aW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyMDIiLCAibWV0IjogNS4zLCAiZGVzY3JpcHRpb24iOiAiU2N1YmEgZGl2aW5nLCBnZW5lcmFsLCBsaWdodCBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODIwNCIsICJtZXQiOiA1LjgsICJkZXNjcmlwdGlvbiI6ICJTY3ViYSBkaXZpbmcsIGdlbmVyYWwsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjA2IiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIlNjdWJhIGRpdmluZywgcHJvZmVzc2lvbmFsIGRpdmVyIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyMDgiLCAibWV0IjogNi44LCAiZGVzY3JpcHRpb24iOiAiU2N1YmEgZGl2aW5nLCByZWNyZWF0aW9uYWwgZGl2ZXIifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODIxMCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJTbm9ya2VsaW5nIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyMjAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiU3VyZmluZywgYm9keSBvciBib2FyZCwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjIxIiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIlN1cmZib2FyZCwgcGFkZGxpbmcifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODIyMiIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJTdXJmaW5nLCBib2R5IG9yIGJvYXJkLCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjI0IiwgIm1ldCI6IDYuNSwgImRlc2NyaXB0aW9uIjogIlN0YW5kIHVwIHBhZGRsZSBib2FyZGluZywgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjI1IiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIlN0YW5kIHVwIFBhZGRsZWJvYXJkLCBzdGFuZGluZywgMTAtMTkgc3Ryb2tlcy9taW4ifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODIyNiIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJTdGFuZCB1cCBQYWRkbGVib2FyZCwgc3RhbmRpbmcsIDIwLTI5IHN0cm9rZXMvbWluIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyMjciLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiU3RhbmQgdXAgUGFkZGxlYm9hcmQsIHN0YW5kaW5nLCAzMC0zOSBzdHJva2VzL21pbiJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjI4IiwgIm1ldCI6IDkuOCwgImRlc2NyaXB0aW9uIjogIlN0YW5kIHVwIFBhZGRsZWJvYXJkLCBzdGFuZGluZywgNDAtNDkgc3Ryb2tlcy9taW4ifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODIyOSIsICJtZXQiOiAxMS4wLCAiZGVzY3JpcHRpb24iOiAiU3RhbmQgdXAgUGFkZGxlYm9hcmQsIHN0YW5kaW5nLCA1MC02OSBzdHJva2VzL21pbiJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjMwIiwgIm1ldCI6IDkuOCwgImRlc2NyaXB0aW9uIjogIlN3aW1taW5nIGxhcHMsIGZyZWVzdHlsZSwgZmFzdCwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyNDAiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiU3dpbW1pbmcgbGFwcywgZnJlZXN0eWxlLCBzbG93LCByZWNyZWF0aW9uYWwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODI1MCIsICJtZXQiOiA5LjUsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgYmFja3N0cm9rZSwgdHJhaW5pbmcgb3IgY29tcGV0aXRpb24ifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODI1NSIsICJtZXQiOiA0LjgsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgYmFja3N0cm9rZSwgcmVjcmVhdGlvbmFsIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyNjAiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIlN3aW1taW5nLCBicmVhc3RzdHJva2UsIGdlbmVyYWwsIHRyYWluaW5nIG9yIGNvbXBldGl0aW9uIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyNjUiLCAibWV0IjogNS4zLCAiZGVzY3JpcHRpb24iOiAiU3dpbW1pbmcgYnJlYXN0c3Ryb2tlLCByZWNyZWF0aW9uYWwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODI3MCIsICJtZXQiOiAxMy44LCAiZGVzY3JpcHRpb24iOiAiU3dpbW1pbmcsIGJ1dHRlcmZseSwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MjgwIiwgIm1ldCI6IDEwLjUsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgY3Jhd2wsIGZhc3Qgc3BlZWQsIH43NSB5YXJkcy9taW51dGUsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4Mjg1IiwgIm1ldCI6IDEwLjUsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgb3BlbiB3YXRlciwgNWsifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODI5MCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgY3Jhd2wsIG1lZGl1bSBzcGVlZCwgfjUwIHlhcmRzL21pbnV0ZSwgdmlnb3JvdXMgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgyOTIiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiU3dpbW1pbmcsIGNyYXdsLCBzbG93IHNwZWVkLCAzMC00NSB5YXJkcy9taW51dGUsIG1vZGVyYXRlIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4Mjk0IiwgIm1ldCI6IDE0LjUsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgY3Jhd2wsIGVsaXRlIHN3aW1tZXJzLCBjb21wZXRpdGlvbiwgPjkwIHlhcmRzL21pbnV0ZSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzAwIiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIlN3aW1taW5nLCBsYWtlLCBvY2Vhbiwgcml2ZXIifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODMxMCIsICJtZXQiOiA2LjAsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgbGVpc3VyZWx5LCBub3QgbGFwIHN3aW1taW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgzMjAiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiU3dpbW1pbmcsIHNpZGVzdHJva2UsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODMzMCIsICJtZXQiOiA4LjAsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgc3luY2hyb25pemVkIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgzNDAiLCAibWV0IjogOS44LCAiZGVzY3JpcHRpb24iOiAiU3dpbW1pbmcsIHRyZWFkaW5nIHdhdGVyLCBmYXN0LCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM1MCIsICJtZXQiOiAzLjUsICJkZXNjcmlwdGlvbiI6ICJTd2ltbWluZywgdHJlYWRpbmcgd2F0ZXIsIG1vZGVyYXRlIGVmZm9ydCwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzUyIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIlR1YmluZywgZmxvYXRpbmcgb24gYSByaXZlciwgZ2VuZXJhbCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzU1IiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIldhdGVyIGFlcm9iaWNzLCB3YXRlciBjYWxpc3RoZW5pY3MsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM1NiIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJXYXRlciBhZXJvYmljcywgcmVzaXN0YW5jZSBleGVyY2lzZXMifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM1OCIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJXYXRlciBhZXJvYmljcywgaGlnaCBpbnRlbnNpdHkifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM2MCIsICJtZXQiOiAxMC4wLCAiZGVzY3JpcHRpb24iOiAiV2F0ZXIgcG9sbyJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzY1IiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIldhdGVyIHZvbGxleWJhbGwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM2NiIsICJtZXQiOiA5LjgsICJkZXNjcmlwdGlvbiI6ICJXYXRlciBqb2dnaW5nLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM2NyIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJXYXRlciB3YWxraW5nLCBsaWdodCBlZmZvcnQsIHNsb3cgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzY4IiwgIm1ldCI6IDQuOCwgImRlc2NyaXB0aW9uIjogIldhdGVyIHdhbGtpbmcsIG1vZGVyYXRlIGVmZm9ydCwgbW9kZXJhdGUgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzY5IiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIldhdGVyIHdhbGtpbmcsIHZpZ29yb3VzIGVmZm9ydCwgYnJpc2sgcGFjZSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4MzcwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIldoaXRld2F0ZXIgcmFmdGluZywga2F5YWtpbmcsIG9yIGNhbm9laW5nIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgzNzQiLCAibWV0IjogNi41LCAiZGVzY3JpcHRpb24iOiAiV2F0ZXIgcnVubmluZywgMzAgc3RlcHMvbWluLCBzbG93In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgzNzUiLCAibWV0IjogNy41LCAiZGVzY3JpcHRpb24iOiAiV2F0ZXIgcnVubmluZywgNDAgc3RlcHMvbWluLCBtb2RlcmF0ZSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4Mzc2IiwgIm1ldCI6IDguNSwgImRlc2NyaXB0aW9uIjogIldhdGVyIHJ1bm5pbmcsIDUwIHN0ZXBzL21pbiwgZmFzdCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4Mzc3IiwgIm1ldCI6IDkuOCwgImRlc2NyaXB0aW9uIjogIldhdGVyIHJ1bm5pbmcsIDYwIHN0ZXBzL21pbiwgdmVyeSBmYXN0In0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTgzODAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiV2luZHN1cmZpbmcsIG5vdCBwdW1waW5nIGZvciBzcGVlZCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4Mzg1IiwgIm1ldCI6IDExLjAsICJkZXNjcmlwdGlvbiI6ICJXaW5kc3VyZmluZyBvciBraXRlc3VyZmluZywgY3Jvc3NpbmcgdHJpYWwifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODM5MCIsICJtZXQiOiAxNC4wLCAiZGVzY3JpcHRpb24iOiAiV2luZHN1cmZpbmcsIGNvbXBldGl0aW9uLCBwdW1waW5nIGZvciBzcGVlZCJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4NDA0IiwgIm1ldCI6IDIuOCwgImRlc2NyaXB0aW9uIjogIkFxdWF0aWMgY3ljbGluZywgMjUgVywgNDAtNTAgUlBNIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTg0MDgiLCAibWV0IjogNC44LCAiZGVzY3JpcHRpb24iOiAiQXF1YXRpYyBjeWNsaW5nLCAyNSBXLCA2MC03MCBSUE0ifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODQxMiIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJBcXVhdGljIGN5Y2xpbmcsIDUwIFcsIDQwLTUwIFJQTSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4NDE2IiwgIm1ldCI6IDYuMCwgImRlc2NyaXB0aW9uIjogIkFxdWF0aWMgY3ljbGluZywgNTAgVywgNjAtNzAgUlBNIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTg0MjAiLCAibWV0IjogNS4wLCAiZGVzY3JpcHRpb24iOiAiQXF1YXRpYyBjeWNsaW5nLCA3NSBXLCA0MC01MCBSUE0ifSwgeyJoZWFkaW5nIjogIldhdGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxODQyNCIsICJtZXQiOiA2LjMsICJkZXNjcmlwdGlvbiI6ICJBcXVhdGljIGN5Y2xpbmcsIDc1IFcsIDYwLTcwIFJQTSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4NDI4IiwgIm1ldCI6IDYuMywgImRlc2NyaXB0aW9uIjogIkFxdWF0aWMgY3ljbGluZywgMTAwIFcsIDQwLTUwIFJQTSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4NDMyIiwgIm1ldCI6IDcuNSwgImRlc2NyaXB0aW9uIjogIkFxdWF0aWMgY3ljbGluZywgMTAwIFcsIDYwLTcwIFJQTSJ9LCB7ImhlYWRpbmciOiAiV2F0ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE4NDM2IiwgIm1ldCI6IDguNSwgImRlc2NyaXB0aW9uIjogIkFxdWF0aWMgY3ljbGluZywgODAtODkgUlBNIn0sIHsiaGVhZGluZyI6ICJXYXRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTg0NDAiLCAibWV0IjogMTAuMywgImRlc2NyaXB0aW9uIjogIkFxdWF0aWMgY3ljbGluZywgOTArIFJQTSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTAwNSIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJEb2cgc2xlZGRpbmcsIG11c2hpbmcifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwMDYiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiRG9nIHNsZWRkaW5nLCBwYXNzZW5nZXIifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwMTAiLCAibWV0IjogNi4wLCAiZGVzY3JpcHRpb24iOiAiTW92aW5nIGljZWhvdXNlLCBzZXQgdXAvZHJpbGwgaG9sZXMifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwMTEiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiSWNlIGZpc2hpbmcifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwMTgiLCAibWV0IjogMTQuMCwgImRlc2NyaXB0aW9uIjogIlNrYXRpbmcsIGljZSBkYW5jaW5nIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDIwIiwgIm1ldCI6IDUuNSwgImRlc2NyaXB0aW9uIjogIlNrYXRpbmcsIGljZSwgOSBtcGggb3IgbGVzcyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTAzMCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nLCBpY2UsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwNDAiLCAibWV0IjogOS4wLCAiZGVzY3JpcHRpb24iOiAiU2thdGluZywgaWNlLCByYXBpZGx5LCBtb3JlIHRoYW4gOSBtcGggYnV0IG5vdCBjb21wZXRpdGl2ZSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTA0NSIsICJtZXQiOiA5LjAsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nIFRyZWFkbWlsbCwgNiAtIDYuOSBtcGgsIDIlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDQ2IiwgIm1ldCI6IDEwLjAsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nIFRyZWFkbWlsbCwgNyAtIDcuOSBtcGgsIDIlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDQ3IiwgIm1ldCI6IDEwLjUsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nIFRyZWFkbWlsbCwgOCAtIDguOSBtcGgsIDIlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDQ4IiwgIm1ldCI6IDExLjAsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nIFRyZWFkbWlsbCwgOSAtIDkuOSBtcGgsIDIlIGdyYWRlIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDUwIiwgIm1ldCI6IDEzLjgsICJkZXNjcmlwdGlvbiI6ICJTa2F0aW5nLCBzcGVlZCwgY29tcGV0aXRpdmUifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwNjAiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiU2tpIGp1bXBpbmcsIGNsaW1iIHVwIGNhcnJ5aW5nIHNraXMifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkwNzUiLCAibWV0IjogNy4wLCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCBnZW5lcmFsIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDgwIiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIlNraWluZywgY3Jvc3MgY291bnRyeSwgMi41IG1waCwgc2xvdyBvciBsaWdodCBlZmZvcnQsIHNraSB3YWxraW5nIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MDkwIiwgIm1ldCI6IDguNSwgImRlc2NyaXB0aW9uIjogIlNraWluZywgY3Jvc3MgY291bnRyeSwgNC4wLTQuOSBtcGgsIG1vZGVyYXRlIHNwZWVkIGFuZCBlZmZvcnQsIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkxMDAiLCAibWV0IjogMTEuMywgImRlc2NyaXB0aW9uIjogIlNraWluZywgY3Jvc3MgY291bnRyeSwgNS4wLTcuOSBtcGgsIGJyaXNrIHNwZWVkLCB2aWdvcm91cyBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkxMTAiLCAibWV0IjogMTQuMCwgImRlc2NyaXB0aW9uIjogIlNraWluZywgY3Jvc3MgY291bnRyeSwgZWxpdGUgc2tpZXIsID44LjAtMTEuOSBtcGgsIHJhY2luZyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTExMiIsICJtZXQiOiAxNi4wLCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCBjcm9zcyBjb3VudHJ5LCAxMi0xNiBtcGgsIGVsaXRlIHNraWVyLCByYWNpbmcifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkxMTUiLCAibWV0IjogOS41LCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCBjcm9zcy1jb3VudHJ5IHNraWluZyBoaWdoLWludGVuc2l0eSB0cmFpbmluZyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTEzMCIsICJtZXQiOiAxNS41LCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCBjcm9zcyBjb3VudHJ5LCBoYXJkIHNub3csIHVwaGlsbCwgbWF4aW11bSwgc25vdyBtb3VudGFpbmVlcmluZyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTEzNSIsICJtZXQiOiAxMy4zLCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCBjcm9zcy1jb3VudHJ5LCBza2F0aW5nIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MTQwIiwgIm1ldCI6IDEzLjUsICJkZXNjcmlwdGlvbiI6ICJTa2lpbmcsIGNyb3NzLWNvdW50cnksIGJpYXRobG9uLCBza2F0aW5nIHRlY2huaXF1ZSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTE0MiIsICJtZXQiOiAxMi44LCAiZGVzY3JpcHRpb24iOiAiQmlhdGhsb24gdHJhaW5pbmcsIDUgZGVncmVlIGluY2xpbmUsIDgga20vaCAoNSBtcGgpLCB3aXRoL3dpdGhvdXQgcmlmbGUifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkxNDQiLCAibWV0IjogMTIuOCwgImRlc2NyaXB0aW9uIjogIkJpYXRobG9uIHRyYWluaW5nLCA1IGRlZ3JlZSBpbmNsaW5lLCAxMC43IGttL2ggKDUgbXBoKSwgd2l0aC93aXRob3V0IHJpZmxlIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MTQ2IiwgIm1ldCI6IDkuMywgImRlc2NyaXB0aW9uIjogIlNraWluZywgc2xhbG9tIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MTUwIiwgIm1ldCI6IDQuMywgImRlc2NyaXB0aW9uIjogIlNraWluZywgZG93bmhpbGwsIGFscGluZSBvciBzbm93Ym9hcmRpbmcsIGxpZ2h0IGVmZm9ydCwgYWN0aXZlIHRpbWUgb25seSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTE2MCIsICJtZXQiOiA2LjMsICJkZXNjcmlwdGlvbiI6ICJTa2lpbmcsIGRvd25oaWxsLCBhbHBpbmUgb3Igc25vd2JvYXJkaW5nLCBtb2RlcmF0ZSBlZmZvcnQsIGdlbmVyYWwsIGFjdGl2ZSB0aW1lIG9ubHkifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkxNzAiLCAibWV0IjogOC4wLCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCBkb3duaGlsbCwgYWxwaW5lIG9yIHNub3dib2FyZGluZywgdmlnb3JvdXMgZWZmb3J0LCBhY3RpdmUgdGltZSBvbmx5In0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MTc0IiwgIm1ldCI6IDcuMywgImRlc2NyaXB0aW9uIjogIlNraWluZywgQWxwaW5lIHNraWluZyBoaWdoLWludGVuc2l0eSB0cmFpbmluZyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTE4MCIsICJtZXQiOiA3LjAsICJkZXNjcmlwdGlvbiI6ICJTbGVkZGluZywgdG9ib2dnYW5pbmcsIGJvYnNsZWRkaW5nLCBsdWdlIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MTkwIiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIlNub3cgc2hvZWluZywgbW9kZXJhdGUgZWZmb3J0In0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MTkyIiwgIm1ldCI6IDEwLjAsICJkZXNjcmlwdGlvbiI6ICJTbm93IHNob2VpbmcsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTIwMCIsICJtZXQiOiAzLjgsICJkZXNjcmlwdGlvbiI6ICJTbm93bW9iaWxpbmcsIGRyaXZpbmcsIG1vZGVyYXRlIHBhY2UsIGZsYXQgbGFuZCJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTIwMSIsICJtZXQiOiA3LjUsICJkZXNjcmlwdGlvbiI6ICJTbm93Ym9hcmRpbmcsIHJlY3JlYXRpb25hbCwgbW9kZXJhdGUgcGFjZSwgbW91bnRhaW4ifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkyMDIiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiU25vd21vYmlsaW5nLCBwYXNzZW5nZXIsIGxpZ2h0In0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MjUyIiwgIm1ldCI6IDUuMywgImRlc2NyaXB0aW9uIjogIlNub3cgc2hvdmVsaW5nLCBieSBoYW5kLCBtb2RlcmF0ZSBlZmZvcnQifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkyNTQiLCAibWV0IjogNy41LCAiZGVzY3JpcHRpb24iOiAiU25vdyBzaG92ZWxpbmcsIGJ5IGhhbmQsIHZpZ29yb3VzIGVmZm9ydCJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTI2MCIsICJtZXQiOiAyLjUsICJkZXNjcmlwdGlvbiI6ICJTbm93IGJsb3dlciwgd2Fsa2luZyBhbmQgcHVzaGluZyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTMwMCIsICJtZXQiOiAxMi41LCAiZGVzY3JpcHRpb24iOiAiU2tpaW5nLCByb2xsZXIsIGVsaXRlIHJhY2VycyJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTMwNSIsICJtZXQiOiA1LjUsICJkZXNjcmlwdGlvbiI6ICJSb2xsZXJza2lpbmcsIDEwIC0gMTIuOSBrbS9oLCBubyBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MzEwIiwgIm1ldCI6IDYuOCwgImRlc2NyaXB0aW9uIjogIlJvbGxlcnNraWluZywgMTMgLSAxNi45IGttL2gsIG5vIGluY2xpbmUifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkzMTUiLCAibWV0IjogOC4zLCAiZGVzY3JpcHRpb24iOiAiUm9sbGVyc2tpaW5nLCAxNyAtIDE5Ljkga20vaCwgbm8gaW5jbGluZSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTMyMCIsICJtZXQiOiAxMC41LCAiZGVzY3JpcHRpb24iOiAiUm9sbGVyc2tpaW5nLCAyMCAtIDIzLjkga20vaCwgbm8gaW5jbGluZSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTMyNSIsICJtZXQiOiAxNS4wLCAiZGVzY3JpcHRpb24iOiAiUm9sbGVyc2tpaW5nLCAyNCAtIDI3Ljkga20vaCwgbm8gaW5jbGluZSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTMzMCIsICJtZXQiOiAxMi41LCAiZGVzY3JpcHRpb24iOiAiUm9sbGVyc2tpaW5nLCAxMC0xNSBrbS9oLCAyLTUgZGVncmVlIGluY2xpbmUifSwgeyJoZWFkaW5nIjogIldpbnRlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMTkzMzUiLCAibWV0IjogMTQuMywgImRlc2NyaXB0aW9uIjogIlJvbGxlcnNraWluZywgMTYtMjIga20vaCwgMi01IGRlZ3JlZSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MzQwIiwgIm1ldCI6IDEyLjMsICJkZXNjcmlwdGlvbiI6ICJSb2xsZXJza2lpbmcsIDYtOSBrbS9oLCA2LTEwIGRlZ3JlZSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5MzQ1IiwgIm1ldCI6IDE2LjAsICJkZXNjcmlwdGlvbiI6ICJSb2xsZXJza2lpbmcsID4xMCBrbS9oLCA2LTEwIGRlZ3JlZSBpbmNsaW5lIn0sIHsiaGVhZGluZyI6ICJXaW50ZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjE5NDAwIiwgIm1ldCI6IDkuMCwgImRlc2NyaXB0aW9uIjogIk1vdW50YWluZWVyaW5nLCBkb3duaGlsbCBjbGltYmluZywgd2Fsa2luZyBkb3duIHdpdGggcm9wZSJ9LCB7ImhlYWRpbmciOiAiV2ludGVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIxOTQwNSIsICJtZXQiOiAxMC4zLCAiZGVzY3JpcHRpb24iOiAiTW91bnRhaW5lZXJpbmcsIGRvd25oaWxsIGNsaW1iaW5nL2Nyb3NzLWNvdW50cnkgc2tpaW5nIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDAwIiwgIm1ldCI6IDEuMCwgImRlc2NyaXB0aW9uIjogIlNpdHRpbmcgaW4gY2h1cmNoLCBpbiBzZXJ2aWNlLCBhdHRlbmRpbmcgYSBjZXJlbW9ueSwgc2l0dGluZyBxdWlldGx5In0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDAxIiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIlNpdHRpbmcsIHBsYXlpbmcgYW4gaW5zdHJ1bWVudCBhdCBjaHVyY2gifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwMDUiLCAibWV0IjogMS44LCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZyBpbiBjaHVyY2gsIHRhbGtpbmcgb3Igc2luZ2luZywgYXR0ZW5kaW5nIGEgY2VyZW1vbnksIHNpdHRpbmcsIGFjdGl2ZSBwYXJ0aWNpcGF0aW9uIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDEwIiwgIm1ldCI6IDEuNSwgImRlc2NyaXB0aW9uIjogIlNpdHRpbmcsIHJlYWRpbmcgcmVsaWdpb3VzIG1hdGVyaWFscyBhdCBob21lIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDE1IiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nIHF1aWV0bHkgaW4gY2h1cmNoLCBhdHRlbmRpbmcgYSBjZXJlbW9ueSJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDAyMCIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgc2luZ2luZyBpbiBjaHVyY2gsIGF0dGVuZGluZyBhIGNlcmVtb255LCBzdGFuZGluZywgYWN0aXZlIHBhcnRpY2lwYXRpb24ifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwMjUiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiS25lZWxpbmcgaW4gY2h1cmNoIG9yIGF0IGhvbWUsIHByYXlpbmcifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwMzAiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcsIHRhbGtpbmcgaW4gY2h1cmNoIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDM1IiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcgaW4gY2h1cmNoIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDM2IiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIGxlc3MgdGhhbiAyLjAgbXBoLCB2ZXJ5IHNsb3cifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwMzciLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi44IHRvIDMuNCBtcGgsIG1vZGVyYXRlIHNwZWVkLCBub3QgY2FycnlpbmcgYW55dGhpbmcifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwMzgiLCAibWV0IjogNC44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMy41IHRvIDMuOSBtcGgsIGJyaXNrIHNwZWVkLCBub3QgY2FycnlpbmcgYW55dGhpbmcifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwMzkiLCAibWV0IjogMi4wLCAiZGVzY3JpcHRpb24iOiAiV2Fsay9zdGFuZCBjb21iaW5hdGlvbiBmb3IgcmVsaWdpb3VzIHB1cnBvc2VzLCB1c2hlciJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDA0MCIsICJtZXQiOiA1LjAsICJkZXNjcmlwdGlvbiI6ICJQcmFpc2Ugd2l0aCBkYW5jZSBvciBydW4sIHNwaXJpdHVhbCBkYW5jaW5nIGluIGNodXJjaCJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDA0NSIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJTZXJ2aW5nIGZvb2QgYXQgY2h1cmNoIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDQ2IiwgIm1ldCI6IDIuMCwgImRlc2NyaXB0aW9uIjogIlByZXBhcmluZyBmb29kIGF0IGNodXJjaCJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDA0NyIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJXYXNoaW5nIGRpc2hlcywgY2xlYW5pbmcga2l0Y2hlbiBhdCBjaHVyY2gifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwNTAiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiRWF0aW5nIGF0IGNodXJjaCJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDA1NSIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJFYXRpbmcvdGFsa2luZyBhdCBjaHVyY2ggb3Igc3RhbmRpbmcgZWF0aW5nLCBBbWVyaWNhbiBJbmRpYW4gRmVhc3QgZGF5cyJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDA2MCIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJDbGVhbmluZyBjaHVyY2gifSwgeyJoZWFkaW5nIjogIlJlbGlnaW91cyBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjAwNjEiLCAibWV0IjogNC4wLCAiZGVzY3JpcHRpb24iOiAiR2VuZXJhbCB5YXJkIHdvcmsgYXQgY2h1cmNoIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDY1IiwgIm1ldCI6IDMuOCwgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nLCBtb2RlcmF0ZSBlZmZvcnQgKGUuZy4sIGxpZnRpbmcgaGVhdnkgb2JqZWN0cywgYXNzZW1ibGluZyBhdCBmYXN0IHJhdGUpIn0sIHsiaGVhZGluZyI6ICJSZWxpZ2lvdXMgQWN0aXZpdGllcyIsICJjb2RlIjogIjIwMDk1IiwgIm1ldCI6IDQuNSwgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nLCBtb2RlcmF0ZS10by1oZWF2eSBlZmZvcnQsIG1hbnVhbCBsYWJvciwgbGlmdGluZyDiiaUgNTAgbGJzLCBoZWF2eSBtYWludGVuYW5jZSJ9LCB7ImhlYWRpbmciOiAiUmVsaWdpb3VzIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMDEwMCIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJUeXBpbmcsIGVsZWN0cmljLCBtYW51YWwsIG9yIGNvbXB1dGVyIn0sIHsiaGVhZGluZyI6ICJWb2x1bnRlZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjIxMDAwIiwgIm1ldCI6IDEuMywgImRlc2NyaXB0aW9uIjogIlNpdHRpbmcsIG1lZXRpbmcsIGdlbmVyYWwsIGFuZC9vciB3aXRoIHRhbGtpbmcgaW52b2x2ZWQifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwMDUiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZywgbGlnaHQgb2ZmaWNlIHdvcmssIGluIGdlbmVyYWwifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwMTAiLCAibWV0IjogMi41LCAiZGVzY3JpcHRpb24iOiAiU2l0dGluZywgbW9kZXJhdGUgd29yayJ9LCB7ImhlYWRpbmciOiAiVm9sdW50ZWVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMTAxNSIsICJtZXQiOiAxLjgsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgbGlnaHQgd29yayAoZmlsaW5nLCB0YWxraW5nLCBhc3NlbWJsaW5nKSJ9LCB7ImhlYWRpbmciOiAiVm9sdW50ZWVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMTAxNiIsICJtZXQiOiAyLjAsICJkZXNjcmlwdGlvbiI6ICJTaXR0aW5nLCBjaGlsZCBjYXJlLCBvbmx5IGFjdGl2ZSBwZXJpb2RzIn0sIHsiaGVhZGluZyI6ICJWb2x1bnRlZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjIxMDE3IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIlN0YW5kaW5nLCBjaGlsZCBjYXJlLCBvbmx5IGFjdGl2ZSBwZXJpb2RzIn0sIHsiaGVhZGluZyI6ICJWb2x1bnRlZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjIxMDE4IiwgIm1ldCI6IDMuNSwgImRlc2NyaXB0aW9uIjogIldhbGsvcnVuIHBsYXkgd2l0aCBjaGlsZHJlbiwgbW9kZXJhdGUsIG9ubHkgYWN0aXZlIHBlcmlvZHMifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwMTkiLCAibWV0IjogNS44LCAiZGVzY3JpcHRpb24iOiAiV2Fsay9ydW4gcGxheSB3aXRoIGNoaWxkcmVuLCB2aWdvcm91cywgb25seSBhY3RpdmUgcGVyaW9kcyJ9LCB7ImhlYWRpbmciOiAiVm9sdW50ZWVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMTAyMCIsICJtZXQiOiAzLjMsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgbGlnaHQvbW9kZXJhdGUgd29yayAoZS5nLiwgcGFjayBib3hlcywgYXNzZW1ibGUvcmVwYWlyLCBzZXQgdXAgY2hhaXJzL2Z1cm5pdHVyZSkifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwMjUiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiU3RhbmRpbmcsIG1vZGVyYXRlIChlLmcuLCBsaWZ0aW5nIDUwIGxicy4sIGFzc2VtYmxpbmcgYXQgZmFzdCByYXRlKSJ9LCB7ImhlYWRpbmciOiAiVm9sdW50ZWVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMTAzMCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJTdGFuZGluZywgbW9kZXJhdGUvaGVhdnkgd29yayJ9LCB7ImhlYWRpbmciOiAiVm9sdW50ZWVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMTAzNSIsICJtZXQiOiAxLjMsICJkZXNjcmlwdGlvbiI6ICJUeXBpbmcsIGVsZWN0cmljLCBtYW51YWwsIG9yIGNvbXB1dGVyIn0sIHsiaGVhZGluZyI6ICJWb2x1bnRlZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjIxMDQwIiwgIm1ldCI6IDIuMywgImRlc2NyaXB0aW9uIjogIldhbGtpbmcsIGxlc3MgdGhhbiAyLjAgbXBoLCB2ZXJ5IHNsb3cifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwNDUiLCAibWV0IjogMy44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi44IHRvIDMuNCBtcGgsIG1vZGVyYXRlIHNwZWVkLCBub3QgY2FycnlpbmcgYW55dGhpbmcifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwNTAiLCAibWV0IjogNC44LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMy41IHRvIDMuOSBtcGgsIGJyaXNrIHNwZWVkLCBub3QgY2FycnlpbmcgYW55dGhpbmcifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwNTUiLCAibWV0IjogMy41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMi41IG1waCBzbG93bHkgYW5kIGNhcnJ5aW5nIG9iamVjdHMgbGVzcyB0aGFuIDI1IHBvdW5kcyJ9LCB7ImhlYWRpbmciOiAiVm9sdW50ZWVyIEFjdGl2aXRpZXMiLCAiY29kZSI6ICIyMTA2MCIsICJtZXQiOiA0LjUsICJkZXNjcmlwdGlvbiI6ICJXYWxraW5nLCAzLjAgbXBoIG1vZGVyYXRlbHkgYW5kIGNhcnJ5aW5nIG9iamVjdHMgbGVzcyB0aGFuIDI1IHBvdW5kcywgcHVzaGluZyBzb21ldGhpbmcifSwgeyJoZWFkaW5nIjogIlZvbHVudGVlciBBY3Rpdml0aWVzIiwgImNvZGUiOiAiMjEwNjUiLCAibWV0IjogNC41LCAiZGVzY3JpcHRpb24iOiAiV2Fsa2luZywgMy41IG1waCwgYnJpc2tseSBhbmQgY2Fycnlpbmcgb2JqZWN0cyBsZXNzIHRoYW4gMjUgcG91bmRzIn0sIHsiaGVhZGluZyI6ICJWb2x1bnRlZXIgQWN0aXZpdGllcyIsICJjb2RlIjogIjIxMDcwIiwgIm1ldCI6IDMuMCwgImRlc2NyaXB0aW9uIjogIldhbGsvc3RhbmQgY29tYmluYXRpb24sIGZvciB2b2x1bnRlZXIgcHVycG9zZXMifSwgeyJoZWFkaW5nIjogIlZpZGVvIEdhbWVzIiwgImNvZGUiOiAiMjIwNDAiLCAibWV0IjogMS4zLCAiZGVzY3JpcHRpb24iOiAiU2VhdGVkLCB2aWRlbyBnYW1lLCBoYW5kaGVsZCBjb250cm9sbGVyIChpbmFjdGl2ZSkifSwgeyJoZWFkaW5nIjogIlZpZGVvIEdhbWVzIiwgImNvZGUiOiAiMjIxMjAiLCAibWV0IjogMS41LCAiZGVzY3JpcHRpb24iOiAiVmlkZW8gZ2FtZSwgaGFuZGhlbGQgY29udHJvbGxlciAobGlnaHQgZWZmb3J0KSJ9LCB7ImhlYWRpbmciOiAiVmlkZW8gR2FtZXMiLCAiY29kZSI6ICIyMjE2MCIsICJtZXQiOiAyLjMsICJkZXNjcmlwdGlvbiI6ICJWaWRlbyBnYW1lLCBsaWdodCBlZmZvcnQgKFdpaSBGaXQsIHlvZ2EsIGJvd2xpbmcsIGV0YykifSwgeyJoZWFkaW5nIjogIlZpZGVvIEdhbWVzIiwgImNvZGUiOiAiMjIyMDAiLCAibWV0IjogMy4wLCAiZGVzY3JpcHRpb24iOiAiQWN0aXZlIHZpZGVvIGdhbWUsIG1vdGlvbiBzZW5zaW5nIGdhbWUvdXNpbmcgdXBwZXIgYm9keSAobGlnaHQgdG8gbW9kZXJhdGUgZWZmb3J0KSJ9LCB7ImhlYWRpbmciOiAiVmlkZW8gR2FtZXMiLCAiY29kZSI6ICIyMjI0MCIsICJtZXQiOiA0LjAsICJkZXNjcmlwdGlvbiI6ICJBY3RpdmUgdmlkZW8gZ2FtZSwgbW90aW9uIHNlbnNpbmcgZ2FtZS91c2luZyB0b3RhbCBib2R5IChtb2RlcmF0ZSBlZmZvcnQpIn0sIHsiaGVhZGluZyI6ICJWaWRlbyBHYW1lcyIsICJjb2RlIjogIjIyMjgwIiwgIm1ldCI6IDUuMCwgImRlc2NyaXB0aW9uIjogIkFjdGl2ZSB2aWRlbyBnYW1lLCBtb3Rpb24gc2Vuc2luZyBnYW1lL3VzaW5nIHRvdGFsIGJvZHkgKG1vZGVyYXRlLXRvLXZpZ29yb3VzIGVmZm9ydCkifSwgeyJoZWFkaW5nIjogIlZpZGVvIEdhbWVzIiwgImNvZGUiOiAiMjIzMjAiLCAibWV0IjogNy41LCAiZGVzY3JpcHRpb24iOiAiQWN0aXZlIHZpZGVvIGdhbWUsIG1vdGlvbiBzZW5zaW5nIGdhbWUvdXNpbmcgdG90YWwgYm9keSwgZXhlcmdhbWVzLCB3b3Jrb3V0cywgZGFuY2luZyAodmlnb3JvdXMgZWZmb3J0KSJ9LCB7ImhlYWRpbmciOiAiVmlkZW8gR2FtZXMiLCAiY29kZSI6ICIyMjM2MCIsICJtZXQiOiA5LjgsICJkZXNjcmlwdGlvbiI6ICJDb25kaXRpb25pbmcvZXhlcmNpc2UgdmlydHVhbCByZWFsaXR5IGZpdG5lc3MsIHZpZ29yb3VzIGludGVuc2l0eSJ9XQ==`;

  const decodeEmbeddedCompendium = () => {
    try {
      return JSON.parse(atob(embeddedCompendiumDataB64));
    } catch (error) {
      console.warn("Unable to decode embedded Compendium data:", error);
      return [];
    }
  };

  const normaliseCatalog = (list) =>
    Array.isArray(list)
      ? list.filter(
          (entry) =>
            entry &&
            typeof entry.description === "string" &&
            typeof entry.code === "string" &&
            Number.isFinite(entry.met)
        )
      : [];

  let activityCatalog = normaliseCatalog(window.ACTIVITY_COMPENDIUM);

  if (!activityCatalog.length) {
    const embeddedCatalog = normaliseCatalog(decodeEmbeddedCompendium());
    if (embeddedCatalog.length) {
      activityCatalog = embeddedCatalog;
      console.info(
        "Loaded embedded Compendium dataset (window.ACTIVITY_COMPENDIUM not found)."
      );
    }
  }

  if (!activityCatalog.length) {
    activityCatalog = fallbackCatalog;
    console.warn("Falling back to demo activity list; Compendium data unavailable.");
  }

  const activityValueLookup = new Map();
  const activityCodeLookup = new Map();

  const buildActivityValue = (entry) => `${entry.description} [${entry.code}]`;

  activityCatalog.forEach((entry) => {
    const canonical = buildActivityValue(entry);
    activityValueLookup.set(canonical, entry);
    activityCodeLookup.set(entry.code, entry);
  });

  const SUGGESTION_LIMIT = 60;
  let currentSuggestions = [];
  let highlightedSuggestionIndex = -1;
  let suggestionListVisible = false;

  const showActivityResults = () => {
    if (!activityResultsContainer || suggestionListVisible) return;
    activityResultsContainer.dataset.visible = "true";
    if (activityInput) {
      activityInput.setAttribute("aria-expanded", "true");
    }
    suggestionListVisible = true;
  };

  const hideActivityResults = () => {
    if (!activityResultsContainer) return;
    activityResultsContainer.dataset.visible = "false";
    if (activityInput) {
      activityInput.setAttribute("aria-expanded", "false");
    }
    highlightedSuggestionIndex = -1;
    suggestionListVisible = false;
  };

  const filterActivities = (query) => {
    const trimmed = (query || "").trim().toLowerCase();
    if (!trimmed) {
      return activityCatalog.slice(0, SUGGESTION_LIMIT);
    }
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return activityCatalog.slice(0, SUGGESTION_LIMIT);
    }
    const matches = [];
    for (const entry of activityCatalog) {
      const haystack = `${entry.heading || ""} ${entry.description || ""}`.toLowerCase();
      const isMatch = tokens.every((token) => haystack.includes(token));
      if (!isMatch) continue;
      matches.push(entry);
      if (matches.length >= SUGGESTION_LIMIT) break;
    }
    return matches;
  };

  const commitActivitySelection = (entry) => {
    if (!entry || !activityInput) return;
    const canonical = buildActivityValue(entry);
    activityInput.value = canonical;
    hideActivityResults();
    handleFormChange();
  };

  const renderActivitySuggestions = (query = "") => {
    if (!activityResultsContainer) return;
    const matches = filterActivities(query);
    currentSuggestions = matches;
    highlightedSuggestionIndex = -1;
    activityResultsContainer.innerHTML = "";

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "activity-result activity-result--empty";
      empty.textContent = query.trim()
        ? "No matches. Try another keyword (e.g., tennis, yoga, mowing)."
        : "Start typing to browse over 1,100 activities.";
      activityResultsContainer.appendChild(empty);
      return;
    }

    matches.forEach((entry, index) => {
      const option = document.createElement("div");
      option.className = "activity-result";
      option.setAttribute("role", "option");
      option.dataset.index = index.toString();

      const title = document.createElement("strong");
      title.textContent = entry.description;
      const meta = document.createElement("span");
      const headingText = entry.heading || "Activity";
      meta.textContent = `${headingText} • ${entry.met.toFixed(1)} METs`;

      option.appendChild(title);
      option.appendChild(meta);

      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        commitActivitySelection(entry);
      });

      activityResultsContainer.appendChild(option);
    });
  };

  const highlightSuggestion = (index) => {
    if (!activityResultsContainer) return;
    const options = activityResultsContainer.querySelectorAll(".activity-result[role='option']");
    options.forEach((option) => {
      option.classList.remove("activity-result--highlighted");
      option.setAttribute("aria-selected", "false");
    });

    if (index < 0 || index >= options.length) {
      highlightedSuggestionIndex = -1;
      return;
    }

    highlightedSuggestionIndex = index;
    const option = options[index];
    option.classList.add("activity-result--highlighted");
    option.setAttribute("aria-selected", "true");
    option.scrollIntoView({ block: "nearest" });
  };

  const updateActivitySuggestions = () => {
    if (!activityInput) return;
    renderActivitySuggestions(activityInput.value || "");
    showActivityResults();
  };

  const findDefaultActivity = () => {
    const queries = [
      "walking, 3.0 mph",
      "walking, for pleasure",
      "walking for exercise",
      "walking",
    ];
    for (const query of queries) {
      const match = activityCatalog.find((entry) =>
        entry.description.toLowerCase().includes(query.toLowerCase())
      );
      if (match) return match;
    }
    return activityCatalog[0] || fallbackCatalog[0];
  };

  const defaultActivity = findDefaultActivity();
  const fallbackActivity =
    defaultActivity ||
    fallbackCatalog[0] || {
      code: "FW000",
      heading: "Sample activity",
      description: "General activity",
      met: 4,
    };

  if (activityInput && !activityInput.value && defaultActivity) {
    activityInput.value = buildActivityValue(defaultActivity);
  }

  const resolveActivity = (rawValue) => {
    if (!rawValue) return null;
    const trimmed = rawValue.trim();
    if (!trimmed) return null;
    if (activityValueLookup.has(trimmed)) {
      return activityValueLookup.get(trimmed);
    }
    const codeMatch = trimmed.match(/(\d{5})/);
    if (codeMatch && activityCodeLookup.has(codeMatch[1])) {
      return activityCodeLookup.get(codeMatch[1]);
    }
    if (trimmed.length < 3) return null;
    const lowered = trimmed.toLowerCase();
    return activityCatalog.find((entry) =>
      entry.description.toLowerCase().includes(lowered)
    );
  };

  const cancerIncidenceSegments = [
    { upper: 300, rate: 0.00023 },
    { upper: 600, rate: 0.00017 },
    { upper: 1000, rate: 0.00008 },
  ];
  const cancerIncidenceMaxMet =
    cancerIncidenceSegments[cancerIncidenceSegments.length - 1].upper;
  const totalCvdSegments = [
    { upper: 300, rate: 0.00057 },
    { upper: 600, rate: 0.00033 },
    { upper: 1000, rate: 0.00015 },
  ];
  const totalCvdMaxMet =
    totalCvdSegments[totalCvdSegments.length - 1].upper;
  const coronaryHeartDiseaseSegments = [
    { upper: 300, rate: 0.00047 },
    { upper: 600, rate: 0.00023 },
    { upper: 1000, rate: 0.00013 },
  ];
  const coronaryHeartDiseaseMaxMet =
    coronaryHeartDiseaseSegments[coronaryHeartDiseaseSegments.length - 1]
      .upper;
  const strokeIncidenceSegments = [
    { upper: 300, rate: 0.00047 },
    { upper: 600, rate: 0.0002 },
    { upper: 1000, rate: 0.00008 },
  ];
  const strokeIncidenceMaxMet =
    strokeIncidenceSegments[strokeIncidenceSegments.length - 1].upper;
  const heartFailureSegments = [
    { upper: 300, rate: 0.00033 },
    { upper: 600, rate: 0.00053 },
    { upper: 1000, rate: 0.00018 },
  ];
  const heartFailureMaxMet =
    heartFailureSegments[heartFailureSegments.length - 1].upper;
  const cvdMortalitySegments = [
    { upper: 300, rate: 0.00064 },
    { upper: 600, rate: 0.00033 },
    { upper: 1000, rate: 0.00015 },
  ];
  const cvdMortalityMaxMet =
    cvdMortalitySegments[cvdMortalitySegments.length - 1].upper;
  const cancerMortalitySegments = [
    { upper: 300, rate: 0.00033 },
    { upper: 600, rate: 0.00017 },
    { upper: 1000, rate: 0.00008 },
  ];
  const cancerMortalityMaxMet =
    cancerMortalitySegments[cancerMortalitySegments.length - 1].upper;
  const allCauseMortalitySegments = [
    { upper: 300, rate: 0.00077 },
    { upper: 600, rate: 0.00027 },
    { upper: 1000, rate: 0.00008 },
  ];
  const allCauseMortalityMaxMet =
    allCauseMortalitySegments[allCauseMortalitySegments.length - 1].upper;
  const depressionIncidenceSegments = [
    { upper: 300, rate: 0.0006 },
    { upper: 600, rate: 0.00023 },
    { upper: 1000, rate: 0.00008 },
  ];
  const depressionIncidenceMaxMet =
    depressionIncidenceSegments[depressionIncidenceSegments.length - 1]
      .upper;
  const majorDepressiveDisorderSegments = [
    { upper: 300, rate: 0.00057 },
    { upper: 600, rate: 0.00027 },
    { upper: 1000, rate: 0.00003 },
  ];
  const majorDepressiveDisorderMaxMet =
    majorDepressiveDisorderSegments[majorDepressiveDisorderSegments.length - 1]
      .upper;
  const productivitySegments = [
    { upper: 750, gain: 0.002 },
    { upper: 900, gain: 0.0047 },
    { upper: 1500, gain: 0.00033 },
  ];
  const productivityMaxMet =
    productivitySegments[productivitySegments.length - 1].upper;
  const healthcareSavingsRatePerMet = 0.00761;
  const healthcareSavingsMetCap = 300;
  const weeksPerYear = 52;

  const metricComparisonConfig = {
    "total-cvd": { mode: "risk", unit: "percent", baseline: 100 },
    "coronary-heart-disease": { mode: "risk", unit: "percent", baseline: 100 },
    "stroke-incidence": { mode: "risk", unit: "percent", baseline: 100 },
    "heart-failure-incidence": { mode: "risk", unit: "percent", baseline: 100 },
    "cvd-mortality": { mode: "risk", unit: "percent", baseline: 100 },
    "cancer-incidence": { mode: "risk", unit: "percent", baseline: 100 },
    "cancer-mortality": { mode: "risk", unit: "percent", baseline: 100 },
    "all-cause-mortality": { mode: "risk", unit: "percent", baseline: 100 },
    "depression-incidence": { mode: "risk", unit: "percent", baseline: 100 },
    "major-depressive-disorder": { mode: "risk", unit: "percent", baseline: 100 },
    productivity: { mode: "gain", unit: "percent", scale: 100 },
    "healthcare-savings": { mode: "absolute", unit: "currency" },
  };

  const MIN_BAR_WIDTH = 6;

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
  const formatMetTotal = (value) => `${Math.round(value).toLocaleString()} MET-min`;
  const formatPercent = (fraction, digits = 1) =>
    `${(fraction * 100).toFixed(digits)}%`;
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatCurrency = (value) => currencyFormatter.format(value);
  const arrowSymbols = {
    down: "↓",
    up: "↑",
    steady: "↔",
    none: "",
  };

  const srDirectionText = (direction, context) => {
    if (direction === "none") return "";
    const descriptor =
      direction === "down"
        ? "decreasing"
        : direction === "up"
        ? "increasing"
        : "unchanged";
    return context ? `${context} ${descriptor}` : descriptor;
  };

  const formatComparisonValue = (value, unit = "percent") => {
    if (unit === "currency") {
      return formatCurrency(value);
    }
    return `${value.toFixed(1)}%`;
  };

  const renderMetricComparison = (metricKey, { sedentary, plan, unit = "percent" }) => {
    const card = document.querySelector(`[data-metric="${metricKey}"]`);
    if (!card) return;
    const sedentaryFill = card.querySelector('[data-bar-fill="sedentary"]');
    const activeFill = card.querySelector('[data-bar-fill="active"]');
    const sedentaryValueEl = card.querySelector('[data-bar-value="sedentary"]');
    const activeValueEl = card.querySelector('[data-bar-value="active"]');

    const safeSedentary = Math.max(0, Number(sedentary) || 0);
    const safePlan = Math.max(0, Number(plan) || 0);
    const baseline = Math.max(safeSedentary, safePlan, 1);
    const sedentaryWidth = baseline > 0 ? (safeSedentary / baseline) * 100 : 0;
    const planWidth = baseline > 0 ? (safePlan / baseline) * 100 : 0;

    if (sedentaryFill) {
      sedentaryFill.style.width = `${Math.min(100, Math.max(MIN_BAR_WIDTH, sedentaryWidth))}%`;
    }
    if (activeFill) {
      activeFill.style.width = `${Math.min(100, Math.max(MIN_BAR_WIDTH, planWidth))}%`;
    }
    if (sedentaryValueEl) {
      sedentaryValueEl.textContent = formatComparisonValue(safeSedentary, unit);
    }
    if (activeValueEl) {
      activeValueEl.textContent = formatComparisonValue(safePlan, unit);
    }
  };

  const updateComparisonForReduction = (metricKey, reductionFraction) => {
    const config = metricComparisonConfig[metricKey];
    if (!config) return;
    const baseline = config.baseline ?? 100;
    const safeReduction = Math.max(-1, Math.min(1, Number(reductionFraction) || 0));
    const sedentary = baseline;
    const plan = baseline * Math.max(0, 1 - safeReduction);
    renderMetricComparison(metricKey, { sedentary, plan, unit: config.unit || "percent" });
  };

  const updateComparisonForGain = (metricKey, gainFraction) => {
    const config = metricComparisonConfig[metricKey];
    if (!config) return;
    const scale = config.scale ?? 100;
    const safeGain = Number(gainFraction) || 0;
    const sedentary = config.baseline ?? 0;
    const plan = Math.max(0, safeGain * scale);
    renderMetricComparison(metricKey, { sedentary, plan, unit: config.unit || "percent" });
  };

  const updateComparisonForAbsolute = (metricKey, planValue) => {
    const config = metricComparisonConfig[metricKey];
    if (!config) return;
    const sedentary = config.baseline ?? 0;
    const plan = Math.max(0, Number(planValue) || 0);
    renderMetricComparison(metricKey, { sedentary, plan, unit: config.unit || "currency" });
  };

  const applyValueWithTrend = (
    element,
    formattedValue,
    { direction = "steady", context = "" } = {}
  ) => {
    if (!element) return;
    element.textContent = formattedValue;
    const arrow = arrowSymbols[direction] ?? "";
    element.dataset.direction = direction;
    element.dataset.arrow = arrow;

    const srText = srDirectionText(direction, context);
    if (srText) {
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = ` (${srText})`;
      element.appendChild(sr);
    }
  };

  const normaliseInput = (input, fallback) => {
    if (!input) return fallback;
    if (input.value === "") return fallback;
    const parsed = Number(input.value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const setPlaceholderValues = () => {
    metricCards.forEach((element) => {
      if (!element.dataset.placeholderSet) {
        element.dataset.placeholderSet = "true";
        element.textContent = "—";
      }
    });
  };


  let isProgrammaticInputUpdate = false;

  const setSliderAndReadout = (rawValue) => {
    const safeRaw = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
    currentMet = safeRaw;
    if (readout) {
      readout.textContent = formatMetTotal(safeRaw);
    }
    return safeRaw;
  };

  const updateSummary = (value, breakdown) => {
    if (computedMetValue) {
      computedMetValue.textContent = Math.round(value).toLocaleString();
    }
    if (computedBreakdown) {
      computedBreakdown.textContent = breakdown;
    }
  };

  const applyMetResult = (rawValue, breakdown) => {
    const displayValue = setSliderAndReadout(rawValue);
    updateSummary(displayValue, breakdown);
    return displayValue;
  };

  const getActivityMeta = () => {
    const rawValue = activityInput ? activityInput.value : "";
    return resolveActivity(rawValue) || fallbackActivity;
  };

  const calculateMetFromForm = () => {
    const activity = getActivityMeta();
    const duration = clampValue(normaliseInput(durationInput, 0), 0, 240);
    const frequency = clampValue(normaliseInput(frequencyInput, 0), 0, 28);

    const totalMet = activity.met * duration * frequency;
    const breakdown = `${activity.met.toFixed(1)} MET × ${duration} min × ${frequency} sessions`;
    return {
      totalMet,
      breakdown,
      duration,
      frequency,
      activity,
      minutes: duration * frequency,
    };
  };

  const projectSliderToInputs = (targetMet) => {
    const activity = getActivityMeta();
    const metPerMinute = activity.met;
    if (metPerMinute <= 0) {
      return {
        duration: 0,
        frequency: 0,
        totalMet: 0,
        breakdown: "Activity data unavailable",
        activity,
        minutes: 0,
      };
    }

    const current = calculateMetFromForm();
    const currentDuration = current.duration || 30;
    const currentFrequency = current.frequency || 3;

    const targetMinutes = targetMet / metPerMinute;

    if (targetMet <= 0 || targetMinutes <= 0) {
      return {
        duration: 0,
        frequency: 0,
        totalMet: 0,
        breakdown: `${metPerMinute.toFixed(1)} MET × 0 min × 0 sessions`,
        activity,
        minutes: 0,
      };
    }

    let projectedFrequency = currentFrequency > 0 ? currentFrequency : 1;
    let projectedDuration = targetMinutes / projectedFrequency;

    const maxDuration = 240;
    const maxFrequency = 28;

    if (projectedDuration > maxDuration) {
      projectedFrequency = Math.max(1, Math.round(targetMinutes / maxDuration));
      projectedDuration = targetMinutes / projectedFrequency;
    }

    if (projectedDuration < 15 && projectedFrequency > 1) {
      projectedFrequency = Math.max(1, Math.round(targetMinutes / 30));
      projectedDuration = targetMinutes / projectedFrequency;
    }

    projectedFrequency = clampValue(Math.round(projectedFrequency), 1, maxFrequency);
    projectedDuration = clampValue(Math.round(projectedDuration), 0, maxDuration);

    if (projectedFrequency === 0 && targetMet > 0) {
      projectedFrequency = 1;
    }
    if (projectedFrequency === 0) {
      projectedDuration = 0;
    }

    const recalculatedMet = metPerMinute * projectedDuration * projectedFrequency;
    const breakdown = `${metPerMinute.toFixed(1)} MET × ${projectedDuration} min × ${projectedFrequency} sessions`;
    return {
      duration: projectedDuration,
      frequency: projectedFrequency,
      totalMet: recalculatedMet,
      breakdown,
      activity,
      minutes: projectedDuration * projectedFrequency,
    };
  };

  const computePiecewiseReduction = (totalMet, segments, maxMet) => {
    if (!Number.isFinite(totalMet) || totalMet <= 0) return 0;
    const cappedMet = Math.min(totalMet, maxMet);
    let accumulated = 0;
    let prevUpper = 0;

    for (const segment of segments) {
      if (cappedMet <= prevUpper) break;
      const appliedUpper = Math.min(cappedMet, segment.upper);
      const minutesInSegment = Math.max(0, appliedUpper - prevUpper);
      accumulated += minutesInSegment * segment.rate;
      prevUpper = segment.upper;
    }

    return accumulated;
  };

  const computeCancerIncidenceReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, cancerIncidenceSegments, cancerIncidenceMaxMet);

  const computeTotalCvdReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, totalCvdSegments, totalCvdMaxMet);

  const computeCoronaryHeartDiseaseReduction = (totalMet) =>
    computePiecewiseReduction(
      totalMet,
      coronaryHeartDiseaseSegments,
      coronaryHeartDiseaseMaxMet
    );

  const computeStrokeIncidenceReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, strokeIncidenceSegments, strokeIncidenceMaxMet);

  const computeHeartFailureReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, heartFailureSegments, heartFailureMaxMet);

  const computeCvdMortalityReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, cvdMortalitySegments, cvdMortalityMaxMet);

  const computeCancerMortalityReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, cancerMortalitySegments, cancerMortalityMaxMet);

  const computeAllCauseMortalityReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, allCauseMortalitySegments, allCauseMortalityMaxMet);

  const computeDepressionIncidenceReduction = (totalMet) =>
    computePiecewiseReduction(totalMet, depressionIncidenceSegments, depressionIncidenceMaxMet);

  const computeMajorDepressiveDisorderReduction = (totalMet) =>
    computePiecewiseReduction(
      totalMet,
      majorDepressiveDisorderSegments,
      majorDepressiveDisorderMaxMet
    );

  const computeProductivityGain = (totalMet) => {
    if (!Number.isFinite(totalMet) || totalMet <= 0) return 0;
    const cappedMet = Math.min(totalMet, productivityMaxMet);
    let accumulated = 0;
    let prevUpper = 0;

    for (const segment of productivitySegments) {
      if (cappedMet <= prevUpper) break;
      const appliedUpper = Math.min(cappedMet, segment.upper);
      const minutesInSegment = Math.max(0, appliedUpper - prevUpper);
      const rangeWidth = segment.upper - prevUpper || 1;
      const perMinuteGain = segment.gain / rangeWidth;
      accumulated += minutesInSegment * perMinuteGain;
      prevUpper = segment.upper;
    }

    return accumulated;
  };

  const computeHealthcareSavings = (totalMet) => {
    if (!Number.isFinite(totalMet) || totalMet <= 0) return 0;
    const cappedMet = Math.min(totalMet, healthcareSavingsMetCap);
    const weeklySavings = cappedMet * healthcareSavingsRatePerMet;
    return weeklySavings * weeksPerYear;
  };

  const updateCancerIncidenceCard = (totalMet) => {
    if (!cancerIncidenceValue) return;
    const reductionFraction = computeCancerIncidenceReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(cancerIncidenceValue, formatPercent(reductionFraction), {
      direction,
      context: "risk",
    });

    updateComparisonForReduction("cancer-incidence", reductionFraction);

    if (cancerIncidenceCaption) {
      const boundedMet = Math.min(
        cancerIncidenceMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      cancerIncidenceCaption.textContent =
        boundedMet > 0
          ? `Estimated drop versus sedentary baseline, calculated on the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Increase weekly activity to begin unlocking measurable reductions.";
    }
  };

  const updateTotalCvdCard = (totalMet) => {
    if (!totalCvdValue) return;
    const reductionFraction = computeTotalCvdReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      totalCvdValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "risk" }
    );

    updateComparisonForReduction("total-cvd", reductionFraction);

    if (totalCvdCaption) {
      const boundedMet = Math.min(
        totalCvdMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      totalCvdCaption.textContent =
        boundedMet > 0
          ? `Estimated risk shift across heart & vessel events, based on the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Build up weekly activity to improve cardiovascular risk.";
    }
  };

  const updateCoronaryHeartDiseaseCard = (totalMet) => {
    if (!coronaryHeartDiseaseValue) return;
    const reductionFraction = computeCoronaryHeartDiseaseReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      coronaryHeartDiseaseValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "risk" }
    );

    updateComparisonForReduction("coronary-heart-disease", reductionFraction);

    if (coronaryHeartDiseaseCaption) {
      const boundedMet = Math.min(
        coronaryHeartDiseaseMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      coronaryHeartDiseaseCaption.textContent =
        boundedMet > 0
          ? `Projected change in heart attack risk across the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Add weekly activity to begin lowering coronary heart disease risk.";
    }
  };

  const updateStrokeIncidenceCard = (totalMet) => {
    if (!strokeIncidenceValue) return;
    const reductionFraction = computeStrokeIncidenceReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      strokeIncidenceValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "risk" }
    );

    updateComparisonForReduction("stroke-incidence", reductionFraction);

    if (strokeIncidenceCaption) {
      const boundedMet = Math.min(
        strokeIncidenceMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      strokeIncidenceCaption.textContent =
        boundedMet > 0
          ? `Estimated chance reduction for any stroke within the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Boost weekly movement to curtail stroke risk.";
    }
  };

  const updateHeartFailureCard = (totalMet) => {
    if (!heartFailureValue) return;
    const reductionFraction = computeHeartFailureReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      heartFailureValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "risk" }
    );

    updateComparisonForReduction("heart-failure-incidence", reductionFraction);
    if (heartFailureCaption) {
      const boundedMet = Math.min(
        heartFailureMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      heartFailureCaption.textContent =
        boundedMet > 0
          ? `Estimated reduction in new heart failure diagnoses within the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Increase weekly activity to influence heart failure risk.";
    }
  };

  const updateCvdMortalityCard = (totalMet) => {
    if (!cvdMortalityValue) return;
    const reductionFraction = computeCvdMortalityReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      cvdMortalityValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "mortality risk" }
    );

    updateComparisonForReduction("cvd-mortality", reductionFraction);
    if (cvdMortalityCaption) {
      const boundedMet = Math.min(
        cvdMortalityMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      cvdMortalityCaption.textContent =
        boundedMet > 0
          ? `Estimated decrease in heart-related mortality within the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Consistent movement is needed to shift cardiovascular mortality risk.";
    }
  };

  const updateCancerMortalityCard = (totalMet) => {
    if (!cancerMortalityValue) return;
    const reductionFraction = computeCancerMortalityReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      cancerMortalityValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "mortality risk" }
    );

    updateComparisonForReduction("cancer-mortality", reductionFraction);
    if (cancerMortalityCaption) {
      const boundedMet = Math.min(
        cancerMortalityMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      cancerMortalityCaption.textContent =
        boundedMet > 0
          ? `Relative change in cancer-related mortality using the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Add weekly activity to influence cancer-specific mortality risk.";
    }
  };

  const updateAllCauseMortalityCard = (totalMet) => {
    if (!allCauseMortalityValue) return;
    const reductionFraction = computeAllCauseMortalityReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      allCauseMortalityValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "mortality risk" }
    );

    updateComparisonForReduction("all-cause-mortality", reductionFraction);
    if (allCauseMortalityCaption) {
      const boundedMet = Math.min(
        allCauseMortalityMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      allCauseMortalityCaption.textContent =
        boundedMet > 0
          ? `Overall longevity signal based on the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Move more weekly to impact overall mortality risk.";
    }
  };

  const updateDepressionIncidenceCard = (totalMet) => {
    if (!depressionIncidenceValue) return;
    const reductionFraction = computeDepressionIncidenceReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      depressionIncidenceValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "risk" }
    );

    updateComparisonForReduction("depression-incidence", reductionFraction);
    if (depressionIncidenceCaption) {
      const boundedMet = Math.min(
        depressionIncidenceMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      depressionIncidenceCaption.textContent =
        boundedMet > 0
          ? `Relative change in population depression risk through ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Introduce regular movement to start lowering depression risk.";
    }
  };

  const updateMajorDepressiveDisorderCard = (totalMet) => {
    if (!majorDepressiveDisorderValue) return;
    const reductionFraction = computeMajorDepressiveDisorderReduction(totalMet);
    const direction = reductionFraction > 0 ? "down" : "steady";
    applyValueWithTrend(
      majorDepressiveDisorderValue,
      formatPercent(reductionFraction, 1),
      { direction, context: "risk" }
    );

    updateComparisonForReduction("major-depressive-disorder", reductionFraction);
    if (majorDepressiveDisorderCaption) {
      const boundedMet = Math.min(
        majorDepressiveDisorderMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      majorDepressiveDisorderCaption.textContent =
        boundedMet > 0
          ? `Risk change for a clinical diagnosis within ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Regular exercise is required to influence major depressive disorder risk.";
    }
  };

  const updateProductivityCard = (totalMet) => {
    if (!productivityValue) return;
    const gainFraction = computeProductivityGain(totalMet);
    const direction =
      gainFraction > 0 ? "up" : gainFraction < 0 ? "down" : "steady";
    applyValueWithTrend(
      productivityValue,
      formatPercent(gainFraction, 2),
      { direction, context: "productivity" }
    );

    updateComparisonForGain("productivity", gainFraction);

    if (productivityCaption) {
      const boundedMet = Math.min(
        productivityMaxMet,
        Math.max(0, Math.round(totalMet))
      );
      productivityCaption.textContent =
        boundedMet > 0
          ? `Estimated uplift in presenteeism & focus across the first ${boundedMet.toLocaleString()} MET-min/wk.`
          : "Add consistent activity to see measurable workplace gains.";
    }
  };

  const updateHealthcareSavingsCard = (totalMet) => {
    if (!healthcareSavingsValue) return;
    const savings = computeHealthcareSavings(totalMet);
    const direction = savings > 0 ? "up" : "steady";
    applyValueWithTrend(healthcareSavingsValue, formatCurrency(savings), {
      direction,
      context: "savings",
    });

    updateComparisonForAbsolute("healthcare-savings", savings);

    if (healthcareSavingsCaption) {
      const boundedMet = Math.min(
        healthcareSavingsMetCap,
        Math.max(0, Math.round(totalMet))
      );
      healthcareSavingsCaption.textContent =
        boundedMet > 0
          ? `Annualised from $${healthcareSavingsRatePerMet.toFixed(
              5
            )} per MET-min each week, capped at ${healthcareSavingsMetCap.toLocaleString()} MET-min/wk.`
          : "Add weekly movement to begin accumulating healthcare savings.";
    }
  };

  const updateHealthMetrics = (totalMet) => {
    updateCancerIncidenceCard(totalMet);
    updateTotalCvdCard(totalMet);
    updateCoronaryHeartDiseaseCard(totalMet);
    updateStrokeIncidenceCard(totalMet);
    updateHeartFailureCard(totalMet);
    updateCvdMortalityCard(totalMet);
    updateCancerMortalityCard(totalMet);
    updateAllCauseMortalityCard(totalMet);
    updateDepressionIncidenceCard(totalMet);
    updateMajorDepressiveDisorderCard(totalMet);
    updateProductivityCard(totalMet);
    updateHealthcareSavingsCard(totalMet);
  };
  console.log(updateHealthMetrics);

  const handleFormChange = () => {
    if (isProgrammaticInputUpdate) return;
    const meta = calculateMetFromForm();
    const appliedMet = applyMetResult(meta.totalMet, meta.breakdown);
    updateHealthMetrics(appliedMet);
    applyActivityNarrative(meta);
    const estimatedMinutes =
      meta.activity.met > 0 ? appliedMet / meta.activity.met : 0;
    notifyMetUpdated(appliedMet, {
      ...meta,
      estimatedMinutes,
      source: "form",
    });
  };

  const handleActivityInput = () => {
    if (!activityInput) return;
    updateActivitySuggestions();
    const resolved = resolveActivity(activityInput.value || "");
    if (!resolved) return;
    const canonical = buildActivityValue(resolved);
    if ((activityInput.value || "").trim() === canonical) {
      handleFormChange();
    }
  };

  const handleActivityFocus = () => {
    if (!activityInput) return;
    updateActivitySuggestions();
  };

  const handleActivityBlur = () => {
    if (!activityInput) return;
    setTimeout(() => {
      if (activityPicker) {
        const activeEl = document.activeElement;
        if (activeEl && activityPicker.contains(activeEl)) {
          return;
        }
      }
      hideActivityResults();
      const resolved = resolveActivity(activityInput.value || "");
      if (!resolved) return;
      const canonical = buildActivityValue(resolved);
      if (activityInput.value !== canonical) {
        activityInput.value = canonical;
      }
      handleFormChange();
    }, 120);
  };

  const handleActivityKeyDown = (event) => {
    if (!activityInput) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!suggestionListVisible) {
        updateActivitySuggestions();
      }
      if (!currentSuggestions.length) return;
      const nextIndex =
        highlightedSuggestionIndex + 1 >= currentSuggestions.length
          ? 0
          : highlightedSuggestionIndex + 1;
      highlightSuggestion(nextIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!suggestionListVisible) {
        updateActivitySuggestions();
      }
      if (!currentSuggestions.length) return;
      const prevIndex =
        highlightedSuggestionIndex - 1 < 0
          ? currentSuggestions.length - 1
          : highlightedSuggestionIndex - 1;
      highlightSuggestion(prevIndex);
    } else if (event.key === "Enter") {
      if (
        highlightedSuggestionIndex >= 0 &&
        currentSuggestions[highlightedSuggestionIndex]
      ) {
        event.preventDefault();
        commitActivitySelection(currentSuggestions[highlightedSuggestionIndex]);
        return;
      }
      const resolved = resolveActivity(activityInput.value || "");
      if (resolved) {
        event.preventDefault();
        commitActivitySelection(resolved);
      }
    } else if (event.key === "Escape") {
      hideActivityResults();
    }
  };

  if (activityInput) {
    activityInput.addEventListener("input", handleActivityInput);
    activityInput.addEventListener("focus", handleActivityFocus);
    activityInput.addEventListener("keydown", handleActivityKeyDown);
    activityInput.addEventListener("blur", handleActivityBlur);
  }

  if (activityPicker) {
    document.addEventListener("mousedown", (event) => {
      if (!activityPicker.contains(event.target)) {
        hideActivityResults();
      }
    });
  }

  if (durationInput) {
    durationInput.addEventListener("input", handleFormChange);
    durationInput.addEventListener("change", handleFormChange);
  }

  if (frequencyInput) {
    frequencyInput.addEventListener("input", handleFormChange);
    frequencyInput.addEventListener("change", handleFormChange);
  }

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear().toString();
  }

  setPlaceholderValues();
  resetExtraYears();
  renderExtraYears();
  handleFormChange();

  function setMinutesInternal(minutes, options = {}) {
    const activity = getActivityMeta();
    const targetMet = Math.max(0, minutes * activity.met);
    const projection = projectSliderToInputs(targetMet);
    isProgrammaticInputUpdate = true;
    if (durationInput)
      durationInput.value = projection.duration.toString();
    if (frequencyInput)
      frequencyInput.value = projection.frequency.toString();
    isProgrammaticInputUpdate = false;

    const appliedMet = applyMetResult(projection.totalMet, projection.breakdown);
    updateHealthMetrics(appliedMet);
    applyActivityNarrative(projection);
    const estimatedMinutes =
      activity.met > 0 ? appliedMet / activity.met : 0;
    if (!options.silent) {
      notifyMetUpdated(appliedMet, {
        ...projection,
        estimatedMinutes,
        source: options.source || "sync",
      });
    }
    return appliedMet;
  }

  function setTotalMet(totalMet, options = {}) {
    const safeMet = Math.max(0, Number(totalMet) || 0);
    const activity = getActivityMeta();
    const minutes = activity.met > 0 ? safeMet / activity.met : 0;
    return setMinutesInternal(minutes, options);
  }

  return {
    getCurrentMet() {
      return currentMet;
    },
    setMinutes: setMinutesInternal,
    setTotalMet,
    getActivityMeta,
    recalc: handleFormChange,
  };
}

function initArteryVisual({ onMinutesChange } = {}) {
  const slider = document.getElementById("exercise-slider");
  const activityLabel = document.getElementById("activity-label");
  const inflammationScoreEl = document.getElementById("inflammation-score");
  const lumenSizeEl = document.getElementById("lumen-size");
  const flowNote = document.getElementById("flow-note");

  const arteryCenterline = document.getElementById("artery-centerline");
  const arteryWallShadow = document.getElementById("artery-wall-shadow");
  const arteryWall = document.getElementById("artery-wall");
  const arteryWallInnerShadow = document.getElementById("artery-wall-inner-shadow");
  const arteryHighlight = document.getElementById("artery-highlight");
  const arteryLumen = document.getElementById("artery-lumen");
  const arteryLumenCore = document.getElementById("artery-lumen-core");
  const arteryGlaze = document.getElementById("artery-glaze");
  const arteryCellsGroup = document.getElementById("artery-cells");
  const arteryFatGroup = document.getElementById("artery-fat-blobs");
  const moodEmojiEl = document.getElementById("mood-emoji");
  const moodCaptionEl = document.getElementById("mood-caption");
  const emojiMouthPath = document.getElementById("emoji-mouth");

  if (
    !slider ||
    !arteryCenterline ||
    !arteryWallShadow ||
    !arteryWall ||
    !arteryWallInnerShadow ||
    !arteryHighlight ||
    !arteryLumen ||
    !arteryLumenCore ||
    !arteryGlaze ||
    !arteryCellsGroup ||
    !arteryFatGroup ||
    !moodEmojiEl ||
    !moodCaptionEl ||
    !emojiMouthPath
  ) {
    return {
      setMinutes() {},
      getMinutes() {
        return 0;
      },
    };
  }

  const wallStops = document.querySelectorAll("#wall-gradient stop");
  const wallDepthStops = document.querySelectorAll("#wall-depth-gradient stop");
  const wallInnerShadowStops = document.querySelectorAll("#wall-inner-shadow stop");
  const highlightStops = document.querySelectorAll("#wall-highlight stop");
  const glazeStops = document.querySelectorAll("#artery-glaze-gradient stop");
  const lumenStops = document.querySelectorAll("#lumen-gradient stop");
  const lumenCoreStops = document.querySelectorAll("#lumen-core stop");
  const sceneStops = document.querySelectorAll("#scene-bg stop");
  const rbcGradientStops = document.querySelectorAll("#rbc-gradient stop");

  const svgNamespace = "http://www.w3.org/2000/svg";

  const config = {
    targetExercise: 150,
    maxExercise: 300,
    healthyLumenWidth: 72,
    lumenReduction: 40,
    wallBaseWidth: 102,
    highlightBaseWidth: 78,
    coreBaseWidth: 58,
    coreMinWidth: 24,
  };

  const flowConfig = {
    arteryCellCount: 26,
    baseSpeed: 48,
    minSpeedFactor: 0.25,
    speedRange: 2.6,
    jitterScale: 6,
    radialRange: 14,
    flattenMax: 0.92,
  };

  const fatConfig = {
    depositCount: 28,
    activationThreshold: 0.35,
    fullActivationSeverity: 0.85,
    minRadius: 2.2,
    maxRadius: 4.6,
    radialSpread: 18,
    radiusGain: 0.3,
    influenceWindow: 24,
    softRepulsion: 0.45,
    activationSlope: 0.45,
  };

  const arteryLength = arteryCenterline.getTotalLength();
  const flowState = {
    speedFactor: 1,
    channelRadius: config.healthyLumenWidth / 2,
    flatten: 1,
    severity: 0,
    fatActivation: 0,
  };

  const arteryCells = createArteryCells(flowConfig.arteryCellCount);
  const fatDeposits = createFatDeposits(fatConfig.depositCount);
  let lastFrame = null;
  let isProgrammatic = false;

  function describeActivityLevel(exerciseMinutes) {
    if (exerciseMinutes >= 220) return "Well above guideline";
    if (exerciseMinutes >= config.targetExercise) return "Meets guideline";
    if (exerciseMinutes >= 90) return "Below target";
    if (exerciseMinutes >= 30) return "Low activity";
    return "Sedentary risk";
  }

  function updateSceneColors(severity) {
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const wallPalette = [
      `hsl(${14 - severity * 6}, 62%, ${36 - severity * 6}%)`,
      `hsl(${18 - severity * 8}, 70%, ${45 - severity * 4}%)`,
      `hsl(${24 - severity * 6}, 75%, ${52 - severity * 2}%)`,
      `hsl(${12 - severity * 6}, 62%, ${38 - severity * 5}%)`,
    ];
    wallStops.forEach((stop, idx) =>
      stop.setAttribute("stop-color", wallPalette[idx])
    );

    const depthPalette = [
      `rgba(20,4,0,${0.28 + severity * 0.18})`,
      `rgba(66,18,6,${0.22 + severity * 0.16})`,
      `rgba(112,40,16,${0.16 + severity * 0.15})`,
      `rgba(20,4,0,${0.28 + severity * 0.18})`,
    ];
    wallDepthStops.forEach((stop, idx) =>
      stop.setAttribute("stop-color", depthPalette[idx])
    );

    const innerShadowPalette = [
      `rgba(52,16,7,${0.52 + severity * 0.25})`,
      `rgba(68,18,7,${0.38 + severity * 0.22})`,
      `rgba(26,8,4,${0.48 + severity * 0.18})`,
    ];
    wallInnerShadowStops.forEach((stop, idx) =>
      stop.setAttribute("stop-color", innerShadowPalette[idx])
    );

    const highlightPalette = [
      { color: "#ffd1b3", opacity: 0.35 + severity * 0.12 },
      { color: "#ffe1ce", opacity: 0.58 + severity * 0.16 },
      { color: "#ffffff", opacity: 0.05 + severity * 0.05 },
    ];
    highlightStops.forEach((stop, idx) => {
      stop.setAttribute("stop-color", highlightPalette[idx].color);
      stop.setAttribute(
        "stop-opacity",
        clamp(highlightPalette[idx].opacity, 0, 1).toFixed(2)
      );
    });

    const lumenPalette = [
      `hsl(${4 - severity * 5}, 100%, ${70 - severity * 12}%)`,
      `hsl(${0 - severity * 5}, 95%, ${54 - severity * 11}%)`,
      `hsl(${352 - severity * 4}, 90%, ${42 - severity * 8}%)`,
    ];
    lumenStops.forEach((stop, idx) =>
      stop.setAttribute("stop-color", lumenPalette[idx])
    );

    const lumenCorePalette = [
      { color: "#ffe3e3", opacity: 0.62 - severity * 0.2 },
      { color: "#ffb0b0", opacity: 0.3 - severity * 0.1 },
      { color: "#ff7070", opacity: 0.14 - severity * 0.05 },
    ];
    lumenCoreStops.forEach((stop, idx) => {
      stop.setAttribute("stop-color", lumenCorePalette[idx].color);
      stop.setAttribute(
        "stop-opacity",
        Math.min(Math.max(lumenCorePalette[idx].opacity, 0.02), 0.8).toFixed(2)
      );
    });

    const backgroundPalette = [
      `hsl(${214 - severity * 10}, 66%, ${28 - severity * 6}%)`,
      `hsl(${212 - severity * 8}, 60%, ${40 - severity * 8}%)`,
      `hsl(${25 + severity * 6}, 68%, ${86 - severity * 6}%)`,
    ];
    sceneStops.forEach((stop, idx) =>
      stop.setAttribute("stop-color", backgroundPalette[idx])
    );

    const rbcPalette = [
      `hsl(${4 - severity * 4}, 100%, ${87 - severity * 12}%)`,
      `hsl(${0 - severity * 4}, 88%, ${60 - severity * 10}%)`,
      `hsl(${356 - severity * 5}, 74%, ${30 - severity * 5}%)`,
    ];
    rbcGradientStops.forEach((stop, idx) =>
      stop.setAttribute("stop-color", rbcPalette[idx])
    );

    const glazePalette = [
      { color: "rgba(255,255,255,0.85)", opacity: 0.5 + (1 - severity) * 0.25 },
      { color: "rgba(255,240,225,0.45)", opacity: 0.35 + (1 - severity) * 0.2 },
      { color: "rgba(255,255,255,0.05)", opacity: 0.1 + (1 - severity) * 0.08 },
    ];
    glazeStops.forEach((stop, idx) => {
      stop.setAttribute("stop-color", glazePalette[idx].color);
      stop.setAttribute(
        "stop-opacity",
        clamp(glazePalette[idx].opacity, 0, 1).toFixed(2)
      );
    });

    const plaqueInfluence = clamp((severity - 0.2) / 0.8, 0, 1);
  }

  function updateNarrative(severity, activityState) {
    if (severity < 0.2) {
      flowNote.textContent =
        "Steady movement keeps this artery roomy, so blood cells cruise through like traffic on a wide-open road.";
    } else if (severity < 0.55) {
      flowNote.textContent =
        "Some buildup is crowding the artery, narrowing the lane and making the flow a bit choppy.";
    } else {
      flowNote.textContent =
        "A thick clog blocks most of the space, so blood has to squeeze through a tight, messy gap.";
    }

    if (activityState === "Well above guideline") {
      flowNote.textContent += " Keeping up with regular workouts helps protect that wide-open lane.";
    } else if (activityState === "Sedentary risk") {
      flowNote.textContent += " When movement is low, the clog grows and the areas downstream miss out on fresh blood.";
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateArteryGeometry(severity) {
    const lumenWidth = clamp(
      config.healthyLumenWidth - severity * config.lumenReduction,
      config.coreMinWidth,
      config.healthyLumenWidth
    );
    const coreWidth = clamp(
      lumenWidth - 14,
      config.coreMinWidth,
      config.healthyLumenWidth
    );
    const highlightWidth = clamp(
      config.highlightBaseWidth - severity * 10,
      48,
      config.highlightBaseWidth
    );
    const wallWidth = clamp(
      config.wallBaseWidth + severity * 10,
      config.wallBaseWidth,
      128
    );

    arteryWall.setAttribute("stroke-width", wallWidth.toFixed(2));
    arteryHighlight.setAttribute("stroke-width", highlightWidth.toFixed(2));
    arteryLumen.setAttribute("stroke-width", lumenWidth.toFixed(2));
    arteryLumenCore.setAttribute("stroke-width", coreWidth.toFixed(2));
    const shadowWidth = clamp(wallWidth + 24 + severity * 18, wallWidth, 160);
    arteryWallShadow.setAttribute("stroke-width", shadowWidth.toFixed(2));

    const glazeWidth = clamp(lumenWidth - 8, 34, 86);
    arteryGlaze.setAttribute("stroke-width", glazeWidth.toFixed(2));
    const innerShadowWidth = clamp(lumenWidth + 10, 48, 94);
    arteryWallInnerShadow.setAttribute("stroke-width", innerShadowWidth.toFixed(2));

    arteryHighlight.style.opacity = (0.82 + (1 - severity) * 0.1).toFixed(2);
    arteryLumen.style.opacity = (0.86 + (1 - severity) * 0.12).toFixed(2);
    arteryLumenCore.style.opacity = (0.62 + (1 - severity) * 0.22).toFixed(2);
    arteryWall.style.opacity = (0.8 + severity * 0.18).toFixed(2);
    arteryWallShadow.style.opacity = (0.28 + severity * 0.4).toFixed(2);
    arteryGlaze.style.opacity = (0.25 + (1 - severity) * 0.5).toFixed(2);
    arteryWallInnerShadow.style.opacity = (0.32 + severity * 0.4).toFixed(2);

    if (lumenSizeEl) {
      const lumenPercent = clamp(
        Math.round((lumenWidth / config.healthyLumenWidth) * 100),
        16,
        100
      );
      lumenSizeEl.textContent = `${lumenPercent}%`;
    }
  }

  function createArteryCells(count) {
    const cells = [];
    for (let i = 0; i < count; i++) {
      const rx = 11 + Math.random() * 3.2;
      const ry = rx * 0.58;
      const node = document.createElementNS(svgNamespace, "ellipse");
      node.setAttribute("rx", rx.toFixed(2));
      node.setAttribute("ry", ry.toFixed(2));
      node.setAttribute("fill", "url(#rbc-gradient)");
      node.setAttribute("stroke", "rgba(138, 15, 32, 0.45)");
      node.setAttribute("stroke-width", "1.1");
      arteryCellsGroup.appendChild(node);

      cells.push({
        node,
        arcLength: Math.random() * arteryLength,
        speed: flowConfig.baseSpeed * (0.6 + Math.random() * 0.9),
        radialOffset: (Math.random() - 0.5) * flowConfig.radialRange,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.6 + Math.random() * 0.8,
        baseRx: rx,
        baseRy: ry,
      });
    }
    return cells;
  }

  function createFatDeposits(count) {
    const deposits = [];
    arteryFatGroup.style.opacity = "0";
    for (let i = 0; i < count; i++) {
      const radius =
        fatConfig.minRadius +
        Math.random() * (fatConfig.maxRadius - fatConfig.minRadius);
      const node = document.createElementNS(svgNamespace, "circle");
      node.setAttribute("r", radius.toFixed(2));
      node.setAttribute("fill", "url(#fat-deposit-gradient)");
      node.setAttribute("stroke", "rgba(145, 94, 18, 0.45)");
      node.setAttribute("stroke-width", "1.1");
      node.style.opacity = "0";
      arteryFatGroup.appendChild(node);

      deposits.push({
        node,
        arcLength: Math.random() * arteryLength,
        radialOffset: (Math.random() - 0.5) * fatConfig.radialSpread,
        baseRadius: radius,
        opacityBias: 0.8 + Math.random() * 0.2,
        activationOffset: Math.random() * 0.85,
        activationRamp: 0.25 + Math.random() * 0.35,
        currentX: 0,
        currentY: 0,
        currentRadius: 0,
        currentOpacity: 0,
      });
    }
    return deposits;
  }

  function animateArteryCells(delta, time) {
    arteryCells.forEach((cell) => {
      cell.arcLength += delta * cell.speed * flowState.speedFactor;
      if (cell.arcLength > arteryLength) {
        cell.arcLength -= arteryLength;
      }

      const point = arteryCenterline.getPointAtLength(cell.arcLength);
      const ahead = arteryCenterline.getPointAtLength(
        Math.min(arteryLength, cell.arcLength + 1)
      );
      const tangentX = ahead.x - point.x;
      const tangentY = ahead.y - point.y;

      let normalX = -tangentY;
      let normalY = tangentX;
      const normalMag = Math.hypot(normalX, normalY) || 1;
      normalX /= normalMag;
      normalY /= normalMag;
      const unitTX = tangentX / normalMag;
      const unitTY = tangentY / normalMag;

      const wobble =
        Math.sin(time * 0.0015 * cell.wobbleSpeed + cell.wobblePhase) *
        flowState.severity *
        flowConfig.jitterScale;
      const baseRadial =
        cell.radialOffset * (0.65 + (1 - flowState.severity) * 0.5) + wobble;
      const avoidance = applyFatAvoidance(
        point,
        baseRadial,
        normalX,
        normalY,
        unitTX,
        unitTY,
        cell
      );
      const radial = avoidance.radial;
      const cx = point.x + normalX * radial;
      const cy = point.y + normalY * radial;

      const angle = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
      cell.node.setAttribute("cx", cx.toFixed(2));
      cell.node.setAttribute("cy", cy.toFixed(2));
      cell.node.setAttribute(
        "transform",
        `rotate(${angle.toFixed(2)}, ${cx.toFixed(2)}, ${cy.toFixed(2)})`
      );
      const rx = cell.baseRx * (1 - avoidance.compression * 0.18);
      cell.node.setAttribute("rx", Math.max(6, rx).toFixed(2));
      const ry =
        Math.max(3, cell.baseRy * flowState.flatten) *
        (1 - avoidance.compression * 0.32);
      cell.node.setAttribute("ry", ry.toFixed(2));
      cell.node.style.opacity = (
        0.75 +
        (1 - flowState.severity) * 0.2
      ).toFixed(2);
    });
  }

  function updateFatDeposits(severity) {
    if (!fatDeposits.length) {
      flowState.fatActivation = 0;
      return;
    }
    const activationWindow =
      fatConfig.fullActivationSeverity - fatConfig.activationThreshold || 1;
    const activation = clamp(
      (severity - fatConfig.activationThreshold) / activationWindow,
      0,
      1
    );

    flowState.fatActivation = activation;

    if (activation <= 0) {
      arteryFatGroup.style.opacity = "0";
      fatDeposits.forEach((deposit) => {
        deposit.node.style.opacity = "0";
        deposit.currentRadius = 0;
        deposit.currentOpacity = 0;
      });
      return;
    }

    const groupOpacity = clamp(0.12 + activation * 0.5, 0, 1).toFixed(2);
    arteryFatGroup.style.opacity = groupOpacity;

    fatDeposits.forEach((deposit) => {
      const localSlope = Math.max(
        0.12,
        fatConfig.activationSlope * deposit.activationRamp
      );
      const localActivation = clamp(
        (activation - deposit.activationOffset) / localSlope,
        0,
        1
      );
      if (localActivation <= 0) {
        deposit.node.style.opacity = "0";
        deposit.currentRadius = 0;
        deposit.currentOpacity = 0;
        return;
      }

      const point = arteryCenterline.getPointAtLength(deposit.arcLength);
      const ahead = arteryCenterline.getPointAtLength(
        Math.min(arteryLength, deposit.arcLength + 1)
      );
      const tangentX = ahead.x - point.x;
      const tangentY = ahead.y - point.y;

      let normalX = -tangentY;
      let normalY = tangentX;
      const normalMag = Math.hypot(normalX, normalY) || 1;
      normalX /= normalMag;
      normalY /= normalMag;

      const radial = clamp(
        deposit.radialOffset * (0.35 + localActivation * 0.8),
        -flowState.channelRadius + 4,
        flowState.channelRadius - 4
      );
      const cx = point.x + normalX * radial;
      const cy = point.y + normalY * radial;

      deposit.node.setAttribute("cx", cx.toFixed(2));
      deposit.node.setAttribute("cy", cy.toFixed(2));

      const radius =
        deposit.baseRadius * (0.85 + localActivation * fatConfig.radiusGain);
      deposit.node.setAttribute("r", radius.toFixed(2));
      deposit.currentX = cx;
      deposit.currentY = cy;
      deposit.currentRadius = radius;
      deposit.currentOpacity = clamp(
        localActivation * (0.55 + deposit.opacityBias * 0.35),
        0,
        1
      );
      deposit.node.style.opacity = deposit.currentOpacity.toFixed(2);
    });
  }

  function applyFatAvoidance(
    point,
    baseRadial,
    normalX,
    normalY,
    tangentX,
    tangentY,
    cell
  ) {
    if (!fatDeposits.length || flowState.fatActivation <= 0) {
      return { radial: baseRadial, compression: 0 };
    }

    let radial = baseRadial;
    let compression = 0;

    fatDeposits.forEach((deposit) => {
      if (!deposit.currentRadius || deposit.currentOpacity < 0.05) {
        return;
      }

      const dx = deposit.currentX - point.x;
      const dy = deposit.currentY - point.y;
      const tangentialDistance = Math.abs(dx * tangentX + dy * tangentY);
      if (tangentialDistance > fatConfig.influenceWindow) {
        return;
      }

      const radialDistance = dx * normalX + dy * normalY;
      const desiredGap =
        deposit.currentRadius + cell.baseRy * 0.35 + flowState.fatActivation * 1.2;
      const radialDelta = radial - radialDistance;
      const influence = 1 - tangentialDistance / fatConfig.influenceWindow;
      const direction =
        radialDelta === 0
          ? radialDistance >= 0
            ? 1
            : -1
          : radialDelta > 0
          ? 1
          : -1;

      if (Math.abs(radialDelta) < desiredGap) {
        const push = (desiredGap - Math.abs(radialDelta)) * direction;
        radial += push * 0.55 * influence;
        compression = Math.max(
          compression,
          influence * flowState.fatActivation * 0.45
        );
      } else {
        radial +=
          direction *
          fatConfig.softRepulsion *
          influence *
          flowState.fatActivation *
          0.28;
      }
    });

    radial = clamp(
      radial,
      -flowState.channelRadius + 4,
      flowState.channelRadius - 4
    );

    return { radial, compression: clamp(compression, 0, 0.65) };
  }

  function updateMood(severity, activityState) {
    moodEmojiEl.classList.remove("is-happy", "is-tense", "is-critical");

    if (severity < 0.2) {
      emojiMouthPath.setAttribute("d", "M34 72 C 48 92 72 92 86 72");
      moodEmojiEl.classList.add("is-happy");
      moodCaptionEl.textContent =
        "Plenty of movement keeps the artery bright and upbeat.";
    } else if (severity < 0.55) {
      emojiMouthPath.setAttribute("d", "M36 82 C 52 76 68 76 84 82");
      moodEmojiEl.classList.add("is-tense");
      moodCaptionEl.textContent =
        "Lower activity makes the artery uneasy—keep it energized.";
    } else {
      emojiMouthPath.setAttribute("d", "M34 90 C 52 72 68 72 86 90");
      moodEmojiEl.classList.add("is-critical");
      moodCaptionEl.textContent =
        "Sedentary habits leave the artery distressed.";
    }

    if (activityState === "Well above guideline" && severity < 0.2) {
      moodCaptionEl.textContent =
        "High activity keeps the artery beaming with resilience.";
    }
  }

  function updateVisualization(exerciseMinutes) {
    const deficit = Math.max(0, config.targetExercise - exerciseMinutes);
    const baseSeverity = Math.pow(deficit / config.targetExercise, 0.9);
    const bonus =
      Math.max(0, exerciseMinutes - config.targetExercise) /
      (config.maxExercise - config.targetExercise || 1);
    const severity = clamp(baseSeverity - bonus * 0.4, 0, 1);

    const inflammationScore = 0.18 + severity * 0.82;
    if (inflammationScoreEl) {
      inflammationScoreEl.textContent = inflammationScore.toFixed(2);
    }

    const activityState = describeActivityLevel(exerciseMinutes);
    if (activityLabel) {
      activityLabel.textContent = activityState;
    }

    updateSceneColors(severity);
    updateNarrative(severity, activityState);
    updateArteryGeometry(severity);
    flowState.speedFactor =
      flowConfig.minSpeedFactor + (1 - severity) * flowConfig.speedRange;
    flowState.channelRadius = Math.max(
      8,
      (config.healthyLumenWidth - severity * config.lumenReduction) / 2 - 6
    );
    flowState.flatten = clamp(
      0.52 + (1 - severity) * (flowConfig.flattenMax - 0.52),
      0.48,
      flowConfig.flattenMax
    );
    flowState.severity = severity;
    updateFatDeposits(severity);
    updateMood(severity, activityState);
  }

  function tick(timestamp) {
    if (!lastFrame) {
      lastFrame = timestamp;
    }
    const delta = (timestamp - lastFrame) / 1000;
    lastFrame = timestamp;

    animateArteryCells(delta, timestamp);

    requestAnimationFrame(tick);
  }

  function setSliderValue(minutes, { silent = false } = {}) {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 300;
    const clamped = clamp(minutes, min, max);
    if (Number(slider.value) !== clamped) {
      isProgrammatic = true;
      slider.value = clamped.toString();
      isProgrammatic = false;
    }
    updateVisualization(clamped);
    if (!silent && typeof onMinutesChange === "function") {
      onMinutesChange(clamped);
    }
  }

  slider.addEventListener("input", (event) => {
    if (isProgrammatic) return;
    const minutes = Number(event.target.value);
    updateVisualization(minutes);
    if (typeof onMinutesChange === "function") {
      onMinutesChange(minutes);
    }
  });

  updateVisualization(Number(slider.value) || 0);
  requestAnimationFrame(tick);

  return {
    setMinutes(minutes, options = {}) {
      setSliderValue(minutes, options);
    },
    getMinutes() {
      return Number(slider.value) || 0;
    },
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // Legacy Google Sheets logging endpoint.
  // const WEB_APP_URL =
  //   "https://script.google.com/macros/s/AKfycbwosrWuaaUOA5N7BwlpMnzYbwoQar92wJwuA-cn5jXN3IGP62x-soTHmKxGSCAQ7fCwXQ/exec";
    
  const WEB_APP_URL ="";
  let cachedClientIp = null;

  async function getClientIp() {
    if (cachedClientIp) {
      return cachedClientIp;
    }

    const endpoints = [
      "https://api.ipify.org?format=json",
      "https://api64.ipify.org?format=json",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          continue;
        }
        const data = await response.json();
        if (data && data.ip) {
          cachedClientIp = data.ip;
          return data.ip;
        }
      } catch (error) {
        // Continue to the next endpoint.
      }
    }

    return "";
  }

  const steps = Array.from(document.querySelectorAll(".flow-step"));
  const progressSteps = Array.from(document.querySelectorAll(".progress-step"));
  const nextButton = document.querySelector('[data-action="next"]');
  const whatsNextVideoConfig = {
    videoId: "rgbziFjMywk",
    videoUrl: "https://www.youtube.com/embed/rgbziFjMywk",
    videoWatch: "https://www.youtube.com/watch?v=rgbziFjMywk",
    title: "What's next on your journey",
  };
  const backButton = document.querySelector('[data-action="back"]');
  const metricCardElements = Array.from(document.querySelectorAll(".metric-card"));
  const downloadSummaryButton = document.getElementById("download-summary");
  const jsPdfScript = document.getElementById("jspdf-lib");
  const accordionSections = Array.from(document.querySelectorAll(".results-details"));

  const totalSteps = steps.length;
  let hasSubmittedFinalStep = false;
  let extraYearsAnswerDebounce = null;
  const appState = {
    currentStep: 0,
    latestMet: 450,
    isSyncingFromArtery: false,
    isSyncingFromActivity: false,
    lastActivityMeta: null,
  };

  const isOnFinalStep = () => appState.currentStep === totalSteps - 1;

  const submitResultsIfNeeded = async ({ requireAnswer = false } = {}) => {
    if (hasSubmittedFinalStep || !isOnFinalStep()) {
      return;
    }
    if (requireAnswer && !readInputValue(extraYearsAnswerInput)) {
      return;
    }
    const success = await submitToSheets();
    if (success) {
      hasSubmittedFinalStep = true;
    }
  };

  const closeOtherAccordions = (current) => {
    accordionSections.forEach((section) => {
      if (section !== current && section.hasAttribute("open")) {
        section.removeAttribute("open");
      }
    });
  };

  accordionSections.forEach((section) => {
    section.addEventListener("toggle", () => {
      if (section.open) {
        closeOtherAccordions(section);
      }
    });
  });


  const jsPdfReady = new Promise((resolve, reject) => {
    if (window.jspdf && typeof window.jspdf.jsPDF === "function") {
      resolve(window.jspdf.jsPDF);
      return;
    }
    if (!jsPdfScript) {
      reject(new Error("PDF library not found."));
      return;
    }
    jsPdfScript.addEventListener("load", () => {
      if (window.jspdf && typeof window.jspdf.jsPDF === "function") {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error("PDF library failed to load."));
      }
    });
    jsPdfScript.addEventListener("error", () => {
      reject(new Error("PDF library failed to load."));
    });
  });

  const setMetricCardFlipState = (card, shouldFlip) => {
    if (!card) return;
    if (shouldFlip) {
      card.classList.add("is-flipped");
      card.setAttribute("aria-expanded", "true");
    } else {
      card.classList.remove("is-flipped");
      card.setAttribute("aria-expanded", "false");
    }
  };

  metricCardElements.forEach((card) => {
    const inner = card.querySelector(".metric-card__inner");
    if (!inner) return;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-expanded", "false");

    card.addEventListener("click", (event) => {
      const closeTarget = event.target.closest(".metric-card__back-close");
      if (closeTarget) {
        event.stopPropagation();
        setMetricCardFlipState(card, false);
        card.focus();
        return;
      }

      const isCurrentlyFlipped = card.classList.contains("is-flipped");
      setMetricCardFlipState(card, !isCurrentlyFlipped);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const isCurrentlyFlipped = card.classList.contains("is-flipped");
        setMetricCardFlipState(card, !isCurrentlyFlipped);
      } else if (event.key === "Escape") {
        setMetricCardFlipState(card, false);
      }
    });

    const closeButton = card.querySelector(".metric-card__back-close");
    if (closeButton) {
      closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setMetricCardFlipState(card, false);
        card.focus();
      });
    }
  });

  const initImpactCarousels = () => {
    const carousels = Array.from(document.querySelectorAll("[data-impact-carousel]"));
    carousels.forEach((carousel) => {
      const slides = Array.from(carousel.querySelectorAll("[data-impact-slide]"));
      if (!slides.length) {
        return;
      }
      let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
      if (activeIndex < 0) {
        activeIndex = 0;
      }
      const total = slides.length;
      const statusEl = carousel.querySelector("[data-carousel-status]");
      const prevBtn = carousel.querySelector("[data-carousel-prev]");
      const nextBtn = carousel.querySelector("[data-carousel-next]");

      const setActiveSlide = (nextIndex) => {
        if (!total) return;
        activeIndex = ((nextIndex % total) + total) % total;
        slides.forEach((slide, idx) => {
          const isActive = idx === activeIndex;
          slide.classList.toggle("is-active", isActive);
          if (isActive) {
            slide.removeAttribute("hidden");
            slide.setAttribute("aria-hidden", "false");
          } else {
            slide.setAttribute("hidden", "hidden");
            slide.setAttribute("aria-hidden", "true");
          }
        });
        if (statusEl) {
          statusEl.textContent = `${activeIndex + 1} of ${total}`;
        }
        const controlsDisabled = total < 2;
        if (prevBtn) {
          prevBtn.disabled = controlsDisabled;
        }
        if (nextBtn) {
          nextBtn.disabled = controlsDisabled;
        }
      };

      setActiveSlide(activeIndex);

      const advance = (delta) => {
        if (total < 2) return;
        setActiveSlide(activeIndex + delta);
      };

      prevBtn?.addEventListener("click", () => advance(-1));
      nextBtn?.addEventListener("click", () => advance(1));

      carousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          advance(-1);
        } else if (event.key === "ArrowRight") {
          advance(1);
        }
      });
    });
  };

  initImpactCarousels();

  const generatePdfSummary = (jsPDF) => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 56;
    let cursorY = margin;

    const ensureSpace = (height) => {
      if (cursorY + height > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

    const addSpacing = (height = 14) => {
      cursorY += height;
    };

    const addParagraph = (text, { size = 11, bold = false, spacing = 16 } = {}) => {
      if (!text) return;
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      lines.forEach((line) => {
        ensureSpace(spacing);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.text(line, margin, cursorY);
        cursorY += spacing;
      });
    };

    const addSectionTitle = (text) => {
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(text, margin, cursorY);
      cursorY += 20;
    };

    const addDivider = () => {
      ensureSpace(10);
      doc.setDrawColor(220, 226, 240);
      doc.setLineWidth(1);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 12;
    };

    const now = new Date();
    const formattedDate = now.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("My Heart Fitness | Results Summary", margin, cursorY);
    cursorY += 26;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated on ${formattedDate}`, margin, cursorY);
    cursorY += 20;

    const genderLabel = genderSelect && genderSelect.selectedIndex >= 0
      ? genderSelect.options[genderSelect.selectedIndex].text.trim()
      : "—";

    let heightDisplay = "—";
    const activeHeightUnit = heightUnitSelect ? heightUnitSelect.value : "cm";
    if (activeHeightUnit === "cm" && heightCmInput && heightCmInput.value) {
      heightDisplay = `${heightCmInput.value} cm`;
    } else if (activeHeightUnit === "ft_in" && heightFeetInput) {
      const feet = heightFeetInput.value || "0";
      const inches = heightInInput ? heightInInput.value || "0" : "0";
      heightDisplay = `${feet} ft ${inches} in`;
    } else if (activeHeightUnit === "in" && heightInchesOnlyInput) {
      heightDisplay = `${heightInchesOnlyInput.value || "0"} in`;
    }

    const weightDisplay = weightValueInput
      ? `${weightValueInput.value || ""} ${weightUnitLabel ? weightUnitLabel.textContent : ""}`.trim() || "—"
      : "—";

    addSectionTitle("Baseline details");
    addParagraph(`Name: ${fullNameInput && fullNameInput.value ? fullNameInput.value : "—"}`);
    addParagraph(`Email: ${emailInput && emailInput.value ? emailInput.value : "—"}`);
    addParagraph(`Age: ${ageInput && ageInput.value ? ageInput.value : "—"}`);
    addParagraph(`Sex at birth: ${genderLabel}`);
    addParagraph(`Height: ${heightDisplay}`);
    addParagraph(`Weight: ${weightDisplay}`);
    addDivider();

    addSectionTitle("Risk summary");
    addParagraph(`Adjusted 10-year cardiovascular risk: ${adjustedRiskEl ? adjustedRiskEl.textContent.trim() : "—"}`, { bold: true });
    addParagraph(`Risk category: ${riskCategoryEl ? riskCategoryEl.textContent.trim() : "—"}`);
    addParagraph(adjustedNoteEl ? adjustedNoteEl.textContent.trim() : "");
    addParagraph(`MET minutes (results view): ${resultsMetValueEl ? resultsMetValueEl.textContent.trim() : "—"}`);
    addParagraph(`MET minutes (impact slider): ${impactMetValueEl ? impactMetValueEl.textContent.trim() : "—"}`);
    if (impactNarrativeEl && impactNarrativeEl.textContent.trim()) {
      addParagraph(`Activity translation: ${impactNarrativeEl.textContent.trim()}`, { size: 10, spacing: 14 });
    }
    addDivider();

    addSectionTitle("Impact across outcomes");
    metricCardElements.forEach((card, index) => {
      const title = card.querySelector("h4")?.textContent?.trim() || `Outcome ${index + 1}`;
      const value = card.querySelector(".value")?.textContent?.trim() || "—";
      const caption = card.querySelector(".caption")?.textContent?.trim() || "";
      const sedentaryValue = card.querySelector('[data-bar-value="sedentary"]')?.textContent?.trim() || "—";
      const planValue = card.querySelector('[data-bar-value="active"]')?.textContent?.trim() || "—";

      addParagraph(title, { bold: true, size: 12, spacing: 18 });
      addParagraph(`Result: ${value}`);
      if (caption) {
        addParagraph(caption, { size: 10, spacing: 14 });
      }
      addParagraph(`Sedentary baseline: ${sedentaryValue}`);
      addParagraph(`Your plan: ${planValue}`);
      addSpacing(4);
    });

    addDivider();
    addParagraph(
      "These insights combine research-based cardiovascular and activity models to support education and coaching conversations. They are not a substitute for medical diagnosis or personalised clinical advice.",
      { size: 9, spacing: 13 }
    );

    doc.save(`mhf-results-summary-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.pdf`);
  };

  if (downloadSummaryButton) {
    downloadSummaryButton.addEventListener("click", () => {
      submitResultsIfNeeded();
      metricCardElements.forEach((card) => setMetricCardFlipState(card, false));
      setTimeout(() => {
        jsPdfReady
          .then((jsPDF) => {
            if (typeof jsPDF !== "function") {
              throw new Error("PDF generator unavailable.");
            }
            generatePdfSummary(jsPDF);
          })
          .catch((error) => {
            console.error("PDF generation failed:", error);
            alert("PDF generator is still loading. Please try again in a moment.");
          });
      }, 150);
    });
  }


  const welcomeModal = document.getElementById("welcome-modal");
  const modalCard = welcomeModal ? welcomeModal.querySelector(".modal-card") : null;
  const modalStartButton = document.querySelector("[data-modal-start]");
  const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
  let modalDismissed = false;
  let welcomeModalIsActive = false;

  const handleModalKeydown = (event) => {
    if (event.key === "Escape") {
      closeWelcomeModal();
    }
  };

  const openWelcomeModal = () => {
    if (!welcomeModal || modalDismissed || welcomeModalIsActive) {
      return;
    }
    welcomeModalIsActive = true;
    welcomeModal.classList.remove("hidden");
    welcomeModal.classList.remove("is-dismissing");
    setBodyModalState(true);
    document.addEventListener("keydown", handleModalKeydown);
    setTimeout(() => {
      if (modalStartButton) {
        modalStartButton.focus();
      }
    }, 0);
  };

  function closeWelcomeModal(options = {}) {
    const { animate = true } = options;
    if (!welcomeModal || welcomeModal.classList.contains("is-dismissing")) {
      return;
    }
    const finalize = () => {
      welcomeModal.classList.add("hidden");
      welcomeModal.classList.remove("is-dismissing");
      setBodyModalState(false);
      document.removeEventListener("keydown", handleModalKeydown);
      welcomeModalIsActive = false;
      modalDismissed = true;
    };

    if (!animate || !modalCard) {
      finalize();
      return;
    }

    welcomeModal.classList.add("is-dismissing");

    const onAnimationEnd = (event) => {
      if (event.target !== modalCard) {
        return;
      }
      modalCard.removeEventListener("animationend", onAnimationEnd);
      finalize();
    };

    modalCard.addEventListener("animationend", onAnimationEnd);
  }

  if (modalStartButton) {
    modalStartButton.addEventListener("click", () => {
      closeWelcomeModal();
    });
  }

  Array.prototype.forEach.call(modalCloseButtons, (button) => {
    button.addEventListener("click", () => {
      closeWelcomeModal();
    });
  });

  if (welcomeModal) {
    welcomeModal.addEventListener("click", (event) => {
      if (event.target === welcomeModal) {
        closeWelcomeModal();
      }
    });
  }

  const videoModal = document.getElementById("video-modal");
  const videoModalDialog = videoModal?.querySelector(".video-modal__dialog");
  const videoModalFrame = document.getElementById("video-modal-frame");
  const videoModalTitle = document.getElementById("video-modal-title");
  const videoModalFallback = document.getElementById("video-modal-fallback");
  const videoModalFallbackLink = document.getElementById("video-modal-fallback-link");
  const videoCloseEls = Array.from(document.querySelectorAll("[data-video-close]"));
  const videoHelpButtons = Array.from(
    document.querySelectorAll("[data-video-id], [data-video-url]")
  );
  let activeVideoTrigger = null;
  let isVideoModalOpen = false;
  let pendingRestartAfterVideo = false;

  const normalizeVideoUrl = (url) => {
    if (!url) {
      return "";
    }
    const trimmed = url.trim();
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
    const watchQueryMatch = trimmed.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i);
    if (watchQueryMatch) {
      return `https://www.youtube.com/embed/${watchQueryMatch[1]}`;
    }
    const watchPathMatch = trimmed.match(/youtube\.com\/watch\/([A-Za-z0-9_-]+)/i);
    if (watchPathMatch) {
      return `https://www.youtube.com/embed/${watchPathMatch[1]}`;
    }
    const shortLinkMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]+)/i);
    if (shortLinkMatch) {
      return `https://www.youtube.com/embed/${shortLinkMatch[1]}`;
    }
    return trimmed;
  };

  const appendVideoParams = (url) => {
    const normalized = normalizeVideoUrl(url);
    if (!normalized) {
      return "";
    }
    const separator = normalized.includes("?") ? "&" : "?";
    return `${normalized}${separator}autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  };

  const buildVideoEmbedUrl = (videoId) =>
    appendVideoParams(`https://www.youtube.com/embed/${videoId}`);

  const updateVideoContent = (videoUrl, title) => {
    if (videoModalFrame) {
      videoModalFrame.src = videoUrl;
    }
    if (videoModalTitle && title) {
      videoModalTitle.textContent = title;
    }
  };

  const closeVideoModal = () => {
    if (!isVideoModalOpen || !videoModal) {
      return;
    }
    isVideoModalOpen = false;
    videoModal.classList.remove("is-visible");
    videoModal.setAttribute("aria-hidden", "true");
    if (videoModalFrame) {
      videoModalFrame.src = "";
    }
    videoModal.classList.remove("video-modal--vertical");
    if (videoModalFallback) {
      videoModalFallback.hidden = true;
      const fallbackAnchor = videoModalFallback.querySelector("a");
      if (fallbackAnchor) {
        fallbackAnchor.removeAttribute("href");
      }
    }
    setBodyModalState(false);
    const triggerToFocus = activeVideoTrigger;
    activeVideoTrigger = null;
    triggerToFocus?.focus({ preventScroll: true });
    if (pendingRestartAfterVideo) {
      pendingRestartAfterVideo = false;
      setStep(0);
    }
  };

  const openVideoModal = (trigger, overrideConfig = null) => {
    if (!videoModal) {
      return false;
    }
    const directUrl = overrideConfig?.videoUrl || trigger?.getAttribute("data-video-url");
    const trimmedDirectUrl = directUrl ? appendVideoParams(directUrl.trim()) : "";
    let embedUrl = trimmedDirectUrl;
    if (!embedUrl) {
      const videoId = overrideConfig?.videoId || trigger?.getAttribute("data-video-id");
      embedUrl = videoId ? buildVideoEmbedUrl(videoId) : "";
    }
    if (!embedUrl) {
      return false;
    }
    const title =
      overrideConfig?.title ||
      trigger?.getAttribute("data-video-title")?.trim() ||
      "Video explainer";
    const orientation = overrideConfig?.orientation || trigger?.getAttribute("data-video-orientation");
    const fallbackUrl =
      overrideConfig?.fallbackUrl ||
      trigger?.getAttribute("data-video-watch")?.trim() ||
      (trigger?.getAttribute("data-video-id")
        ? `https://www.youtube.com/watch?v=${trigger?.getAttribute("data-video-id")}`
        : "");
    activeVideoTrigger = overrideConfig?.returnFocusEl || trigger;
    if (orientation === "vertical") {
      videoModal?.classList.add("video-modal--vertical");
    } else {
      videoModal?.classList.remove("video-modal--vertical");
    }
    if (videoModalFallback && videoModalFallbackLink) {
      if (fallbackUrl) {
        videoModalFallback.hidden = false;
        videoModalFallbackLink.href = fallbackUrl;
      } else {
        videoModalFallback.hidden = true;
        videoModalFallbackLink.removeAttribute("href");
      }
    }
    updateVideoContent(embedUrl, title);
    if (!isVideoModalOpen) {
      isVideoModalOpen = true;
      videoModal.classList.add("is-visible");
      videoModal.setAttribute("aria-hidden", "false");
      setBodyModalState(true);
      setTimeout(() => {
        videoModalDialog?.focus({ preventScroll: true });
      }, 150);
    } else {
      videoModalDialog?.focus({ preventScroll: true });
    }
    return true;
  };

  videoHelpButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openVideoModal(button);
    });
  });

  videoCloseEls.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      closeVideoModal();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isVideoModalOpen) {
      closeVideoModal();
    }
  });

  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email-address");
  const ageInput = document.getElementById("age");
  const genderSelect = document.getElementById("gender");
  const heightUnitSelect = document.getElementById("height-unit");
  const heightInputGroups = document.querySelectorAll("[data-height-input]");
  const heightCmInput = document.getElementById("height-cm");
  const heightFeetInput = document.getElementById("height-ft");
  const heightInInput = document.getElementById("height-in");
  const heightInchesOnlyInput = document.getElementById("height-inches");
  const weightUnitSelect = document.getElementById("weight-unit");
  const weightUnitLabel = document.getElementById("weight-unit-label");
  const weightValueInput = document.getElementById("weight-value");
  const smokerSelect = document.getElementById("smoker");
  const systolicInput = document.getElementById("systolic-bp");
  const bpMedicationSelect = document.getElementById("bp-medication");
  const diabetesSelect = document.getElementById("diabetes");
  const cvdSelect = document.getElementById("cvd");
  const cholesterolKnownSelect = document.getElementById("cholesterol-known");
  const totalCholInput = document.getElementById("total-cholesterol");
  const hdlInput = document.getElementById("hdl-cholesterol");
  const bmiValueEl = document.getElementById("bmi-value");
  const bmiReadoutEl = document.querySelector(".readout--bmi");
  const bmiCategoryEl = document.getElementById("bmi-category");
  const bmiNoteEl = document.getElementById("bmi-note");
  const BMI_NOTE_COPY =
    "BMI, or Body Mass Index, estimates body fat based on height and weight, but it doesn’t account for muscle mass.";
  const clinicalHeading = document.getElementById("clinical-heading");
  const resultsHeading = document.getElementById("results-heading");
  const cholesterolRows = Array.from(
    document.querySelectorAll(".cholesterol-field")
  );

  const adjustedRiskEl = document.getElementById("adjusted-risk");
  const adjustedNoteEl = document.getElementById("adjusted-note");
  const riskCategoryEl = document.getElementById("risk-category");
  const extraYearsSlider = document.getElementById("extra-years-slider");
  const extraYearsDaysEl = document.getElementById("extra-years-days");
  const extraYearsYearsEl = document.getElementById("extra-years-years");
  const extraEffortOutputEl = document.getElementById("extra-effort-output");
  const extraEffortDaysEl = document.getElementById("extra-effort-days");
  const extraYearsAnswerInput = document.getElementById("extra-years-answer");
  const extraYearsOptionButtons = Array.from(
    document.querySelectorAll("[data-extra-years-choice]")
  );
  const extraYearsOtherTrigger = document.getElementById("extra-years-other-trigger");
  const extraYearsOtherPanel = document.getElementById("extra-years-other-panel");
  const extraYearsOtherInput = document.getElementById("extra-years-other-input");
  const extraYearsOtherStorage = document.getElementById("extra-years-other-storage");
  const extraYearsOpenButton = document.getElementById("extra-years-open");
  const extraYearsPreviewDaysEl = document.getElementById("extra-years-preview-days");
  const extraYearsPreviewYearsEl = document.getElementById("extra-years-preview-years");
  const extraYearsModal = document.getElementById("extra-years-modal");
  const extraYearsCloseButton = document.getElementById("extra-years-close");
  const extraYearsDismissEls = Array.from(
    document.querySelectorAll("[data-extra-years-dismiss]")
  );
  const extraYearsOptionKeys = Array.from(
    new Set(
      extraYearsOptionButtons
        .map((btn) => btn.getAttribute("data-extra-years-key"))
        .filter(Boolean)
    )
  );
  if (!extraYearsOptionKeys.includes("other")) {
    extraYearsOptionKeys.push("other");
  }
  const computedMetValueEl = document.getElementById("computed-met");
  const activityNarrativeEl = document.getElementById("activity-narrative");
  const resultsNarrativeEl = document.getElementById("results-activity-narrative");
  const impactNarrativeEl = document.getElementById("impact-activity-narrative");
  const resultsMetSlider = document.getElementById("results-met-slider");
  const resultsMetValueEl = document.getElementById("results-met-value");
  const impactMetSlider = document.getElementById("impact-met-slider");
  const impactMetValueEl = document.getElementById("impact-met-value");
  const survivalCard = document.querySelector(".results-chart");
  const relativeRiskCard = document.getElementById("relative-risk-card");
  const relativeRiskTriggerBtn = document.getElementById("relative-risk-trigger");
  const relativeRiskBackBtn = document.getElementById("relative-risk-back");
  const relativeRiskMessageEl = document.getElementById("relative-risk-message");
  let lastKnownAge = null;

  const defaultRelativeRiskCopy =
    "Complete the earlier steps to compare your risk to peers.";
  const relativeRiskState = {
    message: defaultRelativeRiskCopy,
    hasComparison: false,
  };

  const setRelativeRiskMessage = (text) => {
    if (!relativeRiskMessageEl) return;
    const safeText = text && text.trim().length ? text.trim() : defaultRelativeRiskCopy;
    relativeRiskState.message = safeText;
    relativeRiskMessageEl.classList.remove("is-revealed");
    relativeRiskMessageEl.textContent = "";
    const words = safeText.split(/\s+/).filter(Boolean);
    if (!words.length) {
      relativeRiskMessageEl.textContent = safeText;
      return;
    }
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "relative-risk-word";
      span.style.animationDelay = `${index * 80}ms`;
      span.textContent = word;
      relativeRiskMessageEl.appendChild(span);
      if (index < words.length - 1) {
        relativeRiskMessageEl.appendChild(document.createTextNode(" "));
      }
    });
    if (
      relativeRiskCard &&
      relativeRiskCard.classList.contains("is-flipped") &&
      relativeRiskState.hasComparison
    ) {
      requestAnimationFrame(() => {
        runRelativeRiskAnimation();
      });
    }
  };

  const toggleRelativeRiskCard = (shouldFlip) => {
    if (!relativeRiskCard) return;
    relativeRiskCard.classList.toggle("is-flipped", Boolean(shouldFlip));
    if (relativeRiskTriggerBtn) {
      relativeRiskTriggerBtn.setAttribute(
        "aria-expanded",
        shouldFlip ? "true" : "false"
      );
    }
    if (!shouldFlip && relativeRiskMessageEl) {
      relativeRiskMessageEl.classList.remove("is-revealed");
    }
  };

  const runRelativeRiskAnimation = () => {
    if (!relativeRiskMessageEl) return;
    relativeRiskMessageEl.classList.remove("is-revealed");
    // Force a reflow so repeated plays restart the animation.
    // eslint-disable-next-line no-unused-expressions
    relativeRiskMessageEl.offsetWidth;
    relativeRiskMessageEl.classList.add("is-revealed");
  };

  const setRelativeRiskAvailability = (isAvailable) => {
    if (relativeRiskTriggerBtn) {
      relativeRiskTriggerBtn.disabled = !isAvailable;
      relativeRiskTriggerBtn.setAttribute(
        "aria-disabled",
        isAvailable ? "false" : "true"
      );
    }
    relativeRiskState.hasComparison = Boolean(isAvailable);
    if (!isAvailable) {
      toggleRelativeRiskCard(false);
    }
  };

  if (relativeRiskMessageEl) {
    setRelativeRiskMessage(defaultRelativeRiskCopy);
  }
  setRelativeRiskAvailability(false);

  if (relativeRiskTriggerBtn) {
    relativeRiskTriggerBtn.addEventListener("click", () => {
      if (relativeRiskTriggerBtn.disabled) return;
      toggleRelativeRiskCard(true);
      requestAnimationFrame(() => {
        runRelativeRiskAnimation();
      });
      if (relativeRiskBackBtn) {
        relativeRiskBackBtn.focus();
      }
    });
  }

  if (relativeRiskBackBtn) {
    relativeRiskBackBtn.addEventListener("click", () => {
      toggleRelativeRiskCard(false);
      if (relativeRiskTriggerBtn) {
        relativeRiskTriggerBtn.focus();
      }
    });
  }

  if (relativeRiskCard) {
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        relativeRiskCard.classList.contains("is-flipped")
      ) {
        toggleRelativeRiskCard(false);
        if (relativeRiskTriggerBtn) {
          relativeRiskTriggerBtn.focus();
        }
      }
    });
  }

  const fieldHelpContent = {
    
    "height-unit": {
      description: "Choose the measurement format you prefer - all height inputs stay in sync.",
    
    },
    "weight-value": {
      description: "Enter your current body weight using pounds or kilograms.",
   
    },
    "systolic-bp": {
      description: "Use the top number from your most recent blood pressure reading. If you are unsure please enter 135",

    },
    "bp-medication": {
      description: "Let us know if a clinician has you on blood pressure medication such as: Perindopril, Bisoprolol, Valsartan and etc.",
    
    },
    smoker: {
      description: "Tell us if you currently use cigarettes, cigars, or vaping products.",
    },
    diabetes: {
      description: "Include any clinician-diagnosed type 1 or type 2 diabetes.",

    },
    cvd: {
      description: "Flag any history of heart attack, stroke, or coronary procedures. Please note that this does not include arrhythmias",

    },
    "cholesterol-known": {
      description: "Choose yes if you have recent lab values to plug into the calculator.",
    
    },
    "total-cholesterol": {
      description: "Enter the total cholesterol value from your lab report (mg/dL).",
      example: "185",
    },
    "hdl-cholesterol": {
      description: "Enter the HDL (good) cholesterol from your lab report in mg/dL.",
      example: "52",
    },
    "activity-type": {
      description: "Pick the activity you repeat most weeks so we can assign METs.",
      example: "Cycling (leisure pace)",
    },
    "session-duration": {
      description: "Average minutes you spend in one session of the selected activity.",
      example: "45 minutes",
    },
    "weekly-frequency": {
      description: "How many sessions you complete per week for that activity.",
      example: "3 sessions",
    },
    "results-met-slider": {
      description: "Drag to test higher or lower weekly MET-minutes and see risk change.",
      example: "800 MET-min/wk",
    },
    "extra-years-slider": {
      description: "Set the effort level to model potential healthy days gained.",
      example: "80% effort",
    },
    "extra-years-answer": {
      description: "Capture what you would do with more healthy years to anchor your why.",
      example: "Take my kids hiking more",
    },
    "exercise-slider": {
      description: "Control the artery visual using your weekly exercise minutes.",
      example: "180 minutes",
    },
    "impact-met-slider": {
      description: "Adjust total MET-minutes to see the productivity and mood projections shift.",
      example: "600 MET-min/wk",
    },
  };

  const buildTooltipCopy = (info = {}) => {
    const parts = [];
    if (info.description) {
      parts.push(info.description);
    }
    if (info.example) {
      parts.push(`Example: ${info.example}`);
    }
    return parts.join(" ");
  };

  const attachFieldInfoIcons = () => {
    Object.entries(fieldHelpContent).forEach(([fieldId, info]) => {
      const label = document.querySelector(`label[for="${fieldId}"]`);
      if (!label || label.querySelector(".info-icon")) {
        return;
      }
      const tooltip = buildTooltipCopy(info);
      if (!tooltip) {
        return;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "info-icon";
      button.setAttribute("aria-label", tooltip);
      button.dataset.tooltip = tooltip;
      button.innerHTML = '<span aria-hidden="true">i</span>';
      label.appendChild(button);
    });
  };

  attachFieldInfoIcons();

  ;



  const metControlConfigs = [];
  if (resultsMetSlider || resultsMetValueEl) {
    metControlConfigs.push({
      slider: resultsMetSlider,
      valueEl: resultsMetValueEl,
      source: "results",
    });
  }
  if (impactMetSlider || impactMetValueEl) {
    metControlConfigs.push({
      slider: impactMetSlider,
      valueEl: impactMetValueEl,
      source: "impact",
    });
  }

  const riskDisplayState = {
    baselineRisk: null,
    baselineMet: null,
    currentRisk: null,
    rawBaselineRisk: null,
  };

  const readInputValue = (input) =>
    input && typeof input.value === "string" ? input.value.trim() : "";

  const readTextContent = (element) =>
    element && element.textContent ? element.textContent.trim() : "";

  const getExtraYearsOtherText = () => {
    const inputValue = readInputValue(extraYearsOtherInput);
    if (inputValue) {
      if (extraYearsOtherStorage) {
        extraYearsOtherStorage.value = inputValue;
      }
      return inputValue;
    }
    return readInputValue(extraYearsOtherStorage);
  };

  const syncExtraYearsOtherStorage = () => {
    if (extraYearsOtherStorage) {
      extraYearsOtherStorage.value = readInputValue(extraYearsOtherInput);
    }
  };

  const getExtraYearsSelections = () => {
    if (!extraYearsOptionButtons.length) {
      const otherValueOnly = getExtraYearsOtherText();
      return otherValueOnly ? [{ key: "other", label: otherValueOnly }] : [];
    }
    const buttonSelections = extraYearsOptionButtons
      .filter((btn) => btn.classList.contains("is-selected"))
      .map((btn) => ({
        key: btn.getAttribute("data-extra-years-key") || "",
        label: btn.getAttribute("data-extra-years-choice") || "",
      }))
      .filter((entry) => entry.label);
    const otherValue = getExtraYearsOtherText();
    if (otherValue) {
      buttonSelections.push({ key: "other", label: otherValue });
    }
    return buttonSelections;
  };

  const buildExtraYearsSheetFields = () => {
    const selections = getExtraYearsSelections();
    const labels = selections.map((entry) => entry.label);
    const joined = labels.join(", ");
    const flags = {};
    extraYearsOptionKeys.forEach((key) => {
      flags[`extra_years_${key}`] = selections.some(
        (entry) => entry.key === key
      )
        ? "yes"
        : "";
    });
    return { selections, labels, joined, flags };
  };

  const extractNumbersFromText = (text) => {
    if (!text) return [];
    const normalized = text.replace(/,/g, "");
    const matches = normalized.match(/-?\d+(?:\.\d+)?/g);
    if (!matches) {
      return [];
    }
    return matches
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  };

  const formatDecimal = (value) =>
    Number.isFinite(value) ? value.toFixed(1) : "";

  const readMetFromDisplay = () => {
    if (!computedMetValueEl) {
      return null;
    }
    const numbers = extractNumbersFromText(readTextContent(computedMetValueEl));
    return numbers.length ? numbers[numbers.length - 1] : null;
  };

  const resolveMetForSheets = () => {
    const currentMet = Number.isFinite(appState.latestMet)
      ? appState.latestMet
      : readMetFromDisplay();
    const baselineMet = Number.isFinite(riskDisplayState.baselineMet)
      ? riskDisplayState.baselineMet
      : currentMet;
    return {
      baseline: formatDecimal(baselineMet),
      current: formatDecimal(currentMet),
    };
  };

  const resolveRiskForSheets = () => {
    const fallback = (() => {
      if (!adjustedRiskEl) {
        return { baseline: null, current: null };
      }
      const numbers = extractNumbersFromText(readTextContent(adjustedRiskEl));
      if (!numbers.length) {
        return { baseline: null, current: null };
      }
      return {
        baseline: numbers[0],
        current: numbers[numbers.length - 1],
      };
    })();

    const baselineRisk = Number.isFinite(riskDisplayState.baselineRisk)
      ? riskDisplayState.baselineRisk
      : fallback.baseline;
    const currentRisk = Number.isFinite(riskDisplayState.currentRisk)
      ? riskDisplayState.currentRisk
      : fallback.current ?? baselineRisk;

    return {
      baseline: formatDecimal(baselineRisk),
      current: formatDecimal(currentRisk),
    };
  };

  async function submitToSheets() {
    //commented to check in playground need to uncomment in live
    // if (!WEB_APP_URL) {
    //   return false;
    // }

    const ip_address = await getClientIp();
    const user_agent = navigator.userAgent || "";
    const { baseline: baselineMet, current: currentMet } = resolveMetForSheets();
    const { baseline: baselineRisk, current: currentRisk } = resolveRiskForSheets();
    const {
      labels: extraYearsLabels,
      joined: extraYearsJoined,
      flags: extraYearsFlags,
    } =
      buildExtraYearsSheetFields();
    const extraYearsOtherText = getExtraYearsOtherText();

    const payload = {
      full_name: readInputValue(fullNameInput),
      email: readInputValue(emailInput),
      age: readInputValue(ageInput),
      gender: genderSelect?.value || "",
      bmi: readTextContent(bmiValueEl),
      cvd: cvdSelect?.value || "",
      systolic_bp: readInputValue(systolicInput),
      bp_medication: bpMedicationSelect?.value || "",
      diabetes: diabetesSelect?.value || "",
      smoker: smokerSelect?.value || "",
      initial_met: baselineMet,
      initial_risk: baselineRisk,
      new_met: currentMet,
      new_risk: currentRisk,
      extra_years_answer: extraYearsJoined || readInputValue(extraYearsAnswerInput),
      extra_years_answers: extraYearsLabels,
      extra_years_other_text: extraYearsOtherText,
      ip_address,
      user_agent,
    };

    Object.assign(payload, extraYearsFlags);

    sendJsonToServer(payload);

    try {
      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json.status !== "ok") {
          console.warn("Sheets response:", json);
        }else{
          
          console.log("Sheets response:", json);
        }
      } catch (_) {
        // Non-JSON responses are ignored.
      }
      return true;
    } catch (error) {
      console.error("Sheets submission failed:", error);
      return false;
    }
  }

  const formatRiskPercent = (value) =>
    Number.isFinite(value) ? `${value.toFixed(1)}%` : "—";

  const clearRiskTrendDisplay = () => {
    if (adjustedRiskEl) {
      adjustedRiskEl.textContent = "—";
      adjustedRiskEl.classList.remove(
        "risk-trend-active",
        "risk-trend--lower",
        "risk-trend--higher"
      );
      adjustedRiskEl.removeAttribute("aria-label");
    }
    riskDisplayState.baselineRisk = null;
    riskDisplayState.baselineMet = null;
    riskDisplayState.currentRisk = null;
  };

  const applyRiskDisplay = (value, meta = {}) => {
    if (!adjustedRiskEl) return;
    if (!Number.isFinite(value)) {
      clearRiskTrendDisplay();
      return;
    }
    riskDisplayState.currentRisk = value;

    const isResultsSlider = meta && meta.source === "results";
    const baselineRisk = riskDisplayState.baselineRisk;
    const baselineMet = riskDisplayState.baselineMet;

    if (!isResultsSlider || !Number.isFinite(baselineRisk)) {
      adjustedRiskEl.textContent = formatRiskPercent(value);
      adjustedRiskEl.classList.remove(
        "risk-trend-active",
        "risk-trend--lower",
        "risk-trend--higher"
      );
      adjustedRiskEl.removeAttribute("aria-label");
      riskDisplayState.baselineRisk = value;
      riskDisplayState.baselineMet = Number.isFinite(appState.latestMet)
        ? appState.latestMet
        : null;
      return;
    }

    const metMatchesBaseline =
      Number.isFinite(appState.latestMet) &&
      Number.isFinite(baselineMet) &&
      Math.abs(appState.latestMet - baselineMet) < 1;
    const riskDelta = Math.abs(value - baselineRisk);
    if (riskDelta < 0.05 || metMatchesBaseline) {
      adjustedRiskEl.textContent = formatRiskPercent(baselineRisk);
      adjustedRiskEl.classList.remove(
        "risk-trend-active",
        "risk-trend--lower",
        "risk-trend--higher"
      );
      adjustedRiskEl.removeAttribute("aria-label");
      return;
    }

    const isLower = value < baselineRisk;
    const baselineText = formatRiskPercent(baselineRisk);
    const currentText = formatRiskPercent(value);
    adjustedRiskEl.classList.add("risk-trend-active");
    adjustedRiskEl.classList.remove("risk-trend--lower", "risk-trend--higher");
    adjustedRiskEl.classList.add(isLower ? "risk-trend--lower" : "risk-trend--higher");
    adjustedRiskEl.innerHTML = `
      <span class="risk-trend__baseline">${baselineText}</span>
      <span class="risk-trend__arrow" aria-hidden="true">&rarr;</span>
      <span class="risk-trend__current">${currentText}</span>
    `;
    const spokenDirection = isLower ? "improves" : "increases";
    adjustedRiskEl.setAttribute(
      "aria-label",
      `Risk ${spokenDirection} from ${baselineText} to ${currentText}`
    );
  };

  const markFieldValidity = (element, isValid) => {
    if (!element) return;
    const container = element.closest(".field");
    if (container) {
      container.classList.toggle("has-error", !isValid);
    }
  };

  const clampMetValue = (value, slider = null) => {
    const numeric = Number(value);
    const parsed = Number.isFinite(numeric) ? numeric : 0;
    const targetSlider =
      slider || (metControlConfigs.find((control) => control.slider)?.slider);
    if (!targetSlider) {
      return Math.max(0, parsed);
    }
    const min = Number(targetSlider.min) || 0;
    const max = Number(targetSlider.max) || 1400;
    return Math.min(max, Math.max(min, parsed));
  };

  const renderMetControl = (control, value) => {
    if (!control || (!control.slider && !control.valueEl)) {
      return 0;
    }
    const { slider, valueEl } = control;
    const safeMet = clampMetValue(value, slider);
    if (slider) {
      slider.value = safeMet.toString();
      const min = Number(slider.min) || 0;
      const max = Number(slider.max) || 1400;
      const percent = max > min ? ((safeMet - min) / (max - min)) * 100 : 0;
      const trackFill = Math.min(100, Math.max(0, percent));
      slider.style.background = `linear-gradient(90deg, rgba(49, 120, 255, 0.95) 0%, rgba(244, 156, 66, 0.95) ${trackFill}%, rgba(226, 232, 248, 0.9) ${trackFill}%, rgba(226, 232, 248, 0.9) 100%)`;
    }
    if (valueEl) {
      valueEl.textContent = `${Math.round(safeMet).toLocaleString()} MET-min/wk`;
    }
    return safeMet;
  };

  const updateMetControls = (totalMet) => {
    metControlConfigs.forEach((control) => {
      renderMetControl(control, totalMet);
    });
  };

  const updateCholesterolVisibility = () => {
    const knows = cholesterolKnownSelect.value === "yes";
    cholesterolRows.forEach((row) => {
      const input = row.querySelector("input");
      if (!input) return;
      if (knows) {
        row.removeAttribute("hidden");
        input.setAttribute("required", "true");
      } else {
        row.setAttribute("hidden", "");
        input.removeAttribute("required");
        const container = input.closest(".field");
        if (container) container.classList.remove("has-error");
      }
    });
  };

  function setExtraYearsPlaceholders() {
    if (extraYearsDaysEl) extraYearsDaysEl.textContent = "—";
    if (extraYearsYearsEl) extraYearsYearsEl.textContent = "—";
    if (extraYearsPreviewDaysEl) extraYearsPreviewDaysEl.textContent = "—";
    if (extraYearsPreviewYearsEl) extraYearsPreviewYearsEl.textContent = "—";
    if (extraEffortOutputEl) extraEffortOutputEl.textContent = "100%";
    if (extraEffortDaysEl) extraEffortDaysEl.textContent = "—";
    if (extraYearsOtherStorage) extraYearsOtherStorage.value = "";
  }

  function updateExtraYearsUI(effortValue = null) {
    if (!extraYearsSlider) return;
    const sliderValue = Number(
      extraYearsSlider.value || extraYearsSlider.getAttribute("value") || 100
    );
    const pctInput = Number.isFinite(effortValue) ? effortValue : sliderValue;
    const safePct = Math.min(100, Math.max(10, pctInput || 100));
    extraYearsSlider.value = safePct;

    const ageFromInput = ageInput ? Number(ageInput.value) : NaN;
    const age =
      Number.isFinite(ageFromInput) && ageFromInput > 0 ? ageFromInput : lastKnownAge;

    if (!Number.isFinite(age)) {
      setExtraYearsPlaceholders();
      return;
    }

    lastKnownAge = age;

    const genderValue = genderSelect?.value || "male";
    const baselineRisk = Number(riskDisplayState.rawBaselineRisk);
    if (!Number.isFinite(baselineRisk)) {
      setExtraYearsPlaceholders();
      return;
    }
    const { min, max, minYears, maxYears } = calculateDays(
      age,
      safePct,
      genderValue,
      baselineRisk
    );

    const hasRange = max !== min;
    const minDisplay = Math.max(0, Math.round(min)).toLocaleString();
    const maxDisplay = Math.max(0, Math.round(max)).toLocaleString();
    const dayLabel = hasRange ? `${minDisplay}–${maxDisplay} days` : `${maxDisplay} days`;

    const minYearValue = Number.isFinite(minYears) ? minYears : min / 365;
    const maxYearValue = Number.isFinite(maxYears) ? maxYears : max / 365;
    const hasYearRange =
      Math.abs((maxYearValue || 0) - (minYearValue || 0)) > 0.05 && hasRange;
    const minYearText = Number.isFinite(minYearValue)
      ? minYearValue.toFixed(1)
      : (min / 365).toFixed(1);
    const maxYearText = Number.isFinite(maxYearValue)
      ? maxYearValue.toFixed(1)
      : (max / 365).toFixed(1);
    const yearLabel = hasYearRange
      ? `${minYearText}–${maxYearText} years`
      : `${maxYearText} years`;

    if (extraYearsDaysEl) extraYearsDaysEl.textContent = dayLabel;
    if (extraYearsYearsEl) extraYearsYearsEl.textContent = yearLabel;
    if (extraYearsPreviewDaysEl) extraYearsPreviewDaysEl.textContent = dayLabel;
    if (extraYearsPreviewYearsEl) extraYearsPreviewYearsEl.textContent = yearLabel;
    if (extraEffortOutputEl) extraEffortOutputEl.textContent = `${safePct}%`;
    if (extraEffortDaysEl) extraEffortDaysEl.textContent = dayLabel;
  }

  function updateActivityNarrative(meta) {
    const targets = [];
    if (activityNarrativeEl) targets.push(activityNarrativeEl);
    if (resultsNarrativeEl) targets.push(resultsNarrativeEl);
    if (impactNarrativeEl) targets.push(impactNarrativeEl);
    if (targets.length === 0) return;

    const setNarrative = (text) => {
      targets.forEach((element) => {
        element.textContent = text;
      });
    };

    if (
      !meta ||
      !meta.activity ||
      !Number.isFinite(meta.duration) ||
      meta.duration <= 0 ||
      !Number.isFinite(meta.frequency) ||
      meta.frequency <= 0
    ) {
      setNarrative("See what your new exercise routine may look like.");
      return;
    }

    const label = (meta.activity.label || "your activity").toLowerCase();
    const roundedDuration = Math.max(0, Math.round(meta.duration));
    const roundedFrequency = Math.max(0, Math.round(meta.frequency));
    const durationText = `${roundedDuration} minute${roundedDuration === 1 ? "" : "s"}`;
    const sessionText = `${roundedFrequency} time${roundedFrequency === 1 ? "" : "s"} per week`;

    setNarrative(`This equals ${label} for ${durationText}, ${sessionText}.`);
  }

  const CM_PER_INCH = 2.54;
  const LB_PER_KG = 2.20462;
  const ALL_HEIGHT_UNITS = ["cm", "ft_in", "in"];

  let activeHeightUnit = heightUnitSelect ? heightUnitSelect.value : "cm";
  let activeWeightUnit = weightUnitSelect ? weightUnitSelect.value : "lbs";

  const formatNumber = (value, decimals = 1) => {
    if (!Number.isFinite(value)) return "";
    const factor = 10 ** decimals;
    const rounded = Math.round(value * factor) / factor;
    return rounded.toFixed(decimals).replace(/\.0+$/, "");
  };

  const readHeightInchesFromUnit = (unit) => {
    if (unit === "cm") {
      const cm = heightCmInput ? Number(heightCmInput.value) : NaN;
      if (!Number.isFinite(cm) || cm <= 0) return NaN;
      return cm / CM_PER_INCH;
    }
    if (unit === "ft_in") {
      const feet = heightFeetInput ? Number(heightFeetInput.value) : NaN;
      const inches = heightInInput ? Number(heightInInput.value) : NaN;
      if (!Number.isFinite(feet) || feet < 0) return NaN;
      const safeInches =
        Number.isFinite(inches) && inches >= 0 ? inches : 0;
      const total = feet * 12 + safeInches;
      return total > 0 ? total : NaN;
    }
    if (unit === "in") {
      const inches = heightInchesOnlyInput
        ? Number(heightInchesOnlyInput.value)
        : NaN;
      if (!Number.isFinite(inches) || inches <= 0) return NaN;
      return inches;
    }
    return NaN;
  };

  const clearHeightInputs = (unit) => {
    if (unit === "cm" && heightCmInput) {
      heightCmInput.value = "";
    } else if (unit === "ft_in" && heightFeetInput && heightInInput) {
      heightFeetInput.value = "";
      heightInInput.value = "";
    } else if (unit === "in" && heightInchesOnlyInput) {
      heightInchesOnlyInput.value = "";
    }
  };

  const populateHeightInputs = (unit, inches) => {
    if (!Number.isFinite(inches) || inches <= 0) {
      clearHeightInputs(unit);
      return;
    }

    if (unit === "cm" && heightCmInput) {
      heightCmInput.value = formatNumber(inches * CM_PER_INCH, 1);
    } else if (unit === "ft_in" && heightFeetInput && heightInInput) {
      let feet = Math.floor(inches / 12);
      let remainder = inches - feet * 12;
      remainder = Math.max(0, remainder);
      let roundedRemainder = Math.round(remainder * 10) / 10;
      if (roundedRemainder >= 12) {
        feet += 1;
        roundedRemainder = 0;
      }
      heightFeetInput.value = feet > 0 ? feet.toString() : "";
      heightInInput.value =
        roundedRemainder > 0 ? formatNumber(roundedRemainder, 1) : "";
    } else if (unit === "in" && heightInchesOnlyInput) {
      heightInchesOnlyInput.value = formatNumber(inches, 1);
    }
  };

  const updateHeightRepresentations = (inches, { skipUnit = null } = {}) => {
    ALL_HEIGHT_UNITS.forEach((unit) => {
      if (unit === skipUnit) return;
      if (!Number.isFinite(inches) || inches <= 0) {
        clearHeightInputs(unit);
      } else {
        populateHeightInputs(unit, inches);
      }
    });
  };

  const toggleHeightGroups = (unit) => {
    heightInputGroups.forEach((group) => {
      const isActive = group.dataset.heightInput === unit;
      group.toggleAttribute("hidden", !isActive);
      group.querySelectorAll("input").forEach((input) => {
        if (isActive) {
          input.removeAttribute("disabled");
          input.setAttribute("required", "true");
        } else {
          input.setAttribute("disabled", "true");
          input.removeAttribute("required");
        }
      });
    });
  };

  const setHeightUnit = (unit, { preserveValue = true } = {}) => {
    let inches = NaN;
    if (preserveValue) {
      inches = readHeightInchesFromUnit(activeHeightUnit);
    }
    activeHeightUnit = unit;
    toggleHeightGroups(unit);
    if (preserveValue && Number.isFinite(inches)) {
      populateHeightInputs(unit, inches);
      updateHeightRepresentations(inches, { skipUnit: unit });
    } else {
      clearHeightInputs(unit);
    }
    heightUnitSelect.value = unit;
  };

  const getHeightInches = () => readHeightInchesFromUnit(activeHeightUnit);

  const getWeightInPounds = () => {
    const raw = weightValueInput ? Number(weightValueInput.value) : NaN;
    if (!Number.isFinite(raw) || raw <= 0) return NaN;
    return activeWeightUnit === "kg" ? raw * LB_PER_KG : raw;
  };

  const setWeightUnit = (unit, { preserveValue = true } = {}) => {
    let pounds = NaN;
    if (preserveValue) {
      pounds = getWeightInPounds();
    }
    activeWeightUnit = unit;
    if (weightUnitLabel) {
      weightUnitLabel.textContent = unit === "kg" ? "kg" : "lbs";
    }
    weightUnitSelect.value = unit;

    if (preserveValue && Number.isFinite(pounds) && weightValueInput) {
      const nextValue = unit === "kg" ? pounds / LB_PER_KG : pounds;
      const decimals = unit === "kg" ? 1 : 0;
      weightValueInput.value = formatNumber(nextValue, decimals);
    } else if (weightValueInput) {
      weightValueInput.value = "";
    }
  };

  const bmiCategoryStates = [
    {
      max: 18.5,
      label: "Underweight",
      note: "Coordinate with nutrition support to move toward a healthy range.",
      className: "is-underweight",
    },
    {
      max: 25,
      label: "Healthy range",
      note: "Great spot—keep pairing movement, fueling, and recovery to stay here.",
      className: "is-healthy",
    },
    {
      max: 30,
      label: "Overweight",
      note: "Dial in movement volume and nutrition nudges to trend toward healthy.",
      className: "is-overweight",
    },
    {
      max: 35,
      label: "Obesity class I",
      note: "Structured coaching and nutrition focus can reduce metabolic strain.",
      className: "is-obesity1",
    },
    {
      max: 40,
      label: "Obesity class II",
      note: "Partner with your clinician for targeted weight-loss planning.",
      className: "is-obesity2",
    },
    {
      max: Infinity,
      label: "Obesity class III",
      note: "Highest cardiometabolic load—fast-track medical supervision.",
      className: "is-obesity3",
    },
  ];

  const bmiStateClasses = bmiCategoryStates.map((state) => state.className);

  const defaultBmiState = {
    label: "Awaiting input",
    note: BMI_NOTE_COPY,
    className: "",
  };

  const resolveBmiCategory = (value) => {
    if (!Number.isFinite(value)) {
      return defaultBmiState;
    }
    return (
      bmiCategoryStates.find((state) => value < state.max) ||
      bmiCategoryStates[bmiCategoryStates.length - 1]
    );
  };

  const updateBmiDisplay = (value) => {
    if (bmiValueEl) {
      bmiValueEl.textContent = Number.isFinite(value) ? value.toFixed(1) : "—";
    }
    if (!bmiReadoutEl || !bmiCategoryEl || !bmiNoteEl) {
      return;
    }
    const { label, className } = resolveBmiCategory(value);
    bmiCategoryEl.textContent = label;
    bmiNoteEl.textContent = BMI_NOTE_COPY;

    bmiStateClasses.forEach((stateClass) => {
      bmiReadoutEl.classList.remove(stateClass);
      bmiCategoryEl.classList.remove(stateClass);
    });

    if (className) {
      bmiReadoutEl.classList.add(className);
      bmiCategoryEl.classList.add(className);
    }
  };

  updateBmiDisplay(null);

  const calculateCurrentBMI = () => {
    const heightInches = getHeightInches();
    const weightPounds = getWeightInPounds();
    if (
      !Number.isFinite(heightInches) ||
      heightInches <= 0 ||
      !Number.isFinite(weightPounds) ||
      weightPounds <= 0
    ) {
      updateBmiDisplay(null);
      return null;
    }
    const bmi = (weightPounds / (heightInches * heightInches)) * 703;
    updateBmiDisplay(bmi);
    return bmi;
  };

  if (heightUnitSelect) {
    setHeightUnit(activeHeightUnit, { preserveValue: false });
  }
  if (weightUnitSelect) {
    setWeightUnit(activeWeightUnit, { preserveValue: false });
  }

  const gatherUserInputs = (resolvedBmi) => {
    const age = Number(ageInput.value);
    const heightInches = getHeightInches();
    const weightLbs = getWeightInPounds();
    const systolic = Number(systolicInput.value);

    const smoker = smokerSelect.value === "yes";
    const onBpMedication = bpMedicationSelect.value === "yes";
    const diabetes = diabetesSelect.value === "yes";
    const hasCvd = cvdSelect.value === "yes";
    const cholKnown = cholesterolKnownSelect.value === "yes";
    const totalCholesterol = cholKnown
      ? Number(totalCholInput.value)
      : null;
    const hdlCholesterol = cholKnown ? Number(hdlInput.value) : null;

    const essentialsValid = [age, heightInches, weightLbs, systolic].every(
      (val) => Number.isFinite(val) && val > 0
    );
    const labsValid = cholKnown
      ? Number.isFinite(totalCholesterol) &&
        totalCholesterol > 0 &&
        Number.isFinite(hdlCholesterol) &&
        hdlCholesterol > 0
      : true;

    return {
      age,
      gender: genderSelect.value,
      smoker,
      systolic,
      onBpMedication,
      diabetes,
      hasCvd,
      useCholesterol: cholKnown && labsValid,
      totalCholesterol,
      hdlCholesterol,
      bmi: resolvedBmi,
      valid: essentialsValid && (cholKnown ? labsValid : resolvedBmi !== null),
    };
  };

  const computeBaselineRisk = (inputs) => {
    if (inputs.useCholesterol) {
      return calculateFraminghamWithCholesterol(
        inputs.age,
        inputs.gender,
        inputs.smoker,
        inputs.systolic,
        inputs.onBpMedication,
        inputs.totalCholesterol,
        inputs.hdlCholesterol,
        inputs.diabetes
      );
    }
    if (inputs.bmi) {
      return calculateFraminghamWithoutCholesterol(
        inputs.age,
        inputs.gender,
        inputs.smoker,
        inputs.systolic,
        inputs.onBpMedication,
        inputs.bmi,
        inputs.diabetes
      );
    }
    return 0;
  };

  const updateRiskOutputs = (meta = {}) => {
    const bmi = calculateCurrentBMI();
    const inputs = gatherUserInputs(bmi);

    const resetRiskOutputs = () => {
      clearRiskTrendDisplay();
      riskDisplayState.rawBaselineRisk = null;
      if (adjustedNoteEl)
        adjustedNoteEl.textContent = "Complete the earlier steps to calculate.";
      if (riskCategoryEl) {
        riskCategoryEl.textContent = "—";
        riskCategoryEl.classList.remove(
          "is-very-low",
          "is-low",
          "is-moderate",
          "is-high"
        );
      }
      destroySurvivalChart();
      setExtraYearsPlaceholders();
      updateMetControls(appState.latestMet);
      metricCardElements.forEach((card) => setMetricCardFlipState(card, false));
      setRelativeRiskMessage(defaultRelativeRiskCopy);
      setRelativeRiskAvailability(false);
    };

    updateMetControls(appState.latestMet);

    if (!inputs.valid) {
      resetRiskOutputs();
      return;
    }

    lastKnownAge = inputs.age;

    const baselineRisk = computeBaselineRisk(inputs);
    riskDisplayState.rawBaselineRisk = baselineRisk;
    updateExtraYearsUI();
    const adjustedRisk = computeAdjustedRisk(baselineRisk, appState.latestMet);
    const safeAdjustedRisk = Math.max(0, adjustedRisk);
    applyRiskDisplay(safeAdjustedRisk, meta);

    const estimatedMinutes =
      meta.estimatedMinutes ??
      (meta.activity && meta.activity.met
        ? appState.latestMet / meta.activity.met
        : Math.round(appState.latestMet / 4.0));

    if (adjustedNoteEl) {
      adjustedNoteEl.textContent = `Based on ${Math.max(0, Math.round(
        appState.latestMet
      )).toLocaleString()} MET-min/wk (~${Math.max(
        0,
        Math.round(estimatedMinutes || 0)
      )} minutes).`;
    }

    if (riskCategoryEl) {
      riskCategoryEl.classList.remove(
        "is-very-low",
        "is-low",
        "is-moderate",
        "is-high"
      );
      const riskValue = safeAdjustedRisk;
      let categoryText = "—";
      let categoryClass = "";

      if (Number.isFinite(riskValue)) {
        if (riskValue < 5) {
          categoryText = "Very low risk";
          categoryClass = "is-very-low";
        } else if (riskValue < 7.5) {
          categoryText = "Low risk";
          categoryClass = "is-low";
        } else if (riskValue < 20) {
          categoryText = "Moderate risk";
          categoryClass = "is-moderate";
        } else {
          categoryText = "High risk";
          categoryClass = "is-high";
        }
      }

      riskCategoryEl.textContent = categoryText;
      if (categoryClass) riskCategoryEl.classList.add(categoryClass);
    }

    const relativeStatement = buildRelativeRiskStatement(
      inputs.age,
      inputs.gender,
      safeAdjustedRisk
    );
    if (relativeStatement) {
      setRelativeRiskMessage(relativeStatement.message);
      setRelativeRiskAvailability(true);
    } else {
      setRelativeRiskMessage(defaultRelativeRiskCopy);
      setRelativeRiskAvailability(false);
    }

    renderSurvivalChart(inputs.age, safeAdjustedRisk, inputs.gender);
  };

  const handleHeightInputChange = () => {
    const inches = readHeightInchesFromUnit(activeHeightUnit);
    if (Number.isFinite(inches)) {
      updateHeightRepresentations(inches, { skipUnit: activeHeightUnit });
      return inches;
    }
    updateHeightRepresentations(NaN, { skipUnit: activeHeightUnit });
    return NaN;
  };

  const updateClinicalHeading = () => {
    const rawName = ((fullNameInput && fullNameInput.value) || "").trim();
    const fallbackName = "Friend";
    let displayName = fallbackName;
    if (rawName) {
      const parts = rawName.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        displayName = parts[0];
      }
    }
    if (clinicalHeading) {
      clinicalHeading.textContent = `${displayName}, let's get some more information`;
    }
    if (resultsHeading) {
      const nameForHeading = displayName.replace(/^[a-z]/, (c) => c.toUpperCase());
      resultsHeading.textContent = `${nameForHeading} here are insights on your cardiovascular risk`;
    }
  };

  const validateStep = (index) => {
    const stepEl = steps[index];
    if (!stepEl) return true;
    let valid = true;
    const requiredFields = stepEl.querySelectorAll("input[required], select[required]");
    requiredFields.forEach((field) => {
      if (field.disabled) {
        return;
      }
      if (field.closest(".cholesterol-field[hidden]") || field.closest("[hidden]")) {
        return;
      }
      const value = field.value.trim();
      const isNumber = field.type === "number";
      const parsed = Number(value);
      const isFilled =
        value !== "" && (!isNumber || Number.isFinite(parsed));
      markFieldValidity(field, isFilled);
      if (!isFilled) {
        valid = false;
      }
    });
    return valid;
  };

  const setStep = (index) => {
    const bounded = Math.max(0, Math.min(totalSteps - 1, index));
    const isFinalStepView = bounded === totalSteps - 1;
    steps.forEach((step, idx) => {
      step.classList.toggle("is-active", idx === bounded);
    });
    progressSteps.forEach((step, idx) => {
      step.classList.toggle("is-active", idx === bounded);
      step.classList.toggle("is-complete", idx < bounded);
    });

    if (backButton) {
      backButton.disabled = bounded === 0;
      backButton.setAttribute("aria-disabled", bounded === 0 ? "true" : "false");
    }

    if (nextButton) {
      nextButton.textContent = isFinalStepView ? "What's Next" : "Next";
    }

    if (!isFinalStepView) {
      hasSubmittedFinalStep = false;
      if (extraYearsAnswerDebounce) {
        clearTimeout(extraYearsAnswerDebounce);
        extraYearsAnswerDebounce = null;
      }
    }

    appState.currentStep = bounded;

    if (isFinalStepView && readInputValue(extraYearsAnswerInput)) {
      submitResultsIfNeeded({ requireAnswer: true });
    }
  };

  if (backButton) {
    backButton.addEventListener("click", () => {
      if (appState.currentStep > 0) {
        setStep(appState.currentStep - 1);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (appState.currentStep === totalSteps - 1) {
        submitResultsIfNeeded();
        const opened = openVideoModal(nextButton, {
          videoId: whatsNextVideoConfig.videoId,
          videoUrl: whatsNextVideoConfig.videoUrl,
          fallbackUrl: whatsNextVideoConfig.videoWatch,
          title: whatsNextVideoConfig.title,
          returnFocusEl: nextButton,
        });
        if (opened) {
          pendingRestartAfterVideo = true;
        } else {
          setStep(0);
        }
        return;
      }
      if (!validateStep(appState.currentStep)) {
        return;
      }
      setStep(appState.currentStep + 1);
    });
  }

  const recalcFields = [
    fullNameInput,
    emailInput,
    ageInput,
    genderSelect,
    smokerSelect,
    systolicInput,
    bpMedicationSelect,
    diabetesSelect,
    cvdSelect,
    cholesterolKnownSelect,
    totalCholInput,
    hdlInput,
  ];

  recalcFields.forEach((el) => {
    if (!el) return;
    const eventName = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventName, () => {
      markFieldValidity(el, true);
      if (el === cholesterolKnownSelect) {
        updateCholesterolVisibility();
      }
      if (el === fullNameInput) {
        updateClinicalHeading();
      }
      updateRiskOutputs();
    });
  });

  if (heightUnitSelect) {
    heightUnitSelect.addEventListener("change", () => {
      markFieldValidity(heightUnitSelect, true);
      setHeightUnit(heightUnitSelect.value);
      handleHeightInputChange();
      updateRiskOutputs();
    });
  }

  const heightInputs = [
    heightCmInput,
    heightFeetInput,
    heightInInput,
    heightInchesOnlyInput,
  ];

  heightInputs.forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (input.disabled) return;
      markFieldValidity(input, true);
      handleHeightInputChange();
      updateRiskOutputs();
    });
  });

  if (weightUnitSelect) {
    weightUnitSelect.addEventListener("change", () => {
      markFieldValidity(weightUnitSelect, true);
      setWeightUnit(weightUnitSelect.value);
      updateRiskOutputs();
    });
  }

  if (weightValueInput) {
    weightValueInput.addEventListener("input", () => {
      markFieldValidity(weightValueInput, true);
      updateRiskOutputs();
    });
  }

  if (extraYearsSlider) {
    extraYearsSlider.addEventListener("input", (event) => {
      const pct = Number(event.target.value);
      updateExtraYearsUI(pct);
    });
  }

  let queueExtraYearsSubmission = null;

  if (extraYearsAnswerInput) {
    queueExtraYearsSubmission = () => {
      if (extraYearsAnswerDebounce) {
        clearTimeout(extraYearsAnswerDebounce);
      }
      extraYearsAnswerDebounce = window.setTimeout(() => {
        submitResultsIfNeeded({ requireAnswer: true });
        extraYearsAnswerDebounce = null;
      }, 1200);
    };

    extraYearsAnswerInput.addEventListener("input", queueExtraYearsSubmission);
    extraYearsAnswerInput.addEventListener("blur", () => {
      submitResultsIfNeeded({ requireAnswer: true });
    });
  }

  const toggleExtraYearsOtherPanel = (forceOpen) => {
    if (!extraYearsOtherPanel || !extraYearsOtherTrigger) {
      return;
    }
    const nextState =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !extraYearsOtherPanel.classList.contains("is-open");
    extraYearsOtherPanel.classList.toggle("is-open", nextState);
    extraYearsOtherPanel.setAttribute("aria-hidden", nextState ? "false" : "true");
    extraYearsOtherTrigger.setAttribute("aria-expanded", nextState ? "true" : "false");
    if (nextState && extraYearsOtherInput) {
      window.requestAnimationFrame(() => {
        extraYearsOtherInput.focus();
      });
    }
  };

  const applyExtraYearsSelectionsToInput = () => {
    if (!extraYearsAnswerInput) {
      return;
    }
    const { joined } = buildExtraYearsSheetFields();
    if (extraYearsAnswerInput.value !== joined) {
      extraYearsAnswerInput.value = joined;
      hasSubmittedFinalStep = false;
    }
    syncExtraYearsOtherStorage();
    if (typeof queueExtraYearsSubmission === "function") {
      queueExtraYearsSubmission();
    } else {
      submitResultsIfNeeded({ requireAnswer: true });
    }
  };

  if (extraYearsOtherTrigger && extraYearsOtherPanel) {
    extraYearsOtherTrigger.addEventListener("click", () => {
      toggleExtraYearsOtherPanel(true);
    });
  }

  if (extraYearsOtherInput) {
    extraYearsOtherInput.addEventListener("focus", () => {
      toggleExtraYearsOtherPanel(true);
    });
    extraYearsOtherInput.addEventListener("input", () => {
      applyExtraYearsSelectionsToInput();
    });
    extraYearsOtherInput.addEventListener("blur", () => {
      applyExtraYearsSelectionsToInput();
    });
  }

  if (extraYearsOptionButtons.length) {
    extraYearsOptionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("is-selected");
        const isSelected = button.classList.contains("is-selected");
        button.setAttribute("aria-pressed", isSelected ? "true" : "false");
        applyExtraYearsSelectionsToInput();
      });
    });
  }

  const openExtraYearsModal = () => {
    if (!extraYearsModal) return;
    extraYearsModal.classList.add("is-open");
    extraYearsModal.setAttribute("aria-hidden", "false");
    setBodyModalState(true);
    if (extraYearsOtherStorage && extraYearsOtherInput) {
      extraYearsOtherInput.value =
        readInputValue(extraYearsOtherStorage) || extraYearsOtherInput.value;
    }
    setTimeout(() => {
      extraYearsSlider?.focus({ preventScroll: true });
    }, 150);
  };

  const closeExtraYearsModal = () => {
    if (!extraYearsModal) return;
    syncExtraYearsOtherStorage();
    applyExtraYearsSelectionsToInput();
    submitResultsIfNeeded({ requireAnswer: true });
    extraYearsModal.classList.remove("is-open");
    extraYearsModal.setAttribute("aria-hidden", "true");
    setBodyModalState(false);
    extraYearsOpenButton?.focus({ preventScroll: true });
  };

  if (extraYearsOpenButton && extraYearsModal) {
    extraYearsOpenButton.addEventListener("click", openExtraYearsModal);
  }

  extraYearsCloseButton?.addEventListener("click", closeExtraYearsModal);
  extraYearsDismissEls.forEach((el) => {
    el.addEventListener("click", closeExtraYearsModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && extraYearsModal?.classList.contains("is-open")) {
      closeExtraYearsModal();
    }
  });

  updateCholesterolVisibility();
  updateClinicalHeading();
  setStep(0);

  let arteryModule = null;

  const handleMetUpdated = (totalMet, meta = {}) => {
    appState.latestMet = totalMet;
    appState.lastActivityMeta = meta;
    updateMetControls(totalMet);
    updateRiskOutputs(meta);

    if (!appState.isSyncingFromArtery && arteryModule) {
      appState.isSyncingFromActivity = true;
      const estimatedMinutes =
        meta.estimatedMinutes ??
        (meta.activity && meta.activity.met
          ? totalMet / meta.activity.met
          : arteryModule.getMinutes());
      arteryModule.setMinutes(estimatedMinutes, { silent: true });
      appState.isSyncingFromActivity = false;
    }
  };

  const activityModule = initActivityModule({
    onMetUpdated: handleMetUpdated,
    onResetExtraYears: setExtraYearsPlaceholders,
    onUpdateExtraYears: updateExtraYearsUI,
    onUpdateNarrative: updateActivityNarrative,
  });

  metControlConfigs.forEach((control) => {
    const { slider, source } = control;
    if (!slider) return;

    const commitMetValue = (rawValue) => {
      const safeMet = renderMetControl(control, rawValue);
      updateMetControls(safeMet);

      if (!activityModule || typeof activityModule.setTotalMet !== "function") {
        appState.latestMet = safeMet;
        updateRiskOutputs(appState.lastActivityMeta || {});
        return;
      }

      activityModule.setTotalMet(safeMet, { source: source || "met-control" });
    };

    slider.addEventListener("input", (event) => {
      renderMetControl(control, event.target.value);
    });

    slider.addEventListener("change", (event) => {
      commitMetValue(event.target.value);
    });
  });

  arteryModule = initArteryVisual({
    onMinutesChange: (minutes) => {
      if (appState.isSyncingFromActivity) return;
      appState.isSyncingFromArtery = true;
      activityModule.setMinutes(minutes, { source: "artery" });
      appState.isSyncingFromArtery = false;
    },
  });

  updateRiskOutputs();
  openWelcomeModal();

  window.addEventListener("load", () => {
    if (!modalDismissed) {
      openWelcomeModal();
    }
  });
});
