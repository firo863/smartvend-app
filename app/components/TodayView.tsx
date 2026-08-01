"use client";
import { AlertTriangle, PiggyBank, Percent, MapPin, CheckCircle2, Circle, X } from "lucide-react";
import { Machine, Theme, fillTone, machineFill } from "@/lib/types";

export default function TodayView({
  machines, criticalMachines, totalSavings, avgMargin, alertsOpen, setAlertsOpen, onRestockSlot, savingId, T,
}: {
  machines: Machine[];
  criticalMachines: Machine[];
  totalSavings: number;
  avgMargin: string | null;
  alertsOpen: boolean;
  setAlertsOpen: (v: boolean) => void;
  onRestockSlot: (machineId: string, slotId: string, maxStock: number) => void;
  savingId: string | null;
  T: Theme;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="mb-2 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[130px] rounded-lg border p-3.5" style={{ borderColor: T.border, background: T.surface }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textLo }}>Kritisch</span>
            <AlertTriangle size={13} style={{ color: T.red }} />
          </div>
          <div className="mt-1 font-mono text-xl font-semibold">{criticalMachines.length}</div>
          <div className="text-[11px]" style={{ color: T.textLo }}>Automaten &lt; 20%</div>
        </div>
        <div className="flex-1 min-w-[130px] rounded-lg border p-3.5" style={{ borderColor: T.border, background: T.surface }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textLo }}>Ersparnis</span>
            <PiggyBank size={13} style={{ color: T.amber }} />
          </div>
          <div className="mt-1 font-mono text-xl font-semibold">{totalSavings.toFixed(2)} €</div>
          <div className="text-[11px]" style={{ color: T.textLo }}>via Deal-Radar, aktueller Bedarf</div>
        </div>
        <div className="flex-1 min-w-[130px] rounded-lg border p-3.5" style={{ borderColor: T.border, background: T.surface }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textLo }}>Ø Marge</span>
            <Percent size={13} style={{ color: T.green }} />
          </div>
          <div className="mt-1 font-mono text-xl font-semibold">{avgMargin != null ? `${avgMargin}%` : "—"}</div>
          <div className="text-[11px]" style={{ color: T.textLo }}>{avgMargin != null ? "aus hinterlegten Preisen" : "noch keine Preise"}</div>
        </div>
      </div>

      {alertsOpen && criticalMachines.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border p-3.5" style={{ borderColor: `${T.red}66`, background: `${T.red}1A` }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: T.red }} />
          <div className="flex-1 text-sm">
            <span className="font-medium">{criticalMachines.length === 1 ? "1 Automat" : `${criticalMachines.length} Automaten`}</span>{" "}
            {criticalMachines.length === 1 ? "braucht" : "brauchen"} heute Aufmerksamkeit.
          </div>
          <button onClick={() => setAlertsOpen(false)} style={{ color: T.textLo }}><X size={15} /></button>
        </div>
      )}
      {criticalMachines.length === 0 && (
        <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: T.border, background: T.surface, color: T.textLo }}>
          <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: T.green }} />
          Alle Automaten gut gefüllt.
        </div>
      )}
      {criticalMachines.map((m) => (
        <div key={m.id} className="rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{m.name}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: T.textLo }}><MapPin size={11} />{m.location}</div>
            </div>
            <span className="font-mono text-lg font-semibold" style={{ color: fillTone(machineFill(m), T) }}>{machineFill(m)}%</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {m.slots.filter((s) => s.fill_pct < 45).map((s) => {
              const isSaving = savingId === s.id;
              return (
                <button
                  key={s.id}
                  disabled={isSaving}
                  onClick={() => onRestockSlot(m.id, s.id, s.max_stock)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs disabled:opacity-50"
                  style={{ background: T.raised }}
                >
                  <span className="flex items-center gap-2">
                    {s.current_stock === s.max_stock ? <CheckCircle2 size={15} style={{ color: T.green }} /> : <Circle size={15} style={{ color: T.border }} />}
                    {s.slot_code} · {s.product_name}
                  </span>
                  <span className="font-mono" style={{ color: fillTone(s.fill_pct, T) }}>
                    {isSaving ? "speichert…" : `${s.fill_pct}% → Tippen zum Auffüllen`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
