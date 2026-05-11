import type { BiomarkerCatalogEntry } from "./types";

export const BIOMARKERS_CATALOG: BiomarkerCatalogEntry[] = [
  // Glucides
  { key: "glycemie",    name: "Glycémie à jeun",       unit: "mg/dL",    category: "Métabolisme glucidique", refMin: 70,   refMax: 100,  refRange: "70 - 100" },
  { key: "insuline",    name: "Insuline à jeun",        unit: "pmol/L",   category: "Métabolisme glucidique", refMin: 14,   refMax: 144,  refRange: "14 - 144" },
  { key: "homa",        name: "Index HOMA",             unit: "",         category: "Métabolisme glucidique", refMax: 1.80, refRange: "< 1.80" },
  { key: "quicki",      name: "Quicki (sensibilité insuline)", unit: "",  category: "Métabolisme glucidique", refMin: 0.35, refRange: "> 0.35" },
  { key: "hba1c",       name: "Hémoglobine glyquée (HbA1c)", unit: "%",  category: "Métabolisme glucidique", refMax: 6,    refRange: "< 6" },
  { key: "hba1c_ifcc",  name: "HbA1c (IFCC)",          unit: "mmol/mol", category: "Métabolisme glucidique", refMax: 42,   refRange: "< 42" },
  // Lipides
  { key: "chol_total",  name: "Cholestérol total",     unit: "mg/dL", category: "Lipides", refMax: 190, refRange: "< 190" },
  { key: "hdl",         name: "Cholestérol HDL",       unit: "mg/dL", category: "Lipides", refMin: 40,  refRange: "> 40" },
  { key: "ldl",         name: "Cholestérol LDL",       unit: "mg/dL", category: "Lipides", refMax: 100, refRange: "< 100" },
  { key: "triglyc",     name: "Triglycérides",         unit: "mg/dL", category: "Lipides", refMin: 40,  refMax: 150, refRange: "40 - 150" },
  // Hématologie
  { key: "hemoglobine", name: "Hémoglobine",           unit: "g/dL",  category: "Hématologie", refMin: 12,  refMax: 17,   refRange: "H:13-17 / F:12-16", refMinM: 13, refMaxM: 17, refMinF: 12, refMaxF: 16 },
  { key: "hematocrite", name: "Hématocrite",           unit: "%",     category: "Hématologie", refMin: 36,  refMax: 51,   refRange: "H:41-51 / F:36-46", refMinM: 41, refMaxM: 51, refMinF: 36, refMaxF: 46 },
  { key: "leucocytes",  name: "Globules blancs",       unit: "/mm³",  category: "Hématologie", refMin: 4000,refMax: 10000,refRange: "4000 - 10000" },
  { key: "plaquettes",  name: "Plaquettes",            unit: "/mm³",  category: "Hématologie", refMin: 150000, refMax: 400000, refRange: "150k - 400k" },
  { key: "ferritine",   name: "Ferritine",             unit: "ng/mL", category: "Hématologie", refMin: 15,  refMax: 300,  refRange: "H:15-300 / F:15-150", refMinM: 15, refMaxM: 300, refMinF: 15, refMaxF: 150 },
  // Thyroïde
  { key: "tsh",         name: "TSH",                   unit: "mU/L",  category: "Bilan thyroïdien", refMin: 0.3, refMax: 4.2,  refRange: "0.3 - 4.2" },
  { key: "t3",          name: "T3 libre",              unit: "pg/mL", category: "Bilan thyroïdien", refMin: 2,   refMax: 4.4,  refRange: "2 - 4.4" },
  { key: "t4",          name: "T4 libre",              unit: "pmol/L",category: "Bilan thyroïdien", refMin: 10.3,refMax: 20.6, refRange: "10.3 - 20.6" },
  // Vitamines
  { key: "vitd",        name: "Vitamine D (25-OH)",    unit: "ng/mL", category: "Vitamines", refMin: 30,  refMax: 100,  refRange: "30 - 100" },
  { key: "vitb12",      name: "Vitamine B12",          unit: "pg/mL", category: "Vitamines", refMin: 200, refMax: 900,  refRange: "200 - 900" },
  { key: "folates",     name: "Folates (B9)",          unit: "ng/mL", category: "Vitamines", refMin: 3,   refMax: 17,   refRange: "3 - 17" },
  // Foie / Reins
  { key: "asat",        name: "ASAT (SGOT)",           unit: "UI/L",  category: "Foie / Reins", refMax: 35,   refRange: "< 35" },
  { key: "alat",        name: "ALAT (SGPT)",           unit: "UI/L",  category: "Foie / Reins", refMax: 35,   refRange: "< 35" },
  { key: "ggt",         name: "GGT",                   unit: "UI/L",  category: "Foie / Reins", refMax: 40,   refRange: "< 40" },
  { key: "creatinine",  name: "Créatinine",            unit: "mg/dL", category: "Foie / Reins", refMin: 0.5,  refMax: 1.2, refRange: "H:0.7-1.2 / F:0.5-1.0", refMinM: 0.7, refMaxM: 1.2, refMinF: 0.5, refMaxF: 1.0 },
  { key: "uree",        name: "Urée",                  unit: "mg/dL", category: "Foie / Reins", refMin: 15,   refMax: 45,  refRange: "15 - 45" },
  // Électrolytes / Minéraux
  { key: "sodium",      name: "Sodium",                unit: "mmol/L", category: "Électrolytes", refMin: 135,  refMax: 145, refRange: "135 - 145" },
  { key: "potassium",   name: "Potassium",             unit: "mmol/L", category: "Électrolytes", refMin: 3.5,  refMax: 5.0, refRange: "3.5 - 5.0" },
  { key: "calcium",     name: "Calcium",               unit: "mmol/L", category: "Électrolytes", refMin: 2.2,  refMax: 2.6, refRange: "2.2 - 2.6" },
  { key: "magnesium",   name: "Magnésium",             unit: "mmol/L", category: "Électrolytes", refMin: 0.75, refMax: 1.0, refRange: "0.75 - 1.0" },
  // Inflammation / Marqueurs spéciaux
  { key: "crp",         name: "CRP (Protéine C-réactive)", unit: "mg/L", category: "Inflammation", refMax: 5, refRange: "< 5" },
  { key: "amylase",     name: "Amylase",               unit: "U/L",   category: "Pancréas",   refMax: 100, refRange: "< 100" },
  { key: "psa",         name: "PSA",                   unit: "ng/mL", category: "Homme",      refMax: 4,   refRange: "< 4" },
];

export function flagForValue(entry: BiomarkerCatalogEntry, value: number, sex?: "M" | "F"): "low" | "high" | "normal" {
  const min = (sex === "M" && entry.refMinM !== undefined) ? entry.refMinM
             : (sex === "F" && entry.refMinF !== undefined) ? entry.refMinF
             : entry.refMin;
  const max = (sex === "M" && entry.refMaxM !== undefined) ? entry.refMaxM
             : (sex === "F" && entry.refMaxF !== undefined) ? entry.refMaxF
             : entry.refMax;
  if (min !== undefined && value < min) return "low";
  if (max !== undefined && value > max) return "high";
  return "normal";
}
