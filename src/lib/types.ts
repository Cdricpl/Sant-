export type WeightEntry = { id: string; date: string; weight: number; height: number; notes?: string };

export type MedFreq = "matin" | "midi" | "soir";
export type Medication = {
  id: string;
  name: string;
  quantity: string;
  times: MedFreq[];
  startDate?: string;
  endDate?: string;
};
// keyed by `${date}|${medId}|${time}` -> true
export type MedLog = Record<string, boolean>;

export type MedTimes = Record<MedFreq, string>; // "HH:MM"

export type Biomarker = {
  id: string;
  category: string;
  name: string;
  value: string;
  unit: string;
  refRange: string;
  date: string;
  flag?: "low" | "high" | "normal";
};

export type BiomarkerCatalogEntry = {
  key: string;
  name: string;
  unit: string;
  category: string;
  refMin?: number;
  refMax?: number;
  refRange: string;
};

export type AppointmentKind =
  | "Médecin"
  | "Dentiste"
  | "Dermato"
  | "ORL"
  | "Ophtalmo"
  | "Gynéco"
  | "Pédiatre"
  | "Kiné"
  | "Autre";

export type Appointment = {
  id: string;
  who: string;
  kind: AppointmentKind;
  customKind?: string;
  date: string;
  practitioner?: string;
  notes?: string;
  isCompleted?: boolean;
  outcome?: string;
};

export type Child = {
  id: string;
  name: string;
  birthDate: string;
  notes?: string;
};

export type Vaccine = {
  id: string;
  who: string;
  name: string;
  date: string;
  nextDate?: string;
  notes?: string;
  batch?: string;
  manufacturer?: string;
};
