export const DARK = {
  bg: "#10141B", surface: "#181E27", raised: "#212934", border: "#2C3542",
  textHi: "#EDEFF2", textLo: "#8D97A7", amber: "#E8A33D", green: "#4F9D69", red: "#D9534F", blue: "#5B8DEF",
};
export const LIGHT = {
  bg: "#F7F8FA", surface: "#FFFFFF", raised: "#F1F3F5", border: "#E4E7EC",
  textHi: "#111827", textLo: "#6B7280", amber: "#C2801F", green: "#3D8B5C", red: "#C0392B", blue: "#3B6FD6",
};
export type Theme = typeof DARK;

export type Slot = {
  id: string; slot_code: string; product_name: string;
  current_stock: number; max_stock: number; fill_pct: number;
  wholesale_price: number | null; selling_price: number | null;
};
export type Machine = { id: string; name: string; location: string; status: string; slots: Slot[] };
export type Deal = {
  id: string; store_name: string; product_name: string;
  deal_price: number; regular_price: number | null; valid_until: string; distance_km: number | null;
};

export const fillTone = (pct: number, t: Theme) => (pct < 20 ? t.red : pct < 45 ? t.amber : t.green);
export const machineFill = (m: Machine) =>
  m.slots.length ? Math.round(m.slots.reduce((a, s) => a + Number(s.fill_pct), 0) / m.slots.length) : 0;

export function friendlyError(error: { message?: string; code?: string } | null): string {
  if (!error) return "Unbekannter Fehler.";
  const msg = error.message || "";
  if (msg.includes("JWT") || msg.includes("session") || error.code === "PGRST301") {
    return "Sitzung abgelaufen — bitte neu einloggen.";
  }
  if (msg.includes("rate limit")) return "Zu viele Versuche — kurz warten und nochmal probieren.";
  if (msg.includes("duplicate key")) return "Das gibt es schon (z. B. gleicher Slot-Code).";
  if (msg.includes("Failed to fetch") || msg.includes("network")) return "Keine Verbindung — Internet prüfen.";
  return msg || "Etwas ist schiefgelaufen.";
}