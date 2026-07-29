"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { MapPin, AlertTriangle, RefreshCw, Package } from "lucide-react";

const COLOR = {
  bg: "#10141B",
  surface: "#181E27",
  border: "#2C3542",
  textHi: "#EDEFF2",
  textLo: "#8D97A7",
  amber: "#E8A33D",
  green: "#4F9D69",
  red: "#D9534F",
};

type Slot = {
  id: string;
  slot_code: string;
  product_name: string;
  current_stock: number;
  max_stock: number;
  fill_pct: number;
};

type Machine = {
  id: string;
  name: string;
  location: string;
  status: string;
  slots: Slot[];
};

const fillTone = (pct: number) => {
  if (pct < 20) return COLOR.red;
  if (pct < 45) return COLOR.amber;
  return COLOR.green;
};

export default function Dashboard() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error } = await supabase
      .from("machines")
      .select("id, name, location, status, slots(id, slot_code, product_name, current_stock, max_stock, fill_pct)");

    if (!error && data) setMachines(data as Machine[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStock = async (slotId: string, newStock: number, maxStock: number) => {
    const clamped = Math.max(0, Math.min(newStock, maxStock));
    setSavingSlot(slotId);
    const { error } = await supabase
      .from("slots")
      .update({ current_stock: clamped, updated_at: new Date().toISOString() })
      .eq("id", slotId);
    if (!error) {
      setMachines((prev) => prev.map((m) => ({
        ...m,
        slots: m.slots.map((s) => (s.id !== slotId ? s : { ...s, current_stock: clamped, fill_pct: Math.round((clamped / maxStock) * 100) })),
      })));
    }
    setSavingSlot(null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ background: COLOR.bg, minHeight: "100dvh", color: COLOR.textLo }} className="flex items-center justify-center text-sm">
        Lädt…
      </div>
    );
  }

  return (
    <div style={{ background: COLOR.bg, minHeight: "100dvh" }} className="p-5 font-sans sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div style={{ color: COLOR.amber }} className="text-[11px] font-semibold uppercase tracking-widest">SmartVend · Pilot</div>
          <h1 style={{ color: COLOR.textHi }} className="mt-1 text-xl font-semibold sm:text-2xl">Meine Automaten</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Neu laden" style={{ borderColor: COLOR.border, color: COLOR.textLo }} className="rounded-md border p-2 hover:brightness-125">
            <RefreshCw size={15} />
          </button>
          <button onClick={logout} style={{ borderColor: COLOR.border, color: COLOR.textLo }} className="rounded-md border px-3 py-1.5 text-xs hover:brightness-125">
            Logout
          </button>
        </div>
      </div>

      {machines.length === 0 && (
        <div style={{ background: COLOR.surface, borderColor: COLOR.border, color: COLOR.textLo }} className="rounded-lg border p-6 text-center text-sm">
          Noch keine Automaten hinterlegt.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {machines.map((m) => {
          const avgFill = m.slots.length ? Math.round(m.slots.reduce((a, s) => a + Number(s.fill_pct), 0) / m.slots.length) : 0;
          const critical = avgFill < 20;
          return (
            <div key={m.id} style={{ background: COLOR.surface, borderColor: critical ? `${COLOR.red}80` : COLOR.border }} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ color: COLOR.textHi }} className="text-sm font-semibold">{m.name}</h3>
                  <div style={{ color: COLOR.textLo }} className="mt-0.5 flex items-center gap-1 text-xs">
                    <MapPin size={11} />{m.location}
                  </div>
                </div>
                <span style={{ color: fillTone(avgFill) }} className="font-mono text-lg font-semibold">{avgFill}%</span>
              </div>

              <div className="mt-3 flex h-9 items-end gap-[3px]">
                {m.slots.map((s) => (
                  <div key={s.id} title={`${s.slot_code}: ${s.fill_pct}%`}
                    style={{ height: `${Math.max(Number(s.fill_pct), 6)}%`, backgroundColor: fillTone(Number(s.fill_pct)) }}
                    className="w-2.5 rounded-t-sm" />
                ))}
              </div>

              <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: COLOR.border }}>
                {m.slots.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: COLOR.textHi }} className="flex items-center gap-1.5">
                      <Package size={12} style={{ color: COLOR.textLo }} />{s.slot_code} · {s.product_name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <input type="number" defaultValue={s.current_stock} min={0} max={s.max_stock}
                        disabled={savingSlot === s.id}
                        onBlur={(e) => updateStock(s.id, parseInt(e.target.value || "0", 10), s.max_stock)}
                        style={{ background: COLOR.bg, borderColor: COLOR.border, color: COLOR.textHi }}
                        className="w-12 rounded border px-1.5 py-0.5 text-right font-mono text-xs" />
                      <span style={{ color: COLOR.textLo }} className="font-mono">/ {s.max_stock}</span>
                    </span>
                  </div>
                ))}
              </div>

              {critical && (
                <div style={{ background: `${COLOR.red}1A`, color: COLOR.red }} className="mt-3 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs">
                  <AlertTriangle size={12} />Nachfüllung dringend empfohlen
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}