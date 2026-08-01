"use client";
import { Theme } from "@/lib/types";

type ShoppingItem = { productName: string; qty: number; price: number; store: string };

export default function ShoppingView({
  shoppingGroups, totalSavings, T,
}: {
  shoppingGroups: Record<string, ShoppingItem[]>;
  totalSavings: number;
  T: Theme;
}) {
  return (
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
  );
}
