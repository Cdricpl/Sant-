import type { BiomarkerCatalogEntry } from "./types";

export const BIOMARKERS_CATALOG: BiomarkerCatalogEntry[] = [
  // Glucides
  { key: "glycemie",    name: "Glycémie à jeun",       unit: "mg/dL", category: "Métabolisme glucidique", refMin: 70,  refMax: 100, refRange: "70 - 100" },
  { key: "hba1c",       name: "Hémoglobine glyquée (HbA1c)", unit: "%", category: "Métabolisme glucidique", refMin: 4,   refMax: 5.6, refRange: "4 - 5.6" },
  // Lipides
  { key: "chol_total",  name: "Cholestérol total",     unit: "mg/dL", category: "Lipides", refMax: 200, refRange: "< 200" },
  { key: "hdl",         name: "HDL",                   unit: "mg/dL", category: "Lipides", refMin: 40,  refRange: "> 40" },
  { key: "ldl",         name: "LDL",                   unit: "mg/dL", category: "Lipides", refMax: 130, refRange: "< 130" },
  { key: "triglyc",     name: "Triglycérides",         unit: "mg/dL", category: "Lipides", refMax: 150, refRange: "< 150" },
  // Hématologie
  { key: "hemoglobine", name: "Hémoglobine",           unit: "g/dL",  category: "Hématologie", refMin: 12,  refMax: 16,   refRange: "12 - 16" },
  { key: "hematocrite", name: "Hématocrite",           unit: "%",     category: "Hématologie", refMin: 36,  refMax: 46,   refRange: "36 - 46" },
  { key: "leucocytes",  name: "Globules blancs",       unit: "/mm³",  category: "Hématologie", refMin: 4000,refMax: 10000,refRange: "4000 - 10000" },
  { key: "plaquettes",  name: "Plaquettes",            unit: "/mm³",  category: "Hématologie", refMin: 150000, refMax: 400000, refRange: "150k - 400k" },
  { key: "ferritine",   name: "Ferritine",             unit: "ng/mL", category: "Hématologie", refMin: 15,  refMax: 200,  refRange: "15 - 200" },
  // Thyroïde
  { key: "tsh",         name: "TSH",                   unit: "mUI/L", category: "Bilan thyroïdien", refMin: 0.4, refMax: 4,    refRange: "0.4 - 4" },
  { key: "t3",          name: "T3 libre",              unit: "pg/mL", category: "Bilan thyroïdien", refMin: 2,   refMax: 4.4,  refRange: "2 - 4.4" },
  { key: "t4",          name: "T4 libre",              unit: "ng/dL", category: "Bilan thyroïdien", refMin: 0.8, refMax: 1.8,  refRange: "0.8 - 1.8" },
  // Vitamines
  { key: "vitd",        name: "Vitamine D (25-OH)",    unit: "ng/mL", category: "Vitamines", refMin: 30,  refMax: 100,  refRange: "30 - 100" },
  { key: "vitb12",      name: "Vitamine B12",          unit: "pg/mL", category: "Vitamines", refMin: 200, refMax: 900,  refRange: "200 - 900" },
  { key: "folates",     name: "Folates (B9)",          unit: "ng/mL", category: "Vitamines", refMin: 3,   refMax: 17,   refRange: "3 - 17" },
  // Foie / Reins
  { key: "asat",        name: "ASAT (SGOT)",           unit: "UI/L",  category: "Foie / Reins", refMax: 35,   refRange: "< 35" },
  { key: "alat",        name: "ALAT (SGPT)",           unit: "UI/L",  category: "Foie / Reins", refMax: 35,   refRange: "< 35" },
  { key: "ggt",         name: "GGT",                   unit: "UI/L",  category: "Foie / Reins", refMax: 40,   refRange: "< 40" },
  { key: "creatinine",  name: "Créatinine",            unit: "mg/dL", category: "Foie / Reins", refMin: 0.6,  refMax: 1.1, refRange: "0.6 - 1.1" },
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

export function flagForValue(entry: BiomarkerCatalogEntry, value: number): "low" | "high" | "normal" {
  if (entry.refMin !== undefined && value < entry.refMin) return "low";
  if (entry.refMax !== undefined && value > entry.refMax) return "high";
  return "normal";
}
