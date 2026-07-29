"use client";
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  if (sent) return <p style={{ padding: 24 }}>Check dein E-Mail-Postfach für den Login-Link.</p>;

  return (
    <div style={{ padding: 24 }}>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8, marginRight: 8 }}
        />
        <button type="submit">Login-Link senden</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}