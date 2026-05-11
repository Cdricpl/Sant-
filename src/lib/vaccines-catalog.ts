export type VaccineCatalogCategory =
  | "nourrisson"
  | "enfant"
  | "ado"
  | "adulte"
  | "risque"
  | "voyage";

export const CATEGORY_LABELS: Record<VaccineCatalogCategory, string> = {
  nourrisson: "Nourrisson (0–18 mois)",
  enfant:     "Enfant (2–12 ans)",
  ado:        "Adolescent (12–18 ans)",
  adulte:     "Adulte",
  risque:     "Groupes à risque",
  voyage:     "Voyage",
};

type VaccineCatalogEntry = {
  key: string;
  name: string;
  description: string;
  category: VaccineCatalogCategory;
  rappelMonths?: number;
};

// Calendrier vaccinal belge (Programme National de Vaccination – 2024)
export const VACCINES_CATALOG: VaccineCatalogEntry[] = [
  // ── Nourrisson ──────────────────────────────────────────────────────────────────────────────\n  { key: "hexavalent", name: "Hexavalent (DTPa-IPV-Hib-HepB)",  description: "8 sem • 16 sem • 12 mois — Infanrix Hexa / Hexyon", category: "nourrisson" },
  { key: "menb",       name: "Méningocoque B (Bexsero)",         description: "8 sem • 16 sem • 12 mois",                           category: "nourrisson" },
  { key: "rota",       name: "Rotavirus (Rotarix)",              description: "8 sem • 16 sem (voie orale)",                        category: "nourrisson" },
  { key: "pneumo13",   name: "Pneumocoque 13 (Prevenar 13)",     description: "8 sem • 16 sem • 12 mois",                           category: "nourrisson" },
  { key: "menc",       name: "Méningocoque C",                   description: "12–15 mois",                                         category: "nourrisson" },

  // ── Enfant ─────────────────────────────────────────────────────────────────────────────────\n  { key: "ror",        name: "RRO (Rougeole-Oreillons-Rubéole)", description: "12 mois + rappel 11–12 ans",                         category: "enfant" },
  { key: "dtpaipv",    name: "DTPa-IPV (rappel enfant)",         description: "5–6 ans — Infanrix IPV / Tetravac",                  category: "enfant" },
  { key: "varicelle",  name: "Varicelle",                        description: "12 mois + 2e dose à 3 mois d'intervalle",            category: "enfant" },

  // ── Adolescent ────────────────────────────────────────────────────────────────────────────\n  { key: "hpv",        name: "HPV (Gardasil 9)",                 description: "12–13 ans — 2 doses (0 et 6 mois)",                  category: "ado" },
  { key: "tdpaipv",    name: "Tdpa-IPV (rappel ado)",            description: "14–16 ans",                                          category: "ado", rappelMonths: 120 },
  { key: "menacwy",    name: "Méningocoque ACWY",                 description: "Adolescent / jeune adulte",                          category: "ado" },

  // ── Adulte ────────────────────────────────────────────────────────────────────────────────\n  { key: "dtp",        name: "DTP (rappel adulte)",              description: "Tous les 10 ans",                                    category: "adulte", rappelMonths: 120 },
  { key: "grippe",     name: "Grippe saisonnière",               description: "Chaque automne — recommandé ≥ 65 ans & groupes à risque", category: "adulte", rappelMonths: 12 },
  { key: "covid",      name: "COVID-19",                         description: "Selon recommandations en vigueur",                   category: "adulte" },
  { key: "coq",        name: "Coqueluche (rappel adulte)",       description: "Future maman, entourage d'un nourrisson",            category: "adulte" },
  { key: "hepb",       name: "Hépatite B",                       description: "Adulte non immunisé — schéma 0-1-6 mois",            category: "adulte" },

  // ── Groupes à risque ────────────────────────────────────────────────────────────────────────\n  { key: "zona",       name: "Zona (Shingrix)",                  description: "≥ 65 ans (remboursé) — 2 doses à 2 mois d'intervalle", category: "risque", rappelMonths: 2 },
  { key: "rsv",        name: "RSV (Abrysvo/mResvia)",            description: "≥ 60 ans ou grossesse (3e trimestre)",               category: "risque" },
  { key: "pneumo23",   name: "Pneumocoque 23 (Pneumovax 23)",    description: "≥ 65 ans ou immunodéprimé",                          category: "risque" },
  { key: "bcg",        name: "BCG (Tuberculose)",                description: "Nourrisson à risque élevé selon contexte familial",  category: "risque" },
  { key: "mpox",       name: "Mpox (Imvanex)",                   description: "Adulte selon exposition / recommandation",           category: "risque" },

  // ── Voyage ─────────────────────────────────────────────────────────────────────────────────\n  { key: "hepa",       name: "Hépatite A",                       description: "Zone d'endémie — 2 doses (0 et 6–12 mois)",          category: "voyage" },
  { key: "fjaune",     name: "Fièvre jaune",                     description: "Obligatoire pour certains pays tropicaux",           category: "voyage" },
  { key: "typhoide",   name: "Typhoïde (Typhim Vi)",             description: "Pays à risque — rappel tous les 3 ans",              category: "voyage", rappelMonths: 36 },
  { key: "enctiqu",    name: "Encéphalite à tiques (TBE)",       description: "Forêts Europe centrale/orientale",                   category: "voyage" },
  { key: "encjap",     name: "Encéphalite japonaise (Ixiaro)",   description: "Asie rurale",                                        category: "voyage" },
  { key: "rage",       name: "Rage (préventive)",                description: "Long séjour pays à risque",                          category: "voyage" },
  { key: "cholera",    name: "Choléra / ETEC (Dukoral)",         description: "Voyageur à risque — diarrhée du voyageur",           category: "voyage" },
  { key: "menacwy_v",  name: "Méningocoque ACWY (voyage)",       description: "Pèlerinage La Mecque, Afrique sub-saharienne",       category: "voyage" },
];

export const VACCINES_BY_CATEGORY = Object.fromEntries(
  (Object.keys(CATEGORY_LABELS) as VaccineCatalogCategory[]).map((cat) => [
    cat,
    VACCINES_CATALOG.filter((v) => v.category === cat),
  ]),
) as Record<VaccineCatalogCategory, typeof VACCINES_CATALOG>;
