"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const C = {
  bg: "#10141B", surface: "#181E27", border: "#2C3542",
  textHi: "#EDEFF2", textLo: "#8D97A7", amber: "#E8A33D",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(
        error.message.includes("Invalid login credentials")
          ? "E-Mail oder Passwort stimmt nicht."
          : error.message
      );
      return;
    }
    router.push("/dashboard");
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForgotSent(true);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100dvh" }} className="flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg font-mono text-sm font-bold" style={{ background: `${C.amber}26`, color: C.amber }}>
            SV
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.amber }}>
            SmartVend · Pilot
          </div>
          <h1 style={{ color: C.textHi }} className="mt-1 text-xl font-semibold">
            {showForgot ? "Passwort zurücksetzen" : "Anmelden"}
          </h1>
        </div>

        <div style={{ background: C.surface, borderColor: C.border }} className="rounded-lg border p-6">
          {showForgot ? (
            forgotSent ? (
              <div className="text-center">
                <div style={{ color: C.textHi }} className="mb-1 text-sm font-medium">Link ist unterwegs</div>
                <p style={{ color: C.textLo }} className="text-xs">
                  Check dein Postfach (<span style={{ color: C.textHi }}>{forgotEmail}</span>) und klick den Link, um ein neues Passwort zu setzen.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); }}
                  style={{ color: C.textLo }}
                  className="mt-4 text-xs underline"
                >
                  Zurück zum Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3">
                <p style={{ color: C.textLo }} className="text-xs">
                  Trag deine E-Mail-Adresse ein, wir schicken dir einen Link zum Zurücksetzen.
                </p>
                <input
                  type="email"
                  placeholder="du@firma.de"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ background: C.bg, borderColor: C.border, color: C.textHi }}
                  className="w-full rounded-md border px-3 py-2.5 text-sm outline-none placeholder:text-[#5B6572] focus:border-[#E8A33D]"
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{ background: C.amber, color: C.bg }}
                  className="w-full rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {forgotLoading ? "Sende Link…" : "Link senden"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  style={{ color: C.textLo }}
                  className="w-full text-center text-xs underline"
                >
                  Zurück zum Login
                </button>
                {error && <p style={{ color: "#D9534F" }} className="text-xs">{error}</p>}
              </form>
            )
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
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label style={{ color: C.textLo }} className="text-xs">Passwort</label>
                  <button type="button" onClick={() => setShowForgot(true)} style={{ color: C.amber }} className="text-xs underline">
                    Passwort vergessen?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ background: C.bg, borderColor: C.border, color: C.textHi }}
                  className="w-full rounded-md border px-3 py-2.5 text-sm outline-none placeholder:text-[#5B6572] focus:border-[#E8A33D]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ background: C.amber, color: C.bg }}
                className="w-full rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Meldet an…" : "Anmelden"}
              </button>
              {error && <p style={{ color: "#D9534F" }} className="text-xs">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}