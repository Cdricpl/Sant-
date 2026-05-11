// Stable color palette per person. Returns Tailwind-friendly classes.
export type PersonPalette = {
  badge: string;        // bg + text
  border: string;       // border-l color
  dot: string;          // bg dot
  ring: string;         // ring color
  soft: string;         // soft bg
};

const PALETTES: PersonPalette[] = [
  { badge: "bg-sky-100 text-sky-800",        border: "border-sky-500",      dot: "bg-sky-500",      ring: "ring-sky-300",      soft: "bg-sky-50" },
  { badge: "bg-rose-100 text-rose-800",      border: "border-rose-500",     dot: "bg-rose-500",     ring: "ring-rose-300",     soft: "bg-rose-50" },
  { badge: "bg-violet-100 text-violet-800",  border: "border-violet-500",   dot: "bg-violet-500",   ring: "ring-violet-300",   soft: "bg-violet-50" },
  { badge: "bg-emerald-100 text-emerald-800",border: "border-emerald-500",  dot: "bg-emerald-500",  ring: "ring-emerald-300",  soft: "bg-emerald-50" },
  { badge: "bg-amber-100 text-amber-800",    border: "border-amber-500",    dot: "bg-amber-500",    ring: "ring-amber-300",    soft: "bg-amber-50" },
  { badge: "bg-cyan-100 text-cyan-800",      border: "border-cyan-500",     dot: "bg-cyan-500",     ring: "ring-cyan-300",     soft: "bg-cyan-50" },
];

export function colorForPerson(name: string, allNames: string[]): PersonPalette {
  // "Moi" is always first palette
  if (name === "Moi") return PALETTES[0];
  const others = allNames.filter((n) => n !== "Moi");
  const idx = others.indexOf(name);
  if (idx < 0) return PALETTES[PALETTES.length - 1];
  return PALETTES[(idx % (PALETTES.length - 1)) + 1];
}
