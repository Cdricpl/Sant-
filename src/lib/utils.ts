import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () => crypto.randomUUID();
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
