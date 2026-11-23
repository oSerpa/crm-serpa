"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Perfil } from "@/lib/types";

const vazio: Perfil = { nome: "", whatsapp: "", email: "", cidade: "", chave_pix: "", rodape: "" };

export default function MeusDados() {
  const [f, setF] = useState<Perfil>(vazio);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("perfil").select("*").maybeSingle().then(({ data, error }) => {
      if (error) setMsg("Rode o arquivo supabase/migrations/002_propostas.sql no Supabase para ativar esta tela.");
      if (data) setF({ ...vazio, ...data });
    });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("perfil").upsert({ user_id: u.user?.id, ...f });
    setMsg(error ? error.message : "Salvo. Esses dados aparecem nas suas propostas.");
  }

  const campo = (k: keyof Perfil, label: string) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </div>
  );

  return (
    <form onSubmit={salvar} className="card max-w-xl space-y-3">
      <h1 className="text-lg font-bold">Meus dados</h1>
      <p className="text-xs text-slate-500">Aparecem no cabeçalho e no rodapé das propostas.</p>
      {campo("nome", "Seu nome ou marca")}
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("whatsapp", "WhatsApp")}
        {campo("email", "E-mail")}
        {campo("cidade", "Cidade")}
        {campo("chave_pix", "Chave Pix")}
      </div>
      <div>
        <label className="label">Rodapé da proposta</label>
        <textarea className="input" rows={3} placeholder="Ex: Obrigado pela confiança! Instagram @seuperfil" value={f.rodape ?? ""} onChange={(e) => setF({ ...f, rodape: e.target.value })} />
      </div>
      <button className="btn">Salvar</button>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </form>
  );
}
