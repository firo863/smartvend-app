"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, Package, Tag, ShoppingCart, BarChart3, MapPin, AlertTriangle,
  Plus, RefreshCw, LogOut, CheckCircle2, Circle, X, Pencil, PiggyBank, Percent,
} from "lucide-react";

const DARK = {
  bg: "#10141B", surface: "#181E27", raised: "#212934", border: "#2C3542",
  textHi: "#EDEFF2", textLo: "#8D97A7", amber: "#E8A33D", green: "#4F9D69", red: "#D9534F", blue: "#5B8DEF",
};
const LIGHT = {
  bg: "#F7F8FA", surface: "#FFFFFF", raised: "#F1F3F5", border: "#E4E7EC",
  textHi: "#111827", textLo: "#6B7280", amber: "#C2801F", green: "#3D8B5C", red: "#C0392B", blue: "#3B6FD6",
};

type Slot = {
  id: string; slot_code: string; product_name: string;
  current_stock: number; max_stock: number; fill_pct: number;
  wholesale_price: number | null; selling_price: number | null;
};
type Machine = { id: string; name: string; location: string; status: string; slots: Slot[] };
type Deal = {
  id: string; store_name: string; product_name: string;
  deal_price: number; regular_price: number | null; valid_until: string; distance_km: number | null;
};

const fillTone = (pct: number, t: typeof DARK) => (pct < 20 ? t.red : pct < 45 ? t.amber : t.green);
const machineFill = (m: Machine) =>
  m.slots.length ? Math.round(m.slots.reduce((a, s) => a + Number(s.fill_pct), 0) / m.slots.length) : 0;

const NAV_ITEMS = [
  { id: "today", label: "Heute", icon: Sun },
  { id: "machines", label: "Automaten", icon: Package },
  { id: "deals", label: "Deal-Radar", icon: Tag },
  { id: "shopping", label: "Einkaufsliste", icon: ShoppingCart },
  { id: "margins", label: "Marge-Analyse", icon: BarChart3 },
];

