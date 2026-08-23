"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const C = {
  bg: "#10141B", surface: "#181E27", border: "#2C3542",
  textHi: "#EDEFF2", textLo: "#8D97A7", amber: "#E8A33D",
};

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Der Klick auf den Mail-Link setzt automatisch eine kurzlebige Session.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100dvh" }} className="flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg font-mono text-sm font-bold" style={{ background: `${C.amber}26`, color: C.amber }}>
            SV
          </div>
          <h1 style={{ color: C.textHi }} className="mt-1 text-xl font-semibold">Neues Passwort</h1>
        </div>

        <div style={{ background: C.surface, borderColor: C.border }} className="rounded-lg border p-6">
          {!ready ? (
            <p style={{ color: C.textLo }} className="text-center text-xs">
              Link wird geprüft… Falls hier nichts passiert, ist der Link abgelaufen — neuen über "Passwort vergessen" auf der Login-Seite anfordern.
            </p>
          ) : done ? (
            <p style={{ color: C.textHi }} className="text-center text-sm">Passwort gespeichert. Du wirst weitergeleitet…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label style={{ color: C.textLo }} className="mb-1.5 block text-xs">Neues Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ background: C.bg, borderColor: C.border, color: C.textHi }}
                  className="w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D]"
                />
              </div>
              <div>
                <label style={{ color: C.textLo }} className="mb-1.5 block text-xs">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ background: C.bg, borderColor: C.border, color: C.textHi }}
                  className="w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ background: C.amber, color: C.bg }}
                className="w-full rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Speichert…" : "Passwort speichern"}
              </button>
              {error && <p style={{ color: "#D9534F" }} className="text-xs">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}