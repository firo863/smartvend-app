"use client";
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

const C = {
  bg: "#10141B", surface: "#181E27", border: "#2C3542",
  textHi: "#EDEFF2", textLo: "#8D97A7", amber: "#E8A33D",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    localStorage.setItem("smartvend-remember", remember ? "true" : "false");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100dvh" }} className="flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg font-mono text-sm font-bold"
            style={{ background: `${C.amber}26`, color: C.amber }}
          >
            SV
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.amber }}>
            SmartVend · Pilot
          </div>
          <h1 style={{ color: C.textHi }} className="mt-1 text-xl font-semibold">
            Anmelden
          </h1>
        </div>

        <div style={{ background: C.surface, borderColor: C.border }} className="rounded-lg border p-6">
          {sent ? (
            <div className="text-center">
              <div style={{ color: C.textHi }} className="mb-1 text-sm font-medium">Link ist unterwegs</div>
              <p style={{ color: C.textLo }} className="text-xs">
                Check dein E-Mail-Postfach (<span style={{ color: C.textHi }}>{email}</span>) und klick den Login-Link.
              </p>
              <button onClick={() => setSent(false)} style={{ color: C.textLo }} className="mt-4 text-xs underline">
                Andere E-Mail-Adresse verwenden
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label style={{ color: C.textLo }} className="mb-1.5 block text-xs">E-Mail-Adresse</label>
                <input
                  type="email"
                  placeholder="du@firma.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ background: C.bg, borderColor: C.border, color: C.textHi }}
                  className="w-full rounded-md border px-3 py-2.5 text-sm outline-none placeholder:text-[#5B6572] focus:border-[#E8A33D]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs" style={{ color: C.textLo }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: C.amber }}
                />
                Angemeldet bleiben
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{ background: C.amber, color: C.bg }}
                className="w-full rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Sende Link…" : "Login-Link senden"}
              </button>
              {error && (
                <p style={{ color: "#D9534F" }} className="text-xs">
                  {error.includes("rate limit") ? "Zu viele Versuche — kurz warten und nochmal probieren." : error}
                </p>
              )}
            </form>
          )}
        </div>

        <p style={{ color: C.textLo }} className="mt-4 text-center text-[11px]">
          Kein Passwort nötig — wir schicken dir einen einmaligen Anmelde-Link per E-Mail.
        </p>
      </div>
    </div>
  );
}