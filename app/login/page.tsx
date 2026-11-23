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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-bold">S</div>
          <span className="font-semibold">Serpa</span>
        </div>
        <div className="relative mt-auto max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Encontre clientes, organize contatos e feche mais serviços.</h2>
          <p className="text-zinc-400">Busca no mapa, captura pelo Instagram, funil de vendas e propostas em um lugar só.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
          <div className="space-y-1">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white lg:hidden">S</div>
            <h1 className="text-2xl font-semibold tracking-tight">{criar ? "Criar conta" : "Entrar"}</h1>
            <p className="text-sm text-zinc-500">{criar ? "Cadastre seu e-mail e uma senha." : "Bem-vindo de volta ao seu CRM."}</p>
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" autoComplete={criar ? "new-password" : "current-password"} minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <button className="btn w-full !py-2.5" disabled={carregando}>{carregando ? "Aguarde..." : criar ? "Criar conta" : "Entrar"}</button>
          {msg && <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{msg}</p>}
          <p className="text-center text-sm text-zinc-500">
            {criar ? "Já tem conta? " : "Primeiro acesso? "}
            <button type="button" className="font-medium text-indigo-600 hover:text-indigo-700" onClick={() => setCriar(!criar)}>
              {criar ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