export default function Dashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const T = theme === "dark" ? DARK : LIGHT;

  const [userId, setUserId] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("today");
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null);
  const [showDealForm, setShowDealForm] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [machineForm, setMachineForm] = useState({ name: "", location: "" });
  const [slotFormFor, setSlotFormFor] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState({ slot_code: "", product_name: "", max_stock: "10", current_stock: "10" });
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("smartvend-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("smartvend-theme", next);
  };

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserId(user.id);

    const { data: machinesData } = await supabase
      .from("machines")
      .select("id, name, location, status, slots(id, slot_code, product_name, current_stock, max_stock, fill_pct, wholesale_price, selling_price)");
    if (machinesData) setMachines(machinesData as Machine[]);

    const { data: dealsData } = await supabase
      .from("deals")
      .select("id, store_name, product_name, deal_price, regular_price, valid_until, distance_km")
      .gte("valid_until", new Date().toISOString().slice(0, 10))
      .order("valid_until", { ascending: true });
    if (dealsData) setDeals(dealsData as Deal[]);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addMachine = async () => {
    if (!userId || !machineForm.name || !machineForm.location) return;
    const { data, error } = await supabase
      .from("machines")
      .insert({ owner_id: userId, name: machineForm.name, location: machineForm.location, status: "active" })
      .select()
      .single();
    if (!error && data) {
      setMachines((prev) => [...prev, { ...(data as any), slots: [] }]);
      setMachineForm({ name: "", location: "" });
      setShowMachineForm(false);
    }
  };

  const addSlot = async (machineId: string) => {
    if (!slotForm.slot_code || !slotForm.product_name) return;
    const maxStock = parseInt(slotForm.max_stock || "10", 10);
    const currentStock = Math.min(parseInt(slotForm.current_stock || "0", 10), maxStock);
    const { data, error } = await supabase
      .from("slots")
      .insert({ machine_id: machineId, slot_code: slotForm.slot_code, product_name: slotForm.product_name, max_stock: maxStock, current_stock: currentStock })
      .select()
      .single();
    if (!error && data) {
      setMachines((prev) => prev.map((m) => m.id !== machineId ? m : { ...m, slots: [...m.slots, data as Slot] }));
      setSlotForm({ slot_code: "", product_name: "", max_stock: "10", current_stock: "10" });
      setSlotFormFor(null);
    }
  };

  const updateStock = async (slotId: string, newStock: number, maxStock: number) => {
    const clamped = Math.max(0, Math.min(newStock, maxStock));
    await supabase.from("slots").update({ current_stock: clamped, updated_at: new Date().toISOString() }).eq("id", slotId);
    setMachines((prev) => prev.map((m) => ({
      ...m,
      slots: m.slots.map((s) => s.id !== slotId ? s : { ...s, current_stock: clamped, fill_pct: Math.round((clamped / maxStock) * 100) }),
    })));
  };

  const updatePrices = async (slotId: string, wholesale: number | null, selling: number | null) => {
    await supabase.from("slots").update({ wholesale_price: wholesale, selling_price: selling }).eq("id", slotId);
    setMachines((prev) => prev.map((m) => ({
      ...m,
      slots: m.slots.map((s) => s.id !== slotId ? s : { ...s, wholesale_price: wholesale, selling_price: selling }),
    })));
  };

  const [dealForm, setDealForm] = useState({ store_name: "", product_name: "", deal_price: "", regular_price: "", valid_until: "", distance_km: "" });
  const addDeal = async () => {
    if (!userId || !dealForm.store_name || !dealForm.product_name || !dealForm.deal_price || !dealForm.valid_until) return;
    const { data, error } = await supabase.from("deals").insert({
      owner_id: userId,
      store_name: dealForm.store_name,
      product_name: dealForm.product_name,
      deal_price: parseFloat(dealForm.deal_price),
      regular_price: dealForm.regular_price ? parseFloat(dealForm.regular_price) : null,
      valid_until: dealForm.valid_until,
      distance_km: dealForm.distance_km ? parseFloat(dealForm.distance_km) : null,
    }).select().single();
    if (!error && data) {
      setDeals((prev) => [...prev, data as Deal].sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999)));
      setDealForm({ store_name: "", product_name: "", deal_price: "", regular_price: "", valid_until: "", distance_km: "" });
      setShowDealForm(false);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loading) {
    return <div style={{ background: T.bg, minHeight: "100dvh", color: T.textLo }} className="flex items-center justify-center text-sm">Lädt…</div>;
  }

  const criticalMachines = machines.filter((m) => machineFill(m) < 20);
  const criticalSlots = machines.flatMap((m) => m.slots.filter((s) => s.fill_pct < 45).map((s) => ({ ...s, machineName: m.name })));

  const findDeal = (productName: string) =>
    deals.find((d) => d.product_name.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(d.product_name.toLowerCase()));

  const shoppingGroups: Record<string, { productName: string; qty: number; price: number; store: string }[]> = {};
  let totalSavings = 0;
  criticalSlots.forEach((s) => {
    const match = findDeal(s.product_name);
    const qty = s.max_stock - s.current_stock;
    const store = match ? match.store_name : "Kein Deal gefunden";
    shoppingGroups[store] ??= [];
    shoppingGroups[store].push({ productName: s.product_name, qty, price: match ? match.deal_price : 0, store });
    if (match && match.regular_price) totalSavings += (match.regular_price - match.deal_price) * qty;
  });

  const priceableSlots = machines.flatMap((m) => m.slots.filter((s) => s.wholesale_price != null && s.selling_price != null));
  const machineMargins = machines.map((m) => {
    const priced = m.slots.filter((s) => s.wholesale_price != null && s.selling_price != null);
    if (priced.length === 0) return { name: m.name, marginPct: null as number | null };
    const avg = priced.reduce((a, s) => a + ((s.selling_price! - s.wholesale_price!) / s.selling_price!) * 100, 0) / priced.length;
    return { name: m.name, marginPct: Math.round(avg * 10) / 10 };
  });
  const overallMargin = machineMargins.filter((m) => m.marginPct != null);
  const avgMargin = overallMargin.length ? (overallMargin.reduce((a, m) => a + (m.marginPct ?? 0), 0) / overallMargin.length).toFixed(1) : null;

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full flex-col font-sans sm:flex-row" style={{ background: T.bg, color: T.textHi }}>
      <nav className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r py-4 sm:flex" style={{ borderColor: T.border, background: T.surface }}>
        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md font-mono text-xs font-bold" style={{ background: `${T.amber}26`, color: T.amber }}>SV</div>
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => setActiveView(item.id)} title={item.label}
            className="flex w-12 flex-col items-center gap-1 rounded-md py-2 transition-colors"
            style={activeView === item.id ? { background: `${T.amber}26`, color: T.amber } : { color: T.textLo }}>
            <item.icon size={17} />
            <span className="text-[9px] leading-none">{item.label.split(" ")[0]}</span>
          </button>
        ))}
        <button onClick={logout} title="Logout" className="mt-auto flex w-12 flex-col items-center gap-1 rounded-md py-2" style={{ color: T.textLo }}>
          <LogOut size={17} />
          <span className="text-[9px] leading-none">Logout</span>
        </button>
      </nav>

      <div className="flex-1 p-4 pb-28 sm:p-8 sm:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: T.amber }}>SmartVend · Pilot</div>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{NAV_ITEMS.find((n) => n.id === activeView)?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} title="Theme wechseln" className="rounded-md border p-2" style={{ borderColor: T.border, color: T.textLo }}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={load} title="Neu laden" className="rounded-md border p-2" style={{ borderColor: T.border, color: T.textLo }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {activeView === "today" && (
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
                  {m.slots.filter((s) => s.fill_pct < 45).map((s) => (
                    <button key={s.id} onClick={() => updateStock(s.id, s.max_stock, s.max_stock)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs"
                      style={{ background: T.raised }}>
                      <span className="flex items-center gap-2">
                        {s.current_stock === s.max_stock ? <CheckCircle2 size={15} style={{ color: T.green }} /> : <Circle size={15} style={{ color: T.border }} />}
                        {s.slot_code} · {s.product_name}
                      </span>
                      <span className="font-mono" style={{ color: fillTone(s.fill_pct, T) }}>{s.fill_pct}% → Tippen zum Auffüllen</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === "machines" && (
          <div>
            <div className="mb-3 flex justify-end">
              <button onClick={() => setShowMachineForm((v) => !v)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs" style={{ background: T.raised, color: T.textHi }}>
                <Plus size={13} /> Automat hinzufügen
              </button>
            </div>
            {showMachineForm && (
              <div className="mb-4 max-w-md rounded-lg border p-3.5" style={{ borderColor: T.border, background: T.surface }}>
                <div className="space-y-2">
                  <input placeholder="Name (z.B. Automat Bahnhof)" value={machineForm.name} onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                    className="w-full rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  <input placeholder="Standort (z.B. Immenstadt, Hauptstr. 4)" value={machineForm.location} onChange={(e) => setMachineForm({ ...machineForm, location: e.target.value })}
                    className="w-full rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                </div>
                <button onClick={addMachine} className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: T.amber, color: theme === "dark" ? T.bg : "#fff" }}>Speichern</button>
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
                    <span className="font-mono text-lg font-semibold" style={{ color: m.slots.length ? fillTone(avgFill, T) : T.textLo }}>{m.slots.length ? `${avgFill}%` : "—"}</span>
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
                    {m.slots.map((s) => (
                      <div key={s.id} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Package size={12} style={{ color: T.textLo }} />{s.slot_code} · {s.product_name}</span>
                          <span className="flex items-center gap-1.5">
                            <input type="number" defaultValue={s.current_stock} min={0} max={s.max_stock}
                              onBlur={(e) => updateStock(s.id, parseInt(e.target.value || "0", 10), s.max_stock)}
                              style={{ background: T.bg, borderColor: T.border, color: T.textHi }}
                              className="w-12 rounded border px-1.5 py-0.5 text-right font-mono text-xs" />
                            <span style={{ color: T.textLo }} className="font-mono">/ {s.max_stock}</span>
                          </span>
                        </div>
                        {expanded && (
                          <div className="mt-1 flex items-center gap-2 pl-5">
                            <span style={{ color: T.textLo }}>EK</span>
                            <input type="number" step="0.01" defaultValue={s.wholesale_price ?? ""}
                              onBlur={(e) => updatePrices(s.id, e.target.value ? parseFloat(e.target.value) : null, s.selling_price)}
                              style={{ background: T.bg, borderColor: T.border, color: T.textHi }}
                              className="w-16 rounded border px-1.5 py-0.5 text-right font-mono text-[11px]" />
                            <span style={{ color: T.textLo }}>VK</span>
                            <input type="number" step="0.01" defaultValue={s.selling_price ?? ""}
                              onBlur={(e) => updatePrices(s.id, s.wholesale_price, e.target.value ? parseFloat(e.target.value) : null)}
                              style={{ background: T.bg, borderColor: T.border, color: T.textHi }}
                              className="w-16 rounded border px-1.5 py-0.5 text-right font-mono text-[11px]" />
                          </div>
                        )}
                      </div>
                    ))}
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
                        <button onClick={() => addSlot(m.id)} className="ml-auto rounded-md px-2.5 py-1 text-[11px] font-medium" style={{ background: T.amber, color: theme === "dark" ? T.bg : "#fff" }}>Speichern</button>
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
        )}

        {activeView === "deals" && (
          <div className="max-w-2xl rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
            <button onClick={() => setShowDealForm((v) => !v)} className="mb-3 flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ color: T.textLo }}>
              <Plus size={13} /> Deal eintragen
            </button>
            {showDealForm && (
              <div className="mb-3 rounded-lg border p-3.5" style={{ borderColor: T.border, background: T.raised }}>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Produkt" value={dealForm.product_name} onChange={(e) => setDealForm({ ...dealForm, product_name: e.target.value })}
                    className="rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  <input placeholder="Geschäft" value={dealForm.store_name} onChange={(e) => setDealForm({ ...dealForm, store_name: e.target.value })}
                    className="rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  <input placeholder="Deal-Preis (€)" value={dealForm.deal_price} onChange={(e) => setDealForm({ ...dealForm, deal_price: e.target.value })}
                    className="rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  <input placeholder="Regulärpreis (€)" value={dealForm.regular_price} onChange={(e) => setDealForm({ ...dealForm, regular_price: e.target.value })}
                    className="rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  <input type="date" value={dealForm.valid_until} onChange={(e) => setDealForm({ ...dealForm, valid_until: e.target.value })}
                    className="rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                  <input placeholder="Entfernung (km)" value={dealForm.distance_km} onChange={(e) => setDealForm({ ...dealForm, distance_km: e.target.value })}
                    className="rounded-md border px-2.5 py-1.5 text-xs" style={{ background: T.bg, borderColor: T.border, color: T.textHi }} />
                </div>
                <button onClick={addDeal} className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: T.amber, color: theme === "dark" ? T.bg : "#fff" }}>Speichern</button>
              </div>
            )}
            {deals.length === 0 && <p className="text-xs" style={{ color: T.textLo }}>Noch keine Deals eingetragen.</p>}
            {deals.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b py-3 last:border-0" style={{ borderColor: T.border }}>
                <div>
                  <div className="text-sm font-medium">{d.product_name}</div>
                  <div className="text-xs" style={{ color: T.textLo }}>{d.store_name}{d.distance_km != null ? ` · ${d.distance_km} km` : ""} · bis {d.valid_until}</div>
                </div>
                <div className="font-mono text-sm font-semibold">{d.deal_price.toFixed(2)} €</div>
              </div>
            ))}
          </div>
        )}

        {activeView === "shopping" && (
          <div className="max-w-2xl rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
            {Object.keys(shoppingGroups).length === 0 && (
              <p className="text-xs" style={{ color: T.textLo }}>Keine kritischen Slots — nichts einzukaufen.</p>
            )}
            {Object.entries(shoppingGroups).map(([store, items]) => (
              <div key={store} className="mb-4">
                <div className="mb-1.5 text-xs font-medium">{store}</div>
                {items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between pl-3 text-xs" style={{ color: T.textLo }}>
                    <span>{it.qty}× {it.productName}</span>
                    <span className="font-mono">{it.price > 0 ? `${(it.price * it.qty).toFixed(2)} €` : "kein Preis"}</span>
                  </div>
                ))}
              </div>
            ))}
            {totalSavings > 0 && (
              <p className="mt-2 text-[11px] font-medium" style={{ color: T.green }}>Geschätzte Ersparnis ggü. Regulärpreis: {totalSavings.toFixed(2)} €</p>
            )}
            <p className="mt-1 text-[11px]" style={{ color: T.textLo }}>Automatisch aus kritischen Automaten + Deal-Radar zusammengestellt.</p>
          </div>
        )}

        {activeView === "margins" && (
          <div className="rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
            {priceableSlots.length === 0 ? (
              <p className="text-xs" style={{ color: T.textLo }}>
                Noch keine Preise hinterlegt. Geh zu <b>Automaten</b> → <b>Preise bearbeiten</b>, um EK-/VK-Preise einzutragen — dann erscheint hier die Marge.
              </p>
            ) : (
              <div className="space-y-2">
                {machineMargins.map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs">{m.name}</span>
                    <div className="h-4 flex-1 rounded" style={{ background: T.raised }}>
                      {m.marginPct != null && (
                        <div className="h-4 rounded" style={{ width: `${Math.min(m.marginPct, 100)}%`, background: m.marginPct >= 40 ? T.green : T.amber }} />
                      )}
                    </div>
                    <span className="w-14 shrink-0 text-right font-mono text-xs">{m.marginPct != null ? `${m.marginPct}%` : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t pt-2 sm:hidden"
        style={{ borderColor: T.border, background: T.surface, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => setActiveView(item.id)} className="flex flex-col items-center gap-0.5 px-2 py-1"
            style={{ color: activeView === item.id ? T.amber : T.textLo }}>
            <item.icon size={19} />
            <span className="text-[9px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}