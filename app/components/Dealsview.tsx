"use client";
import { Plus } from "lucide-react";
import { Deal, Theme } from "@/lib/types";

type DealForm = { store_name: string; product_name: string; deal_price: string; regular_price: string; valid_until: string; distance_km: string };

export default function DealsView({
  deals, showDealForm, setShowDealForm, dealForm, setDealForm, onAddDeal, theme, T,
}: {
  deals: Deal[];
  showDealForm: boolean;
  setShowDealForm: (v: boolean) => void;
  dealForm: DealForm;
  setDealForm: (v: DealForm) => void;
  onAddDeal: () => void;
  theme: "dark" | "light";
  T: Theme;
}) {
  return (
    <div className="max-w-2xl rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
      <button onClick={() => setShowDealForm(!showDealForm)} className="mb-3 flex items-center gap-1 rounded-md px-2 py-1 text-xs" style={{ color: T.textLo }}>
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
          <button onClick={onAddDeal} className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: T.amber, color: theme === "dark" ? T.bg : "#fff" }}>Speichern</button>
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
  );
}
