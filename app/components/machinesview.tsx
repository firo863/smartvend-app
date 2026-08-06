"use client";
import { Plus, MapPin, Package, Pencil, Trash2 } from "lucide-react";
import { Machine, Theme, fillTone, machineFill } from "@/lib/types";

type MachineForm = { name: string; location: string };
type SlotForm = { slot_code: string; product_name: string; max_stock: string; current_stock: string };

export default function MachinesView({
  machines, expandedMachine, setExpandedMachine,
  showMachineForm, setShowMachineForm, machineForm, setMachineForm, onAddMachine,
  slotFormFor, setSlotFormFor, slotForm, setSlotForm, onAddSlot,
  onUpdateStock, onUpdatePrices, onDeleteMachine, savingId, theme, T,
}: {
  machines: Machine[];
  expandedMachine: string | null;
  setExpandedMachine: (v: string | null) => void;
  showMachineForm: boolean;
  setShowMachineForm: (v: boolean) => void;
  machineForm: MachineForm;
  setMachineForm: (v: MachineForm) => void;
  onAddMachine: () => void;
  slotFormFor: string | null;
  setSlotFormFor: (v: string | null) => void;
  slotForm: SlotForm;
  setSlotForm: (v: SlotForm) => void;
  onAddSlot: (machineId: string) => void;
  onUpdateStock: (slotId: string, newStock: number, maxStock: number) => void;
  onUpdatePrices: (slotId: string, wholesale: number | null, selling: number | null) => void;
  onDeleteMachine: (machineId: string, name: string) => void;
  savingId: string | null;
  theme: "dark" | "light";
  T: Theme;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setShowMachineForm(!showMachineForm)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs" style={{ background: T.raised, color: T.textHi }}>
          <Plus size={13} /> Automat hinzufügen
        </button>
      </div>
      {showMachineForm && (
        <div className="mb-4 max-w-md rounded-lg border p-3.5" style={{ borderColor: T.border, background: T.surface }}>
          <div className="space-y-2">
            <input placeholder="Name (z.B. Automat Bahnhof)" value={machineForm.name} onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
              className="w-full rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
            <input placeholder="Standort" value={machineForm.location} onChange={(e) => setMachineForm({ ...machineForm, location: e.target.value })}
              className="w-full rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
          </div>
          <button onClick={onAddMachine} className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: T.amber, color: theme === "dark" ? T.bg : "#fff" }}>Speichern</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {machines.map((m) => {
          const avgFill = machineFill(m);
          const critical = avgFill < 20;
          const expanded = expandedMachine === m.id;
          return (
            <div key={m.id} className="rounded-lg border p-4" style={{ borderColor: critical ? `${T.red}80` : T.border, background: T.surface }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{m.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: T.textLo }}><MapPin size={11} />{m.location}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold" style={{ color: m.slots.length ? fillTone(avgFill, T) : T.textLo }}>{m.slots.length ? `${avgFill}%` : "—"}</span>
                  <button onClick={() => onDeleteMachine(m.id, m.name)} title="Automat löschen" style={{ color: T.textLo }} className="rounded p-1 hover:text-[#D9534F]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {m.slots.length > 0 && (
                <div className="mt-3 flex h-9 items-end gap-[3px]">
                  {m.slots.map((s) => (
                    <div key={s.id} title={`${s.slot_code}: ${s.fill_pct}%`}
                      style={{ height: `${Math.max(Number(s.fill_pct), 6)}%`, background: fillTone(Number(s.fill_pct), T) }}
                      className="w-2.5 rounded-t-sm" />
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: T.border }}>
                {m.slots.length === 0 && <p className="text-xs" style={{ color: T.textLo }}>Noch keine Slots — leg unten den ersten an.</p>}
                {m.slots.map((s) => {
                  const isSaving = savingId === s.id;
                  return (
                    <div key={s.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Package size={12} style={{ color: T.textLo }} />{s.slot_code} · {s.product_name}</span>
                        <span className="flex items-center gap-1.5">
                          <input type="number" defaultValue={s.current_stock} min={0} max={s.max_stock} disabled={isSaving}
                            onBlur={(e) => onUpdateStock(s.id, parseInt(e.target.value || "0", 10), s.max_stock)}
                            style={{ background: T.bg, borderColor: T.border, color: T.textHi }}
                            className="w-12 rounded border px-1.5 py-0.5 text-right font-mono text-xs disabled:opacity-50" />
                          <span style={{ color: T.textLo }} className="font-mono">/ {s.max_stock}</span>
                        </span>
                      </div>
                      {expanded && (
                        <div className="mt-1 flex items-center gap-2 pl-5">
                          <span style={{ color: T.textLo }}>EK</span>
                          <input type="number" step="0.01" defaultValue={s.wholesale_price ?? ""}
                            onBlur={(e) => onUpdatePrices(s.id, e.target.value ? parseFloat(e.target.value) : null, s.selling_price)}
                            style={{ background: T.bg, borderColor: T.border, color: T.textHi }}
                            className="w-16 rounded border px-1.5 py-0.5 text-right font-mono text-[11px]" />
                          <span style={{ color: T.textLo }}>VK</span>
                          <input type="number" step="0.01" defaultValue={s.selling_price ?? ""}
                            onBlur={(e) => onUpdatePrices(s.id, s.wholesale_price, e.target.value ? parseFloat(e.target.value) : null)}
                            style={{ background: T.bg, borderColor: T.border, color: T.textHi }}
                            className="w-16 rounded border px-1.5 py-0.5 text-right font-mono text-[11px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {slotFormFor === m.id && (
                <div className="mt-3 space-y-1.5 rounded-md p-2.5" style={{ background: T.raised }}>
                  <div className="flex gap-1.5">
                    <input placeholder="Slot (A1)" value={slotForm.slot_code} onChange={(e) => setSlotForm({ ...slotForm, slot_code: e.target.value })}
                      className="w-16 rounded border px-1.5 py-1 text-[11px]" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                    <input placeholder="Produkt" value={slotForm.product_name} onChange={(e) => setSlotForm({ ...slotForm, product_name: e.target.value })}
                      className="flex-1 rounded border px-1.5 py-1 text-[11px]" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input type="number" placeholder="Aktuell" value={slotForm.current_stock} onChange={(e) => setSlotForm({ ...slotForm, current_stock: e.target.value })}
                      className="w-16 rounded border px-1.5 py-1 text-[11px]" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                    <span style={{ color: T.textLo }} className="text-[11px]">/</span>
                    <input type="number" placeholder="Max" value={slotForm.max_stock} onChange={(e) => setSlotForm({ ...slotForm, max_stock: e.target.value })}
                      className="w-16 rounded border px-1.5 py-1 text-[11px]" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                    <button onClick={() => onAddSlot(m.id)} className="ml-auto rounded-md px-2.5 py-1 text-[11px] font-medium" style={{ background: T.amber, color: theme === "dark" ? T.bg : "#fff" }}>Speichern</button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-1">
                <button onClick={() => setExpandedMachine(expanded ? null : m.id)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px]" style={{ color: T.textLo }}>
                  <Pencil size={12} /> {expanded ? "Preise ausblenden" : "Preise bearbeiten"}
                </button>
                <button onClick={() => setSlotFormFor(slotFormFor === m.id ? null : m.id)}
                  className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px]" style={{ color: T.textLo }}>
                  <Plus size={12} /> Slot
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}