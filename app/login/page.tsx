"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [criar, setCriar] = useState(false);
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setMsg("");
    const { error } = criar
      ? await supabase.auth.signUp({ email, password: senha })
      : await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) setMsg(error.message);
    else if (criar) setMsg("Conta criada. Se o Supabase pedir confirmação, abra o link no seu e-mail e depois entre.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={enviar} className="card w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold text-indigo-600">CRM Serpa</h1>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={carregando}>{criar ? "Criar conta" : "Entrar"}</button>
        <button type="button" className="w-full text-xs text-slate-500" onClick={() => setCriar(!criar)}>
          {criar ? "Já tenho conta" : "Primeiro acesso? Criar conta"}
        </button>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </form>
    </div>
  );
}
