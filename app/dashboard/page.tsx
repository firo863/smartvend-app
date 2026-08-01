"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Sun, Moon, Package, Tag, ShoppingCart, BarChart3, RefreshCw, LogOut } from "lucide-react";
import { DARK, LIGHT, Slot, Machine, Deal, machineFill, friendlyError } from "@/lib/types";
import Toast, { ToastState } from "@/components/Toast";
import TodayView from "@/components/TodayView";
import MachinesView from "@/components/MachinesView";
import DealsView from "@/components/DealsView";
import ShoppingView from "@/components/ShoppingView";
import MarginsView from "@/components/MarginsView";

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
  const [dealForm, setDealForm] = useState({ store_name: "", product_name: "", deal_price: "", regular_price: "", valid_until: "", distance_km: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    const stored = localStorage.getItem("smartvend-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("smartvend-theme", next);
  };

  // Zentrale Fehlerbehandlung: bei abgelaufener Session automatisch zu /login,
  // sonst sichtbare Fehlermeldung statt stillem Fehlschlag.
  const handleError = (error: { message?: string; code?: string } | null) => {
    const msg = friendlyError(error);
    if (msg.includes("Sitzung abgelaufen")) {
      showToast(msg, "error");
      setTimeout(() => router.push("/login"), 1200);
      return;
    }
    showToast(msg, "error");
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push("/login"); return; }
      setUserId(user.id);

      const [{ data: machinesData, error: mErr }, { data: dealsData, error: dErr }] = await Promise.all([
        supabase.from("machines").select(
          "id, name, location, status, slots(id, slot_code, product_name, current_stock, max_stock, fill_pct, wholesale_price, selling_price)"
        ),
        supabase.from("deals").select("id, store_name, product_name, deal_price, regular_price, valid_until, distance_km")
          .gte("valid_until", new Date().toISOString().slice(0, 10))
          .order("distance_km", { ascending: true, nullsFirst: false }),
      ]);

      if (mErr) { handleError(mErr); return; }
      if (dErr) { handleError(dErr); return; }
      if (machinesData) setMachines(machinesData as Machine[]);
      if (dealsData) setDeals(dealsData as Deal[]);
    } catch (e: any) {
      handleError({ message: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addMachine = async () => {
    if (!userId || !machineForm.name || !machineForm.location) {
      showToast("Bitte Name und Standort ausfüllen.", "error");
      return;
    }
    const { data, error } = await supabase
      .from("machines")
      .insert({ owner_id: userId, name: machineForm.name, location: machineForm.location, status: "active" })
      .select()
      .single();
    if (error) return handleError(error);
    setMachines((prev) => [...prev, { ...(data as any), slots: [] }]);
    setMachineForm({ name: "", location: "" });
    setShowMachineForm(false);
    showToast(`"${machineForm.name}" wurde angelegt.`);
  };

  const addSlot = async (machineId: string) => {
    if (!slotForm.slot_code || !slotForm.product_name) {
      showToast("Bitte Slot-Code und Produktname ausfüllen.", "error");
      return;
    }
    const maxStock = parseInt(slotForm.max_stock || "10", 10);
    const currentStock = Math.min(parseInt(slotForm.current_stock || "0", 10), maxStock);
    const { data, error } = await supabase
      .from("slots")
      .insert({ machine_id: machineId, slot_code: slotForm.slot_code, product_name: slotForm.product_name, max_stock: maxStock, current_stock: currentStock })
      .select()
      .single();
    if (error) return handleError(error);
    setMachines((prev) => prev.map((m) => m.id !== machineId ? m : { ...m, slots: [...m.slots, data as Slot] }));
    setSlotForm({ slot_code: "", product_name: "", max_stock: "10", current_stock: "10" });
    setSlotFormFor(null);
    showToast("Slot angelegt.");
  };

  const updateStock = async (slotId: string, newStock: number, maxStock: number) => {
    const clamped = Math.max(0, Math.min(newStock, maxStock));
    setSavingId(slotId);
    const { error } = await supabase.from("slots").update({ current_stock: clamped, updated_at: new Date().toISOString() }).eq("id", slotId);
    setSavingId(null);
    if (error) return handleError(error);
    setMachines((prev) => prev.map((m) => ({
      ...m,
      slots: m.slots.map((s) => s.id !== slotId ? s : { ...s, current_stock: clamped, fill_pct: Math.round((clamped / maxStock) * 100) }),
    })));
    showToast("Bestand gespeichert.");
  };

  const updatePrices = async (slotId: string, wholesale: number | null, selling: number | null) => {
    setSavingId(slotId);
    const { error } = await supabase.from("slots").update({ wholesale_price: wholesale, selling_price: selling }).eq("id", slotId);
    setSavingId(null);
    if (error) return handleError(error);
    setMachines((prev) => prev.map((m) => ({
      ...m,
      slots: m.slots.map((s) => s.id !== slotId ? s : { ...s, wholesale_price: wholesale, selling_price: selling }),
    })));
    showToast("Preise gespeichert.");
  };

  const addDeal = async () => {
    if (!userId || !dealForm.store_name || !dealForm.product_name || !dealForm.deal_price || !dealForm.valid_until) {
      showToast("Bitte Produkt, Geschäft, Preis und Gültigkeit ausfüllen.", "error");
      return;
    }
    const { data, error } = await supabase.from("deals").insert({
      owner_id: userId,
      store_name: dealForm.store_name,
      product_name: dealForm.product_name,
      deal_price: parseFloat(dealForm.deal_price),
      regular_price: dealForm.regular_price ? parseFloat(dealForm.regular_price) : null,
      valid_until: dealForm.valid_until,
      distance_km: dealForm.distance_km ? parseFloat(dealForm.distance_km) : null,
    }).select().single();
    if (error) return handleError(error);
    setDeals((prev) => [...prev, data as Deal].sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999)));
    setDealForm({ store_name: "", product_name: "", deal_price: "", regular_price: "", valid_until: "", distance_km: "" });
    setShowDealForm(false);
    showToast("Deal gespeichert.");
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
          <TodayView
            machines={machines} criticalMachines={criticalMachines} totalSavings={totalSavings} avgMargin={avgMargin}
            alertsOpen={alertsOpen} setAlertsOpen={setAlertsOpen}
            onRestockSlot={(machineId, slotId, maxStock) => updateStock(slotId, maxStock, maxStock)}
            savingId={savingId} T={T}
          />
        )}

        {activeView === "machines" && (
          <MachinesView
            machines={machines} expandedMachine={expandedMachine} setExpandedMachine={setExpandedMachine}
            showMachineForm={showMachineForm} setShowMachineForm={setShowMachineForm}
            machineForm={machineForm} setMachineForm={setMachineForm} onAddMachine={addMachine}
            slotFormFor={slotFormFor} setSlotFormFor={setSlotFormFor}
            slotForm={slotForm} setSlotForm={setSlotForm} onAddSlot={addSlot}
            onUpdateStock={updateStock} onUpdatePrices={updatePrices}
            savingId={savingId} theme={theme} T={T}
          />
        )}

        {activeView === "deals" && (
          <DealsView
            deals={deals} showDealForm={showDealForm} setShowDealForm={setShowDealForm}
            dealForm={dealForm} setDealForm={setDealForm} onAddDeal={addDeal} theme={theme} T={T}
          />
        )}

        {activeView === "shopping" && (
          <ShoppingView shoppingGroups={shoppingGroups} totalSavings={totalSavings} T={T} />
        )}

        {activeView === "margins" && (
          <MarginsView machineMargins={machineMargins} hasPricedSlots={priceableSlots.length > 0} T={T} />
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

      <Toast toast={toast} T={T} />
    </div>
  );
}
