"use client";
import { Theme } from "@/lib/types";

type MachineMargin = { name: string; marginPct: number | null };

export default function MarginsView({
  machineMargins, hasPricedSlots, T,
}: {
  machineMargins: MachineMargin[];
  hasPricedSlots: boolean;
  T: Theme;
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
      {!hasPricedSlots ? (
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
  );
}
