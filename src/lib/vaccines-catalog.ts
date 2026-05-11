type VaccineCatalogEntry = {
  key: string;
  name: string;
  description: string;
  // Months between doses for typical rappel; undefined = no scheduled rappel
  rappelMonths?: number;
};

export const VACCINES_CATALOG: VaccineCatalogEntry[] = [
  { key: "dtp",      name: "DTPolio (Diphérie, Tétanos, Polio)", description: "Rappel tous les 10 ans (adulte)", rappelMonths: 120 },
  { key: "ror",      name: "ROR (Rougeole, Oreillons, Rubéole)",  description: "2 doses recommandées" },
  { key: "hepb",     name: "Hépatite B",                          description: "Schéma 0-1-6 mois" },
  { key: "hepa",     name: "Hépatite A",                          description: "Voyage / risque accru" },
  { key: "meninc",   name: "Méningocoque C",                      description: "Nourrisson + adolescent" },
  { key: "menacwy",  name: "Méningocoque ACWY",                   description: "Adolescent / voyage" },
  { key: "pneumo",   name: "Pneumocoque",                         description: "Nourrisson / personne à risque" },
  { key: "rota",     name: "Rotavirus",                           description: "Nourrisson" },
  { key: "varicelle",name: "Varicelle",                           description: "2 doses" },
  { key: "hpv",      name: "Papillomavirus (HPV)",                description: "Adolescent(e)s" },
  { key: "grippe",   name: "Grippe saisonnière",                  description: "Tous les ans", rappelMonths: 12 },
  { key: "covid",    name: "COVID-19",                            description: "Selon recommandations" },
  { key: "tetanos",  name: "Tétanos (rappel)",                    description: "Tous les 20 ans (25-65 ans)", rappelMonths: 240 },
  { key: "coq",      name: "Coqueluche",                          description: "Rappel adulte / future maman" },
  { key: "bcg",      name: "BCG (Tuberculose)",                   description: "Selon contexte" },
  { key: "fjaune",   name: "Fièvre jaune",                        description: "Voyage zone d'endémie" },
  { key: "zona",     name: "Zona (Shingrix)",                      description: "Adulte ≥ 50 ans, 2 doses", rappelMonths: 2 },
  { key: "rsv",      name: "RSV (Virus Syncytial Respiratoire)",   description: "Adulte ≥ 60 ans" },
  { key: "tdap",     name: "Coqueluche adulte (Tdap)",             description: "Rappel tous les 10 ans", rappelMonths: 120 },
  { key: "mpox",     name: "Mpox (Variole du singe)",              description: "Adulte selon exposition" },
];
